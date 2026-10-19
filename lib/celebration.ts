import { readStorage, writeStorage } from "@/lib/storage";

// Journey step ids already celebrated this session (flows-and-states → Celebration rule).
const KEY = "stackd.celebrated";

// True the first time a step completes this session, so the celebration opens at most once per step.
export function claimCelebration(stepId: string): boolean {
  try {
    const done: string[] = JSON.parse(window.sessionStorage.getItem(KEY) ?? "[]");
    if (done.includes(stepId)) return false;
    window.sessionStorage.setItem(KEY, JSON.stringify([...done, stepId]));
    return true;
  } catch {
    return true;
  }
}

// Checklists already celebrated on this device (16 → All steps done): the finish happens once per checklist
const READY_KEY = "stackd.checklistsReady";

function readyIds(): string[] {
  try {
    const ids: unknown = JSON.parse(readStorage(READY_KEY) ?? "[]");
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export const checklistCelebrated = (checklistId: string) => readyIds().includes(checklistId);

// True the first time this checklist is finished on this device
export function claimChecklistReady(checklistId: string): boolean {
  const ids = readyIds();
  if (ids.includes(checklistId)) return false;
  writeStorage(READY_KEY, JSON.stringify([...ids, checklistId]));
  return true;
}
