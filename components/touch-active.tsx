"use client";

import { useEffect } from "react";

// iOS Safari only applies :active when a touchstart listener exists.
export function TouchActive() {
  useEffect(() => {
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);
  return null;
}
