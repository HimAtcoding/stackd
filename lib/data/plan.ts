import { useEffect, useSyncExternalStore } from "react";
import { readSessionUser } from "@/lib/profile";
import { readStorage, removeStorage, writeStorage } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase/client";

// The student's plan (10): their home college and the schools they want, each with a major, in the order chosen.
// It lives in the account (profiles, user_targets). This device keeps a copy so Home can draw before the network answers.

export type PlanTarget = {
  institutionId: string;
  slug: string;
  name: string;
  majorId: string | null;
  majorName: string | null;
  degreeType: string | null;
  // With no major: true when the student chose "Not listed yet", false when they haven't picked one
  majorNotListed: boolean;
};

export type Plan = {
  firstName: string | null;
  home: { id: string; slug: string; name: string } | null;
  targets: PlanTarget[];
};

export type PlanState = { status: "loading" } | { status: "error" } | { status: "ok"; plan: Plan };

// The device's copy, tagged with the account it belongs to. Cleared at sign-out with the other per-account keys.
export const PLAN_KEY = "stackd.plan";

const LOADING: PlanState = { status: "loading" };
const FAILED: PlanState = { status: "error" };

type ProfileRow = { first_name: string | null; home: { id: string; slug: string; name: string } | null };
type TargetRow = {
  major_not_listed: boolean | null;
  institution: { id: string; slug: string; name: string } | null;
  major: { id: string; name: string; degree_type: string | null } | null;
};

// The account's plan, straight from the database. Row-level security returns only the student's own rows.
export async function fetchPlan(): Promise<Plan> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase isn't configured");
  const [profile, targets] = await Promise.all([
    supabase.from("profiles").select("first_name, home:institutions!home_institution_id(id, slug, name)").maybeSingle(),
    supabase
      .from("user_targets")
      .select("major_not_listed, institution:institutions!institution_id(id, slug, name), major:majors!major_id(id, name, degree_type)")
      .order("position"),
  ]);
  if (profile.error) throw profile.error;
  if (targets.error) throw targets.error;
  const p = profile.data as unknown as ProfileRow | null;
  return {
    firstName: p?.first_name ?? null,
    home: p?.home ?? null,
    targets: (targets.data as unknown as TargetRow[]).flatMap((t) =>
      t.institution
        ? [
            {
              institutionId: t.institution.id,
              slug: t.institution.slug,
              name: t.institution.name,
              majorId: t.major?.id ?? null,
              majorName: t.major?.name ?? null,
              degreeType: t.major?.degree_type ?? null,
              majorNotListed: !t.major && t.major_not_listed === true,
            },
          ]
        : [],
    ),
  };
}

function readCached(userId: string): Plan | null {
  try {
    const stored = JSON.parse(readStorage(PLAN_KEY) ?? "null") as { userId?: string; plan?: Plan } | null;
    return stored?.userId === userId && stored.plan ? stored.plan : null;
  } catch {
    return null;
  }
}

// One shared copy for every screen, tagged with its account so another student never sees it
let current: { userId: string | null; state: PlanState } | null = null;
const listeners = new Set<() => void>();

function getState(): PlanState {
  const userId = readSessionUser()?.id ?? null;
  if (!current || current.userId !== userId) {
    const cached = userId ? readCached(userId) : null;
    current = { userId, state: cached ? { status: "ok", plan: cached } : LOADING };
  }
  return current.state;
}

function setState(userId: string | null, state: PlanState) {
  current = { userId, state };
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

// Reads the plan again. A failed read keeps whatever copy is already on screen.
export async function refreshPlan(): Promise<void> {
  const userId = readSessionUser()?.id ?? null;
  if (!userId) return;
  try {
    const plan = await fetchPlan();
    if (readSessionUser()?.id !== userId) return;
    writeStorage(PLAN_KEY, JSON.stringify({ userId, plan }));
    setState(userId, { status: "ok", plan });
  } catch {
    if (getState().status !== "ok") setState(userId, FAILED);
  }
}

// "Try again" after a failed load
export function retryPlan() {
  setState(readSessionUser()?.id ?? null, LOADING);
  refreshPlan();
}

// Forgets this device's copy (sign-out, account deleted)
export function clearPlan() {
  removeStorage(PLAN_KEY);
  current = null;
  listeners.forEach((l) => l());
}

// The plan for Home and Settings: the device's copy at once, then the account's.
export function usePlan(): PlanState {
  const state = useSyncExternalStore(subscribe, getState, () => LOADING);
  useEffect(() => {
    refreshPlan();
  }, []);
  return state;
}

export type PlanChange = {
  // Present to set the home college; id null means "My college isn't listed"
  home?: { id: string | null };
  // Present to replace the target schools, in order. With a null major, majorNotListed says the student chose
  // "Not listed yet"; otherwise they haven't picked one.
  targets?: { institutionId: string; majorId: string | null; majorNotListed: boolean }[];
};

// Saves through save_plan (supabase/migrations), which applies all of it or none of it. False when it didn't save.
export async function savePlan(change: PlanChange): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.rpc("save_plan", {
      p_home_institution_id: change.home?.id ?? null,
      p_update_home: change.home !== undefined,
      p_targets: change.targets
        ? change.targets.map((t) => ({ institution_id: t.institutionId, major_id: t.majorId, major_not_listed: t.majorNotListed }))
        : null,
    });
    if (error) return false;
  } catch {
    return false;
  }
  await refreshPlan();
  return true;
}
