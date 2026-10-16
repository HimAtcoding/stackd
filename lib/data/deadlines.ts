import { useMemo, useSyncExternalStore } from "react";
import {
  buildView,
  pickChecklist,
  type ChecklistRecord,
  type ChecklistStep,
  type ChecklistView,
  type DeadlineRecord,
  type DeadlineView,
  type Scope,
} from "@/lib/deadlines";
import { DEMO_MODE } from "@/lib/flags";
import { readSessionUser } from "@/lib/profile";
import { readSeedResult } from "@/lib/seed";
import { readStorage, writeStorage } from "@/lib/storage";
import { getTargetUniversity } from "./index";
import { usePlan, type Plan } from "./plan";

// Deadlines and checklists for the screens (14). Until the deadlines tables land, the dates are the stand-in rows in
// data/seed/deadlines.json and checklists.json, and the student's marks live on this device under their account id
// (stand-ins for user_deadlines, user_checklist_steps and profiles.transfer_term). Only this file changes when the
// database takes over.

export const DEADLINES_KEY = "stackd.deadlines";
export const STEPS_KEY = "stackd.steps";
export const TERM_KEY = "stackd.term";

// Reminder choices, in days before: a week, three days, the day before, the morning it's due
export const REMINDER_DAYS = [7, 3, 1, 0] as const;
export const DEFAULT_REMINDERS = [7, 1];

export type DeadlineMark = { done_at: string | null; reminders?: number[] };
// asked: the student answered the term question ("Not sure yet" saves null and stops asking)
export type TermChoice = { asked: boolean; term: string | null };

type Records = { deadlines: DeadlineRecord[]; checklists: ChecklistRecord[]; steps: ChecklistStep[] };
type Load<T> = { status: "loading" } | { status: "error" } | { status: "ok"; data: T };

const owner = () => readSessionUser()?.id ?? "demo";

// A per-account value on this device, tagged with the account so another student never sees it.
// Kept in memory when storage is blocked, so marks still work until the tab closes.
function accountStore<T>(key: string, empty: T) {
  const listeners = new Set<() => void>();
  let memory: string | null = null;
  let cache: { raw: string | null; owner: string; value: T } | null = null;

  function get(): T {
    const raw = readStorage(key) ?? memory;
    const who = owner();
    if (cache && cache.raw === raw && cache.owner === who) return cache.value;
    let value = empty;
    try {
      const stored = JSON.parse(raw ?? "null") as { userId?: string; value?: T } | null;
      if (stored?.userId === who && stored.value !== undefined) value = stored.value;
    } catch {}
    cache = { raw, owner: who, value };
    return value;
  }

  function set(update: (prev: T) => T) {
    const raw = JSON.stringify({ userId: owner(), value: update(get()) });
    memory = writeStorage(key, raw) ? null : raw;
    listeners.forEach((l) => l());
  }

  function subscribe(onChange: () => void) {
    listeners.add(onChange);
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === key) onChange();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onStorage);
    };
  }

  return { get, set, use: () => useSyncExternalStore(subscribe, get, () => empty) };
}

const NO_MARKS: Record<string, DeadlineMark> = {};
const NO_STEPS: Record<string, string> = {};
const NOT_ASKED: TermChoice = { asked: false, term: null };

const marks = accountStore(DEADLINES_KEY, NO_MARKS);
const stepMarks = accountStore(STEPS_KEY, NO_STEPS);
const termChoice = accountStore(TERM_KEY, NOT_ASKED);

// Only verified rows reach a student. Demo rows show too, and the screens label them (demo strip, source line).
const shown = (r: { demo?: boolean; verification_status?: string }) => r.verification_status === "verified" || r.demo === true;

let records: Load<Records> | null = null;

function readRecords(): Load<Records> {
  // Development only: localStorage stackd.dev.deadlines = "loading" or "error" shows those states
  if (process.env.NODE_ENV !== "production") {
    const forced = readStorage("stackd.dev.deadlines");
    if (forced === "loading" || forced === "error") return { status: forced };
  }
  if (records) return records;
  const dates = readSeedResult<{ deadlines?: DeadlineRecord[] }>("deadlines.json");
  const lists = readSeedResult<{ checklists?: ChecklistRecord[]; checklist_steps?: ChecklistStep[] }>("checklists.json");
  if (dates.status === "broken" || lists.status === "broken") return (records = { status: "error" });
  // A missing file means no dates: the screens show their empty states
  const listData = lists.status === "ok" ? lists.data : {};
  const checklists = (listData.checklists ?? []).filter(shown);
  records = {
    status: "ok",
    data: {
      deadlines: (dates.status === "ok" ? (dates.data.deadlines ?? []) : []).filter(shown),
      checklists,
      // Steps follow their checklist
      steps: (listData.checklist_steps ?? []).filter((s) => checklists.some((c) => c.id === s.checklist_id)),
    },
  };
  return records;
}

// Today, read again whenever the app comes back to the foreground (14 → Motion: the window bar updates then)
let now: Date | null = null;
const getNow = () => (now ??= new Date());

function subscribeNow(onChange: () => void) {
  const onVisible = () => {
    if (document.visibilityState !== "visible") return;
    now = new Date();
    onChange();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => document.removeEventListener("visibilitychange", onVisible);
}

// Null while prerendering, so a build never bakes in its own date
export const useNow = () => useSyncExternalStore(subscribeNow, getNow, () => null);

export type ScopeState = { status: "loading" } | { status: "error" } | { status: "ok"; scope: Scope };

// The plan's schools. A plan with no schools counts as no plan.
export function scopeFromPlan(plan: Plan): Scope {
  if (plan.targets.length === 0) return null;
  return plan.targets.map((t) => ({ id: t.institutionId, name: t.name, system: t.system }));
}

function demoScope(): Scope {
  const university = getTargetUniversity();
  return university ? [{ id: university.slug, name: university.name, system: university.system ?? null }] : null;
}

// The student's schools for the Deadlines screen: their saved plan, or the demo target in demo mode
export function useScope(): ScopeState {
  const plan = usePlan();
  return useMemo(() => {
    if (DEMO_MODE) return { status: "ok", scope: demoScope() };
    if (plan.status !== "ok") return plan;
    return { status: "ok", scope: scopeFromPlan(plan.plan) };
  }, [plan]);
}

// Home's scope from the plan it already holds
export function usePlanScope(plan: Plan | null, failed: boolean): ScopeState {
  return useMemo(() => {
    if (DEMO_MODE) return { status: "ok", scope: demoScope() };
    if (failed) return { status: "error" };
    return plan ? { status: "ok", scope: scopeFromPlan(plan) } : { status: "loading" };
  }, [plan, failed]);
}

export type DeadlinesState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ok";
      now: Date;
      scope: Scope;
      view: DeadlineView;
      checklist: ChecklistView | null;
      term: TermChoice;
      marks: Record<string, DeadlineMark>;
    };

// Everything the deadline screens draw, for the student's schools and term, as of today
export function useDeadlines(scopeState: ScopeState): DeadlinesState {
  const today = useNow();
  const doneMarks = marks.use();
  const steps = stepMarks.use();
  const term = termChoice.use();
  const loaded = readRecords();
  const scope = scopeState.status === "ok" ? scopeState.scope : undefined;

  return useMemo((): DeadlinesState => {
    if (loaded.status === "error" || scopeState.status === "error") return { status: "error" };
    if (loaded.status === "loading" || scope === undefined || !today) return { status: "loading" };
    const { deadlines, checklists, steps: allSteps } = loaded.data;
    const view = buildView(deadlines, (id) => doneMarks[id]?.done_at ?? null, scope, term.term, today);
    const checklist = pickChecklist(checklists, allSteps, view, scope, (id) => Boolean(steps[id]));
    return { status: "ok", now: today, scope, view, checklist, term, marks: doneMarks };
  }, [loaded, scopeState.status, scope, today, doneMarks, steps, term]);
}

export function markDeadline(id: string, done: boolean) {
  marks.set((prev) => ({ ...prev, [id]: { ...prev[id], done_at: done ? new Date().toISOString() : null } }));
}

export function setReminders(id: string, days: number[]) {
  marks.set((prev) => ({ ...prev, [id]: { done_at: prev[id]?.done_at ?? null, reminders: days } }));
}

export const remindersFor = (mark: DeadlineMark | undefined) => mark?.reminders ?? DEFAULT_REMINDERS;

export function markStep(id: string, done: boolean) {
  stepMarks.set((prev) => {
    const next = { ...prev };
    if (done) next[id] = new Date().toISOString();
    else delete next[id];
    return next;
  });
}

export function saveTerm(term: string | null) {
  termChoice.set(() => ({ asked: true, term }));
}
