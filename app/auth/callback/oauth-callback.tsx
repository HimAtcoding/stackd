"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Loading } from "@/components/ui/loading";
import { auth } from "@/lib/auth";
import { OAUTH_CALLBACK_PATH, originPath, setReturnedOAuthError } from "@/lib/auth/oauth";
import { routeAfterOAuth } from "@/lib/onboarding";
import { hasSession } from "@/lib/session";

// Finishes an Apple or Google sign-in: a new account or one with no plan goes to onboarding, others Home.
// Cancelling returns to the screen it started from with nothing shown; a failure shows 06's provider error there.
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

    auth.finishOAuth(href).then(async (result) => {
      if (result.ok) return router.replace(await routeAfterOAuth(), { transitionTypes: ["crossfade"] });
      if (result.provider && result.error !== "oauth_cancelled") setReturnedOAuthError(result.provider, result.error);
      router.replace(hasSession() ? "/" : originPath(result.origin));
    });
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <Loading label="Signing you in" />
    </div>
  );
}
