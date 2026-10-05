"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { startProgressSync } from "@/lib/progress/sync";
import { hasSession, signedOutRoute, subscribeSession } from "@/lib/session";

// Without a session: Welcome if it hasn't been seen, otherwise Sign in. Renders nothing while checking.
export function SessionGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const signedIn = useSyncExternalStore(subscribeSession, hasSession, () => null);

  // Signed-in progress goes to the per-user tables (does nothing in demo mode)
  useEffect(() => startProgressSync(), []);

  useEffect(() => {
    if (signedIn === false) router.replace(signedOutRoute());
  }, [signedIn, router]);

  return signedIn ? children : null;
}
