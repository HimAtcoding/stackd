import { useSyncExternalStore } from "react";
import { readStorage, writeStorage } from "./storage";

// Saved university slugs, as a JSON array.
const KEY = "stackd.saved";
const EVENT = "stackd:saved";

function readSlugs(): string[] {
  try {
    const parsed: unknown = JSON.parse(readStorage(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function useSaved(slug: string): boolean {
  return useSyncExternalStore(subscribe, () => readSlugs().includes(slug), () => false);
}

export function toggleSaved(slug: string) {
  const slugs = readSlugs();
  writeStorage(KEY, JSON.stringify(slugs.includes(slug) ? slugs.filter((s) => s !== slug) : [...slugs, slug]));
  window.dispatchEvent(new Event(EVENT));
}
