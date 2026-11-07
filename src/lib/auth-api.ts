import { db, isBackendConfigured, type DbRow } from "./supabaseClient";

// ============================================================
// Auth & Profiles
//
// This mirrors the style of api.ts (typed row-mapper + one function
// per concern) but talks to Supabase Auth instead of a plain table,
// so it lives in its own file rather than being bolted onto api.ts.
// ============================================================

export type StaffRole = "manager" | "admin" | "developer";
export type ProfileRole = "customer" | StaffRole;

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: ProfileRole;
};

function mapProfile(row: DbRow): Profile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    role: row.role as ProfileRole,
  };
}

/** Fetches the profile row for the currently signed-in user. Returns null if signed out. */
export async function fetchMyProfile(): Promise<Profile | null> {
  // No backend → nobody can be signed in. Never fabricate a session.
  if (!isBackendConfigured) return null;
  const { data: sessionData } = await db().auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return null;

  const { data, error } = await db().from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return mapProfile(data);
}

/**
 * Updates the signed-in customer's own name and phone. Email and role are
 * deliberately not editable here: changing email goes through Supabase Auth's
 * own confirmation flow, and role changes are staff-only (see updateProfileRole).
 */
export async function updateMyProfile(input: { name: string; phone: string }): Promise<Profile> {
  const { data: sessionData } = await db().auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error("PC: Please sign in to update your profile.");

  const { data, error } = await db()
    .from("profiles")
    .update({ name: input.name.trim(), phone: input.phone.trim() })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return mapProfile(data);
}

/** Signs in with email + password. Throws on invalid credentials. */
export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await db().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export type NewCustomerInput = { email: string; password: string; name: string; phone: string };

/**
 * Signs up a new customer account. A `profiles` row (role='customer') is
 * created automatically by the `handle_new_user` DB trigger — see
 * schema-phase3-auth.sql.
 *
 * Returns `needsEmailConfirm: true` if Supabase's "Confirm email" setting
 * is on (Authentication -> Providers -> Email in the Supabase dashboard),
 * in which case there is no session yet and the user must click the link
 * emailed to them before they can sign in.
 */
export async function signUpCustomer(
  input: NewCustomerInput,
): Promise<{ needsEmailConfirm: boolean }> {
  const { data, error } = await db().auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { name: input.name, phone: input.phone } },
  });
  if (error) throw error;
  return { needsEmailConfirm: !data.session };
}

export async function signOutUser(): Promise<void> {
  const { error } = await db().auth.signOut();
  if (error) throw error;
}

/** Where to send someone right after they sign in, based on their role. */
export function landingRouteForRole(role: ProfileRole): "/admin" | "/" {
  return role === "admin" || role === "manager" || role === "developer" ? "/admin" : "/";
}

// ============================================================
// Staff management (admin.developer.tsx, admin.users.tsx)
//
// There is no "invite" here — creating a brand-new login would need
// Supabase's service-role key, which must never sit in frontend code.
// Instead: the person signs up normally at /register (gets role
// 'customer' automatically), then an admin/developer looks them up by
// the email they registered with and promotes them. See
// schema-phase5-staff-roles.sql for the RLS that allows this.
// ============================================================

/** Every profile that currently holds a staff role (not plain customers). */
export async function fetchStaffProfiles(): Promise<Profile[]> {
  const { data, error } = await db()
    .from("profiles")
    .select("*")
    .in("role", ["manager", "admin", "developer"])
    .order("email", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapProfile);
}

/** Looks up a profile by the email they registered with. Null if no account exists yet. */
export async function findProfileByEmail(email: string): Promise<Profile | null> {
  const { data, error } = await db()
    .from("profiles")
    .select("*")
    .ilike("email", email.trim())
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data) : null;
}

/** Promotes or demotes an existing account. Pass "customer" to remove staff access. */
export async function updateProfileRole(id: string, role: ProfileRole): Promise<void> {
  const { error } = await db().from("profiles").update({ role }).eq("id", id);
  if (error) throw error;
}
