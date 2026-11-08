import { useSyncExternalStore } from "react";
import type { Offer } from "./api";

/**
 * Local-only admin preview.
 *
 * Lets a developer look at staff screens while no backend exists. It is:
 * - only available in development builds (`import.meta.env.DEV`); production
 *   builds compile it to `false`;
 * - explicitly opt-in (a button on the staff sign-in screen) and stored in
 *   sessionStorage, so it ends with the tab;
 * - not authentication: it never changes `useAuth()`, creates no session and
 *   grants no backend permission. Every data call still fails with the
 *   backend-not-configured state.
 */
export const adminPreviewAvailable = import.meta.env.DEV;

const KEY = "pindi-admin-preview";
const listeners = new Set<() => void>();

function read(): boolean {
  if (!adminPreviewAvailable || typeof window === "undefined") return false;
  return window.sessionStorage.getItem(KEY) === "1";
}

export function setAdminPreview(on: boolean) {
  if (!adminPreviewAvailable || typeof window === "undefined") return;
  if (on) window.sessionStorage.setItem(KEY, "1");
  else window.sessionStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export function useAdminPreview(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => false,
  );
}

const AD_KEY = "pindi-ad-draft-preview";

export function setAdDraftPreview(ad: Offer) {
  if (!adminPreviewAvailable || typeof window === "undefined") return;
  window.sessionStorage.setItem(AD_KEY, JSON.stringify(ad));
}

export function takeAdDraftPreview(): Offer | null {
  if (!adminPreviewAvailable || typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(AD_KEY);
  window.sessionStorage.removeItem(AD_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as Offer;
  } catch {
    return null;
  }
}
