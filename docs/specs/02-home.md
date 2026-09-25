# 02 · Home

Route: `/`. Tab: Home. Mockup: panel 2 of `../mockup/mockup-4-screens.png`.

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
│ │ ●━━●━━●  ○   ○   ○        │ │
│ └───────────────────────────┘ │  12
│ ┌────────────┐ ┌────────────┐ │
│ │▣ Requirem… >│ │▣ Essays   >│ │  tiles 72, gap 12
│ └────────────┘ └────────────┘ │  12
│ ┌────────────┐ ┌────────────┐ │
│ │▣ Mentors • >│ │▣ Events   >│ │
│ └────────────┘ └────────────┘ │  20
│ Upcoming                      │  title-2, x 24
│ ┌───────────────────────────┐ │  12
│ │▣ Application dead… (In 2w)│ │  upcoming card
│ │  Stay on track! Review… > │ │
│ └───────────────────────────┘ │  12
│ ┌───────────────────────────┐ │
│ │▣ Transfer student panel   │ │
│ │  Hear from current…     > │ │
│ └───────────────────────────┘ │  24
├───────────────────────────────┤
│ Home  Explore  Essays Mentors │  tab bar 56 + safe
└───────────────────────────────┘
```

Alignment: left. Free text at x 24. Cards at 16.

## Background

`linear-gradient(180deg, var(--sky-100) 0, var(--sky-50) 360px)`, then solid `--sky-50`. `home-clouds` art is absolutely positioned at top 0, full width, height 300, behind everything, `alt=""`.

## Header row

Height 44, top padding 8 (below the demo strip), horizontal padding 24 left, 16 right. Not sticky.
- **Wordmark**: `wordmark.svg`, width 100, vertically centered, `aria-label="Stackd"`.
- **Bell**: circle button (44, `--surface`, `--shadow-float`) with `Bell` regular 24 `--navy-900`. Unread dot: 10 × 10 `--coral-500` with a 2 px `--surface` ring, placed top 4 / right 4 of the circle. `aria-label="Notifications, 1 unread"` (count from data). Tap: placeholder screen.

## Greeting block

Container: 24 below the header. Height is its content: 40 + 4 + 20 + 12 + 4 = 80.
- "Hi, {firstName}!": `title-1`, `--navy-900`. `firstName` comes from `localStorage["stackd.profile"]` (written on create account, 07). If it's missing, as after an Apple or Google sign-in, use the demo name from `home.json`.
- "You're closer than you think.": `body`, `--navy-900`, max-width 200. Copy comes from data (`home.json → greeting.subtitle`) because it makes a claim about the student.
- Dash: 28 × 4, `--r-full`, `--blue-600`, 12 below the subtitle. Decorative, `aria-hidden`.

**Husky**: `husky-home`, width 160, height auto (~140). `position: absolute; right: 12px;` with its bottom edge 4 below the journey card's top edge, so the card covers the bottom of the husky art (z-index: husky 0, cards 1). `alt=""`. `burst-dashes.svg` at 28 × 28 sits 8 left of the husky's head (left edge of husky + 18, top of husky + 12), rotated -20°, `--yellow-400`.

The greeting text column is capped at 200 so it never runs under the husky. At viewports under 360 wide, the husky shrinks to width 128.

## Journey card

Card (00). 32 below the dash, margins 16. Height 100: 16 padding + 26 title row + 12 + 30 nodes + 16 padding.

- **Title row**: "Your transfer journey" `title-2` `--navy-900` on the left. "{done} of {total} complete" `caption` `--navy-900` (tabular-nums) on the right, sharing the title's baseline.
- **Nodes**: 6 circles of 30, `justify-content: space-between` across the card's inner width (329 at 393 wide, so node pitch ≈ 59.8; mockup measured 57.5).
  - Done node: `--green-600` fill, white `Check` bold 16.
  - Remaining node: `--node-empty` fill, no border.
  - Connector: between two consecutive done nodes, a 6-tall `--green-600` bar from center to center, behind the nodes. No connector touches a remaining node, as drawn.
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
| Requirements | `FileText` | `--tint-sky` | "{n} in progress" (n = requirements with status `in_progress`; 1 in demo) | `/universities/uc-davis?tab=requirements` (push) |
| Essays | `PencilSimple` | `--tint-indigo` | "{n} draft" / "{n} drafts" | Essays tab |
| Mentors | `UsersThree` | `--tint-sky` | "{n} new messages" + unread dot | Mentors tab (placeholder) |
| Events | `CalendarDots` | `--tint-indigo` | "{n} upcoming" | `/events` placeholder |

Unread dot on Mentors: 8 × 8 `--coral-500`, right 12, top 16. The chevron stays vertically centered below it. The dot is decorative, so the tile's `aria-label` includes "3 new messages".

## Upcoming

- Title "Upcoming": `title-2`, x 24, 20 below the tiles. `h2`.
- Cards: 12 below the title, gap 12, margins 16. Rendered from `home.json → upcoming[]` in date order.

**Upcoming card**: card (00), padding 16, `min-height` from content (104 with a pill, 98 without, matching the mockup).
- Icon tile 44, `--r-sm`, top-aligned. Deadline type: `--coral-25` bg, `CalendarDots` fill `--coral-500`. Event type: `--tint-sky` bg, `UsersThree` fill `--blue-600`.
- 16 gap to the text column. The column has padding-right 28 to clear the chevron.
- Title row: title (`headline`, `--navy-900`) and, if due within 14 days, a `due` pill, `justify-content: space-between`, `align-items: center`, row height 28.
- Body: `body` `--slate-600`, 4 below, clamped to 2 lines.
- Chevron: `CaretRight` bold 20 `--navy-900`, absolute right 16, vertically centered, `aria-hidden`.
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

## Motion

Press states only. No entrance animation. The node animation above is the only other motion.

## Accessibility

Heading order: `h1` greeting, `h2` "Your transfer journey", `h2` "Upcoming". Every tile and card is one `<a>` or `<button>` whose accessible name includes its subtitle.

## Test

- Set GPA to done in `home.json`: the tile reads "0 in progress", the journey reads "4 of 6", and a fourth node plus its connector turn green.
- At 320 wide the tiles stay 2-up, titles truncate with an ellipsis, and the husky shrinks to 128.
- With `upcoming: []`, the empty line renders.
