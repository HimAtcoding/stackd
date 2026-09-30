# Build status

Last updated 2026-09-30. Build order steps 1–6 from `docs/specs/README.md` are done. Read this before starting step 7. It lists what exists, what's left, what's still undecided, and where the build differs from the specs.

## Built

| Step | What | Where |
|---|---|---|
| 1 | Tokens as CSS variables (`app/globals.css`), with Tailwind's default colors, radii and shadows switched off so only spec tokens exist. Figtree, Phosphor, every shared component in 00 with all its states, demo strip (component only, see below), placeholder screen | `components/ui/`, `/dev/components` |
| 2 | Welcome, rev 3 (scene placed by its plaza line, sky scrim, husky sized to fit the screen, books sized from the husky and in front, banner check, tighter text under 760 tall, no wordmark under 600 tall) | `app/welcome/` |
| 3 | Sign in, the auth interface, demo auth, and the signed-out redirect | `app/sign-in/`, `lib/auth/`, `app/(app)/session-gate.tsx` |
| 4 | Create account | `app/sign-up/` |
| 5 | Forgot password, rev 2 (husky, hidden below 372 wide, both states, resend) | `app/forgot-password/` |
| 6 | Home, rev 2 (02 and 00 as of `b1ef3b8`): greeting from `stackd.profile` (demo name otherwise), husky hung from the greeting behind the journey card, journey card with all six circles on a track, shortcut tiles and upcoming cards without chevrons, the empty upcoming line, demo strip | `app/(app)/page.tsx`, `app/(app)/_home/`, `data/seed/` |

Also in place:
- **Placeholder screen**, all three versions from 00 (signed out, signed in, `/`), each with the back button. `/explore`, `/essays`, `/mentors`, `/events`, `/notifications`, `/universities/[slug]` (until step 7) and `/upcoming/[id]` use the signed-in version. The `/` version (Sign out) is no longer shown anywhere, since Home replaced it. `/terms` and `/privacy` pick the signed-in or signed-out version from the session.
- **Shared auth parts** in `components/auth/`: the screen background and top block, the sheet, the social buttons, the password toggle, and the switch line.
- **Art loading.** `components/art.tsx` renders the real file when it exists in `public/art/` (`.svg` first, then `.png`). It reads the file's own proportions from the file. When a file is missing it renders the labelled placeholder from `art-assets.md`.
- **Demo strip only where demo records show.** The root layout doesn't render it. A screen that shows demo records (Home, University, Essays, the celebration) renders `<DemoStrip />`; `--strip-h` is 0 unless one is on the page (`:root:has([data-demo-strip])`). Home is the only one built so far.
- **Installable PWA.** `app/manifest.ts` (standalone, name, colors, icons) and `appleWebApp` in `app/layout.tsx`. Chromium reports no manifest or installability errors.
- **Welcome layout hook.** `app/welcome/welcome-frame.tsx` measures the CTA, the text and the viewport, and `welcome-layout.ts` does the math (01 → Lines). CSS computes the same scene position for the first paint, so nothing jumps when the hook runs.
- **Seed data.** `data/seed/home.json` and `data/seed/universities/uc-davis.json`, read on the server by `lib/seed.ts`. A missing or broken file gives `null`, and the screen shows its empty states. Every record has `"demo": true`.
- **Requirement status helper for step 7.** `lib/requirements.ts`: `useRequirementStatuses(requirements)` gives the seed status overridden by `stackd.requirements`, and `stepStatus()` gives a journey step its linked requirement's status. It re-reads on the `storage` event (other tabs) and on `stackd:requirements` (same tab). Step 7 should fire that event after it writes the key. `lib/due.ts` has the pill wording ("In 2 weeks"), which 03's banner can reuse.
- **Session.** Every route in the `app/(app)` group needs `stackd.session`. Without it, the student goes to `/welcome` if Welcome hasn't been seen, otherwise to `/sign-in`.

Art in use: `wordmark.png` (trimmed), `welcome-scene.png`, `welcome-books.png` (cropped to the stack, 1219 × 836), `husky-welcome.png`, `husky-wave.png`, `husky-forgot.png`, `husky-home.png` (1341 × 1173, no burst marks painted in, not winking; the art is the source of truth), `burst-dashes.svg` (drawn in the repo: three round-capped strokes, `#FDC940`, width 3 at 28 × 28, fanned like the marks in `husky-wave`), `logo-apple.svg` and `logo-google.svg`. Temporary app icons (`public/icons/`, `app/apple-icon.png`) are cut from `husky-welcome`'s head on `--sky-200`. The two husky run-loop frames are used by the loading component.

Still placeholders or missing: `app-icon` (temporary icons above until it exists), `home-clouds` (background decoration, so it draws nothing when missing).

## Left in the build order

| Step | Build | Notes |
|---|---|---|
| 7 | University requirements (03) | Mark-done and local storage. Reuse `useRequirementStatuses` and write `stackd.requirements`, then fire `stackd:requirements`. The seed file already exists |
| 8 | Essays (04) | |
| 9 | Task complete and the run loop (05) | `motion` and `canvas-confetti` aren't installed yet, because nothing in steps 1–5 needs them |

Not built yet, though 00 and 02 describe them: each tab keeping its own scroll position (tab bar), the push and back transitions for the university screen, and Home's "View progress" node animation (it needs `motion` and the step 9 celebration).

## Open items

1. **"3 new messages" still truncates at 393 wide.** Without the chevron (00 rev 2) the tile text gets 94.5. "Requirements" (89) and "1 in progress" (76) now fit, but "3 new messages" needs 97, so it shows "3 new messag…". 00 allows the ellipsis when text doesn't fit; the mockup shows it in full. It fits at 430 wide.
2. **A phone can hold stale dev CSS.** A page opened before a change keeps the stylesheet it first loaded. Navigating inside the app (for example Create account → Home) fetches the new code but not the new CSS unless the dev server's live-reload connection is up. Home then showed the header against the screen edges, no dash, and the husky dropped into the tiles, all from missing utility classes. Fix: pull to refresh, or open `/dev/reset`, which ends in a full page load.
3. **`/dev/components` ships in production builds.** `/dev/reset` is excluded (see How to run); the components page could use the same `page.dev.tsx` naming.
4. **The book stack is flatter than the reference.** The cropped art is 1.46 : 1. The stack in `welcome-reference.png` is about 1.1 : 1, with thicker books. Sized at 58% of the husky's width, the stack is about 107 tall at 393 × 852 (device mode), against about 140 in the reference, so it covers less of the husky's lower body. Matching it needs new art, not a code change.
5. **`welcome-scene.png` is 852 × 1846, not 1179 × 2556.** The proportions are right, but it's about 2.2× resolution on a 3× phone, so it looks slightly soft. The building's right edge also sits just outside the middle 80% of the width.
6. **Dev-server image stalls.** A dev server that had been running for days stopped finishing Next's image-optimizer request for `husky-wave` and `husky-forgot` at 256 wide as WebP. Only a 1× desktop window asks for that size. The husky stayed invisible because it only fades in once its image loads.
   - Restarting the server fixed it, and a fresh server answers the same request in about 0.2 s.
   - The app now also counts an image that finished loading before hydration (commit `d224620`).
   - If art goes missing in a browser during development, restart `npm run dev`. Don't delete `.next/dev/cache/images` while the server is running.
   - After replacing an art file, clear that cache or restart. Otherwise the optimizer keeps serving the old image under the same URL.
7. **Apple logo terms.** Apple's design-resources license says the files are for mock-ups of apps on Apple platforms. It's approved for this demo; re-check before any public launch (06 says the same).
8. **Untested outside a real iPhone:** iOS password autofill (06), the iOS strong-password suggestion (07), the page keeping a focused field above the on-screen keyboard, and Add to Home Screen opening full screen. Also the real safe-area insets; tests simulated them with 59 top and 34 bottom.
9. **Status bar text is white when installed.** `black-translucent` is the only iOS status bar style that lets the art run under the status bar, which the specs' safe-area numbers assume. Its clock and icons are white over light sky, so they're low contrast. The alternative (`default`) gives a solid bar with dark text, and the safe-area top becomes 0. Check it on the phone and decide.
10. **The Playwright test scripts aren't in the repo.** Screens were checked against each spec's Test section with throwaway scripts. A committed test setup is still to be decided.

## Built differently from the specs, and why

### Art and logos
- **Google "G".** art-assets says to keep "the four colored G paths". The current Google bundle has no such paths: its G is one G-shaped mask filled with a conic gradient and blurred colour shapes. `logo-google.svg` is the Android + Web light icon with only the button's white fill and grey border removed, and the view box framed to the G's own 20 × 20 area. Everything else is byte-identical. art-assets should be reworded to match.
- **Apple logo is 46 tall, not 48.** It fills the button's inner height (48 minus the 1 px border on each side). At 48, the logo file's white box would cover the button's border.
- **Social button pressed state.** 00 asks for a `--surface-pressed` overlay at 60%. It's applied with `mix-blend-mode: multiply`, so the button and Apple's white logo box tint evenly while the dark label stays at full contrast. A plain overlay would wash the label out.
- **Wordmark is 3.17 : 1 once trimmed, not ~3.6 : 1** as art-assets expects. It renders 252 × 80 on Welcome and 100 × 32 on Sign in and Create account.

### Layout
- **Welcome sky scrim is positioned inside the text block, not `position: fixed`.** Its height has to follow the text (bottom of the body + 32), which changes with wrapping and the short-screen spacing. It's absolute in the text block and reaches the page top. Above 480 wide it covers only the 480 column; there the scrim sits over plain sky, so its edges don't show.
- **Welcome husky zone clips sideways.** The zone has `overflow-x: clip`, so on screens wider than 480 the books run off the column's edge, not into the page margin.
- **Welcome's scene lines are measured, not 01's estimates.** The plaza line is row 1362 of 1846 (73.8%, where the left low wall meets the pavement; the right planters end at 73.2%), not 73%. The banner's bottom edge with its outline is row 1105 (59.9%). So at 393 × 647 the scene's top is −153, not about −146. CTA top 539, ground line 523, husky line 499 and plaza line 475 match 01, and the husky is 259 tall.
- **Welcome's scene grows to the viewport height** when the phone is taller than the art's proportions (393 × 852 is 0.4 taller than 393 wide × 2.167), so there's never a sliver of gap. It's still `object-fit: cover`, so the extra is a sub-pixel crop at the sides.
- **Welcome at 393 × 852 installed** (59 top, 34 bottom): CTA top 710, ground line 694, husky line 670, as in 01. The husky is 316 tall (the zone limits it before 40% of the viewport does), and the books are 144 wide with their left edge at 13.
- **Sign in and Create account at 320 wide.** The headline's 190 max-width runs into the 144-wide husky, so the headline and subtitle are layered in front of it.
- **Welcome under 600 tall** has no wordmark, and the headline starts at safe-area top + 16. At 375 × 548 the body text ends at 156, above the banner's top at 184, and the husky is 219 tall. 320 × 568 is also under 600, so the wordmark hides there too and the husky is 227 tall, as 01's test now says.
- **Home greeting under 360 wide.** 02 caps the text at 200, but at 320 the 128-wide husky starts at x 180, so 200 runs under it. Under 360 the cap is the husky's left edge minus 8 (148 at 320). The subtitle wraps to two lines there, and a long name wraps mid-word (`overflow-wrap: anywhere`) instead of running under the husky.
- **Home journey card at 320.** The title row grows when "Your transfer journey" wraps, so the card is 126 tall there, not 100. A fixed 26 row put the second line on top of the nodes.
- **Home husky with no journey data.** 02's `bottom: -36` assumes the journey card follows. Without journey data the 32 gap stays, so the husky ends 8 above the tiles, not over them.
- **Home seed data in production builds.** `/` is prerendered, so `data/seed/` is read at build time. Editing or deleting a seed file needs a rebuild there; `next dev` reads it on every request.
- **Home upcoming records have an `id`** (`application-deadline`, `transfer-panel`) so each card links to `/upcoming/[id]`. 02's records don't list one.
- **Home pill from `dueInDays`.** 02's text says the pill comes from `dueDate`, but its demo record has `dueInDays: 14`, so the build reads `dueInDays`. Cards sort soonest first, and undated ones go last.
- **Welcome needs a definite height.** It uses `h-dvh min-h-fit`. With only `min-height`, Chromium reports the husky zone as 0 tall to the container query (the first-paint fallback for the husky's height), and the husky and books never show.
- **Sign in in installed-app mode** fits 852 without scrolling now that the strip is gone. Create account scrolls by about 100, which 07 allows.

### Component details
- **Text link hit area.** Small (`label`) links use 13 px vertical padding, not 12, to reach 00's 44 px minimum.
- **Text field states.**
  - A field in the error state keeps its coral border when focused and adds the blue focus halo.
  - A read-only field shows no focus ring.
  - With a hint line, a failed check swaps the hint for the error on the same line. There's no collapse-and-expand.
- **Values the specs don't give, chosen during the build:**
  - placeholder-screen icon: `Barricade`, fill 32, `--blue-600`
  - loading: husky shadow in `--navy-900` at 10%, with 8 between the husky and its caption
  - spinner: an arc of about two-thirds of the ring
  - toast: 16 side margins, max width 448
  - shortcut-tile chevron: `--navy-900`, matching 02 and 03

### Behaviour and platform
- **`next/image` `priority` is deprecated in Next 16.** The specs say `priority`; the build uses `preload`, which does the same thing.
- **Auth always uses the demo,** even when `NEXT_PUBLIC_DEMO_STRIP` is off, because no real auth exists yet (`lib/auth/index.ts`).
- **Forgot password resend failure.** The toast path can't be triggered in the demo: only `offline@example.com` fails, and it fails before the "Check your email" state. It was checked by reading the code only.

## How to run

- `npm run dev -- -H 0.0.0.0` makes the dev server reachable from a phone on the same Wi-Fi at `http://<this machine's IPv4>:3000`. `allowedDevOrigins` in `next.config.ts` already allows `192.168.*.*` and `10.*.*.*`.
- `/dev/components` shows every shared component in every state.
- `/dev/reset` (dev only) clears every `stackd.*` key from local and session storage and reloads `/welcome` as a first launch. It's `app/dev/reset/page.dev.tsx`; `next.config.ts` adds the `dev.tsx` page extension only under `next dev`, so production builds don't have the route.
- To see Welcome again, clear `stackd.seenWelcome` from local storage. To test signing in again, use Sign out on `/`.
