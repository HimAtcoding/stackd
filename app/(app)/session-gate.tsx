"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { takeExpiredOAuthReturn } from "@/lib/auth/oauth";
import { startProgressSync } from "@/lib/progress/sync";
import { hasSession, signedOutRoute, subscribeSession } from "@/lib/session";

// Without a session: Welcome if it hasn't been seen, otherwise Sign in. Renders nothing while checking.
// An Apple or Google sign-in that expired comes back here (Supabase's Site URL) and goes to Sign in with its message.
export function SessionGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const signedIn = useSyncExternalStore(subscribeSession, hasSession, () => null);
  // Read once: the check cleans the URL, and React's development double effect would otherwise miss it
  const expiredReturn = useRef<boolean | null>(null);

  // Signed-in progress goes to the per-user tables (does nothing in demo mode)
  useEffect(() => startProgressSync(), []);

  useEffect(() => {
    if (signedIn !== false) return;
    expiredReturn.current ??= takeExpiredOAuthReturn();
    router.replace(expiredReturn.current ? "/sign-in" : signedOutRoute());
  }, [signedIn, router]);

  return signedIn ? children : null;
}
