"use client";

import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/primary-button";
import { onboardingUrl } from "@/lib/onboarding";

// For a student with no plan yet (02 → Setup card). The one bold element on Home in that state, so it's the
// tier 1 hero there (15 → Route).
export function SetupCard() {
  const router = useRouter();
  return (
    <div className="rounded-lg bg-surface p-4 shadow-lift">
      <h2 className="text-navy-900 type-title-2">No plan yet</h2>
      <p className="mt-1 text-slate-600 type-body">Pick your college, the schools you want, and your major. It takes about a minute.</p>
      <PrimaryButton className="mt-4" onClick={() => router.push(onboardingUrl("college", { from: "home" }))}>
        Set up your plan
      </PrimaryButton>
    </div>
  );
}
