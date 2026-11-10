import { useEffect, useSyncExternalStore } from "react";
import { exploreHref } from "@/lib/features";
import type { Opportunity } from "@/lib/opportunities";
import { readStorage, writeStorage } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase/client";

// Opportunities (22). Row-level security returns only verified rows. This device keeps a copy, so the screens draw at
// once; everyone reads the same rows, so the copy isn't per account.

const KEY = "stackd.opportunities";

export type OpportunitiesState = { status: "loading" } | { status: "error" } | { status: "ok"; rows: Opportunity[] };

const LOADING: OpportunitiesState = { status: "loading" };
const FAILED: OpportunitiesState = { status: "error" };

function cached(): OpportunitiesState | null {
  try {
    const stored = JSON.parse(readStorage(KEY) ?? "null") as { rows?: Opportunity[] } | null;
    return stored?.rows ? { status: "ok", rows: stored.rows } : null;
  } catch {
    return null;
  }
}

let state: OpportunitiesState | null = null;
const listeners = new Set<() => void>();

function setState(next: OpportunitiesState) {
  state = next;
  listeners.forEach((l) => l());
}

function getState(): OpportunitiesState {
  // Development only: localStorage stackd.dev.opportunities = "loading" or "error" shows those states
  if (process.env.NODE_ENV !== "production") {
    const forced = readStorage("stackd.dev.opportunities");
    if (forced === "loading") return LOADING;
    if (forced === "error") return FAILED;
  }
  if (!state) state = cached() ?? LOADING;
  return state;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

async function fetchRows(): Promise<Opportunity[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase isn't configured");
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      "id, slug, kind, title, org_name, summary, who_for, wants, offers, audience, major_slugs, systems, terms, deadline, starts_on, ends_on, location, online, cost, url, source_name, source_url, verified_at",
    )
    .eq("verification_status", "verified")
    .eq("is_demo", false);
  if (error) throw error;
  return data as Opportunity[];
}

let loading: Promise<void> | null = null;
let loaded = false;

// Once per app launch (again with `force`). A failed read keeps the copy already on screen.
export function loadOpportunities(force = false) {
  if (!exploreHref() || loading || (loaded && !force)) return;
  loading = fetchRows()
    .then((rows) => {
      writeStorage(KEY, JSON.stringify({ rows }));
      setState({ status: "ok", rows });
      loaded = true;
    })
    .catch(() => {
      if (getState().status !== "ok") setState(FAILED);
    })
    .finally(() => {
      loading = null;
    });
}

export function retryOpportunities() {
  if (getState().status !== "ok") setState(LOADING);
  loadOpportunities(true);
}

export function useOpportunities(): OpportunitiesState {
  const current = useSyncExternalStore(subscribe, getState, () => LOADING);
  useEffect(() => loadOpportunities(), []);
  return current;
}

// The current state outside React, for the reminders
export const readOpportunities = getState;
export const subscribeOpportunities = subscribe;
