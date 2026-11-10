import { useEffect, useMemo, useSyncExternalStore } from "react";
import { buildMajors, type CampusRecord, type ExploreMajor, type ExploreRecords, type PathwayRow, type RequirementRecord } from "@/lib/explore";
import { exploreHref } from "@/lib/features";
import { collegeShortName } from "@/lib/format";
import { readStorage, writeStorage } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase/client";
import { preload, useLoaded } from "@/lib/use-loaded";
import type { Plan } from "./plan";
import { getAgreementLink } from "./university";

// Explore's majors (21). Row-level security returns a major's rows only when every row behind it is verified, so
// reopening one row hides the whole major. This device keeps a copy, so the screens draw at once.

// Not per account: everyone reads the same rows
const RECORDS_KEY = "stackd.exploreRecords";

export type ExploreState = { status: "loading" } | { status: "error" } | { status: "ok"; records: ExploreRecords };

const LOADING: ExploreState = { status: "loading" };
const FAILED: ExploreState = { status: "error" };

function cached(): ExploreState | null {
  try {
    const stored = JSON.parse(readStorage(RECORDS_KEY) ?? "null") as { records?: ExploreRecords } | null;
    return stored?.records ? { status: "ok", records: stored.records } : null;
  } catch {
    return null;
  }
}

let state: ExploreState | null = null;
const listeners = new Set<() => void>();

function setState(next: ExploreState) {
  state = next;
  listeners.forEach((l) => l());
}

function getState(): ExploreState {
  // Development only: localStorage stackd.dev.explore = "loading" or "error" shows those states
  if (process.env.NODE_ENV !== "production") {
    const forced = readStorage("stackd.dev.explore");
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

async function fetchRecords(): Promise<ExploreRecords> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase isn't configured");
  const [p, r, c] = await Promise.all([
    supabase
      .from("pathways")
      .select("id, slug, kind, name, code, revision, major_units, total_units, source_name, source_url, verified_at")
      .eq("verification_status", "verified")
      .eq("is_demo", false),
    supabase
      .from("pathway_requirements")
      .select("id, pathway_id, code, sort, topic, name, description, how_many, units, c_id, options")
      .eq("verification_status", "verified")
      .eq("is_demo", false),
    supabase
      .from("pathway_campuses")
      .select("pathway_id, major_names, institution:institutions!institution_id(id, slug, name, abbreviation)")
      .eq("verification_status", "verified")
      .eq("is_demo", false),
  ]);
  if (p.error) throw p.error;
  if (r.error) throw r.error;
  if (c.error) throw c.error;
  return { pathways: p.data as PathwayRow[], requirements: r.data as RequirementRecord[], campuses: c.data as unknown as CampusRecord[] };
}

let loading: Promise<void> | null = null;
let loaded = false;

// Once per app launch (again with `force`). A failed read keeps the copy already on screen.
export function loadExplore(force = false) {
  if (!exploreHref() || loading || (loaded && !force)) return;
  loading = fetchRecords()
    .then((records) => {
      writeStorage(RECORDS_KEY, JSON.stringify({ records }));
      setState({ status: "ok", records });
      loaded = true;
    })
    .catch(() => {
      if (getState().status !== "ok") setState(FAILED);
    })
    .finally(() => {
      loading = null;
    });
}

export function retryExplore() {
  if (getState().status !== "ok") setState(LOADING);
  loadExplore(true);
}

export type MajorsState = { status: "loading" } | { status: "error" } | { status: "ok"; majors: ExploreMajor[] };

export function useMajors(): MajorsState {
  const records = useSyncExternalStore(subscribe, getState, () => LOADING);
  useEffect(() => loadExplore(), []);
  return useMemo(() => (records.status === "ok" ? { status: "ok", majors: buildMajors(records.records) } : records), [records]);
}

export type PlanAgreement = { url: string; academicYear: string; college: string | null };

// The read behind a major's agreement: their college → the first UC in the plan with one on record. Null with nothing to read.
function agreementRead(plan: Plan | null, slug: string) {
  const home = plan?.home ?? null;
  const targets = plan?.targets.filter((t) => t.exploreSlug === slug && t.majorId && t.system?.toUpperCase() === "UC") ?? [];
  if (!home || targets.length === 0) return null;
  return {
    key: `agreement:${home.id}:${targets.map((t) => t.majorId).join(",")}`,
    load: async () => {
      for (const t of targets) {
        const found = await getAgreementLink({ collegeId: home.id, universityId: t.institutionId, majorId: t.majorId! });
        if (found) return found;
      }
      return null;
    },
  };
}

// The student's own agreement for this major (21)
export function useAgreement(plan: Plan | null, slug: string): PlanAgreement | null {
  const read = agreementRead(plan, slug);
  const [link] = useLoaded(read?.key ?? null, () => read?.load() ?? Promise.resolve(null));
  const home = plan?.home;
  return link.status === "ok" && link.data && home ? { ...link.data, college: collegeShortName(home.name) } : null;
}

// Reads the agreement for each major in the plan, so Explore and the major page open with it
export function preloadAgreements(plan: Plan) {
  for (const slug of new Set(plan.targets.map((t) => t.exploreSlug))) {
    const read = slug ? agreementRead(plan, slug) : null;
    if (read) preload(read.key, read.load);
  }
}
