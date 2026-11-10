import { readSessionUser } from "@/lib/profile";

// How long a read that several screens share stays current. Moving between tabs within it shows the copy already on
// the phone without asking the database again; a change made on this phone updates that copy itself.
export const FRESH_MS = 5 * 60_000;

// When a read last succeeded, and for which account (another account's read is never current)
export function readStamp() {
  let stamp: { userId: string | null; at: number } | null = null;
  return {
    fresh: () => stamp !== null && stamp.userId === (readSessionUser()?.id ?? null) && Date.now() - stamp.at < FRESH_MS,
    mark: (userId: string | null) => {
      stamp = { userId, at: Date.now() };
    },
    clear: () => {
      stamp = null;
    },
  };
}
