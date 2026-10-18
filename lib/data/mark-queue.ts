// Sends the student's deadline marks, checklist steps and term to their account, oldest first (lib/data/deadlines.ts).
// No React and no Supabase here: storage, the network and the clock come in as functions, so the rules can be tested.

export type PushError = { code?: string; message?: string } | null;

// The account no longer has that date or step (a foreign-key miss): the mark can never be saved, so it's dropped
const MISSING_RECORD = "23503";

export const RETRY_FIRST_MS = 2_000;
export const RETRY_MAX_MS = 5 * 60_000;

// 2 s, 4 s, 8 s … up to 5 minutes between tries
export const retryDelay = (attempt: number) => Math.min(RETRY_FIRST_MS * 2 ** attempt, RETRY_MAX_MS);

// No status at all means the request never got an answer: offline, or the connection dropped
const isNetworkError = (error: NonNullable<PushError>) => !error.code;

export type MarkQueueDeps = {
  // Keys waiting to be sent, oldest first ("term", "d:{deadlineId}", "s:{stepId}")
  keys: () => string[];
  remove: (key: string) => void;
  // The key's value right now, as text, to tell whether it changed while it was being sent
  snapshot: (key: string) => string;
  send: (key: string) => Promise<{ error: PushError }>;
  // A key that can never be sent (a stand-in id from before the database): dropped without trying
  unsendable: (key: string) => boolean;
  // Still the account the queue belongs to
  stillCurrent: () => boolean;
  later: (run: () => void, ms: number) => () => void;
};

export function createMarkQueue(deps: MarkQueueDeps) {
  let flushing = false;
  let again = false;
  let attempt = 0;
  let cancelRetry: (() => void) | null = null;

  function scheduleRetry() {
    cancelRetry?.();
    const ms = retryDelay(attempt);
    attempt++;
    cancelRetry = deps.later(() => {
      cancelRetry = null;
      flush().catch(() => {});
    }, ms);
  }

  // One pass over the queue. A failed key stays queued and the rest still go; a dropped connection ends the pass.
  // Anything left is tried again later, each time waiting longer.
  async function flush(): Promise<void> {
    // A retry that fires after the student signed out (or another signed in) sends nothing
    if (!deps.stillCurrent()) return stop();
    if (flushing) {
      again = true;
      return;
    }
    flushing = true;
    let failed = false;
    try {
      for (const key of deps.keys()) {
        if (deps.unsendable(key)) {
          deps.remove(key);
          continue;
        }
        const sent = deps.snapshot(key);
        const { error } = await deps.send(key);
        if (!deps.stillCurrent()) return;
        if (error && error.code !== MISSING_RECORD) {
          failed = true;
          if (isNetworkError(error)) break;
          continue;
        }
        // Changed again while it was being sent: it stays queued, and goes on the next pass
        if (deps.snapshot(key) === sent) deps.remove(key);
      }
    } finally {
      flushing = false;
    }
    if (again) {
      again = false;
      return flush();
    }
    if (failed && deps.keys().length) scheduleRetry();
    else {
      attempt = 0;
      cancelRetry?.();
      cancelRetry = null;
    }
  }

  // Sign-out: nothing more is tried for this account
  function stop() {
    cancelRetry?.();
    cancelRetry = null;
    attempt = 0;
  }

  return { flush, stop, pendingRetry: () => cancelRetry !== null, attempts: () => attempt };
}

// The account's copy replaces this device's, except for keys still waiting to be sent or changed since the read
// began: those keep this device's value, so a pull never undoes a mark the student just made.
export function mergeFromAccount<T>(account: Record<string, T>, device: Record<string, T>, keepDevice: (id: string) => boolean): Record<string, T> {
  const merged: Record<string, T> = {};
  for (const id of new Set([...Object.keys(account), ...Object.keys(device)])) {
    const value = keepDevice(id) ? device[id] : account[id];
    if (value !== undefined) merged[id] = value;
  }
  return merged;
}
