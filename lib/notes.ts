// Notes beside a draft (20 → Notes): the student's private scratch space for one question. Saved with the draft, but
// never counted toward 350 words and never copied, shared, downloaded or sent in a review link. No React here.

import type { Starter } from "./piq-starters";

export type Note = { id: string; starter: string | null; body: string };

export const NOTES_LIMIT = 12;
export const NOTE_MAX = 2000;

export const NO_NOTES: Note[] = [];

export const makeNote = (starter: string | null): Note => ({ id: crypto.randomUUID(), starter, body: "" });

// Only well-formed notes from a saved copy (an older device's copy has none)
export function cleanNotes(value: unknown): Note[] {
  if (!Array.isArray(value)) return NO_NOTES;
  return value
    .filter(
      (n): n is Note =>
        Boolean(n) && typeof n.id === "string" && typeof n.body === "string" && (n.starter === null || typeof n.starter === "string"),
    )
    .slice(0, NOTES_LIMIT)
    .map((n) => ({ id: n.id, starter: n.starter, body: n.body.slice(0, NOTE_MAX) }));
}

export const sameNotes = (a: Note[], b: Note[]) => JSON.stringify(a) === JSON.stringify(b);

export const canAddNote = (notes: Note[]) => notes.length < NOTES_LIMIT;

export const starterIds = (notes: Note[]) => new Set(notes.map((n) => n.starter).filter((s): s is string => Boolean(s)));

// The starter card's question: the next one after `from` (wrapping around) that isn't already in Notes. Null when all
// of them are.
export function nextStarter(starters: Starter[], notes: Note[], from: number): number | null {
  const used = starterIds(notes);
  for (let step = 0; step < starters.length; step++) {
    const i = (((from + step) % starters.length) + starters.length) % starters.length;
    if (!used.has(starters[i].id)) return i;
  }
  return null;
}

// Add to my answer: the note's text at the end, after a blank line; into an empty answer as it is
export function addToAnswer(answer: string, note: string): string {
  const text = note.trim();
  if (!answer.trim()) return text;
  return `${answer.replace(/\s+$/, "")}\n\n${text}`;
}

// Delete with Undo: the removed note and where it was
export function removeNote(notes: Note[], id: string): { notes: Note[]; removed: { note: Note; index: number } | null } {
  const index = notes.findIndex((n) => n.id === id);
  if (index < 0) return { notes, removed: null };
  return { notes: notes.filter((n) => n.id !== id), removed: { note: notes[index], index } };
}

export function restoreNote(notes: Note[], removed: { note: Note; index: number }): Note[] {
  if (notes.some((n) => n.id === removed.note.id)) return notes;
  const next = [...notes];
  next.splice(Math.min(removed.index, next.length), 0, removed.note);
  return next.slice(0, NOTES_LIMIT);
}
