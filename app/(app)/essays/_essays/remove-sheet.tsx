"use client";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { PrimaryButton } from "@/components/ui/primary-button";

type RemoveSheetProps = {
  open: boolean;
  // Kept while the sheet slides away
  name: string;
  onRemove: () => void;
  onClose: () => void;
};

// Unchoosing a question that has a draft (17 → Question row): the draft stays saved, it just stops counting
export function RemoveSheet({ open, name, onRemove, onClose }: RemoveSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="remove-title">
      <h2 id="remove-title" tabIndex={-1} className="text-navy-900 type-title-2 focus:outline-none">
        Remove {name} from your 3?
      </h2>
      <p className="mt-2 text-slate-600 type-body">Your draft stays saved.</p>
      <PrimaryButton onClick={onRemove} className="mt-6">
        Remove
      </PrimaryButton>
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={onClose} className="-my-3 py-3 text-blue-600 type-link pressed:underline focus-ring:underline">
          Keep it
        </button>
      </div>
    </BottomSheet>
  );
}
