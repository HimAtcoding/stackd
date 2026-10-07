"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FlashToast } from "@/components/flash-toast";
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
    <div className="relative">
      {/* "Account deleted", arriving from Settings (11): 12 above the button */}
      <FlashToast within bottom="calc(100% + 12px)" />
      <PrimaryButton
        onClick={() => {
          markWelcomeSeen();
          router.push("/sign-up", { transitionTypes: ["crossfade"] });
        }}
      >
        Get started
      </PrimaryButton>
    </div>
  );
}
