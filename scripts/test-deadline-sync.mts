// Checks how the student's deadline marks reach their account (lib/data/mark-queue.ts): a failed mark never holds up
// the others, failures are retried with a growing wait, and reading the account never undoes an unsent mark.
// A fake account and a fake clock stand in for Supabase and timers. `npm run test:deadlines`
import { createMarkQueue, mergeFromAccount, retryDelay, RETRY_FIRST_MS, RETRY_MAX_MS, type PushError } from "../lib/data/mark-queue";

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

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
