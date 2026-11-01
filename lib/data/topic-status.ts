import { useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { accountStore } from "@/lib/account-store";
import type { Statuses, TopicStatus } from "@/lib/explore";
import { readSessionUser } from "@/lib/profile";
import { getSupabase } from "@/lib/supabase/client";
import { createMarkQueue, mergeFromAccount, type PushError } from "./mark-queue";

// The student's status per course type (21 → One status per course type), in user_topic_status. This device keeps a
// copy, so a tap shows at once; changes are saved here first and then sent to the account, like deadline marks.

export const TOPIC_STATUS_KEY = "stackd.topicStatus";
// Topics still waiting to reach the account (cleared at sign-out with the other per-account keys)
export const TOPIC_QUEUE_KEY = "stackd.topicQueue";

const NONE: Statuses = {};
const NO_QUEUE: string[] = [];

const statuses = accountStore(TOPIC_STATUS_KEY, NONE);
const queue = accountStore(TOPIC_QUEUE_KEY, NO_QUEUE);

// Every change gets the next number, so a read of the account can tell which were made while it was running
let editCount = 0;
const lastEdit = new Map<string, number>();

let sending: { userId: string; queue: ReturnType<typeof createMarkQueue> } | null = null;

// Not started is the absence of a row
function push(supabase: SupabaseClient, userId: string, topic: string) {
  const status = statuses.get()[topic];
  return status ? supabase.from("user_topic_status").upsert({ user_id: userId, topic, status }) : supabase.from("user_topic_status").delete().match({ user_id: userId, topic });
}

function sendQueue(supabase: SupabaseClient, userId: string) {
  if (sending?.userId === userId) return sending.queue;
  sending?.queue.stop();
  const next = createMarkQueue({
    keys: queue.get,
    remove: (key) => queue.set((prev) => prev.filter((k) => k !== key)),
    snapshot: (key) => JSON.stringify(statuses.get()[key] ?? null),
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

// Sends what's queued, then reads the account. Anything still waiting, or changed during the read, keeps this device's value.
async function sync(supabase: SupabaseClient, userId: string) {
  await sendQueue(supabase, userId).flush();
  const readFrom = editCount;
  const { data, error } = await supabase.from("user_topic_status").select("topic, status");
  if (error || readSessionUser()?.id !== userId) return;
  const account = Object.fromEntries((data as { topic: string; status: TopicStatus }[]).map((r) => [r.topic, r.status]));
  statuses.set((device) => mergeFromAccount(account, device, (topic) => queue.get().includes(topic) || (lastEdit.get(topic) ?? 0) > readFrom));
}

let syncing: Promise<void> | null = null;
let syncedFor: string | null = null;

// Once per app launch and account
function loadStatuses() {
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

export function useTopicStatus(): Statuses {
  useEffect(loadStatuses, []);
  return statuses.use();
}

export function setTopicStatus(topic: string, status: TopicStatus) {
  statuses.set((prev) => {
    const next = { ...prev };
    if (status === "not_started") delete next[topic];
    else next[topic] = status;
    return next;
  });
  lastEdit.set(topic, ++editCount);
  queue.set((prev) => (prev.includes(topic) ? prev : [...prev, topic]));
  const supabase = getSupabase();
  const userId = readSessionUser()?.id;
  if (supabase && userId) sendQueue(supabase, userId).flush().catch(() => {});
}
