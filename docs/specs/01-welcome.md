# 01 · Welcome

Route: `/welcome`. Shown on first launch only. After "Get started", set `localStorage["stackd.seenWelcome"] = "1"`, and later launches skip it: signed in goes to `/`, signed out goes to `/sign-in` (see `flows-and-states.md`). Read and write it in try/catch. If storage fails, show welcome again rather than crash.

Mockup: panel 1 of `../mockup/mockup-4-screens.png`.

## Mobbin references

| Screen | What it grounds |
|---|---|
| [Jomo welcome](https://mobbin.com/screens/4fdbf9dd-9616-46c2-a3aa-42328c22e755) | Single CTA at ~16 margins, ~58 tall, ~4 above the home indicator |
| [Rodeo welcome](https://mobbin.com/screens/0918d7b7-2c6f-4848-b8dd-6ffd632674bd) | Legal/terms line under the CTA in 12 px muted text: the model for our unofficial line |
| [Cash App welcome](https://mobbin.com/screens/cd9c2685-84d5-4e7b-ab20-cd6c85865256) | Illustration between headline and CTA, CTA ~52 tall |
| [Lloyds welcome](https://mobbin.com/screens/fc3c5366-03ed-4659-a768-196dda251f75) | Centered headline + 2-line subtitle, generous gap to art |

## Layout

Rev 2 (September 2026): the team's full-screen reference (`../mockup/welcome-reference.png`) replaces panel 1 as the target. The campus scene fills the whole screen, and the book stack sits in front of the husky's left side, fully above the button.

```
┌───────────────────────────────┐  scene art fills the whole screen,
│ Demo data                     │  sky painted in, from the very top
│                               │  24
│           stackd              │  wordmark 252 wide, centered
│           ‿‿‿‿                │  40
│     Transfer plans,           │  display 38/42, centered
│      made simple.             │  12
│   Clear steps, real support,  │  body-lg 18/24, centered
│  and everything you need…     │
│                               │  ≥ 16
│  ▐banner    ╭─husky──╮  🏛    │  husky: bottom on the husky line,
│  ▐          │        │        │  centered at 54% of the width
│ ┌books┐     │        │        │  books: in front of the husky,
│ │PLAN  │────┤        │        │  flush left, bottom on the ground line
│ │PREPARE│   ╰────────╯        │
│ │TRANSFER│                    │  books bottom = ground line
│ │BELONG │                     │  24
│ (       Get started      >)   │  56, margins 16
│ Unofficial planning tool. Not │  12/16, 8 below CTA
│ affiliated with UC, CSU, …    │
└───────────────────────────────┘  safe-area bottom + 12
```

Alignment: everything is centered on the vertical axis. This is the only centered screen in the baseline.

### Two lines everything sits on

- **Ground line** = CTA top − 16. The bottom edge of the book stack sits on it.
- **Husky line** = ground line − 12. The husky's bottom edge sits on it, so its paws sit just behind the front edge of the books, as in the reference.

At 393 × 852 (installed app): CTA top 710, ground line 694, husky line 682.

### Short screens (viewport under 760 tall)

In Safari, the browser bars leave only about 650–700 of height, and the reference was drawn for a full 852. Below 760 tall, the text block tightens so the husky keeps its size:

| | Normal | Under 760 tall |
|---|---|---|
| Strip to wordmark | 24 | 16 |
| Wordmark width | 252 | 180 |
| Wordmark to headline | 40 | 20 |
| Headline to body | 12 | 8 |

Font sizes don't change.

## Layers, back to front

1. **Page background**: `--sky-100`, full screen. It only shows while the scene art is loading or if it fails.
2. **Scene art** (`welcome-scene`): fills the whole screen, including under the status bar. `position: fixed; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top;`. The sky is painted into the art, so there is no CSS gradient over it and no seam. **Anchor to the top, not the bottom.** On screens shorter than the art's proportions (Safari with its bars showing), anchoring to the top trims the empty plaza at the bottom. Anchoring to the bottom would trim the sky instead and push the trees up behind the text. The husky and books are separate layers placed from the button, so they stay put either way.
3. **Sky scrim**: keeps the text readable where the tops of the trees reach the body text (they do slightly at full height with the status bar and demo strip). `position: fixed; top: 0; left: 0; right: 0;` height = bottom of the body text + 32. Background: `linear-gradient(180deg, rgba(SKY,.85) 0%, rgba(SKY,.7) 70%, rgba(SKY,0) 100%)`, where SKY is the RGB of the scene's own sky, sampled from the top-center of `welcome-scene.png`. Over plain sky it's invisible; over trees it softens them behind the text.
4. **Husky** (`husky-welcome`): a separate image so it can animate later.
   - **Zone**: from 8 below the body text down to the husky line. Build it as a `flex: 1; min-height: 0` item in the page's column.
   - **Size**: `height: min(350px, 100%)`, `width: auto`. At 393 × 852 installed, the zone is about 313 tall, so the husky is about 313 × 247. In Safari at about 393 × 650, it's about 250 × 197.
   - **Position**: bottom edge on the husky line, horizontal center at 54% of the screen width.
   - If the zone is under 160 tall (small phones like 320 × 568), hide the husky and the books. The scene still shows. Use a container query (`container-type: size` on the zone, `@container (max-height: 159px)`).
5. **Books** (`welcome-books`): in front of the husky. Their size and position come from the husky, so the overlap looks like the reference at every screen size:
   - **Width** = the husky's rendered width × 0.58. Height follows the image's own proportions.
   - **Right edge** = the husky's left edge + 28% of the husky's width. So the stack covers roughly the left quarter of the husky: its backpack and back leg.
   - **Bottom edge** on the ground line.
   - The left edge can go past the screen edge (negative `left`). On bigger screens the stack runs off the left side, as drawn.
   - At 393 × 852 installed: husky 247 wide with its left edge at 89, so the books are about 143 wide, right edge at 158, left edge at 15.
6. **Bottom scrim**: `position: fixed; bottom: 0; height: calc(64px + env(safe-area-inset-bottom)); background: linear-gradient(180deg, rgba(234,246,254,0) 0%, rgba(234,246,254,.92) 24px);`. It sits under the footer line only, so the disclaimer stays readable over the art. It must not reach the books.
7. **Content column**: the text at the top and the CTA stack at the bottom.

## Content

| Element | Spec |
|---|---|
| Wordmark | `wordmark.svg`, width 252, height auto (~70), top = safe-area top + 24 + 24 (after the demo strip). `role="img"`, `aria-label="Stackd"` |
| Headline | "Transfer plans, made simple." `display`, `--navy-900`, max-width 320, 40 below the wordmark. Break after "plans," (`<br>` at ≥ 360 wide, natural wrap below that) |
| Body | "Clear steps, real support, and everything you need to go further." `body-lg`, `--navy-900`, max-width 320, 12 below the headline |
| CTA | Primary button "Get started" with trailing chevron. Bottom = safe-area bottom + 12 + footer line height (32 when it wraps to two lines) + 8. Navigates to `/sign-up` (`07-create-account.md`) with a 200 ms crossfade |
| Footer line | Unofficial footer (see 00), 8 below the CTA |

The book stack labels (PLAN / PREPARE / TRANSFER / BELONG) and the "Higher together" sign are part of the art, not live text. All-caps is banned in UI text, but the ban doesn't apply inside illustrations.

## States

- **Art not loaded**: the `--sky-100` background shows alone, and text and CTA are fully usable. No spinner. Images use `next/image` with `priority` and `placeholder="empty"`.
- **CTA pressed / focus**: per 00.

## Motion

One non-triggered moment is allowed on this screen: after the art loads, the husky and books fade together from 0 to 1 and moves translateY 12 → 0 over 320 ms `--ease-out`, 120 ms after the scene appears. Nothing else moves on load. Under reduced motion it simply appears.

## Accessibility

Reading order: wordmark, headline (`h1`), body, CTA, footer line. The scene, husky, and books have `alt=""`, since they're decorative and the headline carries the meaning.

## Test

- At 393 × 852 the scene covers the whole screen, top to bottom, with no band of plain gradient anywhere.
- At 393 × 852 the whole book stack is visible above the button, with 16 between the stack and the button.
- In iPhone Safari (about 393 × 650 visible), the husky is at least 240 tall and the headline stays readable over the scene.
- The book stack is in front of the husky and covers part of its left side.
- The husky's top edge is at least 16 below the body text.
- At 320 × 568, headline, body, CTA, and footer line don't overlap, and the husky and books are hidden.
- At 430 × 932, the scene still covers the whole screen.
- The CTA's bottom edge sits at least 12 above the home indicator.
- Deleting `welcome-scene` leaves a working screen on `--sky-100`.
