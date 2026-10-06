# 02 · Home

Route: `/`. Tab: Home. Mockup: panel 2 of `../mockup/mockup-4-screens.png`.

## Build notes (step 6)

- **Demo data** lives in `data/seed/` (00 → Data rule). This step creates `data/seed/home.json` and `data/seed/universities/uc-davis.json` (the records in 03), because the journey card reads requirement statuses from the university file. Every record has `"demo": true`.
- **Requirement status** = the seed status, overridden by `localStorage["stackd.requirements"]` if present (03 writes it; nothing writes it yet). Build the read side now as one shared helper so 03 can reuse it.
- **Demo strip** shows on this screen (00 → Demo strip).
- **Destinations not built yet** open the signed-in placeholder: the Requirements tile (University is step 7), the Essays tile and tab (Essays is step 8), Mentors, Events, the bell, and the upcoming cards.
- **Art**: `husky-home.png` in `public/art/husky/`. If it's missing, use the labelled placeholder at 160 × 140. If the burst marks are painted into the art, don't draw `burst-dashes` separately. `home-clouds` is optional decoration: no placeholder.
- **Scrolling**: the page scrolls under the fixed tab bar. The scroll area's bottom padding = 24 + 56 + safe-area bottom, so the last card never hides behind the tab bar.
- **Seed file** `data/seed/home.json` (the journey and upcoming records are the ones listed further down; this adds the rest the screen reads):

```json
{ "demo": true,
  "greeting": { "demoName": "Alex", "subtitle": "You're closer than you think." },
  "notifications": { "unread": 1 },
  "counts": { "drafts": 1, "newMentorMessages": 3, "upcomingEvents": 2 },
  "journey": { "...": "as below" },
  "upcoming": [ "as below" ] }
```

Tile subtitles use these: Essays "1 draft", Mentors "3 new messages", Events "2 upcoming". The Requirements count is computed from the university file, not stored here.

## Mobbin references

| Screen | What it grounds |
|---|---|
| [Finch home](https://mobbin.com/screens/9ecb7f36-b877-4095-afe1-8b876f9ee18f) | Mascot in the header with the first card overlapping its base. Milestone tracker of connected nodes inside a card |
| [Mimo practice](https://mobbin.com/screens/54b61209-26b8-4d28-ac60-9f888e099b6e) | Section title → 12 → cards rhythm, 5-item tab bar at 49 + 34, icon 24 + label ~11 |
| [Forest home](https://mobbin.com/screens/4d723ae9-5ecc-478f-b65c-8475d109618f) | 2-up tiles at 16 margins with a tight gutter, icon tile top-left |
| [Ahead home](https://mobbin.com/screens/d9882278-4c07-4e0b-9f6f-4e3992730edb) | Section title 18–20 bold, left-aligned with the card edge plus inset |

What the references confirm: 16 margins, 12 gutters, and section titles at 18–20 bold are standard. Ours match. None of them repeat the same shadowed card for every block; they mix flat rows and raised cards. The baseline keeps the cards as drawn.

## Layout

```
┌───────────────────────────────┐  safe-area top
│ Demo data                     │  24
│ stackd                  (🔔•) │  header row 44, 8 top padding
│                               │  24
│ Hi, Alex!            ╭husky╮  │  title-1, max-width 200
│ You're closer than…  │     │  │  body, 4 below
│ ▬                    │     │  │  dash 28×4, 12 below
│                      ╰─────╯  │  32
│ ┌───────────────────────────┐ │
│ │Your transfer journey 3 of 6│ │  journey card, h 100
│ │ ●━━●━━●━━○━━○━━○          │ │
│ └───────────────────────────┘ │  12
│ ┌────────────┐ ┌────────────┐ │
│ │▣ Requirements│ │▣ Essays    │ │  tiles 72, gap 12
│ └────────────┘ └────────────┘ │  12
│ ┌────────────┐ ┌────────────┐ │
│ │▣ Mentors   •│ │▣ Events    │ │
│ └────────────┘ └────────────┘ │  20
│ Upcoming                      │  title-2, x 24
│ ┌───────────────────────────┐ │  12
│ │▣ Application dead… (In 2w)│ │  upcoming card
│ │  Stay on track! Review…   │ │
│ └───────────────────────────┘ │  12
│ ┌───────────────────────────┐ │
│ │▣ Transfer student panel   │ │
│ │  Hear from current…       │ │
│ └───────────────────────────┘ │  24
├───────────────────────────────┤
│ Home  Explore  Essays Mentors │  tab bar 56 + safe
└───────────────────────────────┘
```

Alignment: left. Free text at x 24. Cards at 16.

## Background

`linear-gradient(180deg, var(--sky-100) 0, var(--sky-50) 360px)`, then solid `--sky-50`. `home-clouds` art is absolutely positioned at top 0, full width, height 300, behind everything, `alt=""`.

## Header row

Height 44, top padding 8 (below the demo strip), horizontal padding 24 left, 16 right. Not sticky. The row is exactly the screen width: the wordmark's left edge sits at x 24 and the bell's right edge at 16 from the screen's right edge. Nothing in the header may be cut off by the screen edge.
- **Wordmark**: `wordmark.png` (trimmed), width 100 (about 32 tall), vertically centered, `role="img"`, `aria-label="Stackd"`.
- **Settings** (rev 3): circle button (44, `--surface`, `--shadow-float`) with `GearSix` regular 24 `--navy-900`, `aria-label="Settings"`, 8 left of the bell. Pushes `/settings/` (`11-settings.md`).
- **Bell**: circle button (44, `--surface`, `--shadow-float`) with `Bell` regular 24 `--navy-900`. Unread dot: 10 × 10 `--coral-500` with a 2 px `--surface` ring, placed top 4 / right 4 of the circle. `aria-label="Notifications, 1 unread"` (count from data). Tap: placeholder screen.

## Greeting block

Container: 24 below the header. Height is its content: 40 + 4 + 20 + 12 + 4 = 80.
- "Hi, {firstName}!": `title-1`, `--navy-900`. `firstName` comes from `localStorage["stackd.profile"]` (written on create account, 07). If it's missing, as after an Apple or Google sign-in, use the demo name from `home.json`.
- "You're closer than you think.": `body`, `--navy-900`, max-width 200. Copy comes from data (`home.json → greeting.subtitle`) because it makes a claim about the student.
- Dash: 28 × 4, `--r-full`, `--blue-600`, 12 below the subtitle. Decorative, `aria-hidden`. It's in the mockup and must render.

**Husky**: `husky-home`, width 160, height auto (~140). It is anchored to the **journey card**, not the greeting. Build it this way: wrap the journey card in a `position: relative` wrapper. The husky is `position: absolute` inside that wrapper with `right: -4px` (the card is 16 from the screen edge, so this puts the husky 12 from it) and `bottom: calc(100% - 4px)`, which puts the husky's bottom edge exactly 4 below the card's top edge. Husky `z-index: 0`; the card `position: relative; z-index: 1`, so the card covers those 4. The rest of the husky sits **above** the card: at 393 wide its ears land just below the bell. Result at 393 wide: the husky sits to the right of "Hi, Alex!", its ears just below the bell, and its chest disappears behind the top of the journey card, exactly as in the mockup. It must never appear below the journey card. `alt=""`. If the art has no burst marks painted in: `burst-dashes.svg` at 28 × 28 sits 8 left of the husky's head (left edge of husky + 18, top of husky + 12), rotated -20°, `--yellow-400`.

The greeting text column is capped at 200 so it never runs under the husky. At viewports under 360 wide, the husky shrinks to width 128.

## Journey card

Card (00). 32 below the dash, margins 16. Height 100: 16 padding + 26 title row + 12 + 30 nodes + 16 padding.

- **Title row**: "Your transfer journey" `title-2` `--navy-900` on the left. "{done} of {total} complete" `caption` `--navy-900` (tabular-nums) on the right, sharing the title's baseline.
- **Nodes**: always **all 6** circles of 30, `justify-content: space-between` across the card's inner width (the first circle's left edge on the card's inner left, the last circle's right edge on the inner right).
  - Done node: `--green-600` fill, white `Check` bold 16, centered.
  - Remaining node: `--node-empty` (#E9F3FC) fill, no border. It's pale but visible on the card, as drawn.
  - **Track** (behind the circles): a 6-tall bar, `--r-full`, running from the first circle's center to the last circle's center, in `--node-empty`.
  - **Progress fill** (on top of the track, still behind the circles): the same 6-tall bar in `--green-600`, from the first circle's center to the center of the last done circle in the unbroken run from the start. With 3 done, it ends at circle 3's **center**, hidden under that circle, so there is no gap anywhere between the green circles. Square ends (`border-radius: 0`) on both the fill and the track: their ends are always under a circle, and rounded ends leave a visible notch.
  - The track must be visible between the empty circles too (pale line joining circles 3 to 6), as in the mockup.
  - **Vertical alignment:** the track, the fill, and all six circles share one center line. Build the row as a 30-tall box with `position: relative`; the track and fill are `position: absolute; top: 12px` (so their 6 px sit centered on 15), and the circles are in a flex row on top. The bar must never sit above or below the circles' centers.
- The row is `role="img"`, `aria-label="{done} of {total} steps complete"`. Step names are in `home.json → journey.steps[]` for screen readers and later use, and aren't shown.
- Not tappable in the baseline.

Demo data (keeps home and the university screen consistent):

```json
"journey": { "demo": true, "steps": [
  { "id": "targets",   "label": "Pick your target schools",       "status": "done" },
  { "id": "major",     "label": "Choose a major",                 "status": "done" },
  { "id": "units",     "label": "Transferable units",             "status": "done",        "requirementId": "ucd-units" },
  { "id": "gpa",       "label": "GPA requirement",                "status": "in_progress", "requirementId": "ucd-gpa" },
  { "id": "majorprep", "label": "Major preparation",              "status": "not_started", "requirementId": "ucd-majorprep" },
  { "id": "materials", "label": "Application materials",          "status": "not_started", "requirementId": "ucd-materials" }
]}
```

A step's status is read from its linked requirement when `requirementId` is present. That way, marking a row done on the university screen (03) fills the matching node here.

## Shortcut tiles

2 × 2 grid, gap 12, 12 below the journey card. Tile component per 00. Subtitles are computed from data, never typed.

| Tile | Icon (fill 24, `--blue-600`) | Icon tile bg | Subtitle | Goes to |
|---|---|---|---|---|
| Requirements | `FileText` | `--tint-sky` | "{n} in progress" (n = requirements with status `in_progress`; 1 in demo). Real accounts: see Plan states | `/university/?slug=uc-davis&tab=requirements` (push) |
| Essays | `PencilSimple` | `--tint-indigo` | "{n} draft" / "{n} drafts" | Essays tab |
| Mentors | `UsersThree` | `--tint-sky` | "{n} new messages" + unread dot | Mentors tab (placeholder) |
| Events | `CalendarDots` | `--tint-indigo` | "{n} upcoming" | `/events` placeholder |

Unread dot on Mentors: 8 × 8 `--coral-500`, right 12, top 16. Only the **title** line leaves room for it (padding-right 20). The subtitle uses the full width, so "3 new messages" shows in full at 393 wide. The dot is decorative, so the tile's `aria-label` includes "3 new messages".

## Upcoming

- Title "Upcoming": `title-2`, x 24, 20 below the tiles. `h2`.
- Cards: 12 below the title, gap 12, margins 16. Rendered from `home.json → upcoming[]` in date order.

**Upcoming card**: card (00), padding 16, `min-height` from content (104 with a pill, 98 without, matching the mockup).
- Icon tile 44, `--r-sm`, top-aligned. Deadline type: `--coral-25` bg, `CalendarDots` fill `--coral-500`. Event type: `--tint-sky` bg, `UsersThree` fill `--blue-600`.
- 16 gap to the text column.
- Title row: title (`headline`, `--navy-900`) and, if due within 14 days, a `due` pill, `justify-content: space-between`, `align-items: center`, row height 28.
- Body: `body` `--slate-600`, 4 below, clamped to 2 lines.
- **No chevron** (rev 2). The whole card is the button.
- Tap: placeholder screen.

Pill text comes from `dueDate`, relative to today: "Today", "Tomorrow", "In {n} days" (2–13), "In 2 weeks" (14). Over 14, no pill.

Demo records:

```json
"upcoming": [
  { "demo": true, "type": "deadline", "title": "Application deadline", "body": "Stay on track! Review your checklist and make sure everything's ready.", "dueInDays": 14 },
  { "demo": true, "type": "event", "title": "Transfer student panel", "body": "Hear from current transfer students and get your questions answered." }
]
```

The last card is followed by 24 of padding, then the tab bar (fixed, per 00, Home active).

## States

- **Empty upcoming**: replace the cards with a `body` `--slate-600` line at x 24: "Nothing coming up. Deadlines you save will show here." No button, since there's nothing to add yet in the baseline.
- **No journey data**: hide the journey card entirely. Don't show "0 of 0".
- **Arriving from "View progress"** (05): 200 ms after this screen appears, the newly completed node animates. Its fill scales from 0.6 to 1 with a bouncy spring, the check draws via stroke-dashoffset over 180 ms, and the connector into it grows width 0 → 100% over 320 ms `--ease-out`. The caption count changes with a 150 ms crossfade. This is triggered motion (it answers the student's action), not load motion.

## Plan states (rev 3, real accounts)

With real sign-in on (`NEXT_PUBLIC_DEMO_STRIP=off`), Home reads the student's account, not `home.json`. The demo strip doesn't show, and nothing on this screen may fall back to a demo record. Three states, decided by the student's saved plan (`10-onboarding.md`):

| State | When | Card under the greeting | Greeting subtitle |
|---|---|---|---|
| No plan | No targets saved (skipped onboarding) | Setup card | "Let's set up your transfer plan." |
| Plan, no journey data | Targets saved. This is every real account today, since course matches are locked (`docs/16`) | Plan card | "Transferring to {first school}." With more: "Transferring to {first school} and {n} more." |
| Plan with journey | Real journey data exists (a later spec) | Journey card, as above | From data |

The greeting name comes from the account's profile (first name from Create account). If the profile has none, as after an Apple or Google sign-in, the greeting is "Hi there!".

**The husky anchors to whichever card sits first under the greeting**, exactly as described for the journey card (same wrapper, same `right: -4px; bottom: calc(100% - 4px)`). The card below it is 32 below the dash in every state.

### Setup card

Card (00), margins 16, padding 16.

- Title: "Set up your plan", `title-2` `--navy-900`, `h2`.
- Body: "Pick your college, the schools you want, and your major. It takes about a minute." `body` `--slate-600`, 4 below, full card width (the husky sits above the card, not inside it).
- Button: primary button (00), "Set up your plan", 16 below, full card inner width. Opens `/onboarding/?step=college` (first-run mode, with Skip).

This is the one bold element on Home in this state.

### Plan card

Card (00), margins 16, padding 16. The whole card is the button: it pushes the University screen for the first school, Requirements tab (`/university/?slug={slug}&tab=requirements`). Pressed: `--surface-pressed`.

- Title row: "Your plan", `title-2` `--navy-900`, `h2`, on the left. On the right, "Edit", text link (`label` `--blue-600`, 44 hit area) opening `/settings/`. The link is its own button, separate from the card's.
- One line per school, 12 below the title, 8 apart, up to 3, in the order they were chosen:
  - School name: `headline` `--navy-900`.
  - Under it, 2 below: "{major} from {college}" in `caption` `--slate-600`. Missing major: "Pick a major". Missing college: just "{major}".
- More than 3 schools: a last line "+{n} more" in `caption` `--slate-600`.

### Tiles with a real account

| Tile | Subtitle | Goes to |
|---|---|---|
| Requirements | No plan: "Set up your plan". With a plan: the first school's short name ("UC San Diego") | No plan: onboarding. With a plan: the first school's University screen |
| Essays, Mentors, Events | "Coming soon" (no counts until those features exist; the unread dot is hidden) | Placeholder screen, as now |

### Upcoming with a real account

There are no real deadlines in the database yet, so the empty line shows: "Nothing coming up. Deadlines you save will show here."

### Test (rev 3)

- New account that skipped onboarding: "Hi, {name}!", "Let's set up your transfer plan.", the setup card with the husky sitting on it, and the Requirements tile reads "Set up your plan".
- After saving the Las Positas → UC San Diego CS plan: "Transferring to UC San Diego.", the plan card shows "UC San Diego" with "Computer Science B.S. from Las Positas College", and tapping the card opens the UC San Diego screen.
- "Edit" on the plan card opens Settings, not the University screen.
- No "Demo data" strip anywhere on Home with a real account.

## Motion

Press states only. No entrance animation. The node animation above is the only other motion.

## Accessibility

Heading order: `h1` greeting, `h2` "Your transfer journey", `h2` "Upcoming". Every tile and card is one `<a>` or `<button>` whose accessible name includes its subtitle.

## Test

- Set GPA to done in `data/seed/universities/uc-davis.json` (or in `stackd.requirements`): the tile reads "0 in progress", the journey reads "4 of 6", and a fourth node plus its connector turn green.
- At 320 wide the tiles stay 2-up, titles truncate with an ellipsis, and the husky shrinks to 128.
- With `upcoming: []`, the empty line renders.
