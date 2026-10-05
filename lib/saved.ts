import { useSyncExternalStore } from "react";
import { readStorage, writeStorage } from "./storage";

// Saved university slugs, as a JSON array.
export const SAVED_KEY = "stackd.saved";
// detail: { slug, saved } for a student's change, absent when the whole list was replaced (a sync pull)
export const SAVED_EVENT = "stackd:saved";
export type SavedChange = { slug: string; saved: boolean };

export function readSlugs(): string[] {
  try {
    const parsed: unknown = JSON.parse(readStorage(SAVED_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SAVED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SAVED_EVENT, onChange);
  };
}

export function useSaved(slug: string): boolean {
  return useSyncExternalStore(subscribe, () => readSlugs().includes(slug), () => false);
}

export function toggleSaved(slug: string) {
  const slugs = readSlugs();
  const saved = !slugs.includes(slug);
  writeStorage(SAVED_KEY, JSON.stringify(saved ? [...slugs, slug] : slugs.filter((s) => s !== slug)));
  const detail: SavedChange = { slug, saved };
  window.dispatchEvent(new CustomEvent(SAVED_EVENT, { detail }));
}
