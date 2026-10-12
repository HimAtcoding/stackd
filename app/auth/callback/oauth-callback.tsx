"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Loading } from "@/components/ui/loading";
import { auth } from "@/lib/auth";
import { OAUTH_CALLBACK_PATH, OAUTH_RETURN_PATH, setReturnedOAuthError } from "@/lib/auth/oauth";
import { routeAfterOAuth } from "@/lib/onboarding";
import { hasSession } from "@/lib/session";

// Finishes an Apple or Google sign-in (06 → Web sign-in return): a brand-new account goes to onboarding, an existing
// one Home. Cancelled, failed or expired, it goes to Sign in, which shows the failed or expired message.
export function OAuthCallback() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    // The code works once, so this runs once (React's development double effect included)
    if (started.current) return;
    started.current = true;
    const href = window.location.href;
    // Keep the code out of history, so Back never replays it
    window.history.replaceState(null, "", OAUTH_CALLBACK_PATH);

    auth.finishOAuth(href).then((result) => {
      if (result.ok) return router.replace(routeAfterOAuth(result.newAccount), { transitionTypes: ["crossfade"] });
      if (result.error !== "oauth_cancelled") setReturnedOAuthError(result.provider, result.error);
      router.replace(hasSession() ? "/" : OAUTH_RETURN_PATH);
    });
  }, [router]);

  return <Loading label="Signing you in" />;
}
