"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PrimaryButton } from "@/components/ui/primary-button";
import { hasSeenWelcome, hasSession, markWelcomeSeen } from "@/lib/session";

// Welcome shows once. Later visits go to Home or Sign in. If storage fails, it shows again.
export function WelcomeRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (hasSeenWelcome()) router.replace(hasSession() ? "/" : "/sign-in");
  }, [router]);
  return null;
}

export function GetStarted() {
  const router = useRouter();
  return (
    <PrimaryButton
      onClick={() => {
        markWelcomeSeen();
        router.push("/sign-up", { transitionTypes: ["crossfade"] });
      }}
    >
      Get started
    </PrimaryButton>
  );
}
