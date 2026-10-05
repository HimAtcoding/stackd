import { useMemo, useSyncExternalStore } from "react";
import type { JourneyStep, Requirement, RequirementStatus } from "./seed";
import { readStorage, writeStorage } from "./storage";

// { [requirementId]: status } overrides on top of the seed statuses. Written by the university screen (03).
export const REQUIREMENTS_KEY = "stackd.requirements";

// Fired after a same-tab write, since the storage event only reaches other tabs.
export const REQUIREMENTS_EVENT = "stackd:requirements";

const STATUSES: RequirementStatus[] = ["done", "in_progress", "not_started"];

export type StatusMap = Record<string, RequirementStatus>;

function parseOverrides(raw: string | null): StatusMap {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, RequirementStatus] =>
        STATUSES.includes(entry[1] as RequirementStatus),
      ),
    );
  } catch {
    return {};
  }
}

// Seed status, replaced by the stored override where there is one.
export function mergeStatuses(requirements: Requirement[], overrides: StatusMap): StatusMap {
  return Object.fromEntries(requirements.map((r) => [r.id, overrides[r.id] ?? r.status]));
}

// A journey step linked to a requirement takes that requirement's status.
export function stepStatus(step: JourneyStep, statuses: StatusMap): RequirementStatus {
  return (step.requirementId && statuses[step.requirementId]) || step.status;
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === REQUIREMENTS_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(REQUIREMENTS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(REQUIREMENTS_EVENT, onChange);
  };
}

// Holds the overrides for this tab when storage is blocked, so checkmarks still work until it closes.
let memoryRaw: string | null = null;

const readRaw = () => readStorage(REQUIREMENTS_KEY) ?? memoryRaw;

// Current status of every requirement, kept in sync with stackd.requirements.
export function useRequirementStatuses(requirements: Requirement[]): StatusMap {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return useMemo(() => mergeStatuses(requirements, parseOverrides(raw)), [requirements, raw]);
}

// The status a done requirement returns to: its seed status, or not started if the seed already says done.
export function previousStatus(requirement: Requirement): Exclude<RequirementStatus, "done"> {
  return requirement.status === "done" ? "not_started" : requirement.status;
}

// Stores only differences from the seed. Returns false when storage is blocked (the change still applies in this tab).
export function setRequirementStatus(requirement: Requirement, status: RequirementStatus): boolean {
  const overrides = parseOverrides(readRaw());
  if (status === requirement.status) delete overrides[requirement.id];
  else overrides[requirement.id] = status;
  const raw = JSON.stringify(overrides);
  const saved = writeStorage(REQUIREMENTS_KEY, raw);
  memoryRaw = saved ? null : raw;
  window.dispatchEvent(new Event(REQUIREMENTS_EVENT));
  return saved;
}

// Done ↔ previous. Reads storage on every tap, so quick repeated taps land on the right state.
export function toggleRequirement(requirement: Requirement) {
  const from = parseOverrides(readRaw())[requirement.id] ?? requirement.status;
  const to = from === "done" ? previousStatus(requirement) : "done";
  const saved = setRequirementStatus(requirement, to);
  return { from, to, saved };
}
