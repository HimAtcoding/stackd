"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TextField } from "@/components/ui/text-field";

type ReviewSheetProps = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onCreate: (reviewer: string) => void;
  onClose: () => void;
};

// "Ask someone to review" (19 → Student side): an optional name for who's reviewing, then Create link
export function ReviewSheet({ open, busy, error, onCreate, onClose }: ReviewSheetProps) {
  const [name, setName] = useState("");
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="review-title" locked={busy}>
      <h2 id="review-title" tabIndex={-1} className="text-navy-900 type-title-2 focus:outline-none">
        Ask someone to review
      </h2>
      <p className="mt-2 text-slate-600 type-body">
        Send a private link to a counselor, teacher or friend. They can read this answer and leave comments. No account needed.
      </p>
      <TextField
        id="reviewer-name"
        label="Who's reviewing? (optional)"
        className="mt-6"
        value={name}
        maxLength={60}
        autoComplete="off"
        autoCapitalize="words"
        placeholder="Ms. Lee"
        onChange={(e) => setName(e.target.value)}
        error={error ?? undefined}
      />
      <PrimaryButton onClick={() => onCreate(name)} loading={busy} chevron={false} className="mt-6">
        Create link
      </PrimaryButton>
      <p className="mt-3 text-center text-slate-600 type-caption">
        They&apos;ll see this version. You can turn the link off any time; it ends after 14 days.
      </p>
    </BottomSheet>
  );
}
