# 17 · Essays: personal insight answers with AI feedback

Release: v1.2. Flag: `essays` (and `essayFeedback` for the AI part, so it can ship or be turned off on its own). Replaces the demo-era `04-essays.md` for real accounts; 04's layout notes stay as history.

## Why this exists

Every UC transfer applicant writes four personal insight answers of up to 350 words, and the application is due November 30. Students write them in Google Docs, count words by hand, and ask whoever is around for feedback. Stackd gives them one place to draft all four, see which ones are done, and get honest feedback on a draft at any hour, without anyone writing it for them.

UC's own rule shapes the feature: answers "should reflect your own ideas and be written by you alone" ([UC Admissions, Personal insight questions](https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/personal-insight-questions.html)). So the AI coaches: it points at what's unclear, missing or off-prompt and asks questions. It never writes sentences for the student, never rewrites, never fixes their text for them.

## What UC asks (fall 2027 cycle)

From the official page, confirmed Oct 19, 2026. Stored in our own words, with the link to UC's exact wording.

- Transfer applicants answer **4 questions**: **1 required**, plus **3 of 7** they choose.
- **350 words maximum** per answer.

| Key | Short name (ours) | Summary (ours) | Required |
|---|---|---|---|
| `major` | Your major | How you've prepared for your intended major, and why you're ready for upper-division work. | Yes |
| `leadership` | Leadership | A time you led: influencing others, helping settle a disagreement, or contributing to a group over time. | |
| `creativity` | Creativity | How your creativity shows up, whether in solving problems, new ideas or art. | |
| `talent` | A talent or skill | Your greatest talent or skill, and how you've built and used it. | |
| `opportunity` | Opportunity or barrier | An educational opportunity you made the most of, or a barrier you worked to get past. | |
| `challenge` | A challenge | The biggest challenge you've faced, how you handled it, and how it affected your schoolwork. | |
| `community` | Community | Ways you've made your school or community better. | |
| `beyond` | Beyond the application | What else makes you a strong candidate for UC that isn't shown elsewhere. | |

These are stored like deadlines: a `piq_prompts` data file (`data/raw/essays/piq-fall-2027.json`) imported with source, `retrieved_at` and verification, so the summaries are checked against UC's page before students see them. Only verified rows show.

## Mobbin references

| Screen | What it grounds |
|---|---|
| [Upwork cover letter tips](https://mobbin.com/screens/fd7a55fe-aae7-490d-b2b6-f34201128510) | AI help offered next to the writing as a separate "Get tips" action with a clear label, not mixed into the text |
| [CapCut AI writer](https://mobbin.com/screens/b045f54a-c672-4c57-ab02-aa370f1089e4) | A quiet "912/3000" counter at the bottom of a full-screen editor |
| [LinkedIn AI note](https://mobbin.com/screens/57aaed46-4ef4-4fbf-ada4-ba11d8bda39a) | A short, plain line telling the user AI was involved |
| [Substack drafts](https://mobbin.com/screens/50dbae4a-89f6-494a-8db5-265c3efab581) | Draft rows with status and word count under the title (from 04) |

Where we differ on purpose: every AI writing tool on Mobbin offers "write it for me" or "improve writing". Stackd doesn't, because UC requires the student's own words.

## Design plan

**Tokens.** Essays' color from 16: the Essays screen opens with a solid `--indigo-600` panel with white text (16 → Feature panels); the editor has a light `--tint-indigo` strip. Status colors from 00. Figtree only. The editor body uses `body-lg` (18/24) for comfortable writing.

**Layout.**

```
Essays                                Editor
┌───────────────────────────────┐     ┌───────────────────────────────┐
│ (←)                           │panel│ (←)            Saved      (✓) │
│ Personal insight answers      │     │ Your major                    │ strip
│ 1 of 4 done                   │     │ How you've prepared for…      │
│ ▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬               │     │ Read UC's exact wording       │
├───────────────────────────────┤     ├───────────────────────────────┤
│ Required                      │     │ When I took my first CS       │
│ ┌ ✎ Your major     212 words ┐│     │ class at Las Positas, I…      │
│ └───────────────────────────┘ │     │                               │
│ Choose 3 (2 chosen)           │     │                               │
│ ┌ ● Leadership       Done    ┐│     │                     212 / 350 │
│ ├ ● A challenge    Not started┤│     ├───────────────────────────────┤
│ ├ ○ Creativity               ┤│     │ [ ✦ Get feedback ]            │ pinned
│ ├ ○ A talent or skill        ┤│     └───────────────────────────────┘
│ │ …                          ││
│ └───────────────────────────┘ │
│ Questions summarized from UC… │
└───────────────────────────────┘
```

Left-aligned. Free text at x 24, lists at 16.

**Hierarchy.** Essays: the four-segment bar (what's done). Editor: the student's text. Everything else stays out of the way.

**Self-check.** Would this fit any writing app? A generic one would lead with "AI writes it for you". Ours is built around UC's 1-required-plus-3 rule, the 350 limit, and coaching that never writes, which only makes sense for this application.

## Entry points

- Home → Get ready → step "Write your personal insight answers": its row text opens `/essays/` (instead of the steps sheet) when `essays` is on. Its check tile stays as is.
- Home: a new row under Get ready (tier 2 list row, 24 below the "See all" link): `PencilLine` tile (16 colors: indigo), "Personal insight answers", and on the right "{done} of 4 done" in `caption` `--slate-600`. Opens `/essays/`. Only for students whose plan includes a UC.
- No tab bar in v1.2; these are the ways in.

## Essays screen (`/essays/`)

| Part | Spec |
|---|---|
| Panel | A solid `--indigo-600` panel (16 → Feature panels) from the physical top, the full screen width, bottom corners rounded 28, every word white. It holds the back button (`--surface` circle, navy arrow), the title "Personal insight answers" `title-1` `h1` (wraps to 2 lines), then "{done} of 4 done" `body`, then a 4-segment bar 12 below (16's segmented bar; on the panel, done = `--white`, drafting = `rgba(255,255,255,.6)`, empty = `rgba(255,255,255,.25)`). The panel ends 24 below the bar. Focus outlines on its controls are white |
| Intro | Under the panel on the `--sky-50` page, x 24, 24 below: "UC asks transfer students for 4 answers, up to 350 words each. One is required; you choose the other 3." `body` `--slate-600`, max 320 |
| Required | Label "Required" `label` `--slate-600`, x 24, 24 below. Then a tier 2 list with one row: `major` |
| Choose 3 | Label "Choose 3 ({n} chosen)" 24 below. Tier 2 list with the 7 optional rows |
| Source line | 24 below: "Questions summarized from UC Admissions, checked Oct 19, 2026." in `caption` `--slate-600`. 12 under it, "Read UC's exact wording" as an outside-link row (16 → Outside-link row), showing UC's domain and opening the official page outside the app. Then the unofficial footer |

**Question row**: min 64, padding 0 16, the whole row a button.

| Part | Spec |
|---|---|
| Choice | Optional rows only: a choice circle (00) on the left, 24, its own 44 button. Tapping chooses the question (max 3). With 3 chosen, unchosen rows' circles dim to 0.4 and tapping one shows the toast "You've chosen 3. Remove one first." Unchoosing a question with a draft asks first (bottom sheet: "Remove Leadership from your 3? Your draft stays saved." / "Remove" / "Keep it") |
| Required icon | The required row shows a `PencilLine` tile (indigo) where the circle would be |
| Text | Short name `row-title` `--navy-900`; summary `caption` `--slate-600`, 2 lines max |
| Status | Right: "Not started", "{n} words", or a `--green-600` check with "Done", in `caption`. Over 350: "{n} words" in `--coral-700` |
| Tap | Opens the editor for that question. Opening an unchosen optional question is fine (reading and drafting are allowed); it just doesn't count toward 3 until chosen |

## Editor (`/essays/edit/?q={key}`)

Full screen, no tab bar.

| Part | Spec |
|---|---|
| Top bar | Back (circle, left). Center: save state in `caption` `--slate-600`: "Saving…", "Saved", or "Saved on this phone" when offline. Right: a "Mark done" circle button (`Check` bold 22); filled `--green-600` when done. Done means the student says it's final; it doesn't lock the text |
| Strip | A light `--tint-indigo` strip, not a panel: this is a writing screen, not a progress screen. Short name `title-2` `--navy-900`, summary `body` `--slate-700`, then "Read UC's exact wording" text link. The strip ends 16 below. Collapses to just the short name (one line, 200 ms) once the student starts typing, and expands when they scroll to the top |
| Text | A plain multiline field, `body-lg` (18/24) `--navy-900`, padding 16 24, no border, placeholder "Start writing. It saves as you go." `autocapitalize="sentences"`, spellcheck on. No formatting (UC's form takes plain text) |
| Counter | Pinned bottom-right above the bottom bar: "{n} / 350" `label` tabular-nums, `--slate-600`; at 330–350 `--amber-700`; over 350 `--coral-700` with "{n} / 350, {over} over". Words counted by whitespace, the same way as UC's form (confirm on the form before release) |
| Bottom bar | `--surface`, top 1 px `--border`, padding 12 16 + safe area. One button: "Get feedback" (tinted button with `Sparkle` fill 20, indigo variant: `--tint-indigo` fill, `--indigo-600` text). Hidden when `essayFeedback` is off. Under 50 words: disabled, with "Write at least 50 words to get feedback." in `caption` above it |

**Saving**: debounced 800 ms after typing stops, and on leaving the screen. Saved to `essay_drafts` (below). Offline: kept on the phone and sent when back online, as the deadline marks already do. A conflict (edited on two devices) keeps the newer save and shows a toast "Updated from your other device."

## AI feedback

### What the student sees

1. **First time only**, a bottom sheet:
   - Title "Get feedback from AI"
   - Body: "Stackd sends this draft to Claude, an AI by Anthropic, to give you feedback. It points out what's unclear or missing and asks questions. It won't write or rewrite anything: UC wants your answers in your own words." Then a second line confirming how Anthropic handles the text (write it from Anthropic's current commercial terms at build time; don't guess).
   - Buttons: "Get feedback" (primary) and "Not now" (text link). Saved per account.
2. **Loading**: the button shows its loading state with "Reading your draft…". Typically a few seconds.
3. **Feedback sheet** (bottom sheet, can expand to full height):

| Section | Content |
|---|---|
| Header | "Feedback on this draft", then `caption` `--slate-600`: "From AI, Oct 19 at 9:41 PM. The writing stays yours." |
| Answers the question? | A pill: "Yes", "Partly" or "Not yet" (mint / amber / coral pill styles), then one sentence why |
| What's working | 1–2 short points |
| Questions to think about | 2–3 questions that push for specifics ("What did you actually do when the group stalled?") |
| Unclear spots | Up to 3. Each quotes a short phrase from the student's own text (8 words or fewer, in quotes) and says what's unclear about it. Tapping the quote closes the sheet and selects that phrase in the editor |
| Length | One line about the word count against 350, only if under 250 or over 350 |
| Footer | "Was this helpful?" thumbs up / down (saved with the feedback), and "Feedback left today: 2" |

The last feedback for each question is kept and can be reopened from a "Last feedback" text link above the button (shows when one exists).

### Rules the AI follows

Written into the system prompt, and checked on the server before anything reaches the student:

- Never write, rewrite, extend or "improve" the student's text. No example sentences, no suggested openings, no word swaps.
- Questions and observations only. Every "question to think about" ends with a question mark.
- Quotes must be copied exactly from the draft and be 8 words or fewer.
- No grades, scores or predictions about admission.
- No invented facts about the student.
- Plain, encouraging, specific. Second person.
- If the draft is mostly not about the prompt, say so plainly in "Answers the question?".

Server checks (in the function, before returning): the response matches the JSON shape; each quote appears in the draft; each question ends with "?"; no field over its length limit (points 160 characters, questions 140). If a check fails, retry once; if it fails again, show "Couldn't get feedback this time. Try again in a minute." and don't count it against the limit.

### How it works

- **Supabase Edge Function** `essay-feedback`. The app calls it with the signed-in session; it reads the draft from `essay_drafts` itself (never trusts text sent from the app), checks the limits, calls the Anthropic Messages API, validates, saves, returns.
- **API key**: `ANTHROPIC_API_KEY` stored only as a Supabase function secret. Never in the app, the repo, `.env.local` screenshots, or chat. Ryan creates it in the Anthropic Console and sets it with `npx supabase secrets set`.
- **Model**: a small, fast model to keep cost down (`claude-haiku-4-5-20251001` to start), set by a function setting so it can change without an app update. Ask for JSON output.
- **Input**: the question's short name and summary, the draft (cut at 500 words), the word count. Nothing else about the student: no name, no school, no email.
- **Limits**: 3 feedback requests per question per day, 8 per account per day, counted in `essay_feedback`. A spending cap is also set in the Anthropic Console as a backstop.
- **Off switch**: if the function setting `FEEDBACK_ENABLED` is false, it returns "Feedback is paused right now." and the app shows that in place of the sheet.

### Errors

| Case | Message |
|---|---|
| Daily limit for this question | "You've used today's feedback for this answer. Try again tomorrow." |
| Daily limit overall | "You've used today's feedback. It resets tomorrow." |
| Offline | "You're offline. Feedback needs a connection; your draft is saved." |
| Service error | "Couldn't get feedback this time. Try again in a minute." |

## Data

| Table | Columns | Access |
|---|---|---|
| `piq_prompts` | `key`, `cycle` ("fall-2027", as in the deadlines file), `short_name`, `summary`, `required`, `sort`, provenance fields | Read: verified rows, anyone signed in. Write: importer only |
| `essay_drafts` | `id`, `user_id`, `prompt_key`, `cycle`, `body`, `word_count`, `chosen` (bool), `done_at`, `updated_at`; unique (`user_id`, `prompt_key`, `cycle`) | Owner only (row-level security) |
| `essay_feedback` | `id`, `user_id`, `draft_id`, `created_at`, `model`, `input_words`, `result` (json), `helpful` (bool, null) | Owner reads own rows; only the function writes |
| `profiles` | add `ai_feedback_consent_at` | Owner |

Deleting an account deletes all of these (extend `delete_my_account()`).

## Privacy and App Store

- **Privacy page**: add that drafts are saved to the account, that a draft is sent to Anthropic only when the student taps "Get feedback", what's sent (the draft and the question, nothing identifying), and how long feedback is kept. Update the date.
- **App Privacy answers**: "Other User Content" already covers account-linked content for app functionality; note the third-party processor in the review notes.
- **Review note**: "Essays lets transfer students draft their UC personal insight answers. 'Get feedback' sends the draft to an AI model for coaching. It never writes or rewrites text."
- Apple's rules on AI features: the consent sheet names the provider and what's sent before the first request.

## States

| State | What shows |
|---|---|
| No UC in the plan | Essays still opens from the Get ready step; the Home row is hidden. Intro adds: "These are for UC applications." |
| No drafts | All rows "Not started"; bar empty |
| Loading lists (over 600 ms) | The loading component (00) in place of the lists |
| Couldn't load | Inline error (00): "Couldn't load your answers" / "Check your connection, then try again." / "Try again" |
| After Nov 30 | Unchanged; a line under the intro: "The fall 2027 UC application closed Nov 30. Your drafts stay here." |

## Motion

Segmented bar fills over 200 ms when a status changes. Strip collapse in the editor 200 ms. Feedback sheet uses the bottom sheet's motion (00). No entrance animations. Reduced motion: all instant.

## Building it

| Part | Who |
|---|---|
| `piq-fall-2027.json` written in our words, checked against UC's page, imported and verified | Ryan (Claude Code), same date-check process as deadlines |
| Tables, row-level security, account deletion | Ryan, migration PR |
| Essays screen and editor, saving, offline | Ryan |
| Edge Function, prompt, server checks, limits, consent sheet, feedback sheet | Ryan; Abyan can review the prompt |
| Anthropic API key and spending cap | Ryan in the Anthropic Console |

Ship the editor first behind `essays` with `essayFeedback` off if feedback isn't ready, so students can start drafting.

## Test

- Home with a UC plan shows "Personal insight answers, 0 of 4 done"; with a CSU-only plan it doesn't.
- Essays: "Your major" is under Required; 7 rows under "Choose 3 (0 chosen)". Choose 3: the rest dim; tapping a fourth shows the toast.
- Unchoose a question with a draft: the confirm sheet; "Remove" keeps the draft and drops it from the 3.
- Editor: type 212 words, leave, come back: the text is there, the row says "212 words". Airplane mode: "Saved on this phone"; back online: "Saved".
- Counter turns amber at 330 and coral past 350 with "{over} over".
- Under 50 words: Get feedback is disabled with the note.
- First Get feedback shows the consent sheet; "Not now" sends nothing.
- Feedback sheet shows all sections; every quote exists in the draft; tapping a quote selects it in the editor; nothing in it reads as a rewritten sentence.
- Fourth request on the same question in a day: the limit message, no API call (check the function logs).
- Feedback can't be requested for another account's draft (call the function with a different user's draft id: refused).
- Delete account: drafts and feedback are gone.
- `essayFeedback` off: no button, no sheet, editor works.
- At 320 wide: the panel's title wraps, counter and button never overlap the keyboard.
