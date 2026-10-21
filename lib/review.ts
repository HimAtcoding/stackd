// Bringing drafts in, sending them out, and review links (19-essay-import-share-review.md). No React and no storage
// here; lib/data/reviews.ts and the screens use it.
import { SITE_URL } from "./about";
import { countWords, WORD_LIMIT } from "./essays";
import { shortDate } from "./deadlines";

// A random secret, base64url: 32 bytes → 43 characters (a link's token), 24 → 32 (a reviewer's browser key)
export function makeSecret(bytes = 32): string {
  const raw = crypto.getRandomValues(new Uint8Array(bytes));
  let text = "";
  for (const b of raw) text += String.fromCharCode(b);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// The public review page for a token. It's on the website, so it works from the app too.
export const reviewUrl = (token: string) => `${SITE_URL}/review/?t=${token}`;

// The message the share sheet opens with (19 → Student side)
export const reviewMessage = (url: string) => `Could you review my UC personal insight answer? ${url}`;

// Text brought in by Paste a draft or Import a file (19 → Cleaning): plain text, line endings made plain, spaces at
// line ends trimmed, and 3 or more line breaks collapsed to 2. Quotes and dashes stay as typed.
export function cleanImported(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t ]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+|\n+$/g, "");
}

// Bringing text into an answer that already has some: replace it, or add it after a blank line
export function combineDraft(current: string, incoming: string, mode: "replace" | "append"): string {
  if (mode === "replace" || !current.trim()) return incoming;
  return `${current.replace(/\s+$/, "")}\n\n${incoming}`;
}

// The file Download all answers builds (19 → Send a draft out): each answer's short name, the answer, then
// "({n} words)", with a blank line between answers
export function answersFile(answers: { short_name: string; body: string }[]): string {
  return answers
    .filter((a) => a.body.trim())
    .map((a) => {
      const words = countWords(a.body);
      return `${a.short_name}\n\n${a.body.trim()}\n\n(${words} ${words === 1 ? "word" : "words"}${words > WORD_LIMIT ? `, ${words - WORD_LIMIT} over ${WORD_LIMIT}` : ""})`;
    })
    .join("\n\n\n");
}

export const ANSWERS_FILE_NAME = "stackd-personal-insight-answers.txt";

// "Created Oct 19, ends Nov 2", or "Turned off" / "Ended Nov 2" once it can't be opened
export function linkDates(link: { created_at: string; expires_at: string; revoked_at: string | null }, now = new Date()): string {
  if (link.revoked_at) return `Created ${shortDate(link.created_at)}, turned off ${shortDate(link.revoked_at)}`;
  if (new Date(link.expires_at) <= now) return `Created ${shortDate(link.created_at)}, ended ${shortDate(link.expires_at)}`;
  return `Created ${shortDate(link.created_at)}, ends ${shortDate(link.expires_at)}`;
}

export const linkLive = (link: { expires_at: string; revoked_at: string | null }, now = new Date()) =>
  !link.revoked_at && new Date(link.expires_at) > now;

// A comment's quoted phrase no longer in the reviewer's text (after Send latest version): "This part has changed."
export const quoteChanged = (quote: string | null, text: string) => Boolean(quote) && !text.includes(quote as string);

// "1 new comment", "3 new comments"
export const newComments = (n: number) => `${n} new ${n === 1 ? "comment" : "comments"}`;

// Where a quote sits in the student's current text, to select it; null when it's gone
export function findQuote(text: string, quote: string): { start: number; end: number } | null {
  const start = text.indexOf(quote);
  return start < 0 ? null : { start, end: start + quote.length };
}

// The reviewer's text split into plain runs and highlighted runs for the quoted phrases (first match of each),
// overlaps merged
export function highlightRuns(text: string, quotes: string[]): { text: string; quote: string | null }[] {
  const spans = quotes
    .map((q) => ({ q, start: q ? text.indexOf(q) : -1 }))
    .filter((s) => s.start >= 0)
    .map((s) => ({ q: s.q, start: s.start, end: s.start + s.q.length }))
    .sort((a, b) => a.start - b.start);
  const runs: { text: string; quote: string | null }[] = [];
  let at = 0;
  for (const s of spans) {
    if (s.end <= at) continue;
    const start = Math.max(s.start, at);
    if (start > at) runs.push({ text: text.slice(at, start), quote: null });
    runs.push({ text: text.slice(start, s.end), quote: s.q });
    at = s.end;
  }
  if (at < text.length) runs.push({ text: text.slice(at), quote: null });
  return runs;
}

// What the review function's error codes mean on the page (19 → Reviewer side)
export const REVIEW_ERRORS: Record<string, string> = {
  review_ended: "This review link has ended. Ask the student for a new one.",
  review_bad_name: "Add your name, up to 60 characters.",
  review_bad_comment: "Write a comment, up to 1,000 characters.",
  review_bad_quote: "That part of the text couldn't be found. Select it again.",
  review_daily_limit: "This link has reached today's comment limit.",
  review_cant_delete: "Comments can only be deleted for 15 minutes, from the browser that added them.",
};
export const REVIEW_FAILED = "Couldn't reach Stackd. Check your connection, then try again.";
