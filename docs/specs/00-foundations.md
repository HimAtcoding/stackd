# 00 · Foundations

Status: baseline rev 1 (September 2026). Source: team mockups in `docs/mockup/` (`mockup-4-screens.png`, `mockup-task-complete.png`, `mockup-sign-in.png`), measured in pixels and converted to points. Every screen spec (01–08) uses these tokens. If a screen spec and this file disagree, this file wins, unless the screen spec names the exception.

## How to read these numbers

- All sizes are CSS px. On iOS Safari 1 CSS px = 1 pt, so a value here is the same on a phone.
- Design viewport is 393 × 852 (iPhone 15/16). The mockup phones measured 422 px wide, so 1 mockup px = 0.931 pt. Values below are measured, then snapped to a 4 px grid.
- Layouts are fluid from 320 to 480 wide. Above 480, content stays 480 wide and centers on a `--sky-50` page.
- Vertical positions are given relative to the safe-area top (`env(safe-area-inset-top)`), never the physical top of the screen. The mockups have no status bar; the real app does.
- "Normalized" means the mockup drew the same thing two different ways, and this spec picks one. Every normalization is listed at the end of this file so it can be reversed.

## Color

Sampled from the mockups (±3 per channel from compression), then cleaned. Four values were darkened to pass WCAG contrast. Those are marked, with the drawn value kept for reference.

| Token | Hex | Use |
|---|---|---|
| `--blue-600` | #0364FA | Primary buttons, active tab, links, progress fill, "+" button |
| `--blue-700` | #0252D1 | Pressed primary, text on `--blue-50` (4.31:1 fails with blue-600) |
| `--blue-100` | #D9EBFA | Progress track |
| `--blue-50` | #E2F0FD | Tinted button fill |
| `--blue-50-border` | #CFE3FA | Tinted button border |
| `--sky-200` | #B8E7FD | Top of welcome and celebration gradients |
| `--sky-100` | #D3EFFD | Top of home gradient |
| `--sky-50` | #EAF6FE | Page background |
| `--surface` | #FAFCFE | Cards, sheets, tab bar, floating circle buttons |
| `--white` | #FFFFFF | Essays header zone, celebration chip |
| `--navy-900` | #051042 | Primary text, headlines, wordmark |
| `--slate-700` | #3F4A6E | Body text on amber banner (7.7:1) |
| `--slate-600` | #5E6B96 | Secondary text, inactive tab labels. Drawn #7B88B2 (3.4:1, fails). Now 5.1:1 on surface |
| `--slate-400` | #8590AC | Inactive tab icons, empty status ring. Drawn #A5B0C6 (2.1:1, fails 3:1 for controls). Now 3.1:1 |
| `--border` | #E3ECF7 | Dividers, list container border, tab bar top edge |
| `--border-strong` | #CFDAEC | Social button borders, "or" divider rules |
| `--field-border` | #8090B8 | Text field border at rest. Drawn #C7D4EA (1.5:1, fails 3:1 for control edges). Now 3.1:1 |
| `--surface-pressed` | #F1F6FC | Pressed rows and cards |
| `--tint-sky` | #E4F4FD | Icon tiles: Requirements, Mentors, panel event, review card |
| `--tint-indigo` | #EAEDFD | Icon tiles: Essays, Events |
| `--node-empty` | #E9F3FC | Unfilled journey steps |
| `--green-600` | #40A459 | Done: journey checks, "Complete" status. White check on it is 3.15:1 (passes 3:1 non-text) |
| `--mint-100` | #D2F3EC | "In progress" pill background |
| `--mint-800` | #0A6C44 | "In progress" pill text (5.5:1) |
| `--coral-500` | #FC5E3C | Unread dots, calendar icon in deadline tile |
| `--coral-700` | #B8361B | "In 2 weeks" pill text. Drawn #FC5E3C (2.5:1, fails). Now 4.8:1 |
| `--coral-50` | #FEE3E0 | Deadline pill background |
| `--coral-25` | #FCEBEC | Deadline icon tile |
| `--amber-50` | #FCF1D2 | Deadline banner background |
| `--amber-500` | #EAA005 | Bell in deadline banner (decorative, `aria-hidden`) |
| `--yellow-400` | #FDC940 | Sparkle dashes, confetti, balloon |
| `--confetti-sky` | #4FA8F7 | Confetti only |

### Status colors

The palette carries status. These pairings are fixed across the app:

| Status | Icon | Text | Where |
|---|---|---|---|
| Done | `--green-600` circle, white check | `--slate-600` "Complete" | Requirement rows, journey tracker |
| In progress | Ring, `--blue-600` arc on `--blue-100` track | `--slate-600` "In progress", or mint pill | Requirement rows, essay card |
| Not started | Ring, 2 px `--slate-400` | `--slate-600` "Not started" | Requirement rows |
| Due within 14 days | Coral pill | `--coral-700` | Upcoming card |
| Reminder | Amber banner, bell | `--navy-900` / `--slate-700` | University screen |
| Unread | 8 px `--coral-500` dot | none | Tiles, cards |
| Error | `WarningCircle` fill `--coral-700`, or 2 px `--coral-700` field border | `--coral-700` / `--slate-700` | Field errors, inline error |

## Type

**Figtree** for everything, weights 400, 500, 600, 700, 800, 900. The mockup lettering is AI-rendered, so there is no real font to copy. Figtree was picked by rendering six candidates (Figtree, Nunito, Plus Jakarta Sans, Outfit, Onest, Rethink Sans) next to mockup crops. It matched the heavy geometric headlines and the softer body text in one family, which the project rules prefer over two.

Load with `next/font/google`, `display: "swap"`. Fallback stack: `-apple-system, "Segoe UI", Roboto, sans-serif`. Use `font-variant-numeric: tabular-nums` on any count ("3 of 6", "642 words", "1h ago").

Sizes were fitted by matching the rendered width of each mockup string in Figtree, then grouped.

| Token | Size / line | Weight | Tracking | Measured from |
|---|---|---|---|---|
| `celebrate` | 72 / 68 | 900 | -0.02em | "Great job!" |
| `display` | 38 / 42 | 900 | -0.02em | "Transfer plans, made simple." (37.8) |
| `title-1` | 36 / 40 | 900 | -0.02em | "Hi, Alex!" (34.2), "UC Davis" (36.4), "Your essays" (40.1) |
| `title-2` | 20 / 26 | 800 | -0.01em | "Your transfer journey" (19.6), "Upcoming" (19.1), "Transfer requirements" (20.8) |
| `title-3` | 18 / 24 | 700 | 0 | "Leadership through community" (17.4), "Peer mentor feedback" (17.7) |
| `headline` | 16 / 22 | 700 | 0 | "Application deadline" (15.5), "Deadline coming soon" (15.3) |
| `row-title` | 16 / 22 | 600 | 0 | "Transferable units" (15.6) |
| `body-lg` | 18 / 24 | 400 | 0 | Welcome body (18.2), essays intro (18.9) |
| `body` | 15 / 20 | 400 | 0 | Card descriptions (14.1–15.2), "642 words" (14.3) |
| `body-md` | 16 / 22 | 400 | 0 | Text field input and placeholder (16 stops iOS zoom on focus), sign-in subtitle (16.4) |
| `label` | 14 / 18 | 600 | 0 | Tile titles (13.5) |
| `pill` | 14 / 18 | 600 | 0 | "In 2 weeks", "In progress" |
| `caption` | 13 / 16 | 400 | 0 | "3 of 6 complete" (13.2), tile subtitles (11.8), timestamps |
| `tab` | 13 / 16 | 600 | 0 | Tab bar labels (13.2) |
| `button-lg` | 20 / 24 | 700 | 0 | "Track application" (19.3), "Keep going" (18.3), "Get started" (23.6) |
| `button` | 16 / 20 | 700 | 0 | "Edit draft" (15.9) |
| `link` | 15 / 20 | 700 | 0 | "View feedback", "View progress" |
| `segment` | 16 / 20 | 600 | 0 | Underline tabs on university and essays screens |
| `demo` | 12 / 16 | 600 | 0.01em | Demo strip, footer disclaimer (400) |

Sentence case everywhere. No text smaller than 12.

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

Radius varies by hierarchy. Measured corner offsets were 13 (journey card), 11 (tiles, upcoming), 8 (icon tiles), scaled for the blur of the render.

| Token | Value | Use |
|---|---|---|
| `--r-sm` | 12 | Icon tiles |
| `--r-md` | 16 | Shortcut tiles, list container, tinted button, amber banner, toast |
| `--r-lg` | 20 | Content cards (journey, upcoming, essays) |
| `--r-sheet` | 24 | Top corners of the university content sheet |
| `--r-full` | 999 | Primary buttons, pills, circle buttons, avatars, progress bars |

## Elevation

The mockup's shadows are faint (1–2 levels of RGB below cards). Three levels, by hierarchy:

| Token | Value | Use |
|---|---|---|
| `--shadow-card` | `0 1px 2px rgba(5,16,66,.04), 0 6px 16px rgba(5,16,66,.05)` | Cards, tiles, list container |
| `--shadow-float` | `0 4px 12px rgba(5,16,66,.10)` | Circle buttons over art (back, heart, bell) |
| `--shadow-cta` | `0 8px 20px rgba(3,100,250,.28)` | Primary pill buttons, "+" button |

The tab bar uses a 1 px `--border` top edge plus `0 -8px 24px rgba(5,16,66,.04)`.

## Icons

Phosphor (`@phosphor-icons/react`). Filled glyphs for active and tile icons, regular for inactive tabs, bold for arrows and chevrons.

| Where | Icon | Weight | Size |
|---|---|---|---|
| Tab: Home / Explore / Essays / Mentors | `House` / `Compass` / `FileText` / `UsersThree` | fill when active, regular when not | 28 |
| Bell (home header) | `Bell` | regular | 24 |
| Tiles: Requirements / Essays / Mentors / Events | `FileText` / `PencilSimple` / `UsersThree` / `CalendarDots` | fill | 24 |
| Upcoming: deadline / panel | `CalendarDots` / `UsersThree` | fill | 24 |
| Chevrons | `CaretRight` | bold | 16 in tiles, 20 in cards and rows |
| Back / save | `ArrowLeft` / `Heart` (fill when saved) | bold / regular | 22 |
| New essay | `Plus` | bold | 24 |
| Edit draft | `PencilSimple` | fill | 20 |
| Deadline banner | `Bell` | fill | 28 |
| Status check | `Check` | bold | 16 |
| Field icons: email / password | `Envelope` / `Lock` | regular | 22 |
| Show / hide password | `Eye` / `EyeSlash` | regular | 22 |
| Errors | `WarningCircle` | fill | 16 in field messages, 24 in inline error |

## Shared components

### Primary button

Height 56. Full width minus 2 × `--gutter-card`. `--r-full`. Background `--blue-600`, text white `button-lg` centered, `--shadow-cta`. The trailing chevron from the mockup is kept: `CaretRight` bold 20, white, absolutely positioned 24 from the right edge, vertically centered. It doesn't shift the label's centering.

- Pressed: background `--blue-700`, `scale(0.97)`, 120 ms ease-out. Release 200 ms.
- Focus-visible: `outline: 2px solid var(--blue-600); outline-offset: 3px`.
- Disabled: opacity 0.4, no shadow, `aria-disabled="true"`.
- Loading: label and chevron fade to 0 in 120 ms, and a 20 px white ring spinner (2 px stroke, 800 ms linear rotation) takes their place. Width does not change.

### Tinted button

Height 48. `--r-md`. Background `--blue-50`, 1 px `--blue-50-border`. Content centered: icon 20 + 8 gap + label `button`, both `--blue-700`. Pressed: background `--blue-100`, `scale(0.98)`.

### Circle button

44 × 44, `--r-full`, `--surface`, `--shadow-float`, icon `--navy-900` centered. Pressed: `scale(0.94)`, 120 ms. Used for back, save, and bell. The "+" variant is `--blue-600` with a white icon and `--shadow-cta`.

### Card

`--surface`, `--r-lg`, `--shadow-card`, padding `--card-pad`. A tappable card gets `--surface-pressed` background on press and no scale. The whole card is the hit target, and the chevron is decorative (`aria-hidden`).

### Shortcut tile

Height 72, `--r-md`, `--surface`, `--shadow-card`, padding 0 `--tile-pad`. Row: icon tile 44 (`--r-sm`) + 12 gap + text block (title `label` `--navy-900`, subtitle `caption` `--slate-600`, 2 gap) + chevron 16 at right 12, vertically centered. Pressed: `scale(0.98)` + `--surface-pressed`.

### Pill

Height 28, padding 0 12, `--r-full`, `pill` type. Variants: `due` (`--coral-50` / `--coral-700`), `progress` (`--mint-100` / `--mint-800`).

### Status icon

28 × 28.
- Done: filled `--green-600` circle with white `Check` bold 16.
- In progress: 2.5 px ring, `--blue-100` track, `--blue-600` arc covering 50%, starting at 12 o'clock and running counter-clockwise, round caps.
- Not started: 2 px `--slate-400` ring.

When the icon is also the control that marks a row done (see 03), the hit area is 44 × 44 centered on the icon.

### Progress bar

Height 8, `--r-full`, track `--blue-100`, fill `--blue-600`. Width animates 320 ms ease-out when the value changes, and only then.

### Underline tabs

Row height 44, bottom 1 px `--border` spanning full width. Label `segment`, active `--blue-600`, inactive `--navy-900`. Indicator: 3 px `--blue-600` bar, radius 2, sitting on the divider, width = label width + 28, centered under the active label. On change the indicator slides and resizes, 200 ms `--ease-out`. `role="tablist"` / `role="tab"` / `aria-selected`.

### Tab bar

Fixed to the bottom. Height 56 + `env(safe-area-inset-bottom)`. `--surface`. The top edge line is drawn with `box-shadow: 0 -1px 0 var(--border), 0 -8px 24px rgba(5,16,66,.04)`, so it takes no space inside the 56. Four equal columns. Each column: 6 top padding, icon 28, 2 gap, label `tab` (16 line), which leaves 4 below the label when there's no home indicator. Active: icon fill `--blue-600`, label `--blue-600`. Inactive: icon regular `--slate-400`, label `--slate-600`. No animation on switch. Each tab keeps its own scroll position. Hidden on pushed screens (the university screen) and on the celebration.

### Text field

Label above, field below, optional message line under the field.

- **Label**: `headline` (16/22 700) `--navy-900`, a real `<label for>`. 8 below it, the field.
- **Field**: height 48, `--r-sm` (12), background `--surface`, 1 px `--field-border`. Padding 0 16. With a leading icon: icon 22 `--slate-600` at left 14, vertically centered, `aria-hidden`, and text padding-left 52. With a trailing control (e.g. show/hide): a 44 × 44 button at right 2, and text padding-right 48.
- **Text**: `body-md` (16/22) `--navy-900`. Placeholder `--slate-600`. Caret `--blue-600`.
- **Focus**: border becomes 2 px `--blue-600` plus `0 0 0 4px rgba(3,100,250,.15)`. Draw the 2 px border with `box-shadow: inset 0 0 0 1px var(--blue-600)` on top of the 1 px border, so the text doesn't shift. 120 ms color transition.
- **Hint**: an optional line 6 below the field, `label` size at weight 400 (14/18) `--slate-600`, linked with `aria-describedby`. On a failed check, the error message takes its place.
- **Error**: 2 px `--coral-700` (same inset method). Message line 6 below the field: `WarningCircle` fill 16 `--coral-700`, 6 gap, text 14/18 500 `--coral-700`. It expands from height 0 with opacity over 200 ms. `aria-invalid="true"` and `aria-describedby` pointing at the message.
- **Read-only** (while submitting): opacity 0.6, no focus ring change.
- **Disabled**: opacity 0.4.

### Social button

Height 48, `--r-sm`, background `--white` (Apple and Google both require their logo on white), 1 px `--border-strong`. Content is one centered group: logo, 12 gap, label `button` (16/20 700) `--navy-900`. Pressed: `scale(0.98)` and a `--surface-pressed` overlay at 60% opacity, so the logo's white background rule still holds, 120 ms. Disabled: opacity 0.4. Logos come from the providers' official kits and keep their own colors and proportions.

### Labelled divider

Row height 24. Two 1 px `--border-strong` rules filling the space on each side of a centered label (`body` `--slate-600`) with 16 between each rule and the label. Decorative: `aria-hidden="true"`.

### Text link

Inline text action. `link` (15/20 700) `--blue-600`, or `label` (14/18 600) `--blue-600` for small links. No underline at rest; underline on press and on keyboard focus. The hit area is at least 44 tall, made with vertical padding and a matching negative margin so the layout doesn't move.

### Toast

Bottom-anchored, 12 above the tab bar, or 12 above the primary button if there's no tab bar. `--navy-900`, `--r-md`, padding 12 16, text white `body` 500, optional action `link` in #9CC6FF on the right. Enters translateY 16 → 0 and opacity 0 → 1 over 200 ms. Exits over 160 ms. Auto-dismisses at 4000 ms. `role="status"`.

### Demo strip

Required by project rule 6 until real data replaces demo data. Height 24, full width, `--navy-900`, text white `demo` centered: "Demo data". Sits directly under the safe-area top and pushes content down 24. On the university screen it overlays the hero. Controlled by `NEXT_PUBLIC_DEMO_STRIP` (default on).

### Unofficial footer line

`demo` style at weight 400, `--slate-600`, centered, max-width 320: "Unofficial planning tool. Not affiliated with UC, CSU, ASSIST, or any college." Appears on the welcome screen and the university screen. Required by `06-trust-and-provenance.md`.

### Empty state

This is also used for every screen the mockup didn't draw. Centered column, max-width 280, 48 above and below:
- icon 32 in a 72 circle of `--tint-sky`
- 16 gap, title `title-3` `--navy-900`
- 8 gap, body `body` `--slate-600`
- 20 gap, tinted button naming the next action

### Placeholder screen

The empty state above, used for every destination that isn't built yet. It must never trap the student: every version has a way out.

- **Back button**: circle button (00) with `ArrowLeft`, top = demo strip bottom + 8, left 16, `aria-label="Back"`. It uses history back, and when there's no history it goes to the fallback in the table below.
- The empty-state icon's top edge sits 120 below the back button's bottom edge.
- The version depends on where the student is:

| Where | Tab bar | Title | Body | Button → goes to |
|---|---|---|---|---|
| Signed out (auth links, Terms, Privacy) | No | This part isn't built yet | It's on the list. You can still sign in. | Back to sign in → `/sign-in` |
| Signed in, any route except `/` | Yes, with the matching tab active | This part isn't built yet | It's on the list. Your plan is still on the home screen. | Back to home → `/` |
| `/` while Home isn't built | Yes, Home active | Home isn't built yet | You're signed in. Sign out to test the sign-in flow again. | Sign out → clears `stackd.session` (keeps `stackd.seenWelcome`), then `/sign-in` |

The back button's fallback is the same as the button's destination. On `/`, where there's nothing to go back to, the back button is hidden.

### Inline error

Card with background `--coral-25`, `--r-md`, padding 16. `WarningCircle` fill 24 `--coral-700`, 12 gap, text column: title `headline` `--navy-900`, body `body` `--slate-700` 4 below. A tinted button "Try again" 12 below the body when retrying makes sense; no button when the fix is in the student's hands (e.g. a wrong password). Copy names what broke and the fix, e.g. "Couldn't load requirements" / "Check your connection, then try again." No apologies.

### Loading

Waits under 600 ms show nothing. Longer waits show the husky run loop, 72 × 72, centered, with `caption` `--slate-600` below it naming what's loading ("Loading requirements"). See `art-assets.md` for the frames. Until real frames exist, use the 2-pose fallback in `05-task-complete.md`. Reduced motion shows a single still frame.

## Interaction states (all tappable elements)

| State | Treatment |
|---|---|
| Pressed | Per component above. 120 ms ease-out in, 200 ms out |
| Focus-visible | 2 px `--blue-600` outline, offset 2 (3 on blue fills), radius follows the element |
| Disabled | Opacity 0.4, `aria-disabled` |
| Hit area | Minimum 44 × 44, even when the visible element is smaller (chevrons, 8 px dots are never targets alone) |

## Motion

| Token | Value |
|---|---|
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
