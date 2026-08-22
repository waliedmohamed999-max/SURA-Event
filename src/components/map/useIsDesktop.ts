"use client";

import { useSyncExternalStore } from "react";

/** True at md breakpoint (768px) and up. SSR-safe: reports false on the server. */
export function useIsDesktop(breakpointPx = 768) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(`(min-width: ${breakpointPx}px)`);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(`(min-width: ${breakpointPx}px)`).matches,
    () => false
  );
}
