import { useEffect } from "react";
import { useAuth } from "@/store/auth";

/**
 * Mounted once in __root.tsx. Restores the Supabase session on app
 * boot and keeps `useAuth()` in sync with sign-in/out events.
 * Renders nothing — it's purely a side-effect component.
 */
export function AuthProvider() {
  const init = useAuth((s) => s.init);

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
