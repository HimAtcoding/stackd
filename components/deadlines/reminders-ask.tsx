"use client";

import { Art } from "@/components/art";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { PrimaryButton } from "@/components/ui/primary-button";

type RemindersAskProps = {
  open: boolean;
  // "Turn on reminders": iOS's own prompt comes next
  onAllow: () => void;
  // "Not now", Escape or the scrim
  onClose: () => void;
};

// The soft ask before iOS's permission prompt (14 → Permission flow, step 1). Shown only while iOS hasn't asked yet,
// and only after the student taps a reminder control.
export function RemindersAsk({ open, onAllow, onClose }: RemindersAskProps) {
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="reminders-ask-title">
      <div className="flex flex-col items-center text-center">
        <Art id="husky-wave" width={120} />
        <h2 id="reminders-ask-title" tabIndex={-1} className="mt-4 text-navy-900 type-title-2 focus:outline-none">
          Want a heads-up before deadlines?
        </h2>
        <p className="mt-2 max-w-[280px] text-slate-600 type-body">
          Stackd reminds you a week before and the day before each date you&apos;re tracking. You can change this anytime in Settings.
        </p>
      </div>
      <PrimaryButton onClick={onAllow} chevron={false} className="mt-6">
        Turn on reminders
      </PrimaryButton>
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={onClose} className="-my-3 py-3 text-blue-600 type-link pressed:underline focus-ring:underline">
          Not now
        </button>
      </div>
    </BottomSheet>
  );
}
