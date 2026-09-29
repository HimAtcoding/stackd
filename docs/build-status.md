# Build status

Last updated 2026-09-28. Build order steps 1–5 from `docs/specs/README.md` are done. Read this before starting step 6. It lists what exists, what's left, what's still undecided, and where the build differs from the specs.

## Built

| Step | What | Where |
|---|---|---|
| 1 | Tokens as CSS variables (`app/globals.css`), with Tailwind's default colors, radii and shadows switched off so only spec tokens exist. Figtree, Phosphor, every shared component in 00 with all its states, demo strip, placeholder screen | `components/ui/`, `/dev/components` |
| 2 | Welcome, rev 2 (full-screen scene anchored to the top, sky scrim, husky on the husky line, books sized from the husky and in front, tighter text under 760 tall) | `app/welcome/` |
| 3 | Sign in, the auth interface, demo auth, and the signed-out redirect | `app/sign-in/`, `lib/auth/`, `app/(app)/session-gate.tsx` |
| 4 | Create account | `app/sign-up/` |
| 5 | Forgot password, rev 2 (husky, hidden below 372 wide, both states, resend) | `app/forgot-password/` |

Also in place:
- **Placeholder screen**, all three versions from 00 (signed out, signed in, `/`), each with the back button. `/`, `/explore`, `/essays` and `/mentors` use it. `/terms` and `/privacy` pick the signed-in or signed-out version from the session.
- **Shared auth parts** in `components/auth/`: the screen background and top block, the sheet, the social buttons, the password toggle, and the switch line.
- **Art loading.** `components/art.tsx` renders the real file when it exists in `public/art/` (`.svg` first, then `.png`). It reads the file's own proportions from the file. When a file is missing it renders the labelled placeholder from `art-assets.md`.
- **Session.** Every route in the `app/(app)` group needs `stackd.session`. Without it, the student goes to `/welcome` if Welcome hasn't been seen, otherwise to `/sign-in`.

Art in use: `wordmark.png` (trimmed), `welcome-scene.png`, `welcome-books.png` (cropped to the stack, 1219 × 836), `husky-welcome.png`, `husky-wave.png`, `husky-forgot.png`, `logo-apple.svg` and `logo-google.svg`. The two husky run-loop frames are used by the loading component.

Still placeholders or missing: `home-clouds` (background decoration, so it draws nothing when missing) and `burst-dashes` (not used on any built screen).

## Left in the build order

| Step | Build | Notes |
|---|---|---|
| 6 | Home (02) | `/` currently shows the "Home isn't built yet" placeholder with Sign out. Demo data goes in `data/seed/` (00 → Data rule); that folder doesn't exist yet. The "Hi, Maya!" test in 07 can only run once Home reads `stackd.profile` |
| 7 | University requirements (03) | Mark-done and local storage |
| 8 | Essays (04) | |
| 9 | Task complete and the run loop (05) | `motion` and `canvas-confetti` aren't installed yet, because nothing in steps 1–5 needs them |

Not built yet, though 00 describes them: each tab keeping its own scroll position (tab bar), and the push and back transitions for the university screen.

## Open items

1. **Welcome's husky top vs 01's test.** 01 starts the husky zone 8 below the body text, but its test asks for the husky's top edge to be at least 16 below. When the zone is under 350 tall, the image box starts 8 below. The art has 30 transparent rows at the top, so the ears start about 14–15 below at 393 × 852 installed and at 393 × 660. The spec needs one of the two numbers changed.
2. **The book stack is flatter than the reference.** The cropped art is 1.46 : 1. The stack in `welcome-reference.png` is about 1.1 : 1, with thicker books. Sized at 58% of the husky's width, the stack is about 110 tall at 393 × 852 (device mode), against about 140 in the reference, so it covers less of the husky's lower body. Matching it needs new art, not a code change.
3. **Books cover the "Higher together" banner on short screens.** With the scene anchored to the top, the banner stays at the same height on every 393-wide screen, while the husky and books move up with the button. At 393 × 660 the stack sits in front of the banner; at 852 the banner is clear, above the books.
4. **`welcome-scene.png` is 852 × 1846, not 1179 × 2556.** The proportions are right, but it's about 2.2× resolution on a 3× phone, so it looks slightly soft. The building's right edge also sits just outside the middle 80% of the width.
5. **Dev-server image stalls.** A dev server that had been running for days stopped finishing Next's image-optimizer request for `husky-wave` and `husky-forgot` at 256 wide as WebP. Only a 1× desktop window asks for that size. The husky stayed invisible because it only fades in once its image loads.
   - Restarting the server fixed it, and a fresh server answers the same request in about 0.2 s.
   - The app now also counts an image that finished loading before hydration (commit `d224620`).
   - If art goes missing in a browser during development, restart `npm run dev`. Don't delete `.next/dev/cache/images` while the server is running.
   - After replacing an art file, clear that cache or restart. Otherwise the optimizer keeps serving the old image under the same URL.
6. **"Demo data" strip reported missing in a ~460-wide desktop window. Not reproduced.** It's in the page's HTML on every route and rendered in every window size, pixel density and navigation path tested. If it happens again, capture a screenshot and the browser console.
7. **Apple logo terms.** Apple's design-resources license says the files are for mock-ups of apps on Apple platforms. It's approved for this demo; re-check before any public launch (06 says the same).
8. **Untested outside a real iPhone:** iOS password autofill (06), the iOS strong-password suggestion (07), and the page keeping a focused field above the on-screen keyboard. Also the real safe-area insets; tests simulated them with 59 top and 34 bottom.
9. **The Playwright test scripts aren't in the repo.** Screens were checked against each spec's Test section with throwaway scripts. A committed test setup is still to be decided.

## Built differently from the specs, and why

### Art and logos
- **Google "G".** art-assets says to keep "the four colored G paths". The current Google bundle has no such paths: its G is one G-shaped mask filled with a conic gradient and blurred colour shapes. `logo-google.svg` is the Android + Web light icon with only the button's white fill and grey border removed, and the view box framed to the G's own 20 × 20 area. Everything else is byte-identical. art-assets should be reworded to match.
- **Apple logo is 46 tall, not 48.** It fills the button's inner height (48 minus the 1 px border on each side). At 48, the logo file's white box would cover the button's border.
- **Social button pressed state.** 00 asks for a `--surface-pressed` overlay at 60%. It's applied with `mix-blend-mode: multiply`, so the button and Apple's white logo box tint evenly while the dark label stays at full contrast. A plain overlay would wash the label out.
- **Wordmark is 3.17 : 1 once trimmed, not ~3.6 : 1** as art-assets expects. It renders 252 × 80 on Welcome and 100 × 32 on Sign in and Create account.

### Layout
- **Welcome sky scrim color is #8AD1FD, not the top row.** 01 says to sample the top-center of `welcome-scene.png`. The top row there is #7BCAFD, but it lies outside the lighter arc the text sits on (#8AD1FD, averaged over the plain sky behind the text). A scrim in the top-row color darkened the sky into a visible band. With #8AD1FD it's invisible over plain sky.
- **Welcome sky scrim is positioned inside the text block, not `position: fixed`.** Its height has to follow the text (bottom of the body + 32), which changes with wrapping and the short-screen spacing. It's absolute in the text block and reaches the page top. Above 480 wide it covers only the 480 column; there the scrim sits over plain sky, so its edges don't show.
- **Welcome husky zone clips sideways.** The zone has `overflow-x: clip`, so on screens wider than 480 the books run off the column's edge, not into the page margin.
- **Welcome at 393 × 852 installed** (59 top, 34 bottom): CTA top 710, ground line 694, husky line 682, as in 01. The husky is 304 × 240, not about 313 × 247, because the wordmark renders 80 tall rather than ~70. So the books are 139 wide with their left edge at 21, not 143 and 15.
- **Sign in and Create account at 320 wide.** The headline's 190 max-width runs into the 144-wide husky, so the headline and subtitle are layered in front of it.
- **Welcome needs a definite height.** It uses `h-dvh min-h-fit`. With only `min-height`, Chromium reports the husky zone as 0 tall to the container query, and the husky and books never show.
- **Sign in in installed-app mode.** After the wordmark became real art, Sign in scrolled by about 8 px at 393 × 852 with the bottom line still visible. This hasn't been re-measured since the trim (now 32 tall).

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
- To see Welcome again, clear `stackd.seenWelcome` from local storage. To test signing in again, use Sign out on `/`.
