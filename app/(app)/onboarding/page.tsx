import { Suspense } from "react";
import { AuthScreen } from "@/components/auth/auth-screen";
import { OnboardingFlow } from "./_onboarding/onboarding-flow";

// /onboarding/?step=college, schools or major (10). The step comes from the query string, so it's read in the browser.
// The background is Sign in's (06), without the clouds.
export default function OnboardingPage() {
  return (
    <AuthScreen>
      <Suspense>
        <OnboardingFlow />
      </Suspense>
    </AuthScreen>
  );
}
