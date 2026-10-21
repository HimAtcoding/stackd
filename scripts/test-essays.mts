// Checks Essays' rules (17): how words are counted, the counter's colors, choosing 3 of 7, the 4-answer bar, and
// how a draft is saved, read back after a reload, and merged with the account's copy. A fake localStorage stands
// in for the phone; nothing reaches a real account. `npm run test:essays`
import {
  choose,
  counter,
  countWords,
  draftKey,
  mergeDrafts,
  pickPromptCycle,
  progress,
  rowStatus,
  type AccountDraft,
  type Draft,
  type Prompt,
} from "../lib/essays";

let failed = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (!ok) failed++;
  console.log(ok ? "ok   " : "FAIL ", name, ok ? "" : JSON.stringify(detail));
}

// Word counting: by whitespace, like Word and Google Docs (UC's own box isn't published; lib/essays.ts)
check("no text is 0 words", countWords("") === 0 && countWords("   \n\t ") === 0);
check("single spaces", countWords("I took my first CS class") === 6, countWords("I took my first CS class"));
check("runs of spaces count once", countWords("one   two    three") === 3);
check("line breaks and blank lines separate words", countWords("first line\nsecond line\n\nnew paragraph") === 6, countWords("first line\nsecond line\n\nnew paragraph"));
check("tabs and Windows line endings", countWords("one\ttwo\r\nthree") === 3);
check("leading and trailing space doesn't count", countWords("  hello world  \n") === 2);
check("punctuation stays with its word", countWords("Hello, world. It's well-known: yes!") === 5, countWords("Hello, world. It's well-known: yes!"));
check("a dash between spaces is a word of its own", countWords("I tried — and failed") === 5);
check("numbers and slashes are words", countWords("3.8 GPA in 2/3 terms") === 5);
check("contractions are one word", countWords("I didn't know we'd win") === 5);
check("hyphenated words are one word", countWords("a first-generation, low-income student") === 4);
check("curly quotes from a pasted doc", countWords("“Why not?” she asked") === 4);
// Text pasted from Google Docs, Word or a web page can carry these instead of plain spaces
check("no-break, thin and ideographic spaces separate words", countWords("one two three　four") === 4);
check("a pasted paragraph with mixed line endings", countWords("When I took\r\nmy first class,\r\n\r\nI was  lost.\n") === 9);
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
check("exactly 350 words is at the limit, not over", countWords(words(350)) === 350 && counter(350).tone === "near");
check("351 words is 1 over", countWords(words(351) + "\n") === 351 && counter(351).text === "351 / 350, 1 over");

// The counter (17 → Counter)
check("212 words: plain", JSON.stringify(counter(212)) === JSON.stringify({ text: "212 / 350", tone: "normal" }), counter(212));
check("329 words: still plain", counter(329).tone === "normal");
check("330 words: amber", counter(330).tone === "near");
check("350 words: amber, not over", counter(350).tone === "near" && counter(350).text === "350 / 350");
check("362 words: coral, 12 over", JSON.stringify(counter(362)) === JSON.stringify({ text: "362 / 350, 12 over", tone: "over" }), counter(362));

// The questions and drafts
const prompt = (key: string, sort: number, required = false): Prompt => ({
  key,
  cycle: "fall-2027",
  short_name: key,
  summary: `${key} summary.`,
  required,
  sort,
  source_name: "Test source",
  source_url: "https://example.org/piq",
  verified_at: "2026-10-19T00:00:00Z",
});
const prompts = [prompt("major", 1, true), ...["a", "b", "c", "d", "e", "f", "g"].map((k, i) => prompt(k, i + 2))];
const optional = prompts.filter((p) => !p.required);
const draft = (patch: Partial<Draft> = {}): Draft => {
  const body = patch.body ?? "";
  return { body, word_count: countWords(body), chosen: false, done_at: null, edited_at: "2026-10-19T10:00:00Z", saved_at: null, ...patch };
};
const key = (k: string) => draftKey("fall-2027", k);

// Choose 3 of 7 (17 → Question row)
const two = { [key("a")]: draft({ chosen: true }), [key("b")]: draft({ chosen: true }) };
check("with 2 chosen, a third can be chosen", choose(optional[2], optional, two) === "chosen");
const three = { ...two, [key("c")]: draft({ chosen: true }) };
check("with 3 chosen, a fourth is refused", choose(optional[3], optional, three) === "limit");
check("a chosen question with no words is removed at once", choose(optional[0], optional, three) === "removed");
const withText = { ...three, [key("a")]: draft({ chosen: true, body: "Some words here." }) };
check("a chosen question with a draft asks first", choose(optional[0], optional, withText) === "confirm-remove");
const drafted = { ...three, [key("d")]: draft({ body: "Drafted but not chosen." }) };
check("a draft on an unchosen question doesn't count as chosen", choose(optional[3], optional, drafted) === "limit");
check("the required question can't be chosen or removed, so it's never in the list", !optional.some((p) => p.required));

// Status and the 4-answer bar
check("no draft: Not started", rowStatus(undefined).kind === "empty");
check("words: their count", JSON.stringify(rowStatus(draft({ body: "one two" }))) === JSON.stringify({ kind: "words", words: 2, over: false }));
check("over 350: flagged", (rowStatus(draft({ body: "w ".repeat(362) })) as { over: boolean }).over === true);
check("done wins over the count", rowStatus(draft({ body: "one", done_at: "2026-10-19T11:00:00Z" })).kind === "done");
const mixed = {
  [key("major")]: draft({ body: "w ".repeat(212) }),
  [key("a")]: draft({ chosen: true, body: "w ".repeat(300), done_at: "2026-10-19T11:00:00Z" }),
  [key("b")]: draft({ chosen: true }),
  // Done but not chosen: doesn't count
  [key("e")]: draft({ body: "w ".repeat(100), done_at: "2026-10-19T11:00:00Z" }),
};
const bar = progress(prompts, mixed);
check("1 of 4 done; then the drafting answer; then empty", bar.done === 1 && JSON.stringify(bar.segments) === JSON.stringify(["done", "drafting", "empty", "empty"]), bar);
const allDone = {
  [key("major")]: draft({ body: "x", done_at: "t" }),
  [key("a")]: draft({ chosen: true, body: "x", done_at: "t" }),
  [key("b")]: draft({ chosen: true, body: "x", done_at: "t" }),
  [key("c")]: draft({ chosen: true, body: "x", done_at: "t" }),
};
check("4 of 4 done", progress(prompts, allDone).done === 4);
check("the term's questions when they exist", pickPromptCycle(prompts, "fall-2027") === "fall-2027");
check("otherwise the newest cycle", pickPromptCycle([...prompts, { ...prompts[0], cycle: "fall-2028" }], "fall-2029") === "fall-2028");

// Merging the account's copy (17 → Saving)
const row = (k: string, body: string, updated_at: string): AccountDraft => ({ prompt_key: k, cycle: "fall-2027", body, word_count: countWords(body), chosen: false, done_at: null, updated_at });
const nothingPending = () => false;
let m = mergeDrafts({}, [row("major", "From the account.", "2026-10-19T12:00:00Z")], nothingPending);
check("a new phone gets the account's drafts", m.drafts[key("major")]?.body === "From the account." && m.drafts[key("major")].saved_at === "2026-10-19T12:00:00Z");
const waiting = { [key("major")]: draft({ body: "Typed offline.", edited_at: "2026-10-19T12:05:00Z", saved_at: "2026-10-19T12:00:00Z" }) };
m = mergeDrafts(waiting, [row("major", "From the account.", "2026-10-19T12:00:00Z")], () => true);
check("an unsent edit isn't undone by the account's older copy", m.drafts[key("major")].body === "Typed offline." && m.replaced.length === 0);
m = mergeDrafts(waiting, [row("major", "From the laptop.", "2026-10-19T12:10:00Z")], () => true);
check("a newer save from another device wins, and is reported", m.drafts[key("major")].body === "From the laptop." && m.replaced[0] === key("major") && m.dropped[0] === key("major"), m);
m = mergeDrafts(waiting, [row("major", "From the laptop.", "2026-10-19T12:03:00Z")], () => true);
check("an older save from another device loses to this phone's newer edit", m.drafts[key("major")].body === "Typed offline." && m.replaced.length === 0);
m = mergeDrafts({ [key("a")]: draft({ body: "Not sent yet." }) }, [], () => true);
check("a draft the account doesn't have yet stays while it waits", m.drafts[key("a")]?.body === "Not sent yet.");
m = mergeDrafts({ [key("a")]: draft({ body: "Deleted elsewhere." }) }, [], nothingPending);
check("a sent draft the account no longer has goes", !m.drafts[key("a")]);

// Saving a draft on the phone and reading it back after a reload (lib/data/essays.ts). The account isn't reachable
// here, so the draft stays queued, as it would offline.
const storage = new Map<string, string>();
const localStorage = {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => void storage.set(k, v),
  removeItem: (k: string) => void storage.delete(k),
};
Object.assign(globalThis, { window: { localStorage, addEventListener: () => {}, removeEventListener: () => {} } });
storage.set("stackd.auth", JSON.stringify({ user: { id: "11111111-2222-4333-8444-555555555555", email: "test@example.org" } }));

const essays = await import("../lib/data/essays");
const { accountStore } = await import("../lib/account-store");
essays.saveDraft("fall-2027", "major", { body: "When I took my first CS class,\nI was nervous." });
essays.saveDraft("fall-2027", "a", { chosen: true });
essays.saveDraft("fall-2027", "a", { body: "Leading the robotics club." });

// A fresh store reads only what's in storage, as the app does after a reload
const reloaded = accountStore<Record<string, Draft>>(essays.DRAFTS_KEY, {}).get();
check("a saved draft is there after a reload", reloaded[key("major")]?.body === "When I took my first CS class,\nI was nervous.", reloaded);
check("its word count was saved with it", reloaded[key("major")]?.word_count === 10, reloaded[key("major")]?.word_count);
check("a later edit keeps the choice made before it", reloaded[key("a")]?.chosen === true && reloaded[key("a")]?.body === "Leading the robotics club.", reloaded[key("a")]);
check("not yet in the account", reloaded[key("major")]?.saved_at === null);
const queued = accountStore<string[]>(essays.ESSAYS_QUEUE_KEY, []).get();
check("both are queued for the account, once each", JSON.stringify(queued) === JSON.stringify([key("major"), key("a")]), queued);
essays.saveDraft("fall-2027", "major", { done_at: "2026-10-19T13:00:00Z" });
const afterDone = accountStore<Record<string, Draft>>(essays.DRAFTS_KEY, {}).get()[key("major")];
check("marking done keeps the text", afterDone.done_at === "2026-10-19T13:00:00Z" && afterDone.word_count === 10, afterDone);
storage.set("stackd.auth", JSON.stringify({ user: { id: "99999999-2222-4333-8444-555555555555" } }));
check("another account on this phone doesn't see them", Object.keys(accountStore<Record<string, Draft>>(essays.DRAFTS_KEY, {}).get()).length === 0);

// Bringing drafts in, sending them out, review links (19)
const review = await import("../lib/review");
check("pasted text: Windows line endings made plain", review.cleanImported("one\r\ntwo\rthree") === "one\ntwo\nthree");
check("3 or more line breaks collapse to 2", review.cleanImported("para one\n\n\n\npara two") === "para one\n\npara two");
check("spaces at line ends are trimmed", review.cleanImported("line one   \nline two\t \n") === "line one\nline two");
check("quotes and dashes stay as typed", review.cleanImported("“Why” — she said") === "“Why” — she said");
check("blank lines around the text are dropped", review.cleanImported("\n\n  Hello\n\n") === "  Hello");
check("Replace swaps the text", review.combineDraft("old words", "new words", "replace") === "new words");
check("Add to the end adds after a blank line", review.combineDraft("old words  \n", "new words", "append") === "old words\n\nnew words");
check("Add to the end on an empty answer is just the text", review.combineDraft("  ", "new words", "append") === "new words");
const file = review.answersFile([
  { short_name: "Your major", body: "I took CS 1A." },
  { short_name: "Leadership", body: "   " },
  { short_name: "A challenge", body: "One." },
]);
check("Download all answers: each answer with its name and word count, empty ones left out", file === "Your major\n\nI took CS 1A.\n\n(4 words)\n\n\nA challenge\n\nOne.\n\n(1 word)", file);
check("an answer over 350 says so in the file", review.answersFile([{ short_name: "Q", body: words(352) }]).endsWith("(352 words, 2 over 350)"));
const at = new Date("2026-10-20T12:00:00-07:00");
check("link dates while live", review.linkDates({ created_at: "2026-10-19T10:00:00-07:00", expires_at: "2026-11-02T10:00:00-08:00", revoked_at: null }, at) === "Created Oct 19, ends Nov 2");
check("link dates once turned off", review.linkDates({ created_at: "2026-10-19T10:00:00-07:00", expires_at: "2026-11-02T10:00:00-08:00", revoked_at: "2026-10-20T09:00:00-07:00" }, at) === "Created Oct 19, turned off Oct 20");
check("a turned-off link isn't live", !review.linkLive({ expires_at: "2026-11-02T10:00:00-08:00", revoked_at: "2026-10-20T09:00:00-07:00" }, at));
check("an ended link isn't live", !review.linkLive({ expires_at: "2026-10-20T11:00:00-07:00", revoked_at: null }, at));
check("one new comment, singular", review.newComments(1) === "1 new comment" && review.newComments(3) === "3 new comments");
check("a quote still in the text hasn't changed", !review.quoteChanged("first CS class", "My first CS class was hard."));
check("a quote edited away has changed", review.quoteChanged("first CS class", "My first class was hard."));
check("no quote never changes", !review.quoteChanged(null, "anything"));
check("finding a quote to select it", JSON.stringify(review.findQuote("abc def ghi", "def")) === JSON.stringify({ start: 4, end: 7 }) && review.findQuote("abc", "x") === null);
const runs = review.highlightRuns("I led the club and the club grew.", ["led the club", "club grew", "missing"]);
check("highlights: quotes marked, the rest plain, overlaps merged", JSON.stringify(runs) === JSON.stringify([
  { text: "I ", quote: null }, { text: "led the club", quote: "led the club" }, { text: " and the ", quote: null },
  { text: "club grew", quote: "club grew" }, { text: ".", quote: null },
]), runs);
const token = review.makeSecret(32);
check("a link token is 43 base64url characters", /^[A-Za-z0-9_-]{43}$/.test(token), token);
check("tokens don't repeat", review.makeSecret(32) !== token);
check("a reviewer key is 32 characters", /^[A-Za-z0-9_-]{32}$/.test(review.makeSecret(24)));
check("the review link is on the public website", review.reviewUrl(token) === `https://joinstackd-chi.vercel.app/review/?t=${token}`);
check("the share message carries the link", review.reviewMessage("https://x.test/r") === "Could you review my UC personal insight answer? https://x.test/r");

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
