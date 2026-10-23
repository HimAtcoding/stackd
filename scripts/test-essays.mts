// Checks Essays' rules (17): how words are counted, the counter's colors, choosing 3 of 7, the 4-answer bar, and
// how a draft is saved, read back after a reload, and merged with the account's copy. A fake localStorage stands
// in for the phone; nothing reaches a real account. `npm run test:essays`
import {
  choose,
  counter,
  countWords,
  draftKey,
  draftNotes,
  mergeDrafts,
  pickPromptCycle,
  progress,
  rowStatus,
  type AccountDraft,
  type Draft,
  type Prompt,
} from "../lib/essays";
import type { Note } from "../lib/notes";

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

// Notes save with the draft and the same queue; the word count follows the answer only (20 → Notes)
const fortyWords = Array.from({ length: 40 }, (_, i) => `note${i}`).join(" ");
essays.saveDraft("fall-2027", "major", { notes: [{ id: "n1", starter: "major-1", body: fortyWords }] });
const withNotes = accountStore<Record<string, Draft>>(essays.DRAFTS_KEY, {}).get()[key("major")];
check("notes are saved with the draft after a reload", withNotes.notes?.length === 1 && withNotes.notes[0].body === fortyWords, withNotes.notes);
check("40 words in a note don't change the word count", withNotes.word_count === 10, withNotes.word_count);
check("saving notes keeps the answer and the done mark", withNotes.body.startsWith("When I took") && withNotes.done_at === "2026-10-19T13:00:00Z");
essays.saveDraft("fall-2027", "major", { body: "A new first line." });
check("saving the answer keeps the notes", accountStore<Record<string, Draft>>(essays.DRAFTS_KEY, {}).get()[key("major")].notes?.length === 1);
check("a draft with only notes is still Not started", rowStatus({ ...draft({ body: "" }), notes: [{ id: "n", starter: null, body: fortyWords }] }).kind === "empty");
const notesQueued = accountStore<string[]>(essays.ESSAYS_QUEUE_KEY, []).get();
check("notes go through the same queue, once per draft", notesQueued.filter((k) => k === key("major")).length === 1, notesQueued);
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

// Highlights in the draft, the comment bar and the reviewer's list (20 → 4 and 5)
const spans = review.quoteSpans("I led the club and the club grew.", ["club grew", "led the club", "missing", ""]);
check("quote spans: in text order, missing and empty quotes left out", JSON.stringify(spans) === JSON.stringify([
  { quote: "led the club", start: 2, end: 14 }, { quote: "club grew", start: 23, end: 32 },
]), spans);
const phrase = { start: 2, end: 14 };
check("caret inside a phrase", review.insideSpan(phrase, 6, 6));
check("caret at either edge of a phrase counts", review.insideSpan(phrase, 2, 2) && review.insideSpan(phrase, 14, 14));
check("caret just outside a phrase doesn't", !review.insideSpan(phrase, 1, 1) && !review.insideSpan(phrase, 15, 15));
check("a selection inside a phrase counts, one running past it doesn't", review.insideSpan(phrase, 3, 10) && !review.insideSpan(phrase, 3, 16));
const draftText = "When I took my first CS class, I didn't expect to stay up debugging.";
const c = (id: string, quote: string | null, resolved_at: string | null = null) => ({ id, quote, resolved_at });
const marks = review.draftHighlights(draftText, [
  { snapshot_body: draftText, comments: [c("late", "stay up debugging"), c("whole", null), c("done", "first CS class", "2026-10-21T10:00:00Z")] },
  { snapshot_body: "An older version.", comments: [c("old", "When I took")] },
  { snapshot_body: `${draftText} More.`, comments: [c("early", "first CS class"), c("gone", "More.")] },
]);
check("draft highlights: unresolved quotes still in both versions, in text order", marks.map((m) => m.comment.id).join() === "early,late", marks);
check("draft highlights: where each sits in the answer", marks[1].start === draftText.indexOf("stay up debugging") && marks[1].end === draftText.length - 1);
const listed = review.orderComments(draftText, [
  { id: "b", quote: "stay up debugging", created_at: "2026-10-21T10:00:00Z" },
  { id: "gone", quote: "not here", created_at: "2026-10-21T08:00:00Z" },
  { id: "a", quote: "first CS class", created_at: "2026-10-21T11:00:00Z" },
  { id: "w2", quote: null, created_at: "2026-10-21T12:00:00Z" },
  { id: "w1", quote: null, created_at: "2026-10-21T09:00:00Z" },
  { id: "b0", quote: "stay up debugging", created_at: "2026-10-21T07:00:00Z" },
]);
check("reviewer list: whole answer first, then text order, changed quotes last", listed.map((x) => x.id).join() === "w1,w2,a,b0,b,gone", listed.map((x) => x.id));
check("comment bar name: one reviewer", review.commentNames("Ms. Lee", 1) === "Ms. Lee");
check("comment bar name: several comments", review.commentNames("Ms. Lee", 2) === "Ms. Lee and 1 more" && review.commentNames("Ms. Lee", 4) === "Ms. Lee and 3 more");

const token = review.makeSecret(32);
check("a link token is 43 base64url characters", /^[A-Za-z0-9_-]{43}$/.test(token), token);
check("tokens don't repeat", review.makeSecret(32) !== token);
check("a reviewer key is 32 characters", /^[A-Za-z0-9_-]{32}$/.test(review.makeSecret(24)));
check("the review link is on the public website", review.reviewUrl(token) === `https://joinstackd-chi.vercel.app/review/?t=${token}`);
check("the share message carries the link", review.reviewMessage("https://x.test/r") === "Could you review my UC personal insight answer? https://x.test/r");

// The caption under Get ready's writing step (17 → Entry points), which replaces Home's separate Essays row
const stepNote = review.essaysStepCaption;
check("step caption: how many answers are done", stepNote({ done: 1, unread: 0, checkedByEssays: false }) === "1 of 4 done");
check("step caption: none done yet", stepNote({ done: 0, unread: 0, checkedByEssays: false }) === "0 of 4 done");
check("step caption: From Essays once Essays checked it", stepNote({ done: 4, unread: 0, checkedByEssays: true }) === "From Essays");
check("step caption: 4 of 4 but unchecked by the student stays a count", stepNote({ done: 4, unread: 0, checkedByEssays: false }) === "4 of 4 done");
check("step caption: unread comments come first, singular", stepNote({ done: 2, unread: 1, checkedByEssays: false }) === "1 new comment");
check("step caption: unread comments come first, plural, even when done", stepNote({ done: 4, unread: 3, checkedByEssays: true }) === "3 new comments");

// Starter questions and notes (20 → 2, 3)
const { PIQ_STARTERS, startersFor } = await import("../lib/piq-starters");
const notesLib = await import("../lib/notes");
const QUESTIONS = ["major", "leadership", "creativity", "talent", "opportunity", "challenge", "community", "beyond"];
check("4 starters for each of the 8 questions", QUESTIONS.every((q) => startersFor(q).length === 4) && Object.keys(PIQ_STARTERS).length === 32);
check("starter keys are {prompt_key}-{n}, in order", startersFor("major").map((s) => s.id).join() === "major-1,major-2,major-3,major-4");
check("every starter is a question", Object.values(PIQ_STARTERS).every((t) => /[?.]$/.test(t) && t.includes("?")), Object.values(PIQ_STARTERS).filter((t) => !t.includes("?")));
check("a question with no starters has none", startersFor("no-such").length === 0);
const st = startersFor("major");
const n = (starter: string | null, body = ""): Note => ({ id: `id-${starter ?? Math.random()}`, starter, body });
check("the card starts on the first starter", notesLib.nextStarter(st, [], 0) === 0);
check("Try another moves to the next", notesLib.nextStarter(st, [], 1) === 1);
check("after the 4th it wraps to the 1st", notesLib.nextStarter(st, [], 4) === 0);
check("a starter already in Notes is skipped", notesLib.nextStarter(st, [n("major-2")], 1) === 2);
check("skipping wraps too", notesLib.nextStarter(st, [n("major-4"), n("major-1")], 3) === 1);
check("all four in Notes: no card", notesLib.nextStarter(st, ["major-1", "major-2", "major-3", "major-4"].map((s) => n(s)), 0) === null);
check("your own notes don't use up starters", notesLib.nextStarter(st, [n(null), n(null)], 0) === 0);
check("Add to my answer into an empty answer: the note as is", notesLib.addToAnswer("  \n", " My note. ") === "My note.");
check("Add to my answer after text: a blank line between", notesLib.addToAnswer("First part.\n", "My note.") === "First part.\n\nMy note.");
const trio = [n("major-1", "a"), n("major-2", "b"), n(null, "c")];
const del = notesLib.removeNote(trio, trio[1].id);
check("Delete note removes it", del.notes.length === 2 && !del.notes.some((x) => x.id === trio[1].id));
check("Undo puts it back in the same place", del.removed !== null && notesLib.restoreNote(del.notes, del.removed).map((x) => x.body).join() === "a,b,c");
check("Undo twice doesn't duplicate it", del.removed !== null && notesLib.restoreNote(notesLib.restoreNote(del.notes, del.removed), del.removed).length === 3);
const twelve = Array.from({ length: 12 }, (_, i) => n(null, String(i)));
check("12 notes is the limit", !notesLib.canAddNote(twelve) && notesLib.canAddNote(twelve.slice(1)));
check("a saved copy is cleaned: bad items dropped, over 12 cut, bodies capped", notesLib.cleanNotes([...twelve, { id: 1 }, null]).length === 12 &&
  notesLib.cleanNotes([{ id: "x", starter: null, body: "y".repeat(3000) }])[0].body.length === notesLib.NOTE_MAX && notesLib.cleanNotes("nope").length === 0);
check("a copy saved before notes existed has none", draftNotes(draft({ body: "x" })).length === 0);
const withNote = { ...draft({ body: "Same." }), notes: [n(null, "mine")] };
const accountRow = (notes: unknown): AccountDraft => ({ prompt_key: "a", cycle: "fall-2027", body: "Same.", notes, word_count: 1, chosen: false, done_at: null, updated_at: "2026-10-22T12:00:00Z" });
let merged = mergeDrafts({ [key("a")]: { ...withNote, saved_at: "2026-10-22T10:00:00Z", edited_at: "2026-10-22T11:00:00Z" } }, [accountRow([n(null, "theirs")])], () => true);
check("notes saved newer on another device replace these, and the editor is told", merged.drafts[key("a")].notes?.[0].body === "theirs" && merged.replaced.includes(key("a")), merged);
merged = mergeDrafts({}, [accountRow([n("a-1", "from the account")])], () => false);
check("the account's notes come down with the draft", merged.drafts[key("a")].notes?.[0].body === "from the account");

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
