// Deadlines and application checklists (14-deadlines.md): which dates a student sees, their state on a given day,
// and the words the screens show. No React here; lib/data/deadlines.ts feeds it.

// A row of the deadlines table. due_has_time is a proposed column: false when the date has no stated time.
export type DeadlineRecord = {
  demo?: boolean;
  id: string;
  cycle: string;
  // uc, csu, aid, or one institution's id for a campus-only date
  audience: string;
  kind: string;
  title: string;
  summary: string;
  opens_at: string | null;
  due_at: string;
  due_has_time?: boolean;
  varies_by_campus: boolean;
  source_name: string;
  source_url: string;
  retrieved_at: string | null;
  verified_at: string | null;
  verification_status: string;
};

export type ChecklistRecord = {
  demo?: boolean;
  id: string;
  cycle: string;
  deadline_id: string;
  name: string;
  apply_label: string;
  apply_url: string;
  source_name: string;
  source_url: string;
  verified_at: string | null;
  verification_status: string;
};

export type ChecklistStep = {
  demo?: boolean;
  id: string;
  checklist_id: string;
  position: number;
  title: string;
  summary: string;
};

// A school on the student's plan. system undefined: a plan saved before systems were read, so it counts for both.
export type School = { id: string; name: string; system: string | null | undefined };
// The student's schools, or null with no plan yet
export type Scope = School[] | null;

export type DeadlineState = "soon" | "open" | "later" | "done" | "missed";

export type Deadline = DeadlineRecord & {
  doneAt: string | null;
  // Calendar days from today to the due day, in Pacific time
  daysLeft: number;
  state: DeadlineState;
  windowOpen: boolean;
  // The window hasn't opened yet
  notOpenYet: boolean;
};

export const SOON_DAYS = 14;

const ZONE = "America/Los_Angeles";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type Parts = { year: number; month: number; day: number; weekday: string; hour: number; minute: number };

const partsFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "long",
  hour: "numeric",
  minute: "2-digit",
  hourCycle: "h23",
});

function pacific(date: Date | string): Parts {
  const parts = Object.fromEntries(partsFormat.formatToParts(new Date(date)).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: parts.weekday,
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}

const dayIndex = (p: Parts) => Date.UTC(p.year, p.month - 1, p.day) / 86_400_000;

export const daysBetween = (from: Date, to: Date | string) => dayIndex(pacific(to)) - dayIndex(pacific(from));

// "Nov 30"
export function shortDate(iso: string) {
  const p = pacific(iso);
  return `${MONTHS[p.month - 1].slice(0, 3)} ${p.day}`;
}

// "Nov" and "30" for the timeline's date block
export function dateBlock(iso: string) {
  const p = pacific(iso);
  return { month: MONTHS[p.month - 1].slice(0, 3), day: String(p.day) };
}

// "November 30"
export function longDate(iso: string) {
  const p = pacific(iso);
  return `${MONTHS[p.month - 1]} ${p.day}`;
}

// "Monday, November 30, 2026"
export function fullDate(iso: string) {
  const p = pacific(iso);
  return `${p.weekday}, ${MONTHS[p.month - 1]} ${p.day}, ${p.year}`;
}

// "Oct 17, 2026". A check is a calendar date (stored as midnight UTC), so it's read as written, not moved to Pacific
export function checkedDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return `${MONTHS[month - 1].slice(0, 3)} ${day}, ${year}`;
}

const weekday = (iso: string) => pacific(iso).weekday;

// "11:59 p.m."
export function timeOfDay(iso: string) {
  const p = pacific(iso);
  const hour = p.hour % 12 || 12;
  return `${hour}:${String(p.minute).padStart(2, "0")} ${p.hour < 12 ? "a.m." : "p.m."}`;
}

// "2026-11" and "November 2026", for grouping by month
export function monthOf(iso: string) {
  const p = pacific(iso);
  return { key: `${p.year}-${String(p.month).padStart(2, "0")}`, title: `${MONTHS[p.month - 1]} ${p.year}` };
}

// fall-2027 → "Fall 2027"
export function cycleLabel(cycle: string) {
  const [season, year] = cycle.split("-");
  return `${season.charAt(0).toUpperCase()}${season.slice(1)} ${year ?? ""}`.trim();
}

const cycleYear = (cycle: string) => Number(cycle.split("-")[1]) || 0;
const byCycle = (a: string, b: string) => cycleYear(a) - cycleYear(b) || a.localeCompare(b);

export const nextCycle = (cycle: string) => `${cycle.split("-")[0]}-${cycleYear(cycle) + 1}`;

// A record's state on `now`, with the student's done mark
export function describe(record: DeadlineRecord, doneAt: string | null, now: Date): Deadline {
  const due = new Date(record.due_at);
  const opens = record.opens_at ? new Date(record.opens_at) : null;
  const past = now > due;
  const daysLeft = daysBetween(now, due);
  const windowOpen = Boolean(opens && now >= opens && !past);
  const notOpenYet = Boolean(opens && now < opens);
  let state: DeadlineState;
  if (doneAt) state = "done";
  else if (past) state = "missed";
  else if (daysLeft <= SOON_DAYS) state = "soon";
  else if (windowOpen) state = "open";
  else state = "later";
  return { ...record, doneAt, daysLeft, state, windowOpen, notOpenYet };
}

const SYSTEMS = ["uc", "csu"];

// The schools on the plan a date is for. Financial aid is for everyone, so it names none.
export function schoolsFor(record: DeadlineRecord, scope: Scope): School[] {
  if (!scope) return [];
  if (SYSTEMS.includes(record.audience)) {
    return scope.filter((s) => s.system === undefined || s.system?.toLowerCase() === record.audience);
  }
  return scope.filter((s) => s.id === record.audience);
}

// 14 → Which dates a student sees. With no plan: UC, CSU and aid dates together.
export function inAudience(record: DeadlineRecord, scope: Scope): boolean {
  if (record.audience === "aid") return true;
  if (!scope) return SYSTEMS.includes(record.audience);
  return schoolsFor(record, scope).length > 0;
}

// The student's term, or with none set the nearest cycle that still has upcoming dates
export function pickCycle(records: DeadlineRecord[], term: string | null, now: Date): string {
  if (term) return term;
  const upcoming = records.filter((r) => new Date(r.due_at) >= now).map((r) => r.cycle).sort(byCycle);
  if (upcoming.length) return upcoming[0];
  const all = records.map((r) => r.cycle).sort(byCycle);
  return all.at(-1) ?? `fall-${pacific(now).year + 1}`;
}

export type DeadlineView = {
  cycle: string;
  // Not done and not past, soonest first
  upcoming: Deadline[];
  // Done or past, newest first
  finished: Deadline[];
  demo: boolean;
};

export function buildView(
  records: DeadlineRecord[],
  doneAt: (id: string) => string | null,
  scope: Scope,
  term: string | null,
  now: Date,
): DeadlineView {
  const mine = records.filter((r) => inAudience(r, scope));
  const cycle = pickCycle(mine, term, now);
  const shown = mine
    .filter((r) => r.cycle === cycle)
    .map((r) => describe(r, doneAt(r.id), now))
    .sort((a, b) => a.due_at.localeCompare(b.due_at) || audienceOrder(a) - audienceOrder(b));
  return {
    cycle,
    upcoming: shown.filter((d) => d.state !== "done" && d.state !== "missed"),
    finished: shown.filter((d) => d.state === "done" || d.state === "missed").reverse(),
    demo: shown.some((d) => d.demo),
  };
}

// Same day: UC first, then CSU, then the rest (14 → Which checklist shows)
const audienceOrder = (d: DeadlineRecord) => {
  const i = SYSTEMS.indexOf(d.audience);
  return i === -1 ? SYSTEMS.length : i;
};

// "A", "A and B", "A, B and C"
export function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

// "Due Monday, Nov 30"
export const dueOnCard = (d: Deadline) => `Due ${weekday(d.due_at)}, ${shortDate(d.due_at)}`;

// "11:59 p.m. Pacific", "Date varies by campus", or nothing for a date with no stated time
export function timeLine(d: Deadline): string | null {
  if (d.varies_by_campus) return "Date varies by campus";
  return d.due_has_time ? `${timeOfDay(d.due_at)} Pacific` : null;
}

const systemName = (audience: string) => audience.toUpperCase();

// The card's third line, only when the plan has more than one school: "For UC San Diego", "For your 3 UC schools"
export function cardForLine(d: Deadline, scope: Scope): string | null {
  if (!scope || scope.length < 2) return null;
  const schools = schoolsFor(d, scope);
  if (schools.length === 0) return null;
  if (schools.length === 1) return `For ${schools[0].name}`;
  return `For your ${schools.length} ${systemName(d.audience)} schools`;
}

// The date sheet's line: "For UC San Diego and UC Davis"
export function sheetForLine(d: Deadline, scope: Scope): string | null {
  const schools = schoolsFor(d, scope);
  return schools.length ? `For ${joinNames(schools.map((s) => s.name))}` : null;
}

// The timeline row's second line: who it's for and the time, or when the window opens
export function rowDetail(d: Deadline, scope: Scope): string {
  if (d.notOpenYet && d.opens_at && d.state !== "done") return `Opens ${shortDate(d.opens_at)}`;
  if (d.varies_by_campus) return "Date varies by campus";
  let who: string;
  if (d.audience === "aid") who = "Financial aid";
  else if (SYSTEMS.includes(d.audience)) who = `All ${systemName(d.audience)} campuses`;
  else who = schoolsFor(d, scope)[0]?.name ?? "One campus";
  return d.due_has_time ? `${who}, ${timeOfDay(d.due_at)} Pacific` : who;
}

// The pill at 14 days or less: "In 14 days", "Tomorrow", "Today"
export function soonLabel(days: number) {
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

// "45 days left" in the date sheet, or the state that replaces it
export function countdownLine(d: Deadline): string {
  if (d.state === "done" && d.doneAt) return `Done ${shortDate(d.doneAt)}`;
  if (d.state === "missed") return "Closed";
  if (d.daysLeft <= 0) return "Due today";
  return d.daysLeft === 1 ? "1 day left" : `${d.daysLeft} days left`;
}

// The date sheet's "When": the full date and time, and the window's start
export function whenLines(d: Deadline): string[] {
  const time = d.due_has_time ? `, ${timeOfDay(d.due_at)} Pacific` : "";
  const lines = [`${fullDate(d.due_at)}${time}`];
  if (d.varies_by_campus) lines.push("Date varies by campus");
  if (d.opens_at && d.state !== "missed" && d.state !== "done") {
    lines.push(d.notOpenYet ? `Opens ${longDate(d.opens_at)}` : `Open since ${longDate(d.opens_at)}`);
  }
  return lines;
}

// How much of the filing window is gone, 0 to 1. Null before it opens.
export function windowProgress(d: Deadline, now: Date): number | null {
  if (!d.opens_at || d.notOpenYet) return null;
  const start = new Date(d.opens_at).getTime();
  const end = new Date(d.due_at).getTime();
  return Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)));
}

// The Deadlines screen's next line (15 → Top): "Due Monday, Nov 30, in 43 days." With a stated time,
// "Due Monday, Nov 30 at 5:00 p.m. Pacific, in 43 days." On the due day, "Due today."
export function nextDueLine(d: Deadline): string {
  if (d.daysLeft <= 0) return "Due today.";
  const time = d.due_has_time ? ` at ${timeOfDay(d.due_at)} Pacific` : "";
  return `${dueOnCard(d)}${time}, in ${d.daysLeft} ${d.daysLeft === 1 ? "day" : "days"}.`;
}

export type CycleBarNode = { at: number; kind: "soon" | "open" | "later" };
export type CycleBarView = { start: string; end: string; today: number; nodes: CycleBarNode[] };

const URGENCY = { soon: 0, open: 1, later: 2 } as const;

// "Oct 2026"
const monthYear = (iso: string) => {
  const p = pacific(iso);
  return `${MONTHS[p.month - 1].slice(0, 3)} ${p.year}`;
};

// The application year on one line (15 → Cycle bar): from the earliest opening or due date among the upcoming
// dates, or today if that's earlier, to the latest due date. Positions run 0 to 1. Dates on the same day share
// one node, drawn as the most urgent of them. Null with nothing upcoming.
export function cycleBar(upcoming: Deadline[], now: Date): CycleBarView | null {
  if (upcoming.length === 0) return null;
  const times = upcoming.flatMap((d) => (d.opens_at ? [d.opens_at, d.due_at] : [d.due_at])).map((t) => new Date(t).getTime());
  const start = Math.min(now.getTime(), ...times);
  const end = Math.max(...upcoming.map((d) => new Date(d.due_at).getTime()));
  const at = (t: number) => (end === start ? 0 : Math.min(1, Math.max(0, (t - start) / (end - start))));
  const byDay = new Map<string, CycleBarNode>();
  for (const d of upcoming) {
    if (d.state !== "soon" && d.state !== "open" && d.state !== "later") continue;
    const p = pacific(d.due_at);
    const day = `${p.year}-${p.month}-${p.day}`;
    const seen = byDay.get(day);
    if (!seen) byDay.set(day, { at: at(new Date(d.due_at).getTime()), kind: d.state });
    else if (URGENCY[d.state] < URGENCY[seen.kind]) seen.kind = d.state;
  }
  return { start: monthYear(new Date(start).toISOString()), end: monthYear(new Date(end).toISOString()), today: at(now.getTime()), nodes: [...byDay.values()] };
}

const dueIn = (days: number) => (days <= 0 ? "due today" : days === 1 ? "due tomorrow" : `due in ${days} days`);

// "Up next: UC application, due in 45 days, Monday November 30. Then Cal State Apply, November 30. … Opens all deadlines."
// `opens`: the stack opens the Deadlines screen
export function stackLabel(items: Deadline[], opens: boolean): string {
  const [top, ...rest] = items;
  const parts = [`Up next: ${top.title}, ${dueIn(top.daysLeft)}, ${weekday(top.due_at)} ${longDate(top.due_at)}.`];
  rest.forEach((d) => parts.push(`Then ${d.title}, ${longDate(d.due_at)}.`));
  if (opens) parts.push("Opens all deadlines.");
  return parts.join(" ");
}

// "UC application, due Monday November 30 at 11:59 p.m. Pacific, in 45 days, window open."
export function rowLabel(d: Deadline): string {
  if (d.state === "done") return `${d.title}, done.`;
  if (d.state === "missed") return `${d.title}, closed ${longDate(d.due_at)}.`;
  const time = d.due_has_time ? ` at ${timeOfDay(d.due_at)} Pacific` : "";
  const days = d.daysLeft <= 0 ? "today" : d.daysLeft === 1 ? "tomorrow" : `in ${d.daysLeft} days`;
  const window = d.windowOpen ? ", window open" : d.notOpenYet && d.opens_at ? `, opens ${longDate(d.opens_at)}` : "";
  const varies = d.varies_by_campus ? ", date varies by campus" : "";
  return `${d.title}, due ${weekday(d.due_at)} ${longDate(d.due_at)}${time}, ${days}${window}${varies}.`;
}

const unchecked = (items: { demo?: boolean; verified_at: string | null }[]) => items.some((i) => i.demo || !i.verified_at);

// The oldest check among the records, "Oct 17, 2026"
function oldestCheck(items: { verified_at: string | null }[]) {
  const dates = items.map((i) => i.verified_at).filter((v): v is string => Boolean(v)).sort();
  return dates.length ? checkedDate(dates[0]) : null;
}

// Under the timeline: where the shown dates come from and when they were checked
export function sourceLine(shown: Deadline[]): string {
  // "the California Student Aid Commission" reads right mid-sentence; UC Admissions and Cal State Apply don't take "the"
  const names = joinNames([...new Set(shown.map((d) => d.source_name))].map((n, i) => (i > 0 && n.startsWith("California") ? `the ${n}` : n)));
  const checked = oldestCheck(shown);
  const when = unchecked(shown) || !checked ? ". Demo data, not checked against the official sites yet." : `, checked ${checked}.`;
  return `Dates from ${names}${when} Schools can change dates, so confirm on the official site.`;
}

// The date sheet's source: "From UC Admissions, checked Oct 17, 2026."
export function recordSource(d: Deadline): string {
  const checked = oldestCheck([d]);
  return unchecked([d]) || !checked
    ? `From ${d.source_name}. Demo data, not checked against the official page yet.`
    : `From ${d.source_name}, checked ${checked}.`;
}

export type ChecklistView = {
  checklist: ChecklistRecord;
  deadline: Deadline;
  steps: { step: ChecklistStep; done: boolean }[];
  doneCount: number;
};

// The checklist for the application due next among the student's systems (14 → Which checklist shows).
// On the same due day UC comes first, and the other takes over once it's finished. No plan: UC.
export function pickChecklist(
  checklists: ChecklistRecord[],
  steps: ChecklistStep[],
  view: DeadlineView,
  scope: Scope,
  stepDone: (id: string) => boolean,
): ChecklistView | null {
  const candidates = view.upcoming
    .filter((d) => (scope ? true : d.audience === "uc"))
    .flatMap((deadline) => {
      const checklist = checklists.find((c) => c.deadline_id === deadline.id && c.cycle === view.cycle);
      if (!checklist) return [];
      const own = steps
        .filter((s) => s.checklist_id === checklist.id)
        .sort((a, b) => a.position - b.position)
        .map((step) => ({ step, done: stepDone(step.id) }));
      if (own.length === 0) return [];
      return [{ checklist, deadline, steps: own, doneCount: own.filter((s) => s.done).length }];
    });
  const [first, second] = candidates;
  if (!first) return null;
  const finished = first.doneCount === first.steps.length;
  if (finished && second && second.doneCount < second.steps.length && sameDay(first.deadline, second.deadline)) {
    return second;
  }
  return first;
}

const sameDay = (a: Deadline, b: Deadline) => dayIndex(pacific(a.due_at)) === dayIndex(pacific(b.due_at));

export const checklistTitle = (c: ChecklistView) =>
  c.doneCount === c.steps.length ? `Your ${c.checklist.name} is ready` : `Get your ${c.checklist.name} ready`;

// "4 steps left, due by Nov 30", or once every step is done, when to submit
export function checklistSubtitle(c: ChecklistView): string {
  const left = c.steps.length - c.doneCount;
  const due = shortDate(c.deadline.due_at);
  if (left === 0) {
    const time = c.deadline.due_has_time ? `, ${timeOfDay(c.deadline.due_at)} Pacific` : "";
    return `Submit it by ${due}${time}.`;
  }
  return `${left} ${left === 1 ? "step" : "steps"} left, due by ${due}`;
}

// "Steps from UC Admissions, checked Oct 17, 2026."
export function checklistSource(c: ChecklistView): string {
  const checked = oldestCheck([c.checklist]);
  return unchecked([c.checklist]) || c.steps.some((s) => s.step.demo) || !checked
    ? `Steps from ${c.checklist.source_name}. Demo data, not checked against the official site yet.`
    : `Steps from ${c.checklist.source_name}, checked ${checked}.`;
}
