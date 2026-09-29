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

Rev 3 (September 2026). Target: `../mockup/welcome-reference.png`. The campus scene fills the whole screen, the husky and books stand on the plaza, the banner stays visible above the books, and everything adapts to any phone height.

```
┌───────────────────────────────┐  scene fills the screen
│                               │  safe-area top + 24 (16 on short screens)
│           stackd              │  wordmark 252 wide (150 on short screens)
│           ‿‿‿‿                │  40 (16)
│     Transfer plans,           │  display 38/42, centered
│      made simple.             │  12 (8)
│   Clear steps, real support,  │  body-lg 18/24, centered
│  and everything you need…     │
│  ▐banner      ╭─husky─╮  🏛    │  ≥ 8
│  ▐            │       │       │  banner: part of the scene, never covered
│ ┌books─┐      │       │       │
│ │PLAN   │─────┤       │       │  books in front of the husky's left side
│ │PREPARE│     ╰───────╯       │  husky feet on the plaza
│ │BELONG │═════════════════════│  plaza line (from the scene art)
│ └───────┘  plaza  plaza       │  books bottom = ground line
│ (       Get started      >)   │  16 below the ground line, 56 tall
│ Unofficial planning tool…     │  8 below the button
└───────────────────────────────┘  safe-area bottom + 12
```

Alignment: centered. No demo strip on this screen (it shows no demo records; see 00 → Demo strip).

### Why this layout works on every screen height

Your phone (393 wide, iPhone 14 Pro / 15 / 16 class) shows only about 647 of height in Safari, because Safari's bars take the rest of the 852. Installed to the home screen, it shows the full 852. Android phones in Chrome land around 700–800. The layout is built from three anchors, so the same picture holds at every height:

1. **The button** is fixed to the bottom.
2. **The husky and books** stand on lines measured up from the button.
3. **The scene** slides up or down so its plaza is always under the husky and books. That keeps them on the ground and keeps the banner above the books. On short screens it's the scene's sky that gets trimmed, and the sky scrim keeps the text readable over the tree tops.

### Lines everything sits on

- **Ground line** `G` = CTA top − 16. The book stack's bottom edge sits on it.
- **Husky line** = `G` − 24. The husky's bottom edge sits on it, so its paws sit behind and slightly above the front of the books, as in the reference.
- **Plaza line target** = `G` − 48. The scene is positioned so its plaza line lands here (see Layers, item 2). That puts the husky's paws 24 into the pavement and the whole bottom of the book stack on it, while trimming as little sky as possible.

At 393 × 647 (your phone in Safari): CTA top 539, `G` 523, husky line 499, plaza line 475.
At 393 × 852 installed: CTA top 710, `G` 694, husky line 670.

### Short screens (viewport under 760 tall)

| | Normal | Under 760 tall |
|---|---|---|
| Safe-area top to wordmark | 24 | 16 |
| Wordmark width | 252 | 150 |
| Wordmark to headline | 40 | 16 |
| Headline to body | 12 | 8 |

Font sizes don't change. At 393 × 647 the text block ends at about 219.

## Layers, back to front

1. **Page background**: `--sky-100`, full screen. It only shows while the scene art is loading or if it fails.
2. **Scene art** (`welcome-scene`): `position: fixed; left: 0; width: 100%; height: auto;` (its own proportions, so its height `S` = screen width × the image's height ÷ width). It's positioned vertically by its **plaza line**: the row where the low wall meets the pavement, at **73% of the image height** in the current art (verify against the file and use the measured value).
   - `top = (plaza line target) − 0.73 × S`
   - Clamp so the scene always covers the screen: `top` can't be above 0 (no gap at the top) or below `viewport height − S` (no gap at the bottom).
   - At 393 × 647: `S` ≈ 851, so `top` ≈ −146. The top 146 of sky is trimmed; the plaza, banner, and books all show, and the tree tops reach up behind the body text, where the sky scrim softens them.
   - At 393 × 852: `top` clamps to 0 and the whole scene shows.
   - Build it with a small layout hook that measures the CTA's top and the viewport height (ResizeObserver plus a resize listener) and sets `top`. Recalculate on rotation and when Safari's bars show or hide.
3. **Sky scrim**: keeps the text readable where the tree tops reach it (on short screens they do). `position: fixed; top: 0; left: 0; right: 0;` height = bottom of the body text + 32. Background: `linear-gradient(180deg, rgba(SKY,.85) 0%, rgba(SKY,.7) 70%, rgba(SKY,0) 100%)`, where SKY is the sky color near the top of `welcome-scene.png`, below its outer arc (#8AD1FD in the current art).
4. **Husky** (`husky-welcome`):
   - **Height** = the smallest of: 350; 40% of the viewport height; and the space from 8 below the body text down to the husky line. At 393 × 647 that's 259, the size it is now.
   - **Width** follows the image's proportions.
   - **Position**: bottom edge on the husky line, horizontal center at 54% of the screen width.
   - If the height would be under 160 (tiny phones like 320 × 568), hide the husky and the books.
5. **Books** (`welcome-books`): in front of the husky. Unchanged from rev 2, because the current relationship is right:
   - Width = husky width × 0.58; height follows the image's proportions.
   - Right edge = husky's left edge + 28% of the husky's width. Left edge may go past the screen edge.
   - Bottom edge on the ground line.
   - **Banner check**: the books' top edge must be at least 4 below the banner's bottom edge (the banner is at about 50–61% of the scene's height; measure it in the file). If a very short screen can't satisfy this, shrink the husky (and with it the books) until it does, down to the 160 floor.
6. **Bottom scrim**: `position: fixed; bottom: 0; height: calc(64px + env(safe-area-inset-bottom)); background: linear-gradient(180deg, rgba(234,246,254,0) 0%, rgba(234,246,254,.92) 24px);`. It sits under the footer line only. It must not reach the books.
7. **Content column**: the text at the top and the CTA stack at the bottom.

## Content

| Element | Spec |
|---|---|
| Wordmark | `wordmark.png` (trimmed), width 252 (150 on short screens), height auto, top = safe-area top + 24 (16 on short screens). `role="img"`, `aria-label="Stackd"` |
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

Check each of these at 393 × 647 (your phone in Safari), 393 × 852 (installed), 430 × 740 (Pro Max in Safari), 412 × 780 (typical Android in Chrome), and 375 × 548 (iPhone SE in Safari):

- The scene covers the whole screen, with no plain gap at the top or bottom.
- The husky's paws and the bottom of the books are on the plaza pavement, not in front of the wall or the trees.
- The banner is fully visible, and the books don't cover it.
- The whole book stack is visible, with 16 between it and the button.
- The books cover the husky's left side (backpack and back leg).
- The husky's top edge is at least 8 below the body text.
- The headline and body stay readable (the sky scrim softens any tree tops behind them).
- At 320 × 568 the husky and books are hidden and nothing overlaps.
- The CTA's bottom edge sits at least 12 above the home indicator.
- Deleting `welcome-scene` leaves a working screen on `--sky-100`.
