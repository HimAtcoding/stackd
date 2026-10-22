"use client";

import { PlusIcon } from "@phosphor-icons/react/ssr";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { CommentRow, type Comment } from "./comment-list";

type PhraseSheetProps = {
  open: boolean;
  quote: string;
  comments: Comment[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

// Tapping a highlighted phrase on a phone (20 → Phrase sheet): the phrase, its comments, and a way to add another
export function PhraseSheet({ open, quote, comments, onAdd, onDelete, onClose }: PhraseSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="phrase-sheet-title">
      <p id="phrase-sheet-title" tabIndex={-1} className="border-l-2 border-indigo-600 pl-3 text-slate-600 type-caption focus:outline-none">
        &ldquo;{quote}&rdquo;
      </p>
      <ul className="mt-4 max-h-[50dvh] space-y-1 overflow-y-auto">
        {comments.map((c) => (
          <CommentRow key={c.id} comment={{ ...c, quote: null }} onDelete={onDelete} />
        ))}
      </ul>
      <button type="button" onClick={onAdd} className="-my-3 mt-3 inline-flex items-center gap-1.5 py-3 text-blue-600 type-label pressed:underline focus-ring:underline">
        <PlusIcon weight="bold" size={18} aria-hidden />
        Add a comment
      </button>
    </BottomSheet>
  );
}
