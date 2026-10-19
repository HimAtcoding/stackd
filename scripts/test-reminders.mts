// Checks the reminder scheduling logic (lib/reminders/schedule.ts) against 14 → Reminders, with made-up clocks.
// No phone and no plugin: a fake stands in for Local Notifications. `npm run test:reminders`
import { describe, type DeadlineRecord } from "../lib/deadlines";
import { afterReminderChoice, announceReminderTap, onReminderTap } from "../lib/reminders/choice";
import {
  cancelAll,
  MAX_SCHEDULED,
  planReminders,
  reminderCopy,
  reminderItems,
  remindersSummary,
  replaceAll,
  rescheduleIfCurrent,
  serialized,
  type NotificationsApi,
  type PlannedReminder,
} from "../lib/reminders/schedule";

// The students are in California; the phone's clock is Pacific
process.env.TZ = "America/Los_Angeles";

let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (!ok) failed++;
  console.log(ok ? "ok   " : "FAIL ", name, ok ? "" : JSON.stringify(detail));
}

const record = (id: string, title: string, due_at: string, extra: Partial<DeadlineRecord> = {}): DeadlineRecord => ({
  id, cycle: "fall-2027", audience: "uc", kind: "application", title, summary: "A made-up date.", opens_at: null, due_at,
  due_has_time: false, varies_by_campus: false, source_name: "Test source", source_url: "https://example.org", retrieved_at: null,
  verified_at: "2026-10-16T00:00:00Z", verification_status: "verified", ...extra,
});
const UC = record("uc", "UC application", "2026-11-30T23:59:00-08:00", { due_has_time: true });
const CSU = record("csu", "Cal State Apply", "2026-11-30T23:59:59-08:00", { audience: "csu" });
const TAU = record("tau", "UC Transfer Academic Update", "2027-01-31T23:59:59-08:00", { kind: "update" });
const ACCEPT_CSU = record("accept-csu", "Accept your CSU offer", "2027-05-01T23:59:59-07:00", { audience: "csu", varies_by_campus: true });

const OCT_16 = new Date("2026-10-16T10:00:00-07:00");
const at = (now: Date, ...items: [DeadlineRecord, number[]][]) =>
  planReminders(items.map(([r, days]) => ({ deadline: describe(r, null, now), days })), now);
const local = (r: PlannedReminder) => `${r.at.getMonth() + 1}/${r.at.getDate()} ${r.at.getHours()}:${String(r.at.getMinutes()).padStart(2, "0")}`;

// 9:00 a.m., on the right days
let plan = at(OCT_16, [UC, [7, 1]]);
check("a week before and the day before, at 9:00 a.m.", plan.map(local).join(", ") === "11/23 9:00, 11/29 9:00", plan.map(local));
plan = at(OCT_16, [UC, [0]]);
check("the morning it's due is 9:00 a.m. on the due day", plan.map(local).join() === "11/30 9:00", plan.map(local));
plan = at(OCT_16, [record("dst", "Test", "2026-11-05T23:59:59-08:00"), [7, 1]]);
check("still 9:00 a.m. on both sides of the November clock change",
  plan.map(local).join(", ") === "10/29 9:00, 11/4 9:00" && plan[0].at.toISOString() === "2026-10-29T16:00:00.000Z" && plan[1].at.toISOString() === "2026-11-04T17:00:00.000Z",
  plan.map((p) => p.at.toISOString()));
plan = at(new Date("2026-11-29T10:00:00-08:00"), [UC, [7, 1, 0]]);
check("reminders whose time has passed are skipped", plan.map(local).join() === "11/30 9:00", plan.map(local));
plan = at(new Date("2026-11-30T09:30:00-08:00"), [UC, [0]]);
check("after 9:00 on the due day, nothing is left to schedule", plan.length === 0, plan);
check("no chosen days, no reminders", at(OCT_16, [UC, []]).length === 0);
check("the same day chosen twice is one reminder", at(OCT_16, [UC, [1, 1]]).length === 1);

// At most one a day
plan = at(OCT_16, [UC, [7, 1]], [CSU, [7, 1]]);
check("two dates on the same mornings make one notification a day", plan.length === 2 && new Set(plan.map((p) => p.id)).size === 2, plan.map(local));
check("the notification's id is its day, so a day can only have one", plan.every((p) => p.id === Date.UTC(p.at.getFullYear(), p.at.getMonth(), p.at.getDate()) / 86_400_000));
check("a combined reminder opens the date due first", plan[0].deadlineId === "uc", plan[0]);

// The spec's copy (14 → Notification copy), word for word
const copy = (r: DeadlineRecord, days: number) => reminderCopy([{ deadline: describe(r, null, OCT_16), days }]);
const same = (name: string, got: { title: string; body: string }, title: string, body: string) =>
  check(name, got.title === title && got.body === body, got);
same("1 week before", copy(UC, 7), "UC application due in 7 days", "Due Monday, Nov 30 at 11:59 p.m. Pacific. Open Stackd to see what's left.");
same("3 days before", copy(UC, 3), "UC application due in 3 days", "Due Monday at 11:59 p.m. Pacific.");
same("1 day before", copy(UC, 1), "UC application due tomorrow", "Due tomorrow at 11:59 p.m. Pacific.");
same("the morning it's due", copy(UC, 0), "UC application due today", "Due tonight at 11:59 p.m. Pacific.");
const UC_CSU_TIMED = { ...CSU, due_at: "2026-11-30T23:59:00-08:00", due_has_time: true };
same("two or more on one morning",
  reminderCopy([{ deadline: describe(UC, null, OCT_16), days: 1 }, { deadline: describe(UC_CSU_TIMED, null, OCT_16), days: 1 }]),
  "2 deadlines tomorrow", "UC application and Cal State Apply, both due at 11:59 p.m. Pacific.");

// Copy the spec doesn't spell out (listed in the pull request for review)
same("a date with no stated time, a week before", copy(TAU, 7), "UC Transfer Academic Update due in 7 days", "Due Sunday, Jan 31. Open Stackd to see what's left.");
same("a date with no stated time, 3 days before", copy(TAU, 3), "UC Transfer Academic Update due in 3 days", "Due Sunday, Jan 31.");
same("a date with no stated time, the day before", copy(TAU, 1), "UC Transfer Academic Update due tomorrow", "Due tomorrow.");
same("a date with no stated time, the morning it's due", copy(TAU, 0), "UC Transfer Academic Update due today", "Due today.");
same("a date that varies by campus", copy(ACCEPT_CSU, 7), "Accept your CSU offer due in 7 days", "Due Saturday, May 1. Check your campus's date. Open Stackd to see what's left.");
same("a date that varies by campus, the day before", copy(ACCEPT_CSU, 1), "Accept your CSU offer due tomorrow", "Due tomorrow. Check your campus's date.");
same("two on one morning, one with a time and one without", at(OCT_16, [UC, [1]], [CSU, [1]])[0],
  "2 deadlines tomorrow", "UC application is due tomorrow at 11:59 p.m. Pacific. Cal State Apply is due tomorrow.");
const CSU_ACCEPT_SAME_DAY = { ...ACCEPT_CSU, id: "b", title: "Accept your UC offer", audience: "uc", varies_by_campus: false };
same("two on one morning, neither with a time",
  reminderCopy([{ deadline: describe(ACCEPT_CSU, null, OCT_16), days: 3 }, { deadline: describe(CSU_ACCEPT_SAME_DAY, null, OCT_16), days: 3 }]),
  "2 deadlines in 3 days", "Accept your CSU offer and Accept your UC offer, both due Saturday, May 1. Check your campus's date.");
same("two on one morning, due on different days", at(OCT_16, [UC, [1]], [record("dec", "Test scholarship", "2026-12-06T23:59:59-08:00"), [7]])[0],
  "2 deadlines coming up", "UC application is due tomorrow at 11:59 p.m. Pacific. Test scholarship is due in 7 days, Sunday, Dec 6.");
same("three on one morning",
  reminderCopy([UC, UC_CSU_TIMED, { ...UC, id: "c", title: "Test form" }].map((r) => ({ deadline: describe(r, null, OCT_16), days: 0 }))),
  "3 deadlines today", "UC application, Cal State Apply and Test form, all due at 11:59 p.m. Pacific.");

// Tone: calm and exact
const everything = [UC, CSU, TAU, ACCEPT_CSU].flatMap((r) => [7, 3, 1, 0].map((d) => copy(r, d)));
everything.push(...at(OCT_16, [UC, [7, 3, 1, 0]], [CSU, [7, 3, 1, 0]], [TAU, [7, 3, 1, 0]]));
check("no exclamation points or urgency words in any reminder",
  everything.every((c) => !/!|hurry|don't miss|last chance|urgent|act now|asap|before it's too late/i.test(`${c.title} ${c.body}`)),
  everything.filter((c) => /!|hurry|miss|urgent/i.test(`${c.title} ${c.body}`)));

// iOS keeps 64: the soonest 60
const many = Array.from({ length: 70 }, (_, i) => record(`d${i}`, `Date ${i}`, new Date(2026, 10, 1 + i, 23, 59, 59).toISOString()));
plan = at(OCT_16, ...many.map((r): [DeadlineRecord, number[]] => [r, [0]]));
check(`only the soonest ${MAX_SCHEDULED} are scheduled`, plan.length === MAX_SCHEDULED && plan[0].deadlineId === "d0" && plan.at(-1)?.deadlineId === "d59", plan.length);
check("in order, soonest first", plan.every((p, i) => i === 0 || p.at > plan[i - 1].at));

// Which dates get reminders: not done, with the date's own days or the default
const now = OCT_16;
const upcoming = [describe(UC, null, now), describe(CSU, "2026-10-10T00:00:00Z", now), describe(TAU, null, now)];
const items = reminderItems(upcoming, { tau: { reminders: [3] } }, [7, 1]);
check("a date marked done gets no reminders", !items.some((i) => i.deadline.id === "csu"), items.map((i) => i.deadline.id));
check("a date the student hasn't changed follows the default", items.find((i) => i.deadline.id === "uc")?.days.join() === "7,1");
check("a date with its own choices keeps them", items.find((i) => i.deadline.id === "tau")?.days.join() === "3");
check("a date with every choice turned off gets none", reminderItems([describe(UC, null, now)], { uc: { reminders: [] } }, [7, 1])[0].days.length === 0);

// Settings' "Remind me" value: one or two choices by name, "{n} reminders" for three or more, "None" for none
const summary = (days: number[], want: string) => check(`Remind me row with [${days.join(", ")}] reads "${want}"`, remindersSummary(days) === want, remindersSummary(days));
summary([], "None");
summary([7], "1 week before");
summary([3], "3 days before");
summary([1], "1 day before");
summary([0], "The morning it's due");
summary([7, 1], "1 week and 1 day before");
summary([1, 7], "1 week and 1 day before");
summary([3, 1], "3 days and 1 day before");
summary([7, 0], "1 week before and the morning it's due");
summary([7, 7], "1 week before");
summary([7, 3, 1], "3 reminders");
summary([7, 1, 0], "3 reminders");
summary([7, 3, 1, 0], "4 reminders");

// Putting them on the phone: cancel everything pending, then schedule the new set
function fakePhone(pendingIds: number[] = []) {
  let pending = pendingIds.map((id) => ({ id, title: "old", body: "old", extra: undefined as unknown }));
  const api: NotificationsApi = {
    async getPending() {
      return { notifications: pending.map((p) => ({ id: p.id })) };
    },
    async cancel({ notifications }) {
      const gone = new Set(notifications.map((n) => n.id));
      pending = pending.filter((p) => !gone.has(p.id));
    },
    async schedule({ notifications }) {
      pending.push(...notifications.map((n) => ({ id: n.id, title: n.title, body: n.body, extra: n.extra })));
    },
  };
  return { api, pending: () => pending };
}

const phone = fakePhone([1, 2, 3]);
const first = at(OCT_16, [UC, [7, 1]], [CSU, [7, 1]]);
await replaceAll(phone.api, first);
check("rescheduling replaces what was pending", phone.pending().length === 2 && phone.pending().every((p) => p.title !== "old"), phone.pending());
check("each reminder knows which date to open", phone.pending().every((p) => (p.extra as { deadlineId?: string })?.deadlineId === "uc"), phone.pending());
// Marking the UC application done: the next reschedule leaves only Cal State Apply's reminders
const afterDone = planReminders(reminderItems([describe(UC, "2026-10-17T00:00:00Z", now), describe(CSU, null, now)], {}, [7, 1]), now);
await replaceAll(phone.api, afterDone);
check("marking a date done takes its reminders away", phone.pending().length === 2 && phone.pending().every((p) => p.title.startsWith("Cal State Apply")), phone.pending());
await replaceAll(phone.api, []);
check("turning reminders off leaves nothing scheduled", phone.pending().length === 0, phone.pending());
await replaceAll(phone.api, first);
await cancelAll(phone.api);
check("signing out cancels every scheduled reminder", phone.pending().length === 0, phone.pending());

// Signing out while a reschedule is still on the phone (getPending, cancel, schedule, each a moment apart)
function slowPhone() {
  const phone = fakePhone([1, 2, 3]);
  const later = <T,>(work: () => Promise<T>) => new Promise<T>((resolve) => setTimeout(() => resolve(work()), 5));
  const api: NotificationsApi = {
    getPending: () => later(() => phone.api.getPending()),
    cancel: (o) => later(() => phone.api.cancel(o)),
    schedule: (o) => later(() => phone.api.schedule(o)),
  };
  return { api, pending: phone.pending };
}
let racing = slowPhone();
await Promise.all([replaceAll(racing.api, first), cancelAll(racing.api)]);
check("without the lock, a sign-out's cancel can be undone (the race this guards against)", racing.pending().length > 0, racing.pending());

racing = slowPhone();
let signedIn = true;
let lock = serialized();
const rescheduling = lock(() => rescheduleIfCurrent(racing.api, first, () => signedIn));
// The reschedule is already on the phone (between getPending and cancel) when the student signs out
await new Promise((resolve) => setTimeout(resolve, 2));
signedIn = false;
await Promise.all([rescheduling, lock(() => cancelAll(racing.api))]);
check("with the lock, signing out mid-reschedule leaves nothing scheduled", racing.pending().length === 0, racing.pending());

racing = slowPhone();
signedIn = true;
lock = serialized();
const cancelling = lock(() => cancelAll(racing.api));
signedIn = false;
await Promise.all([cancelling, lock(() => rescheduleIfCurrent(racing.api, first, () => signedIn))]);
check("a reschedule that starts after sign-out schedules nothing for that account", racing.pending().length === 0, racing.pending());

racing = slowPhone();
lock = serialized();
await Promise.all([lock(() => rescheduleIfCurrent(racing.api, first, () => true)), lock(() => rescheduleIfCurrent(racing.api, afterDone, () => true))]);
check("two reschedules in a row end with the newer set", racing.pending().length === 2 && racing.pending().every((p) => p.title.startsWith("Cal State Apply")), racing.pending());

lock = serialized();
const order: string[] = [];
await Promise.allSettled([
  lock(async () => {
    order.push("a");
    throw new Error("phone said no");
  }),
  lock(async () => void order.push("b")),
]);
check("a failed job doesn't block the next one", order.join() === "a,b", order);

// A reminder choice in a date sheet: what comes next
const choice = (permission: string, on: boolean, before: number[], after: number[]) => afterReminderChoice({ permission, on, before, after });
check("iOS hasn't asked yet: the soft ask comes first", choice("prompt", false, [7, 1], [7, 3, 1]) === "soft-ask");
check("reminders off in Settings, a day added: asked before turning them on", choice("granted", false, [7, 1], [7, 3, 1]) === "confirm-turn-on");
check("reminders off in Settings, a day taken away: just saved, nothing turned on", choice("granted", false, [7, 1], [7]) === "save");
check("reminders off in Settings, the last day taken away: just saved", choice("granted", false, [1], []) === "save");
check("reminders already on: just saved", choice("granted", true, [7, 1], [7, 3, 1]) === "save");
check("iOS permission denied: just saved (the sheet shows Open Settings instead)", choice("denied", false, [7, 1], [7, 3, 1]) === "save");

// A reminder tapped while the Deadlines screen is open reaches it, even for the date already in the address
const globals = globalThis as Record<string, unknown>;
globals.window = new EventTarget();
const opened: string[] = [];
const stopListening = onReminderTap((id) => opened.push(id));
announceReminderTap("uc");
announceReminderTap("uc");
check("each tap reaches the open screen, the same date twice included", opened.join() === "uc,uc", opened);
stopListening();
announceReminderTap("csu");
check("after the screen closes, taps go nowhere", opened.join() === "uc,uc", opened);
delete globals.window;

// The release (v1.1, reminders on) cancels through the notifications plugin when an iPhone signs out. With the
// reminders flag off, sign-out never loads the plugin.
const { spawnSync } = await import("node:child_process");
const probe = (remindersOff: boolean) => {
  const env = { ...process.env };
  delete env.NEXT_PUBLIC_FEATURES;
  if (remindersOff) env.STACKD_REMINDERS_OFF = "1";
  else delete env.STACKD_REMINDERS_OFF;
  const run = spawnSync(process.execPath, ["--import", "tsx", "scripts/reminders-gate-probe.mts"], { env, encoding: "utf8" });
  try {
    return JSON.parse(run.stdout.trim().split("\n").at(-1) ?? "") as { loads: number; reminders: boolean };
  } catch {
    return { loads: -1, reminders: undefined, error: run.stderr.slice(0, 300) };
  }
};
const off = probe(true);
check("reminders flag off: sign-out on an iPhone doesn't load the plugin", off.loads === 0 && off.reminders === false, off);
const on = probe(false);
check("release (reminders on): sign-out on an iPhone cancels through the plugin", on.loads === 1 && on.reminders === true, on);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
