# 03 · University: requirements tab

Route: `/universities/[slug]?tab=requirements`. Demo slug: `uc-davis`. This is a pushed screen: it has no tab bar, and back returns to where the student came from. Mockup: panel 3 of `../mockup/mockup-4-screens.png`.

## Build notes (step 7)

- **Data already exists.** `data/seed/universities/uc-davis.json` and the shared status helper in `lib/requirements.ts` were made in step 6. Reuse them and add the write side here: marking a row writes `localStorage["stackd.requirements"]`, and Home must update right away when you go back.
- **Demo strip** shows on this screen and sits on top of the hero (00 → Demo strip).
- **Celebration isn't built until step 9.** Until then, when a row linked to a journey step is marked done, show the toast "Marked complete" with "Undo", the same as an unlinked row. Leave one clearly named function (for example `onJourneyStepCompleted`) where step 9 will open the celebration.
- **Hero art**: comes from the shared pool `campus-1` … `campus-4` in `public/art/campus/`, chosen as `art-assets.md → Campus art` describes (the university record's `heroImage` field if set, otherwise a stable pick by slug). Put the pool list in one place in code. No campus image is named after a school.
- **Destinations not built yet** open the signed-in placeholder: requirement detail (the row itself), "Track application", the Overview and Student life tabs (as in-page placeholders, not a new screen).
- **Push transition**: entering from Home slides in as 00 → Motion describes; Back reverses it. The tab bar is hidden on this screen.
- **Requirement rows keep their chevrons.** Unlike Home's tiles, a row's chevron signals that it opens a detail screen (coming in a later phase).

## Mobbin references

| Screen | What it grounds |
|---|---|
| [Fresha venue detail](https://mobbin.com/screens/a659b05e-4558-4a00-827f-927eb225db13) | Hero photo running under the status bar, ~44 floating circle buttons at safe-top + 8, content sheet overlapping the hero with top radius ~20 |
| [Tripadvisor trip](https://mobbin.com/screens/eec53131-f29c-4846-be41-86e9d1335c08) | Underline tabs: label ~15 semibold, ~2–3 indicator on a full-width hairline |
| [Lloyds offer details](https://mobbin.com/screens/63e426b6-785f-4002-89d0-346330d8954e) | Status stated in the same row as its icon, grouped list inside one bordered container with hairline dividers |

## Layout

```
┌───────────────────────────────┐
│[hero art, runs under status   │  248 tall from physical top
│ bar]  (←)               (♡)   │  circles at safe-top + 8 (+24 strip)
│                               │
│╭─────────────────────────────╮│  sheet starts 224, overlaps hero 24
││ UC Davis                    ││  title-1, 24 below sheet top
││ Public university • Davis,CA││  body-lg muted, 4 below
││                             ││  16
││ Overview Requirements S.life││  underline tabs, 44
││───────────▀▀▀▀▀▀▀──────────││
││ Transfer requirements       ││  title-2, 24 below divider
││ Track your progress and…    ││  body muted, 4 below
││┌───────────────────────────┐││  16
│││◉ Transferable units Complete>│││  rows 52
│││◔ GPA requirement In progr. >│││
│││○ Major preparation Not st.>│││
│││○ Application mat. Not st. >│││
││└───────────────────────────┘││  16
││(     Track application    >)││  primary 56
││┌───────────────────────────┐││  16
│││🔔 Deadline coming soon     │││  amber banner
│││   Your application is due…│││
││└───────────────────────────┘││  16
││ Unofficial planning tool. … ││  footer line
│╰─────────────────────────────╯│  safe-area bottom + 24
└───────────────────────────────┘
```

Alignment: left. Text at x 24, containers at 16.

## Hero

- Hero image from the campus pool (see Build notes). `position: relative; height: 248px;` measured from the physical top of the screen, so it runs under the status bar. `object-fit: cover; object-position: center 60%;`. The mockup's hero is 195 tall with no status bar. 248 keeps about the same visible image once the status bar and demo strip sit on top.
- Status-bar scrim (not in the mockup, needed for legibility on busy art): `linear-gradient(180deg, rgba(5,16,66,.28) 0, rgba(5,16,66,0) 96px)` over the top of the hero. Set `<meta name="theme-color">` to match, and use `apple-mobile-web-app-status-bar-style: black-translucent` in the PWA.
- **Missing art**: fall back to the next image in the pool, then the labelled placeholder. Never an empty box.
- Hero `alt=""`. The university name is the `h1` below.

**Back** and **Save**: circle buttons (00), top = safe-area top + 24 (demo strip) + 8, left 16 and right 16.
- Back: `ArrowLeft` bold 22, `aria-label="Back"`. Uses history back. With no history, goes to `/`.
- Save: `Heart` regular 22 `--navy-900`, `aria-label="Save UC Davis"`, `aria-pressed`. When saved: `Heart` fill `--coral-500`, and the icon plays scale 1 → 1.2 → 1 on the bouncy spring (triggered motion). Stored in `localStorage["stackd.saved"]`.

## Sheet

`position: relative; margin-top: -24px;` `--surface`, `border-radius: 24px 24px 0 0`, `box-shadow: 0 -8px 24px rgba(5,16,66,.06)`. Padding-bottom = safe-area bottom + 24.

| Element | Spec |
|---|---|
| Title | `{university.name}`, `title-1`, `--navy-900`, `h1`, x 24, 24 below the sheet top |
| Meta | `{university.type}` • `{university.city}`: `body-lg` 400 `--slate-600`, 4 below the title. The bullet is a 4 × 4 `--slate-600` circle with 8 on each side, `aria-hidden`, with text read as "Public university, Davis, CA". Middle-dot meta strings are on the banned list; this one is kept because it's drawn |
| Tabs | Underline tabs (00), 16 below the meta. Three equal columns across the sheet minus 8 on each side. Labels: "Overview", "Requirements", "Student life". Only Requirements has content. The other two render the placeholder empty state below the divider, and the URL updates `?tab=` without a push |

## Requirements tab content

- "Transfer requirements": `title-2`, `h2`, x 24, 24 below the tab divider.
- "Track your progress and see what's next.": `body` `--slate-600`, 4 below.
- **List container**: 16 below. Margins 16, `--surface`, 1 px `--border`, `--r-md`, `--shadow-card`, `overflow: hidden`.

**Requirement row**: height 52 (as drawn, above the 44 minimum), padding 0 16 0 20, 1 px `--border` divider between rows (none after the last). Columns:

| Column | Width | Content |
|---|---|---|
| Status control | 28 (hit area 44 × 44) | Status icon (00) |
| Gap | 20 | |
| Title | flex 1 | `row-title` `--navy-900`, single line, ellipsis |
| Status text | 88, left-aligned | `body`, `--slate-600`: "Complete" / "In progress" / "Not started" |
| Gap | 12 | |
| Chevron | 20 | `CaretRight` bold `--navy-900`, `aria-hidden` |

The status text column is fixed-width and left-aligned, so the three labels line up as drawn.

**Two tap targets per row:**

1. **Status control** (the circle). Marks the requirement done. This is the v0 checkbox from `09-mvp-scope.md`: state lives in `localStorage["stackd.requirements"]`, and it survives reload. `role="checkbox"`, `aria-checked`, `aria-label="Mark {title} complete"`.
   - Tap on not started or in progress → done. The ring crossfades to the green fill over 120 ms, the fill scales 0.6 → 1 on the bouncy spring, the check draws over 180 ms, and the status text crossfades to "Complete" over 150 ms. Light haptic where supported (`navigator.vibrate(10)`; silently no-op on iOS).
   - Tap on done → returns to its previous status (stored), with the same animation reversed at 120 ms.
   - After a change to done: if the requirement is linked to a journey step (02), open the celebration (05) 400 ms after the check finishes. Otherwise show a toast: "Marked complete" with action "Undo".
2. **Rest of the row**. Opens the requirement detail. Not built in the baseline, so it shows the placeholder screen. Pressed: `--surface-pressed`.

Demo data (`universities/uc-davis.json`):

```json
{ "demo": true, "slug": "uc-davis", "name": "UC Davis", "type": "Public university", "city": "Davis, CA",
  "requirements": [
    { "id": "ucd-units",     "title": "Transferable units",    "status": "done" },
    { "id": "ucd-gpa",       "title": "GPA requirement",       "status": "in_progress" },
    { "id": "ucd-majorprep", "title": "Major preparation",     "status": "not_started" },
    { "id": "ucd-materials", "title": "Application materials", "status": "not_started" }
  ],
  "reminder": { "title": "Deadline coming soon", "body": "Your application is due in 2 weeks. Keep going — you're on track!", "dueInDays": 14 } }
```

## Primary action

"Track application": primary button (00) with trailing chevron, 16 below the list container, margins 16. Leads to the placeholder screen.

## Reminder banner

16 below the button. Margins 16, `--amber-50`, `--r-md`, padding 16 20, no shadow, `role="note"`.
- `Bell` fill 28 `--amber-500`, top-aligned with the title, `aria-hidden`.
- 16 gap to the text column.
- Title: `headline` `--navy-900`.
- Body: `body` `--slate-700`, 4 below.
- Rendered only when `reminder` exists and `dueInDays` ≤ 14. The body's "in 2 weeks" is generated from `dueInDays`, the same way as the home pill.

## Footer line

Unofficial footer (00), 16 below the banner.

## States

- **All four done**: the rows show done. The banner stays if the reminder exists. The celebration has already fired (see above).
- **Requirements missing** (`requirements: []`): the list container is replaced by the empty state. Title "No requirements loaded for this school", body "We don't have this school's requirements yet.", button "Back to home".
- **Load failure**: inline error (00) in place of the list: "Couldn't load requirements" / "Check your connection, then try again." / "Try again".

## Motion

Push in and out per 00. Tab indicator slide. Status control and heart animations as above. Nothing on load.

## Test

- Mark "Major preparation" done, then reload: it's still done. Home shows "4 of 6", the fifth node is green, and it has no connector because node four (GPA) is still open.
- Double-tap the control quickly: the final state matches the tap count, and the celebration opens at most once.
- VoiceOver reads each row as "Mark GPA requirement complete, checkbox, not checked", and separately as a link "GPA requirement, In progress".
