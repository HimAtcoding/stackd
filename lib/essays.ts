// Essays (17-essays.md): the personal insight questions, the student's drafts, and the words the screens show.
// No React and no storage here; lib/data/essays.ts feeds it.

// A row of piq_prompts. UC's exact wording lives on source_url; these are in Stackd's words.
export type Prompt = {
  key: string;
  cycle: string;
  short_name: string;
  summary: string;
  required: boolean;
  sort: number;
  source_name: string;
  source_url: string;
  verified_at: string | null;
};

// The student's answer to one question, as this device holds it
export type Draft = {
  body: string;
  word_count: number;
  chosen: boolean;
  done_at: string | null;
  // When the student last changed it on this device
  edited_at: string;
  // The account's updated_at for the version this device last sent or read; null before it reached the account
  saved_at: string | null;
};

export const WORD_LIMIT = 350;
// The counter turns amber from here (17 → Counter)
export const WORD_WARN = 330;
// Feedback needs at least this much to read (part 3)
export const FEEDBACK_MIN_WORDS = 50;
// UC: one required question plus 3 of the others
export const CHOOSE = 3;
export const ANSWERS = 4;

// "fall-2027/major": one draft per question per cycle
export const draftKey = (cycle: string, key: string) => `${cycle}/${key}`;

// Words split by any run of whitespace (spaces, tabs, line breaks, and the no-break and thin spaces pasted text
// brings), the way Word and Google Docs count. Punctuation stays part of its word ("well-known," is one), and a dash
// standing between spaces counts as a word of its own. UC's 350-word box is behind an applicant login and its rule
// isn't published, so this isn't claimed to match it (build-status → Essays word count).
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export type CounterTone = "normal" | "near" | "over";

// "212 / 350"; amber at 330 to 350; coral with "{over} over" past 350
export function counter(words: number): { text: string; tone: CounterTone } {
  if (words > WORD_LIMIT) return { text: `${words} / ${WORD_LIMIT}, ${words - WORD_LIMIT} over`, tone: "over" };
  return { text: `${words} / ${WORD_LIMIT}`, tone: words >= WORD_WARN ? "near" : "normal" };
}

export type RowStatus = { kind: "empty" } | { kind: "words"; words: number; over: boolean } | { kind: "done" };

// The status on the right of a question row: "Not started", "{n} words", or Done
export function rowStatus(draft: Draft | undefined): RowStatus {
  if (draft?.done_at) return { kind: "done" };
  if (!draft || draft.word_count === 0) return { kind: "empty" };
  return { kind: "words", words: draft.word_count, over: draft.word_count > WORD_LIMIT };
}

// The required question, then the optional ones in UC's order
export function splitPrompts(prompts: Prompt[]) {
  const sorted = [...prompts].sort((a, b) => a.sort - b.sort);
  return { required: sorted.filter((p) => p.required), optional: sorted.filter((p) => !p.required) };
}

export const chosenKeys = (optional: Prompt[], drafts: Record<string, Draft>) =>
  optional.filter((p) => drafts[draftKey(p.cycle, p.key)]?.chosen).map((p) => p.key);

export type ChooseOutcome = "chosen" | "limit" | "confirm-remove" | "removed";

// Tapping an optional question's circle (17 → Question row): choose it while fewer than 3 are chosen; a fourth is
// refused. Unchoosing one that has a draft asks first; the draft stays saved either way.
export function choose(prompt: Prompt, optional: Prompt[], drafts: Record<string, Draft>): ChooseOutcome {
  const draft = drafts[draftKey(prompt.cycle, prompt.key)];
  if (draft?.chosen) return draft.body.trim() ? "confirm-remove" : "removed";
  return chosenKeys(optional, drafts).length >= CHOOSE ? "limit" : "chosen";
}

// The 4 answers that count: the required question and the chosen ones. Unchosen questions can be drafted, and
// even marked done, but don't count.
export function countedPrompts(prompts: Prompt[], drafts: Record<string, Draft>): Prompt[] {
  const { required, optional } = splitPrompts(prompts);
  return [...required, ...optional.filter((p) => drafts[draftKey(p.cycle, p.key)]?.chosen)].slice(0, ANSWERS);
}

export type Segment = "done" | "drafting" | "empty";

// The panel's 4-segment bar and "{done} of 4 done": done answers first, then ones with words, then empty slots
export function progress(prompts: Prompt[], drafts: Record<string, Draft>): { done: number; segments: Segment[] } {
  const counted = countedPrompts(prompts, drafts).map((p) => rowStatus(drafts[draftKey(p.cycle, p.key)]).kind);
  const done = counted.filter((k) => k === "done").length;
  const drafting = counted.filter((k) => k === "words").length;
  const segments: Segment[] = Array.from({ length: ANSWERS }, (_, i) => (i < done ? "done" : i < done + drafting ? "drafting" : "empty"));
  return { done, segments };
}

// The cycle to show: the student's term when its questions exist, otherwise the newest cycle there is
export function pickPromptCycle(prompts: Prompt[], term: string | null): string | null {
  const cycles = [...new Set(prompts.map((p) => p.cycle))];
  if (term && cycles.includes(term)) return term;
  const year = (c: string) => Number(c.split("-")[1]) || 0;
  return cycles.sort((a, b) => year(b) - year(a))[0] ?? null;
}

// One row from essay_drafts, as the account returns it
export type AccountDraft = {
  prompt_key: string;
  cycle: string;
  body: string;
  word_count: number;
  chosen: boolean;
  done_at: string | null;
  updated_at: string;
};

const fromAccount = (r: AccountDraft): Draft => ({
  body: r.body,
  word_count: r.word_count,
  chosen: r.chosen,
  done_at: r.done_at,
  edited_at: r.updated_at,
  saved_at: r.updated_at,
});

// The account's drafts merged into this device's (17 → Saving). A draft still waiting to be sent keeps this
// device's version, unless the account saved a newer one from another device since this device last saw it: then
// the newer save wins and the key is reported, so the editor can say "Updated from your other device."
export function mergeDrafts(
  device: Record<string, Draft>,
  account: AccountDraft[],
  pending: (key: string) => boolean,
): { drafts: Record<string, Draft>; replaced: string[]; dropped: string[] } {
  const drafts: Record<string, Draft> = {};
  const replaced: string[] = [];
  // Pending edits the account's newer save beat, which no longer need sending
  const dropped: string[] = [];
  const seen = new Set<string>();
  for (const row of account) {
    const key = draftKey(row.cycle, row.prompt_key);
    seen.add(key);
    const mine = device[key];
    if (!mine || !pending(key)) {
      drafts[key] = fromAccount(row);
      continue;
    }
    const changedElsewhere = mine.saved_at === null || Date.parse(row.updated_at) > Date.parse(mine.saved_at);
    if (changedElsewhere && Date.parse(row.updated_at) > Date.parse(mine.edited_at)) {
      drafts[key] = fromAccount(row);
      if (row.body !== mine.body) replaced.push(key);
      dropped.push(key);
    } else {
      drafts[key] = mine;
    }
  }
  // Drafts the account doesn't have yet stay while they wait to be sent
  for (const [key, mine] of Object.entries(device)) if (!seen.has(key) && pending(key)) drafts[key] = mine;
  return { drafts, replaced, dropped };
}
