# Build status

Last updated 2026-10-06. Build order steps 1–7 and 10 from `docs/specs/README.md` are done (8 and 9 wait, per the roadmap), and roadmap phase 3 is in progress (see Phase 3 below). It lists what exists, what's left, what's still undecided, and where the build differs from the specs.

## Phase 3: database, sign-in, import

Parts 1–4 built 2026-10-05. Part 5 is on hold until the new specs land. Plan approved 2026-10-05 with the planning-layer data approach (`16-open-questions.md → Decided`): for California the database holds institutions, majors, and the official ASSIST agreement link per college → university → major, never course matches or agreement text, until ASSIST grants permission.

| Part | What | Status |
|---|---|---|
| 1 | Capacitor readiness: static export, no Node server at runtime | Done |
| 2 | Supabase schema with provenance and row-level security | Done, applied to the project (2026-10-05) |
| 3 | Supabase email sign-in behind `lib/auth`, 6-digit codes, progress per user | Done and tested against the project, except the 6-digit reset code (see Before TestFlight) |
| 4 | Import pipeline for institution, major, and link rows from a hand-written file | Done; first slice imported (`3e54ad4`), rows unverified until checked |
| 5 | Screens read the database | On hold until the new specs land |

**Part 1, what changed so the app runs with no server (Capacitor):**
- **Static export.** `next build` writes a static app to `out/` (`output: "export"`, production only). `trailingSlash: true`, so every page is `<route>/index.html`, which any static file server and Capacitor can serve. `npm start` serves `out/` on port 4000.
- **`scripts/prepare-assets.mjs`** runs before `dev` and `build` (`predev`, `prebuild`) and writes:
  - `lib/generated/art-manifest.json`: every file in `public/art` with its size. `<Art>`, `artSize()` and the campus pick read it, so they no longer need the file system and work in client components.
  - `public/_art/*.webp`: every PNG at the widths in `lib/image-widths.mjs` (96–1200). `lib/image-loader.ts` is next/image's loader and points at them, so there's no image optimizer at runtime. SVGs are used as they are.
  - `lib/generated/seed.json`: `data/seed` bundled. A missing file is absent, a broken one is marked, so the empty and error states still work.
  - Both generated folders are git-ignored. After adding or replacing art, run `npm run prepare-assets` (or restart `npm run dev`).
- **Query-string routes instead of `[slug]` folders,** so a static app can show any school without a rebuild:
  - `/university/?slug=uc-davis&tab=requirements` (was `/universities/uc-davis?tab=…`)
  - `/requirement/?university=…&id=…` and `/track-application/?university=…` (placeholders)
  - `/upcoming/?id=…` (placeholder)
- **`lib/data/`** is where screens get data, in the browser: `getHome()`, `getTargetUniversity()`, `getUniversity(slug)`, `getJourneySteps()`. Today it's the bundled demo seed; the database goes behind the same functions in part 5. Home's target school moved into `home.json` (`target.university`) instead of a slug in the page.
- **`scripts/fix-export-segments.mjs`** runs after `build`. On Windows, Next 16's static export writes the router's prefetch files as nested folders (it splits paths on `/` only), and the browser then gets 404s and loses the push animation. The script renames them to the dotted names the browser asks for. On a Mac it finds nothing to do.
- **Checked** on `out/` served by a plain static server: every screen loads with WebP art and no errors or 404s, Home's measurements are unchanged, "Hi, Maya!" works, 03's three tests pass, and the push and back slides run.

**Part 2, the schema** (`supabase/migrations/`):
- `20261005120000_academic_schema.sql`:
  - `institutions` (colleges and universities, by `institution_type`), `majors`, and `agreement_links` (one official agreement URL per sending college → receiving university → major → academic year).
  - The course-match tables, which stay empty until ASSIST grants permission: `courses`, `requirements`, `requirement_groups` (`all_of` / `one_of` / `n_of`), `articulations` (`course_set` or `no_articulation`, plus `conditions`) and `articulation_courses`.
  - `app_config` (`current_cycle` = `2026-27`) and `import_runs` (an audit log).
- **Provenance on every academic row:** `source_name`, `source_url`, `academic_year` (checked as `2026-27`), `retrieved_at`, `verified_at`, `verification_status` (`unverified` by default), `is_demo`.
  - Database checks: verified needs `verified_at`, and conditional needs `conditions`.
  - Agreement links must be `https://`, and there's one per college, school, major and year.
- **How 06's four states map:**
  - An articulation row with kind `no_articulation` is "No agreement on record".
  - No row at all is "Not checked".
  - `verification_status` says whether a person has checked a row against its source.
- **Guard on verified rows.** The `protect_verified` trigger refuses any update or delete of a verified row unless the transaction sets `stackd.allow_verified_change` (only the verify step will).
- **Who can do what:**
  - Academic tables: anyone can read; insert, update and delete are revoked from `anon` and `authenticated`, so only the service role (import scripts) writes.
  - `import_runs` can't be read by the app at all.
- `20261005120100_user_progress.sql`:
  - `profiles`, `user_targets`, `user_requirement_status`, `saved_courses`, `saved_schools`, each owner-only (`auth.uid() = user_id`); `anon` has no access.
  - A trigger creates the profile at sign-up, with the trimmed `first_name` from the user's metadata.
- **`npm run test:db`** runs both migrations on an in-memory Postgres (PGlite) with stand-ins for Supabase's roles and auth schema, and checks every rule above from the `anon`, `authenticated` and `service_role` side. It touches no real database.
- `supabase/config.toml` is the CLI's config: Site URL `http://localhost:3000`, email confirmation off. It only affects a local Supabase; the hosted project is set in the dashboard.

**Applying the migrations to the project.** Use the CLI, so the project records which migrations ran:
1. `npx supabase login`, in your own terminal (it opens a browser).
2. `npx supabase link --project-ref vzsogzgcivpcmxqxepfr`. It asks for the database password (Dashboard → Project Settings → Database; reset it there if it's unknown).
3. `npx supabase db push`. It lists the two migrations and asks to confirm.
4. Then `npx supabase gen types typescript --linked > lib/supabase/types.ts` for typed queries (part 3 uses it).

Pasting the files into the dashboard's SQL Editor also works. But then the CLI doesn't know they ran, so later `db push` runs try to apply them again. Pick one method and stay with it.

**Part 3, real sign-in:**
- **Choosing the mode.** `lib/auth/index.ts` picks demo auth when `NEXT_PUBLIC_DEMO_STRIP` is on (the default) and Supabase email sign-in when it's off (`lib/flags.ts → DEMO_MODE`). The auth screens didn't change.
- **The client.** `lib/supabase/client.ts` uses only the public URL and anon key, and keeps the session in local storage under `stackd.auth`, so `/dev/reset` clears it too. It has `detectSessionInUrl: false`, since nothing arrives by email link.
- **`lib/auth/supabase.ts`:**
  - Covers sign-in, sign-up (the first name goes into user metadata, and the database copies it into `profiles`), and sign-out (which also clears this device's per-account keys).
  - 6-digit code calls: `sendPasswordReset` → `verifyResetCode` → `setNewPassword`, plus `verifySignUpCode` and `resendSignUpCode`. Demo auth has the same calls: any 6 digits pass, `000000` fails.
  - `signUp` returns `needsCode` when Confirm email is on.
  - Google and Apple return `oauth_failed` until phase 6.
  - Supabase's error codes map to `invalid_credentials`, `email_taken`, `invalid_code`, `weak_password`, `rate_limited`, `network` or `unknown`.
- **Code entry.** Built in step 10 (09): Forgot password, Create account (when a code is needed) and Sign in ("Confirm your email first") all lead to `/enter-code/`.
- **Session.** `lib/session.ts`: in Supabase mode, signed in means `stackd.auth` exists. `subscribeSession` also listens to Supabase's sign-in events, so the session gate reacts when a session ends or can't be refreshed.
- **Progress per user.** `lib/progress/sync.ts` starts from the session gate, in Supabase mode only:
  - Local storage stays the device's copy. Each change to a database record (a UUID requirement id, or a school that exists in `institutions`) is queued in `stackd.progressQueue` and pushed to `user_requirement_status` or `saved_schools`.
  - On sign-in, progress made before signing in moves into the account (unless the device holds another account's copy, which is cleared), then the account's progress is pulled down.
  - Demo records (`ucd-*`, `uc-davis`) stay on the device.
- **Demo strip follows the data.** Home and University render `<DemoStrip />` when their records carry `"demo": true`, whatever the sign-in mode. Until part 5, both still show demo data in either mode, so the strip stays.
- **Keeping the service role key out of the app.** A lint rule fails if `SUPABASE_SERVICE_ROLE_KEY` appears in `app/`, `components/` or `lib/`. `scripts/check-service-key.mjs` runs after every build and fails if the key's value is anywhere in `out/`, without printing it.
- **Tested:**
  - Demo mode: every screen and the University checks are unchanged.
  - A Supabase-mode build against the project, using calls that create nothing and send no email: the signed-out redirects work, and a failed sign-in comes back as Supabase's `invalid_credentials` and shows "Couldn't sign you in".
  - Not yet tested end to end: a real sign-up, the code calls, and progress sync. They need the steps below.

**Dashboard steps for part 3** (Supabase project `vzsogzgcivpcmxqxepfr`). Done 2026-10-05, except step 3:
1. Authentication → Sign In / Providers → Email: turn **Confirm email** off. Done; the project reports `mailer_autoconfirm: true`. It goes back on before TestFlight.
2. Authentication → URL Configuration: Site URL `http://localhost:3000`.
3. **Skipped:** Supabase only allows editing email templates with custom SMTP, so reset emails still send a link. Moved to Before TestFlight. (The step was: Authentication → Email Templates → **Reset Password**: show the code instead of the link, e.g. "Your Stackd code is {{ .Token }}". Do the same in **Confirm signup** for when confirmation is back on. Email OTP length should be 6 (Providers → Email).)
4. In `.env.local`, add `NEXT_PUBLIC_DEMO_STRIP=off` to use real sign-in locally. Leave it out for demo mode.
5. Apply the part 2 migrations, since sign-up's profile trigger and progress sync need the tables.

**Full test against the project** (2026-10-05, dev server in Supabase mode, two separate browsers), 19 checks, all passed:
- **Sign-up:** lands on "Hi, Tester!", stores the session, and creates a `profiles` row with the first name. The demo strip still shows on the demo data.
- **Progress from before signing up:** schools saved earlier moved into the account (`uc-san-diego`). The demo school (`uc-davis`) stayed on the device, and the sync queue ended empty.
- **While signed in:** a saved school is pushed. The session survives a reload.
- **Signing out:** `/dev/reset` signs out, and Home then sends you to Sign in.
- **A second, fresh browser** (standing in for a reinstall):
  - A wrong password shows "Couldn't sign you in".
  - The right one lands on "Hi, Tester!" with the account's saved schools pulled down.
  - Removing a school is pushed.
- **Errors and access:** a second sign-up with the same email shows "That email already has an account". The anon key still can't read `saved_schools`.
- **Not tested:**
  - The 6-digit reset code (see Before TestFlight).
  - Requirement-status sync: the code path exists, but the database has no requirements until course matches are permitted.
- **To clean up:** the test left one account, `stackd-e2e-1791171467373@example.com`, in the project. Delete it in Authentication → Users; its profile and saved schools go with it (`on delete cascade`). The import scripts are the only place the service role key may be used, so I didn't delete it with the key.
- **The first slice as the app sees it** (anon key): Las Positas College and UC San Diego, Computer Science (BS), and the 2026-27 agreement link, all `unverified`. The review report is in `data/review/2026-10-05T03-35-30-141-las-positas-ucsd-cs.md`.

**Part 4, the import pipeline** (`scripts/import/`, local only, never in the app):
- **Stages** (docs/12), run by `npm run import -- data/raw/planning/<file>.json [--dry-run]`:
  1. **Raw:** a hand-written planning file in `data/raw/`, kept untouched. Its path and SHA-256 go into `import_runs`.
  2. **Parse.**
  3. **Validate** (`planning.mjs`). It's strict, and every problem is listed before the database is touched:
     - Only `institutions`, `majors` and `agreement_links`, with only their own fields. Any course-match section is refused "until ASSIST's permission is recorded in docs/16".
     - Agreement links must be `https://` on `assist.org` with `source_name` "ASSIST".
     - Every row needs full provenance, an academic year like `2026-27` (two years in a row), and a retrieved date that isn't in the future.
     - No `TODO`, `PASTE` or `TBD` placeholders, no `verification_status` or `verified_at` (imports can't set them), no duplicates, California only.
  4. **Upsert:** `import_planning_batch` in `supabase/migrations/20261005130000_import_functions.sql`, which only the service role can call. One transaction, all or nothing.
     - A changed unverified row is updated; an identical row is left alone. A verified row the file would change stops the whole run, and nothing applies.
     - Rows always start `unverified`.
     - `--dry-run` does all of it, then rolls back and only logs the run.
  5. **Review report:** `data/review/<time>-<file>.md` and `.csv`. It lists every record with its source link, year, status and `updated_at`, plus blank `checked_by` and `checked_at` columns.
- **Verify:** `npm run import:verify -- data/review/<run>.csv` marks verified only the rows whose `checked_by` and `checked_at` are filled in. Each must still have the reviewed `source_url` and `updated_at`, or nothing is verified (`verify_planning_rows`).
- **Fetch stage** (`fetch.mjs`, off). It runs only for a source listed in `scripts/import/sources.json` with its permission recorded (`granted_by`, `granted_at`, `recorded_in`), with `CONTACT_EMAIL` set, and with robots.txt allowing the path.
  - It makes one request at a time, 5 s apart, with a `Stackd-Importer` User-Agent naming the contact email.
  - Responses are cached in `data/raw/fetched/` with URL and time and never fetched again without `--refresh`.
  - Today `sources.json` is `[]` and `CONTACT_EMAIL` is `"TODO"` (`scripts/import/config.mjs`), so it refuses.
- **The service role key** is read only by `scripts/import/db.mjs`, from `.env.local`, and never printed.
- **Tests:**
  - `npm run test:import` runs the whole pipeline on PGlite with made-up schools: dry run, apply, re-apply, verify, a file that changes a verified row, a stale review, ten kinds of bad file, an app role calling the import, and fetching staying off. 28 checks.
  - `npm run test:db` still checks the schema and security rules. `scripts/test-db.mjs` is the shared Supabase-shaped test database.
- **Fixed while testing:** review reports were named to the second, so two runs in the same second overwrote the first report. Names now include milliseconds, plus a counter if one's taken.
- **First slice:** `data/raw/planning/las-positas-ucsd-cs.json` has Las Positas College, UC San Diego, the Computer Science BS, and the agreement link.
  - The ASSIST link, the agreement's academic year, the dates each source was checked, and `written_by` are left as TODO or PASTE, so validation refuses the file until they're filled in.
  - Nothing in it comes from ASSIST except the link, which you paste.

**Running the first slice:**
1. Apply the migrations (part 2).
2. Fill in every TODO and PASTE in the file. The ASSIST link comes from your browser; nothing calls ASSIST's API or crawls assist.org.
3. `npm run import -- data/raw/planning/las-positas-ucsd-cs.json --dry-run`, then again without `--dry-run`.
4. Check each row in the review report against its source, fill in `checked_by` and `checked_at`, and run `npm run import:verify -- <the csv>`.

## Before TestFlight

Decided, and must be done before the TestFlight beta (roadmap phase 7):
1. **Custom SMTP, then code email templates.** Supabase only allows editing email templates once custom SMTP is set up. Then change **Reset Password** and **Confirm signup** to show the 6-digit code (`{{ .Token }}`) instead of a link, and run the reset-code test (`sendPasswordReset` → `verifyResetCode` → `setNewPassword`), which hasn't run against the project yet. Custom SMTP also lifts Supabase's built-in email limit of a few messages an hour.
2. **Turn Confirm email back on** (Authentication → Sign In / Providers → Email). The Enter code screen is built (step 10); it needs the code template from item 1.
3. **Move the source PNGs out of `public/`**, so the app bundle doesn't carry about 25 MB of art it never loads (Open items).

## Built

| Step | What | Where |
|---|---|---|
| 1 | Tokens as CSS variables (`app/globals.css`), with Tailwind's default colors, radii and shadows switched off so only spec tokens exist. Figtree, Phosphor, every shared component in 00 with all its states, demo strip (component only, see below), placeholder screen | `components/ui/`, `/dev/components` |
| 2 | Welcome, rev 3 (scene placed by its plaza line, sky scrim, husky sized to fit the screen, books sized from the husky and in front, banner check, tighter text under 760 tall, no wordmark under 600 tall) | `app/welcome/` |
| 3 | Sign in, the auth interface, demo auth, and the signed-out redirect | `app/sign-in/`, `lib/auth/`, `app/(app)/session-gate.tsx` |
| 4 | Create account | `app/sign-up/` |
| 5 | Forgot password, rev 3 since step 10: the request form only (husky, hidden below 372 wide), handing over to Enter code | `app/forgot-password/` |
| 6 | Home, rev 2 (02 and 00 as of `b1ef3b8`), with 28 tile icons and 12 / 8 tile padding (`5b78222`): greeting from `stackd.profile` (demo name otherwise), husky hung from the greeting behind the journey card, journey card with all six circles on a track, shortcut tiles and upcoming cards without chevrons, the empty upcoming line, demo strip | `app/(app)/page.tsx`, `app/(app)/_home/`, `data/seed/` |
| 7 | University requirements: campus hero from the pool, back and save, sheet, underline tabs on `?tab=`, requirement rows that mark done (toast with Undo), Track application, reminder banner, footer, empty and load-error states, push from Home and the reverse slide on Back, demo strip | `app/(app)/universities/[slug]/`, `components/ui/status-control.tsx`, `lib/requirements.ts`, `lib/campus.ts` |
| 10 | Enter code (09): the shared code field, the reset and confirm code steps, the new password step, and the new auth errors on 06, 07 and 08 | `app/enter-code/`, `components/ui/code-field.tsx`, `lib/auth/` |

**Step 10, Enter code** (2026-10-06):
- **Code field** (`components/ui/code-field.tsx`, 00 → Code field): one real input (`inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6" enterkeyhint="done"`, 16 px) lies invisibly over six `aria-hidden` boxes and takes every tap.
  - Typing keeps digits only, and Backspace removes the last.
  - A paste is read whole and reduced to its first six digits, because `maxlength` would otherwise cut "Your code is 471 902" to "Your c" first.
  - The next box shows the focus ring and a caret blinking at 1 s (`.code-caret`, steady under reduced motion). The error state turns all six coral. Read-only goes to 60% opacity.
- **Enter code** (`app/enter-code/`): `?for=reset` or `?for=confirm` picks the copy and the husky (`husky-forgot` or `husky-wave` at 144).
  - Without the email in memory (a reload), the screen replaces itself with Forgot password or Sign in.
  - The check starts on the sixth digit. A wrong code clears the boxes and shows the field error; too many tries or a connection problem shows the inline error and keeps the digits.
  - Resend counts 60 → 1, then becomes a link ("Sending…", then the toast and a restart).
  - For a reset, the code step crossfades to the new password step: no Back, focus on the headline, and a hidden username field for iOS. On save, the screen replaces itself with Home.
- **Auth** (`lib/auth`): phase 3's method names stay; 09's `verifyCode` / `resendCode` / `updatePassword` map to them by purpose.
  - `same_password` and `email_not_confirmed` are their own errors now. Anything unexpected from Supabase is `network`, and the real code is logged in development.
  - `signUp` always reports `needsCode`. Demo auth follows 09's demo rules.
  - Supabase reports a wrong or expired code as `otp_expired` for both reset and signup (checked against the project), which maps to "That code didn't work".
- **Errors on 06, 07, 08:** "Too many tries" on all three; on 06, "Confirm your email first" with a Send code button; on 07, the weak-password field error. Create account's fields are kept in memory (`lib/auth/email-store.ts`), so Back from Enter code shows them filled in.
- **Home** shows "Password saved" or "Email confirmed" from `lib/flash.ts`, a one-time in-memory message, 12 above the tab bar.
- **Tested:**
  - In demo mode: every line of 09's and 08's Test sections except the real-iPhone autofill, plus the new errors on 06 and 07. 57 checks in Chromium and 51 in WebKit; WebKit skips the Back-to-Create-account check (open item below) and checks the countdown in real time.
  - The real reset-code test waits for custom SMTP (Before TestFlight).

Also in place:
- **Placeholder screen**, all three versions from 00 (signed out, signed in, `/`), each with the back button. `/explore`, `/essays`, `/mentors`, `/events`, `/notifications`, `/upcoming/`, a university with no seed file (or no `?slug=`), `/requirement/` (requirement detail) and `/track-application/` use the signed-in version. The university screen's Overview and Student life tabs show the same empty state in the page. The `/` version (Sign out) is no longer shown anywhere, since Home replaced it. `/terms` and `/privacy` pick the signed-in or signed-out version from the session.
- **Shared auth parts** in `components/auth/`: the screen background and top block, the sheet, the social buttons, the password toggle, and the switch line.
- **Art loading.** `components/art.tsx` renders the real file when it exists in `public/art/` (`.svg` first, then `.png`), looked up in the generated art manifest with its proportions. When a file is missing it renders the labelled placeholder from `art-assets.md`.
- **Demo strip only where demo records show.** The root layout doesn't render it. A screen renders `<DemoStrip />` when its records carry `"demo": true` (Home and University today), whatever the sign-in mode; `--strip-h` is 0 unless one is on the page (`:root:has([data-demo-strip])`). Home and University are built so far.
- **Installable PWA.** `app/manifest.ts` (standalone, name, colors, icons) and `appleWebApp` in `app/layout.tsx`. Chromium reports no manifest or installability errors.
- **Welcome layout hook.** `app/welcome/welcome-frame.tsx` measures the CTA, the text and the viewport, and `welcome-layout.ts` does the math (01 → Lines). CSS computes the same scene position for the first paint, so nothing jumps when the hook runs.
- **Seed data.** `data/seed/home.json` and `data/seed/universities/uc-davis.json`, bundled by `prepare-assets` and read through `lib/seed.ts` and `lib/data/`. A missing or broken file gives `null`, and the screen shows its empty states. `readSeedResult` tells a missing file from a broken one: the university screen shows the placeholder for the first and 00's inline error ("Couldn't load requirements", Try again) for the second. Every record has `"demo": true`. The UC Davis reminder body has a `{due}` slot that `fillDue()` fills from `dueInDays` ("in 2 weeks").
- **Requirement status helper.** `lib/requirements.ts`.
  - Read side: `useRequirementStatuses(requirements)` gives the seed status overridden by `stackd.requirements`, and `stepStatus()` gives a journey step its linked requirement's status. It re-reads on the `storage` event (other tabs) and on `stackd:requirements` (same tab).
  - Write side: `toggleRequirement()` flips done ↔ previous and `setRequirementStatus()` sets one (Undo uses it). Each reads storage fresh, so quick repeated taps land on the right state, and fires `stackd:requirements`. Overrides only store differences from the seed.
  - "Previous status" isn't stored separately: the only change a student can make is done ↔ back, so it's the seed status, or not started when the seed already says done (`previousStatus()`).
  - If storage is blocked, the change still applies for this tab and the screen shows flows-and-states' "Changes won't be saved on this device" error.
- **Celebration hand-off for step 9.** `onJourneyStepCompleted()` in `requirement-list.tsx` runs when a row linked to a journey step becomes done. It claims the step in `sessionStorage["stackd.celebrated"]` (`lib/celebration.ts`, at most once per step per session) and for now shows the same toast as any row. Step 9 opens the celebration there, 400 ms after the check.
- **Campus pool.** `lib/campus.ts` holds the only pool list (`campus-1` … `campus-4`). A university's `heroImage` wins if it's in the pool; otherwise a djb2 hash of the slug picks one (UC Davis gets `campus-2`). A missing file falls through to the next image, then the labelled placeholder.
- **Transitions.** `PageTransition` maps the `push` type to slide classes in `globals.css`; the Requirements tile links with `transitionTypes={["push"]}`. History back runs outside React's view transitions, so `BackButton slideBack` starts one itself (`document.startViewTransition`), calls `router.back()`, and waits for the popstate. An iOS edge-swipe back stays instant. Reduced motion gets a 120 ms crossfade for both.
- **Saved schools.** `lib/saved.ts`, `stackd.saved` as a list of slugs.
- **Session.** Every route in the `app/(app)` group needs `stackd.session`. Without it, the student goes to `/welcome` if Welcome hasn't been seen, otherwise to `/sign-in`.

Art in use: `wordmark.png` (trimmed), `welcome-scene.png`, `welcome-books.png` (cropped to the stack, 1219 × 836), `husky-welcome.png`, `husky-wave.png`, `husky-forgot.png`, `husky-home.png` (1341 × 1173, no burst marks painted in, not winking; the art is the source of truth), `burst-dashes.svg` (drawn in the repo: three round-capped strokes, `#FDC940`, width 4 at 28 × 28, fanned like the marks in `husky-wave`), `campus-1` … `campus-4.png` (1579 × 996, the same proportions as art-assets' 1179 × 744), `logo-apple.svg` and `logo-google.svg`. Temporary app icons (`public/icons/`, `app/apple-icon.png`) are cut from `husky-welcome`'s head on `--sky-200`. The two husky run-loop frames are used by the loading component.

Still placeholders or missing: `app-icon` (temporary icons above until it exists), `home-clouds` (background decoration, so it draws nothing when missing).

## Left in the build order

| Step | Build | Notes |
|---|---|---|
| 8 | Essays (04) | |
| 9 | Task complete and the run loop (05) | `motion` is installed (step 7 uses it for the springs); `canvas-confetti` isn't yet. Open the celebration from `onJourneyStepCompleted()` (see above) |

Not built yet, though 00 and 02 describe them: each tab keeping its own scroll position (tab bar), and Home's "View progress" node animation (it needs the step 9 celebration). Home does come back at the same scroll position after Back from the university screen.

## Open items

1. **WebKit crashes on Back to Create account.** In Playwright's WebKit on Windows, any history Back that lands on `/sign-up/` (from Terms, or from Enter code) crashes the page. Back to Sign in, Welcome or Forgot password is fine. It happens with or without step 10's changes, so it predates them. Check on a real iPhone in Safari; if it happens there too, bisect the Create account screen (its fields, the terms links).
2. **`out/` is 31 MB, mostly unused PNGs.** `public/art` is copied into the export as is, but the app only loads the WebP copies in `public/_art` (and the SVGs). Before the iOS app ships, move the source PNGs out of `public/` so the app bundle doesn't carry them.
3. **Building next to a running dev server.** The build's type check also reads `.next/dev/types`, which still lists routes that were renamed or removed until the dev server regenerates it. If the build fails on `.next/dev/types/validator.ts`, stop the dev server and delete `.next/dev/types`. (See also: don't run `next build` while the dev server is running.)
4. **A phone can hold stale dev CSS.** A page opened before a change keeps the stylesheet it first loaded. Navigating inside the app (for example Create account → Home) fetches the new code but not the new CSS unless the dev server's live-reload connection is up. Home then showed the header against the screen edges, no dash, and the husky dropped into the tiles, all from missing utility classes. Fix: pull to refresh, or open `/dev/reset`, which ends in a full page load.
5. **Don't run `next build` while the dev server is running.** On 2026-10-04 a production build next to a running `next dev` left the dev server answering every new route with "Jest worker encountered 2 child process exceptions". Restarting the dev server fixed it. Stop the dev server first, or build from a separate checkout.
6. **"Application materials" has no gap before "Not started".** 03's columns put the 88-wide status column straight after the title, with no gap. At 393 the title (about 157) fits with nothing to spare, so the two words touch. The mockup shows a small gap. A gap would make the title end in an ellipsis at 393.
7. **The load-error state has no `h1`.** With a broken university file there's no name to show, so the sheet holds only the inline error.
8. **The book stack is flatter than the reference.** The cropped art is 1.46 : 1. The stack in `welcome-reference.png` is about 1.1 : 1, with thicker books. Sized at 58% of the husky's width, the stack is about 107 tall at 393 × 852 (device mode), against about 140 in the reference, so it covers less of the husky's lower body. Matching it needs new art, not a code change.
9. **`welcome-scene.png` is 852 × 1846, not 1179 × 2556.** The proportions are right, but it's about 2.2× resolution on a 3× phone, so it looks slightly soft. The building's right edge also sits just outside the middle 80% of the width.
10. **Dev-server image stalls.** A dev server that had been running for days stopped finishing Next's image-optimizer request for `husky-wave` and `husky-forgot` at 256 wide as WebP. Only a 1× desktop window asks for that size. The husky stayed invisible because it only fades in once its image loads.
   - Restarting the server fixed it, and a fresh server answers the same request in about 0.2 s.
   - The app now also counts an image that finished loading before hydration (commit `d224620`).
   - If art goes missing in a browser during development, restart `npm run dev`. Don't delete `.next/dev/cache/images` while the server is running.
   - After replacing an art file, clear that cache or restart. Otherwise the optimizer keeps serving the old image under the same URL.
11. **Apple logo terms.** Apple's design-resources license says the files are for mock-ups of apps on Apple platforms. It's approved for this demo; re-check before any public launch (06 says the same).
12. **Untested outside a real iPhone:** iOS password autofill (06), the iOS strong-password suggestion (07), the page keeping a focused field above the on-screen keyboard, and Add to Home Screen opening full screen. Also the real safe-area insets; tests simulated them with 59 top and 34 bottom.
13. **Status bar text is white when installed.** `black-translucent` is the only iOS status bar style that lets the art run under the status bar, which the specs' safe-area numbers assume. Its clock and icons are white over light sky, so they're low contrast. The alternative (`default`) gives a solid bar with dark text, and the safe-area top becomes 0. Check it on the phone and decide.
14. **The Playwright test scripts aren't in the repo.** Screens were checked against each spec's Test section with throwaway scripts. A committed test setup is still to be decided.

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
- **Enter code: how the email wraps.** 09 says `word-break: break-all`, which broke even short addresses at the 190 edge ("For student@example.co / m."). The build uses `overflow-wrap: anywhere`, so an address that fits on a line moves down whole and only a too-long one breaks. The address's last character and the closing period stay together, so the period never sits alone.
- **Sign in's Send code button reads "Sending…" while the code goes out,** and a failed send replaces the error with its own (too many tries or connection). 06 doesn't say what happens in between.
- **Home upcoming records have an `id`** (`application-deadline`, `transfer-panel`) so each card links to `/upcoming/[id]`. 02's records don't list one.
- **Home pill from `dueInDays`.** 02's text says the pill comes from `dueDate`, but its demo record has `dueInDays: 14`, so the build reads `dueInDays`. Cards sort soonest first, and undated ones go last.
- **University toast position.** 00 puts a toast 12 above the primary button when there's no tab bar, but that rule is for a button fixed to the bottom. "Track application" scrolls with the page, so the toast sits at safe-area bottom + 12.
- **University `theme-color` is `--navy-900`.** 03 asks for it to match the status-bar scrim, which is translucent. Navy matches the demo strip directly under the status bar. iOS ignores `theme-color` with `black-translucent`; it only shows in Android Chrome.
- **University empty and placeholder tabs use the `Barricade` icon** from the placeholder screen. 03 gives the copy but no icon.
- **Requirement row layout.** The row link spans the whole row (so its pressed state covers it) with 68 left padding, and the status circle sits on top of it as a separate checkbox. That keeps the two tap targets separate and unnested, as 03's VoiceOver test expects.
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
- **Auth mode follows `NEXT_PUBLIC_DEMO_STRIP`:** on (the default) uses demo auth; off uses Supabase email sign-in (`lib/auth/index.ts`, phase 3 part 3).
- **Forgot password resend failure.** The toast path can't be triggered in the demo: only `offline@example.com` fails, and it fails before the "Check your email" state. It was checked by reading the code only.

## How to run

- `npm run dev -- -H 0.0.0.0` makes the dev server reachable from a phone on the same Wi-Fi at `http://<this machine's IPv4>:3000`. `allowedDevOrigins` in `next.config.ts` already allows `192.168.*.*` and `10.*.*.*`.
- `/dev/components` (dev only, `page.dev.tsx`) shows every shared component in every state.
- `/dev/reset` (dev only) clears every `stackd.*` key from local and session storage and reloads `/welcome` as a first launch. It's `app/dev/reset/page.dev.tsx`; `next.config.ts` adds the `dev.tsx` page extension only under `next dev`, so production builds don't have the route.
- To see Welcome again, clear `stackd.seenWelcome` from local storage, or open `/dev/reset`.
- `npm run build` writes the static app to `out/` (stop the dev server first), and `npm start` serves it at `http://localhost:4000`.
- `npm run test:db` (schema and security) and `npm run test:import` (import pipeline) run on an in-memory database and touch nothing real.
- Importing: see Phase 3 → Running the first slice.
