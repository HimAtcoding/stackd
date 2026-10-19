# 16 · Color pass

Release: v1.2 (or v1.1 build 3, if it lands before 1.1 is submitted). Changes the look of Home's Up next and Get ready, the steps sheet, and the Deadlines header. Adds section colors that later features use. Behavior and data don't change: no new tables, no changes to verified rows.

## Why

The v1.1 build on a real phone (Oct 18): every screen is blue, white and navy. Color only comes from status, and a new student has no status yet (nothing done, nothing urgent), so they see none. The steps sheet, an empty pale ring over six grey circles, is the flattest screen in the app.

This pass adds color that means something: the one thing that matters on Home becomes solid blue, each step gets its own icon and color, finishing a step gets a small reward, and each feature gets its own hue so pages feel different while clearly belonging together.

## Design plan

**Tokens.** Adds three colors. Everything else is already in 00.

| Name | Value | Role |
|---|---|---|
| `--blue-600` | #0364FA | Hero fill (existing) |
| `--coral-700` | #B8361B | Hero fill at 14 days or less (existing) |
| `--yellow-400` | #FDC940 | Today marker on the hero, step burst (existing) |
| `--indigo-600` | #4F55E0 (new) | Essays section color, writing step icon |
| `--amber-700` | #A86A00 (new) | Activities step icon |
| `--mint-600` | #12946A (new) | Explore section color later; courses icon |

Contrast (checked): white on `--blue-600` 4.99:1, white on `--coral-700` 5.86:1, so 13 px captions pass on both. Icon colors on their tints: indigo 4.86, amber 3.95, mint 3.25, blue 4.43 (icons are decorative; the step text carries the meaning). The yellow today marker on blue is 3.23:1, above the 3:1 for graphics.

**Layout.** Unchanged from 15, except the Deadlines screen: its header, next line and year bar move into one solid panel (5). Elsewhere only fills, icons and the outside-link rows change.

**Hierarchy.** Home: the countdown, now a solid blue block. It was already the hero; now it looks like one.

**Self-check.** Would this fit any student app? A solid hero card is common. What makes it Stackd's: the yellow today marker on the application window, icons that map to the actual UC application sections, and colors that follow the student's real status (blue while open, coral when close, green when done).

## Mobbin references

| Screen | What it grounds |
|---|---|
| [Jomo home](https://mobbin.com/screens/489f1028-efa5-4e59-a832-d02a12350d77) | One big white number on a saturated blue field as the screen's anchor, everything else light |
| [Headway mission](https://mobbin.com/screens/8f13500b-a3b3-4b19-902b-0c855a837370) | Each step has its own colored icon; done steps get a green check |
| [Google Photos unlock](https://mobbin.com/screens/611d7197-775e-4e6c-a9bf-5ce38663a037) | A short burst of color when progress happens, not before |
| [Me+ widgets](https://mobbin.com/screens/0cdeb663-a2b8-421b-8f91-9923ec5776e5) | Each section of an app has its own color while sharing one style |

## 1. Up next hero (Home)

The stack's top layer (14 → The stack, 15 → Up next):

| State | Fill | Text | Window bar | Shadow |
|---|---|---|---|---|
| More than 14 days | `--blue-600` | All white: number, "days left", title, due line, labels | Track `rgba(255,255,255,.28)`, fill `--white`, today marker 2 × 14 `--yellow-400` | `0 10px 24px rgba(3,100,250,.30)` |
| 14 days or less | `--coral-700` | All white | Same, on coral | `0 10px 24px rgba(184,54,27,.30)` |
| Due today | `--coral-700` | "Today" and "Due today" in white | Same | Same |
| Pressed | `--blue-700` (or #9C2D16 on coral) | | | |
| No plan yet (15) | Unchanged: `--surface`, 1 px `--border`, 36 number in navy. The setup button is the blue thing there | | | |

- "days left" and the window labels stay regular weight. They're white at full opacity (not faded), so they pass contrast.
- Peek layers don't change. Against the blue top they now read clearly as "more behind this".
- Focus ring on the hero: 2 px `--white` outline with a 2 px `--blue-600` ring outside it, so it shows on blue.
- The Deadlines screen opens with a panel in the same colors (5).

## 2. Step icons

Each checklist step gets an icon tile. The tile **is** the check control: it replaces the status circle on Home's Get ready list and in the steps sheet. One element per row instead of two.

Icons come from a map in code keyed by the step's `slug` (`lib/step-icons.ts`), so the database and verified rows don't change. A step not in the map uses `CheckSquare` on `--tint-sky`.

| Step (UC and Cal State Apply) | Icon (Phosphor, duotone) | Tile | Icon color |
|---|---|---|---|
| Pick your campuses and majors | `MapPinLine` | `--tint-sky` | `--blue-600` |
| Enter your courses and grades | `BookOpenText` | `--mint-100` | `--mint-600` |
| Write your personal insight answers | `PencilLine` | `--tint-indigo` | `--indigo-600` |
| Add activities and awards | `Trophy` | `--amber-50` | `--amber-700` |
| Check for extra campus steps (CSU) | `ListChecks` | `--tint-indigo` | `--indigo-600` |
| Pay the fee or ask for a waiver | `Receipt` | `--tint-sky` | `--blue-600` |
| Submit by Nov 30 | `PaperPlaneTilt` | `--blue-600` (solid) | `--white` |

The submit step is the only solid tile: it's the goal.

| Part | Spec |
|---|---|
| Tile | 36 × 36, `--r-sm` (12), icon 20 duotone, centered. In the steps sheet: 40 × 40, icon 22 |
| Done | Tile becomes `--green-600` with a white `Check` bold 18 (20 in the sheet). The step text stays `--navy-900` on Home (it's still useful) and turns `--slate-600` in the sheet |
| Hit area | 44 × 44 around the tile. `role="checkbox"`, `aria-checked`, `aria-label` = the step title. The row text still opens the sheet (14) |
| Row | Tile at the row's left padding, 12 gap, then the step text. Row min height 56 |

## 3. Small rewards

**Checking a step**: the tile swaps to green over 160 ms (`scale` 0.9 → 1, `--ease-out`). At the same moment, six short `--yellow-400` dashes (3 × 8, radius 2) burst outward from the tile's center to 28 px and fade, over 360 ms. The matching segment of Get ready's bar fills green (200 ms, as 15). Toast "Marked complete" with "Undo", as now.

**Unchecking** (or Undo): instant swap back, no burst.

**All steps done**: after the last tile's burst finishes, open the task-complete screen (05) once per checklist per device:

| Element | Text |
|---|---|
| Subhead | "Your UC application is ready!" (or "Your Cal State Apply is ready!") |
| Chip | "One step closer to transfer" (as 05) |
| Button | "Keep going", closes it |
| Link | "Open the UC application" (or "Open Cal State Apply"), opens the official site outside the app |

Headline stays "Great job!". Reduced motion: no burst, no scale, the celebration's entrance follows 05's reduced-motion rule.

## 4. Steps sheet

Replaces the sheet's empty ring (14 → Steps sheet):

- Under the title, the same segmented bar as Home's Get ready (one segment per step), full sheet width, 12 below the title. Under it, 6 below: "{done} of {total} done, due by Nov 30" in `body` `--slate-600`.
- Rows use the step tiles (above) at 40.
- "Open the UC application" (or "Open Cal State Apply") is an outside-link row (6), 24 below the last step, with the source line 12 under it. It leaves the app, so it isn't styled as the main action.

## 5. Feature panels

Each feature's main screen opens with a solid panel in its color, holding that feature's progress. Deadlines: blue (coral at 14 days or less), with the year bar. Essays: indigo, with its 4-answer bar. Explore and Events get theirs in their specs.

### Deadlines panel (as built)

The screen's top, from the physical top down, the full screen width. It continues Home's hero (1).

| Part | Spec |
|---|---|
| Fill | `--blue-600`. `--coral-700` when the next date is 14 days or less away, by the same rule as Home's hero. No band of any other color |
| Shape | Bottom corners rounded 28; straight top. No shadow |
| Back button | `--surface` circle with the navy arrow, as everywhere, at the usual place |
| Title | "Deadlines", `title-1`, white, 24 below the back button |
| Term line | "Fall 2027 transfer" in `body` white, 4 below the title, then 8 gap and "Change" as a white, underlined text link (`label`, 44 hit area). It opens the term sheet, as before |
| Next line | 24 below the term line: "{title} is next" in `headline` white, then 4 below the due line ("Due Monday, Nov 30, in 42 days.") in `body` white |
| Cycle bar | 16 below the due line, styled like Home's window bar: track `rgba(255,255,255,.28)`, fill `--white`, today marker 2 × 16 `--yellow-400`. Nodes: 14 days or less, a filled white 12 px dot; open, a 2.5 px white ring with the panel's color inside; not open yet, a 2 px white ring at 60% opacity with the panel's color inside. Two dates on one day share a node. Labels ("Oct 2026", "Jun 2027") `caption` white |
| End | 24 below the cycle bar's labels |
| Before a term is chosen | The term question card (14) sits inside the panel as a `--surface` card where the next line would be, 24 below the title. The term line, next line and cycle bar appear once it's answered. The panel ends 24 below the card |
| No upcoming date | The panel ends 24 below the term line, blue; the empty state sits below it on the sky page |
| Focus | Outlines on the panel's own controls (back button, "Change") are white |

Below the panel, on the `--sky-50` page: the no-plan card and the reminders card when they show (24 apart), then the timeline. The timeline's first month header has 24 above it, so the timeline starts 24 below the panel.

## 6. Outside-link row

For a link that leaves Stackd: "Open the UC application" and "Open Cal State Apply" in the steps sheet, and "Open the official page" in the date sheet (it replaces 14's "Open official page" text link).

| Part | Spec |
|---|---|
| Container | Tier 2 (15): `--surface`, 1 px `--border`, `--r-md`, no shadow. Min height 64, padding 0 16. The whole row is the link. Pressed: `--surface-pressed` |
| Tile | Left, 36 × 36, `--r-sm`, `--tint-sky`, `Globe` regular 20 `--blue-600`. 12 gap to the text |
| Title | `row-title` `--navy-900`: "Open the UC application", "Open Cal State Apply", "Open the official page" |
| Domain | 2 below the title, the site's domain in `caption` `--slate-600`, one line, ellipsis ("apply.universityofcalifornia.edu"). A leading "www." is left off ("calstate.edu") |
| Arrow | Right, `ArrowSquareOut` regular 20 `--slate-600` |
| Name | The title plus ", opens outside the app" ("Open the UC application, opens outside the app") |

In the date sheet the row sits 12 under the source line; in the steps sheet, 24 under the last step with the source line 12 under it.

## Not in this pass

The husky reacting to the student's state (waving with no plan, alert at 14 days, celebrating when done) needs new art first: `husky-wave`, `husky-alert`, `husky-celebrate` at the current Home size. When the art exists, a small spec swaps it in by state.

## Additions to 00

| Addition | Value |
|---|---|
| `--indigo-600` | #4F55E0 |
| `--amber-700` | #A86A00 |
| `--mint-600` | #12946A |
| Component: step tile | As in 2 |
| Component: feature panel | As in 5 (Deadlines as built; Essays in 17) |
| Component: outside-link row | As in 6 |
| Motion: step burst | As in 3 |

## Test

- Home with a plan, 43 days out: the Up next top layer is solid blue with a white 43, white text, a white filled bar and a yellow today marker. The peek layers behind it are pale.
- Set the device clock to Nov 20: the top layer is coral with white text. Nov 30: "Today" and "Due today" on coral.
- Home with no plan: the stack stays pale with a border; the setup button is the only blue block.
- Get ready rows show a map pin and a book on their tints; no separate circles.
- Tap the map pin tile: it turns green with a white check, yellow dashes burst and fade, the first bar segment fills green, the toast shows. Undo: it swaps back with no burst.
- Check all six (in the sheet): after the sixth, the celebration opens with "Your UC application is ready!". Close it, uncheck one and check it again: no second celebration.
- The steps sheet shows the segmented bar and "1 of 6 done, due by Nov 30" instead of the ring.
- Deadlines: a solid blue panel with 28 bottom corners holds the white title, term line, "UC application is next", the due line and the white year bar with its yellow today marker. The back button is a white circle on it. The timeline starts 24 below it on the sky page.
- Set the device clock to Nov 20: the Deadlines panel is coral, and the Nov 30 node on its bar is a filled white dot.
- The steps sheet ends with an "Open the UC application" row showing a globe tile and "apply.universityofcalifornia.edu"; the date sheet has an "Open the official page" row. Both open the site outside the app, and their names end with ", opens outside the app".
- Focus: tabbing to the hero shows a white-and-blue ring.
- Reduced motion: no burst, no scale; colors still change.
- At 320 wide: step text wraps to 2 lines beside the tile; nothing overlaps.
