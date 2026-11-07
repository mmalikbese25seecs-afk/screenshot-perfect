import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Frontend/backend boundary.
 *
 * The app runs with NO backend during the frontend-completion phase. The
 * Supabase client is only created when both VITE_SUPABASE_URL and
 * VITE_SUPABASE_ANON_KEY are present. Without them, every data-access call
 * in lib/api.ts and lib/auth-api.ts goes through `db()`, which throws a
 * typed `BackendNotConfiguredError` instead of talking to a fake database.
 * UI code detects that error with `isBackendNotConfigured()` and renders the
 * shared <BackendNotice /> instead of a generic failure.
 */

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const supabaseAnonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

export const isBackendConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const BACKEND_NOT_CONNECTED_MESSAGE =
  "Backend is not connected. This screen is currently in frontend preview mode. No information is being saved.";

export class BackendNotConfiguredError extends Error {
  readonly code = "BACKEND_NOT_CONFIGURED" as const;
  constructor(message = BACKEND_NOT_CONNECTED_MESSAGE) {
    super(message);
    this.name = "BackendNotConfiguredError";
  }
}

export function isBackendNotConfigured(err: unknown): err is BackendNotConfiguredError {
  return (
    err instanceof BackendNotConfiguredError ||
    (typeof err === "object" &&
      err !== null &&
      (err as { code?: unknown }).code === "BACKEND_NOT_CONFIGURED")
  );
}

let client: SupabaseClient | null = null;

/** Returns the Supabase client, or throws BackendNotConfiguredError when no backend is set up. */
export function db(): SupabaseClient {
  if (!isBackendConfigured) throw new BackendNotConfiguredError();
  if (!client) client = createClient(supabaseUrl as string, supabaseAnonKey as string);
  return client;
}

/** Fails fast for operations whose backend implementation does not exist yet. */
export function requireBackend(): never | void {
  if (!isBackendConfigured) throw new BackendNotConfiguredError();
}

/**
 * Shape of an untyped database row. The backend schema does not exist yet, so
 * there are no generated Supabase types; mappers in lib/api.ts convert these
 * rows into the typed domain models in lib/types.ts. Replace with generated
 * `Database` types in the backend phase.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped DB rows until generated types exist
export type DbRow = any;
