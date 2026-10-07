"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { PrimaryButton } from "@/components/ui/primary-button";
import { onboardingUrl } from "@/lib/onboarding";

// For a student with no plan yet (02 → Setup card). The one bold element on Home in that state.
export function SetupCard() {
  const router = useRouter();
  return (
    <Card>
      <h2 className="text-navy-900 type-title-2">Set up your plan</h2>
      <p className="mt-1 text-slate-600 type-body">Pick your college, the schools you want, and your major. It takes about a minute.</p>
      <PrimaryButton className="mt-4" onClick={() => router.push(onboardingUrl("college", { from: "home" }))}>
        Set up your plan
      </PrimaryButton>
    </Card>
  );
}
