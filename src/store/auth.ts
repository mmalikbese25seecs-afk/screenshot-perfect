import { create } from "zustand";
import { db, isBackendConfigured } from "@/lib/supabaseClient";
import { fetchMyProfile, signOutUser, type Profile } from "@/lib/auth-api";

export type Role = "guest" | "customer" | "manager" | "admin" | "developer";

/*
 * Real Supabase Auth, wired up in Phase A of the roadmap.
 *
 * The store's *shape* (role/name/email/signOut) is kept the same as the
 * old UI-only mock on purpose, so every component that already reads
 * `useAuth()` keeps working unchanged. What changed is where the values
 * come from: `role` now reflects a `profiles` row in the real database
 * (see schema-phase3-auth.sql), guarded server-side by RLS — not
 * something the client can just set.
 *
 * Supabase itself persists the underlying session in localStorage, so
 * this store does NOT use zustand's `persist` middleware. Instead,
 * `init()` (called once from <AuthProvider>, mounted in __root.tsx)
 * restores whatever session already exists and keeps listening for
 * sign-in/out events for as long as the app is open.
 */
type AuthState = {
  role: Role;
  name: string;
  email: string;
  userId: string | null;
  /** True until the initial session check has finished. Gate any
   *  auth-sensitive UI (e.g. the /admin guard) on this being false. */
  isLoading: boolean;
  /** Call once at app startup. Returns an unsubscribe function. */
  init: () => () => void;
  signOut: () => Promise<void>;
  /** Internal — applies a freshly-fetched profile (or clears to guest). */
  _applyProfile: (profile: Profile | null) => void;
};

const guestState = { role: "guest" as Role, name: "Guest", email: "", userId: null };

export const useAuth = create<AuthState>()((set, get) => ({
  ...guestState,
  isLoading: true,

  _applyProfile: (profile) => {
    if (!profile) {
      set({ ...guestState, isLoading: false });
      return;
    }
    set({
      role: profile.role,
      name: profile.name || profile.email,
      email: profile.email,
      userId: profile.id,
      isLoading: false,
    });
  },

  init: () => {
    fetchMyProfile()
      .then((profile) => get()._applyProfile(profile))
      .catch(() => get()._applyProfile(null));

    // No backend → stay a guest. There is no session to restore or listen to.
    if (!isBackendConfigured) return () => {};

    const { data: subscription } = db().auth.onAuthStateChange(() => {
      fetchMyProfile()
        .then((profile) => get()._applyProfile(profile))
        .catch(() => get()._applyProfile(null));
    });

    return () => subscription.subscription.unsubscribe();
  },

  signOut: async () => {
    if (isBackendConfigured) await signOutUser();
    set({ ...guestState, isLoading: false });
  },
}));

export const isStaff = (role: Role) =>
  role === "admin" || role === "manager" || role === "developer";
