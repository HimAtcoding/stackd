# Art assets

Every piece of illustration the baseline needs, what state it's in, and exactly how to deliver it. Anything not on this list is built in code (gradients, pills, progress bars, the journey tracker, status icons, dots, the dash under the home subtitle) or comes from Phosphor icons. Don't commission those.

Status key:
- **Have (flat)**: exists only inside the mockup PNGs. It can't be used as-is: it's low-res, has baked-in backgrounds, and can't be edited.
- **Have (source)**: a usable file exists.
- **Need**: nothing usable yet.

Priority key:
- **Demo**: blocks the baseline demo.
- **Rig**: needed for the animation upgrade in 05.
- **Later**: listed so the style stays consistent when it's made.

## Delivery rules (all assets)

- **Raster**: PNG, sRGB, transparent background unless stated, at **3× the display size** listed. `next/image` generates 1× and 2×. Don't send 1× or 2× copies.
- **Vector**: SVG, text converted to outlines, no embedded rasters, colors as flat fills using the hex values from `00-foundations.md`.
- **Naming**: `kebab-case`, exactly as in the ID column. Files go in `public/art/<group>/`.
- **Trim**: 8 px of transparent padding at 3× on every side, and no more. Positioning in the specs assumes tight bounds.
- **No text in illustrations** unless this list says so. Text in art can't be translated, resized, or corrected.
- **Campus art**: no university names, lettering on signs, logos, seals, or mascots. Stackd is unofficial (`06-trust-and-provenance.md`), and campus marks are trademarks.
- **People**: illustrated, never photos of real people.

## 1 · Brand

| ID | What | Used in | Display size | Deliver | Status | Priority |
|---|---|---|---|---|---|---|
| `wordmark` | "stackd" lettering + blue swoosh under it. Navy `#051042`, swoosh `#0364FA` | Welcome (252 wide), Sign in and Create account (100), Home header (100), Celebration (70) | Aspect ~3.2:1 once trimmed (renders 252 × 80 on Welcome, 100 × 32 on Sign in) | One SVG, or a PNG with every fully transparent row and column trimmed off the edges (the art itself untouched). It must read cleanly at 70 wide | Have: `wordmark.png`, trimmed | Demo |
| `app-icon` | Square icon for the installable PWA. Probably the husky head or an "s" mark | Home screen, PWA install | 1024 × 1024 master | PNG master + a `maskable` version with all content inside the center 80% circle | Need | Later (before the first real user installs it) |
| `favicon` | Simplified mark | Browser tab | 32 | SVG | Need | Later |

## 2 · Husky character

The run frames show the character drifts off-model when each pose is generated separately (markings, backpack, and sweat drops change from frame to frame). A model sheet first keeps every pose below consistent.

| ID | What | Used in | Display size | Deliver | Status | Priority |
|---|---|---|---|---|---|---|
| `husky-model-sheet` | Reference, not shipped. Front, ¾, side, back. Face markings, ear shapes, hoodie with "S", backpack, tail. Color swatches (fur greys, hoodie `#0364FA` family, outline weight) | All husky art | n/a | PNG or PDF | Need | Demo (before new poses) |
| `husky-welcome` | Sitting, big open smile, backpack, yellow burst marks by its head. **Without** the book stack, sign, or campus | 01 Welcome | up to 276 × 350 | PNG 900 × 1140, transparent | Have | Demo |
| `husky-forgot` | Upper body like `husky-wave`, head tilted, holding a small key or scratching its head. Bottom edge cut straight across the chest. Same canvas as `husky-wave` so it drops into the same spot | 08 Forgot password, 09 Enter code (reset) | 144 × ~152 | PNG 528 × 558, transparent | Need (uses `husky-wave` until then) | Demo |
| `husky-home` | Bust, winking, fist raised, hoodie. The **bottom edge cut straight** across the chest (the journey card covers it). Yellow burst marks may be painted in, like `husky-wave` | 02 Home | 160 × ~140 | PNG 480 × 420, transparent | Need (only exists inside the mockup) | Demo |
| `husky-wave` | Upper body, waving paw raised, big smile, hoodie with "S", backpack straps, yellow burst marks painted in. **Bottom edge cut straight** across the chest (the sheet covers it) | 06 Sign in, 07 Create account (176 wide); 09 Enter code (confirm, 144 wide) | 176 × ~186 | PNG 528 × 558, transparent | Have | Demo |
| `husky-celebrate` | Mid-hop, thumbs up, winking, backpack, blue motion lines around it. **No ground shadow** (drawn in code) | 05 Celebration | 196 × 286 | PNG 588 × 858 | Have (flat) | Demo |
| `husky-celebrate-rig` | The same pose, split so parts can move. See the layer list below. Either a Rive `.riv` file (preferred) or a layered PSD/Figma file with each layer exported as its own PNG on a shared canvas | 05 Celebration | 196 × 286 canvas | `.riv`, or PNGs at 588 × 858 **each on the full canvas**, so they stack without positioning | Need | Rig |
| `husky-run` | 6-frame run loop, on-model. Details below | Loading (00) | 72 × 72 | 6 PNGs at 216 × 216, or one strip 1296 × 216, or a `run` state in the Rive file | Have: 8 AI frames that don't cycle (see 05). Fallback exported | Demo (fallback OK), final Later |
| `husky-run-calm` | The same run without sweat drops | Loading | as above | as above | Need | Later (decide first, see 05) |

### `husky-celebrate-rig` layers

Back to front. Every layer is drawn complete, including the parts hidden behind other layers, so rotating a limb doesn't reveal a hole.

1. `tail`: pivot at its base
2. `leg-back`
3. `backpack`
4. `body-hoodie`: torso with the "S", no arms or head
5. `leg-front`
6. `arm-fist`: the non-thumbs arm, pivot at the shoulder
7. `head`: no eyes or mouth
8. `eye-left-open`, `eye-left-wink`: one is shown at a time
9. `eye-right-open`
10. `mouth-open`
11. `arm-thumbs-up`: pivot at the shoulder
12. `motion-lines-left`, `motion-lines-right`

Mark each pivot point on a guide layer, or name it in the Rive bones.

### `husky-run` requirements

- 6 frames per cycle: contact, down, passing, up, flight, flight-down. At 12 fps that's a 500 ms stride.
- **Fixed canvas**: every frame on the same 512 × 512 canvas (it's scaled on export). Ground line at y = 470 in every frame, and the hip's horizontal position fixed at x = 256.
- **The body must bob**: the head rises about 4% of the canvas on the up and flight frames and drops on contact.
- **The legs must swap**: the leading paw alternates between strides.
- Same line weight and markings in every frame (trace from the model sheet).
- **No shadow** in the art.
- For now, `public/art/husky/husky-run-contact.png` and `husky-run-flight.png` are the two usable frames, cut and aligned from the sheet you sent. The contact frame's paw outline is slightly clipped where the baked shadow was removed. That's fine at 72 px and temporary.

### Husky poses for later states (not drawn yet, same model sheet)

| ID | Pose | For |
|---|---|---|
| `husky-looking` | Holding a map or magnifier | Empty states: no results, nothing saved yet |
| `husky-puzzled` | Head tilt, one ear down | Errors, "we don't cover this college yet" |
| `husky-wave-full` | Waving, full body | Rive idle state |

Priority: Later. Listed so they're made from the same sheet when the time comes.

## 3 · Scenes and decoration

| ID | What | Used in | Display size | Deliver | Status | Priority |
|---|---|---|---|---|---|---|
| `welcome-scene` | The **whole screen** behind Welcome: sky painted all the way to the top, soft clouds, a **generic** campus tower building (not a real campus), trees and hedges, the "Higher together" banner on a lamppost, ground. **No husky and no book stack** (both are separate layers). Match the reference's proportions: roughly the top 38% is sky and soft clouds, tree tops start around 38%, and the tower around 46%. The app positions the scene by its **plaza line** (where the low wall meets the pavement, about 73% down in the current art) so the husky and books always stand on the pavement; on short screens the top of the sky is what gets trimmed. If the art is ever re-exported, keep the plaza line, banner (about 50–61% down), and tree line at the same proportions, or update the numbers in 01. Keep the banner and the building inside the middle 80% of the width, since narrow phones crop the sides | 01 Welcome | full screen, 393 × 852 | PNG 1179 × 2556, opaque. The banner text is the only baked text allowed | Have (matches the reference). It's 852 × 1846, about 2.2× instead of 3×, so it looks slightly soft on a phone. Re-export at 1179 × 2556 with the same composition when convenient; not urgent | Demo |
| `welcome-books` | Only the book stack: PLAN / PREPARE / TRANSFER / BELONG, as drawn. Its left end may run off the left edge, as in the reference | 01 Welcome, in front of the husky | about 126 × 108 | PNG 480 × 410, transparent, trimmed tight to the stack (no empty rows or stray pixels around it) | Have, trimmed to 1219 × 836 | Demo |
| `welcome-scene` layered | The same, split: `clouds`, `building`, `trees`, `banner`, `books`, `ground`, each on the full canvas | 01 (later subtle parallax) | same | PNGs on a shared canvas | Need | Later |
| `home-clouds` | Very pale cloud band, no hard edges | 02 Home and 06 Sign in, top | 393 × 300 | PNG 1179 × 900, transparent | Have (flat) | Demo (can ship without; the screen works with the gradient alone) |
| `celebrate-clouds-top` | Cloud band for the top of the celebration | 05 | 393 × 220 | PNG 1179 × 660 | Have (flat) | Demo |
| `celebrate-clouds-bottom` | Cloud floor the husky "lands" in front of | 05 | 393 × 240 | PNG 1179 × 720 | Have (flat) | Demo |
| `balloon-blue-a` | Large blue balloon with a curly string | 05, top left | 80 × 200 | PNG 240 × 600 | Have (flat) | Demo |
| `balloon-blue-b` | Smaller blue balloon + string | 05, right | 64 × 150 | PNG 192 × 450 | Have (flat) | Demo |
| `balloon-yellow` | Yellow balloon + string | 05, right, lower | 60 × 150 | PNG 180 × 450 | Have (flat) | Demo |
| `confetti-static` | The scattered resting confetti and yellow stars, as drawn. **Keep the center column clear** (where headline, husky, and text sit): pieces only in the outer 70 px on each side, and the top and bottom 120 | 05 | 393 × 852 | SVG | Have (flat) | Demo |
| `burst-dashes` | The three-stroke "pop" mark (yellow), drawn once, pointing up-right. Mirrored and resized in code | 02 husky, 04 title, 05 headline and chip | 20–44 | SVG, `#FDC940`, single color, round caps, chunky strokes (width 4 at 28 × 28) to match the mockup | Have: drawn in code, strokes too thin | Demo |

## 4 · Campus art (a shared pool)

Campus images are **generic**: no school is named or recognizable, so any image can sit behind any university. The app picks one from a small pool for each university.

Spec for every image:
- **Display**: 393 wide × 248 tall, full-bleed at the top of the university screen.
- **Deliver**: PNG 1179 × 744, opaque. Keep the main subject inside the **safe zone**: the lower 60% of the height and the center 80% of the width. The top 100 display px sit under the status bar and a dark scrim, and the bottom 24 are covered by the sheet's rounded corner.
- **Style**: painterly, soft greens, blue sky, matching the rest of the art. **No lettering, signs, seals, logos, or mascots**, and no real campus's landmark buildings.
- **Folder**: `public/art/campus/`.

| ID | What | Status | Priority |
|---|---|---|---|
| `campus-1` … `campus-4` | Four generic campus scenes | Have (being added) | Demo |

**How a university gets its image** (no image is tied to a school by name):
1. If the university's data record has a `heroImage` field (for example `"heroImage": "campus-3"`), use that. Assigning images is a data choice, not code.
2. Otherwise, pick from the pool by a stable hash of the university's slug, so each school always shows the same image and different schools spread across the pool.
3. If the chosen file is missing, use the next one in the pool. If none exist, use the labelled placeholder.

Adding a fifth image later means dropping in `campus-5.png` and adding it to the pool list in one place in code. No screen spec changes.

No screen shows a **community college** image, so no CCC art is needed.

## 5 · People

| ID | What | Used in | Display size | Deliver | Status | Priority |
|---|---|---|---|---|---|---|
| `mentor-avatar-01` | Illustrated student portrait, as drawn in the feedback card | 04 Essays | 88 circle | PNG 264 × 264, subject centered in a circle-safe area, soft background fill included | Have (flat) | Demo |
| `mentor-avatar-02` … `-08` | Seven more in the same style, varied so any student can see themselves in the set | Mentors tab (later), feedback | 88 and 40 | same | Need | Later |

## 6 · Provider logos (from official kits, never drawn)

| ID | What | Used in | Display size | Get it from | Status | Priority |
|---|---|---|---|---|---|---|
| `logo-apple` | Apple's **left-aligned** logo file, black logo, for white buttons | 06, 07 Continue with Apple | full button height, 48 | Apple Design Resources → Sign in with Apple (developer.apple.com/design/resources) | Downloaded, not placed | Demo |
| `logo-google` | Google's standard-color "G" | 06, 07 Continue with Google | 20 × 20 | Google's Sign in with Google branding page → download bundle (developers.google.com/identity/branding-guidelines) | Downloaded, not placed | Demo |

Save to `public/art/brand/`. How to take each one out of its kit:

- **Apple**: use the left-aligned logo SVG exactly as supplied. It already contains the padding Apple requires, which is why it looks like a box with a small apple inside. Scale it to the button's height (48) and don't crop it.
- **Google**: the bundle only has whole buttons and icon buttons. Google's guidelines say a custom-size logo should start from one of the logo sizes in the bundle, so take the icon-only SVG and keep only the G itself, exactly as it is. In the current kit the G is one G-shaped mask filled with Google's own gradient, not separate paths; keep that as-is. Remove only the button's white fill and grey border, and frame the file to the G's own box. Don't change its shapes, colors, or proportions.
- Both logos must sit on a pure white button (`--white`).

## 7 · Not art (built in code or from the icon set)

Sky gradients, card surfaces, pills, progress bars, journey nodes and connectors, status icons, unread dots, the 28 × 4 dash under the home subtitle, the headline outline on "Great job!", the ground shadow under the husky, the toast, and every icon in the tab bar, tiles, and buttons (Phosphor, mapped in `00-foundations.md`).

## Demo-blocking checklist

In the order they unblock screens:

1. `wordmark`: every screen
2. `husky-home`: Home
3. `campus-1` … `campus-4`: University
4. `mentor-avatar-01`: Essays
5. `husky-welcome`, `welcome-scene` (full-screen re-export), `welcome-books`: Welcome
6. `husky-wave`, `logo-apple`, `logo-google`: Sign in and Create account
6b. `husky-forgot`: Forgot password
7. `husky-celebrate`, `balloon-*` ×3, `celebrate-clouds-*` ×2, `confetti-static`, `burst-dashes`: Celebration
8. `husky-model-sheet`: before any new pose is drawn

Until each arrives, the build uses a labelled placeholder: a `--tint-sky` block the same size with the asset ID in `caption` text. Layouts don't shift when the real file lands.

- **Small art** (under 48 on either side, like `burst-dashes` and the provider logos): the box shows no text. The asset ID goes in a `data-asset` attribute instead.
- **Background decoration** (`home-clouds`, `celebrate-clouds-*`, `confetti-static`): no placeholder at all. These have no layout role, and the screen is complete without them.
- **`logo-apple`** placeholder: 17 × 20, the Apple glyph's proportions.
