# 23 · Chunky reskin

Status: rev 1 (November 2026). Applies `00-foundations.md` rev 2 ("Chunky and playful") to every screen that's built. Source: the design board "Stackd design directions", row A (A: Home, A: Explore, A: Opportunities), picked by Ryan over "Trail map" and "Bold numbers".

## Why

The app looked generic: pale sky-blue tinted buttons, pale icon tiles, soft shadows on every card, the same white rows everywhere. That look came from rev 1 of `00`, not from any one screen, so the fix is in `00` and reaches every screen through the shared tokens and components. This spec says what each screen does with them, and the few places where the board changes a layout.

## Design plan

**Tokens.** Blue #1E5EFF (taps, you), honey #FFC226 (progress, reward), green #22A565 / #178049 (done, Explore), navy #10194A (text), border #E5E8F0 (lines and white edges), white page. Nunito 600–900 for everything; `type-code` stays mono for course codes. Spacing unchanged (4, 8, 12, 16, 20, 24, 32, 40, 48).

**Layout.** Unchanged from the screen specs except the three board changes below. Left-aligned, 16 gutters, one hero at the top of each tab screen.

```
+--------------------------------+
| stackd                         |
| Hi, Sam!              [husky]  |
| Las Positas to UC San Diego    |
| +----------------------------+ |
| | Up next                    | |  hero: solid blue,
| | 22  days left              | |  6 px edge
| | [=====honey=====------]    | |
| | [Keep going]               | |
| +----------------------------+ |
|  Your application   2 of 6 done|
|  (v) Pick campuses             |
|   |                            |  step path
|  (v) Enter courses             |
|   |                            |
|  (O) Write your 4 answers      |
| +----------------------------+ |
| | Home  Explore  Essays  You | |  tab bar: edge, solid
| +----------------------------+ |  blue active pill
+--------------------------------+
```

**Hierarchy.** The hero (days left, or courses still needed on Explore) is the single most important thing on each tab screen. It's the only solid color block; everything else is white.

**Self-check.** "Would I make this for any student app?" A chunky Duolingo-style skin alone, yes. What makes it Stackd: the edge only marks things you can tap, so the app's actions stand out from its facts; green only ever means a course or step is done; the hero number is a real deadline or a real count of required courses; the step path is the actual application sequence; and the husky, who carries the map, leads each tab.

## What changes everywhere

Everything in `00` rev 2 applies on every screen with no screen-by-screen work:

1. Nunito replaces Figtree at the new weights.
2. The palette: new blue, honey, green, navy, `--border`, white page. The removed tokens (`00 → Removed in rev 2`) are deleted from the code, not left unused.
3. Edges replace soft shadows. Anything tappable gets its edge and sinks on press; passive containers go flat with a 2 px border.
4. Every tinted button becomes a secondary button. Every pale icon tile becomes a solid icon circle.
5. Primary buttons go from pill to `--r-md` and lose their chevron.
6. The tab bar becomes the rev 2 capsule with the solid blue active pill.
7. Icons go to bold at rest, fill when active or inside a circle.

## Screen by screen

| Screen | Spec | What changes beyond the shared parts |
|---|---|---|
| Welcome | 01 | Type only. The scene and its art backdrop stay as built. "Get started" is the rev 2 primary button |
| Sign in, create account, forgot password, enter code | 06–09 | Fields 52 tall with 2 px borders, social buttons with edges, code boxes `--r-md` |
| Onboarding | 10 | Choice rows sit in a list container; choice circle 26 |
| Home | 02, 15, 16 | **Board change 1:** the hero is the board's (see below). **Board change 2:** the application checklist is the step path (00). Shortcut tiles use icon circles |
| Deadlines | 14, 15, 16, 18 | The panel is a hero (blue, coral at 14 days or less) with `--edge-lg`. Date tiles are the rev 2 date tile. Mark done is the compact button. No tinted band |
| University requirements | 03 | Requirement rows with rev 2 status tiles. The reminder banner is `--yellow-50` |
| Essays | 17, 19, 20 | Essays hero is `--indigo-600` with `--indigo-800` edge where 16 gave Essays a panel. Answer cards are tappable cards. The editor keeps its quiet white page |
| Explore hub | 21, 22 | **Board change 3:** the major panel is a `--green-700` hero (see below). Still needed and Opportunities for you per the board |
| Major page | 21 | Hero in `--green-700`. Requirement rows rev 2. The source block keeps its words |
| Opportunities feed | 22 | Filter chips. Each opportunity is a tappable card (below) |
| Opportunity page | 22 | The top icon circle uses the kind's color. The primary button keeps its label, Open the official page |
| Celebration | 05 | Type and button only. Confetti and husky unchanged |
| Settings, legal, support | 11, 12 | Settings rows in a list container with 2 px borders |

### Home hero (board change 1)

`--blue-600` hero, `--edge-lg` `--blue-700`, padding 18 18 20.
- "Up next" `label` white at 90%.
- 12 below: the day count in `hero-number` and, 10 to its right and bottom-aligned, "days left" `headline` with the item and date under it in `label` ("UC application, due Nov 30").
- 12 below: a progress bar on the hero (track `--blue-700`, fill `--yellow-400`) showing how much of the window has passed, as 15's window bar.
- 12 below: "Keep going", a primary button hugging its label, white fill, `--blue-600` label, `--blue-700` edge.
- At 14 days or less the hero is `--coral-700` with `--coral-800` edge and the bar fill stays honey.

The greeting above it: "stackd" `label` `--blue-600`, "Hi, {first name}!" `title-1`, the route line ("Las Positas to UC San Diego") `body` `--slate-600`, with Home's existing husky art at the right, about 132 wide, its feet overlapping the hero's top edge by 18 (sizes in `art-assets.md`).

### Explore hero (board change 3)

`--green-700` hero, `--edge-lg` `--green-800`, padding 18. "Your major" `label`, the major name `title-2` (max width 200 so it clears the husky), a segmented bar on the hero (done white, taking now honey, not yet `--green-800`), then "{done} of {total} done for UC, {n} taking now" `label`. `husky-looking` 128 × 127 bottom-right, overlapping the corner by 6. The whole hero is the button to the major page and sinks on press.

Under it, "Still needed" `title-2` with "See all {n}" `link`, then the next two needed requirements as two tappable cards side by side (2 columns, 10 apart): a status word in `caption` ("Taking now" `--blue-600`, "Next" `--slate-600`), the name `row-title` up to 2 lines, and "Counts for UC and Cal State" `caption` `--green-700` when it does. The taking-now card has a 2 px `--blue-600` border and `--blue-600` edge on white (no pale fill).

### Opportunity card (feed and hub)

A tappable card, padding 14, two parts 10 apart:
1. An icon circle 44 in the kind's color (Money `--yellow-400` with a navy `Medal`; Research `--blue-600` with `Flask`; Compete `--green-700` with `Trophy`; others `--indigo-600` with `Star`), 12, then the name `headline` and the organizer `label` `--slate-600`.
2. A row of pills: the date pill (`due` at 14 days or less, `soon` up to 60, `neutral` beyond, "Dec 9, 31 days left"; an event shows its dates, "Feb 12 to 14"), then up to two `good` pills from the data ("Paid", "Free", "Fits you").

The hub's single "Opportunities for you" item uses the same card with the date tile in place of the icon circle, as on the board.

### Step icons (replaces 16's table)

Step tiles become icon circles that are also the check control (`--edge-sm`):

| Step | Icon | Circle |
|---|---|---|
| Pick your campuses and majors | `MapPinLine` | `--blue-600` |
| Enter your courses and grades | `BookOpenText` | `--green-700` |
| Write your personal insight answers | `PencilLine` | `--indigo-600` |
| Add activities and awards | `Trophy` | `--amber-700` |
| Check for extra campus steps (CSU) | `ListChecks` | `--indigo-600` |
| Pay the fee or ask for a waiver | `Receipt` | `--blue-600` |
| Submit by Nov 30 | `PaperPlaneTilt` | `--blue-600` |
| Anything not in the map | `CheckSquare` | `--blue-600` |

Done turns any of them `--green-600` with a white check and `--green-700` edge, with 16's step burst in honey.

## Code

- Tokens live in one place (the CSS variables file the app already uses). Change values there, add the new ones, delete the removed ones, then fix every use the compiler or a search finds. A search for `blue-50`, `tint-sky`, `tint-indigo`, `node-empty`, `sky-50`, `mint-600`, `mint-pressed`, `shadow-card`, `shadow-cta`, `shadow-lift`, `Figtree` and `ArrowSquareOut` must come back empty (except `docs/` and this note).
- One shared edge style, not a shadow typed on each component: e.g. an `.edge` class or a helper that takes the size and partner color and handles the press.
- `/dev/components` shows every shared component in every state in rev 2, including pressed (hold) and focus.
- Layout code doesn't change except Home's hero and checklist, the Explore hero and Still needed, and the opportunity card.
- No new libraries. Nunito through `next/font/google`.

## Mobbin references

Standing rule (21): pull two references per screen (iOS first) and compare after building; don't change the design from them. Look for Duolingo (home path, buttons, lesson complete), plus one non-Duolingo app with chunky buttons. Save to `docs/refs/23-chunky-reskin/` (git-ignored).

## Not in this pass

- New art. The husky files stay as they are.
- Dark mode.
- The Welcome scene and the celebration animation.
- Copy changes, except "Counts for both" becoming "Counts for UC and Cal State" (00 → Requirement row).

## Test

At 393 × 852 and 320 × 568, light mode:

1. Home, Explore hub, Opportunities match the board's A row in color, type and edges, with the R3 fixes (green-700 hero, solid blue active tab, no pale fills).
2. Every tappable thing has an edge and sinks on press without moving its neighbours; nothing passive has an edge.
3. No pale blue fill anywhere: no tinted button, no pale icon tile, no pale active tab.
4. No `ArrowSquareOut` and no chevrons on solid buttons.
5. Every text pairing passes 4.5:1 (3:1 for 19 px bold and up, and for icons); check the green hero, honey date tiles and pills with a contrast tool.
6. Focus is visible on every control, including on the heroes (white outline).
7. Reduced motion: tab pill and sheets don't slide; the press still sinks.
8. The search in step "Code" comes back empty.
9. Welcome, sign in, onboarding, Deadlines, Essays, the major page, Settings and the celebration all render in rev 2 with no layout shift from before, screenshots of each attached.
10. `/dev/components` shows every component in rev 2.
