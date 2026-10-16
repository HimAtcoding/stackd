import { joinNames, shortDate, timeOfDay, type Deadline } from "@/lib/deadlines";

// Which deadline reminders to schedule on the phone, and their words (14 → Reminders). No Capacitor and no React
// here, so scripts/test-reminders.ts can check it with any clock.
//   One notification per chosen day, at 9:00 a.m. local time; "the morning it's due" is 9:00 on the due day.
//   At most one per day: dates reminded on the same morning share one notification.
//   iOS keeps 64 per app, so only the soonest 60 are scheduled, and the app tops them up each time it opens.

export const REMINDER_HOUR = 9;
export const MAX_SCHEDULED = 60;

export type ReminderItem = { deadline: Deadline; days: number[] };
export type PlannedReminder = { id: number; at: Date; title: string; body: string; deadlineId: string };

const ZONE = "America/Los_Angeles";
const partsFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "long",
  hour: "numeric",
  hourCycle: "h23",
});

// The due date's calendar day and weekday in Pacific time, the same day the screens count down to
function pacificDay(iso: string) {
  const p = Object.fromEntries(partsFormat.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { year: Number(p.year), month: Number(p.month), day: Number(p.day), weekday: p.weekday, hour: Number(p.hour) % 24 };
}

// The dates to remind about: upcoming and not done (DeadlineView.upcoming), each with its own days or the default
export function reminderItems(upcoming: Deadline[], marks: Record<string, { reminders?: number[] } | undefined>, defaults: number[]): ReminderItem[] {
  return upcoming
    .filter((d) => d.state !== "done" && d.state !== "missed")
    .map((deadline) => ({ deadline, days: marks[deadline.id]?.reminders ?? defaults }));
}

// A local calendar day as a whole number, which is also the notification's id: one per day, never two
const dayNumber = (at: Date) => Date.UTC(at.getFullYear(), at.getMonth(), at.getDate()) / 86_400_000;

export function planReminders(items: ReminderItem[], now: Date, limit = MAX_SCHEDULED): PlannedReminder[] {
  const byDay = new Map<number, { at: Date; entries: { deadline: Deadline; days: number }[] }>();
  for (const { deadline, days } of items) {
    const due = pacificDay(deadline.due_at);
    for (const before of new Set(days)) {
      // 9:00 a.m. on this phone's clock, so a clock change in between doesn't move it
      const at = new Date(due.year, due.month - 1, due.day - before, REMINDER_HOUR, 0, 0, 0);
      if (at <= now || at >= new Date(deadline.due_at)) continue;
      const key = dayNumber(at);
      const group = byDay.get(key) ?? { at, entries: [] };
      group.entries.push({ deadline, days: before });
      byDay.set(key, group);
    }
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .slice(0, limit)
    .map(([id, { at, entries }]) => {
      entries.sort((a, b) => a.deadline.due_at.localeCompare(b.deadline.due_at) || a.deadline.title.localeCompare(b.deadline.title));
      return { id, at, ...reminderCopy(entries), deadlineId: entries[0].deadline.id };
    });
}

// Copy (14 → Notification copy). Calm and exact: no exclamation points, no urgency words.

const VARIES = "Check your campus's date.";

const when = (days: number) => (days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`);

// "11:59 p.m. Pacific", or null for a date with no stated time
const timeOf = (d: Deadline) => (d.due_has_time ? `${timeOfDay(d.due_at)} Pacific` : null);

// "tonight" only for an evening time; "today" otherwise
const sameDayWord = (d: Deadline) => (d.due_has_time && pacificDay(d.due_at).hour >= 17 ? "tonight" : "today");

// When a date is due, as part of a sentence: "tonight at 11:59 p.m. Pacific", "tomorrow", "in 7 days, Tuesday, Mar 2"
function duePhrase(d: Deadline, days: number) {
  const time = timeOf(d);
  const at = time ? ` at ${time}` : "";
  if (days <= 0) return `${sameDayWord(d)}${at}`;
  if (days === 1) return `tomorrow${at}`;
  return `in ${days} days, ${pacificDay(d.due_at).weekday}, ${shortDate(d.due_at)}${at}`;
}

function single(d: Deadline, days: number) {
  const time = timeOf(d);
  const weekday = pacificDay(d.due_at).weekday;
  let due: string;
  if (days <= 0) due = time ? `Due ${sameDayWord(d)} at ${time}.` : "Due today.";
  else if (days === 1) due = time ? `Due tomorrow at ${time}.` : "Due tomorrow.";
  else if (days < 7) due = time ? `Due ${weekday} at ${time}.` : `Due ${weekday}, ${shortDate(d.due_at)}.`;
  else due = `Due ${weekday}, ${shortDate(d.due_at)}${time ? ` at ${time}` : ""}.`;
  const body = [due, d.varies_by_campus ? VARIES : null, days >= 7 ? "Open Stackd to see what's left." : null].filter(Boolean).join(" ");
  return { title: `${d.title} due ${when(days)}`, body };
}

export function reminderCopy(entries: { deadline: Deadline; days: number }[]): { title: string; body: string } {
  if (entries.length === 1) return single(entries[0].deadline, entries[0].days);

  const names = entries.map((e) => e.deadline.title);
  const together = entries.length === 2 ? "both" : "all";
  const varies = entries.some((e) => e.deadline.varies_by_campus) ? ` ${VARIES}` : "";
  const sameDays = entries.every((e) => e.days === entries[0].days);

  if (sameDays) {
    const days = entries[0].days;
    const title = `${entries.length} deadlines ${when(days)}`;
    const times = new Set(entries.map((e) => timeOf(e.deadline)));
    const [time] = times;
    // Same stated time: "UC application and Cal State Apply, both due at 11:59 p.m. Pacific."
    if (times.size === 1 && time) return { title, body: `${joinNames(names)}, ${together} due at ${time}.${varies}` };
    // No stated time for any of them: "…, both due today." / "…, both due Tuesday, Mar 2."
    if (times.size === 1) {
      const d = entries[0].deadline;
      const day = days <= 0 ? "today" : days === 1 ? "tomorrow" : `${pacificDay(d.due_at).weekday}, ${shortDate(d.due_at)}`;
      return { title, body: `${joinNames(names)}, ${together} due ${day}.${varies}` };
    }
  }

  // Different days or times: one sentence each, soonest first
  const title = sameDays ? `${entries.length} deadlines ${when(entries[0].days)}` : `${entries.length} deadlines coming up`;
  const body = entries.map((e) => `${e.deadline.title} is due ${duePhrase(e.deadline, e.days)}.`).join(" ");
  return { title, body: `${body}${varies}` };
}

// Putting a planned set on the phone. The plugin is passed in, so the tests can use a fake.
export type NotificationsApi = {
  getPending(): Promise<{ notifications: { id: number }[] }>;
  cancel(options: { notifications: { id: number }[] }): Promise<void>;
  schedule(options: {
    notifications: { id: number; title: string; body: string; schedule: { at: Date; allowWhileIdle?: boolean }; extra?: { deadlineId: string } }[];
  }): Promise<unknown>;
};

export async function cancelAll(api: NotificationsApi) {
  const { notifications } = await api.getPending();
  if (notifications.length) await api.cancel({ notifications: notifications.map((n) => ({ id: n.id })) });
}

// Everything pending is cancelled, then the new set scheduled, so a moved or removed reminder never lingers
export async function replaceAll(api: NotificationsApi, planned: PlannedReminder[]) {
  await cancelAll(api);
  if (!planned.length) return;
  await api.schedule({
    notifications: planned.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      schedule: { at: r.at, allowWhileIdle: true },
      // Tapping it opens /deadlines/?id={deadlineId} (lib/reminders/sync.ts)
      extra: { deadlineId: r.deadlineId },
    })),
  });
}
