# 18 · Date tiles, plain links, and step sheets

Release: v1.2 (or v1.1 build 3 if it lands first). Changes the Deadlines list, the outside-link pattern, and what a checklist step contains. Replaces the matching parts of 15 and 16. No database changes.

## Why

Three things in the Oct 19 build still look generic or thin:

1. The timeline is a line with hollow circles. It's the most common timeline drawing there is, and the year bar in the panel already shows the spread of dates, so the list doesn't need its own spine.
2. The outside-link row (bordered box, globe in a tinted tile, arrow) is a stock pattern. A link to a website needs the name and the domain, nothing else.
3. The checklist is six titles with check tiles. Checking boxes is not an application. Each step should say what you need and, where Stackd has the tool, take you to it. And "Your UC application is ready" claims more than six self-reported checks can support.

## Mobbin references

| Screen | What it grounds |
|---|---|
| [Spotify artist events](https://mobbin.com/screens/33e857e6-817e-4402-98b2-760b8f6ad236) | Each event row starts with a date tile (month over day). No connecting line, no month headers: the tile carries the date |
| [Strava club events](https://mobbin.com/screens/19cf74bc-5fc2-4e71-97bd-e1806025eeea) | The date tile carries a color; the row text stays plain |
| [Deepstash content list](https://mobbin.com/screens/147f4039-2ca6-4d89-9afd-4d368439b54d) | An outside link is the page's name with its domain under it in small text, nothing boxed |
| [Todoist task](https://mobbin.com/screens/0f0c1a8f-0c94-44b5-a08c-3004f047b82d) | A task sheet holds what the task needs (sub-tasks, notes, dates), not only its title |
| [Structured task](https://mobbin.com/screens/a42cf935-fb6c-4316-9511-b667181f68c4) | A task's website is a plain "Website:" line with the address, not a button |

## 1. Deadlines list: date tiles

The timeline from 14 and 15 becomes a plain list. Remove the spine, the node column, the month headers, the "Open now" text and the days pill. The date tile carries the status.

```
┌────┐
│Nov │  UC application
│ 30 │  All UC campuses
└────┘  [✓ Mark done]  🔔 Remind me

┌────┐
│Jan │  UC Transfer Academic Update
│ 31 │  Opens Dec 15
└────┘
```

**Row**: min height 64, padding 12 16, the whole row a button opening the date's sheet. Pressed `--surface-pressed` with `--r-md`. Rows 4 apart, no dividers.

**Date tile**: 48 × 48, `--r-md` (16). Month `caption` weight 600 on top, day `title-3` (18/24 800) under it, both centered, tabular-nums. The tile is `aria-hidden`; the row's name carries the date.

| Status | Tile | Text |
|---|---|---|
| Due in 14 days or less | `--coral-700` fill | White |
| Window open, more than 14 days left | `--tint-sky` fill, 1.5 px `--blue-600` ring | `--blue-700` |
| Not open yet, or later | `--surface` fill, 1 px `--border-strong` | `--slate-600` |
| Done | `--green-600` fill; the day is replaced by `Check` bold 20 white, month stays | White |
| Missed (in Done and past) | `--surface`, 1 px `--border` | `--slate-400` |

**Text column**: 12 right of the tile. Title `row-title` `--navy-900`, up to 2 lines. Second line `caption` `--slate-600`: who it's for, the time if stated, "Date varies by campus", or "Opens Dec 15" when the window isn't open. Nothing on the right side of the row.

**Open next row**: the first not-done row keeps its two actions from 16 (solid Mark done, text Remind me) on their own line under the text column, 12 below.

**Done and past**: same rows, dimmed as before, under the same collapsed header.

The source line and footer are unchanged.

## 2. Outside links: name and domain, no box

Replaces the outside-link row from 16 everywhere it's used.

**Link line**: a text button. `ArrowSquareOut` bold 16 `--blue-700`, 6 gap, label `label` (14/18 600) `--blue-700`. Under it, 2 below and aligned with the label, the domain in `caption` `--slate-600` (no "www."). 44-tall hit area covering both lines. Accessible name: "{label}, {domain}, opens outside the app".

| Where | Label | Below it |
|---|---|---|
| Date sheet, under the source line | Open the official page | admission.universityofcalifornia.edu |
| Steps sheet, bottom | Open the UC application / Open Cal State Apply | apply.universityofcalifornia.edu / calstate.edu |
| Step sheet (below) | the step's link, if any | its domain |
| Essays screen (17) | Read UC's exact wording | admission.universityofcalifornia.edu |

In the date sheet, the source line and the link sit together as one block: "From UC Admissions, checked Oct 18, 2026." then the link line 8 below.

## 3. Step sheets: what you'll need

Tapping a step's text (on Home or in the steps sheet) opens a **step sheet** instead of scrolling the full list. Bottom sheet (00).

```
┌───────────────────────────────┐
│ [✎]  Write your personal      │  tile 40 + title-2
│      insight answers          │
│ Answer four questions. One is │  body --slate-700
│ required, and you choose the  │
│ other three.                  │
│                               │
│ What you'll need              │  headline
│ • Your four answers, up to    │  body, 8 apart
│   350 words each              │
│ • Which three optional        │
│   questions you picked        │
│                               │
│ ✎ Write them in Stackd        │  link line (when a tool exists)
│   Personal insight answers    │
│                               │
│ [       ✓ Mark done        ]  │  primary, 48
│ Step 3 of 6                   │  caption, centered
└───────────────────────────────┘
```

| Part | Spec |
|---|---|
| Header | The step's icon tile at 40 (16), 12 gap, title `title-2` `--navy-900`, up to 2 lines. Done: the tile is green |
| Summary | The step's stored summary, `body` `--slate-700`, 8 below |
| What you'll need | `headline` `--navy-900`, 20 below. Then 2 to 4 items, `body` `--navy-900`, each with a 6 px `--slate-400` dot at the left, 8 apart. Written in our own words from UC Admissions' "Filling out the application" and Cal State Apply's Transfer Application Guide, checked against the page before build, and kept in a code map keyed by step slug next to the icons (`lib/step-content.ts`) with the source URL in a comment |
| Do it in Stackd | A link line (2) only when Stackd has the tool: Pick your campuses → "See your plan" (Settings → schools); Write your personal insight answers → "Write them in Stackd" (`/essays/`, once `essays` is on); Submit → "Open the UC application" (outside). Other steps have none |
| Mark done | Primary-style solid button (48, `--r-full`, `--blue-600`, white `Check` + "Mark done"), 24 below. When done: "Mark not done" as a text button instead |
| Position | "Step {n} of {total}", `caption` `--slate-600`, centered, 8 below |

The steps sheet (the full list) stays for "See all 6 steps". Its rows' text now opens the step sheet on top (sheet over sheet is fine: the first closes, the second opens, 200 ms).

### What you'll need (UC application, fall 2027)

| Step | Items |
|---|---|
| Pick your campuses and majors | The UC campuses you're applying to. A major for each one. |
| Enter your courses and grades | Unofficial transcripts from every college you've attended. Your courses in progress and planned through summer 2027. |
| Write your personal insight answers | Your four answers, up to 350 words each. Which three optional questions you picked. |
| Add activities and awards | Your work, volunteering, clubs and programs, with dates and hours. Any awards or honors. |
| Pay the fee or ask for a waiver | A card for the fee, or your fee waiver eligibility (the application checks it). |
| Submit by Nov 30 | Everything above reviewed once more. |

Cal State Apply: the same pattern from the Transfer Application Guide; Claude Code drafts and checks them.

### Steps that know their own status

Where Stackd has the signal, the step reads it, so the checklist reflects real progress and not only taps:

| Step | Signal | Shown as |
|---|---|---|
| Pick your campuses and majors | The plan has at least one UC school with a major | Auto-checked, with "From your plan" in `caption` `--slate-600` under the title. The student can still uncheck it |
| Write your personal insight answers | Essays reports 4 of 4 done (once 17 ships) | Auto-checked, "From Essays" |

Others stay manual.

## 4. All-done wording

Six checks are six checks. The all-done state says what happened, and only claims readiness when the signals above agree:

| Condition | Title | Subtitle |
|---|---|---|
| All steps checked, signals present (plan has a UC; Essays 4 of 4 when 17 ships) | Your UC application is ready | Submit it by Nov 30. |
| All steps checked, a signal missing | All 6 steps checked | Submit it by Nov 30. Double-check your campuses and answers on UC's site. |

The toast follows the title: "Your UC application is ready!" or "All 6 steps checked!" with Undo.

## Additions to 00

| Addition | Value |
|---|---|
| Component: date tile | As in 1 |
| Component: link line | As in 2; replaces the outside-link row |
| Component: step sheet | As in 3 |

Remove from 00: the outside-link row (16), the timeline spine and node (14, 15).

## Test

- Deadlines: no spine, no circles, no month headers. Five date tiles: Nov 30 pale blue with a blue ring, Jan 31 white with a grey border, Mar 2 pale blue, Jun 1 white. Clock at Nov 20: Nov 30 is solid coral with white text.
- Mark the UC application done: its tile turns green with a check, the row moves to Done and past, the next row gets the actions.
- Date sheet: the source line, then "Open the official page" with the domain under it, no box, no globe tile.
- Steps sheet: "Open the UC application" is a link line with "apply.universityofcalifornia.edu" under it.
- Tap "Write your personal insight answers" on Home: the step sheet opens with the icon, summary, two "What you'll need" items, no Stackd link while `essays` is off, Mark done, "Step 3 of 6".
- With a plan that has UC San Diego and a major, "Pick your campuses and majors" shows checked with "From your plan"; unchecking it works.
- Check all six with a plan that has a UC: "Your UC application is ready". With a plan that has no major: "All 6 steps checked" and the longer subtitle.
- At 320 wide: tiles stay 48, titles wrap, link lines wrap the domain if needed.
