import { useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { accountStore } from "@/lib/account-store";
import type { TopicStatus } from "@/lib/explore";
import type { TermId } from "@/lib/plan/build";
import { DEFAULT_SETTINGS, type PlanSettings, type StoredItem } from "@/lib/plan/view";
import { readSessionUser } from "@/lib/profile";
import { getSupabase } from "@/lib/supabase/client";
import { createMarkQueue, type PushError } from "./mark-queue";

// The student's term-by-term plan (24): plan_items and plan_settings. This device keeps a copy, so a move shows at
// once; changes are saved here first and then sent to the account, like course statuses.

export const COURSE_PLAN_KEY = "stackd.coursePlan";
// Items and settings still waiting to reach the account (cleared at sign-out with the other per-account keys)
export const COURSE_PLAN_QUEUE_KEY = "stackd.coursePlanQueue";

export type CoursePlan = { items: StoredItem[]; settings: PlanSettings };

const EMPTY: CoursePlan = { items: [], settings: DEFAULT_SETTINGS };
const NO_QUEUE: string[] = [];

const plan = accountStore(COURSE_PLAN_KEY, EMPTY);
const queue = accountStore(COURSE_PLAN_QUEUE_KEY, NO_QUEUE);

const ITEM_COLUMNS = "id, kind, topic, ge_area, term, position, placed_by, college_course_id, course_code, course_name, units, status";

// Queue keys: "settings", or "i:{id}" for one item (deleted when it's no longer in the plan)
const itemKey = (id: string) => `i:${id}`;

let editCount = 0;
const lastEdit = new Map<string, number>();

function push(supabase: SupabaseClient, userId: string, key: string) {
  if (key === "settings") return supabase.from("plan_settings").upsert({ user_id: userId, ...plan.get().settings });
  const id = key.slice(2);
  const item = plan.get().items.find((i) => i.id === id);
  if (!item) return supabase.from("plan_items").delete().match({ id });
  // One item per topic and per area: an item made on another device for the same one takes this device's id
  const onConflict = item.kind === "major" ? "user_id,topic" : item.kind === "ge" ? "user_id,ge_area" : "id";
  return supabase.from("plan_items").upsert({ ...item, user_id: userId }, { onConflict });
}

let sending: { userId: string; queue: ReturnType<typeof createMarkQueue> } | null = null;

function sendQueue(supabase: SupabaseClient, userId: string) {
  if (sending?.userId === userId) return sending.queue;
  sending?.queue.stop();
  const next = createMarkQueue({
    keys: queue.get,
    remove: (key) => queue.set((prev) => prev.filter((k) => k !== key)),
    snapshot: (key) =>
      key === "settings" ? JSON.stringify(plan.get().settings) : JSON.stringify(plan.get().items.find((i) => itemKey(i.id) === key) ?? null),
    send: async (key) => {
      try {
        const { error } = await push(supabase, userId, key);
        return { error: error as PushError };
      } catch (e) {
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

function enqueue(keys: string[]) {
  for (const k of keys) lastEdit.set(k, ++editCount);
  queue.set((prev) => [...prev, ...keys.filter((k) => !prev.includes(k))]);
  const supabase = getSupabase();
  const userId = readSessionUser()?.id;
  if (supabase && userId) sendQueue(supabase, userId).flush().catch(() => {});
}

// Sends what's queued, then reads the account. Anything still waiting, or changed during the read, keeps this device's copy.
async function sync(supabase: SupabaseClient, userId: string) {
  await sendQueue(supabase, userId).flush();
  const readFrom = editCount;
  const [items, settings] = await Promise.all([
    supabase.from("plan_items").select(ITEM_COLUMNS),
    supabase.from("plan_settings").select("units_per_term, include_summer, units_done").maybeSingle(),
  ]);
  if (items.error || settings.error || readSessionUser()?.id !== userId) return;
  const keep = (key: string) => queue.get().includes(key) || (lastEdit.get(key) ?? 0) > readFrom;
  const account = (items.data as StoredItem[]).map((i) => ({ ...i, units: i.units === null ? null : Number(i.units) }));
  plan.set((device) => {
    const merged = new Map<string, StoredItem>();
    for (const i of account) if (!keep(itemKey(i.id))) merged.set(i.id, i);
    for (const i of device.items) if (keep(itemKey(i.id))) merged.set(i.id, i);
    // Deleted here and still waiting: not brought back
    for (const k of queue.get()) if (k.startsWith("i:") && !device.items.some((i) => itemKey(i.id) === k)) merged.delete(k.slice(2));
    const s = settings.data as PlanSettings | null;
    return {
      items: [...merged.values()],
      settings: keep("settings") || !s ? device.settings : { ...s, units_done: s.units_done === null ? null : Number(s.units_done) },
    };
  });
}

let syncing: Promise<void> | null = null;
let syncedFor: string | null = null;

// Once per app launch and account
export function loadCoursePlan() {
  const supabase = getSupabase();
  const userId = readSessionUser()?.id;
  if (!supabase || !userId || syncing || syncedFor === userId) return;
  syncing = sync(supabase, userId)
    .then(() => {
      syncedFor = userId;
    })
    .catch(() => {})
    .finally(() => {
      syncing = null;
    });
}

export function useCoursePlan(): CoursePlan {
  useEffect(loadCoursePlan, []);
  return plan.use();
}

export const readCoursePlan = plan.get;

// Saves the plan's items: `changed` are written, `removed` deleted. The screen shows the new copy at once.
export function saveItems(items: StoredItem[], changed: StoredItem[], removed: string[] = []) {
  plan.set((prev) => ({ ...prev, items }));
  enqueue([...changed.map((i) => itemKey(i.id)), ...removed.map(itemKey)]);
}

export function updateItem(id: string, change: Partial<StoredItem>, fallback?: StoredItem) {
  const items = plan.get().items;
  const had = items.find((i) => i.id === id) ?? fallback;
  if (!had) return;
  const next = { ...had, ...change };
  saveItems([...items.filter((i) => i.id !== id), next], [next]);
}

export function setItemStatus(item: StoredItem, status: TopicStatus) {
  updateItem(item.id, { status }, item);
}

export function saveSettings(change: Partial<PlanSettings>) {
  plan.set((prev) => ({ ...prev, settings: { ...prev.settings, ...change } }));
  enqueue(["settings"]);
}

// A custom course the student types, at the end of a term (24 → 5, Custom courses)
export function addCustomCourse(fields: { code: string | null; name: string; units: number; term: TermId | null }) {
  const items = plan.get().items;
  const position = items.filter((i) => i.term === fields.term).length;
  const item: StoredItem = {
    id: crypto.randomUUID(), kind: "custom", topic: null, ge_area: null, term: fields.term, position, placed_by: "student",
    college_course_id: null, course_code: fields.code, course_name: fields.name, units: fields.units, status: "not_started",
  };
  saveItems([...items, item], [item]);
  return item;
}

// A course code the student typed, saved for us to check against their college's catalog. One try: a lost one only
// means a later check misses it.
export async function suggestCourse(fields: { collegeId: string; topic: string | null; geArea: string | null; code: string; units: number | null }) {
  const supabase = getSupabase();
  const userId = readSessionUser()?.id;
  if (!supabase || !userId) return;
  try {
    await supabase.from("course_suggestions").insert({
      user_id: userId, institution_id: fields.collegeId, topic: fields.topic, ge_area: fields.geArea, course_code: fields.code, units: fields.units,
    });
  } catch {}
}
