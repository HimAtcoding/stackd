"use client";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { PrimaryButton } from "@/components/ui/primary-button";

type ConfirmSheetProps = {
  open: boolean;
  id: string;
  title: string;
  body: string;
  confirm: string;
  onConfirm: () => void;
  // A second choice as a text button, e.g. "Add to the end"
  alternative?: { label: string; onClick: () => void };
  cancel?: string;
  busy?: boolean;
  onClose: () => void;
};

// A question before a change (19): "Replace this draft?", "Turn off this link?"
export function ConfirmSheet({ open, id, title, body, confirm, onConfirm, alternative, cancel = "Cancel", busy, onClose }: ConfirmSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy={id} locked={busy}>
      <h2 id={id} tabIndex={-1} className="text-navy-900 type-title-2 focus:outline-none">
        {title}
      </h2>
      <p className="mt-2 text-slate-600 type-body">{body}</p>
      <PrimaryButton onClick={onConfirm} loading={busy} chevron={false} className="mt-6">
        {confirm}
      </PrimaryButton>
      {alternative && (
        <div className="mt-3 flex justify-center">
          <button type="button" onClick={alternative.onClick} className="-my-3 py-3 text-blue-600 type-link pressed:underline focus-ring:underline">
            {alternative.label}
          </button>
        </div>
      )}
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={onClose} disabled={busy} className="-my-3 py-3 text-slate-600 type-link pressed:underline focus-ring:underline">
          {cancel}
        </button>
      </div>
    </BottomSheet>
  );
}
