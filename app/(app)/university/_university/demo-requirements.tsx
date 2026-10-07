"use client";

import { useRouter } from "next/navigation";
import { BarricadeIcon, BellIcon } from "@phosphor-icons/react/ssr";
import { EmptyState } from "@/components/ui/empty-state";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TintedButton } from "@/components/ui/tinted-button";
import { UnofficialFooter } from "@/components/ui/unofficial-footer";
import { fillDue } from "@/lib/due";
import type { UniversitySeed } from "@/lib/seed";
import { RequirementList } from "./requirement-list";

type DemoRequirementsProps = {
  slug: string;
  university: UniversitySeed;
  // requirementId → journey step id
  journeySteps: Record<string, string>;
};

// The Requirements tab for a demo school: rows that mark done, Track application, and the reminder banner (03)
export function DemoRequirements({ slug, university, journeySteps }: DemoRequirementsProps) {
  const router = useRouter();
  const reminder = university.reminder;
  const showReminder = reminder && reminder.dueInDays >= 0 && reminder.dueInDays <= 14;

  return (
    <>
      <p className="mt-1 px-6 text-slate-600 type-body">Track your progress and see what&apos;s next.</p>

      {university.requirements.length > 0 ? (
        <RequirementList slug={slug} requirements={university.requirements} journeySteps={journeySteps} />
      ) : (
        <EmptyState
          icon={<BarricadeIcon weight="fill" size={32} />}
          title="No requirements loaded for this school"
          body="We don't have this school's requirements yet."
          action={<TintedButton href="/">Back to home</TintedButton>}
        />
      )}

      <div className="mt-4 px-4">
        <PrimaryButton onClick={() => router.push(`/track-application/?university=${slug}`)}>Track application</PrimaryButton>
      </div>

      {showReminder && (
        <div role="note" className="mx-4 mt-4 flex gap-4 rounded-md bg-amber-50 px-5 py-4">
          <BellIcon weight="fill" size={28} aria-hidden className="shrink-0 text-amber-500" />
          <div className="min-w-0">
            <p className="text-navy-900 type-headline">{reminder.title}</p>
            <p className="mt-1 text-slate-700 type-body">{fillDue(reminder.body, reminder.dueInDays)}</p>
          </div>
        </div>
      )}

      <UnofficialFooter className="mt-4 px-4" />
    </>
  );
}
