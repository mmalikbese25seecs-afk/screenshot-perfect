import { useEffect, useState } from "react";

/** True only after client hydration — safe gate for browser-only state. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
