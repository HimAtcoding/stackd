import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { accountStore } from "@/lib/account-store";
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
import { FEATURES } from "@/lib/features";
import { DEMO_MODE } from "@/lib/flags";
import { readSessionUser } from "@/lib/profile";
import { readSeedResult } from "@/lib/seed";
import { readStorage, writeStorage } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase/client";
import { getHome, getTargetUniversity } from "./index";
import { useEssaysDone } from "./essays";
import { createMarkQueue, mergeFromAccount, type PushError } from "./mark-queue";
import { readPlanState, usePlan, type Plan } from "./plan";

// Deadlines and checklists for the screens (14), and the student's marks on them.
// Real accounts: the verified rows of deadlines, checklists and checklist_steps, and the student's own user_deadlines,
// user_checklist_steps and profiles.transfer_term. This device keeps a copy of both, so screens draw at once and
// reminders can be rescheduled offline; marks are saved here first and then sent to the account.
// Demo mode: the stand-in rows in data/seed/deadlines.json and checklists.json, with marks on this device only.

export const DEADLINES_KEY = "stackd.deadlines";
export const STEPS_KEY = "stackd.steps";
export const TERM_KEY = "stackd.term";
// Steps the student unchecked although the plan checks them. This device only, no database change (18).
export const STEPS_UNCHECKED_KEY = "stackd.stepsUnchecked";
// Marks and the term still waiting to reach the account (cleared at sign-out with the other per-account keys)
export const DEADLINES_QUEUE_KEY = "stackd.deadlinesQueue";
// This device's copy of the verified dates and checklists. Not per account: everyone reads the same rows.
const RECORDS_KEY = "stackd.deadlineRecords";

// Reminder choices, in days before: a week, three days, the day before, the morning it's due
export const REMINDER_DAYS = [7, 3, 1, 0] as const;
export const DEFAULT_REMINDERS = [7, 1];

// reminders undefined: the date follows the student's default (Settings → Remind me)
export type DeadlineMark = { done_at: string | null; reminders?: number[] };
// asked: the student answered the term question ("Not sure yet" saves null and stops asking)
export type TermChoice = { asked: boolean; term: string | null };

export type Records = { deadlines: DeadlineRecord[]; checklists: ChecklistRecord[]; steps: ChecklistStep[] };
export type RecordsState = { status: "loading" } | { status: "error" } | { status: "ok"; data: Records };

const LOADING: RecordsState = { status: "loading" };
const FAILED: RecordsState = { status: "error" };

// Nothing to fetch while every deadline feature is off (the v1 release)
const IN_USE = FEATURES.upcoming || FEATURES.getReady || FEATURES.deadlines || FEATURES.reminders;

const NO_MARKS: Record<string, DeadlineMark> = {};
const NO_STEPS: Record<string, string> = {};
const NOT_ASKED: TermChoice = { asked: false, term: null };
const NO_QUEUE: string[] = [];
const NONE_UNCHECKED: string[] = [];

const marks = accountStore(DEADLINES_KEY, NO_MARKS);
const stepMarks = accountStore(STEPS_KEY, NO_STEPS);
const termChoice = accountStore(TERM_KEY, NOT_ASKED);
const queue = accountStore(DEADLINES_QUEUE_KEY, NO_QUEUE);
const stepsUnchecked = accountStore(STEPS_UNCHECKED_KEY, NONE_UNCHECKED);

// The dates and checklists

// Demo mode shows its demo rows (labelled on screen); a real account sees verified rows only
const verified = (r: { verification_status?: string }) => r.verification_status === "verified";
const shownInDemo = (r: { demo?: boolean; verification_status?: string }) => verified(r) || r.demo === true;

function withSteps(deadlines: DeadlineRecord[], checklists: ChecklistRecord[], steps: ChecklistStep[]): Records {
  // Steps follow their checklist
  return { deadlines, checklists, steps: steps.filter((s) => checklists.some((c) => c.id === s.checklist_id)) };
}

function seedRecords(): RecordsState {
  const dates = readSeedResult<{ deadlines?: DeadlineRecord[] }>("deadlines.json");
  const lists = readSeedResult<{ checklists?: ChecklistRecord[]; checklist_steps?: ChecklistStep[] }>("checklists.json");
  if (dates.status === "broken" || lists.status === "broken") return FAILED;
  // A missing file means no dates: the screens show their empty states
  const listData = lists.status === "ok" ? lists.data : {};
  return {
    status: "ok",
    data: withSteps(
      (dates.status === "ok" ? (dates.data.deadlines ?? []) : []).filter(shownInDemo),
      (listData.checklists ?? []).filter(shownInDemo),
      listData.checklist_steps ?? [],
    ),
  };
}

function cachedRecords(): RecordsState | null {
  try {
    const stored = JSON.parse(readStorage(RECORDS_KEY) ?? "null") as { records?: Records } | null;
    return stored?.records ? { status: "ok", data: stored.records } : null;
  } catch {
    return null;
  }
}

let records: RecordsState | null = null;
const recordListeners = new Set<() => void>();

function setRecords(next: RecordsState) {
  records = next;
  recordListeners.forEach((l) => l());
}

export function getRecords(): RecordsState {
  // Development only: localStorage stackd.dev.deadlines = "loading" or "error" shows those states
  if (process.env.NODE_ENV !== "production") {
    const forced = readStorage("stackd.dev.deadlines");
    if (forced === "loading") return LOADING;
    if (forced === "error") return FAILED;
  }
  if (!records) records = DEMO_MODE ? seedRecords() : (cachedRecords() ?? LOADING);
  return records;
}

function subscribeRecords(onChange: () => void) {
  recordListeners.add(onChange);
  return () => {
    recordListeners.delete(onChange);
  };
}

type DeadlineRow = Omit<DeadlineRecord, "audience" | "demo"> & { audience: string; institution_id: string | null; is_demo: boolean };
type ChecklistRow = Omit<ChecklistRecord, "demo"> & { is_demo: boolean };
type StepRow = Omit<ChecklistStep, "demo"> & { is_demo: boolean; verification_status: string };

const DEADLINE_COLUMNS =
  "id, cycle, audience, institution_id, kind, title, summary, opens_at, due_at, due_has_time, varies_by_campus, source_name, source_url, retrieved_at, verified_at, verification_status, is_demo";
const CHECKLIST_COLUMNS = "id, cycle, deadline_id, name, apply_label, apply_url, source_name, source_url, verified_at, verification_status, is_demo";
const STEP_COLUMNS = "id, checklist_id, position, title, summary, verification_status, is_demo";

// Row-level security returns verified rows only; the filter here is a second guard
async function fetchRecords(supabase: SupabaseClient): Promise<Records> {
  const [d, c, s] = await Promise.all([
    supabase.from("deadlines").select(DEADLINE_COLUMNS).eq("verification_status", "verified"),
    supabase.from("checklists").select(CHECKLIST_COLUMNS).eq("verification_status", "verified"),
    supabase.from("checklist_steps").select(STEP_COLUMNS).eq("verification_status", "verified"),
  ]);
  if (d.error) throw d.error;
  if (c.error) throw c.error;
  if (s.error) throw s.error;
  const deadlines = (d.data as DeadlineRow[]).filter(verified).map(({ institution_id, is_demo, ...r }) => ({
    ...r,
    // lib/deadlines matches a campus-only date to the plan's school by its id
    audience: r.audience === "campus" && institution_id ? institution_id : r.audience,
    demo: is_demo || undefined,
  }));
  const checklists = (c.data as ChecklistRow[]).filter(verified).map(({ is_demo, ...r }) => ({ ...r, demo: is_demo || undefined }));
  const steps = (s.data as StepRow[]).filter(verified).map((r) => ({
    id: r.id,
    checklist_id: r.checklist_id,
    position: r.position,
    title: r.title,
    summary: r.summary,
    demo: r.is_demo || undefined,
  }));
  return withSteps(deadlines, checklists, steps);
}

let loading: Promise<void> | null = null;
let loaded = false;
let syncedFor: string | null = null;

// Reads the dates, then the student's marks, once per app launch (again with `force`). A failed read keeps the copy
// already on screen; with none, the screens show their error state.
export function loadDeadlines(force = false): Promise<void> {
  if (DEMO_MODE || !IN_USE) return Promise.resolve();
  const supabase = getSupabase();
  if (!supabase) {
    if (getRecords().status !== "ok") setRecords(FAILED);
    return Promise.resolve();
  }
  const userId = readSessionUser()?.id ?? null;
  if (loading) return loading;
  if (loaded && !force && syncedFor === userId) return Promise.resolve();
  loading = (async () => {
    try {
      const data = await fetchRecords(supabase);
      writeStorage(RECORDS_KEY, JSON.stringify({ records: data }));
      setRecords({ status: "ok", data });
      loaded = true;
    } catch {
      if (getRecords().status !== "ok") setRecords(FAILED);
    }
    if (userId) {
      await syncMarks(supabase, userId).catch(() => {});
      syncedFor = userId;
    }
  })().finally(() => {
    loading = null;
  });
  return loading;
}

// "Try again" on the Deadlines screen
export function retryDeadlines() {
  if (getRecords().status !== "ok") setRecords(LOADING);
  loadDeadlines(true);
}

// The student's marks in the account

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Every change gets the next number, so a read of the account can tell which marks were made while it was running
let editCount = 0;
const lastEdit = new Map<string, number>();

let sending: { userId: string; queue: ReturnType<typeof createMarkQueue> } | null = null;

// The signed-in account's send queue (lib/data/mark-queue.ts): one failed mark never holds up the others, and
// whatever is left is tried again later, waiting longer each time
function sendQueue(supabase: SupabaseClient, userId: string) {
  if (sending?.userId === userId) return sending.queue;
  sending?.queue.stop();
  const next = createMarkQueue({
    keys: queue.get,
    remove: (key) => queue.set((prev) => prev.filter((k) => k !== key)),
    snapshot: (key) => JSON.stringify(currentValue(key)),
    send: async (key) => {
      try {
        const { error } = await push(supabase, userId, key);
        return { error: error as PushError };
      } catch (e) {
        return { error: { message: String(e) } };
      }
    },
    // A record that isn't in the database (a stand-in id) never will be
    unsendable: (key) => key !== "term" && !UUID.test(key.slice(2)),
    stillCurrent: () => readSessionUser()?.id === userId,
    later: (run, ms) => {
      const timer = setTimeout(run, ms);
      return () => clearTimeout(timer);
    },
  });
  sending = { userId, queue: next };
  return next;
}

function enqueue(key: string) {
  if (DEMO_MODE) return;
  lastEdit.set(key, ++editCount);
  queue.set((prev) => (prev.includes(key) ? prev : [...prev, key]));
  const supabase = getSupabase();
  const userId = readSessionUser()?.id;
  if (supabase && userId) sendQueue(supabase, userId).flush().catch(() => {});
}

// What a queued key stands for right now; sent as it is when the queue is pushed
function currentValue(key: string): unknown {
  if (key === "term") return termChoice.get();
  if (key.startsWith("d:")) return marks.get()[key.slice(2)] ?? null;
  return stepMarks.get()[key.slice(2)] ?? null;
}

async function push(supabase: SupabaseClient, userId: string, key: string) {
  if (key === "term") {
    const { asked, term } = termChoice.get();
    return supabase.from("profiles").update({ transfer_term: term, transfer_term_asked: asked || term !== null }).eq("user_id", userId);
  }
  const id = key.slice(2);
  if (key.startsWith("d:")) {
    const mark = marks.get()[id];
    if (!mark || (!mark.done_at && mark.reminders === undefined)) {
      return supabase.from("user_deadlines").delete().match({ user_id: userId, deadline_id: id });
    }
    return supabase.from("user_deadlines").upsert({ user_id: userId, deadline_id: id, done_at: mark.done_at, reminders: mark.reminders ?? null });
  }
  const done = stepMarks.get()[id];
  return done
    ? supabase.from("user_checklist_steps").upsert({ user_id: userId, step_id: id, done_at: done })
    : supabase.from("user_checklist_steps").delete().match({ user_id: userId, step_id: id });
}

// Sends what's queued, then reads the account's marks and term. The account's copy replaces this device's, except
// for marks still waiting to be sent or made while the read was running, so a failed send never stops the pull.
async function syncMarks(supabase: SupabaseClient, userId: string) {
  await sendQueue(supabase, userId).flush();
  const readFrom = editCount;
  const [dates, steps, profile] = await Promise.all([
    supabase.from("user_deadlines").select("deadline_id, done_at, reminders"),
    supabase.from("user_checklist_steps").select("step_id, done_at"),
    supabase.from("profiles").select("transfer_term, transfer_term_asked").maybeSingle(),
  ]);
  if (dates.error || steps.error || profile.error || readSessionUser()?.id !== userId) return;
  const keepDevice = (key: string) => queue.get().includes(key) || (lastEdit.get(key) ?? 0) > readFrom;
  const accountMarks = Object.fromEntries(
    (dates.data as { deadline_id: string; done_at: string | null; reminders: number[] | null }[]).map((r) => [
      r.deadline_id,
      r.reminders ? { done_at: r.done_at, reminders: r.reminders } : { done_at: r.done_at },
    ]),
  );
  const accountSteps = Object.fromEntries((steps.data as { step_id: string; done_at: string }[]).map((r) => [r.step_id, r.done_at]));
  marks.set((device) => mergeFromAccount<DeadlineMark>(accountMarks, device, (id) => keepDevice(`d:${id}`)));
  stepMarks.set((device) => mergeFromAccount(accountSteps, device, (id) => keepDevice(`s:${id}`)));
  const p = profile.data as { transfer_term: string | null; transfer_term_asked: boolean } | null;
  if (p && !keepDevice("term")) termChoice.set(() => ({ asked: p.transfer_term_asked, term: p.transfer_term }));
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
  return plan.targets.map((t) => ({ id: t.institutionId, name: t.name, system: t.system, hasMajor: t.majorId !== null }));
}

function demoScope(): Scope {
  const university = getTargetUniversity();
  // The demo journey says whether its major is chosen
  const hasMajor = Boolean(getHome()?.journey?.steps?.some((s) => s.id === "major" && s.status === "done"));
  return university ? [{ id: university.slug, name: university.name, system: university.system ?? null, hasMajor }] : null;
}

// The student's schools outside React (reminders): undefined until the plan has loaded
export function currentScope(): Scope | undefined {
  if (DEMO_MODE) return demoScope();
  const plan = readPlanState();
  return plan.status === "ok" ? scopeFromPlan(plan.plan) : undefined;
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
  const unchecked = stepsUnchecked.use();
  const term = termChoice.use();
  // Essays' "{done} of 4 done", for the writing step (18 → Steps that know their own status). Null while Essays is off.
  const essaysDone = useEssaysDone(term.term);
  const loadedRecords = useSyncExternalStore(subscribeRecords, getRecords, () => LOADING);
  const scope = scopeState.status === "ok" ? scopeState.scope : undefined;

  useEffect(() => {
    loadDeadlines();
  }, []);

  return useMemo((): DeadlinesState => {
    if (loadedRecords.status === "error" || scopeState.status === "error") return { status: "error" };
    if (loadedRecords.status === "loading" || scope === undefined || !today) return { status: "loading" };
    const { deadlines, checklists, steps: allSteps } = loadedRecords.data;
    const view = buildView(deadlines, (id) => doneMarks[id]?.done_at ?? null, scope, term.term, today);
    const checklist = pickChecklist(checklists, allSteps, view, scope, (id) => Boolean(steps[id]), (id) => unchecked.includes(id), essaysDone);
    return { status: "ok", now: today, scope, view, checklist, term, marks: doneMarks };
  }, [loadedRecords, scopeState.status, scope, today, doneMarks, steps, unchecked, term, essaysDone]);
}

// The term on its own, for Settings' Transfer term row
export function useTerm(): TermChoice {
  useEffect(() => {
    loadDeadlines();
  }, []);
  return termChoice.use();
}

// Everything reminders need, outside React, and a way to hear when any of it changes
export const readDeadlines = () => ({ records: getRecords(), marks: marks.get(), term: termChoice.get() });

export function subscribeDeadlines(onChange: () => void) {
  const stops = [subscribeRecords(onChange), marks.subscribe(onChange), termChoice.subscribe(onChange)];
  return () => stops.forEach((stop) => stop());
}

export function markDeadline(id: string, done: boolean) {
  marks.set((prev) => ({ ...prev, [id]: { ...prev[id], done_at: done ? new Date().toISOString() : null } }));
  enqueue(`d:${id}`);
}

export function setReminders(id: string, days: number[]) {
  marks.set((prev) => ({ ...prev, [id]: { done_at: prev[id]?.done_at ?? null, reminders: days } }));
  enqueue(`d:${id}`);
}

// The date's own reminder days, or the student's default
export const remindersFor = (mark: DeadlineMark | undefined, defaults: number[] = DEFAULT_REMINDERS) => mark?.reminders ?? defaults;

export function markStep(id: string, done: boolean) {
  // Unchecking keeps a step the plan checks unchecked; checking it again lets the plan check it
  stepsUnchecked.set((prev) => (done ? prev.filter((x) => x !== id) : prev.includes(id) ? prev : [...prev, id]));
  stepMarks.set((prev) => {
    const next = { ...prev };
    if (done) next[id] = new Date().toISOString();
    else delete next[id];
    return next;
  });
  enqueue(`s:${id}`);
}

export function saveTerm(term: string | null) {
  termChoice.set(() => ({ asked: true, term }));
  enqueue("term");
}
