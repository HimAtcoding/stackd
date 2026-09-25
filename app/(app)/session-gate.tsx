"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { hasSession, signedOutRoute, subscribeNoop } from "@/lib/session";

// Without a session: Welcome if it hasn't been seen, otherwise Sign in. Renders nothing while checking.
export function SessionGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const signedIn = useSyncExternalStore(subscribeNoop, hasSession, () => null);

  useEffect(() => {
    if (signedIn === false) router.replace(signedOutRoute());
  }, [signedIn, router]);

  return signedIn ? children : null;
}
