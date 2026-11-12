import type { PlanTarget } from "../data/plan";
import type { ExploreMajor, Statuses, TopicStatus } from "../explore";
import {
  buildPlan,
  DEFAULT_GE_UNITS,
  DEFAULT_MAJOR_UNITS,
  majorNeeds,
  type BuildInput,
  type GeNeed,
  type MajorNeed,
  type OrderPair,
  type PlanItem,
  type PlanSystem,
  type TermId,
} from "./build";
import { planWarnings, termLabel, type CardLine, type TermHeader } from "./warnings";

// What the Plan tab draws (24 → 1 to 4): the student's saved items and their still-needed course types turned into
// terms of cards, with units, line 2, reasons and the hero's counts. No React and no Supabase here, so it can be tested.

// A plan_items row as this device keeps it
export type StoredItem = PlanItem & { id: string; college_course_id: string | null };

export type PlanSettings = { units_per_term: number; include_summer: boolean; units_done: number | null };

export const DEFAULT_SETTINGS: PlanSettings = { units_per_term: 15, include_summer: false, units_done: null };

// Transferable units a transfer needs
export const TRANSFER_UNITS = 60;

const SYSTEM_OF: Record<string, PlanSystem> = { UC: "uc", CSU: "cal-state" };

// Every major in the plan, for the systems the student is applying to. A topic in two majors is one card.
export function planNeeds(targets: PlanTarget[], majors: ExploreMajor[]): MajorNeed[] {
  const systems = new Map<string, Set<PlanSystem>>();
  for (const t of targets) {
    const system = SYSTEM_OF[t.system?.toUpperCase() ?? ""];
    if (!t.exploreSlug || !system) continue;
    systems.set(t.exploreSlug, (systems.get(t.exploreSlug) ?? new Set()).add(system));
  }
  const needs = new Map<string, MajorNeed>();
  for (const [slug, wanted] of systems) {
    const major = majors.find((m) => m.slug === slug);
    if (!major) continue;
    for (const n of majorNeeds(major, [...wanted])) {
      const had = needs.get(n.topic);
      if (!had) needs.set(n.topic, { ...n, systems: [...n.systems] });
      else {
        for (const s of n.systems) if (!had.systems.includes(s)) had.systems.push(s);
        if (n.units !== null && (had.units === null || n.units > had.units)) had.units = n.units;
      }
    }
  }
  return [...needs.values()];
}

// The systems the plan applies to, for "UC only" and "Cal State only"
export const planSystems = (targets: PlanTarget[]) => new Set(targets.flatMap((t) => SYSTEM_OF[t.system?.toUpperCase() ?? ""] ?? []));

// The term the plan stops before. Not asked yet: null, and the screen asks. "Not sure yet": fall of next year, guessed.
export function transferTermOf(choice: { asked: boolean; term: string | null }, today: Date): { term: TermId; guessed: boolean } | null {
  if (choice.term && /^(fall|spring|summer)-\d{4}$/.test(choice.term)) return { term: choice.term as TermId, guessed: false };
  if (!choice.asked) return null;
  return { term: `fall-${today.getFullYear() + 1}`, guessed: true };
}

// "fall 2027", lowercase inside a sentence
export const termInSentence = (id: TermId) => termLabel(id).toLowerCase();

export type CardDetail = { kind: "both" } | { kind: "system"; system: PlanSystem } | { kind: "ge"; code: string } | null;

export type Card = {
  key: string;
  // The saved item, or one made up for a need the plan doesn't hold yet (not saved until it changes)
  item: StoredItem;
  saved: boolean;
  kind: StoredItem["kind"];
  topic: string | null;
  geArea: string | null;
  name: string;
  // The student's course code: the one they picked or typed, else their college's only matching course
  code: string | null;
  // The college course the card uses, picked or by default
  courseId: string | null;
  units: number;
  // True until the student's own course is known: "about 4 u"
  unitsEstimated: boolean;
  progress: TopicStatus;
  // null: Not in a term yet
  term: TermId | null;
  detail: CardDetail;
  line: CardLine | null;
  reasons: string[];
};

export type TermView = { id: TermId; label: string; now: boolean; header: TermHeader; cards: Card[] };

export type PlanView = {
  // False until the first Build my plan
  built: boolean;
  terms: TermView[];
  unplaced: Card[];
  done: Card[];
  unitsDone: number;
  coursesLeft: number;
  // Items the builder couldn't fit
  doesntFit: number;
  checks: number;
  firstCheck: string | null;
  cardsByKey: Map<string, Card>;
};

export type ViewInput = {
  needs: MajorNeed[];
  // Every Cal-GETC area, those with 0 courses included
  geAreas: GeNeed[];
  order: OrderPair[];
  statuses: Statuses;
  items: StoredItem[];
  terms: TermId[];
  settings: PlanSettings;
  // The systems the plan applies to
  systems: Set<PlanSystem>;
  // A course type's name, also for topics outside the plan
  nameOf: (topic: string) => string;
  // A made-up id for a need without a saved item
  newId: (key: string) => string;
  // The home college's course for a course type when it has exactly one, used until the student picks another
  defaultCourse?: (topic: string) => DefaultCourse | null;
};

export type DefaultCourse = { id: string; code: string; units: number };

// The needs with the college's only matching course's units, so Build my plan counts those
export const withDefaultUnits = (needs: MajorNeed[], defaultCourse: (topic: string) => DefaultCourse | null): MajorNeed[] =>
  needs.map((n) => {
    const course = defaultCourse(n.topic);
    return course ? { ...n, units: course.units } : n;
  });

export const itemKey = (item: Pick<StoredItem, "kind" | "topic" | "ge_area" | "id">) =>
  item.kind === "major" ? `major:${item.topic}` : item.kind === "ge" ? `ge:${item.ge_area}` : `custom:${item.id}`;

const blankItem = (id: string, kind: "major" | "ge", topic: string | null, geArea: string | null): StoredItem => ({
  id, kind, topic, ge_area: geArea, term: null, position: 0, placed_by: "builder", college_course_id: null, course_code: null,
  course_name: null, units: null, status: kind === "ge" ? "not_started" : null,
});

const sum = (cards: Card[]) => Number(cards.reduce((n, c) => n + c.units, 0).toFixed(1));

export function planView(input: ViewInput): PlanView {
  const { needs, order, statuses, items, terms, settings, systems, nameOf } = input;
  const areas = input.geAreas.filter((g) => g.courses !== 0);
  const needByTopic = new Map(needs.map((n) => [n.topic, n]));
  const areaByCode = new Map(areas.map((g) => [g.code, g]));
  const bothSystems = systems.size > 1;

  // Saved items still in the plan, plus a made-up one for each need without one
  const keyed = new Map<string, { item: StoredItem; saved: boolean }>();
  for (const item of items) {
    if (item.kind === "major" && !needByTopic.has(item.topic ?? "")) continue;
    if (item.kind === "ge" && !areaByCode.has(item.ge_area ?? "")) continue;
    keyed.set(itemKey(item), { item, saved: true });
  }
  for (const n of needs) if (!keyed.has(`major:${n.topic}`)) keyed.set(`major:${n.topic}`, { item: blankItem(input.newId(`major:${n.topic}`), "major", n.topic, null), saved: false });
  for (const g of areas) if (!keyed.has(`ge:${g.code}`)) keyed.set(`ge:${g.code}`, { item: blankItem(input.newId(`ge:${g.code}`), "ge", null, g.code), saved: false });

  const cards: Card[] = [...keyed.entries()].map(([key, { item, saved }]) => {
    const need = item.kind === "major" ? needByTopic.get(item.topic!) : undefined;
    const area = item.kind === "ge" ? areaByCode.get(item.ge_area!) : undefined;
    // Until the student picks or types a course, the college's only matching one stands in
    const own = item.college_course_id !== null || item.course_code !== null;
    const fallback = item.kind === "major" && !own ? (input.defaultCourse?.(item.topic!) ?? null) : null;
    const known = item.units ?? fallback?.units ?? null;
    const from = known ?? need?.units ?? area?.units ?? null;
    const progress: TopicStatus = (item.kind === "major" ? statuses[item.topic!] : item.status) ?? "not_started";
    const detail: CardDetail =
      item.kind === "ge"
        ? { kind: "ge", code: item.ge_area! }
        : need && need.systems.length > 1
          ? { kind: "both" }
          : need && bothSystems
            ? { kind: "system", system: need.systems[0] }
            : null;
    return {
      key, item, saved, kind: item.kind, topic: item.topic, geArea: item.ge_area,
      name: need?.name ?? area?.name ?? item.course_name ?? "",
      code: item.course_code ?? fallback?.code ?? null,
      courseId: item.college_course_id ?? fallback?.id ?? null,
      units: from !== null ? Number(from) : item.kind === "ge" ? DEFAULT_GE_UNITS : DEFAULT_MAJOR_UNITS,
      unitsEstimated: known === null,
      progress,
      term: item.term !== null && terms.includes(item.term) ? item.term : null,
      detail, line: null, reasons: [],
    };
  });

  const byPosition = (a: Card, b: Card) => a.item.position - b.item.position || a.key.localeCompare(b.key);
  const open = cards.filter((c) => c.progress !== "done");
  const inTerm = (t: TermId | null) => open.filter((c) => c.term === t).sort(byPosition);
  const unitsIn = (t: TermId) => sum(inTerm(t));
  const ordered = [...terms.flatMap((t) => inTerm(t)), ...inTerm(null)];

  const doneTopics = new Set(Object.entries(statuses).flatMap(([t, s]) => (s === "done" ? [t] : [])));
  // Done cards go in too: a done 5A or 5B clears the lab note
  const warnings = planWarnings({ cards: [...ordered, ...cards.filter((c) => c.progress === "done")], terms, order, done: doneTopics, geAreas: input.geAreas, unitLimit: settings.units_per_term, unitsIn, nameOf });

  // Why each card is where it is (24 → 3), true for the plan as it is now
  for (const c of cards) {
    c.line = warnings.lines.get(c.key) ?? null;
    const reasons: string[] = [];
    if (c.progress === "in_progress") reasons.push("You're taking it now");
    if (c.kind === "custom") reasons.push("You added it");
    else if (c.item.placed_by === "student" && c.term) reasons.push("You moved it here");
    if (c.detail?.kind === "both") reasons.push("Counts for UC and Cal State");
    if (c.kind === "ge") reasons.push(`Cal-GETC Area ${c.geArea}, ${c.name}`);
    if (c.kind === "major") {
      const next = open.find((o) => o.kind === "major" && order.some((p) => p.topic === o.topic && p.before_topic === c.topic));
      if (next) reasons.push(`Needed before ${next.name}`);
    }
    if (c.term && c.item.placed_by === "builder" && c.kind !== "custom" && unitsIn(c.term) <= settings.units_per_term) {
      reasons.push(`Fits your ${settings.units_per_term} units in ${termLabel(c.term)}`);
    }
    if (!c.term && c.progress !== "done") {
      reasons.push(c.saved && c.item.placed_by === "builder" ? `Didn't fit at ${settings.units_per_term} units a term` : "Not in a term yet. Build or move it to place it");
    }
    c.reasons = reasons.slice(0, 3);
  }

  const done = cards.filter((c) => c.progress === "done").sort((a, b) => a.name.localeCompare(b.name));
  const requirements = open.filter((c) => c.kind !== "custom");
  return {
    built: items.length > 0,
    terms: terms.map((t, i) => ({ id: t, label: termLabel(t), now: i === 0, header: warnings.headers.get(t)!, cards: inTerm(t) })),
    unplaced: inTerm(null),
    done,
    unitsDone: settings.units_done ?? sum(done),
    coursesLeft: requirements.length,
    doesntFit: open.filter((c) => c.saved && c.term === null && c.item.placed_by === "builder" && c.kind !== "custom").length,
    checks: warnings.count,
    firstCheck: warnings.first,
    cardsByKey: new Map(cards.map((c) => [c.key, c])),
  };
}

// What the first build asks about (24 → 5): every course and area the builder would place, major courses first
export const finishChoices = (view: PlanView) =>
  [...view.cardsByKey.values()]
    .filter((c) => c.kind !== "custom" && c.progress !== "done")
    .sort((a, b) => Number(a.kind === "ge") - Number(b.kind === "ge") || (a.kind === "ge" ? a.key.localeCompare(b.key) : 0));

// The courses and areas the student says they've finished before the first build. The caller marks the topics done in
// user_topic_status; the areas become done items.
export function markFinished(items: StoredItem[], cards: Card[], keys: Set<string>) {
  const chosen = cards.filter((c) => keys.has(c.key) && c.kind !== "custom");
  const topics = chosen.filter((c) => c.kind === "major").map((c) => c.topic!);
  const areasDone = chosen.filter((c) => c.kind === "ge").map((c): StoredItem => ({ ...c.item, status: "done" }));
  const ids = new Set(areasDone.map((i) => i.id));
  return { topics, areasDone, items: [...items.filter((i) => !ids.has(i.id)), ...areasDone] };
}

// The plan's items after Build my plan or Rebuild: the builder's placements as saved items, which ones changed, and
// which to delete (a course type no longer in the plan)
export function applyBuild(items: StoredItem[], input: Omit<BuildInput, "items">, newId: () => string) {
  const result = buildPlan({ ...input, items });
  const had = new Map(items.map((i) => [itemKey(i), i]));
  // Only the plan_items columns are saved, not the builder's extra fields
  const next: StoredItem[] = result.items.map((p) => {
    const before = had.get(p.key);
    return {
      id: before?.id ?? p.id ?? newId(), kind: p.kind, topic: p.topic, ge_area: p.ge_area, term: p.term, position: p.position, placed_by: p.placed_by,
      college_course_id: before?.college_course_id ?? null, course_code: p.course_code, course_name: p.course_name, units: p.chosenUnits, status: p.status,
    };
  });
  const keep = new Set(next.map((i) => i.id));
  const changed = next.filter((i) => {
    const before = items.find((b) => b.id === i.id);
    return !before || before.term !== i.term || before.position !== i.position || before.placed_by !== i.placed_by;
  });
  return { items: next, changed, removed: items.filter((i) => !keep.has(i.id)).map((i) => i.id), doesntFit: result.doesntFit };
}

// Moves an item to a term (null: Not in a term yet), before another item or at the end, and numbers both lists again.
// A move to another term is the student's placement, which a rebuild keeps.
export function moveItem(items: StoredItem[], moving: StoredItem, to: TermId | null, beforeId: string | null) {
  const from = items.find((i) => i.id === moving.id)?.term ?? null;
  const rest = items.filter((i) => i.id !== moving.id);
  const moved: StoredItem = { ...moving, term: to, placed_by: moving.kind === "custom" || from !== to || !items.some((i) => i.id === moving.id) ? "student" : moving.placed_by };
  const target = rest.filter((i) => i.term === to).sort((a, b) => a.position - b.position);
  const at = beforeId ? target.findIndex((i) => i.id === beforeId) : -1;
  target.splice(at < 0 ? target.length : at, 0, moved);
  const renumbered = new Map<string, StoredItem>();
  target.forEach((i, n) => renumbered.set(i.id, { ...i, position: n }));
  if (from !== to) {
    rest
      .filter((i) => i.term === from)
      .sort((a, b) => a.position - b.position)
      .forEach((i, n) => renumbered.set(i.id, { ...i, position: n }));
  }
  const next = [...rest.map((i) => renumbered.get(i.id) ?? i), ...(renumbered.has(moved.id) ? [renumbered.get(moved.id)!] : [])];
  const changed = next.filter((i) => {
    const before = items.find((b) => b.id === i.id);
    return !before || before.term !== i.term || before.position !== i.position || before.placed_by !== i.placed_by;
  });
  return { items: next, changed };
}
