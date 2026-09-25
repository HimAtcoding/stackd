# 05 · Task complete, and mascot animation

Component: `<TaskComplete />`, a full-screen modal over the current screen. Mockup: `../mockup/mockup-task-complete.png`. That canvas is 393 × 699 (a 9:16 frame, shorter than a phone), so vertical positions below are rebuilt for 852-tall screens with top and bottom anchoring, not copied.

This file also specifies the husky run loop (last section), since it's the other mascot animation.

## When it opens

A full-screen celebration is for milestones. Everything smaller gets an inline confirmation.

| Event | Response |
|---|---|
| A journey step completes (a requirement linked to a step in `home.json` is marked done) | This modal, 400 ms after the row's check animation finishes |
| Any other item marked done | Inline check animation + toast "Marked complete" with "Undo" |
| The same step completes again in the same session (undo, then redo) | Toast only. The modal fires at most once per step per session |

Every Mobbin reference agrees on this split. [Duolingo's lesson flow](https://mobbin.com/flows/c199f9a9-7a91-4795-8ba5-5a3c24847009) confirms each correct answer with an inline "Good job!" band and saves full-screen art for the end of the lesson. [Monzo](https://mobbin.com/screens/f27bc928-e996-4df8-8465-9979e851e4ee), [Noom](https://mobbin.com/screens/2e3a5880-c24d-4e09-9648-370f3888f24f) and [KOHO](https://mobbin.com/screens/32326dcc-6bf6-4eb4-af5a-072883306f80) show full-screen celebrations only after a goal or setup completes. Those same screens set the bottom-stack model we use: one primary button at ~16 margins, with an optional quiet text action below.

Dev preview: `/?celebrate=1` opens the modal with demo copy.

## Layout

```
┌───────────────────────────────┐  --sky-200 → --sky-50
│ Demo data                     │
│(balloon)     stackd           │  wordmark 70 wide, 12 below strip
│             ╔═══════╗         │
│  ⸝⸝        ║ Great ║    ⸜⸜  │  celebrate 88/64, 3-layer outline
│   ⸝⸝       ║ job!  ║  (bal) │
│             ╚═══════╝         │
│                         (bal) │
│          ╭ husky ╮            │  flex zone, husky ≤ 196 × 286
│          │ jump  │            │  centered, shadow ellipse below
│          ╰───────╯            │
│       ~~~~ shadow ~~~~        │
│    You completed a task!      │  24/30 800, 12 above chip
│   ⸝ (✓ One step closer…) ⸜   │  chip 36
│                               │  24
│ (        Keep going        >) │  primary 56
│         View progress         │  link, 44 hit area, 4 below
└───────────────────────────────┘  safe-area bottom + 8
```

Alignment: centered.

### Vertical budget at 393 × 852

- Top stack: 59 safe + 24 strip + 12 + 20 wordmark + 16 + 128 headline = ends at 259.
- Bottom stack: 34 safe + 8 + 44 link + 4 + 56 CTA + 24 + 36 chip + 12 + 30 subhead = starts at 604.
- The husky zone (259 → 604 = 345) is `flex: 1`.
  - The husky image is `height: min(286px, 100% - 24px)`, `width: auto`, centered.
  - The shadow ellipse is 12 below its feet.
- At 375 × 667 the zone is ~233, so the husky renders ~209 tall. Nothing else moves.

## Layers, back to front

1. **Background**: `linear-gradient(180deg, var(--sky-200) 0%, var(--sky-50) 72%)`.
2. **Clouds**: `celebrate-clouds-top` (top 0, full width, height 220) and `celebrate-clouds-bottom` (bottom 0, full width, height 240). `alt=""`.
3. **Static confetti**: `confetti-static.svg`, full screen. The scattered pieces and stars as drawn.
4. **Balloons**: three separate images so each can float independently.
   - `balloon-blue-a`: 80 × 200, `left: -12`, top = safe + 0.
   - `balloon-blue-b`: 64 × 150, `right: -18`, top = safe + 96.
   - `balloon-yellow`: 60 × 150, `right: -10`, top = safe + 200.
5. **Confetti canvas**: `canvas-confetti`, full screen, `pointer-events: none`.
6. **Content**: wordmark, headline, husky + shadow, subhead, chip, buttons.

## Content

| Element | Spec |
|---|---|
| Wordmark | `wordmark.svg`, width 70, centered, 12 below the demo strip, `aria-hidden` (the dialog has its own label) |
| Headline | "Great job!", 2 lines ("Great" / "job!"). `celebrate` at **88 / 64**, weight 900, centered. Fitted to the mockup: "Great" measures 230 wide × 71 tall. Figtree 900 at 88 gives 236 wide. The line pitch of 64 is tight on purpose, as drawn. `id="tc-title"`, receives focus on open (`tabindex="-1"`) |
| Headline outline | Three stacked copies of the same text in one grid cell. **Back**: `-webkit-text-stroke: 16px #C3EAFD; color: #C3EAFD`. **Middle**: `-webkit-text-stroke: 10px #FFFFFF; color: #FFFFFF`. **Front**: `color: var(--navy-900)`, no stroke. Back and middle are `aria-hidden`. That gives 5 of white and 3 of pale blue outside the letterforms, matching the mockup |
| Burst dashes | `burst-dashes.svg`, 44 × 44, `--yellow-400`. Left: 16 left of "job!", vertically centered on it. Right: mirrored (`scaleX(-1)`), 16 right of "job!" |
| Husky | `husky-celebrate` (flat, demo) or the Rive rig (later), with `alt=""` |
| Shadow | CSS ellipse, 150 × 14, `radial-gradient(closest-side, rgba(5,16,66,.18), rgba(5,16,66,0))`, centered, 12 below the husky's feet. Not part of the husky art, so it can scale with the hop |
| Subhead | "You completed a task!" `24/30`, weight 800, `--navy-900`. Copy comes from the triggering step: default "You completed a task!", and a step may set its own (e.g. "Major preparation done!") |
| Chip | White pill, height 36, `--shadow-card`, padding 4 16 4 4. A 28 `--blue-600` circle with white `Check` bold 16, 10 gap, "One step closer to transfer" `17/22` weight 500 `--blue-700`. Flanked by `burst-dashes.svg` at 20 × 20, 12 outside each end (right one mirrored), `aria-hidden` |
| CTA | Primary button (00) "Keep going" with trailing chevron. Closes the modal and returns to the screen underneath |
| Link | "View progress", `link` `--blue-600`, centered, 44-tall hit area, 4 below the CTA. Closes the modal and navigates to `/`, where the new journey node animates (02) |

Dialog: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="tc-title"`, `aria-describedby` pointing at the subhead. Focus is trapped. Escape and the browser back gesture act as "Keep going". The body behind doesn't scroll.

## Entrance timeline

Everything is keyed from t = 0, when the modal mounts. Buttons are tappable from t = 0: the animation never blocks leaving.

| t (ms) | Element | Motion |
|---|---|---|
| 0 | Background + clouds | Opacity 0 → 1, 200 ms `--ease-out` |
| 0 | Balloons | translateY +40 → 0, opacity 0 → 1, 1200 ms `--ease-out`. Stagger 0 / 80 / 160 ms (a, b, yellow) |
| 120 | Headline (all 3 layers as one) | Opacity 0 → 1 over 150 ms. Scale 0.6 → 1, bouncy spring (overshoots to ~1.08 and settles by ~450 ms) |
| 120 | Confetti burst | One call per side: `origin: {x: 0.2, y: 0.35}` and `{x: 0.8, y: 0.35}`, `particleCount: 36` each, `spread: 70`, `startVelocity: 38`, `gravity: 0.9`, `ticks: 220`, `scalar: 0.9`, `colors: ['#0364FA','#4FA8F7','#FDC940','#FFFFFF']`, `shapes: ['square','circle']`, `disableForReducedMotion: true`. It fires once, with no loop |
| 200 | Husky | translateY 60 → 0, opacity 0 → 1, bouncy spring. Then the hop loop below |
| 200 | Shadow | scaleX 0.6 → 1, opacity 0 → 1, following the husky |
| 420 | Burst dashes (headline) | Scale 0.4 → 1 and opacity 0 → 1, 200 ms `--ease-out`, both sides together |
| 520 | Subhead | Opacity 0 → 1, translateY 8 → 0, 240 ms `--ease-out` |
| 600 | Static confetti | Opacity 0 → 1, 400 ms. This is the resting look once the burst has fallen away |
| 600 | Chip | Same as subhead |
| 700 | Chip check | Stroke draws via `stroke-dashoffset`, 300 ms `--ease-out` |
| 700 | CTA + link | Opacity 0 → 1, 200 ms |

**Husky hop loop**: starts once the entrance spring settles (~650 ms). Three hops, then it stops on the resting pose.
- Each hop is 600 ms. translateY 0 → -12 → 0 (`--ease-in-out` up, ease-in down).
- On landing: 80 ms squash, `scaleY(0.96) scaleX(1.03)` from the feet (`transform-origin: 50% 100%`).
- The shadow does scale 1 → 0.85 → 1 and opacity 1 → 0.7 → 1 in sync.

**Balloon float**: after the rise, each balloon drifts translateY 0 → -4 → 0 on a 4000 ms sine (`--ease-in-out`), phase-offset by 1300 ms per balloon. Two cycles, then they rest. These stop so nothing on screen moves forever.

**Exit**: modal opacity 1 → 0 over 200 ms. "View progress" starts the home push as the fade ends.

Haptic: `navigator.vibrate([12, 40, 12])` at t = 120 where supported. iOS web ignores it, and that's fine. No sound.

### Reduced motion

No confetti canvas, no springs, no hops, no float. Background, static confetti, balloons, headline, husky, subhead, chip, and buttons all appear together with one 200 ms opacity fade. Focus still moves to the headline.

## Rig upgrade (later)

The flat PNG can only move as a whole. Once the layered or Rive version of `husky-celebrate` exists (see `art-assets.md`), add these in-place motions on top of the hop, with no timing changes elsewhere:
- **Thumbs-up arm**: rotates -8° → 0° at each hop apex, pivot at the shoulder.
- **Tail**: wags ±10°, 300 ms per swing, through the whole hop loop.
- **Wink eye**: open → wink swap at t = 520 (as the subhead lands), back to open after 400 ms.
- **Motion lines**: opacity pulse 0.4 → 1 at each landing.

With Rive, all of this lives in one state machine with a `celebrate` trigger input, loaded by `@rive-app/react-canvas`, and the CSS hop is removed. Rive is the recommendation because the same file can carry the idle, wave, and run states for other screens.

## Test

- Mark "Major preparation" done in 03: the check completes, and 400 ms later the modal opens with focus on "Great job!".
- Press "Keep going" at t = 100 ms: the modal closes cleanly with no stray confetti left on the screen below.
- Reduced motion on: nothing translates or scales.
- At 375 × 667, the husky shrinks and nothing overlaps.
- Undo, then redo, the same step: toast only.

## Husky run loop

Used by the loading component (00) for waits over 600 ms. Display 72 × 72.

### What the supplied frames can and can't do

The sheet (`../mockup/husky-run-sheet.png`, 1774 × 887, transparent) is **8 frames, not 6**: a 4 × 2 grid of 443 × 443 cells. Measured:

- **The head never moves vertically.** The top of the head sits at the same y (17 px) in all eight frames. A run needs the body to rise on push-off and drop on contact, so this loop reads as sliding rather than running.
- **The legs don't cycle.** Frames 1–3 and 5–7 are nearly the same contact pose: the same front paw planted, the same back leg trailing. There's no passing pose where the back leg swings under the body, so the legs never swap. Frames 4 and 8 are a good flight pose.
- **Registration drifts.** The ground-shadow center wanders from 199 to 232 px across cells, so the loop jitters sideways.
- **Details redraw every frame.** Sweat drops, backpack straps, and face markings change shape between frames ("boiling"). This is the usual artifact of generating each frame separately.
- **Tone.** Sweat drops read as strain. A loading loop for anxious students probably wants a determined-but-fine version without the sweat. That's worth deciding before commissioning final frames.

Previews built from the sheet are in `docs/specs/previews/`:
- `run-raw-8-frames.gif`: as supplied, 12 fps.
- `run-registered-8-frames.gif`: same frames aligned on the shadow. The jitter is gone, but the stutter remains.
- `run-2-pose-fallback.gif`: the usable version for now.

### Demo implementation (2-pose fallback)

- Frames: cell 1 (contact) and cell 4 (flight), cropped to 443 × 443, aligned on the shadow center, exported at 216 × 216 as `husky-run-contact.png` and `husky-run-flight.png`.
- Alternate every 140 ms. On the flight frame, add translateY -6 (scaled to the 72 display; 14 px at source size).
- Shadow: a code ellipse 44 × 6, scaleX 0.85 on the flight frame.
- Implement as two stacked `<img>` elements toggling opacity (no layout shift), driven by `requestAnimationFrame`. Pause when the tab is hidden.
- Reduced motion: the contact frame, still.

### What to commission for the real loop

See `art-assets.md → husky-run`: 6 on-model frames with the body bob and a leg swap, on a fixed canvas with a fixed ground line and hip position, no baked shadow. Or a run state in the Rive rig.
