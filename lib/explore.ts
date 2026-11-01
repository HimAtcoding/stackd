import { ASSIST_HOME, SUPPORT_EMAIL } from "./about";
import type { PlanTarget } from "./data/plan";
import { checkedDate } from "./deadlines";
import { majorWords } from "./explore-icons";
import { matchesSearch, startsAWord } from "./search";

// Explore's rules (21): turns the database's rows into majors, and counts a student's progress through them.
// No React and no Supabase here, so they can be tested.

export type TopicStatus = "not_started" | "in_progress" | "done";
export type Statuses = Record<string, TopicStatus>;

// The major page's ?tab=
export type SystemTab = "uc" | "cal-state";

export type PathwayOption = { label: string; c_id: string[]; units: number };

export type PathwayRow = {
  id: string;
  slug: string;
  kind: "uc_pathway" | "tmc";
  name: string;
  code: string | null;
  revision: string | null;
  major_units: number | null;
  total_units: number | null;
  source_name: string;
  source_url: string;
  verified_at: string | null;
};

export type RequirementRecord = {
  id: string;
  pathway_id: string;
  code: string;
  sort: number;
  topic: string;
  name: string;
  description: string;
  how_many: string;
  units: number | null;
  c_id: string[];
  options: PathwayOption[];
};

export type CampusRecord = {
  pathway_id: string;
  major_names: string[];
  institution: { id: string; slug: string; name: string } | null;
};

export type ExploreRecords = { pathways: PathwayRow[]; requirements: RequirementRecord[]; campuses: CampusRecord[] };

export type Pathway = PathwayRow & { requirements: RequirementRecord[]; campuses: CampusRecord[] };

export type ExploreMajor = { slug: string; name: string; uc: Pathway | null; calState: Pathway | null };

export const SYSTEM_TABS: { id: SystemTab; label: string }[] = [
  { id: "uc", label: "UC" },
  { id: "cal-state", label: "Cal State" },
];

// One major for each slug, A to Z. A pathway with no requirements shows nothing, so it doesn't count.
export function buildMajors({ pathways, requirements, campuses }: ExploreRecords): ExploreMajor[] {
  const full: Pathway[] = pathways.map((p) => ({
    ...p,
    requirements: requirements.filter((r) => r.pathway_id === p.id).sort((a, b) => a.sort - b.sort),
    campuses: campuses.filter((c) => c.pathway_id === p.id && c.institution),
  }));
  const majors = new Map<string, ExploreMajor>();
  for (const p of full.filter((f) => f.requirements.length > 0)) {
    const major = majors.get(p.slug) ?? { slug: p.slug, name: p.name, uc: null, calState: null };
    if (p.kind === "uc_pathway") major.uc = p;
    else major.calState = p;
    majors.set(p.slug, major);
  }
  return [...majors.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export const pathwayOn = (major: ExploreMajor, tab: SystemTab) => (tab === "uc" ? major.uc : major.calState);

// The tabs this major has
export const tabsOf = (major: ExploreMajor) => SYSTEM_TABS.filter((t) => pathwayOn(major, t.id));

// "UC and Cal State", "UC" or "Cal State"
export const systemsLine = (major: ExploreMajor) => tabsOf(major).map((t) => t.label).join(" and ");

// The requested tab, or the first one this major has
export const resolveTab = (major: ExploreMajor, wanted: string | null): SystemTab => tabsOf(major).find((t) => t.id === wanted)?.id ?? tabsOf(major)[0].id;

// Topics in both the UC pathway and the Cal State degree. "Counts for both" is computed from these, never stored.
export function sharedTopics(major: ExploreMajor): Set<string> {
  const calState = new Set(major.calState?.requirements.map((r) => r.topic));
  return new Set(major.uc?.requirements.map((r) => r.topic).filter((t) => calState.has(t)));
}

export const statusOf = (statuses: Statuses, topic: string): TopicStatus => statuses[topic] ?? "not_started";

export function pathwayProgress(pathway: Pathway, statuses: Statuses) {
  const list = pathway.requirements.map((r) => statusOf(statuses, r.topic));
  return { total: list.length, done: list.filter((s) => s === "done").length, taking: list.filter((s) => s === "in_progress").length, list };
}

// "4 of 9 done, 1 taking now"
export function progressLine({ done, total, taking }: { done: number; total: number; taking: number }) {
  return taking > 0 ? `${done} of ${total} done, ${taking} taking now` : `${done} of ${total} done`;
}

// The major the "Your major" panel shows: the plan's first major with data in Explore
export function planMajor(targets: PlanTarget[], majors: ExploreMajor[]) {
  for (const target of targets) {
    const major = majors.find((m) => m.slug === target.exploreSlug);
    if (major) return { major, name: target.majorName ?? major.name };
  }
  return null;
}

// Where the panel opens: UC, or Cal State when the plan has only Cal State schools
export function panelTab(targets: PlanTarget[]): SystemTab {
  return targets.length > 0 && targets.every((t) => t.system?.toUpperCase() === "CSU") ? "cal-state" : "uc";
}

// Matches the name and the major's plain words. Three letters or fewer match only at the start of a word: "cs" is
// inside "economics".
export function searchMajors(majors: ExploreMajor[], query: string) {
  const q = query.trim();
  if (!q) return majors;
  const short = q.replace(/[^\p{L}\p{N}]/gu, "").length <= 3;
  return majors.filter((m) => {
    const words = majorWords(m.slug);
    return short ? [m.name, ...words].some((w) => startsAWord(q, w)) : matchesSearch(q, m.name, ...words);
  });
}

// Each way of meeting a Cal State row, as its C-ID numbers: [["MATH 210", "MATH 220"], ["MATH 900S"]]
export function cIdGroups(row: RequirementRecord): string[][] {
  return (row.options.length > 0 ? row.options.map((o) => o.c_id) : [row.c_id]).filter((group) => group.length > 0);
}

export const unitsLabel = (units: number) => `${units} ${units === 1 ? "unit" : "units"}`;

// "From UC Admissions, Computer science Transfer Pathway. Checked Oct 31, 2026."
export function sourceLine(pathway: Pathway) {
  const name = pathway.kind === "tmc" ? `Transfer Model Curriculum #${pathway.code}, revision ${pathway.revision}` : `${pathway.name} Transfer Pathway`;
  const checked = pathway.verified_at ? ` Checked ${checkedDate(pathway.verified_at)}.` : "";
  return `From ${pathway.source_name}, ${name}.${checked}`;
}

export const sourceLinkLabel = (pathway: Pathway) => (pathway.kind === "tmc" ? "Open the template" : "Open UC's pathway page");

// A mailto naming the major, the tab and its rows, so a report says what it's about
export function problemMailto(major: ExploreMajor, tab: SystemTab, pathway: Pathway) {
  const subject = `Problem with ${major.name} in Explore`;
  const label = SYSTEM_TABS.find((t) => t.id === tab)?.label;
  const body = `Major: ${major.name}\nTab: ${label}\nRows: ${pathway.requirements.map((r) => r.code).join(", ")}\n\nWhat's wrong:\n`;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// The Cal State tab's "What this degree does". Wording checked against Cal State's ADT page on Oct 26, 2026 (21).
export const DEGREE_NOTE =
  "Finish this degree at your college and you get priority admission to Cal State. That's the system, not a specific campus or major: if your first choice is full, you may be offered another campus. If you're admitted to a similar major, you can finish the bachelor's in about 60 more units.";

// "At least 28 units in the major, 60 units total." The template's 28 is a minimum (21 → Version check).
export function unitsLine(pathway: Pathway) {
  return pathway.major_units && pathway.total_units ? `At least ${pathway.major_units} units in the major, ${pathway.total_units} units total.` : null;
}

// A campus's rows, the student's own schools first, then A to Z
export function campusRows(pathway: Pathway, planSchools: string[]) {
  const name = (c: CampusRecord) => c.institution?.name ?? "";
  const mine = (c: CampusRecord) => Boolean(c.institution && planSchools.includes(c.institution.id));
  return [...pathway.campuses]
    .sort((a, b) => Number(mine(b)) - Number(mine(a)) || name(a).localeCompare(name(b)))
    .map((c) => ({ id: c.institution?.id ?? name(c), name: name(c), majors: c.major_names, inPlan: mine(c) }));
}

// The link to a student's own agreement, or to ASSIST when Stackd has none for their path
export function agreementLine(what: "these" | "it", agreement: { url: string; academicYear: string; college: string | null } | null) {
  if (agreement?.college) {
    return { href: agreement.url, label: `Find ${what} at ${agreement.college}`, detail: `Your ${agreement.academicYear} agreement on assist.org` };
  }
  return { href: ASSIST_HOME, label: `Find ${what} at your college`, detail: "assist.org" };
}
