"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { DotsThreeIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { canAddNote, NOTE_MAX, NOTES_LIMIT, type Note } from "@/lib/notes";
import { starterText } from "@/lib/piq-starters";

type NotesTabProps = {
  notes: Note[];
  // A note to focus once it's on screen (just added), then onFocused clears it
  focusId: string | null;
  onFocused: () => void;
  onType: (id: string, body: string) => void;
  onMenu: (note: Note) => void;
  onAddStarter: () => void;
  onAddOwn: () => void;
};

// The Notes tab (20 → 3): private scratch space beside the answer. No dividers and no cards; each note is its starter
// question (none for your own) over a growing field with an indigo bar.
export function NotesTab({ notes, focusId, onFocused, onType, onMenu, onAddStarter, onAddOwn }: NotesTabProps) {
  const full = !canAddNote(notes);
  return (
    <div className="px-6 pt-4" style={{ paddingBottom: "calc(var(--safe-bottom) + 24px)" }}>
      <p className="max-w-[400px] text-slate-600 type-caption">
        Notes don&apos;t count toward your 350 words, and they&apos;re never copied, shared or sent for review.
      </p>
      {notes.length === 0 ? (
        <p className="mt-6 text-slate-700 type-body">Answer a starter question or write your own.</p>
      ) : (
        <ul className="mt-6 space-y-6">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} focus={focusId === note.id} onFocused={onFocused} onType={onType} onMenu={onMenu} />
          ))}
        </ul>
      )}
      {full && <p className="mt-6 text-slate-700 type-body">You&apos;ve reached {NOTES_LIMIT} notes for this question.</p>}
      <div className="mt-4 flex flex-col items-start">
        <AddButton disabled={full} onClick={onAddStarter}>
          Add a starter question
        </AddButton>
        <AddButton disabled={full} onClick={onAddOwn}>
          Add your own note
        </AddButton>
      </div>
    </div>
  );
}

function AddButton({ children, disabled, onClick }: { children: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled || undefined}
      onClick={onClick}
      className="inline-flex h-11 items-center gap-1.5 text-blue-600 type-label pressed:underline focus-ring:underline disabled:opacity-40"
    >
      <PlusIcon weight="bold" size={18} aria-hidden />
      {children}
    </button>
  );
}

type NoteItemProps = { note: Note; focus: boolean; onFocused: () => void; onType: (id: string, body: string) => void; onMenu: (note: Note) => void };

function NoteItem({ note, focus, onFocused, onType, onMenu }: NoteItemProps) {
  const field = useRef<HTMLTextAreaElement>(null);
  const heading = starterText(note.starter);

  // The field grows with its text, so the tab scrolls as one page
  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [note.body]);

  useEffect(() => {
    if (!focus) return;
    const el = field.current;
    if (el) {
      el.focus({ preventScroll: true });
      el.setSelectionRange(el.value.length, el.value.length);
      el.closest("li")?.scrollIntoView({ block: "nearest" });
    }
    onFocused();
  }, [focus, onFocused]);

  const menu = (
    <button
      type="button"
      onClick={() => onMenu(note)}
      aria-label={heading ? `More for the note "${heading}"` : "More for your note"}
      aria-haspopup="dialog"
      className="-mr-3 -mt-[11px] flex size-11 shrink-0 items-center justify-center rounded-full text-slate-600 pressed:bg-surface-pressed"
    >
      <DotsThreeIcon weight="bold" size={22} aria-hidden />
    </button>
  );

  const input = (
    <textarea
      ref={field}
      value={note.body}
      onChange={(e) => onType(note.id, e.target.value)}
      maxLength={NOTE_MAX}
      rows={1}
      placeholder={heading ? "Answer this…" : "Write anything…"}
      autoCapitalize="sentences"
      spellCheck
      aria-label={heading ?? "Your note"}
      className={cn(
        "block w-full resize-none appearance-none overflow-hidden border-l-2 border-indigo-600 bg-transparent pl-3 text-navy-900 type-body-lg",
        "placeholder:text-slate-600 focus:outline-none",
      )}
    />
  );

  return (
    <li>
      {heading ? (
        <>
          <div className="flex items-start gap-3">
            <h3 className="min-w-0 flex-1 text-navy-900 type-headline">{heading}</h3>
            {menu}
          </div>
          <div className="mt-2">{input}</div>
        </>
      ) : (
        // Your own note: the menu sits on the field's first line
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">{input}</div>
          {menu}
        </div>
      )}
    </li>
  );
}
