# 20 · Essays: starter questions, notes, and reviews anchored to the text

Release: v1.3. Flag: `essays` (no new flag). Changes the empty editor, adds Notes to the editor, puts reviewer comments on the student's own sentences, and redesigns the reviewer web page. Builds on 17 and 19; where this spec and those two disagree, this one wins.

## Why

Screenshots 33 and 36 from the v1.2 build (Oct 21) are the two weakest screens in Essays:

1. **The empty answer is a blank white page.** It's the first thing most students see, and a blank page is the hardest place to start a 350-word essay. Good writing apps give you a question to answer first (Apple Journal, Liven). UC already publishes "things to consider" for each question, so we can turn them into short starter questions in our own words.
2. **The reviewer page reads like a contact form.** The name field, the big comment box and the button take up as much space as the essay, and the greyed "Comment on selection" looks broken. It's also a counselor's first look at Stackd. In good review tools (Dovetail, Craft) the text is the page and comments sit on the words they're about.
3. **Comments are separated from the words.** In the editor, the student reads "This part is vague" in a list under the answer and has to find which part. The phrase should be marked in the draft itself.

The writing area itself stays plain. The best editors on Mobbin (Substack, Craft, Insight Timer) are almost empty while you type. Everything in this spec sits around the writing: before you start, beside the draft, and on the reviewer's side. Nothing is added inside the text box while the student types. No streaks or points either, because a student writes these four answers once.

## Design plan

**Tokens.** No new tokens.

| Name | Value | Role here |
|---|---|---|
| `--indigo-600` | #4F55E0 | Starter card fill, highlight underline, quote bars |
| `--tint-indigo` | #EAEDFD | Highlight fill, the question band on the reviewer page |
| `--navy-900` | #051042 | Text |
| `--slate-700` | #3F4A6E | Secondary text on `--tint-indigo` (`--slate-600` is 4.49:1 there, just under 4.5) |
| `--green-600` | #40A459 | The check icon on "Finished reviewing" (icon only; the text stays navy) |
| `--white` | #FFFFFF | Text and the button on the starter card |

Checked contrast: white on `--indigo-600` 5.66:1, and `--indigo-600` on white 5.66:1 (so the white button's indigo label passes). Navy on `--tint-indigo` 15.55:1. `--tint-indigo` against `--surface` is only 1.13:1, so a highlight never relies on its fill: the 2 px `--indigo-600` underline (5.51:1 on surface) is what makes it visible.

Type: Figtree only, existing scale (`title-1`, `title-2`, `title-3`, `headline`, `body-lg`, `body`, `label`, `caption`).

**Layout.** The editor keeps its light indigo strip. Under it, Answer and Notes tabs. On an empty answer, the Answer tab shows one solid indigo starter card under the placeholder line. The reviewer page becomes text-first: a short intro, the question band, the essay, then comments. Phones get a pinned bottom bar. At 900 px and wider, comments move to a rail on the right.

**Hierarchy.** Empty editor: the starter card. Reviewer page: the essay text.

**Self-check.** Would I write this plan for any student app? A prompt card is a common pattern (Apple Journal does it). Three things make this one Stackd's. The questions come from UC's own guidance for each personal insight question. Notes stay out of the 350-word count and never get copied into UC's form. And the highlights are a counselor's comments on the student's own sentences, which only works because of the review links from 19.

## Mobbin references

| Screen | What it grounds |
|---|---|
| [Apple Journal suggestions](https://mobbin.com/screens/4820699c-74cc-41bf-88a9-95a2841abe08) | A solid card holding one question in large type, with a control to try another |
| [Liven journal, empty](https://mobbin.com/screens/9123635c-e543-4451-a375-4b4b7ded976a) | The empty entry offers a question to start from |
| [Substack editor](https://mobbin.com/screens/2a77bf1a-9fea-4264-98b9-156fc26d3f87) | While typing, the editor is just text: no decoration in the writing area |
| [Fable highlight](https://mobbin.com/screens/6487b41a-21c0-4eb0-aa99-19f8fa11bc93) | Tapping a marked passage on a phone opens a sheet for it, with "Add a comment" |
| [Craft comments, iOS](https://mobbin.com/screens/137d4615-a84c-44c6-b591-d7180a3a0430) | A phone comment thread in a sheet, the quoted text on top, comments under it |
| [Dovetail highlights](https://mobbin.com/screens/fa01c5ed-b140-4076-b539-e352c662f12e) | On a wide screen, highlighted phrases in the text and their comments in a rail beside it |
| [Craft comments, web](https://mobbin.com/screens/6f238076-9849-4716-92c3-cd956a715cee) | The document stays the main column; comments are a quiet side rail |

## 1. Editor: Answer and Notes

Under the strip's last line, still on the `--tint-indigo` strip, the existing `UnderlineTabs` component with two tabs: "Answer" and "Notes". When there are notes, the second tab reads "Notes ({n})". The tabs stay visible when the strip collapses while typing.

| Tab | Shows | Word counter |
|---|---|---|
| Answer | The answer, as now (17, 19), plus the starter card when it's empty (2) and highlights (4) | Shown |
| Notes | The notes list (3) | Hidden; Notes have no limit to count against |

The Reviews section (19) stays under the answer in the Answer tab only.

## 2. Empty answer: the starter card

Replaces screenshot 33. It shows when the answer is empty and the text field doesn't have focus. When the student taps into the field, the card hides so the page is calm for typing. If they leave the field and it's still empty, the card comes back.

```
┌ tint-indigo strip ─────────────────────────┐
│ ‹               Saved              ⋯   ✓   │
│ Your major                                 │
│ How you've prepared for your intended…     │
│ ↗ Read UC's exact wording                  │
│  Answer      Notes                         │  UnderlineTabs
└────────────────────────────────────────────┘
  Start writing. It saves as you go.            placeholder (unchanged)

┌ indigo-600, r-lg, shadow-lift ─────────────┐
│ Start with a question               [⟳]   │  label white 85%, shuffle 44
│                                            │
│ When did this subject first pull           │  title-2 white
│ you in? What were you doing?               │
│                                            │
│ [ Answer in notes ]                1 of 4  │  white pill 44 / caption
└────────────────────────────────────────────┘

  Already have a draft?                          headline navy
  📋 Paste a draft      ⬆ Import a file          unchanged text buttons (19)
```

| Part | Spec |
|---|---|
| Position | 16 under the placeholder's line, inset 16 from the screen edges (the text is inset 24). Bring-in block 24 under the card |
| Card | `--indigo-600` fill, `--r-lg` (20), `--shadow-lift`, padding 20. Tier 1, because it's the one bold thing on this screen |
| Top line | "Start with a question", `label` in white at 85% (4.59:1). Right side: a 44 circle button, fill white at 16% (#6B70E5 on the card), `ArrowsClockwise` bold 20 white, label "Try another question" |
| Question | `title-2` white, up to 4 lines, 12 under the top line |
| Button | 20 under the question. White pill, 44 tall, `--r-full`, padding 0 20, `PencilSimpleLine` bold 18 + "Answer in notes" in `label` `--indigo-600`. Pressed: `--tint-indigo` fill |
| Position | "1 of 4" `caption` white 85%, right-aligned on the button's line. The starter questions are numbered because they follow the order of UC's guidance |
| Try another | Moves to the next starter question not already in Notes, wrapping around. Crossfade the question text over 160 ms. Reduced motion: swap with no fade |
| Answer in notes | Adds a note for that starter question (3), switches to the Notes tab, and focuses that note's field. The switch is the feedback; no toast |
| All four in Notes | The card isn't shown. In its place: "Your notes are ready. Start your answer above, or use Add to my answer on a note." in `body` `--slate-700` |
| Answer has text | No card and no bring-in block (as 19) |

Accessibility: the card is a `section` labelled "Starter question". After Try another, the new question is announced with `aria-live="polite"`.

### Starter questions

Four per question, in Stackd's own words, from UC's "things to consider" for transfer applicants on [UC Admissions, Personal insight questions](https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/personal-insight-questions.html). They live in a code map, `lib/piq-starters.ts`, keyed `{prompt_key}-{n}`, with the source URL in a comment. This works like `lib/step-content.ts`: the starters are coaching, not facts, so they don't go through the import. Ryan checks them against UC's page once before the PR merges.

| Question | Starters |
|---|---|
| `major` | When did this subject first pull you in? What were you doing? / What have you done for it outside class, like a job, club, project or internship? / Which class or professor pushed you furthest, and what came out of it? / Applying to different majors at different campuses? What ties them together? |
| `leadership` | When were you the one people counted on, at school, at work or at home? / Did you help a group get past a disagreement? What did you do? / What did you organize or take charge of, and how did it turn out? / How has leading changed the way you work with people? |
| `creativity` | What does being creative mean to you, in your own words? / What problem did you solve in a way nobody expected? Walk through the steps. / What do you make or build when nobody's asking you to? / Where does your creativity show up in your major or the career you want? |
| `talent` | What are you good at and proud of, award or not? / Did it come naturally, or did you build it? What did that take? / What has it opened up for you, in class or out of it? / How do you fit it in around school, work and family? |
| `opportunity` | What program, class or chance did you go after, like honors or a career program? / What stood in the way of your education, and what did you do about it? / What about you got you through it? / How are you different because of it? |
| `challenge` | What's the hardest thing you've dealt with, and why did it matter so much? / What steps did you take? Did anyone help, or did you handle it alone? / How did it affect your classes and grades? / If it's still going on, how are you handling it now? |
| `community` | Which community do you mean: a team, a club, your college, your neighborhood? / What did you want to fix or improve there, and what was your part? / Why did you care enough to do it? / Who's better off because of it, and what did you learn? |
| `beyond` | What's important about you that the rest of your application doesn't show? / Why would you do well at UC? Give a real example. / What do you want an admissions reader to remember about you? / Is there a skill, challenge or opportunity you haven't written about yet? |

## 3. Notes

Notes are the student's private scratch space for one question. They're saved with the draft, but they never count toward 350 words and are never copied, shared, downloaded, sent in a review link or sent for AI feedback.

```
  Notes don't count toward your 350 words, and     caption slate-600
  they're never copied, shared or sent for review.

  When did this subject first pull you in?   ⋯     headline navy + menu 44
  ┃ I took CS 1A because my cousin…                 body-lg, grows, 2 px indigo bar

  What have you done for it outside class?   ⋯
  ┃ Answer this…                                    placeholder

  + Add a starter question                          text buttons, blue-600
  + Add your own note
```

| Part | Spec |
|---|---|
| Intro | `caption` `--slate-600`, 16 under the tabs, padding 0 24 |
| Note | 24 apart, no dividers, no cards. Heading: the starter question in `headline` `--navy-900`. Your own notes have no heading. Field: a growing text area, `body-lg` `--navy-900`, 8 under the heading, with a 2 px `--indigo-600` bar on the left and padding-left 12. Placeholder "Answer this…" (or "Write anything…" for your own note). Up to 2,000 characters |
| Note menu | `DotsThree` 44 on the heading line (on the field's first line for your own notes). Bottom sheet: "Add to my answer", "Delete note" |
| Add to my answer | Puts the note's text at the end of the answer, after a blank line (into the empty answer as-is). Switches to the Answer tab. Toast "Added to your answer." The note stays |
| Delete note | Removes it right away. Toast "Note deleted." with Undo |
| Add a starter question | `Plus` bold 18 + label. Opens a sheet titled "Starter questions" listing the four, with the ones already in Notes checked and disabled. Tapping one adds it at the end and focuses it |
| Add your own note | Adds a note with no heading at the end and focuses it |
| Empty Notes tab | The intro, then "Answer a starter question or write your own." in `body` `--slate-700`, then the two add buttons |
| Limits | 12 notes per question. At 12, both add buttons are disabled and the line "You've reached 12 notes for this question." appears |
| Saving | Same as the answer: saved after 800 ms of no typing, on leaving, offline first (17 → Saving). The save state in the top bar covers both |

Notes don't change any status. "Started", "{n} words", Done, Home's Essays caption and the four-segment bar all follow the answer only.

## 4. Highlights in the student's draft

Replaces "tapping a quoted phrase selects it in the text" (19) as the only link between comments and the draft. Both directions now work.

**Marking.** Each unresolved comment whose quote is still found in the answer (`findQuote`) is marked in the draft: `--tint-indigo` fill with a 2 px `--indigo-600` underline, offset 3. Resolved comments and comments on changed text ("This part has changed", 19) aren't marked.

**How.** The answer is a `textarea`, which can't style parts of its text, so a mirror `div` sits behind it with the same text, font, padding, width, `white-space: pre-wrap` and word breaking. In the mirror, the text is transparent and the marked runs are `mark` elements; the textarea's background is transparent. The field already grows to fit its text, so the two never scroll apart. Reuse `highlightRuns` from `lib/review.ts`.

**Comment bar.** When the caret or a selection is inside a marked phrase, a bar shows above the word counter (so it sits just above the keyboard when it's open), like Google Docs on a phone:

```
┌ surface, 1 px border on top ─────────────────┐
│ ┃ Ms. Lee                          See comment│  label navy / text button blue-600
│ ┃ Love this detail. Can you say what you     │  body navy, 2 lines max
│ ┃ built?                                     │
└──────────────────────────────────────────────┘
```

| Part | Spec |
|---|---|
| Bar | Full width, `--surface`, 1 px `--border` top, padding 12 24, 2 px `--indigo-600` bar on the left of the text. No shadow; it isn't a card |
| Content | The reviewer's name, `label` `--navy-900` ("Ms. Lee and 1 more" when the phrase has several comments). The newest comment, `body`, 2 lines, ellipsis |
| See comment | Text button. Scrolls the Reviews section to that comment and gives it a `--tint-indigo` background for 1.2 s (reduced motion: no fade, the background stays until the next tap) |
| Hides | When the caret leaves the phrase, or when typing starts inside it |

Comment rows in the Reviews section keep their quote, and tapping the quote still selects the phrase in the draft (19).

## 5. Reviewer page, rebuilt text-first

Replaces 19's reviewer-side layout. Behavior, the Edge Function, the limits and the ended page stay as built, except that "Finish review" (6) is added.

### Phone (under 900 wide)

```
 stackd                                         wordmark

 Ryan would like your feedback                  title-1 navy
 On a UC personal insight answer. Select any    body slate-700
 sentence to comment on it.

┌ full-width tint-indigo band ────────────────┐
│ Your major                 212 of 350 words │  title-3 navy / caption slate-700
│ How you've prepared for your intended major,│  body slate-700
│ and why you're ready for upper-division work│
└─────────────────────────────────────────────┘

 When I took my first CS class at Las Positas, I   body-lg, line height 1.6
 didn't expect to stay up debugging…               highlight: tint + underline

 Comments (2)                                    title-3
 ┃ "didn't expect to stay up debugging"          caption slate-600, indigo bar
 Love this detail. Can you say what you built?   body navy
 Ms. Lee, Oct 21                                 caption slate-600

 Only people with this link can see this answer. It ends on Nov 4.
 By commenting you agree to Stackd's Terms…

┌ pinned bar: surface, 1 px border top ───────┐
│ Comment on the whole answer   [Finish review]│
└─────────────────────────────────────────────┘
```

| Part | Spec |
|---|---|
| Intro | "{first name} would like your feedback" (`title-1`), or "A student would like your feedback". Under it, 8 below: "On a UC personal insight answer. Select any sentence to comment on it." (`body` `--slate-700`). This replaces "Review request" and the separate hint line |
| Question band | Full width, no border, no radius, `--tint-indigo`, padding 16 24. It's the same band as the editor's strip, so the page looks like the app. Short name `title-3`; "{n} of 350 words" `caption` `--slate-700` on the right; summary `body` `--slate-700` |
| Text | 24 under the band. `body-lg`, line height 1.6, max width 640, padding 0 24. Remove the left bar on the whole text: in Stackd an indigo bar means a quote |
| Highlights | As in 4: tint and underline. Tapping one opens the phrase sheet |
| Selecting | Selecting text shows the floating indigo "Comment" pill above it, as built. Tapping it opens the comment sheet with the quote |
| Comment sheet | Bottom sheet (00). Title "Comment on this part" (or "Comment on the whole answer"), the quote with an indigo bar, a comment field (3 rows, grows, 1,000 characters, counter), then either "Commenting as Ms. Lee" `caption` with a "Change" text button (name saved in this browser), or the "Your name" field (first comment only). "Add comment" primary at the bottom, no chevron (8). Toast "Comment added." |
| Phrase sheet | Bottom sheet: the quote with an indigo bar, then each comment on it (`body`, name and date in `caption`, "Delete" for your own within 15 minutes), then the "Add a comment" text button, which swaps the sheet to the comment sheet with the same quote |
| Comments list | Under the text, ordered by where the quote appears in the text, with whole-answer comments first under "On the whole answer" (`label` `--slate-600`). Tapping a comment's quote scrolls to the phrase and outlines it for 1.2 s |
| Pinned bar | `--surface`, 1 px `--border` top, padding 8 16 plus the safe area, 60 tall. Left: text button "Comment on the whole answer". Right, after the reviewer's first comment: compact solid button "Finish review" (16 → compact actions). While text is selected (a keyboard selection too), the left button becomes "Comment on selection". It's never shown disabled. The page's bottom padding grows by the bar's height |
| Removed | The always-open name field, whole-answer box and Add comment button, the "Select any part of the text…" hint, and the disabled "Comment on selection" |

### Wide (900 and wider)

Two columns, centered, gap 48: the intro, band and text in a 640 column, and a 320 comment rail on the right, sticky 24 from the top, scrolling inside itself. The rail holds "Comments ({n})", the list ordered as above, and the comment composer at the top of the rail instead of a sheet. The pinned bar becomes a row at the bottom of the rail. Tapping a highlight outlines its comment in the rail and scrolls the rail to it; tapping a comment outlines its phrase.

## 6. Finish review

Gives the reviewer a clear way to end and tells the student the feedback is complete.

| Where | Spec |
|---|---|
| Reviewer | "Finish review" (pinned bar) opens a confirm sheet: "Let Ryan know you're done?" / "You can still add comments afterward." / "Finish review" (primary, no chevron) / "Cancel". After: the bar's right side becomes a `Check` bold 16 `--green-600` icon + "Finished" `label` `--navy-900`, and a toast "Thanks. Ryan can see you're done." |
| Student, Reviews section | Under the link's dates line: `CheckCircle` fill 16 `--green-600` + "Finished reviewing {Oct 21}" `caption` `--navy-900` |
| Student, Home | No change. Home's caption already shows new comments (19) |

Finishing again does nothing. After the link is turned off or ends, the ended page shows as now.

## 7. Small fixes

| Fix | Where |
|---|---|
| Add a `chevron` prop to `PrimaryButton`, default `true`. Rule: the chevron shows only when the button goes to another screen. Pass `false` on "Create link" (19's review sheet), "Add comment" and "Finish review" | `components/ui/primary-button.tsx`, the review sheet, the reviewer page |
| Privacy page: notes are saved with the draft, stay private to the student, aren't shared through review links, and are deleted with the account | `app/privacy/page.tsx` |

## Data

One migration, `supabase/migrations/2026102xxxxxxx_notes_finish.sql`:

| Change | Detail |
|---|---|
| `essay_drafts.notes` | `jsonb not null default '[]'`, check: `jsonb_typeof(notes) = 'array'`, `jsonb_array_length(notes) <= 12`, `length(notes::text) <= 30000`. Each item `{ "id": uuid, "starter": "major-1" or null, "body": text }`. Covered by the existing owner-only row-level security and by `delete_my_account()` (it's a column on the draft) |
| `review_links.finished_at` | `timestamptz`, null until the reviewer finishes. Students already read `review_links` through the table-level grant and owner policy |
| `review_finish(token, key)` | Service-role function, like `review_add_comment`: link exists, not turned off, not ended; sets `finished_at = now()` only if it's null. Returns the same shape as `review_open` |
| `review_open` | Also returns `finished_at` |
| Edge Function `review` | New action `finish` that calls `review_finish` |
| `saveDraft` | Takes `notes` like `body` (same offline queue). `word_count` still comes from `body` only |
| Tests (`test:db`) | One student can't read another's notes. Notes over 12 items or over the size limit are refused. `review_finish` refuses a turned-off or ended link and doesn't change an existing `finished_at` |

Ryan runs `npx supabase db push` and `npx supabase functions deploy review` after the PR is reviewed. The website needs a redeploy for the reviewer page.

## Building it

| PR | Contains | Risk |
|---|---|---|
| A | 4 (highlights and comment bar), 5 (reviewer page, without Finish), 7 | App and web only, no migration |
| B | 1, 2, 3 (tabs, starter card, notes), 6 (finish), the migration and the function change | Migration: branch and PR, Ryan pushes |

## Test

- Empty answer, field not focused: the indigo card shows "Start with a question", the first starter question for that prompt, "Answer in notes" and "1 of 4". Paste a draft and Import a file sit under it.
- Tap into the empty field: the card hides. Tap out: it comes back.
- Try another: the next question, "2 of 4"; after the 4th it wraps to the 1st. Reduced motion: no fade.
- Answer in notes: the Notes tab opens with that question as a heading and the cursor in its field. Back on Answer, Try another skips that question.
- All four in Notes: no card; the "Your notes are ready…" line shows.
- Type 40 words in a note: the word counter doesn't change and the Essays list still says "Not started".
- Add to my answer on an empty answer: the note's text becomes the answer; the Answer tab shows it; toast "Added to your answer."
- Copy text, Share, Download all answers and a new review link contain the answer only, never notes.
- Delete note, then Undo: it comes back in the same place.
- 12 notes: the add buttons are disabled with the limit line.
- Notes typed offline appear on another device after reconnecting.
- A reviewer comments on "stay up debugging": the phrase is tinted and underlined in the student's draft. Put the caret in it: the comment bar shows "Ms. Lee" and the comment. See comment scrolls to it in Reviews.
- Edit the phrase so the quote is gone: the highlight disappears; the comment shows "This part has changed."
- Resolve the comment: the highlight disappears.
- Typing with highlights: the caret and the marks stay lined up at 393 and 320 wide, including after line wraps and blank lines.
- Reviewer page on a phone: intro, indigo band, the text with no left bar, no form on the page. Select a phrase, tap Comment: the sheet with the quote and the name field. Add comment: toast, highlight, comment in the list in text order.
- Second comment: the sheet shows "Commenting as Ms. Lee" with Change.
- Tap a highlight: the phrase sheet with its comments and "Add a comment".
- Keyboard: select text with Shift + arrows; the bar's left button reads "Comment on selection" and works. It's never greyed out.
- At 1280 wide: the comment rail on the right; tapping a highlight outlines its comment there.
- Finish review: confirm, "Finished" in the bar, the toast. In the app, the Reviews section shows "Finished reviewing" with today's date. Finishing on a turned-off link shows the ended page.
- Create link, Add comment and Finish review have no chevron; "Sign in" on the sign-in screen still has one.
- `test:db` passes with the new tests.
