# 24 · Plan

Status: rev 1 (November 2026). Adds a Plan tab where a student builds, sees and changes a term-by-term plan to transfer: their major's courses for UC and Cal State plus Cal-GETC general education, in order, within the units they can take, with the reason for each placement. Uses `00` rev 2 for every look. Behind a new `plan` flag.

## Why

The 1.4 test: Stackd shows information but gives a student little to do. Students come back to plan their next term, so the plan is the core loop: build it once, move things around, mark courses done, and come back every registration window. Transfermatic generates a plan but doesn't let you move it; Stackd lets the student own it and explains each choice.

## Design plan

**Tokens.** From `00` rev 2: `--blue-600` for actions and the current term, `--green-600`/`--green-700` for done and "Counts for UC and Cal State", `--yellow-400` for units progress on the hero, `--coral-700` for warnings, `--navy-900` text, white page. Nunito; course codes in `type-code` (real course codes, the one place mono belongs). Spacing as `00`.

**Layout.** One column, left-aligned, 16 gutters. A blue hero at the top, then terms as stacked sections in date order, each with its course cards. On a phone a vertical stack beats side-by-side columns: every card stays full width and readable, and one thumb reaches everything.

```
+--------------------------------+
| Your plan                      |
| Las Positas College to         |
| UC San Diego, fall 2027        |
| +----------------------------+ |
| | 31 of 60 units             | |  hero: blue, edge
| | [=====honey=======-----]   | |
| | 9 courses left, 2 terms    | |
| | [Build my plan]            | |
| +----------------------------+ |
| Already done (5)           v   |
|                                |
| Fall 2026  now      15 units   |  current term: blue label
| +----------------------------+ |
| |= CS 2   Data structures 4 u| |  card: drag handle, code,
| |  Counts for UC and Cal State| |  name, units
| +----------------------------+ |
| +----------------------------+ |
| |= MATH 3 Multivariable   5 u| |
| |  Take Calculus 2 first     | |  warning in coral
| +----------------------------+ |
| Spring 2027         12 units   |
|  ...                           |
| Not in a term yet (2)          |
| [Home Plan Explore Essays You] |
+--------------------------------+
```

**Hierarchy.** The current term's courses. The hero sets context; the term the student is registering for is what they act on.

**Self-check.** "Would I make this plan for any student app?" A generic course planner, yes. What makes it Stackd: it plans for UC and Cal State at once and puts courses that count for both first; it counts units toward the 60 a transfer needs and stops at the transfer term from the student's own plan; every placement says why ("Needed before Data structures"); and done marks are the same ones Explore uses, so the student never marks a course twice. Changed from the first idea of side-by-side term columns to a vertical stack, because columns don't fit a phone one-handed.

## 1. The Plan tab

The tab bar gains **Plan** between Home and Explore: Home, Plan, Explore, Essays, You (only with `plan` on). Icon `ListChecks`. Five equal tabs fit at 320 (57 wide each).

| Part | Spec |
|---|---|
| Title | "Your plan" `title-1`, then the route line `body` `--slate-600`: "{college} to {first school}, {term}" with `text-wrap: balance` |
| Hero | `--blue-600` hero (`00`), passive. "{done} of 60 units" `title-2` white; a progress bar on the hero (track `--blue-700`, fill `--yellow-400`). Units done are the number the student entered in plan settings (6) when set, otherwise the sum of done items in the plan; 60 is the transferable units a transfer needs. Then "{n} courses left, {t} terms" `label` |
| Hero button | Empty plan: primary button on the hero (white fill, `--blue-600` label) "Build my plan". After a plan exists: "Rebuild plan", a secondary-style white button, which asks first (sheet: "Rebuild your plan? Done, taking now and courses you placed yourself stay where they are. Everything else is placed again." Buttons "Rebuild" and "Keep my plan") |
| Already done | A collapsed row "Already done ({n})" with `CaretDown`; open, it lists done items as plain rows (no edge, no drag) with a green status icon |
| Term sections | One per term from the current term to the term before the transfer term, fall and spring always, summer only if the student turns summers on. Header row: term name `title-3` ("Fall 2026"), a "Now" pill (`good`) on the current term, and "{units} units" `label` `--slate-600` at the right, `--coral-700` with "{units} units, over your limit" when over. An empty term says "Nothing here yet. Drag a course in or tap Move on one." `body` `--slate-600` |
| Not in a term yet | Last section: items the builder couldn't fit or the student moved out |
| Settings link | Under the hero, a text button "Units and terms" opening the plan settings sheet (6) |

## 2. Course card

A tappable card (`00`: white, 2 px `--border`, `--r-lg`, `--edge-md`), padding 12 14, min height 64.

| Part | Spec |
|---|---|
| Drag handle | Left, `DotsSixVertical` bold 20 `--slate-400` in a 44 tap area. Long press (300 ms) anywhere on the card also picks it up |
| Line 1 | The student's course code in `type-code` `--navy-900` when known ("CS 2"), then the name `row-title` ("Data structures"). No code: the name only |
| Units | Right, "{n} u" `label` `--slate-600`; spoken "4 units" |
| Line 2, one of | A warning in `--coral-700` with `WarningCircle` fill 16 (section 4); otherwise "Counts for UC and Cal State" `caption` `--green-700` when it does; otherwise the GE area ("Cal-GETC Area 4") or "UC only" / "Cal State only" `caption` `--slate-600` |
| Status | Taking now: a 3 px `--blue-600` ring on the left edge of the card and "Taking now" `caption` `--blue-600` at the right of line 2. Done items leave the term list for Already done |
| Tap | Opens the course sheet (3) |

**Dragging.** Pick up: the card lifts (scale 1.02, the edge grows to 6 px), others make room as it moves (200 ms). Drop on a term section or Not in a term yet; the term's unit total and every warning update at once, then it saves. Under reduced motion, no lift or animated reflow, just the move. The list scrolls when the card nears the top or bottom edge. Uses `@dnd-kit` with its touch and keyboard sensors (pick up with Space, move with arrows, drop with Space; announced through a live region: "Data structures, moved to Spring 2027").

**Move without dragging.** Every card's sheet has "Move to…" (3), so the whole plan works one-handed and with VoiceOver.

## 3. Course sheet

Bottom sheet (`00`), opened by tapping a card.

| Part | Spec |
|---|---|
| Title | The name `title-3`, the code under it in `type-code` |
| Why it's here | `headline` "Why it's here", then 1 to 3 short reasons from the builder: "Counts for UC and Cal State", "Needed before Data structures", "Cal-GETC Area 2 (math)", "Fits your 15 units in Spring 2027", "You moved it here" |
| Your course | `headline` "Your course at {college}". If the college has verified courses for this requirement (Data → `college_courses`), a list of choice rows with code, name and units; else a text field "Course code, like MATH 1" and a units field. Saving updates the card |
| Status | The `00` segmented control: Not yet, Taking now, Done. Same truth as Explore (`user_topic_status`) for major courses; Done moves the card to Already done with the step burst |
| Move to… | A secondary button opening a list of terms plus Not in a term yet; picking one moves the card and closes both sheets with toast "Moved to Spring 2027" + Undo |
| Remove from plan | Only for custom courses (5): a text button in `--coral-700`, with Undo in the toast |

## 4. Warnings

Computed live from the plan, never stored. Each shows on the card it's about (line 2) and is counted in a quiet line under the hero: "2 things to check" `label` `--coral-700`, which scrolls to the first.

| Warning | Rule | Text |
|---|---|---|
| Order | A course is in the same or an earlier term than one that comes before it (Data → `topic_order`) | "Take {before} first ({its term})" or, when the earlier course isn't placed, "Take {before} first" |
| Over your limit | A term's units exceed the student's limit | On the term header (1); no card warning |
| Over 18 | A term over 18 units | Term header: "{n} units. Most colleges need approval above 18" |
| Doesn't fit | Items left in Not in a term yet after a build | Under the hero: "{n} courses don't fit before fall 2027. Add a summer or raise your units" with the two as text buttons |

Warnings are advice: nothing is blocked, and the student can leave a plan with warnings.

**Prerequisites outside the plan.** When a course's prerequisite (`topic_order`) isn't in the student's plan, because their major doesn't need it, and isn't done, the builder doesn't hold the course back and returns the pair (5). The card shows a quiet note on line 2, not a warning: "Needs {name} first, or placement" `caption` `--slate-600`. It isn't counted in "things to check".

## 5. Build my plan

Pure function in `lib/plan/build.ts`, tested on its own. Inputs: the student's still-needed major topics for their systems (from the Explore pathways, minus done), the Cal-GETC areas not yet filled, their terms, unit limit, summers on or off, items they placed themselves (kept), and `topic_order`.

1. Taking now items go in the current term.
2. Sort the rest: courses that count for both UC and Cal State first, then the rest of the major (the student's own systems only), then GE areas. Within a group, by `topic_order` depth (earlier courses first), then by the pathway's `sort`.
3. Fill terms in date order. A course goes in the first term where everything before it is done, taking now, or in an earlier term, and the term has room under the unit limit. Each placement records its reasons for the sheet.
4. Anything that doesn't fit goes to Not in a term yet, and the hero shows the Doesn't fit warning. A prerequisite that isn't in the plan and isn't done doesn't hold a course back; the builder returns those pairs for the card's note (4).
5. Units: the student's course units when chosen; otherwise the pathway row's units; otherwise 3 for a GE area and 4 for a major course, shown as "about 4 u" until the student picks their course.

"Rebuild plan" runs the same function on everything that isn't done, taking now, or placed by the student. A rebuild after changing major or schools in Settings is the "what if": the plan changes in front of them, and what's done stays done.

Custom courses: "Add a course" (a secondary button at the bottom of each term) adds a course the student types (code, name, units). It counts toward units, never toward requirements, and the builder leaves it where it is.

## 6. Plan settings sheet

Opened from "Units and terms". Saves on change.

| Setting | Control | Default |
|---|---|---|
| Units per term | Segmented control: Part time (9), Full time (15), Custom (a stepper 3 to 21) | Full time |
| Summers | Switch "Include summer terms" | Off |
| First term | Read-only: the current term | From today's date: Jan to May is spring, Jun to Jul summer, Aug to Dec fall |
| Units finished so far | Number field "Transferable units you've finished", optional, with the hint "Check your transcript. Leave empty to count the courses marked done here." | Empty |
| GE pattern | Read-only "Cal-GETC". A line under it: "Started college before fall 2025? You may be able to use IGETC or CSU GE instead. Ask your counselor." | Cal-GETC |

## 7. Rating prompt

After the first successful "Build my plan", and after the 3rd course marked done on a later day, ask iOS to show Apple's rating prompt (`SKStoreReviewController` through a small maintained Capacitor plugin, or a few lines of native code if none is maintained). Apple decides whether it appears and limits it to 3 a year. Never a custom "rate us" screen, never a reward, never only after asking whether they like the app. Not on the web.

## Data

### New tables

| Table | Columns | Notes |
|---|---|---|
| `plan_settings` | `user_id` (pk), `units_per_term int` (3–21), `include_summer bool`, `units_done numeric(4,1)` (nullable), `updated_at` | Owner-only row-level security |
| `plan_items` | `id`, `user_id`, `kind` (`major`, `ge`, `custom`), `topic text` (major, matches `pathway_requirements.topic`), `ge_area text` (ge), `term text` (`fall-2026`, `spring-2027`, `summer-2027`, or null for Not in a term yet), `position int`, `placed_by` (`builder` or `student`), `college_course_id` (nullable), `course_code text`, `course_name text`, `units numeric(3,1)`, `status progress_status` (ge and custom only; major status lives in `user_topic_status`), `updated_at` | Owner-only row-level security; `unique (user_id, topic)` where `kind = 'major'`, `unique (user_id, ge_area)` where `kind = 'ge'`; deleted by `delete_my_account()` |
| `topic_order` | `topic`, `before_topic`, provenance columns | `before_topic` is the prerequisite: `{ topic: cs2, before_topic: cs1 }` means take `cs1` first. Stackd data: "usual order", e.g. `cs1` before `cs2`, `calculus-single` (term 1) before term 2. Verified like every row; readable only when verified. Written from college catalogs' prerequisites, starting with Las Positas |
| `ge_areas` | `pattern` (`cal-getc`), `code` (`1A` …), `name`, `courses int`, `units numeric`, `sort`, provenance columns | From the official Cal-GETC standards; verified |
| `college_courses` | `id`, `institution_id`, `code`, `title`, `units`, `c_id text` (nullable), `topics text[]`, `academic_year`, provenance columns | Each college's own catalog, Las Positas first. Verified rows only. A course shows for a requirement only through `topics`, which a person sets and checks. For UC, the sheet says "Matches this course type at your college", never "counts for" a campus, until ASSIST or the campus confirms it (`15 → Course data track E`) |

### Data files

- `data/raw/planning/topic-order.json`: pairs with source and year. Written by a person from Las Positas's catalog prerequisites for the 9 majors' topics; checked like everything else.
- `data/raw/planning/cal-getc.json`: the Cal-GETC areas with courses and units, from the official standards (link and year in each row).
- `data/raw/planning/college-courses-las-positas.json`: Las Positas courses for the 9 majors' topics, from LPC's current catalog (code, title, units, C-ID when printed, topics), each with the catalog page as source.
- All three go through the existing import, review report, check and verify steps. Nothing shows until verified; until then the builder uses pathway units and the typed course.

### Sync

- Marking a major course done or taking now anywhere (Plan, Explore, a requirement sheet) writes `user_topic_status`, and Plan reads it, so the two can't disagree.
- Plan reads through the same cache PR #40 added; moves save after the screen updates (instant), with the toast's Undo restoring the previous term and position.

## Flag and release

`plan` flag, off in release until the three data files are verified for Las Positas and Computer Science at least. With `plan` off, nothing in this spec shows and the tab bar is unchanged.

## Mobbin references

Standing rule (21): two per screen, iOS first, saved to `docs/refs/24-plan/` (git-ignored), compared after building, never used to change the design. Look for: a semester or course planner, a drag-to-reorder list on iOS (Things, Todoist, Notion boards), and a bottom sheet with a reason list.

## Not in this spec

- A shareable route card, the home screen widget, TAG checker: their own specs.
- Class sections, times, professors: no data yet.
- Courses at other colleges through CVC.
- Counselor sharing of the plan.

## Test

At 393 × 852 and 320 × 568, light mode, with a test student (Las Positas, UC San Diego CS and SJSU CS, fall 2027 transfer):

1. Plan tab shows with `plan` on and not with it off; the tab bar fits five tabs at 320.
2. "Build my plan" on an empty plan fills Fall 2026 (taking now items) and Spring 2027 within 15 units, courses that count for both first, and no order warnings; the rest goes to Not in a term yet with the Doesn't fit line. Turning summers on and rebuilding uses Summer 2027.
3. Each placed card's sheet lists at least one true reason.
4. Dragging a card to another term updates both unit totals and saves; reload keeps it. Dragging Data structures above Intro to programming shows the order warning on Data structures, and moving it back clears it.
5. "Move to…" does the same without dragging, with Undo.
6. Keyboard: pick up, move and drop with Space and arrows, with the live-region announcement. VoiceOver reads card, units and warning.
7. Marking a course done in Plan shows done in Explore, and the other way round.
8. Rebuild keeps done, taking now and student-placed items after the confirm sheet.
9. Over-limit and over-18 headers show at 16 and 19 units.
10. A custom course counts toward units and never toward requirements.
11. Another student can't read `plan_items` or `plan_settings` (test:db); delete account removes them.
12. `npm test`, `test:import`, `test:db`, lint and build pass. The builder has unit tests for order, unit limits, summers, kept items and the Doesn't fit case.
