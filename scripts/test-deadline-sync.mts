// Checks how the student's deadline marks reach their account (lib/data/mark-queue.ts): a failed mark never holds up
// the others, failures are retried with a growing wait, and reading the account never undoes an unsent mark.
// A fake account and a fake clock stand in for Supabase and timers. Also: the dates on the deadline screens show the
// right day in Pacific time. `npm run test:deadlines`
import { createMarkQueue, mergeFromAccount, retryDelay, RETRY_FIRST_MS, RETRY_MAX_MS, type PushError } from "../lib/data/mark-queue";
import {
  checkedDate,
  checklistSubtitle,
  checklistTitle,
  cycleBar,
  describe,
  fullDate,
  nextDueLine,
  pickChecklist,
  planHasMajor,
  recordSource,
  shortDate,
  type ChecklistRecord,
  type ChecklistStep,
  type ChecklistView,
  type Deadline,
  type DeadlineRecord,
  type DeadlineView,
  type Scope,
} from "../lib/deadlines";
import { stepNeeds } from "../lib/step-content";
import { stepLook, stepSlug } from "../lib/step-icons";

let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (!ok) failed++;
  console.log(ok ? "ok   " : "FAIL ", name, ok ? "" : JSON.stringify(detail));
}

const PERMANENT: PushError = { code: "42501", message: "new row violates row-level security policy" };
const NETWORK: PushError = { code: "", message: "TypeError: Failed to fetch" };
const MISSING: PushError = { code: "23503", message: "violates foreign key constraint" };

// A device with a queue, an account that answers each key as told, and a clock that runs only when asked
function setup(keys: string[], answer: (key: string) => PushError = () => null) {
  let queued = [...keys];
  const values: Record<string, string> = Object.fromEntries(keys.map((k) => [k, `v1:${k}`]));
  const sent: string[] = [];
  const waits: number[] = [];
  let due: (() => void) | null = null;
  let current = true;
  let respond = answer;
  const queue = createMarkQueue({
    keys: () => queued,
    remove: (key) => (queued = queued.filter((k) => k !== key)),
    snapshot: (key) => values[key] ?? "null",
    send: async (key) => {
      sent.push(key);
      await new Promise((resolve) => setTimeout(resolve, 1));
      return { error: respond(key) };
    },
    unsendable: (key) => key.endsWith("stand-in"),
    stillCurrent: () => current,
    later: (run, ms) => {
      waits.push(ms);
      due = run;
      return () => {
        if (due === run) due = null;
      };
    },
  });
  return {
    queue,
    queued: () => queued,
    sent,
    waits,
    values,
    // Lets the clock reach the next retry
    tick: async () => {
      const run = due;
      due = null;
      run?.();
      // Windows timers tick about every 15 ms, so the sends get room to finish
      await new Promise((resolve) => setTimeout(resolve, 200));
    },
    hasRetry: () => due !== null,
    answer: (next: (key: string) => PushError) => (respond = next),
    signOut: () => (current = false),
  };
}

// One mark the account refuses doesn't hold up the marks after it
let t = setup(["d:refused", "d:later", "s:step"], (key) => (key === "d:refused" ? PERMANENT : null));
await t.queue.flush();
check("a refused mark doesn't stop the marks queued after it", t.sent.join() === "d:refused,d:later,s:step", t.sent);
check("the marks after it are saved and leave the queue", t.queued().join() === "d:refused", t.queued());
check("the refused mark stays queued and a retry is set", t.hasRetry() && t.waits[0] === RETRY_FIRST_MS, t.waits);

// Retries wait longer each time, up to five minutes
await t.tick();
await t.tick();
await t.tick();
check("each retry waits twice as long: 2 s, 4 s, 8 s, 16 s", t.waits.slice(0, 4).join() === "2000,4000,8000,16000", t.waits);
check("the wait never grows past 5 minutes", retryDelay(7) === 256_000 && retryDelay(8) === RETRY_MAX_MS && retryDelay(20) === RETRY_MAX_MS);
check("a later mark still goes while one keeps failing", (() => {
  t.values["d:new"] = "v1:d:new";
  t.queued().push("d:new");
  return true;
})());
await t.tick();
check("…and is saved on the next retry", !t.queued().includes("d:new") && t.queued().includes("d:refused"), t.queued());

// Once the account accepts it, the queue empties and the waits start over
t.answer(() => null);
await t.tick();
check("a retry that succeeds empties the queue", t.queued().length === 0, t.queued());
check("…and leaves no retry waiting", !t.hasRetry());
check("…and the next failure starts again at 2 s", t.queue.attempts() === 0, t.queue.attempts());

// Offline: the pass ends at the first dropped request, and is tried again later
t = setup(["d:a", "d:b", "d:c"], () => NETWORK);
await t.queue.flush();
check("offline, the pass stops at the first dropped request", t.sent.join() === "d:a", t.sent);
check("offline, everything stays queued for a retry", t.queued().length === 3 && t.hasRetry(), { queued: t.queued(), retry: t.hasRetry() });
t.answer(() => null);
await t.tick();
check("back online, the retry sends all of it", t.queued().length === 0 && t.sent.join() === "d:a,d:a,d:b,d:c", t.sent);

// A date or step removed from the database can never be saved: dropped, not retried
t = setup(["d:removed", "d:kept"], (key) => (key === "d:removed" ? MISSING : null));
await t.queue.flush();
check("a mark on a removed record is dropped", t.queued().length === 0 && !t.hasRetry(), { queued: t.queued(), retry: t.hasRetry() });

// A stand-in id from before the database is dropped without being sent
t = setup(["d:stand-in", "d:real"]);
await t.queue.flush();
check("a stand-in id is dropped unsent", t.sent.join() === "d:real" && t.queued().length === 0, t.sent);

// Changed again while it was being sent: it stays for the next pass
t = setup(["d:x"]);
const sending = t.queue.flush();
t.values["d:x"] = "v2:d:x";
await sending;
check("a mark changed mid-send stays queued", t.queued().join() === "d:x", t.queued());

// Signing out: the retry for that account is dropped and nothing more is sent
t = setup(["d:refused"], () => PERMANENT);
await t.queue.flush();
const before = t.sent.length;
t.signOut();
await t.tick();
check("after sign-out a waiting retry sends nothing", t.sent.length === before, t.sent);
check("…and no retry is set again", !t.hasRetry());

// Reading the account back: its copy wins, except for marks still waiting or made during the read
const account = { a: "account-a", b: "account-b", gone: undefined } as Record<string, string | undefined>;
delete account.gone;
const device = { a: "device-a", b: "device-b", c: "device-c", local: "device-local" };
const merged = mergeFromAccount(account as Record<string, string>, device, (id) => id === "b" || id === "local");
check("the account's marks replace this device's", merged.a === "account-a", merged);
check("a mark still waiting to be sent keeps this device's value", merged.b === "device-b" && merged.local === "device-local", merged);
check("a mark the account no longer has is removed from this device", !("c" in merged), merged);
const undone = mergeFromAccount({ a: "account-a" }, {} as Record<string, string>, (id) => id === "a");
check("an undo still waiting to be sent isn't brought back by the read", !("a" in undone), undone);

// Dates as the database returns them. A check date is date-only, stored as midnight UTC: 5 p.m. the day before in
// Pacific, so it's read as a calendar date. Opening and due dates are Pacific times, so they're read in Pacific.
check("a date-only 2026-10-17 shows as Oct 17", checkedDate("2026-10-17") === "Oct 17, 2026", checkedDate("2026-10-17"));
check("…and as the database returns it", checkedDate("2026-10-17T00:00:00+00:00") === "Oct 17, 2026", checkedDate("2026-10-17T00:00:00+00:00"));
const checkedRow = { source_name: "UC Admissions", verified_at: "2026-10-17T00:00:00+00:00" } as Deadline;
check("the date sheet's source line says checked Oct 17, 2026", recordSource(checkedRow) === "From UC Admissions, checked Oct 17, 2026.", recordSource(checkedRow));
check("an opening day at Pacific midnight shows as Oct 1", shortDate("2026-10-01T07:00:00+00:00") === "Oct 1", shortDate("2026-10-01T07:00:00+00:00"));
check("a winter opening day shows as Dec 15", shortDate("2026-12-15T08:00:00+00:00") === "Dec 15", shortDate("2026-12-15T08:00:00+00:00"));
// The Get ready card's subtitle names the due date with "due by"
const card = (left: number) => ({ steps: Array(6).fill({}), doneCount: 6 - left, deadline: { due_at: "2026-12-01T07:59:59+00:00", due_has_time: false } }) as unknown as ChecklistView;
check("Get ready: 4 steps left, due by Nov 30", checklistSubtitle(card(4)) === "4 steps left, due by Nov 30", checklistSubtitle(card(4)));
check("Get ready: 1 step left, due by Nov 30", checklistSubtitle(card(1)) === "1 step left, due by Nov 30", checklistSubtitle(card(1)));
check("a due date at 23:59:59 Pacific stays Nov 30", shortDate("2026-12-01T07:59:59+00:00") === "Nov 30" && fullDate("2026-12-01T07:59:59+00:00") === "Monday, November 30, 2026", fullDate("2026-12-01T07:59:59+00:00"));

// The Deadlines screen's next line and cycle bar (15 → Top), with the fall 2027 dates on Oct 18, 2026
const record = (id: string, opens_at: string | null, due_at: string, due_has_time = false) =>
  ({ id, cycle: "fall-2027", audience: "uc", title: id, opens_at, due_at, due_has_time, varies_by_campus: false }) as unknown as DeadlineRecord;
const oct18 = new Date("2026-10-18T12:00:00-07:00");
const fall = [
  record("uc-application", "2026-10-01T00:00:00-07:00", "2026-11-30T23:59:59-08:00"),
  record("cal-state-apply", "2026-10-01T00:00:00-07:00", "2026-11-30T23:59:59-08:00"),
  record("academic-update", "2026-12-15T00:00:00-08:00", "2027-01-31T23:59:59-08:00"),
  record("fafsa", "2026-10-01T00:00:00-07:00", "2027-03-02T23:59:59-08:00"),
  record("accept-uc", null, "2027-06-01T23:59:59-07:00"),
].map((r) => describe(r, null, oct18));
check("next line: Due Monday, Nov 30, in 43 days.", nextDueLine(fall[0]) === "Due Monday, Nov 30, in 43 days.", nextDueLine(fall[0]));
const timed = describe(record("timed", null, "2026-11-30T17:00:00-08:00", true), null, oct18);
check("next line with a stated time", nextDueLine(timed) === "Due Monday, Nov 30 at 5:00 p.m. Pacific, in 43 days.", nextDueLine(timed));
check("next line on the due day: Due today.", nextDueLine(describe(record("today", null, "2026-11-30T23:59:59-08:00"), null, new Date("2026-11-30T09:00:00-08:00"))) === "Due today.");
const bar = cycleBar(fall, oct18);
check("cycle bar runs Oct 2026 to Jun 2027", bar?.start === "Oct 2026" && bar.end === "Jun 2027", bar);
check("cycle bar: two dates on Nov 30 share one node, so 4 nodes", bar?.nodes.length === 4, bar?.nodes);
check("cycle bar: open windows are blue rings, not-yet-open dates slate", JSON.stringify(bar?.nodes.map((n) => n.kind)) === JSON.stringify(["open", "later", "open", "later"]), bar?.nodes);
check("cycle bar: Jun 1 sits at the end, today about 7% in", bar?.nodes.at(-1)?.at === 1 && Math.abs((bar?.today ?? 0) - 0.07) < 0.01, bar?.today);
check("cycle bar: nothing upcoming, no bar", cycleBar([], oct18) === null);

// Step icons (16 → Step icons), keyed by a slug made from the step's title
// Phosphor names its components "MapPinLineIcon" and so on
const iconName = (title: string) => ((stepLook(title).icon as { displayName?: string }).displayName ?? "").replace(/Icon$/, "");
check("step slug", stepSlug("Pay the fee or ask for a waiver") === "pay-the-fee-or-ask-for-a-waiver", stepSlug("Pay the fee or ask for a waiver"));
const fall2027Steps: [string, string, string][] = [
  ["Pick your campuses and majors", "MapPinLine", "bg-tint-sky"],
  ["Enter your courses and grades", "BookOpenText", "bg-mint-100"],
  ["Write your personal insight answers", "PencilLine", "bg-tint-indigo"],
  ["Add activities and awards", "Trophy", "bg-amber-50"],
  ["Check for extra campus steps", "ListChecks", "bg-tint-indigo"],
  ["Pay the fee or ask for a waiver", "Receipt", "bg-tint-sky"],
  ["Submit by Nov 30", "PaperPlaneTilt", "bg-blue-600"],
];
for (const [title, icon, tile] of fall2027Steps) {
  check(`step icon: ${title} → ${icon}`, iconName(title) === icon && stepLook(title).tile === tile, `${iconName(title)} ${stepLook(title).tile}`);
}
check("step icon: the submit step keeps its tile when the date changes", iconName("Submit by Dec 1") === "PaperPlaneTilt");
check("step icon: an unknown step gets CheckSquare on sky", iconName("Send your transcripts") === "CheckSquare" && stepLook("Send your transcripts").tile === "bg-tint-sky");

// Step sheets and all-done wording (18): what each step needs, steps the plan checks, and "ready" only with the signals
check("needs: personal insight answers has two items", stepNeeds("uc", "Write your personal insight answers").length === 2);
check(
  "needs: UC fee is split in two",
  JSON.stringify(stepNeeds("uc", "Pay the fee or ask for a waiver")) ===
    JSON.stringify(["A credit card for the fee.", "For a fee waiver: your family's income and household size. The application tells you if you qualify."]),
);
check("needs: the submit step matches by its start", stepNeeds("uc", "Submit by Dec 1").length === 1 && stepNeeds("csu", "Submit by Nov 30").length === 2);
check("needs: Cal State Apply's campus step has four items", stepNeeds("csu", "Pick your campuses and majors").length === 4);
check("needs: no step has more than 4 items", ["uc", "csu"].every((sys) => fall2027Steps.every(([t]) => stepNeeds(sys, t).length <= 4)));
check("needs: an unknown step or system shows none", stepNeeds("uc", "Send your transcripts").length === 0 && stepNeeds("aid", "Submit by Nov 30").length === 0);

const ucsd: Scope = [{ id: "ucsd", name: "UC San Diego", system: "UC", hasMajor: true }];
const ucsdNoMajor: Scope = [{ id: "ucsd", name: "UC San Diego", system: "UC", hasMajor: false }];
check("plan signal: a UC with a major", planHasMajor(ucsd, "uc") && !planHasMajor(ucsdNoMajor, "uc") && !planHasMajor(ucsd, "csu") && !planHasMajor(null, "uc"));

const ucList = { id: "ucl", cycle: "fall-2027", deadline_id: "uc-application", name: "UC application" } as ChecklistRecord;
const ucSteps = [
  "Pick your campuses and majors",
  "Enter your courses and grades",
  "Write your personal insight answers",
  "Add activities and awards",
  "Pay the fee or ask for a waiver",
  "Submit by Nov 30",
].map((title, i) => ({ id: `s${i + 1}`, checklist_id: "ucl", position: i + 1, title, summary: "" }) as ChecklistStep);
const ucView: DeadlineView = { cycle: "fall-2027", upcoming: [fall[0]], finished: [], demo: false };
const pick = (scope: Scope, marked: string[], unchecked: string[] = [], essaysDone: number | null = null) =>
  pickChecklist([ucList], ucSteps, ucView, scope, (id) => marked.includes(id), (id) => unchecked.includes(id), essaysDone)!;
const fromPlan = pick(ucsd, []);
check("a plan with a UC and a major checks step 1, From your plan", fromPlan.steps[0].done && fromPlan.steps[0].auto === "plan" && fromPlan.doneCount === 1);
check("no major: step 1 isn't checked", !pick(ucsdNoMajor, []).steps[0].done);
const unchecked = pick(ucsd, [], ["s1"]);
check("unchecking step 1 sticks with the plan", !unchecked.steps[0].done && !unchecked.steps[0].auto);
const allSix = ["s1", "s2", "s3", "s4", "s5", "s6"];
const ready = pick(ucsd, allSix.slice(1));
check(
  "all six checked with a UC and a major: ready",
  ready.ready && checklistTitle(ready) === "Your UC application is ready" && checklistSubtitle(ready) === "Submit it by Nov 30.",
  [checklistTitle(ready), checklistSubtitle(ready)],
);
const notReady = pick(ucsdNoMajor, allSix);
check("all six checked with no major: All 6 steps checked", !notReady.ready && checklistTitle(notReady) === "All 6 steps checked", checklistTitle(notReady));
check(
  "…with the longer subtitle",
  checklistSubtitle(notReady) === "Submit it by Nov 30. Double-check your campuses and answers on UC's site.",
  checklistSubtitle(notReady),
);

// Essays (17) checks the writing step at 4 of 4 done, and "ready" needs it while Essays is on (18)
const fromEssays = pick(ucsd, [], [], 4);
check("Essays at 4 of 4 checks the writing step, From Essays", fromEssays.steps[2].done && fromEssays.steps[2].auto === "essays");
check("Essays at 3 of 4 leaves it unchecked", !pick(ucsd, [], [], 3).steps[2].done);
check("Essays off: the writing step waits for a tap", !pick(ucsd, [], [], null).steps[2].done);
check("unchecking the writing step sticks with Essays at 4", !pick(ucsd, [], ["s3"], 4).steps[2].done);
const tappedNotWritten = pick(ucsd, allSix, [], 2);
check(
  "all six tapped but Essays at 2 of 4: not ready",
  !tappedNotWritten.ready && checklistTitle(tappedNotWritten) === "All 6 steps checked",
  checklistTitle(tappedNotWritten),
);
const readyWithEssays = pick(ucsd, ["s2", "s4", "s5", "s6"], [], 4);
check(
  "the plan and Essays check their steps, the rest tapped: ready",
  readyWithEssays.ready && checklistTitle(readyWithEssays) === "Your UC application is ready",
  checklistTitle(readyWithEssays),
);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
