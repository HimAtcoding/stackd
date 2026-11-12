import type { TopicStatus } from "../explore";
import type { GeNeed, OrderPair, TermId } from "./build";

// The plan's warnings and quiet notes (24 → 4), computed from what's on screen and never stored. Warnings are advice:
// nothing is blocked. No React here, so they can be tested.

// Most colleges need a counselor's approval above this many units in a term
export const APPROVAL_UNITS = 18;

// What the rules need to know about one card
export type WarnCard = {
  key: string;
  kind: "major" | "ge" | "custom";
  topic: string | null;
  geArea: string | null;
  term: TermId | null;
  progress: TopicStatus;
};

export type WarnInput = {
  cards: WarnCard[];
  terms: TermId[];
  order: OrderPair[];
  // Topics marked done, also those with no card
  done: Set<string>;
  // Every Cal-GETC area, those with 0 courses included
  geAreas: GeNeed[];
  unitLimit: number;
  unitsIn: (term: TermId) => number;
  // A course type's name, for topics outside the plan too
  nameOf: (topic: string) => string;
};

export type CardLine = { kind: "warning" | "note"; text: string };

export type TermHeader = { units: number; text: string; over: boolean };

export type Warnings = {
  // Line 2 of a card, by key: an order warning, or a quiet note
  lines: Map<string, CardLine>;
  headers: Map<TermId, TermHeader>;
  // Warnings to check: order warnings and terms over a limit. Notes don't count.
  count: number;
  // The first thing to check, top to bottom: a term id or a card key
  first: string | null;
};

const SEASON_ORDER = { spring: 0, summer: 1, fall: 2 } as const;

export const termRank = (id: TermId) => {
  const [season, year] = id.split("-");
  return Number(year) * 3 + SEASON_ORDER[season as keyof typeof SEASON_ORDER];
};

// "Fall 2026"
export const termLabel = (id: TermId) => {
  const [season, year] = id.split("-");
  return `${season.charAt(0).toUpperCase()}${season.slice(1)} ${year}`;
};

export function termHeader(units: number, limit: number): TermHeader {
  const n = Number(units.toFixed(1));
  if (n > APPROVAL_UNITS) return { units: n, text: `${n} units. Most colleges need approval above ${APPROVAL_UNITS}`, over: true };
  if (n > limit) return { units: n, text: `${n} units, over your limit`, over: true };
  return { units: n, text: `${n} ${n === 1 ? "unit" : "units"}`, over: false };
}

export function planWarnings({ cards, terms, order, done, geAreas, unitLimit, unitsIn, nameOf }: WarnInput): Warnings {
  const open = cards.filter((c) => c.progress !== "done");
  const byTopic = new Map(open.filter((c) => c.kind === "major").map((c) => [c.topic!, c]));
  const lines = new Map<string, CardLine>();

  // Order: a course in the same or an earlier term than the one it needs first, taking now included (it finishes at the
  // end of its term). One outside the plan and not done is a quiet note instead (24 → Prerequisites outside the plan).
  for (const card of open) {
    if (card.kind !== "major" || card.term === null) continue;
    for (const p of order.filter((o) => o.topic === card.topic)) {
      const b = p.before_topic;
      if (done.has(b)) continue;
      const before = byTopic.get(b);
      if (!before) {
        if (!lines.has(card.key)) lines.set(card.key, { kind: "note", text: `Needs ${nameOf(b)} first, or placement` });
        continue;
      }
      if (before.term === null) {
        lines.set(card.key, { kind: "warning", text: `Take ${nameOf(b)} first` });
        break;
      }
      if (termRank(before.term) >= termRank(card.term)) {
        lines.set(card.key, { kind: "warning", text: `Take ${nameOf(b)} first (${termLabel(before.term)})` });
        break;
      }
    }
  }

  // An area met inside another area's course (Cal-GETC 5C, the lab): a note on its sibling areas' cards until one is done
  for (const lab of geAreas.filter((g) => g.courses === 0)) {
    const group = lab.code.charAt(0);
    const siblings = cards.filter((c) => c.kind === "ge" && c.geArea !== lab.code && c.geArea?.charAt(0) === group);
    if (siblings.some((c) => c.progress === "done")) continue;
    for (const c of siblings) {
      if (c.progress !== "done" && !lines.has(c.key)) lines.set(c.key, { kind: "note", text: `Take one science course with a lab (Cal-GETC ${lab.code})` });
    }
  }

  const headers = new Map(terms.map((t) => [t, termHeader(unitsIn(t), unitLimit)]));

  // Counted top to bottom, so "things to check" can scroll to the first
  let count = 0;
  let first: string | null = null;
  for (const t of terms) {
    if (headers.get(t)!.over) {
      count++;
      first ??= t;
    }
    for (const c of open.filter((o) => o.term === t)) {
      if (lines.get(c.key)?.kind === "warning") {
        count++;
        first ??= c.key;
      }
    }
  }

  return { lines, headers, count, first };
}
