import type { SupabaseClient } from "@supabase/supabase-js";
import { REQUIREMENTS_EVENT, REQUIREMENTS_KEY, parseOverrides, type RequirementChange } from "@/lib/requirements";
import { readSlugs, SAVED_EVENT, SAVED_KEY, type SavedChange } from "@/lib/saved";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage";
import { DEMO_MODE } from "@/lib/flags";
import { getSupabase } from "@/lib/supabase/client";

// Keeps a signed-in student's progress in the per-user tables (user_requirement_status, saved_schools).
// Local storage stays the device's copy, so the app works offline: each change is queued, then pushed.
// On sign-in, anything done before signing in is pushed first, then the account's saved progress is pulled down.
// Only records that live in the database sync; demo records (ids like ucd-gpa) stay on this device.

const QUEUE_KEY = "stackd.progressQueue";
const OWNER_KEY = "stackd.progressOwner";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Change = ({ kind: "requirement" } & RequirementChange) | ({ kind: "school" } & SavedChange);

const changeKey = (c: Change) => (c.kind === "requirement" ? `r:${c.id}` : `s:${c.slug}`);

function readQueue(): Change[] {
  try {
    const parsed: unknown = JSON.parse(readStorage(QUEUE_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as Change[]) : [];
  } catch {
    return [];
  }
}

// The latest change per record wins
function enqueue(changes: Change[]) {
  const queue = new Map(readQueue().map((c) => [changeKey(c), c]));
  for (const c of changes) {
    if (c.kind === "requirement" && !UUID.test(c.id)) continue;
    queue.set(changeKey(c), c);
  }
  writeStorage(QUEUE_KEY, JSON.stringify([...queue.values()]));
}

async function institutionIds(supabase: SupabaseClient, slugs: string[]): Promise<Map<string, string>> {
  if (!slugs.length) return new Map();
  const { data, error } = await supabase.from("institutions").select("id, slug").in("slug", slugs);
  if (error) throw error;
  return new Map(data.map((r) => [r.slug as string, r.id as string]));
}

// Pushes queued changes. Stops at the first failure and keeps the rest for next time.
async function flush(supabase: SupabaseClient, userId: string) {
  const queue = readQueue();
  if (!queue.length) return;
  const schools = await institutionIds(supabase, queue.flatMap((c) => (c.kind === "school" ? [c.slug] : [])));
  const left = [...queue];
  for (const c of queue) {
    let error: unknown = null;
    if (c.kind === "requirement") {
      ({ error } = await supabase
        .from("user_requirement_status")
        .upsert({ user_id: userId, requirement_id: c.id, status: c.status }));
      // A requirement that isn't in the database (a foreign-key miss) never will be: drop it
      if (error && (error as { code?: string }).code === "23503") error = null;
    } else {
      const institutionId = schools.get(c.slug);
      // A school that isn't in the database (a demo school) stays on this device only
      if (institutionId) {
        ({ error } = c.saved
          ? await supabase.from("saved_schools").upsert({ user_id: userId, institution_id: institutionId })
          : await supabase.from("saved_schools").delete().match({ user_id: userId, institution_id: institutionId }));
      }
    }
    if (error) break;
    left.shift();
  }
  writeStorage(QUEUE_KEY, JSON.stringify(left));
}

// The account's saved progress replaces this device's copy for every record in the database
async function pull(supabase: SupabaseClient) {
  const [statuses, saved] = await Promise.all([
    supabase.from("user_requirement_status").select("requirement_id, status"),
    supabase.from("saved_schools").select("institutions(slug)"),
  ]);
  if (statuses.error || saved.error) return;

  const overrides = parseOverrides(readStorage(REQUIREMENTS_KEY));
  for (const id of Object.keys(overrides)) if (UUID.test(id)) delete overrides[id];
  for (const row of statuses.data) overrides[row.requirement_id as string] = row.status;
  writeStorage(REQUIREMENTS_KEY, JSON.stringify(overrides));

  const remote = saved.data.flatMap((r) => {
    const inst = r.institutions as { slug: string } | { slug: string }[] | null;
    return (Array.isArray(inst) ? inst : inst ? [inst] : []).map((i) => i.slug);
  });
  const local = readSlugs();
  const inDatabase = await institutionIds(supabase, local).catch(() => new Map<string, string>());
  const deviceOnly = local.filter((slug) => !inDatabase.has(slug));
  writeStorage(SAVED_KEY, JSON.stringify([...new Set([...deviceOnly, ...remote])]));

  window.dispatchEvent(new Event(REQUIREMENTS_EVENT));
  window.dispatchEvent(new Event(SAVED_EVENT));
}

async function onSignedIn(supabase: SupabaseClient, userId: string) {
  const owner = readStorage(OWNER_KEY);
  if (owner && owner !== userId) {
    // Another account's copy: never push it into this one
    [REQUIREMENTS_KEY, SAVED_KEY, QUEUE_KEY].forEach(removeStorage);
  } else if (!owner) {
    // Progress made before signing in moves into this account
    const overrides = parseOverrides(readStorage(REQUIREMENTS_KEY));
    enqueue([
      ...Object.entries(overrides).map(([id, status]) => ({ kind: "requirement" as const, id, status })),
      ...readSlugs().map((slug) => ({ kind: "school" as const, slug, saved: true })),
    ]);
  }
  writeStorage(OWNER_KEY, userId);
  await flush(supabase, userId).catch(() => {});
  await pull(supabase).catch(() => {});
}

// Starts syncing for this page's lifetime. Does nothing in demo mode or without Supabase config.
export function startProgressSync(): () => void {
  const supabase = DEMO_MODE ? null : getSupabase();
  if (!supabase) return () => {};
  let userId: string | null = null;

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    const id = session?.user.id ?? null;
    const signedIn = id && (event === "INITIAL_SESSION" || event === "SIGNED_IN") && id !== userId;
    userId = id;
    // Supabase advises against awaiting its own calls inside this callback, so the work runs next tick
    if (signedIn) setTimeout(() => onSignedIn(supabase, id), 0);
  });

  const onChange = (e: Event) => {
    const detail = (e as CustomEvent<RequirementChange | SavedChange | undefined>).detail;
    if (!detail) return;
    enqueue(["id" in detail ? { kind: "requirement", ...detail } : { kind: "school", ...detail }]);
    if (userId) flush(supabase, userId).catch(() => {});
  };
  window.addEventListener(REQUIREMENTS_EVENT, onChange);
  window.addEventListener(SAVED_EVENT, onChange);

  return () => {
    data.subscription.unsubscribe();
    window.removeEventListener(REQUIREMENTS_EVENT, onChange);
    window.removeEventListener(SAVED_EVENT, onChange);
  };
}
