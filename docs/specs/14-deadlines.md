# 14 · Deadlines and reminders

Release: v1.1. Flags: `upcoming` (Home's Up next), `deadlines` (the Deadlines screen), `reminders` (notifications), `customDeadlines` (dates a student adds). No mockup yet: this spec is the design brief for one, and every value comes from `00-foundations.md` plus the additions listed at the end.

## Why this screen exists

A transfer student's year runs on a handful of dates, and missing one costs a whole year. Right now the UC and CSU applications are open and due November 30, 2026, and most students don't know the Transfer Academic Update or the Cal Grant deadline exist. This feature answers one question the moment the app opens: **what's due next, and how long do I have?**

It also fills Home with something real, and its reminders are a genuine native feature, which answers Apple's "minimum functionality" rule.

## The idea: a stack of dates

Stackd's name is the design. Deadlines appear as **a stack of dated layers**:

- The next deadline is the top layer, full size, with a big countdown number.
- The two after it peek out underneath as thin layers, each showing its date and name on its edge.
- Tapping the stack opens the Deadlines screen, where the stack spreads out into a full timeline: one spine, grouped by month, every date with its status.

A filing window (open from one date to another) is drawn as a thin bar that fills as time passes, with a marker for today. That bar is the one piece of information no list of dates can show at a glance: *how much of the window is already gone.*

Nothing else in Stackd looks like this, but it's built only from Stackd's type, colors, radii and husky.

## Mobbin references

| Screen | What it grounds |
|---|---|
| [Snapchat countdown](https://mobbin.com/screens/caf49323-7318-424e-b6c2-7a8576d72cf9) | One big day count as the hero, the event name and exact date and time under it |
| [Duolingo streak](https://mobbin.com/screens/1755644a-3b98-4a8e-906f-0ef606e166eb) | A heavy number paired with a small label ("day streak") reads instantly; the number carries the color |
| [Todoist inbox](https://mobbin.com/screens/e125665b-7826-429c-bff4-5f5c805e3730) | Day-grouped list with a status circle per item and a muted second line |
| [Splitwise search](https://mobbin.com/screens/56556c73-67d0-4db2-80f9-3a3883347e49) | Month headers, and a compact month-over-day date block on the left of each row |
| [Remote upcoming absences](https://mobbin.com/screens/92e1401e-19be-45e5-a2c0-9738e4e94bbb) | Month-grouped upcoming items with the date right-aligned |
| [Zocdoc notifications ask](https://mobbin.com/screens/624436bd-5176-4fb7-99af-161f59d3ac99) | A soft ask before iOS's prompt: one picture, one plain sentence about what you'll get, "Turn on notifications" and "Not now" |

What they agree on: big numbers carry countdowns, month headers organize long date lists, and good apps ask for notification permission only after explaining what the student gets. None of them stacks the next items under the hero; that's ours.

## Where dates come from

Every date is a real record in the database with its source, like every other academic record (`06-trust-and-provenance.md`). Dates are stated in Stackd's own words, never copied text, and every one links to the official page it came from.

### Table `deadlines`

| Column | Notes |
|---|---|
| `id` | |
| `cycle` | `fall-2027`, the entry term this date belongs to |
| `audience` | `uc`, `csu`, `aid` (financial aid, for everyone), or one institution's id for campus-only dates |
| `kind` | `application`, `update`, `aid`, `decision`, `enroll`, `documents` |
| `title` | Short, student words: "UC application", "Cal State Apply" |
| `summary` | One or two plain sentences in our own words: what it is and what to do |
| `opens_at` | Nullable. Start of a filing window |
| `due_at` | Timestamp with time zone. For "11:59 p.m. Pacific" deadlines, store that exact instant |
| `varies_by_campus` | True when campuses set their own date; the row then says so |
| `source_name`, `source_url`, `retrieved_at`, `verified_at`, `verification_status` | As on every academic record. Unverified dates are never shown |

### Table `user_deadlines`

`user_id`, `deadline_id`, `done_at` (nullable), `reminders` (array of days-before, default `[7, 1]`). Owner-only row-level security, like the other per-student tables.

### Table `user_custom_deadlines` (flag `customDeadlines`)

`id`, `user_id`, `title`, `due_at`, `note`, `done_at`, `reminders`. Owner-only.

### Profile addition

`profiles.transfer_term`: `fall-2027`, `fall-2028`, or null ("not sure yet"). Asked on the Deadlines screen (below) and editable in Settings.

### Which dates a student sees

- `uc` dates if any target school is a UC; `csu` dates if any is a CSU; `aid` dates always.
- A campus-only date if that campus is a target.
- Only dates in the student's `transfer_term` cycle. With no term set, the nearest cycle that still has upcoming dates (fall 2027 today).
- With no plan at all: `uc`, `csu` and `aid` together, with the note described under States.

### First dates to import (fall 2027 cycle)

Each must be checked on its official page before import; the "Confirm on" column is where. A date that can't be confirmed on an official page isn't imported.

| Title | Audience | Opens | Due | Confirm on |
|---|---|---|---|---|
| TAG (Transfer Admission Guarantee) | uc | Sep 1, 2026 | Sep 30, 2026 | UC Admissions, TAG page (shows as closed) |
| UC application | uc | Oct 1, 2026 | Nov 30, 2026, 11:59 p.m. Pacific | UC Admissions, "Applying as a transfer" |
| Cal State Apply | csu | Oct 1, 2026 | Nov 30, 2026 (some campuses accept later) | Cal State Apply, and each target campus's deadlines page |
| FAFSA or California Dream Act Application | aid | Oct 1, 2026 | Mar 2, 2027 (the Cal Grant deadline) | studentaid.gov and the California Student Aid Commission |
| UC Transfer Academic Update | uc | mid-December 2026 | Jan 31, 2027 | UC Admissions, "Transfer academic update" |
| Cal State Apply course update | csu | early January 2027 | varies by campus | each target campus |
| Accept your UC offer | uc | | Jun 1, 2027 | UC Admissions |
| Accept your CSU offer | csu | | May 1, 2027 at most campuses | each target campus |
| Final transcripts | uc, csu | | varies by campus | each target campus |

## Home: Up next (flag `upcoming`)

Home gains one section under the plan card, so the screen reads top to bottom as *who you are, where you're going, what's next.*

```
┌───────────────────────────────┐
│ stackd                    (⚙) │
│ Hi, Ryan!            ╭husky╮  │
│ Transferring to UC…  ╰─────╯  │
│ ┌ Your plan            Edit ┐  │
│ └───────────────────────────┘  │  24
│ Up next         All deadlines │  title-2 x 24; link right 24
│ ┌───────────────────────────┐ │  12
│ │ 45     UC application     │ │
│ │ days   Due Monday, Nov 30 │ │  top layer
│ │ left   11:59 p.m. Pacific │ │
│ │ ━━━━━━━━━━━━━━━━━│─────── │ │  window bar, today marker
│ │ Opened Oct 1       Nov 30 │ │
│ └───────────────────────────┘ │
│  └ Nov 30  Cal State Apply ┘  │  layer 2 peek, 24 tall
│    └ Jan 31  UC update ───┘   │  layer 3 peek, 24 tall
│                               │  24
│ Unofficial planning tool. …   │
└───────────────────────────────┘
```

### Section header

- "Up next", `title-2` `--navy-900`, `h2`, x 24, 24 below the plan or setup card.
- "All deadlines", text link (`label` 14/18 600 `--blue-600`), right-aligned at 24 from the edge, baseline-aligned with the title, 44 hit area. Opens `/deadlines/`.

### The stack

A single button (the whole stack), margins 16, 12 below the header. Its parts:

**Top layer.** `--surface`, `--r-lg`, `--shadow-card`, padding 16, `z-index: 3`.

| Part | Spec |
|---|---|
| Countdown block | Left column, width 72. The number in the new `countdown` type (56/52, 900, -0.03em, tabular-nums), `--navy-900`. Under it, 2 gap, "days left" (or "day left" for 1) in `caption` `--slate-600`. When the due date is 14 days away or less, the number turns `--coral-700`. On the due day the number is replaced by "Today" in `title-1` `--coral-700` and the label reads "due tonight" |
| Text column | 16 gap from the countdown. Title `headline` `--navy-900`, single line. Then 4 below, `body` `--slate-700`: "Due Monday, Nov 30", and on the next line "11:59 p.m. Pacific" (or "Date varies by campus" when `varies_by_campus`). If the student has more than one school in the audience, a third line in `caption` `--slate-600`: "For UC San Diego" or "For your 3 UC schools" |
| Window bar | Only when the item has `opens_at` and the window is open. 16 below the columns, full inner width, 6 tall, `--r-full`. Track `--blue-100`; fill `--blue-600` from the start to today's position (coral when 14 days or less remain). Today marker: a 2 × 14 `--navy-900` bar, radius 1, centered on today's position. Under the bar, 6 below, two `caption` `--slate-600` labels: "Opened Oct 1" left, "Nov 30" right. Before the window opens: track only, labels "Opens Oct 1" and "Nov 30". `aria-hidden`; the button's label carries the meaning |

**Peek layers.** Two layers behind the top one, each visible only as a 24-tall strip below the layer above it.

| Layer | Inset each side | Background | Shadow | Content |
|---|---|---|---|---|
| 2 | 12 | `--stack-2` | `--shadow-card` at half strength | `caption` row, 16 left padding: date in weight 600 `--navy-900` ("Nov 30"), 8 gap, title `--slate-600` ("Cal State Apply"), single line with ellipsis |
| 3 | 24 | `--stack-3` | none, 1 px `--border` | Same pattern, title in `--slate-600` |

Each peek layer has `--r-lg` corners and sits so its top is hidden behind the layer above; only its bottom 24 shows. With only one upcoming date, there are no peek layers. With two, only layer 2.

**Pressed**: the top layer gets `--surface-pressed`; the peek layers each slide down 4 more (120 ms `--ease-out`), as if the stack is about to spread. Release before navigating.

**Accessible name**: "Up next: UC application, due in 45 days, Monday November 30. Then Cal State Apply, November 30. Then UC Transfer Academic Update, January 31. Opens all deadlines."

### Home states

| State | What Up next shows |
|---|---|
| Upcoming dates exist | The stack |
| No plan yet | The stack built from UC, CSU and aid dates, plus a `caption` `--slate-600` line under it at x 24: "Showing UC and CSU dates. Set up your plan to see only yours." |
| Nothing upcoming in the cycle | No stack. One `body` `--slate-600` line at x 24: "No deadlines coming up for fall 2027. We add the next cycle when schools publish their dates." |
| Loading (over 600 ms) | The stack's outline at its real size in `--stack-2`, no text, no spinner. Home doesn't jump when it loads |
| Couldn't load | The section hides, so Home is never broken by it. The Deadlines screen shows the error instead |

## Deadlines screen (flag `deadlines`)

Route: `/deadlines/`, pushed, no tab bar. Opens from the stack, from "All deadlines", and from a notification (`/deadlines/?id={deadlineId}` opens that date's sheet on arrival).

```
┌───────────────────────────────┐  --sky-50
│ (←)                           │  circle button, safe-area top + 8
│ Deadlines                     │  title-1, 24 below
│ Fall 2027 transfer    Change  │  body --slate-600; link
│                               │  24
│ ┌───────────────────────────┐ │  next-up card
│ │ 45     UC application     │ │
│ │ days   Due Monday, Nov 30 │ │
│ │ left   11:59 p.m. Pacific │ │
│ │ ━━━━━━━━━━━━━━━━━│─────── │ │
│ │ Opened Oct 1       Nov 30 │ │
│ │ [🔔 Remind me] [✓ Mark done]│ │  two tinted buttons
│ └───────────────────────────┘ │  24
│ ┌ 🔔 Get a heads-up before ─┐ │  reminders card (once)
│ └───────────────────────────┘ │
│ November 2026                 │  title-3, sticky
│  Nov ●┊ UC application   In 4…│  rows on one spine
│  30   ┊ All UC campuses       │
│  Nov ●┊ Cal State Apply       │
│  30   ┊ Most CSU campuses     │
│ January 2027                  │
│  Jan ○┊ UC update             │
│  31   ┊ Grades through fall   │
│ March 2027                    │
│  Mar ○┊ FAFSA or Dream Act    │
│   2   ┊ For Cal Grant         │
│ [ + Add a date ]              │  tinted, flag customDeadlines
│ Done and past (1)          ⌄  │  collapsed group
│ Dates from UC Admissions, …   │  source line
│ Unofficial planning tool. …   │
└───────────────────────────────┘
```

Alignment: left. Text at x 24, cards and rows at 16.

### Header

| Element | Spec |
|---|---|
| Back | Circle button (00), `ArrowLeft` bold 22, safe-area top + 8, left 16 |
| Title | "Deadlines", `title-1` `--navy-900`, `h1`, x 24, 24 below the back button |
| Term line | "Fall 2027 transfer" in `body` `--slate-600`, 4 below the title, then 8 gap and "Change" as a text link (`label` `--blue-600`, 44 hit area) opening the term question as a bottom sheet |

### Term question

Shown in place of the term line's value the first time, when `transfer_term` is null: a card (00) 24 below the title.

- Title: "When do you plan to transfer?" `headline` `--navy-900`.
- Body, 4 below: "We'll show the dates for that application cycle." `body` `--slate-600`.
- 12 below: three **choice chips** in a row that wraps: "Fall 2027", "Fall 2028", "Not sure yet". Tapping one saves it, shows the toast "Transfer term saved", and the card collapses (height and opacity, 240 ms `--ease-out`) into the normal term line.
- "Not sure yet" saves null and stops asking; the screen shows the nearest cycle with upcoming dates.

The same chips appear in the "Change" sheet, with the current choice selected.

### Next-up card

The Home top layer at the same size and layout, as a plain card (not a button), plus an action row 16 below the window bar:

- Two tinted buttons (00) side by side, 12 gap, each half the width:
  - **Remind me** (`Bell` bold 20). When reminders are already on for this date: **Reminders on** with `BellRinging` fill 20. Tapping opens the date's sheet scrolled to Reminders.
  - **Mark done** (`Check` bold 20). After marking: the whole card hands over to the next date (see Motion), and the toast "Marked done" appears with "Undo".

When every upcoming date is done or past, this card is replaced by the empty state (States).

### Reminders card (flag `reminders`, iPhone app only)

Shown once, 24 below the next-up card, while reminders have never been turned on and the student hasn't dismissed it.

- Card (00) with `--tint-sky` icon tile 44 (`BellRinging` fill 24 `--blue-600`), 16 gap, text column: title "Get a heads-up before each deadline" `headline`; body "We'll remind you a week before and the day before." `body` `--slate-600`.
- 12 below the text: tinted button "Turn on reminders", full width of the text column.
- A close button (`X` bold 20 `--slate-600`, 44 × 44) top-right, `aria-label="Not now"`. Dismissing hides it for good; the Reminders row in Settings stays.

Tapping "Turn on reminders" goes to the permission flow (below).

### Timeline

Every upcoming date, oldest first, grouped by month.

**Month header**: "November 2026", `title-3` `--navy-900`, x 24, 24 above the month's first row (16 for the first month). Sticky at the top of the scroll area while its rows are on screen, on a `--sky-50` background, so the student always knows which month they're in. Month headers are the only divider; there are no lines between rows.

**Timeline row**: min height 64, padding 10 16 10 16, the whole row a button that opens the date's sheet. Pressed `--surface-pressed` with `--r-md`.

| Column | Width | Content |
|---|---|---|
| Date block | 40 | Month `caption` `--slate-600` ("Nov"), day 2 below in `title-2` (20/26 800) `--navy-900`, tabular-nums, both centered. Repeated on every row, even within a month, so each row reads alone |
| Gap | 12 | |
| Node | 12 | On the spine (below). Status dot, see the table |
| Gap | 12 | |
| Text | flex | Title `row-title` `--navy-900`, up to 2 lines. Second line `caption` `--slate-600`: who it's for and the time ("All UC campuses, 11:59 p.m. Pacific"), "Date varies by campus", or "Your date" for a custom date. When the window isn't open yet: "Opens Dec 15" |
| Status | auto | Right-aligned: a `due` pill (00) "In 4 days", "Tomorrow" or "Today" when 14 days or less remain; "Open now" in `caption` 600 `--blue-700` when the window is open with more time left; nothing otherwise |

**The spine**: a 2 px `--border` vertical line through the center of the node column, running from the first row's node to the last row's node within each month. It breaks at month headers. It's what turns a list into a timeline.

**Node by status** (these reuse Stackd's status colors from 00; no new meanings):

| Status | Node |
|---|---|
| Due in 14 days or less | 12 px filled `--coral-500` dot |
| Window open, more than 14 days left | 12 px circle, 2.5 px `--blue-600` ring, `--surface` center |
| Not open yet or later | 12 px circle, 2 px `--slate-400` ring |
| Done | 16 px filled `--green-600` circle with white `Check` bold 10 (overflows the column by 2 on each side, like a completed step) |

**Add a date** (flag `customDeadlines`): tinted button "Add a date" with `Plus` bold 20, margins 16, 24 below the last month. Opens the custom date sheet.

**Done and past**: a collapsed group 24 below. Header row 44 tall: "Done and past ({n})" in `row-title` `--navy-900`, `CaretDown` bold 20 at the right, rotating 180° when open (200 ms). Inside: the same rows, dimmed (text `--slate-600`), done ones with the green node and "Done" as the status, missed ones with a `--slate-400` ring and "Closed Sep 30". Newest first.

**Source line**: 24 below, `caption` `--slate-600`, x 24, max 320: "Dates from UC Admissions, Cal State Apply and the California Student Aid Commission, checked Oct 16, 2026. Schools can change dates, so confirm on the official site." The names come from the shown records' `source_name`, and the date from the oldest `verified_at`. Then the unofficial footer line (00), 16 below.

### Date sheet

Bottom sheet (00), opened by any timeline row, the next-up card's buttons, or a notification.

| Part | Spec |
|---|---|
| Title | The date's title, `title-2` `--navy-900`. Focus starts here |
| Countdown line | 8 below: "45 days left" in `headline`, `--navy-900`, or `--coral-700` at 14 days or less. "Due today" / "Closed" / "Done Oct 20" as the state requires |
| When | 16 below, `body` `--slate-700`: "Monday, November 30, 2026, 11:59 p.m. Pacific". With a window: a second line "Open since October 1" or "Opens October 1" |
| What it is | 16 below, `body` `--navy-900`, the record's `summary`, max 2–3 short sentences |
| For | When the audience covers the student's schools: "For UC San Diego" or "For UC San Diego and UC Davis" in `body` `--slate-700` |
| Reminders | 24 below. Label "Remind me" in `headline`. Then choice rows (00 choice row, multiple choice): "1 week before", "3 days before", "1 day before", "The morning it's due". Defaults: 1 week and 1 day. Changes save as they're made, with no button. In the web app this block is one `body` `--slate-600` line instead: "Reminders work in the Stackd iPhone app." If iOS permission was denied: "Reminders are off for Stackd in your iPhone settings." with a text link "Open Settings" |
| Mark done | 24 below, tinted button "Mark done" (`Check`), or after marking, "Marked done" with `CheckCircle` fill 20 `--green-600` and a text link "Undo" beside it |
| Source | 16 below, `caption` `--slate-600`: "From UC Admissions, checked Oct 16, 2026." then a text link "Open official page" with `ArrowSquareOut` bold 16, opening `source_url` outside the app |

Custom dates show the same sheet with "Your date" under the title, the student's note as "What it is", no source line, and two text links at the bottom: "Edit" and "Delete date" (`--coral-700`, with a confirm step reading "Delete this date?" / "Delete" / "Keep it").

### Custom date sheet (flag `customDeadlines`)

For dates only the student knows: a counselor appointment, a scholarship, a campus's supplemental form.

- Title "Add a date" (or "Edit date"), `title-2`.
- Fields (00 text field): "What's due" (required, `autocapitalize="sentences"`), "Date" (`type="date"`, required, today or later), "Time" (`type="time"`, optional; without it, reminders fire at 9:00 a.m. and the row shows no time), "Note" (optional, up to 140 characters, with a live counter in `caption`).
- Reminder choice rows as in the date sheet.
- Primary button "Save date". Toast "Date saved". Validation on submit only, as in 06: "Add what's due." / "Pick a date."

## Reminders (flag `reminders`)

Reminders are **local notifications** scheduled on the iPhone itself (Capacitor Local Notifications). There's no push server: the app knows every date already, so it schedules them itself. This is the simplest version that works, and it needs no new backend.

### Permission flow

Never on launch. Only when the student asks for a reminder: tapping "Turn on reminders", "Remind me", or a reminder choice while iOS permission hasn't been asked yet.

1. **Soft ask**, a bottom sheet:
   - `husky-wave`, width 120, centered, `alt=""`.
   - Title, 16 below, centered: "Want a heads-up before deadlines?" `title-2`.
   - Body, 8 below, centered, max 280: "Stackd reminds you a week before and the day before each date you're tracking. You can change this anytime in Settings." `body` `--slate-600`.
   - Primary button "Turn on reminders", 24 below. Text link "Not now", centered, 12 below.
2. "Turn on reminders" shows iOS's own permission prompt.
   - Allowed: reminders are on for every tracked date at the default times; toast "Reminders on".
   - Denied: nothing else pops up. The date sheet's Reminders block shows the "Open Settings" line from then on.
3. "Not now" closes the sheet. The next soft ask can appear only after the student taps a reminder control again.

### What gets scheduled

- For each upcoming date that isn't done: one notification per chosen reminder, at **9:00 a.m. local time** on that day. "The morning it's due" is 9:00 a.m. on the due day.
- **At most one notification per day.** Dates that land on the same morning combine into one.
- iOS keeps only 64 scheduled notifications per app, so schedule the soonest 60 and top up each time the app opens.
- Reschedule everything when the app opens, when the plan or term changes, when a date is marked done or undone, and when dates change in the database.
- Signing out or deleting the account cancels every scheduled reminder.

### Notification copy

| When | Title | Body |
|---|---|---|
| 1 week before | UC application due in 7 days | Due Monday, Nov 30 at 11:59 p.m. Pacific. Open Stackd to see what's left. |
| 3 days before | UC application due in 3 days | Due Monday at 11:59 p.m. Pacific. |
| 1 day before | UC application due tomorrow | Due tomorrow at 11:59 p.m. Pacific. |
| The morning it's due | UC application due today | Due tonight at 11:59 p.m. Pacific. |
| Two or more on one morning | 2 deadlines tomorrow | UC application and Cal State Apply, both due at 11:59 p.m. Pacific. |

Calm and exact: no exclamation points, no "Don't miss out". Tapping a notification opens `/deadlines/?id={id}` with that date's sheet.

### Settings additions (11)

A new group, "Reminders", between "Your plan" and "Account", iPhone app only:

- **Deadline reminders**: settings row with a **switch** instead of a chevron. On means reminders for every tracked date; off cancels them all. If iOS permission is denied, the switch is off and disabled, and a `caption` line below the group reads "Turn on notifications for Stackd in your iPhone settings." with an "Open Settings" link.
- **Remind me**: row with the default choices as its value ("1 week and 1 day before"), opening a sheet with the same choice rows. It sets the default for dates the student hasn't customized.

And in "Your plan", a new row **Transfer term** ("Fall 2027"), opening the term chips sheet.

## States

| State | Deadlines screen |
|---|---|
| Loading (over 600 ms) | The loading component (00): "Loading deadlines" |
| Couldn't load | Inline error (00): "Couldn't load deadlines" / "Check your connection, then try again." / "Try again" |
| No plan | Shows UC, CSU and aid dates, with a card at the top: title "See only your dates", body "Pick your schools and Stackd shows just their deadlines.", tinted button "Set up your plan" (opens onboarding, `from=home`) |
| Every date done or past | In place of the next-up card, the empty state (00): `husky-celebrate` placeholder or `husky-wave`, title "You're all caught up", body "No more deadlines this cycle. We'll add fall 2028 dates when schools publish them." No button |
| Offline with saved data | Show the last loaded dates with a `caption` line under the term line: "Showing dates from your last visit." Reminders keep working; they're on the phone |

## Motion

- **Stack to screen**: tapping the Home stack spreads the peek layers (above), then the push transition (00) runs. On arrival, the next-up card is the same object as the top layer. Where supported, animate it as a shared element (320 ms `--ease-out`). Otherwise a plain push. Under reduced motion: crossfade only.
- **Mark done** (the screen's one celebratory moment, answering the student's tap): the node fills green with the check drawing in (the status icon animation from 03). The row's height collapses over 240 ms, and the "Done and past" count ticks up. If it was the next-up date, the card's content crossfades to the next date (200 ms) and the countdown number counts to its new value over 400 ms, so the student sees time come back. Light haptic on iOS.
- **Window bar**: never animates on load. It updates its position when the app returns to the foreground.
- No non-triggered motion on this screen; Home already has the husky.

## Accessibility

- Home's stack is one button with the full accessible name above. The visual layers are `aria-hidden`.
- Each timeline row is one button: "UC application, due Monday November 30 at 11:59 p.m. Pacific, in 45 days, window open." Done rows: "Cal State Apply, done."
- Month headers are `h2`. The countdown number is never the only place the date appears.
- The coral color is always paired with words ("In 4 days", "Today"), never alone.
- Choice chips and choice rows are radio buttons or checkboxes with labels, as in 10.
- Dynamic Type: at the largest sizes, the next-up card stacks its countdown above the text column instead of beside it.

## Copy rules for this feature

- Dates are always full and unambiguous where it matters: "Monday, November 30, 2026, 11:59 p.m. Pacific" in the sheet; shorter ("Due Monday, Nov 30") on cards.
- Say what to do, not what to feel: "Due tomorrow at 11:59 p.m. Pacific", never "Hurry!".
- Name things the way students do: "UC application", "Cal State Apply", "FAFSA or Dream Act". Official names appear in the summary and source line.
- When a date varies by campus, say so and point to the campus; never guess one.

## Additions to 00

| Addition | Value |
|---|---|
| Type `countdown` | 56 / 52, weight 900, tracking -0.03em, tabular-nums. Only for day counts |
| Color `--stack-2` | #F1F7FD, the second stack layer |
| Color `--stack-3` | #E6F0FA, the third stack layer |
| Component: choice chip | Height 44, padding 0 16, `--r-full`, `--surface`, 1 px `--border-strong`, `label` `--navy-900`. Chosen: `--blue-50` fill, 1 px `--blue-50-border`, text `--blue-700`, with `Check` bold 16 before the label. 8 gap between chips |
| Component: switch | 51 × 31, `--r-full`. Off: `--slate-400` track. On: `--blue-600` track. Knob 27, `--white`, `--shadow-float`, slides 20 over 200 ms `--ease-out`. `role="switch"`, `aria-checked`. Disabled: opacity 0.4 |
| Component: window bar | As described under The stack |
| Component: timeline row and spine | As described under Timeline |

## Building it (two developers)

| Part | Who | Notes |
|---|---|---|
| Tables, row-level security, the import file for the first dates with sources, and the verify step | Abyan | Same import pipeline as institutions; dates stay hidden until verified |
| Reminder scheduling (Local Notifications plugin, the permission flow's logic, rescheduling rules), Settings switch wiring | Abyan | Needs a real iPhone build to test; the plugin works in the existing Capacitor project |
| Home Up next, the Deadlines screen, the sheets, the term question, the new 00 components | Ryan | Can be built on Windows in the web app with `NEXT_PUBLIC_FEATURES=all` |
| Custom dates | Either, after the rest | Flag `customDeadlines` stays off until it's done |

## Test

- With the Las Positas → UC San Diego plan and term Fall 2027: Home's stack shows the UC application on top with the right day count, Cal State Apply is absent (no CSU target), and the FAFSA date is in the stack or timeline.
- Add a CSU target: Cal State Apply appears.
- At 14 days or less, the countdown, the window bar and the row's pill turn coral, and the pill says "In 14 days", then "Tomorrow", then "Today".
- On the due day, the top layer shows "Today / due tonight".
- Mark the UC application done: the node turns green, the row moves to "Done and past", the next-up card moves to the next date with the number counting, and "Undo" puts everything back.
- Tap "Remind me" on a fresh install: the soft ask appears, then iOS's prompt. Allow: reminders for 7 days and 1 day before are scheduled at 9:00 a.m. Deny: the sheet shows "Open Settings".
- Two dates due the same day produce one combined notification, not two.
- Tap a notification: the app opens the Deadlines screen with that date's sheet.
- Sign out: no reminders remain scheduled.
- Term "Fall 2028": only fall 2028 dates show (or the "nothing upcoming" line until they're imported).
- No plan: the stack shows UC, CSU and aid dates with the "Set up your plan" note.
- Web app: no reminders card, and the sheet's Reminders block says they work in the iPhone app.
- Every shown date has a source line and an "Open official page" link, and no unverified date appears anywhere.
- VoiceOver reads the stack as one button with the next three dates, and each row with its full date and status.
- At 320 wide: the countdown block keeps 72, titles wrap to 2 lines, and the peek layers' titles truncate with an ellipsis.

One line on what makes this Stackd's and no one else's: the deadlines arrive as a literal stack, the next one on top, counting down in the same heavy type as "Hi, Ryan!", with the window bar showing how much of the filing period is already gone.
