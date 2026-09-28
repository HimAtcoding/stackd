"use client";

import type { ReactNode } from "react";
import { LabelledDivider } from "@/components/ui/labelled-divider";
import { SocialButton } from "@/components/ui/social-button";
import type { OAuthProvider } from "@/lib/auth";

type SocialSignInProps = {
  appleLogo: ReactNode;
  googleLogo: ReactNode;
  // What's in flight: the form's own submit, a provider, or nothing.
  pending: null | "form" | OAuthProvider;
  onOAuth: (provider: OAuthProvider) => void;
};

// The "or" divider and the Apple and Google buttons. The tapped one spins; the other is disabled.
export function SocialSignIn({ appleLogo, googleLogo, pending, onOAuth }: SocialSignInProps) {
  const busy = pending !== null;
  return (
    <>
      <div className="mt-3">
        <LabelledDivider label="or" />
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <SocialButton logo={appleLogo} loading={pending === "apple"} disabled={busy && pending !== "apple"} onClick={() => onOAuth("apple")}>
          Continue with Apple
        </SocialButton>
        <SocialButton logo={googleLogo} loading={pending === "google"} disabled={busy && pending !== "google"} onClick={() => onOAuth("google")}>
          Continue with Google
        </SocialButton>
      </div>
    </>
  );
}
