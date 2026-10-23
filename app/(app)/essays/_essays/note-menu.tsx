"use client";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/cn";
import type { Note } from "@/lib/notes";
import { starterText } from "@/lib/piq-starters";

type NoteMenuProps = {
  open: boolean;
  note: Note | null;
  onAddToAnswer: () => void;
  onDelete: () => void;
  onClose: () => void;
};

// A note's menu (20 → Note menu): Add to my answer (dimmed while the note is empty) and Delete note
export function NoteMenu({ open, note, onAddToAnswer, onDelete, onClose }: NoteMenuProps) {
  const empty = !note?.body.trim();
  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="note-menu-title">
      <h2 id="note-menu-title" tabIndex={-1} className="line-clamp-2 text-navy-900 type-title-2 focus:outline-none">
        {starterText(note?.starter ?? null) ?? "Your note"}
      </h2>
      <ul className="-mx-6 mt-3 divide-y divide-border border-y border-border">
        <li>
          <MenuButton onClick={onAddToAnswer} disabled={empty}>
            Add to my answer
          </MenuButton>
        </li>
        <li>
          <MenuButton onClick={onDelete} danger>
            Delete note
          </MenuButton>
        </li>
      </ul>
    </BottomSheet>
  );
}

function MenuButton({ children, onClick, danger, disabled }: { children: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={cn(
        "flex h-14 w-full items-center px-6 text-left type-row-title transition-colors duration-200 ease-out pressed:bg-surface-pressed focus-ring:-outline-offset-2",
        danger ? "text-coral-700" : "text-navy-900",
        disabled && "opacity-40",
      )}
    >
      {children}
    </button>
  );
}
