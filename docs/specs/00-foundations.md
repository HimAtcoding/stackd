# 00 · Foundations

Status: **rev 2, "Chunky and playful" (November 2026).** Rev 1 (September 2026) was measured from the team mockups in `docs/mockup/`. Rev 2 replaces its color, type, radius, elevation and component looks with direction A from the design board ("Stackd design directions", A row: Home, Explore, Opportunities), picked by Ryan over "Trail map" and "Bold numbers". Layouts in the screen specs stay; how things look comes from here. The rollout, screen by screen, is in `23-chunky-reskin.md`. Every screen spec uses these tokens. If a screen spec and this file disagree on a look (color, font, radius, edge), this file wins. If they disagree on layout, the screen spec wins.

### The rev 2 idea in one line

Things you can tap have a solid bottom edge and press down into it. Things you can't tap are flat. Color carries status and section, never decoration.

## How to read these numbers

- All sizes are CSS px. On iOS Safari 1 CSS px = 1 pt, so a value here is the same on a phone.
- Design viewport is 393 × 852 (iPhone 15/16). The mockup phones measured 422 px wide, so 1 mockup px = 0.931 pt. Values below are measured, then snapped to a 4 px grid.
- Layouts are fluid from 320 to 480 wide. Above 480, content stays 480 wide and centers on the white `--page`.
- Vertical positions are given relative to the safe-area top (`env(safe-area-inset-top)`), never the physical top of the screen. The mockups have no status bar; the real app does.
- "Normalized" means the mockup drew the same thing two different ways, and this spec picks one. Every normalization is listed at the end of this file so it can be reversed.

## Color

Rev 2 palette, from direction A of the design board. Contrast was checked against WCAG for every pairing used; where a bright color fails with white, it gets a darker partner for text.

### Core

| Token | Hex | Use |
|---|---|---|
| `--blue-600` | #1E5EFF | Primary buttons, links, active tab pill, Home hero, the "taking now" ring. White on it 5.1:1 |
| `--blue-700` | #1747C7 | Edge under `--blue-600`, pressed fill on links, UC school tiles, the hero's progress track |
| `--yellow-400` | #FFC226 | Honey: progress on a blue fill, taking-now segments, the empty-state circle, the step burst, toast actions. `--navy-900` on it 10:1. Never text on white |
| `--yellow-700` | #D89A00 | Edge under `--yellow-400` |
| `--green-600` | #22A565 | Done: status icons, done segments and progress fill on white. White check on it 3.2:1 (passes 3:1 for icons) |
| `--green-700` | #178049 | Edge under `--green-600`, done text ("Done", "Counts for UC and Cal State"), Explore section color and its hero. White on it 5.0:1 |
| `--green-800` | #0F5E35 | Edge under a `--green-700` hero |
| `--navy-900` | #10194A | Primary text, headlines, wordmark, toast fill, text on `--yellow-400` |
| `--slate-700` | #3F4A6E | Body text on pale status fills (pills, banners) |
| `--slate-600` | #5B6585 | Secondary text, inactive tab labels and icons. 5.8:1 on white |
| `--slate-400` | #8A93AE | Empty status rings, field borders, disabled icons. 3.1:1, so graphics only, never text |
| `--border` | #E5E8F0 | 2 px container borders, dividers, the edge under white buttons and cards, progress tracks |
| `--border-strong` | #D3D8E4 | Social button borders, "or" divider rules |
| `--field-border` | #8A93AE | Text field border at rest (same value as `--slate-400`, 3.1:1 for control edges) |
| `--surface` | #FFFFFF | Cards, sheets, tab bar, buttons that aren't solid |
| `--page` | #FFFFFF | Page background everywhere. Rev 1's `--sky-50` page is gone |
| `--surface-pressed` | #F1F3F8 | Pressed rows inside a list, segmented control track, neutral pill |

### Section colors

Each section owns one solid color for its hero panel and its icon circles. They mark features and never carry status.

| Token | Hex | Edge partner | Section |
|---|---|---|---|
| `--blue-600` | #1E5EFF | `--blue-700` | Home, Deadlines, the plan step |
| `--green-700` | #178049 | `--green-800` | Explore, the courses step |
| `--indigo-600` | #4F55E0 | `--indigo-800` #3A3FB0 | Essays, the writing step. White on it 5.7:1 |
| `--amber-700` | #A86A00 | `--amber-800` #8A5600 | Activities step. White icon on it 4.4:1 |
| `--yellow-400` | #FFC226 | `--yellow-700` | Opportunities (with `--navy-900` icons and text) |

### Status fills (pills, banners, errors)

| Token | Hex | Use |
|---|---|---|
| `--coral-700` | #B8361B | Due within 14 days, errors, destructive button. 4.8:1 on white |
| `--coral-800` | #8E2812 | Edge under a `--coral-700` hero or button |
| `--coral-500` | #FC5E3C | Unread dots only |
| `--coral-50` | #FEE3E0 | Due pill fill |
| `--coral-25` | #FCEBEC | Inline error card |
| `--yellow-50` | #FFF4D6 | "Soon" pill fill and the amber reminder banner |
| `--amber-900` | #7A5200 | Text on `--yellow-50` (7.2:1) |
| `--mint-100` | #E3F6EC | "In progress" and "Fits you" pill fill |
| `--mint-800` | #1A6E45 | Text on `--mint-100` (5.6:1) |
| `--amber-800` | #8A5600 | Cal State school tiles (white 6.16:1) |
| `--slate-700` on `--surface-pressed` | | Neutral pill ("Jan 6, 59 days left") |

### Art only

`--sky-100` #D3EFFD stays for the Welcome scene, the backdrop behind the university screen's art, and art placeholders. It never fills a button, tile, card or page.

### Removed in rev 2

These pale tints made buttons and tiles look washed out. Each use moves to the replacement on the right; `23-chunky-reskin.md` lists every place.

| Removed | Replace with |
|---|---|
| `--blue-50`, `--blue-50-border` (tinted button) | Secondary button: white, 2 px `--border`, `--border` edge, `--blue-600` label |
| `--tint-sky`, `--tint-indigo`, `--node-empty`, `--amber-50` and `--mint-100` as icon tiles | Solid icon circles in the section color, white icon (navy on yellow) |
| `--blue-100` (progress track, ring track) | `--border` |
| `--sky-50` (page) | `--page` white |
| `--sky-100` home gradient | White page; the hero carries the color |
| `--mint-600`, `--mint-pressed` | `--green-700`, `--green-800` |

### Status colors

The palette carries status. These pairings are fixed across the app:

| Status | Icon | Text | Where |
|---|---|---|---|
| Done | `--green-600` circle, white check, `--green-700` edge when it's a control | `--green-700` "Done" or `--slate-600` | Requirement rows, steps, Home path |
| Taking now / in progress | 3 px `--blue-600` ring with `HourglassMedium` (or a `--blue-600` arc on a `--border` track) | `--blue-600` "Taking now" | Requirement rows, essay card |
| Not started | 2.5 px `--slate-400` ring, or the item's section-color circle when it's a step | `--slate-600` | Requirement rows, steps |
| Due within 14 days | Coral pill, or the hero turns `--coral-700` | `--coral-700` | Up next, opportunity rows |
| Soon (15 to 60 days) | `--yellow-50` pill | `--amber-900` | Opportunity rows, deadline rows |
| Reminder | `--yellow-50` banner, `Bell` fill `--amber-700` | `--navy-900` / `--slate-700` | University screen |
| Unread | 8 px `--coral-500` dot | none | Tiles, cards |
| Error | `WarningCircle` fill `--coral-700`, or 2 px `--coral-700` field border | `--coral-700` / `--slate-700` | Field errors, inline error |

Green means done and nothing else. Blue means "you" (where you are, what you're taking, what you tap). Honey means progress and reward.

## Type

**Nunito** for everything, weights 600, 700, 800, 900 (rev 2; rev 1 used Figtree). Nunito's rounded ends match the husky and the rounded edges. It is set heavier than a usual app: nothing below 600, headlines at 900. Load with `next/font/google`, `display: "swap"`. Fallback stack: `ui-rounded, -apple-system, "Segoe UI", Roboto, sans-serif`. Use `font-variant-numeric: tabular-nums` on any count ("3 of 6", "642 words", "31 days left").

| Token | Size / line | Weight | Tracking | Example |
|---|---|---|---|---|
| `celebrate` | 72 / 68 | 900 | -0.02em | "Great job!" |
| `hero-number` | 64 / 56 | 900 | -0.02em | "22" days left on the Home hero |
| `display` | 38 / 42 | 900 | -0.01em | Welcome headline |
| `title-1` | 34 / 38 | 900 | -0.01em | "Hi, Sam!", "Explore", "Opportunities" |
| `title-2` | 21 / 26 | 900 | 0 | "Your application", "Still needed", "Opportunities for you" |
| `title-3` | 18 / 24 | 900 | 0 | Card titles, empty-state titles |
| `headline` | 17 / 22 | 900 | 0 | Opportunity names, the current step, field labels |
| `row-title` | 16 / 22 | 800 | 0 | List rows, steps, requirement names |
| `body-lg` | 18 / 26 | 600 | 0 | Welcome body, essays intro |
| `body` | 15 / 21 | 600 | 0 | Descriptions, secondary lines |
| `body-md` | 16 / 22 | 700 | 0 | Text field input and placeholder (16 stops iOS zoom) |
| `label` | 14 / 18 | 800 | 0 | Tile titles, small links, segment labels |
| `pill` | 13 / 18 | 900 | 0 | "Fits you", "Dec 9, 31 days left" |
| `caption` | 13 / 17 | 700 | 0 | Counts under titles, timestamps, sources |
| `tab` | 12 / 16 | 800 (900 active) | 0 | Tab bar labels |
| `button-lg` | 18 / 24 | 900 | 0 | "Keep going", "Get started" |
| `button` | 16 / 20 | 900 | 0 | Secondary and compact buttons |
| `link` | 15 / 20 | 900 | 0 | "See all 9" |
| `segment` | 16 / 20 | 800 | 0 | Underline tabs |
| `demo` | 12 / 16 | 700 | 0.01em | Demo strip, footer disclaimer |

`type-code` is the one style outside Nunito: 13 / 16, weight 500, in `--font-code` (`ui-monospace, "SF Mono", Menlo, Consolas, monospace`), for real course codes such as COMP 122, and nothing else (21).

Sentence case everywhere. No text smaller than 12. Body lines stay under 80 characters.

## Spacing

Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48.

| Token | Value | Measured |
|---|---|---|
| `--gutter-card` | 16 | Card edges at 15–17 on home and essays |
| `--gutter-text` | 24 | Free text (not in a card) at 20–26 |
| `--card-pad` | 16 | Journey card, upcoming cards, essay cards |
| `--tile-pad` | 12 | Home shortcut tiles |
| `--gap-grid` | 12 | Between tiles, between stacked cards (measured 11–12) |
| `--gap-section` | 20 | Section title below the previous block (measured 16–20) |
| `--gap-title` | 12 | Section title to its content |

## Radius

Radius goes up with importance.

| Token | Value | Use |
|---|---|---|
| `--r-sm` | 12 | School tiles, filter chips, compact buttons, the date tile, pills use 10 |
| `--r-md` | 16 | Primary and secondary buttons, text fields, toasts, banners |
| `--r-lg` | 20 | Cards and list containers |
| `--r-hero` | 24 | The one hero per screen, the tab bar capsule, sheet top corners |
| `--r-full` | 999 | Circles (icon circles, status icons, avatars, circle buttons), progress bars |

Rev 1's pill-shaped primary button (`--r-full`) becomes `--r-md`: a chunky block, like the board.

## Edges (replaces Elevation)

Rev 2 has no soft drop shadows on content. Depth is a solid edge drawn under the element with `box-shadow: 0 <edge> 0 <edge color>`. The edge color is the element's dark partner: `--blue-700` under blue, `--yellow-700` under honey, `--green-700` under `--green-600`, `--green-800` under `--green-700`, `--indigo-800`, `--amber-800`, `--coral-800`, and `--border` under anything white.

| Token | Edge | Use |
|---|---|---|
| `--edge-sm` | 3 px | Chips, compact buttons, circle buttons, icon circles that are controls, the active tab pill |
| `--edge-md` | 4 px | Primary and secondary buttons, tappable cards, the tab bar |
| `--edge-lg` | 6 px | The hero |

**The rule:** an edge means you can tap this. Two exceptions: the hero (the one solid block per screen) and the tab bar capsule always have their edge. Anything else that isn't a control is flat: a passive card or list container gets a 2 px `--border` and no edge, and a plain row gets neither. Rows inside a list container are controls but don't get their own edge (the container groups them); they show `--surface-pressed` on press.

**Press:** the element moves down by its edge (`translateY(4px)` for `--edge-md`) and the edge drops to 0, so it sinks into its own shadow. 80 ms ease-out in, 120 ms back. No scale, no color change. This stays on under reduced motion: it moves 3 to 6 px and is direct feedback, not travel.

**Layout:** reserve the edge in the layout (margin-bottom equal to the edge, or count it in the gap) so pressing never shifts neighbours.

**Container tiers** (from `15-home-deadlines-rev2.md`), in rev 2 terms: tier 1 hero is a solid section color, `--r-hero`, `--edge-lg`; tier 2 list is white, 2 px `--border`, `--r-lg`, no edge; tier 3 ask is white, 2 px `--border`, `--r-lg`, with a honey icon circle and its own button.

Two soft shadows remain, both for things floating over other content: the bottom sheet (over its scrim, no shadow needed) and the toast (`0 6px 16px rgba(16,25,74,.18)`).

## Icons

Phosphor (`@phosphor-icons/react`). Rev 2 is chunkier: **bold** at rest, **fill** for the active tab and inside solid icon circles. No `regular` weight. No icon marks a link that leaves the app (no `ArrowSquareOut`, ever): a link line shows its domain instead (18), and a button that opens an outside page says so in its label (22).

| Where | Icon | Weight | Size |
|---|---|---|---|
| Tab: Home / Explore / Essays / You | `House` / `Compass` / `PencilLine` / `UserCircle` | fill when active, bold when not | 24 |
| Icon circles (steps, shortcuts, opportunities) | per screen spec | fill | 22 in a 44 circle, 20 in 40 |
| Chevrons | `CaretRight` | bold | 16 in tiles, 20 in rows; never on a solid button |
| Back / save | `ArrowLeft` / `Heart` (fill when saved) | bold | 22 |
| New essay | `Plus` | bold | 24 |
| Status check | `Check` | bold | 16 (24 in a 48 step circle) |
| Field icons: email / password | `Envelope` / `Lock` | bold | 22 |
| Show / hide password | `Eye` / `EyeSlash` | bold | 22 |
| Errors | `WarningCircle` | fill | 16 in field messages, 24 in inline error |

## Shared components

Rev 2 looks. Sizes not listed here are unchanged from the screen specs.

### Primary button

Height 56. Full width minus 2 × `--gutter-card`, or hugging its label (padding 0 20) inside a hero. `--r-md`. Fill `--blue-600`, `--edge-md` `--blue-700`. Label `button-lg` white, centered. **No chevron** (rev 2 drops rev 1's trailing chevron).

- Pressed: sinks into its edge (see Edges). 80 ms in, 120 ms out.
- On a blue hero: white fill, `--blue-600` label, `--edge-md` `--blue-700` (never a pale edge).
- Focus-visible: `outline: 2px solid var(--blue-600); outline-offset: 3px` (white outline on a blue hero).
- Disabled: fill `--border`, label `--slate-600`, no edge, `aria-disabled="true"`.
- Loading: label fades to 0 in 120 ms and a 20 px white ring spinner takes its place. Width doesn't change.

### Secondary button

Replaces rev 1's tinted button everywhere. Height 48, `--r-md`, `--surface`, 2 px `--border`, `--edge-md` `--border`. Icon 20 bold + 8 + label `button`, both `--blue-600`. Pressed: sinks. No pale blue fill, ever.

### Compact button

From 16 → 7 (Mark done). Looks 36 tall (44 tap area), padding 0 14, `--r-sm`, `--blue-600` fill, `--edge-sm` `--blue-700`, white `Check` bold 16 + 6 + `label` white.

### Text button

No fill or border. Icon 16 bold + 6 + `label` `--blue-600`, 44 tap area. For quiet actions like Remind me.

### Circle button

44 × 44, `--r-full`, `--surface`, 2 px `--border`, `--edge-sm` `--border`, icon bold 22 `--navy-900`. Back, save, bell. The "+" variant is `--blue-600` with a white icon and `--blue-700` edge.

### Card

`--surface`, 2 px `--border`, `--r-lg`, padding 16. Passive: no edge. Tappable (the whole card is the button): `--edge-md` `--border` and sinks on press. A chevron, if any, is decorative.

### Hero

The tier 1 panel, one per screen at most. Solid section color (`--blue-600` on Home, `--coral-700` when due in 14 days or less, `--green-700` on Explore), `--r-hero`, `--edge-lg` in the partner color, padding 18 18 20. All text white. Big number `hero-number`. Progress inside it: track `--blue-700` (or the partner color), fill `--yellow-400`, height 12. The husky may overlap its bottom-right corner (per screen spec).

### Icon circle

Replaces rev 1's pale icon tiles. 44 (40 in dense lists), `--r-full`, solid section color, icon fill white (navy on `--yellow-400`). When the circle is a control (the step check), it gets `--edge-sm` in the partner color; otherwise flat.

### Shortcut tile

A tappable card at height 72: icon circle 44 + 12 + text block (title `label` `--navy-900`, subtitle `caption` `--slate-600`). No chevron.

### Pill

Height 28, padding 0 10, radius 10, `pill` type. Variants: `due` (`--coral-50` / `--coral-700`), `soon` (`--yellow-50` / `--amber-900`), `good` (`--mint-100` / `--mint-800`, for "Fits you", "Paid", "Free", "In progress"), `neutral` (`--surface-pressed` / `--slate-700`). Pills are labels, not controls: no edge.

### Filter chip

For the Opportunities filters (22). Height 40, padding 0 14, `--r-sm`, `label`. Off: `--surface`, 2 px `--border`, `--edge-sm` `--border`, `--navy-900` label. On: `--blue-600` fill, `--edge-sm` `--blue-700`, white label. Sinks on press. `aria-pressed`.

### Status icon

28 × 28. Done: `--green-600` circle, white `Check` bold 16. In progress: 3 px ring, `--border` track, `--blue-600` arc covering 50% from 12 o'clock counter-clockwise, round caps. Not started: 2.5 px `--slate-400` ring. When it is also the control that marks a row done, the hit area is 44 and it gets `--edge-sm`.

### Status tile

40 circle, hit area 44, three states: not yet (icon circle in the item's section color), taking now (`HourglassMedium` bold `--blue-600` on white with a 3 px `--blue-600` ring, `--edge-sm` `--blue-700`), done (white `Check` on `--green-600`, `--edge-sm` `--green-700`, plus the step burst). `role="checkbox"` with `aria-checked` true, "mixed" or false (21).

### Step path

The Home application checklist (02, 15, 16), drawn as the board's A Home. A column of step circles, 48, with a 4 × 10 `--border` bar (radius 4) between them, centered under each circle. Done: `--green-600`, white `Check` 24, `--green-700` edge. Current: 56, `--blue-600`, white section icon, `--blue-700` edge, its text `headline` with a `caption` line under it ("1 of 4 written"). Not yet: white, 3 px `--border` ring, `--border` edge, `--slate-400` icon. Done step text `--slate-600`; the rest `--navy-900`. Steps are a real sequence, so the path is allowed (no numbers needed: the order is the path).

### Progress bar

Height 12, `--r-full`. On white: track `--border`, fill `--green-600`. On a hero: track the hero's partner color, fill `--yellow-400`. Width animates 320 ms ease-out when the value changes, and only then.

### Segmented bar

One segment per item (requirements, steps), height 10, 5 apart, `--r-full`. On white: done `--green-600`, taking now `--yellow-400`, not yet `--border`. On a hero: done white, taking now `--yellow-400`, not yet the partner color.

### Underline tabs

Row height 44, bottom 2 px `--border`. Label `segment`, active `--blue-600`, inactive `--slate-600`. Indicator 4 px `--blue-600`, radius 2, width = label + 28, slides 200 ms `--ease-out`. `role="tablist"` / `role="tab"` / `aria-selected`.

### Segmented control

Track `--surface-pressed`, `--r-md`, padding 3, height 44. Selected thumb `--surface`, `--r-sm`, 2 px `--blue-600` border, label `label` `--blue-600`; others `--slate-600` on the track. Slides 200 ms (instant under reduced motion). `role="radiogroup"`, arrow keys move.

### Section band

Rev 2: no tinted band. A tab screen's top is white: title `title-1` 24 under the safe area, subtitle `body` `--slate-600` 8 below, then the search field or tabs. The section's color moves into that screen's hero.

### Requirement row

Min height 64, padding 12 16: status tile, then name `row-title` up to 2 lines, detail `caption`: `--green-700` "Counts for UC and Cal State" when it counts for both (rev 2 spells it out; `Intersect` icon dropped), `--slate-600` otherwise. The tile and the text are separate controls (21).

### Major row

Min height 64, padding 12 16, the whole row a button inside a list container: icon circle 40 `--green-700` with a white icon, name `row-title`, detail `caption` `--slate-600`. The student's own major shows a 60 wide segmented bar before its count. No chevron.

### School tile

The school's short name in white on its system's color (UC `--blue-700`, Cal State `--amber-800`, community college `--slate-700`), 48 × 40, `--r-sm`, weight 900 (was 800), 15 for 2–3 letters and 12 for 4–5. Flat (not a control). Never a logo. `aria-hidden`.

### Date tile

18's date tile in rev 2: 52 × 56, `--r-md`, `--yellow-400` with month `caption` and day 22 / 22 900 in `--navy-900`, flat. Due in 14 days or less: `--coral-700` with white text. Rolling (no deadline): `--surface`, 2 px `--border`, `Infinity` bold 24 `--slate-600`.

### Source block

Unchanged in content: "From {source}. Checked {date}." `caption` `--slate-600`, a link line to the source, then "Report a problem" (`caption`, weight 900, `--blue-600`).

### Ask card

Tier 3: card (passive), honey icon circle 40 with a navy icon at the left, text, and its own secondary or compact button. No pale fill.

### Tab bar

Floating, inset 16 each side (max width 420), 68 tall, radius 24, `--surface`, 2 px `--border`, `--edge-md` `--border`, 12 above the bottom safe area. No blur, no soft shadow. Tabs: Home, Explore (with `explore` on), Essays (with `essays` on), You (Settings; not in demo mode); only those switched on, none with only Home. Equal widths; icon 24 over label `tab`, 2 apart. Inactive: icon bold and label `--slate-600`. **Active: a solid `--blue-600` pill (tab width minus 6 each side, 54 tall, radius 18, `--edge-sm` `--blue-700`), icon fill and label white.** The pill slides between tabs over 200 ms (instant under reduced motion). The board's pale blue active pill is replaced by this solid one. A tab screen's bottom padding is 68 + 12 + safe area + 16; toasts sit 12 above it. Hidden on pushed screens and on the celebration.

### Text field

- Label above: `headline` `--navy-900`, a real `<label for>`, 8 above the field.
- Field: height 52, `--r-md`, `--surface`, 2 px `--field-border`, no edge (it isn't a button). Padding 0 16; leading icon 22 at left 14 with text padding-left 50; trailing 44 button at right 2 with padding-right 48.
- Text `body-md` `--navy-900`, placeholder `--slate-600`, caret `--blue-600`.
- Focus: border `--blue-600` plus `0 0 0 4px rgba(30,94,255,.18)`, 120 ms.
- Hint: 6 below, `caption` `--slate-600`, `aria-describedby`.
- Error: border `--coral-700`; message 6 below with `WarningCircle` fill 16, 6 gap, 14/18 800 `--coral-700`, expands over 200 ms. `aria-invalid="true"`.
- Read-only 0.6 opacity; disabled 0.4.

### Search field

A text field without a label, `MagnifyingGlass` bold 22 `--slate-600` leading, placeholder names what it searches ("Majors, scholarships, programs").

### Code field

Six boxes, gap 8, height 56, `--r-md`, 2 px `--field-border`, digit `title-2` tabular-nums. Focus and error as the text field. Behavior in `09-enter-code.md`.

### Choice circle

26, 2.5 px `--slate-400` ring. Chosen: `--blue-600` fill, white `Check` bold 14. Decorative; the row carries the role. Blue on purpose: green means done.

### Settings row

Height 56, padding 0 16, inside a list container (2 px `--border`, `--r-lg`), 2 px `--border` between rows. Label `row-title`, value `body` `--slate-600`, `CaretRight` bold 20 only when the row opens a screen. Pressed `--surface-pressed`.

### Bottom sheet

Scrim `rgba(16,25,74,.4)`. `--surface`, `--r-hero` top corners, a 40 × 5 `--border` grabber 8 from the top, padding 24 24 `calc(24px + env(safe-area-inset-bottom))`. In: translateY 100% → 0, 280 ms `--ease-out`; out 200 ms; fade only under reduced motion. `role="dialog"`, `aria-modal="true"`, focus trapped, Escape and scrim close it.

### Destructive button

Primary button shape with `--coral-700` fill and `--coral-800` edge. Only for deleting the account (11).

### Social button

Height 52, `--r-md`, white (Apple and Google require it), 2 px `--border-strong`, `--edge-sm` `--border-strong`. Logo, 12, label `button` `--navy-900`. Sinks on press. Logos from the providers' kits.

### Labelled divider

Row height 24, two 2 px `--border` rules either side of a `body` `--slate-600` label, 16 apart. `aria-hidden`.

### Text link

`link` `--blue-600` (`label` size for small links). No underline at rest; underline on press and focus. 44 tall hit area via padding and matching negative margin.

### Toast

12 above the tab bar (or the primary button). `--navy-900`, `--r-md`, padding 12 16, `0 6px 16px rgba(16,25,74,.18)`, text white `body` 700, optional action `link` in `--yellow-400`. In: translateY 16 → 0 with opacity, 200 ms; out 160 ms; auto-dismiss 4000 ms. `role="status"`.

### Demo strip

Unchanged: 24 tall, `--navy-900`, white `demo` text "Demo data", only on screens with demo records, controlled by `NEXT_PUBLIC_DEMO_STRIP`.

### Unofficial footer line

`demo` `--slate-600`, centered, max-width 320: "Unofficial planning tool. Not affiliated with UC, CSU, ASSIST, or any college." On Welcome and the university screen (06-trust).

### Empty state

Centered column, max-width 280, 48 above and below: icon 32 fill `--navy-900` in a 72 `--yellow-400` circle (flat), 16, title `title-3`, 8, body `body` `--slate-600`, 20, a secondary button naming the next action. The husky may replace the circle where a screen spec says so.

### Placeholder screen

As rev 1, built from the empty state above. Back button is the circle button; the table of versions is unchanged:

| Where | Tab bar | Title | Body | Button → goes to |
|---|---|---|---|---|
| Signed out (auth links, Terms, Privacy) | No | This part isn't built yet | It's on the list. You can still sign in. | Back to sign in → `/sign-in` |
| Signed in, any route except `/` | Yes, with the matching tab active | This part isn't built yet | It's on the list. Your plan is still on the home screen. | Back to home → `/` |
| `/` while Home isn't built | Yes, Home active | Home isn't built yet | You're signed in. Sign out to test the sign-in flow again. | Sign out → clears `stackd.session` (keeps `stackd.seenWelcome`), then `/sign-in` |

The back button's fallback is the button's destination. On `/` the back button is hidden.

### Inline error

`--coral-25` fill, `--r-lg`, padding 16, flat. `WarningCircle` fill 24 `--coral-700`, 12, title `headline` and body `body` `--slate-700`. A secondary "Try again" button 12 below when retrying makes sense. Copy names what broke and the fix. No apologies.

### Loading

Waits under 600 ms show nothing. Longer waits show the husky run loop, 72 × 72, with `caption` `--slate-600` naming what's loading. Reduced motion shows one still frame.

## Interaction states (all tappable elements)

| State | Treatment |
|---|---|
| Pressed | Things with an edge sink into it (80 ms in, 120 ms out). Rows in a list show `--surface-pressed` |
| Focus-visible | 2 px `--blue-600` outline, offset 2 (white outline, offset 3, on solid fills), radius follows the element |
| Disabled | Opacity 0.4, `aria-disabled` |
| Hit area | Minimum 44 × 44, even when the visible element is smaller (chevrons, 8 px dots are never targets alone) |

## Motion

| Token | Value |
|---|---|
| `--dur-press` | 80 ms (press into an edge) |
| `--dur-fast` | 120 ms |
| `--dur-base` | 200 ms |
| `--dur-slow` | 320 ms |
| `--ease-out` | cubic-bezier(0.2, 0.8, 0.2, 1) |
| `--ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) |
| Spring, default | stiffness 380, damping 30 (Motion / Framer Motion units) |
| Spring, bouncy | stiffness 260, damping 16 |

Library: `motion` (Framer Motion) for springs and layout, `canvas-confetti` for the celebration.

Navigation:
- Push (home → university): the incoming screen slides translateX 100% → 0 over 320 ms `--ease-out`. The outgoing screen moves to -24% and dims to 0.9 opacity.
- Back reverses in 280 ms.
- Tab switch: instant.
- Modal (celebration): fades in 200 ms.

Under `prefers-reduced-motion: reduce`, every transform animation becomes a 120 ms opacity crossfade, springs are removed, confetti doesn't run, and loops don't start.

Motion only answers a user action. The one exception allowed per screen is noted in that screen's spec.

## Data rule

No copy that describes the student's academic situation lives in a component. Names, counts, statuses, dates, and the journey steps all come from JSON files in `data/seed/` (the folder `CLAUDE.md` and `11-tech-architecture.md` already name), and each record has `"demo": true`. File names used in the screen specs (`home.json`, `essays.json`, `universities/uc-davis.json`) are relative to `data/seed/`. Deleting those files must give empty states, not blank screens. Copy that is part of the interface itself ("Upcoming", "Keep going") lives in components.

## Normalizations (reversible)

| # | Mockup drew | Spec uses | Why |
|---|---|---|---|
| N1 | Container margins 16 (home, essays), 20 (university), 23–33 (welcome, celebration CTAs) | 16 everywhere | One edge line. Mobbin references (Cash App, Jomo, Duolingo) sit at ~16 |
| N2 | Primary buttons 60, 56, 48 tall | 56 | Middle value. References run 50–58 |
| N3 | Free text left edge 20–26 | 24 | Average of measurements |
| N4 | Tile gaps 8 horizontal, 12 vertical | 12 both | Equal gutters |
| N5 | Chevrons next to subtitle on two tiles, centered on the other two | Centered, right 12 | Majority |
| N6 | Active underline-tab label blue (university) vs navy (essays) | Blue | Matches the tab bar's active color |
| N7 | Tab bar icons larger and lower on essays than on home | Home version | Home drawn first |
| N8 | Celebration headline navy #01226B, chip text #3157AA, check #1C8AFD | `--navy-900`, `--blue-700`, `--blue-600` | Keeps the token set small |
| N9 | Requirements tile "2 in progress", university list shows 1 | Count derived from the same data (1) | Data rule. Not a drawing change |
| N10 | Four colors failed contrast | Darkened values in the color table | Quality floor |
| N11–N15 | Sign-in screen | See `06-sign-in.md → Normalizations` | Listed with the screen they come from |
| R2 | Rev 1 look (Figtree, pale tints, soft shadows, pill buttons) | Rev 2 "Chunky and playful" | Ryan picked direction A of the design board, Nov 2026. Rev 1 values are in git history (this file before PR for step 29) |
| R3 | Board A: white text on bright green #2BB673, pale blue active tab and "Taking now" fill, `--slate-400` small text | `--green-700` hero, solid blue active tab, white fills, `--slate-600` text | Contrast and the no-pale-tint rule |
