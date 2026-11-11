import type { ExploreMajor, Statuses, TopicStatus } from "../explore";

// Build my plan (24 → 5): places the student's still-needed major courses and Cal-GETC areas into terms, in order, within
// their unit limit, with the reasons the course sheet shows. No React and no Supabase here, so it can be tested.

export type Season = "spring" | "summer" | "fall";
// "fall-2026", the same format as plan_items.term
export type TermId = `${Season}-${number}`;
export type PlanSystem = "uc" | "cal-state";

// A major course type for the student's systems. Done ones are skipped by the builder.
export type MajorNeed = { topic: string; name: string; systems: PlanSystem[]; sort: number; units: number | null };
// A GE area from ge_areas. courses 0 means it's met inside another area's course (a lab), so it gets no card.
export type GeNeed = { code: string; name: string; sort: number; units: number | null; courses: number | null };
// before_topic is the prerequisite: { topic: "cs2", before_topic: "cs1" } means take cs1 first
export type OrderPair = { topic: string; before_topic: string };

// A plan_items row as the builder sees it. status is null on major items; theirs comes from user_topic_status.
export type PlanItem = {
  id?: string;
  kind: "major" | "ge" | "custom";
  topic: string | null;
  ge_area: string | null;
  term: TermId | null;
  position: number;
  placed_by: "builder" | "student";
  course_code: string | null;
  course_name: string | null;
  // The student's course's units, when they've picked one
  units: number | null;
  status: TopicStatus | null;
};

export type Reason =
  | { kind: "both" }
  | { kind: "needed-before"; topic: string }
  | { kind: "ge-area"; code: string }
  | { kind: "fits"; term: TermId; limit: number }
  | { kind: "taking-now" }
  | { kind: "you-moved-it" };

export type PlacedItem = Omit<PlanItem, "units"> & {
  key: string;
  // The student's course's units, null when they haven't picked one
  chosenUnits: number | null;
  // What the card counts: the chosen course, else the pathway or area, else 4 or 3
  units: number;
  unitsEstimated: boolean;
  // Done, taking now or not yet, from user_topic_status for major items
  progress: TopicStatus;
  reasons: Reason[];
};

export type BuildInput = {
  majors: MajorNeed[];
  geAreas: GeNeed[];
  statuses: Statuses;
  items: PlanItem[];
  // From planTerms; the first is the term the student is in or registering for
  terms: TermId[];
  unitLimit: number;
  order: OrderPair[];
};

export type BuildResult = {
  // Every item in the plan: done ones as they were, the rest placed. term null is Not in a term yet.
  items: PlacedItem[];
  // Items the builder couldn't fit
  doesntFit: number;
  // Prerequisites that aren't in the plan and aren't done. The builder doesn't wait for them; the card says
  // "Needs {name} first, or placement".
  outsidePrereqs: OrderPair[];
};

export const DEFAULT_MAJOR_UNITS = 4;
export const DEFAULT_GE_UNITS = 3;

const SEASONS: Season[] = ["spring", "summer", "fall"];

function parseTerm(id: TermId): { season: Season; year: number } {
  const [season, year] = id.split("-");
  return { season: season as Season, year: Number(year) };
}

const termIndex = (id: TermId) => {
  const { season, year } = parseTerm(id);
  return year * 3 + SEASONS.indexOf(season);
};

function nextTerm(id: TermId): TermId {
  const { season, year } = parseTerm(id);
  return season === "fall" ? `spring-${year + 1}` : `${SEASONS[SEASONS.indexOf(season) + 1]}-${year}`;
}

// The term a date falls in: January to May is spring, June and July summer, August to December fall (24 → 6)
export function currentTerm(date: Date): TermId {
  const month = date.getMonth();
  const season: Season = month <= 4 ? "spring" : month <= 6 ? "summer" : "fall";
  return `${season}-${date.getFullYear()}`;
}

// The plan's terms: from the current term to the one before the transfer term. Summers only when the student turns
// them on, so a current summer with summers off starts at the fall.
export function planTerms(current: TermId, transfer: TermId, includeSummer: boolean): TermId[] {
  const terms: TermId[] = [];
  for (let t = current; termIndex(t) < termIndex(transfer); t = nextTerm(t)) {
    if (includeSummer || parseTerm(t).season !== "summer") terms.push(t);
  }
  return terms;
}

// A major's course types for the student's systems, from Explore's pathways. A topic in both keeps the UC row's name and
// sort and the larger of the two rows' units.
export function majorNeeds(major: ExploreMajor, systems: PlanSystem[]): MajorNeed[] {
  const needs = new Map<string, MajorNeed>();
  const add = (system: PlanSystem, pathway: ExploreMajor["uc"]) => {
    if (!pathway || !systems.includes(system)) return;
    for (const r of pathway.requirements) {
      const units = r.units === null ? null : Number(r.units);
      const had = needs.get(r.topic);
      if (!had) needs.set(r.topic, { topic: r.topic, name: r.name, systems: [system], sort: r.sort, units });
      else {
        had.systems.push(system);
        if (units !== null && (had.units === null || units > had.units)) had.units = units;
      }
    }
  };
  add("uc", major.uc);
  add("cal-state", major.calState);
  return [...needs.values()];
}

const keyOf = (item: Pick<PlanItem, "kind" | "topic" | "ge_area" | "id">, i: number) =>
  item.kind === "major" ? `major:${item.topic}` : item.kind === "ge" ? `ge:${item.ge_area}` : `custom:${item.id ?? i}`;

// Longest chain of prerequisites under each topic, so earlier courses sort first. A loop stops counting where it repeats.
function depths(order: OrderPair[]): Map<string, number> {
  const before = new Map<string, string[]>();
  for (const p of order) before.set(p.topic, [...(before.get(p.topic) ?? []), p.before_topic]);
  const memo = new Map<string, number>();
  const depth = (t: string, open: Set<string>): number => {
    if (memo.has(t)) return memo.get(t)!;
    if (open.has(t)) return 0;
    open.add(t);
    const d = Math.max(0, ...(before.get(t) ?? []).map((b) => depth(b, open) + 1));
    open.delete(t);
    memo.set(t, d);
    return d;
  };
  for (const t of before.keys()) depth(t, new Set());
  return memo;
}

export function buildPlan(input: BuildInput): BuildResult {
  const { majors, statuses, terms, unitLimit, order } = input;
  const geAreas = input.geAreas.filter((g) => g.courses !== 0);
  const current = terms[0] ?? null;
  const inTerms = (t: TermId | null): t is TermId => t !== null && terms.includes(t);
  const majorByTopic = new Map(majors.map((m) => [m.topic, m]));
  const geByCode = new Map(geAreas.map((g) => [g.code, g]));
  const statusOf = (item: PlanItem): TopicStatus =>
    (item.kind === "major" ? statuses[item.topic ?? ""] : item.status) ?? "not_started";
  const done = (topic: string) => statuses[topic] === "done";

  const existing = new Map(input.items.map((item, i) => [keyOf(item, i), item]));
  const blank = (kind: "major" | "ge", topic: string | null, ge: string | null): PlanItem => ({
    kind, topic, ge_area: ge, term: null, position: 0, placed_by: "builder", course_code: null, course_name: null, units: null,
    status: kind === "ge" ? "not_started" : null,
  });

  const unitsOf = (item: PlanItem): { units: number; estimated: boolean } => {
    if (item.units !== null) return { units: Number(item.units), estimated: false };
    const from = item.kind === "major" ? majorByTopic.get(item.topic ?? "")?.units : item.kind === "ge" ? geByCode.get(item.ge_area ?? "")?.units : null;
    if (from !== null && from !== undefined) return { units: Number(from), estimated: false };
    return { units: item.kind === "ge" ? DEFAULT_GE_UNITS : DEFAULT_MAJOR_UNITS, estimated: true };
  };

  // Every item the plan holds: the student's items, plus a fresh one for each need without one. Major and GE items
  // that are no longer needed (a new major, an area gone from the data) drop out unless they're done.
  const all: { key: string; item: PlanItem }[] = [];
  input.items.forEach((item, i) => {
    const key = keyOf(item, i);
    if (item.kind === "major" && !majorByTopic.has(item.topic ?? "") && !done(item.topic ?? "")) return;
    if (item.kind === "ge" && !geByCode.has(item.ge_area ?? "") && item.status !== "done") return;
    all.push({ key, item });
  });
  for (const m of majors) if (!existing.has(`major:${m.topic}`) && !done(m.topic)) all.push({ key: `major:${m.topic}`, item: blank("major", m.topic, null) });
  for (const g of geAreas) if (!existing.has(`ge:${g.code}`)) all.push({ key: `ge:${g.code}`, item: blank("ge", null, g.code) });

  // Where each item ends up, and why
  const placed = new Map<string, { term: TermId | null; placedBy: PlanItem["placed_by"]; reasons: Reason[] }>();
  const load = new Map<TermId, number>(terms.map((t) => [t, 0]));
  const addLoad = (term: TermId | null, item: PlanItem) => {
    if (term !== null && load.has(term)) load.set(term, load.get(term)! + unitsOf(item).units);
  };

  const toPlace: { key: string; item: PlanItem }[] = [];
  for (const a of all) {
    const { item, key } = a;
    const status = statusOf(item);
    if (status === "done") continue;
    if (item.kind === "custom") {
      // The builder leaves custom courses where they are
      const term = inTerms(item.term) ? item.term : null;
      placed.set(key, { term, placedBy: "student", reasons: [] });
      addLoad(term, item);
    } else if (status === "in_progress" && current) {
      placed.set(key, { term: current, placedBy: item.placed_by, reasons: [{ kind: "taking-now" }] });
      addLoad(current, item);
    } else if (item.placed_by === "student" && (item.term === null || inTerms(item.term))) {
      // Kept where the student put it, Not in a term yet included. A term that left the plan is placed again.
      placed.set(key, { term: item.term, placedBy: "student", reasons: [{ kind: "you-moved-it" }] });
      addLoad(item.term, item);
    } else toPlace.push(a);
  }

  // Course types in the plan, and the prerequisites that aren't
  const planTopics = new Set(all.filter((a) => a.item.kind === "major").map((a) => a.item.topic!));
  const beforeOf = (topic: string) => order.filter((p) => p.topic === topic).map((p) => p.before_topic);
  const outsidePrereqs: OrderPair[] = [];
  for (const a of all) {
    if (a.item.kind !== "major" || statusOf(a.item) === "done") continue;
    for (const b of beforeOf(a.item.topic!)) {
      if (!planTopics.has(b) && !done(b)) outsidePrereqs.push({ topic: a.item.topic!, before_topic: b });
    }
  }

  // Counts for both first, then the rest of the major, then GE; within each, earlier courses first, then the pathway's order
  const depth = depths(order);
  const rank = (item: PlanItem) => {
    if (item.kind === "ge") return [2, 0, geByCode.get(item.ge_area!)?.sort ?? 0];
    const need = majorByTopic.get(item.topic!);
    return [need && need.systems.length > 1 ? 0 : 1, depth.get(item.topic!) ?? 0, need?.sort ?? 0];
  };
  toPlace.sort((a, b) => {
    const ra = rank(a.item);
    const rb = rank(b.item);
    return ra[0] - rb[0] || ra[1] - rb[1] || ra[2] - rb[2];
  });

  const byTopic = new Map(all.filter((a) => a.item.kind === "major").map((a) => [a.item.topic!, a]));
  const pending = new Set(toPlace.map((a) => a.key));
  const placing = new Set<string>();

  // Places one item, placing its prerequisites first when they're waiting too
  const place = (a: { key: string; item: PlanItem }) => {
    if (placed.has(a.key) || placing.has(a.key)) return;
    placing.add(a.key);
    let earliest = 0;
    let blocked = false;
    if (a.item.kind === "major") {
      for (const b of beforeOf(a.item.topic!)) {
        if (done(b) || !planTopics.has(b)) continue;
        const prereq = byTopic.get(b)!;
        if (pending.has(prereq.key)) place(prereq);
        const at = placed.get(prereq.key)?.term ?? null;
        // A prerequisite caught in a loop, or one that didn't fit, holds this one back too
        if (at === null || !terms.includes(at)) blocked = true;
        else earliest = Math.max(earliest, terms.indexOf(at) + 1);
      }
    }
    const units = unitsOf(a.item).units;
    const term = blocked ? undefined : terms.slice(earliest).find((t) => load.get(t)! + units <= unitLimit);
    const reasons: Reason[] = term ? [{ kind: "fits", term, limit: unitLimit }] : [];
    placed.set(a.key, { term: term ?? null, placedBy: "builder", reasons });
    if (term) load.set(term, load.get(term)! + units);
    placing.delete(a.key);
  };
  for (const a of toPlace) place(a);

  // The reasons every item shares: counts for both, the GE area, and the next course it's needed before
  const needs = (topic: string) => all.find((a) => a.item.kind === "major" && statusOf(a.item) !== "done" && beforeOf(a.item.topic!).includes(topic));
  const sharedReasons = (item: PlanItem): Reason[] => {
    if (item.kind === "ge") return [{ kind: "ge-area", code: item.ge_area! }];
    if (item.kind !== "major") return [];
    const out: Reason[] = [];
    if ((majorByTopic.get(item.topic!)?.systems.length ?? 0) > 1) out.push({ kind: "both" });
    const next = needs(item.topic!);
    if (next) out.push({ kind: "needed-before", topic: next.item.topic! });
    return out;
  };

  // Positions: kept items first in the order the student had them, then the builder's in the order it placed them
  const items: PlacedItem[] = [];
  const nextPosition = new Map<TermId | null, number>();
  const kept = all.filter((a) => placed.has(a.key) && !pending.has(a.key)).sort((a, b) => a.item.position - b.item.position);
  for (const a of [...kept, ...toPlace]) {
    const p = placed.get(a.key)!;
    const position = nextPosition.get(p.term) ?? 0;
    nextPosition.set(p.term, position + 1);
    const { units, estimated } = unitsOf(a.item);
    const head = p.reasons.filter((r) => r.kind === "taking-now" || r.kind === "you-moved-it");
    const tail = p.reasons.filter((r) => r.kind === "fits");
    items.push({
      ...a.item, key: a.key, term: p.term, position, placed_by: p.placedBy, chosenUnits: a.item.units, units, unitsEstimated: estimated,
      progress: statusOf(a.item), reasons: [...head, ...sharedReasons(a.item), ...tail].slice(0, 3),
    });
  }
  // Done items stay as they were
  for (const a of all.filter((a) => statusOf(a.item) === "done")) {
    const { units, estimated } = unitsOf(a.item);
    items.push({ ...a.item, key: a.key, chosenUnits: a.item.units, units, unitsEstimated: estimated, progress: "done", reasons: [] });
  }

  return {
    items,
    doesntFit: toPlace.filter((a) => placed.get(a.key)!.term === null).length,
    outsidePrereqs,
  };
}
