import { DEMO_MODE } from "./flags";

export type OnboardingStep = "college" | "schools" | "major";
// Where the student came from, which decides Back and Skip on step 1 (docs/plans/steps-11-13.md).
// It rides in the URL so it survives a reload.
export type OnboardingFrom = "signup" | "home" | "settings";

// /onboarding/?step=…&from=…, or &edit=1 for a Settings edit of one answer (10 → Editing from Settings)
export function onboardingUrl(step: OnboardingStep, mode: { from: OnboardingFrom } | { edit: true }) {
  const params = new URLSearchParams({ step });
  if ("edit" in mode) params.set("edit", "1");
  else params.set("from", mode.from);
  return `/onboarding/?${params}`;
}

// A new account goes to onboarding. Demo mode has no accounts to save a plan to, so it goes straight to Home.
export const AFTER_SIGN_UP = DEMO_MODE ? "/" : onboardingUrl("college", { from: "signup" });
