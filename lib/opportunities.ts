import { joinNames, SOON_DAYS } from "./deadlines";

// Opportunities (22): who each one is for, how the feed groups them, and the words the screens show. No React and no
// Supabase here, so scripts/test-opportunities.mts can check it with any clock.

export type OpportunityKind = "research" | "scholarship" | "competition" | "program" | "event" | "internship";
export type Audience = "community_college" | "admitted_transfer" | "any";
export type Cost = "free" | "paid" | "fee";

// A verified row of the opportunities table. Dates are calendar days ("2027-02-01"), read as written.
export type Opportunity = {
  id: string;
  slug: string;
  kind: OpportunityKind;
  title: string;
  org_name: string;
  summary: string;
  who_for: string[];
  wants: string[];
  offers: string[];
  audience: Audience;
  major_slugs: string[];
  systems: string[];
  terms: string[];
  deadline: string | null;
  starts_on: string | null;
  ends_on: string | null;
  location: string | null;
  online: boolean;
  cost: Cost;
  url: string;
  source_name: string;
  source_url: string;
  verified_at: string | null;
};

// What Stackd knows about the student. Everyone in Stackd is at a community college today (22 → 5).
export type Student = {
  majorSlug: string | null;
  majorName: string | null;
  // The plan's schools with their system (UC, CSU)
  schools: { name: string; system: string | null | undefined }[];
  // The plan's transfer term ("fall-2027"), or null
  term: string | null;
};

// met: checked against the student. unmet: checked, and it rules them out. check: Stackd can't check it.
export type RuleState = "met" | "unmet" | "check";
export type RuleRow = { state: RuleState; text: string };

export const KIND_LABELS: Record<OpportunityKind, string> = {
  research: "Research",
  scholarship: "Scholarships",
  competition: "Competitions",
  program: "Programs",
  event: "Events",
  internship: "Internships",
};

// One of a kind, for the page's detail line
const KIND_ONE: Record<OpportunityKind, string> = {
  research: "Research",
  scholarship: "Scholarship",
  competition: "Competition",
  program: "Program",
  event: "Event",
  internship: "Internship",
};

export const COST_LABELS: Record<Cost, string> = { free: "Free", paid: "Paid", fee: "Has a fee" };

const SYSTEM_NAMES: Record<string, string> = { UC: "UC", CSU: "Cal State" };
const systemName = (s: string) => SYSTEM_NAMES[s.toUpperCase()] ?? s;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayParts = (day: string) => day.split("-").map(Number) as [number, number, number];

// Today's calendar day in Pacific time, "2026-11-08"
export function pacificToday(now: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

// Calendar days from one day to another
export function daysFrom(from: string, to: string) {
  const [fy, fm, fd] = dayParts(from);
  const [ty, tm, td] = dayParts(to);
  return (Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000;
}

// "Nov 20"
export function shortDay(day: string) {
  const [, m, d] = dayParts(day);
  return `${MONTHS[m - 1]} ${d}`;
}

// "Nov 20, 2026"
export function fullDay(day: string) {
  const [y, m, d] = dayParts(day);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

// The date tile's two lines
export function tileParts(day: string) {
  const [, m, d] = dayParts(day);
  return { month: MONTHS[m - 1], day: String(d) };
}

// fall-2027 → "Fall 2027"
function termName(term: string) {
  const [season, year] = term.split("-");
  return `${season.charAt(0).toUpperCase()}${season.slice(1)} ${year ?? ""}`.trim();
}

// "Computer Science or Mathematics"
function orList(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} or ${names.at(-1)}`;
}

// A major's name from Explore, or its slug in words when Explore doesn't list it
export function majorNamer(names: Record<string, string>) {
  return (slug: string) => names[slug] ?? slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// Shown until the deadline's day is over, in Pacific time; rolling ones always
export const isOpen = (o: Opportunity, today: string) => o.deadline === null || o.deadline >= today;

// Every rule the opportunity stores, checked against the student (22 → 5). Never a cross: an unmet rule says why.
export function whoItsFor(o: Opportunity, student: Student, nameOf: (slug: string) => string): RuleRow[] {
  const rows: RuleRow[] = [];

  if (o.audience === "community_college") rows.push({ state: "met", text: "California community college students" });
  else if (o.audience === "admitted_transfer") rows.push({ state: "unmet", text: "For admitted transfers; you're at a community college" });

  if (o.major_slugs.length > 0) {
    const majors = `${orList(o.major_slugs.map(nameOf))} majors`;
    if (!student.majorSlug) rows.push({ state: "check", text: majors });
    else if (o.major_slugs.includes(student.majorSlug)) rows.push({ state: "met", text: `${majors} (you: ${student.majorName ?? nameOf(student.majorSlug)})` });
    else rows.push({ state: "unmet", text: `For ${majors}; your major is ${student.majorName ?? nameOf(student.majorSlug)}` });
  }

  if (o.systems.length > 0) {
    const where = `Transferring to ${orList(o.systems.map(systemName))}`;
    const known = student.schools.filter((s) => s.system);
    const match = known.find((s) => o.systems.includes(s.system!.toUpperCase()));
    if (known.length === 0) rows.push({ state: "check", text: where });
    else if (match) rows.push({ state: "met", text: `${where} (you: ${match.name})` });
    else rows.push({ state: "unmet", text: `For students transferring to ${orList(o.systems.map(systemName))}; your plan has none` });
  }

  if (o.terms.length > 0) {
    const when = `Transferring ${orList(o.terms.map(termName))}`;
    if (!student.term) rows.push({ state: "check", text: when });
    else if (o.terms.includes(student.term)) rows.push({ state: "met", text: `${when} (you: ${termName(student.term)})` });
    else rows.push({ state: "unmet", text: `For students transferring ${orList(o.terms.map(termName))}; you plan ${termName(student.term)}` });
  }

  for (const item of o.who_for) rows.push({ state: "check", text: item });
  return rows;
}

// Fits unless a rule Stackd checked rules the student out. What it can't check never filters.
export const fits = (o: Opportunity, student: Student) => !whoItsFor(o, student, (s) => s).some((r) => r.state === "unmet");

// Soonest deadline first, rolling last, then by title
export const byDeadline = (a: Opportunity, b: Opportunity) =>
  (a.deadline ?? "9999") < (b.deadline ?? "9999") ? -1 : (a.deadline ?? "9999") > (b.deadline ?? "9999") ? 1 : a.title.localeCompare(b.title);

// Explore's "Opportunities for you": open, fitting, soonest first
export function forYou(all: Opportunity[], student: Student, today: string, limit = 3) {
  return all.filter((o) => isOpen(o, today) && fits(o, student)).sort(byDeadline).slice(0, limit);
}

export type FeedGroup = { id: "soon" | "open" | "rolling"; title: string; rows: Opportunity[] };

// The feed (22 → 4): one kind or all, only the ones that fit or every open one, grouped by how soon they close
export function feedGroups(all: Opportunity[], { kind, fitsOnly, student, today }: { kind: OpportunityKind | null; fitsOnly: boolean; student: Student; today: string }) {
  const shown = all.filter((o) => isOpen(o, today) && (!kind || o.kind === kind) && (!fitsOnly || fits(o, student))).sort(byDeadline);
  const groups: FeedGroup[] = [
    { id: "soon", title: "Closing soon", rows: shown.filter((o) => o.deadline && daysFrom(today, o.deadline) <= SOON_DAYS) },
    { id: "open", title: "Open", rows: shown.filter((o) => o.deadline && daysFrom(today, o.deadline) > SOON_DAYS) },
    { id: "rolling", title: "Rolling", rows: shown.filter((o) => !o.deadline) },
  ];
  return groups.filter((g) => g.rows.length > 0);
}

// The date tile's look: coral at 14 days or less, the open look before that, the rolling tile with no deadline
export function tileStatus(o: Opportunity, today: string): "soon" | "open" | "rolling" {
  if (!o.deadline) return "rolling";
  return daysFrom(today, o.deadline) <= SOON_DAYS ? "soon" : "open";
}

// "For Computer Science or Mathematics majors at community colleges"
export function forLine(o: Opportunity, nameOf: (slug: string) => string) {
  const majors = o.major_slugs.length ? `${orList(o.major_slugs.map(nameOf))} majors` : "students";
  const where = o.systems.length ? ` transferring to ${orList(o.systems.map(systemName))}` : "";
  const audience = o.audience === "community_college" ? " at community colleges" : o.audience === "admitted_transfer" ? " admitted to UC or Cal State" : "";
  return `For ${majors}${audience}${where}`;
}

// "Apply by Nov 20, 2026", or "Open now, no deadline"
export const applyLine = (o: Opportunity) => (o.deadline ? `Apply by ${fullDay(o.deadline)}` : "Open now, no deadline");

// "Research, paid, Davis" (22 → 6): kind, cost, and where
export function detailLine(o: Opportunity) {
  const where = o.online || !o.location ? "Online" : o.location;
  return `${KIND_ONE[o.kind]}, ${COST_LABELS[o.cost].toLowerCase()}, ${where}`;
}

// "From UC Davis, checked Nov 8, 2026."
export function sourceSentence(o: Opportunity) {
  return o.verified_at ? `From ${o.source_name}, checked ${fullDay(o.verified_at.slice(0, 10))}.` : `From ${o.source_name}.`;
}

// The reminder days for Remind me: 7 days and 1 day before the deadline, at 9 a.m., only those still ahead (22 → 6)
export const REMIND_DAYS = [7, 1];
export function reminderDays(deadline: string, now: Date, hour = 9): string[] {
  const [y, m, d] = dayParts(deadline);
  return REMIND_DAYS.map((before) => new Date(y, m - 1, d - before, hour))
    .filter((at) => at > now)
    .sort((a, b) => a.getTime() - b.getTime())
    .map((at) => `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`);
}

// "Reminder set for Nov 13 and Nov 19."
export const reminderToast = (days: string[]) => `Reminder set for ${joinNames(days.map(shortDay))}.`;
