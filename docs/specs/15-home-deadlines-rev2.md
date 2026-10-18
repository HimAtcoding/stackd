# 15 · Home and Deadlines, design rev 2

Release: v1.1, before the deadline flags turn on. Changes the look of Home (02, 14 → Up next and Get ready) and the Deadlines screen (14). Behavior, data, copy rules and accessibility from 02 and 14 stay unless this file says otherwise. If this file and 02 or 14 disagree on looks, this file wins.

Custom dates (flag `customDeadlines`) move to v1.2. They were never built; the "Add a date" button and its sheet stay out of v1.1.

## Why

The v1.1 screenshots (Oct 18) show the problem: the plan, the stack and Get ready are three white cards with the same 20 corners and the same shadow, stacked one after another. Nothing tells the student which one matters. The Deadlines screen then opens with an exact copy of Home's countdown card, so the two screens feel like the same page. The strongest part, the timeline, is the part with no cards.

This revision gives each block a different job and a different treatment, and uses Stackd's own motif, dots on a line, the way a transfer route and a year of deadlines actually look.

## Design plan

**Tokens.** No new colors. Figtree only. Spacing scale unchanged. New: one shadow (`--shadow-lift`) and three container tiers (below).

| Name | Value | Role |
|---|---|---|
| `--navy-900` | #051042 | Text, the countdown, route and timeline lines when done |
| `--blue-600` | #0364FA | Destination node, filled bar, links |
| `--sky-50` | #EAF6FE | Page; blocks without containers sit on it |
| `--surface` | #FAFCFE | The one hero, list containers |
| `--green-600` | #40A459 | Done steps only |
| `--coral-700` / `--coral-500` | #B8361B / #FC5E3C | 14 days or less only |

**Layout.** Single column, left-aligned, free text at x 24, containers at 16.

```
Home (plan)                         Deadlines
┌──────────────────────────┐        ┌──────────────────────────┐
│ stackd               (⚙) │        │ (←)                      │
│ Hi, Sam!        ╭husky╮  │        │ Deadlines                │
│ Transferring fall 2027.  │        │ Fall 2027 transfer Change│
│ ▬               ╰─────╯  │        │                          │
│ ┌ ○ Las Positas  Edit ─┐ │ tier 2 │ UC application is next   │
│ │ ┊                    │ │        │ Due Monday, Nov 30, in…  │
│ │ ● UC San Diego       │ │        │ ━━━━│━━━●━━━━○━━━━○━━━━○ │ cycle bar
│ └─  Computer Science ──┘ │        │ Oct 2026        Jun 2027 │
│ Up next   All deadlines  │        │                          │
│ ╔══════════════════════╗ │ tier 1 │      November 2026       │
│ ║ 43  UC application   ║ │        │ Nov  ●  UC application   │
│ ║ ━━━━│───────────     ║ │        │ 30   ┃  [Remind] [Done]  │ next row, open
│ ╚══════════════════════╝ │        │      ┃  January 2027     │
│  └ Jan 31  UC Transfer ┘ │        │ Jan  ○  UC Transfer…     │
│ Get your UC application  │ plain  │ 31   ┃                   │
│ ready          0 of 6    │        │ Mar  ○  FAFSA or Dream…  │
│ ▬▬ ▬▬ ▬▬ ▬▬ ▬▬ ▬▬        │        │ 2    ┃                   │
│ ┌ ○ Pick your campuses ┐ │ tier 2 │ Jun  ○  Accept your UC…  │
│ ├ ○ Enter your courses ┤ │        │ 1                        │
│ └──────────────────────┘ │        │ Done and past (1)      ⌄ │
│          See all 6 steps │        │ Dates from UC Admissions…│
└──────────────────────────┘        └──────────────────────────┘
```

**Hierarchy.** Home: the countdown number, inside the only elevated container. Deadlines: the next row of the timeline, the only row that opens with actions.

**Self-check.** Would this plan fit any student app? The first draft would have: it softened the cards and kept the same order. What changed: the plan card became a two-stop route (your college to your university), and Deadlines opens with the whole application year on one bar instead of a second countdown. Both only make sense for transfer.

## Container tiers

Use these instead of "Card (00)" on Home and Deadlines. Later screens follow the same tiers.

| Tier | Look | Use | Per screen |
|---|---|---|---|
| 1, hero | `--surface`, `--r-lg` (20), `--shadow-lift` | The one thing that matters most | One at most |
| 2, list | `--surface`, `--r-md` (16), 1 px `--border`, no shadow | Rows the student scans or taps: the route, steps | Any |
| 3, ask | `--blue-50` fill, 1 px `--blue-50-border`, `--r-md`, no shadow | Something we're asking the student to turn on | One at most |
| Plain | No container, on the page | Section headers, progress, the timeline | Any |

`--shadow-lift`: `0 2px 4px rgba(5,16,66,.05), 0 12px 28px rgba(5,16,66,.09)`. It replaces `--shadow-card` on the Up next top layer only.

## Mobbin references

| Screen | What it grounds |
|---|---|
| [Bumble report timeline](https://mobbin.com/screens/09426d05-9e3c-4a74-b206-da7d04e07ba4) | One continuous line through every step; done steps solid, later steps hollow and quieter |
| [Transit trip](https://mobbin.com/screens/16a29c82-17c2-48f6-bc29-6d6d0076892a) | A single line down the left joins every stop, so a list reads as a route |
| [Forest timeline](https://mobbin.com/screens/109be5af-6adf-4c93-9a14-76a8c86ecffe) | Date markers sit on the line; only one item opens up with more content |
| [Strava getting started](https://mobbin.com/screens/9e550f02-8d7a-4e05-be89-aae812901ec4) | A checklist on the page itself: title, segmented bar with "0/4", plain rows |
| [Chime finish setup](https://mobbin.com/screens/5964d1f6-e082-4612-a968-568b09e2cc8a) | One segment per step, so the bar counts real steps, not a percentage |
| [KOHO checklist](https://mobbin.com/screens/0dab839b-0280-40be-8d35-964462d7ce65) | Progress above, rows below separated by thin dividers, no shadows |

What they agree on: a line through dots reads as "a path you're on", segments read as "steps left", and only one item per screen gets extra weight.

## Home

### Greeting subtitle

With a plan, the subtitle no longer repeats the school (the route below names it):

| `transfer_term` | Subtitle |
|---|---|
| Set | "Transferring fall 2027." |
| Not set | "Transferring to {first school}." (as now) |

No plan: unchanged ("Let's set up your transfer plan.").

### Route (replaces the plan card)

Tier 2, margins 16, padding 16. The husky anchors to it exactly as it did to the plan card (02 → Plan states). The whole route is one button, as the plan card was: it opens the first school's Requirements tab. Pressed: `--surface-pressed`.

```
┌──────────────────────────────────┐
│ ○  Las Positas College      Edit │  from row, 20 tall
│ ┊                                │  connector, 16
│ ●  UC San Diego                  │  to row
│    Computer Science B.S.         │
└──────────────────────────────────┘
```

| Part | Spec |
|---|---|
| Node column | 16 wide, at the left padding |
| From node | 10 px circle, 2 px `--slate-400` ring, `--surface` center |
| Connector | 2 px wide, 16 tall, dashed `--border-strong` (dash 3, gap 3), centered in the node column, from the from node's bottom to the to node's top. Dashed because the student hasn't made the trip yet |
| To node | 12 px filled `--blue-600` circle |
| From text | 12 right of the node column. Home college name in `body` `--slate-600`, single line. College not listed: "Your community college" |
| To text | School name `headline` `--navy-900`. Under it, 2 below, the major in `caption` `--slate-600`. No major: "Pick a major". More schools: a third line, `caption` `--slate-600`, "and {n} more" |
| Edit | Text link (`label` `--blue-600`, 44 hit area), right side, on the from row. Opens `/settings/`. Its own button |

No "Your plan" heading: the route says what it is. Accessible name: "Your plan: Las Positas College to UC San Diego, Computer Science B.S. Opens UC San Diego requirements."

No plan: the setup card stays as it is (02), and it's a tier 1 hero there.

### Up next

The section header and the stack keep their layout from 14. Changes:

- **Top layer**: `--shadow-lift` instead of `--shadow-card`. It's the only tier 1 on Home with a plan.
- **No plan**: the setup card is the hero, so the stack steps down: top layer gets 1 px `--border` and no shadow, and the number uses `title-1` (36/40 900) instead of `countdown`. One bold thing per screen.
- Peek layers, window bar, pressed state: unchanged.

### Get ready (replaces the card)

No container for the header and progress; the next steps sit in a tier 2 list. 24 below the stack.

```
Get your UC application ready        0 of 6
6 steps left, due by Nov 30
▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬ ▬▬▬
┌─────────────────────────────────┐
│ ○  Pick your campuses and majors│  row 52
├─────────────────────────────────┤
│ ○  Enter your courses and grades│
└─────────────────────────────────┘
                     See all 6 steps
```

| Part | Spec |
|---|---|
| Title | "Get your UC application ready", `title-3` `--navy-900`, `h2`, x 24, up to 2 lines, max width leaves room for the count |
| Count | "{done} of {total}", `label` `--slate-600`, tabular-nums, right at 24, baseline-aligned with the title's first line |
| Subtitle | "{n} steps left, due by Nov 30", `body` `--slate-600`, 4 below the title, x 24 |
| Segmented bar | 12 below the subtitle, x 24 to 24. One segment per step, equal width, 4 gap, 6 tall, `--r-full`. Done: `--green-600`. Not done: `--blue-100`. `aria-hidden` (the count carries it). A segment fills over 200 ms when its step is checked |
| Step list | Tier 2, margins 16, 16 below the bar. The next two unchecked steps. Row: min 52, padding 0 16, status icon 24, 16 gap, step in `body-md` `--navy-900`. 1 px `--border` between rows. Tapping the ring checks the step (as 14); tapping the text opens the steps sheet |
| Link | "See all {total} steps", text link, right at 24, 8 below the list |

The ring is gone. The bar does its job and counts the actual steps.

**All done**: every segment green, title "Your UC application is ready", subtitle "Submit it by Nov 30.", no list, no link.

### Footer

Unchanged, 24 below the last block.

## Deadlines screen

### Top

Back button, title and term line: unchanged (14 → Header). The next-up card is removed. In its place, 24 below the term line:

| Part | Spec |
|---|---|
| Next line | "{title} is next", `headline` `--navy-900`, x 24. Under it, 4 below: "Due Monday, Nov 30, in 43 days." `body` `--slate-700`. With a stated time: "Due Monday, Nov 30 at 5:00 p.m. Pacific, in 43 days." 14 days or less: the second line is `--coral-700`. On the due day: "Due today." |
| Cycle bar | 16 below, x 24 to 24, 32 tall in total (below) |

### Cycle bar

The whole application year on one line, so the student sees how the dates spread out, and how much of the year is gone.

- **Range**: from the earliest `opens_at` or `due_at` among the shown upcoming dates (or today, if earlier) to the latest `due_at`. Fall 2027 today: Oct 1, 2026 to Jun 1, 2027.
- **Track**: 6 tall, `--r-full`, `--blue-100`, vertically centered in a 20-tall row.
- **Fill**: `--blue-600` from the range start to today.
- **Today**: 2 × 16 `--navy-900` bar, radius 1, at today's position.
- **Dates**: one node per due date at its position, using the timeline's node styles (14 → Node by status): coral dot at 14 days or less, blue ring when open, slate ring when not open yet. Two dates on the same day share one node. Nodes sit on top of the track.
- **Labels**: 6 below, `caption` `--slate-600`: the range start month and year at the left ("Oct 2026"), the end at the right ("Jun 2027").
- No motion on load. `aria-hidden`; the next line and the timeline carry the meaning.

### Timeline

Rows, date blocks and node styles stay as in 14. Changes:

**One spine for the whole list.** A 2 px `--border` line runs from the first row's node to the last row's node, through every month, without breaks. This replaces the per-month spine, which drew nothing when a month had one date.

**Month headers move into the text column.** "November 2026", `label` `--slate-600` (not `title-3`), aligned with the row titles (x = row padding 16 + date block 40 + 12 + node 12 + 12 = 92), 20 above the month's first row. Sticky as before, on `--sky-50`; the spine runs behind it. The date blocks already say the month, so the header can be quiet.

**The next row opens.** The first not-done row shows two compact buttons under its second line, 12 below, 8 apart:

| Button | Spec |
|---|---|
| Remind me / Reminders on | Height 36, padding 0 12, `--r-full`, `--blue-50` fill, 1 px `--blue-50-border`, `Bell` bold 16 + 6 + `label` `--blue-700`. Opens the date's sheet at Reminders, as before |
| Mark done | Same shape, `Check` bold 16. Marks it done, toast "Marked done" with "Undo" |

Its node is 16 instead of 12. Only this row opens; every other row stays one tap to its sheet. Tapping the row outside the buttons still opens the sheet.

After Mark done: the row's buttons fade out (120 ms), the row collapses out of the list (240 ms `--ease-out`) into Done and past, and the next row's buttons fade in (160 ms). The next line and cycle bar update at the same time. Reduced motion: no collapse, instant swap.

**Reminders ask.** The reminders card from 14 becomes tier 3 (`--blue-50` fill, border, no shadow, no icon tile; `BellRinging` fill 24 `--blue-600` inline at the left). Same copy and behavior, 24 below the cycle bar. iPhone only.

**Add a date**: removed for v1.1 (moves to v1.2 with `customDeadlines`).

**Done and past**, source line, footer: unchanged.

## Not changing

Date sheet, steps sheet, term question, reminders permission flow, notification copy, states, loading and error behavior: all as in 14. Settings, University, sign-in and onboarding keep their cards for now; they move to the tiers when they're next touched.

## Additions to 00

| Addition | Value |
|---|---|
| Shadow `--shadow-lift` | `0 2px 4px rgba(5,16,66,.05), 0 12px 28px rgba(5,16,66,.09)`. Tier 1 only |
| Container tiers | As above. "Card (00)" on Home and Deadlines means the tier named here |
| Component: route | As under Home → Route |
| Component: segmented bar | As under Home → Get ready |
| Component: cycle bar | As under Deadlines → Cycle bar |
| Component: compact tinted button | Height 36, padding 0 12, `--r-full`, tinted colors, icon 16, `label` |

## Test

- Home with a plan: one shadowed block (the stack's top layer). The route shows Las Positas College with a hollow node, a dashed line, and UC San Diego with a filled blue node and "Computer Science B.S." Tapping it opens UC San Diego requirements; Edit opens Settings.
- Greeting subtitle reads "Transferring fall 2027." once the term is set on Deadlines, and "Transferring to UC San Diego." before.
- Get ready has no container around its title; the bar has 6 segments, all pale. Check off step 1: its segment turns green, the count reads "1 of 6", and the list shows steps 2 and 3.
- Home with no plan: the setup card is the only shadowed block; the stack has a border, no shadow, and a 36-size number; no Get ready.
- Deadlines opens with "UC application is next", "Due Monday, Nov 30, in 43 days." and the cycle bar from Oct 2026 to Jun 2027 with nodes at Nov 30, Jan 31, Mar 2 and Jun 1, and today's marker about a fifth of the way.
- No countdown card on Deadlines. The Nov 30 row has Remind me and Mark done; no other row does.
- One spine runs from the Nov 30 node to the Jun 1 node through every month header.
- Mark done on the UC application: the row leaves, the next row (Cal State Apply for a both-systems plan, or the TAU for UC only) gets the buttons, and the next line and cycle bar update. Undo brings it back.
- No "Add a date" button.
- Reduced motion: every change above is instant.
- At 320 wide: the route's names wrap to 2 lines, the cycle bar's labels don't overlap, and the open row's two buttons wrap to two lines if needed.
