"use client";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { PrimaryButton } from "@/components/ui/primary-button";

type TurnOnConfirmProps = {
  open: boolean;
  onTurnOn: () => void;
  // "Not now", Escape or the scrim: reminders stay off; the date's choice is kept for when they're turned on
  onClose: () => void;
};

// Reminders are off in Settings and the student picked one in a date sheet: asked before they go on for every date
export function TurnOnConfirm({ open, onTurnOn, onClose }: TurnOnConfirmProps) {
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="turn-on-title">
      <h2 id="turn-on-title" tabIndex={-1} className="text-navy-900 type-title-2 focus:outline-none">
        Turn on reminders?
      </h2>
      <p className="mt-2 text-slate-600 type-body">They&apos;re off in Settings. Turning them on reminds you about every date you&apos;re tracking.</p>
      <PrimaryButton onClick={onTurnOn} className="mt-6">
        Turn on
      </PrimaryButton>
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={onClose} className="-my-3 py-3 text-blue-600 type-link pressed:underline focus-ring:underline">
          Not now
        </button>
      </div>
    </BottomSheet>
  );
}
