import { useMemo, useSyncExternalStore } from "react";
import type { JourneyStep, Requirement, RequirementStatus } from "./seed";
import { readStorage } from "./storage";

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

const readRaw = () => readStorage(REQUIREMENTS_KEY);

// Current status of every requirement, kept in sync with stackd.requirements.
export function useRequirementStatuses(requirements: Requirement[]): StatusMap {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return useMemo(() => mergeStatuses(requirements, parseOverrides(raw)), [requirements, raw]);
}
