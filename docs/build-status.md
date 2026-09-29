# Build status

Last updated 2026-09-28. Build order steps 1–5 from `docs/specs/README.md` are done. Read this before starting step 6. It lists what exists, what's left, what's still undecided, and where the build differs from the specs.

## Built

| Step | What | Where |
|---|---|---|
| 1 | Tokens as CSS variables (`app/globals.css`), with Tailwind's default colors, radii and shadows switched off so only spec tokens exist. Figtree, Phosphor, every shared component in 00 with all its states, demo strip, placeholder screen | `components/ui/`, `/dev/components` |
| 2 | Welcome, rev 2 (full-screen scene, husky on the husky line, books in front) | `app/welcome/` |
| 3 | Sign in, the auth interface, demo auth, and the signed-out redirect | `app/sign-in/`, `lib/auth/`, `app/(app)/session-gate.tsx` |
| 4 | Create account | `app/sign-up/` |
| 5 | Forgot password, rev 2 (husky, both states, resend) | `app/forgot-password/` |

Also in place:
- **Placeholder screen**, all three versions from 00 (signed out, signed in, `/`), each with the back button. `/`, `/explore`, `/essays` and `/mentors` use it. `/terms` and `/privacy` pick the signed-in or signed-out version from the session.
- **Shared auth parts** in `components/auth/`: the screen background and top block, the sheet, the social buttons, the password toggle, and the switch line.
- **Art loading.** `components/art.tsx` renders the real file when it exists in `public/art/` (`.svg` first, then `.png`). It reads the file's own proportions from the file. When a file is missing it renders the labelled placeholder from `art-assets.md`.
- **Session.** Every route in the `app/(app)` group needs `stackd.session`. Without it, the student goes to `/welcome` if Welcome hasn't been seen, otherwise to `/sign-in`.

Art in use: `wordmark.png` (trimmed), `welcome-scene.png`, `welcome-books.png`, `husky-welcome.png`, `husky-wave.png`, `husky-forgot.png`, `logo-apple.svg` and `logo-google.svg`. The two husky run-loop frames are used by the loading component.

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

1. **`welcome-books.png` isn't trimmed.** The solid stack fills only rows 199–1035 of 1159. There's about 124 px of faint red residue below it and 85 px of empty space on the left. As a result:
   - the stack floats about 11 px above the ground line
   - it stops about 8 px short of the left edge instead of running off it
   - in installed-app mode at 393 × 852 it overlaps the husky by about 10 px, not the ~26 in 01

   Re-export it trimmed, per the delivery rules in `art-assets.md`. The code doesn't need to change.
2. **`welcome-scene.png` is 852 × 1846, not 1179 × 2556.** The proportions are right, but it's about 2.2× resolution on a 3× phone, so it looks slightly soft. The building's right edge also sits just outside the middle 80% of the width.
3. **Forgot password text runs under the husky between 360 and about 371 wide.** 08 hides the husky below 360 and puts it at `right: 16`, 144 wide, so its left edge is at 200 on a 360-wide screen. "Reset your" ends at 211 and "Check your email" at 222 (the headline's 200 max-width allows up to 224). The text is layered in front, so it stays readable, but 08's test "never runs under the husky at 360 and up" fails from 360 to about 370. The spec needs one of: hide the husky below about 372, make the husky smaller, or narrow the headline.
4. **Dev-server image stalls.** A dev server that had been running for days stopped finishing Next's image-optimizer request for `husky-wave` and `husky-forgot` at 256 wide as WebP. Only a 1× desktop window asks for that size. The husky stayed invisible because it only fades in once its image loads.
   - Restarting the server fixed it, and a fresh server answers the same request in about 0.2 s.
   - The app now also counts an image that finished loading before hydration (commit `d224620`).
   - If art goes missing in a browser during development, restart `npm run dev`. Don't delete `.next/dev/cache/images` while the server is running.
   - After replacing an art file, clear that cache or restart. Otherwise the optimizer keeps serving the old image under the same URL.
5. **"Demo data" strip reported missing in a ~460-wide desktop window. Not reproduced.** It's in the page's HTML on every route and rendered in every window size, pixel density and navigation path tested. If it happens again, capture a screenshot and the browser console.
6. **Apple logo terms.** Apple's design-resources license says the files are for mock-ups of apps on Apple platforms. It's approved for this demo; re-check before any public launch (06 says the same).
7. **Untested outside a real iPhone:** iOS password autofill (06), the iOS strong-password suggestion (07), and the page keeping a focused field above the on-screen keyboard. Also the real safe-area insets; tests simulated them with 59 top and 34 bottom.
8. **The Playwright test scripts aren't in the repo.** Screens were checked against each spec's Test section with throwaway scripts. A committed test setup is still to be decided.

## Built differently from the specs, and why

### Art and logos
- **Google "G".** art-assets says to keep "the four colored G paths". The current Google bundle has no such paths: its G is one G-shaped mask filled with a conic gradient and blurred colour shapes. `logo-google.svg` is the Android + Web light icon with only the button's white fill and grey border removed, and the view box framed to the G's own 20 × 20 area. Everything else is byte-identical. art-assets should be reworded to match.
- **Apple logo is 46 tall, not 48.** It fills the button's inner height (48 minus the 1 px border on each side). At 48, the logo file's white box would cover the button's border.
- **Social button pressed state.** 00 asks for a `--surface-pressed` overlay at 60%. It's applied with `mix-blend-mode: multiply`, so the button and Apple's white logo box tint evenly while the dark label stays at full contrast. A plain overlay would wash the label out.
- **Wordmark is 3.17 : 1 once trimmed, not ~3.6 : 1** as art-assets expects. It renders 252 × 80 on Welcome and 100 × 32 on Sign in and Create account.

### Layout
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
