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

```
┌───────────────────────────────┐  safe-area top
│ Demo data                     │  24 strip
│                               │  24
│           stackd              │  wordmark, 252 wide, centered
│           ‿‿‿‿                │
│                               │  40
│     Transfer plans,           │  display 38/42, centered
│      made simple.             │
│                               │  12
│   Clear steps, real support,  │  body-lg 18/24, centered
│  and everything you need…     │
│                               │
│  [ full-bleed scene art:      │  anchored to bottom,
│    campus, sign, husky,       │  behind everything below
│    book stack ]               │
│                               │
│ ░░░░░░░ bottom scrim ░░░░░░░  │
│ (       Get started      >)   │  56, margins 16
│ Unofficial planning tool. Not │  12/16, 8 below CTA
│ affiliated with UC, CSU, …    │
└───────────────────────────────┘  safe-area bottom + 12
```

Alignment: everything is centered on the vertical axis. This is the only centered screen in the baseline.

## Layers, back to front

1. **Background**: `linear-gradient(180deg, var(--sky-200) 0%, var(--sky-100) 45%, var(--sky-50) 100%)`, full screen including under the status bar.
2. **Scene art** (`welcome-scene`): `position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 560px; object-fit: cover; object-position: center bottom;`. On viewports shorter than 760, height is `calc(100dvh - 300px)`, minimum 360.
3. **Husky** (`husky-welcome`): a separate image so it can animate later. It sits in a zone between the text and the bottom stack, and shrinks to fit that zone, so it never goes behind the text. The mockup has no status bar, so at full size it would overlap the body text on a real phone.
   - **Zone**: from 16 below the body text down to 176 + safe-area bottom above the bottom edge. Build it as a `flex: 1; min-height: 0` item in the page's column, with `padding-bottom: calc(176px + env(safe-area-inset-bottom))`.
   - **Husky**: `height: min(380px, 100%)`, `width: auto`, aligned to the zone's bottom, centered with translateX(-5%) (slightly left of center, as drawn, in front of the book stack).
   - At 393 × 852 the zone is about 265 tall, so the husky renders about 265 × 209. At 430 × 932 it's about 330 tall.
   - If the zone is under 160 tall (small phones like 320 × 568), hide the husky. The scene art still shows. Use a container query (`container-type: size` on the zone, `@container (max-height: 159px)`).
4. **Bottom scrim**: `position: absolute; bottom: 0; height: calc(152px + env(safe-area-inset-bottom)); background: linear-gradient(180deg, rgba(234,246,254,0) 0%, rgba(234,246,254,.92) 48px);`. The mockup has no scrim. It's needed because the disclaimer line sits over art. Minimal deviation.
5. **Content column**: the text at the top and the CTA stack at the bottom.

## Content

| Element | Spec |
|---|---|
| Wordmark | `wordmark.svg`, width 252, height auto (~70), top = safe-area top + 24 + 24 (after the demo strip). `role="img"`, `aria-label="Stackd"` |
| Headline | "Transfer plans, made simple." `display`, `--navy-900`, max-width 320, 40 below the wordmark. Break after "plans," (`<br>` at ≥ 360 wide, natural wrap below that) |
| Body | "Clear steps, real support, and everything you need to go further." `body-lg`, `--navy-900`, max-width 320, 12 below the headline |
| CTA | Primary button "Get started" with trailing chevron. Bottom = safe-area bottom + 12 + 16 (footer line) + 8. Navigates to `/sign-up` (`07-create-account.md`) with a 200 ms crossfade |
| Footer line | Unofficial footer (see 00), 8 below the CTA |

The book stack labels (PLAN / PREPARE / TRANSFER / BELONG) and the "Higher together" sign are part of the scene art, not live text. All-caps is banned in UI text, but the ban doesn't apply inside illustrations.

## States

- **Art not loaded**: the gradient shows alone, and text and CTA are fully usable. No spinner. Images use `next/image` with `priority` and `placeholder="empty"`.
- **CTA pressed / focus**: per 00.

## Motion

One non-triggered moment is allowed on this screen: after the art loads, the husky layer fades from 0 to 1 and moves translateY 12 → 0 over 320 ms `--ease-out`, 120 ms after the scene appears. Nothing else moves on load. Under reduced motion it simply appears.

## Accessibility

Reading order: wordmark, headline (`h1`), body, CTA, footer line. The scene and husky have `alt=""`, since they're decorative and the headline carries the meaning.

## Test

- At 320 × 568 (iPhone SE 1st gen), headline, body, CTA, and footer line don't overlap, the scene art shrinks, and the husky is hidden.
- At 393 × 852 the husky's top edge is at least 16 below the body text.
- At 430 × 932, the art stays anchored to the bottom with no gap under it.
- The CTA's bottom edge sits at least 12 above the home indicator.
- Deleting `welcome-scene` leaves a working screen.
