import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { accountStore } from "@/lib/account-store";
import { countWords, draftKey, mergeDrafts, pickPromptCycle, progress, type AccountDraft, type Draft, type Prompt } from "@/lib/essays";
import { essaysHref } from "@/lib/features";
import { readSessionUser } from "@/lib/profile";
import { readStorage, writeStorage } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase/client";
import { createMarkQueue, type PushError } from "./mark-queue";

// Essays for the screens (17): the verified personal insight questions, and the student's drafts.
// Drafts are saved on this device first and then sent to essay_drafts, so writing works offline; the queue retries
// the way deadline marks do (lib/data/mark-queue.ts). Opening Essays or the editor reads the account's copy again.

export const DRAFTS_KEY = "stackd.essays";
export const ESSAYS_QUEUE_KEY = "stackd.essaysQueue";
// This device's copy of the verified questions. Not per account: everyone reads the same rows.
const PROMPTS_KEY = "stackd.piqPrompts";

const NO_DRAFTS: Record<string, Draft> = {};
const NO_QUEUE: string[] = [];

const drafts = accountStore(DRAFTS_KEY, NO_DRAFTS);
const queue = accountStore(ESSAYS_QUEUE_KEY, NO_QUEUE);

// The questions

export type PromptsState = { status: "loading" } | { status: "error" } | { status: "ok"; prompts: Prompt[] };

const LOADING: PromptsState = { status: "loading" };
const FAILED: PromptsState = { status: "error" };
const PROMPT_COLUMNS = "key, cycle, short_name, summary, required, sort, source_name, source_url, verified_at";

function cachedPrompts(): PromptsState | null {
  try {
    const stored = JSON.parse(readStorage(PROMPTS_KEY) ?? "null") as { prompts?: Prompt[] } | null;
    return stored?.prompts?.length ? { status: "ok", prompts: stored.prompts } : null;
  } catch {
    return null;
  }
}

let prompts: PromptsState | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function getPrompts(): PromptsState {
  // Development only: localStorage stackd.dev.essays = "loading" or "error" shows those states
  if (process.env.NODE_ENV !== "production") {
    const forced = readStorage("stackd.dev.essays");
    if (forced === "loading") return LOADING;
    if (forced === "error") return FAILED;
  }
  if (!prompts) prompts = cachedPrompts() ?? LOADING;
  return prompts;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

// Questions are read once per app launch; drafts each time Essays or the editor opens
let promptsLoaded = false;
let loading: Promise<void> | null = null;

// Reads the verified questions and the account's drafts. A failed read keeps what's on screen; with nothing to show,
// the screen shows its error.
export function loadEssays(): Promise<void> {
  if (!essaysHref()) return Promise.resolve();
  const supabase = getSupabase();
  if (!supabase) {
    if (getPrompts().status !== "ok") {
      prompts = FAILED;
      notify();
    }
    return Promise.resolve();
  }
  if (loading) return loading;
  loading = (async () => {
    if (!promptsLoaded) {
      try {
        // Row-level security returns verified rows only; the filter here is a second guard
        const { data, error } = await supabase.from("piq_prompts").select(PROMPT_COLUMNS).eq("verification_status", "verified");
        if (error) throw error;
        const rows = data as Prompt[];
        writeStorage(PROMPTS_KEY, JSON.stringify({ prompts: rows }));
        prompts = { status: "ok", prompts: rows };
        promptsLoaded = true;
      } catch {
        if (getPrompts().status !== "ok") prompts = FAILED;
      }
      notify();
    }
    const userId = readSessionUser()?.id;
    if (userId) await pullDrafts(supabase, userId).catch(() => {});
  })().finally(() => {
    loading = null;
  });
  return loading;
}

export function retryEssays() {
  if (getPrompts().status !== "ok") {
    prompts = LOADING;
    notify();
  }
  promptsLoaded = false;
  loadEssays();
}

// Saving to the account

// Every change gets the next number, so a read of the account can tell which drafts changed while it was running
let editCount = 0;
const lastEdit = new Map<string, number>();
// The last send failed for want of a connection: the screens say "Saved on this phone"
let offline = false;
const setOffline = (value: boolean) => {
  if (offline === value) return;
  offline = value;
  notify();
};

let sending: { userId: string; queue: ReturnType<typeof createMarkQueue> } | null = null;

// What a send compares to tell whether the draft changed while it was on its way. saved_at isn't in it: the send
// itself sets it.
const content = (d: Draft | undefined) => JSON.stringify(d ? [d.body, d.word_count, d.chosen, d.done_at] : null);

function sendQueue(supabase: SupabaseClient, userId: string) {
  if (sending?.userId === userId) return sending.queue;
  sending?.queue.stop();
  const next = createMarkQueue({
    keys: queue.get,
    remove: (key) => queue.set((prev) => prev.filter((k) => k !== key)),
    snapshot: (key) => content(drafts.get()[key]),
    send: async (key) => {
      try {
        const { error } = await push(supabase, userId, key);
        setOffline(Boolean(error && !error.code));
        return { error: error as PushError };
      } catch (e) {
        setOffline(true);
        return { error: { message: String(e) } };
      }
    },
    unsendable: () => false,
    stillCurrent: () => readSessionUser()?.id === userId,
    later: (run, ms) => {
      const timer = setTimeout(run, ms);
      return () => clearTimeout(timer);
    },
  });
  sending = { userId, queue: next };
  return next;
}

async function push(supabase: SupabaseClient, userId: string, key: string) {
  const draft = drafts.get()[key];
  if (!draft) return { error: null };
  const [cycle, promptKey] = key.split("/");
  const { data, error } = await supabase
    .from("essay_drafts")
    .upsert(
      { user_id: userId, prompt_key: promptKey, cycle, body: draft.body, word_count: draft.word_count, chosen: draft.chosen, done_at: draft.done_at },
      { onConflict: "user_id,prompt_key,cycle" },
    )
    .select("updated_at")
    .single();
  if (!error && data) {
    const savedAt = (data as { updated_at: string }).updated_at;
    drafts.set((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], saved_at: savedAt } } : prev));
  }
  return { error };
}

function flush() {
  const supabase = getSupabase();
  const userId = readSessionUser()?.id;
  if (supabase && userId) sendQueue(supabase, userId).flush().catch(() => {});
}

// Sends what's waiting and reports whether this draft has reached the account (a review link shares the account's
// copy, 19 → How it works)
export async function draftSaved(cycle: string, promptKey: string): Promise<boolean> {
  const supabase = getSupabase();
  const userId = readSessionUser()?.id;
  if (!supabase || !userId) return false;
  const key = draftKey(cycle, promptKey);
  // A send already on its way makes flush return at once, so look again for a few seconds
  for (let i = 0; i < 10 && queue.get().includes(key); i++) {
    await sendQueue(supabase, userId).flush().catch(() => {});
    if (queue.get().includes(key)) await new Promise((r) => setTimeout(r, 300));
  }
  return !queue.get().includes(key);
}

// Back online: send what's waiting now, without waiting for the next retry
if (typeof window !== "undefined") window.addEventListener("online", flush);

function enqueue(key: string) {
  lastEdit.set(key, ++editCount);
  queue.set((prev) => (prev.includes(key) ? prev : [...prev, key]));
  flush();
}

// Keys whose draft the account replaced with a newer save from another device (17 → Saving)
const replacedListeners = new Set<(keys: string[]) => void>();

export function onDraftsReplaced(listener: (keys: string[]) => void) {
  replacedListeners.add(listener);
  return () => {
    replacedListeners.delete(listener);
  };
}

// Sends what's waiting, then reads the account's drafts and merges them in (lib/essays.ts → mergeDrafts)
async function pullDrafts(supabase: SupabaseClient, userId: string) {
  await sendQueue(supabase, userId).flush();
  const readFrom = editCount;
  const { data, error } = await supabase.from("essay_drafts").select("prompt_key, cycle, body, word_count, chosen, done_at, updated_at");
  if (error || readSessionUser()?.id !== userId) return;
  const pending = (key: string) => queue.get().includes(key) || (lastEdit.get(key) ?? 0) > readFrom;
  const merged = mergeDrafts(drafts.get(), data as AccountDraft[], pending);
  drafts.set(() => merged.drafts);
  if (merged.dropped.length) queue.set((prev) => prev.filter((k) => !merged.dropped.includes(k)));
  if (merged.replaced.length) replacedListeners.forEach((l) => l(merged.replaced));
}

// Saves a change to one draft on this device and queues it for the account. The editor debounces typing.
export function saveDraft(cycle: string, promptKey: string, change: Partial<Pick<Draft, "body" | "chosen" | "done_at">>) {
  const key = draftKey(cycle, promptKey);
  drafts.set((prev) => {
    const before = prev[key];
    const body = change.body ?? before?.body ?? "";
    const next: Draft = {
      body,
      word_count: countWords(body),
      chosen: change.chosen ?? before?.chosen ?? false,
      done_at: change.done_at !== undefined ? change.done_at : (before?.done_at ?? null),
      edited_at: new Date().toISOString(),
      saved_at: before?.saved_at ?? null,
    };
    return { ...prev, [key]: next };
  });
  enqueue(key);
}

// Hooks for the screens

export type EssaysState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; cycle: string | null; prompts: Prompt[]; drafts: Record<string, Draft> };

// The questions for the student's term (or the newest cycle there is), with their drafts. `term` comes from the
// deadlines data (lib/data/deadlines.ts → useTerm), so this file doesn't depend on it.
export function useEssays(term: string | null): EssaysState {
  const loaded = useSyncExternalStore(subscribe, getPrompts, () => LOADING);
  const own = drafts.use();
  useEffect(() => {
    loadEssays();
  }, []);
  return useMemo((): EssaysState => {
    if (loaded.status !== "ok") return loaded;
    const cycle = pickPromptCycle(loaded.prompts, term);
    return { status: "ok", cycle, prompts: loaded.prompts.filter((p) => p.cycle === cycle), drafts: own };
  }, [loaded, own, term]);
}

export type SaveState = "saving" | "saved" | "offline" | null;

const getOffline = () => offline;

// The editor's top bar: "Saving…" while a change is on its way, "Saved on this phone" when the connection is gone,
// "Saved" once the account has it. Null for a question with nothing saved yet.
export function useSaveState(key: string, typing: boolean): SaveState {
  const waiting = queue.use().includes(key);
  const own = drafts.use()[key];
  const isOffline = useSyncExternalStore(subscribe, getOffline, () => false);
  if (typing) return "saving";
  if (!own) return null;
  if (!waiting) return "saved";
  return isOffline || (typeof navigator !== "undefined" && navigator.onLine === false) ? "offline" : "saving";
}

// "{done} of 4 done" for Home's row and the Get ready signal. Null while Essays is off.
export function useEssaysDone(term: string | null): number | null {
  const state = useEssays(term);
  if (!essaysHref()) return null;
  return state.status === "ok" ? progress(state.prompts, state.drafts).done : 0;
}
