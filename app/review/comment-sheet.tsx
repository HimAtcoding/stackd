"use client";

import { useLayoutEffect, useRef } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TextField } from "@/components/ui/text-field";
import { cn } from "@/lib/cn";

export const COMMENT_MAX = 1000;

export type ComposerProps = {
  // The phrase being commented on, or null for the whole answer
  quote: string | null;
  body: string;
  onBody: (body: string) => void;
  // The name saved in this browser, and whether the field to type one is showing
  savedName: string;
  name: string;
  onName: (name: string) => void;
  askName: boolean;
  onChangeName: () => void;
  nameError: string | null;
  error: string | null;
  busy: boolean;
  onAdd: () => void;
};

// The comment form (20 → Comment sheet): the quote, the comment, who's commenting, and Add comment. It sits in a
// bottom sheet on phones and at the top of the rail on wide screens.
export function CommentComposer({ quote, body, onBody, savedName, name, onName, askName, onChangeName, nameError, error, busy, onAdd }: ComposerProps) {
  const field = useRef<HTMLTextAreaElement>(null);

  // The field grows with the comment, from 3 rows
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [body]);

  return (
    <>
      {quote !== null && <p className="mt-3 border-l-2 border-indigo-600 pl-3 text-slate-600 type-caption">&ldquo;{quote}&rdquo;</p>}
      <textarea
        ref={field}
        value={body}
        maxLength={COMMENT_MAX}
        rows={3}
        aria-label="Your comment"
        aria-describedby="comment-count"
        placeholder="Your comment…"
        onChange={(e) => onBody(e.target.value)}
        className={cn(
          "mt-4 block w-full resize-none overflow-hidden rounded-sm border border-field-border bg-surface px-4 py-3 text-navy-900 caret-blue-600 outline-none type-body-md placeholder:text-slate-600",
          "field-focus:border-blue-600 field-focus:shadow-[inset_0_0_0_1px_var(--blue-600),0_0_0_4px_rgba(3,100,250,.15)]",
        )}
      />
      <p id="comment-count" className="mt-1 text-right text-slate-600 tabular-nums type-caption">
        {body.length} / {COMMENT_MAX.toLocaleString("en-US")}
      </p>
      {askName ? (
        <TextField
          id="reviewer-name"
          label="Your name"
          className="mt-2"
          value={name}
          maxLength={60}
          autoComplete="name"
          autoCapitalize="words"
          placeholder="Ms. Lee"
          onChange={(e) => onName(e.target.value)}
          error={nameError ?? undefined}
        />
      ) : (
        <p className="mt-1 flex items-baseline gap-2 text-slate-600 type-caption">
          <span className="min-w-0 truncate">Commenting as {savedName}</span>
          <button type="button" onClick={onChangeName} className="-my-3 shrink-0 py-3 text-blue-600 type-label pressed:underline focus-ring:underline">
            Change
          </button>
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-coral-700 type-caption">
          {error}
        </p>
      )}
      <PrimaryButton loading={busy} chevron={false} onClick={onAdd} className="mt-6">
        Add comment
      </PrimaryButton>
    </>
  );
}

type CommentSheetProps = ComposerProps & { open: boolean; onClose: () => void };

// On phones the composer is a bottom sheet
export function CommentSheet({ open, onClose, ...composer }: CommentSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="comment-sheet-title" locked={composer.busy}>
      <h2 id="comment-sheet-title" tabIndex={-1} className="text-navy-900 type-title-2 focus:outline-none">
        {composer.quote === null ? "Comment on the whole answer" : "Comment on this part"}
      </h2>
      <CommentComposer {...composer} />
    </BottomSheet>
  );
}
