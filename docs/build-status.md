# Build status

Last updated 2026-10-17 (the fall 2027 dates checked, imported and verified, on branch `deadlines-dates`; and step 16 follow-ups from the PR #3 review, merged in PR #4; both below). Before that 2026-10-16 (step 16, Abyan's part: deadlines tables, the first-dates import file, real data and reminders, merged in PR #3; and Ryan's part: deadlines on stand-in data, behind flags). Before that 2026-10-15 (step 14, v1 launch build; iOS build 2 waits for the Mac). Before that 2026-10-14 (version 1.0 submitted to App Review) and 2026-10-13 (iOS app and App Store prep). Before that 2026-10-12 (web sign-in return, 06 rev 3), 2026-10-10 (Apple and Google sign-in) and 2026-10-06 (step 13, Settings; Enter code from Settings). Build order steps 1–7 and 10–13 from `docs/specs/README.md` are done (8 and 9 wait, per the roadmap; 11–13 followed the plan in `docs/plans/steps-11-13.md`), and roadmap phase 3 is in progress (see Phase 3 below). It lists what exists, what's left, what's still undecided, and where the build differs from the specs.

## Phase 3: database, sign-in, import

Parts 1–4 built 2026-10-05. Part 5 is on hold until the new specs land. Plan approved 2026-10-05 with the planning-layer data approach (`16-open-questions.md → Decided`): for California the database holds institutions, majors, and the official ASSIST agreement link per college → university → major, never course matches or agreement text, until ASSIST grants permission.

| Part | What | Status |
|---|---|---|
| 1 | Capacitor readiness: static export, no Node server at runtime | Done |
| 2 | Supabase schema with provenance and row-level security | Done, applied to the project (2026-10-05) |
| 3 | Supabase email sign-in behind `lib/auth`, 6-digit codes, progress per user | Done; the full real flow, codes included, tested 2026-10-06 (below). Apple and Google sign-in added 2026-10-09 (Apple and Google sign-in, below) |
| 4 | Import pipeline for institution, major, and link rows from a hand-written file | Done; first slice imported (`3e54ad4`), rows unverified until checked |
| 5 | Screens read the database | Onboarding, Home and University read it for real accounts (steps 11 and 12 below). Demo mode still reads `data/seed` |

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
- **The client.** `lib/supabase/client.ts` uses only the public URL and anon key, and keeps the session in local storage under `stackd.auth`, so `/dev/reset` clears it too. It has `detectSessionInUrl: false`, since nothing arrives by email link; only `/auth/callback/` reads a code from the URL, on purpose. Since 2026-10-09 it uses `flowType: "pkce"` for Apple and Google; typed 6-digit codes work as before.
- **`lib/auth/supabase.ts`:**
  - Covers sign-in, sign-up (the first name goes into user metadata, and the database copies it into `profiles`), and sign-out (which also clears this device's per-account keys).
  - 6-digit code calls: `sendPasswordReset` → `verifyResetCode` → `setNewPassword`, plus `verifySignUpCode` and `resendSignUpCode`. Demo auth has the same calls: any 6 digits pass, `000000` fails.
  - `signUp` returns `needsCode` when Confirm email is on.
  - Apple and Google sign in through Supabase's PKCE flow since 2026-10-09 (Apple and Google sign-in, below).
  - Supabase's error codes map to `invalid_credentials`, `email_taken`, `invalid_code`, `weak_password`, `rate_limited`, `network` or `unknown`.
- **Code entry.** Built in step 10 (09): Forgot password, Create account (when a code is needed) and Sign in ("Confirm your email first") all lead to `/enter-code/`.
- **Session.** `lib/session.ts`: in Supabase mode, signed in means `stackd.auth` exists. `subscribeSession` also listens to Supabase's sign-in events, so the session gate reacts when a session ends or can't be refreshed.
- **Progress per user.** `lib/progress/sync.ts` starts from the session gate, in Supabase mode only:
  - Local storage stays the device's copy. Each change to a database record (a UUID requirement id, or a school that exists in `institutions`) is queued in `stackd.progressQueue` and pushed to `user_requirement_status` or `saved_schools`.
  - On sign-in, progress made before signing in moves into the account (unless the device holds another account's copy, which is cleared), then the account's progress is pulled down.
  - Demo records (`ucd-*`, `uc-davis`) stay on the device.
- **Demo strip follows the data.** Home and University render `<DemoStrip />` when their records carry `"demo": true`. Since step 12 a real account sees no demo records on either screen, so no strip; demo mode shows both.
- **Keeping the service role key out of the app.** A lint rule fails if `SUPABASE_SERVICE_ROLE_KEY` appears in `app/`, `components/` or `lib/`. `scripts/check-service-key.mjs` runs after every build and fails if the key's value is anywhere in `out/`, without printing it.
- **Tested:**
  - Demo mode: every screen and the University checks are unchanged.
  - A Supabase-mode build against the project, using calls that create nothing and send no email: the signed-out redirects work, and a failed sign-in comes back as Supabase's `invalid_credentials` and shows "Couldn't sign you in".
  - Not yet tested end to end: a real sign-up, the code calls, and progress sync. They need the steps below.

**Dashboard steps for part 3** (Supabase project `vzsogzgcivpcmxqxepfr`). All done by 2026-10-06; the project is now in its before-TestFlight state:
1. **Confirm email** (Authentication → Sign In / Providers → Email): off for development on 2026-10-05, back **on** since 2026-10-06 (`mailer_autoconfirm: false`). New accounts get a 6-digit code (09).
2. Authentication → URL Configuration: Site URL `http://localhost:3000`.
3. **Custom SMTP (Gmail) and code templates, done 2026-10-06.** Reset Password and Confirm signup show `{{ .Token }}`. **Email OTP Length must be 6** (Providers → Email): the project came set to 8, and 09's code field takes 6. It's 6 now.
4. Real sign-in is the default now (`lib/flags.ts`). `NEXT_PUBLIC_DEMO_STRIP=on` in `.env.local` switches to demo auth for local demos; `.env.local` currently says `off`, which is the same as leaving it out.
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

**Real end-to-end test, 2026-10-06** (dev server in real mode against the project, with Ryan's own inbox for the codes), 17 checks, all passed:
- **Confirm email:** signing in to an unconfirmed account showed "Confirm your email first". Send code emailed a 6-digit code, and entering it landed on "Hi, Ryan!" with "Email confirmed".
- **Sign out and in:** `/dev/reset` signed out, and signing back in reached "Hi, Ryan!".
- **Forgot password:** Send code opened Enter code.
  - A wrong code → "That code didn't work…", with the boxes cleared.
  - The resend count ran.
  - Sending again within a minute hit Supabase's email limit (429) → "Too many tries".
  - After a minute Send code worked again, and "Send a new code" → "New code sent".
  - The newest code opened "Set a new password". The current password → "That's your current password…" (Supabase's `same_password`, 422).
  - A new password → Home with "Password saved". The old password then failed, and the new one signed in.
- **Fixed during the test:**
  - Codes arrived as 8 digits, because the project's Email OTP Length was 8. Ryan set it to 6.
  - After the reset-code sign-in, Home greeted "Hi, Alex!" (the demo name). `/dev/reset` had cleared the saved first name, and a reset-code sign-in doesn't save it. `lib/profile.ts` now falls back to the first name in the Supabase session, so every kind of sign-in greets by name (`31d9256`).
- **Still untested:** iOS offering the emailed code above the keypad (needs a real iPhone). The test account is Ryan's own; its password was changed during the test and handed over in chat.

## Apple and Google sign-in (2026-10-09)

The Continue with Apple and Continue with Google buttons on Sign in (06) and Create account (07) now sign in for real. The screens look and behave as 06 says; nothing visual changed.

**How it works** (web, static export, no server):
- **Starting:** `auth.signInWithOAuth(provider)` (`lib/auth/supabase.ts`):
  - Checks Supabase's public `/auth/v1/settings` first (10 s timeout). A provider that's switched off shows 06's "Couldn't sign in with {Apple / Google}" on the screen instead of Supabase's raw error page, and no connection shows "Couldn't reach Stackd".
  - Remembers the provider in `sessionStorage["stackd.oauthPending"]`.
  - Leaves through supabase-js's PKCE flow with `redirectTo` = `<origin>/auth/callback/`.
  - The tapped button keeps spinning until the page changes. Back from Apple's or Google's page restores the screen with the spinner gone (`pageshow`).
- **Coming back:** `/auth/callback/` (`app/auth/callback/`), a static page showing only the loading component, centered on `--sky-50`, with "Signing you in" (06 → Web sign-in return, rev 3):
  - Drops the code from the address bar and history first (`history.replaceState`), so Back never replays it.
  - Exchanges the code with `exchangeCodeForSession`. Only the browser that started the sign-in holds the matching verifier, so a copied or forged code fails.
  - **Routing since 2026-10-12** (`routeAfterOAuth(newAccount)` in `lib/onboarding.ts`): only the first-ever sign-in of a brand-new account goes to `/onboarding/?step=college&from=signup`. Every existing account goes Home; with no plan, that's the setup card (10 → When it shows).
  - "Brand-new" means Supabase created the user less than a minute before this sign-in (`created_at` against `last_sign_in_at`, both Supabase's clock). An email account signing in with Apple or Google for the first time was created long before, so it counts as existing.
- **Cancel, failure and expiry** all land on Sign in (06's table), whichever screen the sign-in started from:
  - Cancelling (Google's `access_denied`, Apple's `user_cancelled_authorize`) shows nothing.
  - Any other failure shows 06's "Couldn't sign in with {Apple / Google}". If the provider isn't known (the sign-in started in another tab), nothing is shown, since that message names it. No connection shows "Couldn't reach Stackd". Provider error text is never shown.
  - **Took too long** shows "Sign-in took too long" / "Try again." (`oauth_expired`). Supabase reports it two ways:
    - `bad_oauth_state`, sent to the Site URL (Home), not the callback. The session gate reads it once, cleans the address bar, and sends the student to Sign in, even on a device that hasn't seen Welcome.
    - `flow_state_expired` from the code exchange on the callback.
  - Nothing in the URL (no `next=`) can choose where the student lands.
- **Names:**
  - A first name the provider shares (Google's given name, or the first word of the full name) is saved to the account's `first_name`, only when the account has none.
  - Apple's web flow never sends a name (Supabase's Apple guide), so an Apple account greets "Hi there!" (02). No name is made up.
  - `profiles.first_name` stays empty for these accounts, because the profile trigger runs before the name is known. Home falls back to the session's `first_name`. No migration.
- **Same tables as email accounts:** `profiles`, `user_targets`, `saved_schools`, owner-only by `auth.uid()`. There's nothing provider-specific.
- **Settings:** Change password is hidden for an account that only has Apple or Google (11, `readSessionUser().hasPassword`). An Apple Hide My Email address is stored and shown like any email; nothing validates its domain.
- **Demo mode** is unchanged: the buttons sign in at once and go Home.
- **`npm run test:oauth`:** 18 checks on reading the callback (cancel, failure, expiry), the return target, tampered storage, and the expired return to Home.

**Provider setup.** No secrets are in the repo; `.gitignore` covers `*.p8`, `AuthKey_*` and `apple-client-secret*`.
- **Supabase** (project `vzsogzgcivpcmxqxepfr`):
  - Apple and Google switched on 2026-10-09.
  - Redirect URLs: exactly `http://localhost:3000/auth/callback/` and `http://localhost:4000/auth/callback/` (no wildcards). Site URL unchanged.
  - Changing providers needs the Owner or Administrator role in the Stackd org; Developer can't.
- **Apple** (developer team `4JNCSTKTHQ`):
  - App ID `app.stackd.transfer` ("Stackd", Sign in with Apple as primary). `app.stackd.ios` was already taken by another developer.
  - Services ID `app.stackd.transfer.signin` ("Stackd", the name Apple shows on its sign-in page), with domain `vzsogzgcivpcmxqxepfr.supabase.co` and return URL `https://vzsogzgcivpcmxqxepfr.supabase.co/auth/v1/callback`, copied from Supabase's Apple panel.
  - Key `B5ZPA5GGWL` ("Stackd Sign in with Apple").
  - Supabase's Apple Client IDs: `app.stackd.transfer.signin,app.stackd.transfer`. The Services ID is first, for the web; the App ID is there for the iOS app's native sign-in later.
  - The secret is an ES256 JWT made from the `.p8` with `npm run apple:secret`. The `.p8` and the JWT are kept outside the repo. **The current secret expires 2027-04-10** (Before TestFlight).
- **Google** (Google Cloud project `stackd-508823`):
  - Consent screen "Stackd", External, in Testing. Test users: shikhar35sisodia35@gmail.com, ryansaleh117@gmail.com. Scopes `email` and `profile` only.
  - Web client "Stackd web (Supabase vzsogzgcivpcmxqxepfr)", `565100661784-b1crqp5ea2v2i8h64l55ooei91jea7ud.apps.googleusercontent.com`, with origins `http://localhost:3000` and `:4000` and the Supabase callback as its only redirect URI.
  - The older "Stackd Web" client in the same project points at an earlier test project and isn't used.

**Tested 2026-10-09** (Chrome on Windows, the real project):
- **Google, real account, new user:**
  - Supabase created the user (provider `google`, one identity). The callback went to onboarding, and onboarding saved college, school and major.
  - Home said "Hi, Shikhar!" with UC San Diego and Las Positas College CS. The name came from Google and was saved to the account.
  - A reload kept the session, and a second tab had it too. Settings showed the email and no Change password.
  - Sign out landed on Sign in with "Signed out", every `stackd.*` key cleared but Welcome seen, and the other tab signed out as well. `/settings/` then redirected to Sign in.
- **Google, same account returning (2026-10-10):** After signing out, Continue with Google and the account went straight to Home ("Hi, Shikhar!", the saved plan), with no onboarding. Supabase still had one Google user with one identity, and its last sign-in moved.
- **Google cancel:** Back from Google's account page returned to Sign in with the spinner gone, nothing disabled and no error.
- **Apple, up to the Apple ID password:** Supabase sends the browser to `appleid.apple.com` with the Services ID, and Apple serves its sign-in page naming Stackd (200). Controls on the same request: a wrong return URL gets 403, a wrong client ID `invalid_client`. The client secret's signature and claims were checked locally.
- **Apple, real Apple ID (2026-10-10):**
  - The person signed in on Apple's page with their own Apple ID. Supabase's token exchange with Apple, which uses the client secret, worked.
  - The callback exchanged the code and went to Home with the saved plan.
  - The Apple ID's email is the same verified Gmail address as the Google test account. Supabase linked the Apple identity to that user (one user, two identities: `google` and `apple`) rather than creating a second account.
  - Apple sent `email` and `email_verified` but no name, as expected for the web, so the existing first name stayed.
- **Callback paths on the production build** (`npm start`, port 4000):
  - A provider error → "Couldn't sign in with Google".
  - Apple's cancel from Create account → Create account with nothing shown.
  - A forged code → "Couldn't sign in with Apple" and no session.
  - The settings request failing → "Couldn't reach Stackd".
  - `?next=https://evil.example` plus a tampered return target → Stackd's own Sign in.
- **Email sign-in under PKCE**, against the project, with the app's own supabase-js calls in a script, a disposable address, and the codes from its inbox:
  - The sign-up code, the profile row with the first name, and a wrong password (`invalid_credentials`).
  - Password sign-in and a wrong code (`otp_expired`).
  - The reset code, the same password refused (`same_password`), a new password, the old one refused, the new one accepted.
  - `delete_my_account`. The account is deleted.
- **Builds and checks:** lint, `tsc`, `test:db`, `test:import`, `test:oauth`, and `npm run build`. Every route, `/auth/callback/` included, answers 200 from `out/`.
- **Tested 2026-10-12, after the web sign-in return changes:**
  - Ryan's Google account. It belongs to his email account (created 2026-10-07, identities `email` and `google`), so both sign-ins (before and after signing out) went straight to Home with his saved plan, no onboarding.
  - Email for real, with a throwaway (`oko15075+stackd-c@gmail.com`): the emailed code → onboarding with "Email confirmed", Skip → Home's setup card, sign out, password sign-in → Home's setup card (no onboarding). The account was then deleted through Settings and can't sign in. 8 checks.
  - With Supabase's answers made up locally (no real sign-in): a brand-new account → onboarding, a returning one with no plan → Home's setup card, cancel and failure from Create account → Sign in, both kinds of expiry → "Sign-in took too long" (12 above the Sign in button, even on a first launch), the callback's loading screen, and a plain first launch still going to Welcome. 14 checks.
  - `npm run build`, lint, `tsc`, `test:db`, `test:import`, `test:oauth`.
- **Not tested yet:**
  - A real brand-new Google or Apple account (Ryan's Google address already had an account), and a real expired sign-in (it takes leaving Apple's or Google's page open for several minutes).
  - Apple creating a brand-new account, and Hide My Email. The only Apple ID tried shared its real address, which matched an existing account, so it was linked instead. A brand-new account takes the same callback path as Google's new user (onboarding).
  - Google with the same address as an email and password account. Supabase links identities with the same verified email to one user; not tried here.
  - Native Sign in with Apple. There's no Capacitor project yet; when there is, use `signInWithIdToken` behind the same `Auth` interface.
  - A real iPhone.

**Built differently from 06:**
- `signInWithOAuth` returns `{ ok: true, redirecting }` (plus `newAccount` when it doesn't redirect) instead of `AuthResult`, and `Auth` has `finishOAuth(href)` for the callback page. Both screens route through `routeAfterOAuth(newAccount)`.
- "Brand-new account" is decided by the account's age at this sign-in (under a minute). 06 doesn't say how to tell.

## Before TestFlight

Decided, and must be done before the TestFlight beta (roadmap phase 7). Custom SMTP, the code templates and Confirm email are done (2026-10-06).
1. ~~Move the source PNGs out of the app bundle.~~ Done 2026-10-13 another way: `scripts/prune-export-art.mjs` runs after every build and deletes the raster files in `out/art` that the code never names directly (the app shows art from the WebP copies in `/_art`). `public/art` stays the source. 11 files, 24.7 MB removed; `out/` and the iOS bundle went from 32 MB to 7.9 MB. Welcome and Sign in checked on the served build: every art request answered 200.
2. **Make a new Apple client secret before 2027-04-10.** Run `npm run apple:secret -- <AuthKey_B5ZPA5GGWL.p8> 4JNCSTKTHQ B5ZPA5GGWL app.stackd.transfer.signin <file outside the repo>`. Then paste the result into Supabase → Authentication → Sign In / Providers → Apple → Secret Key. After that date Apple sign-in on the web fails until it's replaced. The `.p8` can't be downloaded from Apple again; if it's lost, revoke the key and make a new one.
3. ~~Add the real app's address to Supabase's Redirect URLs.~~ Done 2026-10-13: `app.stackd.transfer://auth/callback/` and `https://joinstackd-chi.vercel.app/auth/callback/` added next to the two `localhost` ones (4 in all). Site URL unchanged.
4. ~~Native Sign in with Apple in the iOS app.~~ Written 2026-10-13 (iOS app, below); not compiled or tested until the Mac.
5. ~~Publish Google's consent screen.~~ Done 2026-10-13: branding (home page `https://joinstackd-chi.vercel.app/support/`, privacy, terms, authorized domain `joinstackd-chi.vercel.app`, no logo so no verification), and the consent screen is **In production**, so any Google account can use Continue with Google. The authorized domains still list `stackd-orcin.vercel.app` and `bizdktmpigidfnvaggjk.supabase.co` from the old private project; they do nothing and can be deleted.
6. ~~Register Apple's private relay email source.~~ Done 2026-10-13: `joinstackd@gmail.com` is registered (Sign in with Apple for Email Communication) and passed Apple's SPF check.

## Before the App Store listing

See `docs/app-store/listing.md` for every field, ready to paste.
- **Public developer credit** (all four of the team, decided 2026-10-13; a three-name line was used briefly on 2026-10-12): "Developed by Ryan Saleh, Shikhar Sisodia, Abyan Kashif, and Antonio Avila." It's in the App Store description, Settings' footer, and the footer of Privacy, Terms and Support (`lib/about.ts`).
- **Copyright** (legal ownership, as the founders answered on 2026-10-12): `2026 Ryan Saleh, Shikhar Sisodia, Abyan Kashif, Antonio Avila`. App Store Connect adds the ©.
- The listing's seller name comes from the Apple Developer account. Team `4JNCSTKTHQ` is an individual membership, so it shows its holder's legal name, and Apple doesn't allow the team's four names there. A shared seller name needs an organization enrollment (a registered company and a D-U-N-S number); Apple can convert the current team and keep its Team ID, so Sign in with Apple keeps working.
- Name provider screens "Stackd", never one person: Apple's Services ID and Google's consent screen already are.
- Public support email: `joinstackd@gmail.com` (approved 2026-10-12; it's also the address the code emails come from).

## iOS app and App Store prep (2026-10-13)

Branch `feat/ios-app-store-prep`, done on Windows. Nothing here has been compiled by Xcode or run on an iPhone; that, the archive, the upload and the submission are the Mac steps in `docs/ios-app-store-handoff.md`.

**Capacitor 8 (Swift Package Manager, no CocoaPods):**
- `@capacitor/core`, `cli` and `ios` 8.5.2, `@capacitor/app` 8.1.1, `@capacitor/browser` 8.0.4, pinned exactly so the Mac builds what was tested here. 8.5.3 was 5 days old, so the month-old 8.5.2 was used.
- `capacitor.config.ts`: `appId` `app.stackd.transfer`, `appName` Stackd, `webDir` `out`. The app ships the static export; it never loads a dev server or a Node server.
- `npx cap add ios` generated `ios/` on Windows (it needs no Mac with SPM). `ios/App/App/public` and the copied `capacitor.config.json` are git-ignored and made by `cap sync`.
- Scripts: `npm run ios:prepare` (checks `.env.local` with `scripts/check-ios-env.mjs`, builds, `cap sync ios`), `ios:sync`, `ios:open` (Mac only), `ios:assets`.
- Lint ignores `ios/**` (the copied build).

**The Xcode project** (`ios/App/App.xcodeproj`, edited by hand and checked with `plistlib`):
- Bundle ID `app.stackd.transfer`, team `4JNCSTKTHQ`, version 1.0.0 build 1, iPhone only, portrait only, `arm64`.
- `App.entitlements`: Sign in with Apple.
- `Info.plist`: URL scheme `app.stackd.transfer`; `ITSAppUsesNonExemptEncryption` false (HTTPS only, nothing custom); dark status bar text (open item 13 for the native app).
- `StackdBridgeViewController.swift`: registers the Apple plugin and serves the static export by path. Capacitor's own router answers every path without a file extension with the root `index.html` (checked in `node_modules/@capacitor/ios/.../Router.swift`), so a reload on `/settings/` would have drawn Home's HTML; this one serves `settings/index.html`. `SceneDelegate` and `Main.storyboard` use it.
- `AppleSignInPlugin.swift`: a small local plugin around AuthenticationServices. `@capacitor-community/apple-sign-in` 7.1.0 was tried and dropped: its `Package.swift` needs Capacitor's SPM package below 8.0, so it can't resolve in a Capacitor 8 project. `@capgo/capacitor-social-login` was dropped because it links the Facebook SDK into every app.

**Native sign-in** (`lib/auth/supabase.ts`, `lib/capacitor.ts`, `lib/auth/native.ts`), behind the same `Auth` interface; no screen changed:
- In the iOS app, `signInWithOAuth` doesn't leave the app, so it returns `redirecting: false` with `newAccount`, the path the screens already had for this.
- **Apple:** Apple's own sheet with a SHA-256-hashed nonce, then Supabase's `signInWithIdToken` with the raw nonce. Supabase verifies the token; the App ID is already in its Apple Client IDs. Apple shares the first name only on the first sign-in; it's saved the same way as Google's.
- **Google:** the same PKCE sign-in as the web, in the in-app browser (SFSafariViewController, which Google allows; it forbids embedded web views), returning to `app.stackd.transfer://auth/callback/`. Google's client secret stays in Supabase. Closing the browser is a cancel.
- Routing is unchanged: a brand-new account goes to onboarding, everyone else Home; cancels show nothing; failures show 06's message on the same screen.
- `npm run test:oauth` has 13 more checks (31 in all): the app's callback URL, lookalike schemes and paths refused, cancel and expiry through it, and the nonce and its hash.

**Icon and launch screen** (`npm run ios:assets`, `scripts/ios-assets.mjs`):
- App icon 1024 × 1024, no alpha: the husky head from `husky-welcome.png` on `--sky-200`, framed like the temporary web icons and cut from the source art (so it's a 1.2× resize, not the 512 icon doubled), stopping before the yellow burst marks. Still the temporary icon until `app-icon` art exists (art-assets).
- Launch image: the wordmark on `--sky-50`.

**Public pages and credits:**
- `/privacy/`, `/terms/` and `/support/` (12, new spec) replace the placeholders. Privacy was written from the actual tables and code: email, first name, account and provider IDs, the plan, service logs; no analytics, ads or tracking.
- Settings' footer has a Support link, "Stackd 1.0.0" (`package.json` is 1.0.0 now) and the developer credit (11 updated).
- **Hosted** at https://joinstackd-chi.vercel.app (a new free Vercel Hobby project, `joinstackd`, on Shikhar's account; `joinstackd.vercel.app` was taken). It's `out/` as built, without the unused source PNGs. `/`, `/welcome/`, `/privacy/`, `/terms/`, `/support/`, `/sign-in/` and `/auth/callback/` answer 200 with no session. This reverses the "no public website for now" decision only as far as App Store review and Google's consent screen need. The old `stackd` Vercel project (stackd-orcin) belongs to the earlier private repo and wasn't touched.
- Redeploying: `npm run build` (it already drops the unused PNGs), copy `out/` into a folder linked to Vercel project `joinstackd`, then `vercel deploy --prod` there.

**App Store review account:** a disposable account made 2026-10-13 with the app's own calls (anon key): email confirmed with the real code, first name "Taylor", plan Las Positas College → UC San Diego, Computer Science (B.S.), signs in. Its email and random password are in `~/.stackd-secrets/app-review-account.txt` on Shikhar's laptop, never in Git. Don't use it for tests that change or delete the plan.

**Checked on Windows:** lint, `tsc`, `test:db`, `test:import`, `test:oauth` (31), `npm run build`, `cap sync ios`, the plists and storyboard parse, the icon is 1024 × 1024 with no alpha.

**Not done here:**
- Compiling, running on an iPhone, archiving, uploading, TestFlight, submitting (Mac).
- Nothing on the dashboards: Google's consent screen is published and Apple's updated Developer Program License Agreement was accepted (2026-10-13, at the founder's request). See Open items 16–17.

**On the Mac (in progress, 2026-10-13):** Xcode 26.5 (17F42), Node 24.21.0, from `3d6585d`.
- Lint, `tsc`, `test:db`, `test:import`, `test:oauth` (31) pass. On a fresh clone `tsc` needs `npm run prepare-assets` and `npx next typegen` first (the generated art manifest, seed JSON and `LayoutProps` don't exist until then).
- Simulator build (iPhone 17 Pro Max, iOS 26.5): **succeeded with no Swift changes and no warnings** in `StackdBridgeViewController.swift`, `AppleSignInPlugin.swift` or the hand-edited `project.pbxproj`. Swift Package Manager resolved `capacitor-swift-pm` 8.5.2; its `Package.resolved` is committed so every build uses that revision.
- `npm run ios:prepare` with the real `.env.local`: the build has the Supabase URL and no service role key.
- **Archived and uploaded 2026-10-14: 1.0.0 (1)**, Apple Distribution certificate on team `4JNCSTKTHQ`, App Store profile "Stackd App Store 2026-10" (made with the App Store Connect API; no device was registered, so Xcode's automatic signing couldn't make its development profile). Entitlements in the signed app: Sign in with Apple, `get-task-allow` false. App Store Connect processed it (VALID, non-exempt encryption: no).
- **TestFlight:** internal group "Internal team" (all builds) with the account holder; build 1 is In Beta Testing.
- **Screenshots, 2026-10-14:** five at 1320 × 2868 (no alpha) from the Debug build on the iPhone 17 Pro Max simulator, status bar 9:41 and full battery, signed in as the new account `joinstackd+screens@gmail.com` (first name Taylor; Las Positas College → UC San Diego, Computer Science): 1 Welcome, 2 Home with the plan, 3 onboarding choosing schools, 4 UC San Diego with the official agreement card, 5 Settings (version and four-name credit visible). Uploaded to version 1.0, iPhone 6.9" Display; all five COMPLETE. No founder or personal email on screen.
- **Simulator checks, 2026-10-14** (same web code as the TestFlight build): wrong password shows "Couldn't sign you in"; onboarding saves the plan; Open on ASSIST opens Safari at assist.org; Settings shows "Stackd 1.0.0" and the four-name credit; Terms, Privacy and Support open and Back returns; force-quit and relaunch keeps the session and plan; Sign out shows "Signed out". The email code was confirmed for the screens account. The review account still signs in and has its profile.
- **Not tested on an iPhone:** native Sign in with Apple, Google in the in-app browser, forgot password, delete account, keyboard and safe areas on a device. Those need a phone (TestFlight build 1).
- **Marketing URL** set to https://www.usestackd.app/. Privacy policy and support URLs stay on joinstackd-chi.vercel.app because usestackd.app has no /privacy or /support pages yet.
- **Submitted for review 2026-10-14 21:43 UTC:** version 1.0 with build 1.0.0 (1). App Store status **Waiting for Review**. Release: automatically after approval. Available in the United States only.
- App Store seller name: the membership is Individual, so the store shows the account holder as the seller. All four names are in the description, the copyright and the in-app credit. Showing all four as the seller needs an Organization membership (a legal entity and a D-U-N-S number).

**Dashboards, done 2026-10-13 in Chrome:**
- Apple Developer: membership **Individual**, team `4JNCSTKTHQ`, renews 2027-06-17 (no new payment). App ID `app.stackd.transfer` has Sign In with Apple. `joinstackd@gmail.com` registered as a relay email source (SPF passes).
- Supabase: the two redirect URLs (Before TestFlight 3).
- Google: branding links and authorized domain (Before TestFlight 5; Publish still open).
- **App Store Connect:** record **"Stackd: Transfer Planner"** (Apple ID `6822523006`; "Stackd" alone is taken by another developer), bundle `app.stackd.transfer`, SKU `stackd-ios-1`, English (U.S.), Education, Free, United States. Version 1.0 has the description (ending in the four-name credit), promotional text, keywords, support URL, copyright with all four names, sign-in required with the review account, contact `joinstackd@gmail.com`, and the review notes; all re-read after a reload. Subtitle "Plan your California transfer". Content rights answered. Age rating 4+. App Privacy published: name, email, user ID and other user content, App Functionality only, linked, no tracking. Privacy policy URL set. Missing: the build and screenshots (Mac).

## Deadlines, Ryan's part (step 16, 2026-10-16)

Spec 14 on the web build, tested on Windows. Built: Home's Up next stack and Get ready card, the Deadlines screen (`/deadlines/`), the date sheet, the steps sheet, the term question and its "Change" sheet, and the new 00 components. **All of it is behind flags that are off in the release** (`upcoming`, `getReady`, `deadlines`, plus `reminders` for the Remind me button and the date sheet's Reminders block). `NEXT_PUBLIC_FEATURES=all` turns them on under `next dev`.

**Stand-in data until Abyan's tables land:**
- `data/seed/deadlines.json` and `checklists.json`: rows shaped like `deadlines`, `checklists` and `checklist_steps`, every one `"demo": true` and `verification_status: "unchecked"`. The dates are spec 14's first-dates table for fall 2027. The Cal State Apply course update and final transcripts are left out because the spec gives them no date, and a date isn't guessed. Summaries are in Stackd's words; source links are the official sites' home pages only.
- Only `verified` rows reach a student, plus demo rows. A demo row on screen turns on the demo strip (Home and Deadlines), and source lines say "Demo data, not checked against the official sites yet."
- The student's marks (stand-ins for `user_deadlines`, `user_checklist_steps`, `profiles.transfer_term`) are on the device under `stackd.deadlines`, `stackd.steps` and `stackd.term`, tagged with the account id and cleared at sign-out.
- `lib/data/deadlines.ts` is the one file that changes when the database takes over. `lib/deadlines.ts` holds the rules (which dates a student sees, Pacific-day counts, which checklist shows) and the copy.
- `fetchPlan()` now reads `institutions.system`, so the plan knows UC from CSU. No schema change. A copy saved before this counts each school as both until the refresh lands.

**For Abyan, when the tables go in** (done; see Deadlines, Abyan's part, below):
- The table needs a way to tell a date with a stated time ("11:59 p.m. Pacific") from one without. The stand-in uses a `due_has_time` column; date-only rows are stored at 23:59:59 Pacific.
- Abyan's part still to come: reminder scheduling and the permission flow (soft ask, iOS prompt, denied state), the "Reminders on" button state, the reminders card, Settings' Reminders group and Transfer term row. On the iPhone the date sheet's four reminder choices already save to the stand-in store (default 1 week and 1 day before).

**Other changes:**
- Home's old 02 Upcoming list is gone (its card, its `home.json` records and `UpcomingItem`). The `upcoming` flag now means Up next, as spec 14 says. `/upcoming/` goes to `/deadlines/`, or Home while that's off.
- `/deadlines/` with its flag off goes Home. Links to it come only from `deadlinesHref()` in `lib/features.ts`, and `check-release.mjs` fails the build otherwise (checked with a probe file).
- `StatusControl` takes `size={24}` for the Get ready rows. `EmptyState`'s action is optional ("You're all caught up" has none).
- `/dev/components` shows the choice chip, switch, window bar, progress ring, timeline row and spine, and the new `--stack-2`, `--stack-3` and `countdown` type.
- In development, `localStorage["stackd.dev.deadlines"] = "loading"` or `"error"` shows those states.

**Tested 2026-10-16** (Windows, stand-in session with mocked plan rows, Playwright's clock for the dates): 48 browser checks against spec 14's Test list for this part, at 393 and 320 wide. Las Positas → UC San Diego shows the UC application on top at 45 days, no Cal State Apply, FAFSA in the stack. Adding a CSU target brings Cal State Apply, and a UC tie picks the UC checklist; CSU-only shows Cal State Apply. Coral and "In 14 days", "Tomorrow", "Today"; "Today / due tonight" on the due day. Mark done hands the next-up card to the next date, the count in Done and past goes up, and Undo puts it back. Term question, toast and term line; Fall 2028 shows the "nothing upcoming" line; no plan shows UC, CSU and aid dates with the note and the "See only your dates" card. The web date sheet says reminders work in the iPhone app, and every date has its source line and "Open official page". Get ready: 2 of 6, checking a step and Undo, all six done. `?id=` opens that date's sheet. Error state on Deadlines; Home hides the section. No sideways scroll at 320. Then lint, `tsc`, `test:db`, `test:import`, `test:oauth` and `npm run build` with the release checks; on the release build with flags off, Home looks as before and `/deadlines/`, `/deadlines/?id=…` and `/upcoming/` go Home.

Not tested: anything on an iPhone, the shared-element push from the stack to the next-up card in Safari (it's a View Transition; where it isn't supported the push runs alone), and VoiceOver itself (accessible names were checked in the DOM).

## Deadlines, Abyan's part (step 16, 2026-10-16)

The data and reminders half of spec 14, on branch `deadlines-data`. Still behind the same flags, so the release doesn't change. **Not applied yet:** Ryan runs `npx supabase db push` and the import after reviewing the pull request.

**Tables** (`supabase/migrations/20261016120000_deadlines.sql`):
- `deadlines`, `checklists`, `checklist_steps`:
  - Shaped like Ryan's stand-in rows, with provenance on every row, steps included.
  - The id is a uuid plus a unique `slug`, as on `institutions`.
  - `due_has_time` tells "11:59 p.m. Pacific" from a date with no time (stored at 23:59:59 Pacific).
  - `audience` is `uc`, `csu`, `aid` or `campus`, and `campus` needs `institution_id`. `lib/data/deadlines.ts` maps a campus date to that school's id, the way `lib/deadlines.ts` already matches it.
  - Checks: https links, `opens_at` before `due_at`, a cycle like `fall-2027`, and verified needs `verified_at`. `protect_verified` and `set_updated_at` work as on the other academic tables.
- **Only verified rows can be read** (row-level security, `anon` and `authenticated`). A checklist also needs its deadline verified, and a step its checklist. Only the service role writes.
- `user_deadlines` (`done_at`, `reminders`) and `user_checklist_steps` are owner-only, like the other per-student tables, and go with the account.
  - `reminders` is an array of 7, 3, 1 or 0 days before. Null means the student's default from Settings, so changing the default reaches every date they haven't set themselves.
- `profiles.transfer_term` (`fall-2027`, … or null), plus `transfer_term_asked`, so "Not sure yet" (null, asked) is told apart from never asked. A term can't be saved without counting as asked.
- `npm run test:db` gained 50 checks: verified-only reads, the constraints, owner-only marks, the term, and account deletion taking the new rows.

**Import** (`supabase/migrations/20261016120100_deadlines_import.sql`, `scripts/import/deadlines.mjs`):
- `npm run import -- data/raw/deadlines/<file>.json`. The folder picks the validator. Same rules as the planning import: all or nothing, unchanged rows left alone, a change to a verified row stops the run, rows start unverified.
- `verify_planning_rows` now also takes `deadlines`, `checklists` and `checklist_steps`, so `npm run import:verify` works the same way.
- The validator checks that each time's offset is right for Pacific time on that day (−07:00 / −08:00), that a date with no time sits at 23:59:59, and that a window opens at 00:00:00 and before its due date.
- Every row has `confirm_on`: the official page to check it on and what to check there. It goes in the review report (new `cycle` and `confirm_on` columns), not the database.
- `npm run test:import` gained 31 checks, including one that the real file is refused only for the fields a person still has to fill in.

**The first dates** (`data/raw/deadlines/fall-2027.json`):
- The seven fall 2027 dates and both checklists from spec 14, with sources on UC Admissions, Cal State Apply and CSAC pages.
- **Waiting for a person.** Every `retrieved_at` is empty and `verified_at` isn't in the file, so the import refuses it until someone checks each row on its `confirm_on` page and fills in the date. `verified_at` comes from the verify step.
- The UC Transfer Academic Update's opening day is a `TODO` (the spec says only "mid-December").
- Left out because the spec gives no due date: the Cal State Apply course update (opens "early January") and final transcripts.
- Things to look for while checking: whether Cal State Apply's Nov 30 and the UC Statement of Intent to Register's June 1 have a stated time, and whether Accept your CSU offer can be confirmed on an official page at all (if not, delete the row).

**Real data on the screens** (`lib/data/deadlines.ts`, the one file Ryan's screens read):
- Real accounts read the three tables (verified only, filtered again in the app) and their own marks and term.
- This device keeps a copy of both, so screens draw at once and reminders can reschedule offline. Marks are saved on the device first, then sent; a failed send waits in `stackd.deadlinesQueue` and goes the next time.
- Nothing is fetched while every deadline flag is off.
- Demo mode still reads `data/seed/deadlines.json` and `checklists.json`, unchanged.
- Ryan's per-account device store moved to `lib/account-store.ts`, unchanged, so reminders can use it too. `lib/data/plan.ts` exports `readPlanState` and `subscribePlan` for code outside React.

**Reminders** (`lib/reminders/`, Capacitor Local Notifications `8.3.1`, added to `ios/App/CapApp-SPM/Package.swift` with `npx cap update ios`):
- `schedule.ts` is the scheduling logic, with no Capacitor:
  - One notification per chosen day, at 9:00 a.m. on the phone's clock, on the due day in Pacific minus N days.
  - Passed times, done dates and past dates are skipped.
  - One notification per day: same-morning dates are combined, and the id is the day number.
  - Only the soonest 60 are scheduled.
  - Rescheduling cancels everything pending, then schedules the new set.
- `sync.ts` runs from the session gate in the iPhone app. It reschedules when the app opens or comes back (and reloads the dates then), and on any change to the plan, term, a done mark, a date's reminder days, the default, the switch, iOS's permission or the dates. Tapping a reminder opens `deadlinesHref("?id=…")`.
- Sign-out, account deletion, and any session that ends cancel every reminder.
- `native.ts` wraps the plugin. A Capacitor plugin answers every property, `then` included, so it's never passed through a promise; `withNotifications()` hands it to a callback instead. The browser check below caught this: `await`ing the plugin never settled.
- **Settings stay on the phone** (`stackd.reminders`, per account, cleared at sign-out): the switch, the default days (1 week and 1 day before) and the card's dismissal. Only this phone schedules its reminders.
- **Permission flow:**
  - The soft ask (`components/deadlines/reminders-ask.tsx`) appears only while iOS hasn't asked, and only after "Turn on reminders", "Remind me" or a reminder choice.
  - Allowed: reminders on, toast "Reminders on". Denied: nothing else pops up.
  - "Not now" closes it; a reminder control asks again.
  - From the date sheet, the sheet comes back after the soft ask. With permission already given, choosing a reminder turns reminders back on if the switch was off.
  - Settings' switch goes straight to iOS's prompt, since the student asked there.
- **Screens, only what reminders need:**
  - The next-up card's "Reminders on" state.
  - The date sheet's denied line with "Open Settings" (`app-settings:`).
  - The reminders card under the next-up card (iPhone only; hidden once reminders have been on, when dismissed, or when iOS permission is denied).
  - Settings' Reminders group between Your plan and Account (iPhone only): the switch, disabled with the caption when denied, and "Remind me" with its sheet.
  - A Transfer term row at the end of Your plan (flag `deadlines`) opening Ryan's term sheet. `TermSheet`'s `term` prop also takes `undefined`, so a term never answered selects no chip.
  - The Deadlines error state's "Try again" also retries the dates.
- `npm run test:reminders` (`scripts/test-reminders.mts`, run with `tsx` under Pacific time) has 50 checks:
  - 9:00 timing across the November clock change, and passed times skipped.
  - One a day, and the spec's notification copy word for word.
  - The extra copy below, and no exclamation points or urgency words.
  - The 60 cap, defaults vs. a date's own days, and done dates.
  - Settings' "Remind me" value for every number of choices.
  - Rescheduling, turning off and sign-out, against a fake plugin.

**Notification copy beyond spec 14's table** (for review):
- Date with no stated time: "…due in 7 days" / "Due Sunday, Jan 31. Open Stackd to see what's left."; "…due in 3 days" / "Due Sunday, Jan 31."; "…due tomorrow" / "Due tomorrow."; "…due today" / "Due today."
- Date that varies by campus: "Check your campus's date." added after the due sentence.
- Morning-of with a daytime (not evening) time: "Due today at …" instead of "Due tonight at …".
- Two or more on one morning, same day but different times: "2 deadlines tomorrow" / "UC application is due tomorrow at 11:59 p.m. Pacific. Cal State Apply is due tomorrow."
- Two or more on one morning, none with a time: "2 deadlines in 3 days" / "A and B, both due Saturday, May 1."
- Two or more on one morning, due on different days: "2 deadlines coming up" / "UC application is due tomorrow at 11:59 p.m. Pacific. Test scholarship is due in 7 days, Sunday, Dec 6."
- Three or more: "all" instead of "both".
- Settings: the "Remind me" sheet's line "Used for every deadline, unless you change it on that date."
- Settings: the "Remind me" row's value. With one or two choices it names them ("1 week and 1 day before", "1 week before and the morning it's due", "The morning it's due"); with three or more it reads "{n} reminders"; with none, "None".
- Settings: the Transfer term row's "Not sure yet" and "Pick a term" (blue, like "Pick a major").

**Tested 2026-10-16** (Windows): lint, `tsc`, `test:db` (all checks), `test:import` (59), `test:reminders` (50), and `npm run build` with the release checks. Plus 58 browser checks on the dev server in real mode, at 393 and 320 wide:
- **Setup:** every Supabase request was answered by a local mock, so nothing reached the project. A fake iOS bridge stood in for the plugin and recorded what was scheduled.
- **Data:** Home and Deadlines draw from database-shaped rows with no demo strip. An unverified row never shows, and the term saves to `profiles`.
- **Fresh install:** the soft ask comes before iOS's prompt, which appears once. "Reminders on", and the card goes. The schedule is a week and a day before at 9:00, never two on a day, nothing for CSU or unverified rows.
- **Marks:** a date's own choice saves to `user_deadlines` and is scheduled. Mark done removes that date's reminders and Undo brings them back.
- **Settings:** off cancels everything, and on goes straight to scheduling. The new default reaches only dates not set by hand, and the term sheet saves.
- **Sign-out** leaves nothing scheduled.
- **Denied:** no card, the sheet's "Open Settings" line, and the switch off and disabled with the caption.
- **Not now, then denied at the prompt:** nothing else pops up.
- **Web:** no card, the "iPhone app" line, and no Reminders group.
- No page errors.

Not tested, and needs a Mac and a real iPhone:
- Xcode resolving the new Swift package.
- iOS's real prompt.
- Notifications arriving at 9:00, and a tap opening the date (including from a cold start).
- `app-settings:` opening Stackd's page in Settings. If it doesn't, the fallback is a few lines of Swift in a small plugin, like `AppleSignInPlugin.swift`.
- Against the real project once the migrations are applied: the verified-only reads and the marks round trip.

## Deadlines follow-ups (step 16, 2026-10-17)

Fixes from the review of PR #3, on branch `deadlines-followups`. Still all behind the deadline flags, so the release build doesn't change.

**The first-dates file** (`data/raw/deadlines/fall-2027.json`):
- Removed three claims no `confirm_on` page was set to check: "UC doesn't take late applications" (stand-in wording from Ryan's part), "Six UC campuses guarantee a spot…", and "and pay its deposit". The same sentences are gone from the demo seed.
- The Transfer Academic Update has no opening day (`opens_at: null`, so no window bar). UC's page, read 2026-10-17, gives only "The priority deadline is January 31, 2027." The validator already allowed null there; the tests now expect it, and expect the file to be refused only for its empty `retrieved_at`.
- `docs/date-check.md` lists every row with its official link, what to check, and a box to tick. It flags the summary sentences that say more than `confirm_on` asks to check (TAG, UC application, Cal State Apply, FAFSA, the Transfer Academic Update, Accept your UC offer, and UC steps 2 and 4): each is to be confirmed on the page or deleted. Nothing is verified and no `retrieved_at` is filled in.

**Code:**
- **Saving marks** (`lib/data/mark-queue.ts`, used by `lib/data/deadlines.ts`): a mark the account refuses stays queued and the marks after it still go; a dropped connection ends the pass. Anything left is retried after 2 s, 4 s, 8 s … up to 5 minutes, and the waits start over after a success. Reading the account's marks no longer waits for an empty queue: the account's copy wins, except for marks still waiting or made during the read. A retry never sends after sign-out.
- **Turning reminders on from a date sheet:** with reminders off in Settings, adding a day asks "Turn on reminders?" ("Turn on" / "Not now"), with the line "Reminders are off in Settings. Turning them on reminds you about every date you're tracking." "Not now" keeps the date's choice and leaves reminders off. Taking a day away never asks. The decision is `afterReminderChoice` in `lib/reminders/choice.ts`.
- **Sign-out during a reschedule:** every reschedule and cancel goes through one lock on the phone (`serialized` in `lib/reminders/schedule.ts`), and a reschedule checks, inside the lock, that the same account is still signed in; if not, it cancels everything instead.
- **`cancelReminders`** returns early while the `reminders` flag is off, so the v1 release never loads the plugin.
- **A tapped reminder on an open Deadlines screen** opens that date's sheet: `?id=` is read on every navigation, and a tap also tells an open screen directly, for the same date tapped twice.

**Tested 2026-10-17** (Windows):
- `test:reminders` (15 new, 65 in all): the race without the lock and its absence with it, a reschedule after sign-out, the choice rules, the tap reaching an open screen, and the plugin load count in a pretend iPhone with the flags off (0) and on (1).
- `test:deadlines`, new (22): refused, offline, removed and stand-in marks, the backoff, sign-out, and reading the account back.
- `test:import` (4 new, 1 changed): the real file is refused only for `retrieved_at`, has no placeholders, no opening day for the update, and none of the removed claims.
- Browser, stand-in session with mocked tables, flags on: 61 checks, including step 16's 52, a refused mark retried at growing gaps while the account's marks are still read, and reminder taps on an open Deadlines screen.
- Lint, `tsc`, `test:db`, `test:oauth` and `npm run build` with the release checks.
- Not tested: the "Turn on reminders?" sheet and the lock on a real iPhone (both need the native plugin).

## Fall 2027 dates checked (step 16, 2026-10-17)

Every line of `docs/date-check.md` checked on its official page by Ryan Saleh, on branch `deadlines-dates`. What each page said and what changed is under each line there.

**The file** (`data/raw/deadlines/fall-2027.json`), every row with `retrieved_at` 2026-10-17:
- **Deleted:** Accept your CSU offer (no CSU page states May 1), and the Cal State Apply step "Add your work and activities" (not in the 2027-2028 guide). The other CSU steps moved up to 1–5; nothing was in the database yet, so no step ID changed.
- **UC application:** due November 30 with no time. No UC page states 11:59 p.m. Pacific.
- **UC Transfer Academic Update:** opens December 15, 2026, and the summary says January 31 is UC's priority deadline. Source is now UC Dates & deadlines, which states both.
- **FAFSA or Dream Act:** source is now UC Dates & deadlines (October 1 and March 2, 2027). studentaid.gov only loads in a browser and couldn't be read. The who-files sentences, from the California Student Aid Commission's page, cover mixed-status families and say Pell Grants and Work-Study need the FAFSA.
- **Summaries:** Accept your UC offer names the SIR; UC steps 2, 3, 4 and 6 and Cal State Apply step 5 now say only what the pages say.
- A row has one source, so a second page (the TAU page, CSAC) is named in `confirm_on`, which goes in the review report.

**Spec 14:** the UC application's examples show no time (cards, sheet, timeline, notification copy, accessible names), and Accept your CSU offer says "varies by campus". The step tables now match the file (UC 1–6, CSU 1–5), and so do the dates table (TAU opens Dec 15; FAFSA confirmed on UC Dates & deadlines and CSAC), the timeline wireframe's second lines, and the source lines (checked Oct 17, 2026).

**Imported and verified:** dry run, then the real import (6 dates, 2 checklists, 11 steps inserted), then `import:verify` with `data/review/2026-10-18T02-11-33-606-fall-2027.csv` (checked by Ryan Saleh, 2026-10-17): 19 rows verified. Read back with the anon key, all 19 are live.

**Tested 2026-10-17** (Windows, dev server with `NEXT_PUBLIC_FEATURES=all`, stand-in session; the plan was mocked, the dates came from the database): 12 checks. With a UC San Diego plan, Home's Up next card and the Deadlines screen show "UC application, Due Monday, Nov 30" with no time, the date sheet reads "Monday, November 30, 2026", and there's no CSU offer row. With a stand-in CSU target, Home's Get ready card reads "0 of 5 steps done" and "See all 5 steps", and the sheet lists the five steps in order. The release build is unchanged (all deadline flags off).

## v1 launch build (step 14, 2026-10-15)

Spec 13 (`docs/specs/13-v1-launch.md`) on the web build, tested on Windows. **iOS build 2 isn't made yet:** that's the Mac steps below.

**Feature flags** (`lib/features.ts`), the only place that decides what shows:
- Spec 13's flags, all off: `essays`, `mentors`, `events`, `explore`, `notifications`, `upcoming`, `trackApplication`, `universityTabs`, `savedSchools`, `devRoutes`. One more, `requirementDetail` (off), covers requirement detail, which demo requirement rows open.
- Development uses the same values, so `npm run dev` looks like the release. `NEXT_PUBLIC_FEATURES=all` in `.env.local` turns everything on for working on hidden features; production builds ignore it.
- **Unbuilt screens go through one table** in the same file. `unbuiltHref(screen)` gives the link, or null while the flag is off, so the link isn't drawn. `universityHref(slug)` drops `&tab=` while the tabs are off.
- **Demo mode is off in every production build,** whatever `NEXT_PUBLIC_DEMO_STRIP` says (`lib/flags.ts`). It still works under `next dev`.

**No dead ends:**
- **Home:** no bell (the gear takes its place at the right edge), no tiles, no Upcoming, no tab bar, and the unofficial footer line 24 below the plan or setup card. The page ends 24 above the safe area. Toasts sit 12 above the safe area.
- **Tiles:** the Requirements tile shows only with at least one other tile, since alone it would repeat the card above it.
- **Tab bar:** shows only with more than one tab (`HAS_TAB_BAR` in `components/ui/tab-bar.tsx`), and only the switched-on tabs.
- **University:** no heart, no tab row (an old `&tab=overview` link shows the requirements), no Track application. "Transfer requirements" is 24 below the meta line. Demo requirement rows have no link or chevron while requirement detail is off.
- **Unbuilt routes** (`/explore/`, `/essays/`, `/mentors/`, `/events/`, `/notifications/`, `/upcoming/`, `/requirement/`, `/track-application/`) render `<UnbuiltRoute>` (`components/unbuilt-route.tsx`): 00's placeholder with the flag on, otherwise they replace themselves with Home, so Back doesn't return to them.
- **A missing or unknown university slug** goes Home, as does **any unknown address** (`app/not-found.tsx`; Next's own 404 had no way out, and the app has no browser Back).
- **Welcome** stays as drawn. Spec 13's test line now says Privacy and Terms open from Create account, and Privacy, Terms and Support from Settings.

**Release-build checks** (`npm run build` → `postbuild`): `scripts/check-release.mjs` fails the build if:
- `out/dev/` exists;
- any file in `app/`, `components/` or `lib/` writes a link to an unbuilt route itself instead of using `unbuiltHref()`;
- anything but `components/unbuilt-route.tsx` uses `PlaceholderScreen`.

It was checked against a probe file and a fake `out/dev/` page, and caught all three. `check-service-key.mjs` still runs after it.

**Also:** the import pipeline's contact email is `joinstackd@gmail.com` (`scripts/import/config.mjs`; it was "TODO"). Fetching still refuses, because `sources.json` grants no source; `test:import` now reports that reason.

**Tested 2026-10-15** (Windows):
- Lint, `tsc`, `test:db`, `test:import`, `test:oauth` (31) and `npm run build` with the new checks.
- The release build (`out/` on port 4000), 39 checks. Signed-in screens used a stand-in session with made-up plan answers and the real school, major and link rows:
  - Every link on Welcome, Sign in, Create account, Privacy, Terms, Support, Home (plan and setup card), University, Settings and onboarding leads somewhere real. None says "isn't built yet" or "Coming soon", and there's no demo strip.
  - Home's and University's layouts as spec 13 says.
  - Every unbuilt route, `/university/` with no slug or `uc-davis`, a made-up address, and `/dev/reset/` and `/dev/components/` end on Home (or Welcome or Sign in when signed out).
  - Terms, Privacy and Support open from Settings, and Terms and Privacy from Create account, with Back.
  - A wrong password reaches Supabase and shows "Couldn't sign you in".
- `NEXT_PUBLIC_FEATURES=all` under `next dev`: the bell, tiles, Upcoming, tab bar, `&tab=`, placeholders, heart and tabs all come back. 4 checks.
- Not tested: anything on an iPhone (below).

**Fixes before build 2** (2026-10-16), with 02, 03, 11, 12 and flows-and-states updated to match:
- University's subtitle reads "{major} from {college}." ("Computer Science B.S. from Las Positas College."), as on Home's plan card, or just "{major}." with no college.
- Settings' Major row shows the degree ("Computer Science B.S.").
- Privacy, Terms and Support are in sentence case: page titles "Privacy policy", "Terms of use", "Support", tab titles "Stackd privacy policy" and so on, and Support's in-sentence links ("the privacy policy and the terms of use"). Every heading on the three pages was checked.
- Home's setup card is titled "No plan yet". The body and the "Set up your plan" button are unchanged.
- University's sheet fills to the bottom of the screen, so nothing shows below the footer.
- Checked on the release build: 12 checks for these, and step 14's 39-check audit again with the new headings. All the suites and the release checks pass.

**On the Mac: sync the iOS project, make build 2 and upload it.** Version stays 1.0.0; the build number goes from 1 to 2.
1. Get the code and build the web app into the iOS project:
   ```bash
   cd <your stackd clone>
   git checkout main && git pull
   npm ci
   npm run ios:prepare
   ```
   `ios:prepare` stops if `.env.local` lacks the Supabase URL and anon key or turns demo mode on. Then it runs `npm run build` (with the release checks) and `cap sync ios`. It should end with "check-release: no /dev/ pages…", "check-service-key: the service role key is not in the build", and Capacitor's sync output.
2. Bump the build number to 2:
   ```bash
   sed -i '' 's/CURRENT_PROJECT_VERSION = 1;/CURRENT_PROJECT_VERSION = 2;/g' ios/App/App.xcodeproj/project.pbxproj
   grep -c "CURRENT_PROJECT_VERSION = 2;" ios/App/App.xcodeproj/project.pbxproj
   ```
   The `grep` must print `2` (Debug and Release). Or set it in Xcode: App target → General → Identity → Build `2`.
3. Open Xcode and check:
   ```bash
   npm run ios:open
   ```
   App target → General: Version `1.0.0`, Build `2`.
4. Run it once in the simulator. Home shows only the wordmark, gear, greeting, husky, card and footer line, with no tab bar; University has no heart and no tabs.
5. Archive and upload, signed as build 1 was (Apple Distribution certificate, App Store profile "Stackd App Store 2026-10"):
   - Run destination **Any iOS Device (arm64)**, then Product → **Archive**.
   - In the Organizer: **Validate App**, then **Distribute App** → App Store Connect → Upload.
6. Commit the bump so the repo matches what was uploaded:
   ```bash
   git add ios/App/App.xcodeproj/project.pbxproj
   git commit -m "iOS build 2 (1.0.0) with the v1 launch build"
   git push
   ```
7. App Store Connect → TestFlight: wait for 1.0.0 (2) to process, install it on a real iPhone, and test:
   - email, Apple and Google sign-in, and cancelling Apple and Google (back on Sign in, nothing shown);
   - forgot password, and delete account with a throwaway;
   - the review account still signs in with its plan.
8. App Store Connect → version 1.0:
   - If it's still Waiting for Review with build 1: **Remove from Review**.
   - Under Build, choose **1.0.0 (2)**.
   - **Retake the five 6.9-inch screenshots from build 2.** The current ones came from build 1, which showed tiles, the bell and the tab bar, and screenshots must match the app.
   - Check that the App Privacy answers still match `/privacy/`.
   - **Add for Review**, then **Submit for Review**. Release is set to automatic after approval; switch it to manual first if you want to choose the day.

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
| 13 | Settings (11): plan rows, change password, sign out, delete account with its confirm sheet | `app/(app)/settings/`, `components/ui/settings-row.tsx`, `components/ui/bottom-sheet.tsx`, `components/ui/destructive-button.tsx`, `lib/auth/` |
| 14 | v1 launch build (13): feature flags, no dead ends, the not-found page, release-build checks | `lib/features.ts`, `components/unbuilt-route.tsx`, `app/not-found.tsx`, `scripts/check-release.mjs` |
| 12 | Home plan states, the gear, and the official agreement card on University (02 → Plan states, 03 → Real accounts) | `app/(app)/_home/`, `app/(app)/university/_university/`, `lib/data/university.ts` |
| 11 | Onboarding (10): college, schools and major on real database rows, saved to the account; the edit mode Settings will open; the plan migration | `app/(app)/onboarding/`, `lib/data/plan.ts`, `lib/data/catalog.ts`, `components/ui/choice-row.tsx`, `supabase/migrations/20261007120000_plans_and_account.sql` |

**Step 11, Onboarding** (2026-10-06, built and tested in real mode against the project):
- **Migration** `20261007120000_plans_and_account.sql`, applied to the project 2026-10-06:
  - `user_targets.position` keeps schools in the order they were chosen.
  - `user_targets.major_not_listed` tells "Not listed yet" (true) from "no major picked yet" (false). It can't be true on a row that has a major.
  - `save_plan(p_home_institution_id, p_update_home, p_targets)` runs as the student (`security invoker`), in one transaction. It sets the home college, or replaces the targets in order, or both. It refuses a home that isn't a community college, a target that isn't a university, a major from another school, and the same school twice. A school that leaves the plan takes the student's saved progress for it along.
  - `delete_my_account()` deletes only the caller's own `auth.users` row (step 13 uses it).
  - Both can be called by `authenticated` only. `npm run test:db` now has 59 checks.
- **Data** (`lib/data/`, real mode, anon key and row-level security):
  - `catalog.ts`: `getInstitutions(type)` and `getMajors(institutionIds)`, sorted by name, demo rows left out.
  - `plan.ts`: `fetchPlan()`, `savePlan()`, and `usePlan()`. This device keeps a copy in `stackd.plan`, tagged with the account, so a screen can draw before the network answers; sign-out clears it.
  - `lib/format.ts` turns stored codes into words: `BS` → "B.S.", `UC` / `CSU` → "Public university".
- **Screen** (`app/(app)/onboarding/`): one page for all three steps, so the answers stay in memory while `?step=` changes.
  - Steps change with `history.pushState`, so the browser's Back and the header's Back both return to the step before with its choices kept. A reload on step 2 or 3 has no answers left and starts again at step 1.
  - `&from=signup`, `home` or `settings` decides Back and Skip on step 1 (the plan's table). `&edit=1` opens one step with the saved answers chosen, no bar, no count, no Skip, and "Save plan" saving only that step.
  - Each step loads its list when it opens: nothing for 600 ms, then the loading component, or the inline error with Try again.
  - Checked on tap: the step's message 12 above the button, focus on the first row (step 3: the first school without a choice). Save plan calls `save_plan` once; a failure shows "Couldn't save your plan" and keeps the choices.
- **New shared components** (all on `/dev/components`): choice row, choice circle and its list container (`choice-row.tsx`), search field (`search-field.tsx`), and the pinned bottom area with its fade (`pinned-bottom.tsx`). The text field's label is optional now, and the progress bar takes a `max`.
- **Entry:** Create account (when no code is needed) and Enter code (confirm) go to `/onboarding/?step=college&from=signup`, where "Email confirmed" shows 12 above the button. In demo mode both still go to Home, and `/onboarding/` sends you to Home.
- **Tested:**
  - Real account (`oko15075+stackd-a@gmail.com`, a throwaway): the emailed code landed on step 1 with "Email confirmed", no Back, the bar at a third. Skip went to Home and saved nothing. Then every line of 10's Test: the messages, the pale blue row, "san d" and "zzz", Back from step 3, Save plan → Home with "Plan saved", still there after a reload and after signing in on a second browser.
  - With a stand-in session (made-up plan responses, real college, school and major rows): 10's measurements at 393 × 852 and 320 × 568, a 14-row list (long names wrap to two lines, the last row clears the fade), several schools on step 3, the save failure, and the edit mode.

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

**Step 12, Home plan states and the agreement card** (2026-10-06, built and tested in real mode against the project):
- **Home** is now two screens on one frame (`app/(app)/_home/`): `account-home.tsx` for a real account and `demo-home.tsx` for demo mode, both drawn by `home-frame.tsx`.
  - Real account: the greeting from the profile ("Hi there!" with no name) and a subtitle for the state. No plan: the setup card ("Set up your plan" opens onboarding with `from=home`). With a plan: the plan card, up to three schools and "+{n} more", "Edit" opening Settings.
  - Requirements tile: "Set up your plan" (to onboarding) or the first school's name (to its University screen). Essays, Mentors and Events say "Coming soon" with no unread dot. The bell has no dot, Upcoming shows its empty line, and there is no demo strip.
  - Nothing on a real account's Home reads `home.json`.
- **02's other rev 3 changes, in both modes:** the gear 8 left of the bell (hidden in demo mode, which has no account), the husky anchored to the wrapper of the first card (`right: -4px; bottom: calc(100% - 4px)`), square ends on the journey track and fill, and Mentors' title leaving 20 for the unread dot.
- **University** (`app/(app)/university/_university/`): `university-screen.tsx` is the shared frame; `demo-requirements.tsx` and `account-university.tsx` fill the Requirements tab.
  - Real account: the name, kind and city from `institutions`, the campus image picked by slug, and the heart saving to the account through the existing sync.
  - The Requirements tab shows "{college} to {major}." and the official agreement card (`agreement-card.tsx`). `lib/data/university.ts` finds the link for home college → this school → the student's major, latest academic year. "Open on ASSIST" opens it outside the app, with "{year} agreement. Opens assist.org." under it. Without a link: "We don't have an official agreement link for your path yet." and "Open ASSIST".
  - Track application, the reminder banner and requirement rows don't show. A slug the database doesn't have gets the placeholder.
- **Tested:**
  - Real account (the throwaway from step 11): both of 02's rev 3 tests and 03's (the no-plan Home after Skip; then "Transferring to UC San Diego.", the plan card, "Edit" opening Settings, the card and the tile opening UC San Diego, "2026-27 agreement", and "Open on ASSIST" being the exact imported link, opened in a new tab). No demo strip on either screen. The heart, turned on here, was already on after signing in on a second browser. 22 checks.
  - With a stand-in session: the measurements at 393 × 852 and 320 × 568, five schools, a school with no major, a student with no college (the "Open ASSIST" card), and a demo-only slug.
  - Demo mode (`NEXT_PUBLIC_DEMO_STRIP=on`): Home and University as before plus the rev 3 changes, no gear, and marking a row done still updating Home. 21 checks.

**Step 13, Settings** (2026-10-06, built and tested in real mode against the project):
- **Screen** (`app/(app)/settings/`), pushed from Home's gear and the plan card's "Edit". In demo mode it sends you to Home.
  - **Your plan:** College, Schools and Major, each opening its onboarding step with `edit=1`; a student with no plan sees only "Set up your plan" (`from=settings`).
  - **Account:** Email as plain text, and Change password (hidden for an account with no password). It sends the reset code with a spinner in place of the chevron, then opens Enter code; "Password saved" lands on Home as before. A failed send shows a toast with 08's words.
  - **Sign out:** this device only (`signOut({ scope: "local" })`), the device's copies of the student's data cleared, then Sign in with "Signed out".
  - **Delete account:** the confirm sheet, then `delete_my_account()`. After it: a local sign-out, every `stackd.*` key cleared ("Welcome seen" too), and Welcome with "Account deleted". A failure shows the inline error inside the sheet.
  - **Footer:** the unofficial line, Terms and Privacy, and "Stackd {version}" from `package.json` (`NEXT_PUBLIC_APP_VERSION`, set in `next.config.ts`).
- **Enter code opened from Settings** (09, updated 2026-10-06): a student who is already signed in when the screen opens doesn't get the "Remembered it? Sign in" line, and Back returns to Settings. Without the email in memory (a reload), the screen replaces itself with Settings, not Forgot password. Checked with a stand-in session, next to the signed-out path, which is unchanged (9 checks).
- **Deleting an account is a database function, not an Edge Function.** The first real delete worked on the hosted project, so the plan's fallback wasn't needed.
- **New shared components** (all on `/dev/components`): settings row and its group, bottom sheet (focus starts on the title and stays inside, Escape or a tap on the scrim closes it, slides up or only fades under reduced motion), and the destructive button.
- **Auth** (`lib/auth`): `signOut()` is local now, and there's a new `deleteAccount()` (demo auth just ends the demo session).
- **The one-time message** (`components/flash-toast.tsx` over `lib/flash.ts`) is read on Home, onboarding, Settings, Sign in and Welcome.
- **Tested:**
  - Real account (the throwaway from step 11), 37 checks in four runs:
    - Settings: the gear, the plan's names, the email, Back to Home. Schools with nothing added → "Plan saved". Major saved as "Not listed yet" (Settings "Not listed yet", Home "Major not listed yet") and back. College saved as not listed and back.
    - Change password: a real code by email, the current password refused, a new one → Home with "Password saved".
    - Sign out → Sign in with "Signed out", the device's copies gone, Back not returning to Settings, Home and Settings redirecting to Sign in. The old password refused, the new one accepted with the plan still there.
    - Delete account: the sheet with focus on its title, "Keep my account" leaving the account alone, then Delete account → Welcome as a first launch with nothing left on the device. Signing in afterwards shows "Couldn't sign you in" with either password.
  - With a stand-in session: 11's measurements at 393 × 852 and 320 × 568, the sheet (focus, Tab, Escape, scrim, locked while deleting, a forced failure, reduced motion), long values, the skipped-plan row, the edit mode's three steps and what each one saves, and the "Signed out" and "Account deleted" toasts.
  - A second throwaway (`oko15075+stackd-b@gmail.com`), because the first delete run stopped early on a fault in the test script and missed two checks. It skipped onboarding: Home showed the setup card, and Settings showed only "Set up your plan", which opened onboarding with Back and no Skip. Then Delete account → Welcome with the "Account deleted" toast 12 above Get started. A query with its old token found no profile, targets or saved schools, and Supabase answered `user_not_found` for the token itself. Signing in showed "Couldn't sign you in". 14 checks.
  - Both throwaway accounts are deleted.

Also in place:
- **Placeholder screen**, all three versions from 00 (signed out, signed in, `/`), each with the back button. Since step 14 it only shows with a flag switched on (`NEXT_PUBLIC_FEATURES=all` in development): `/explore`, `/essays`, `/mentors`, `/events`, `/notifications`, `/upcoming/`, `/requirement/` (requirement detail) and `/track-application/` use the signed-in version through `<UnbuiltRoute>`, and go Home in the release. A university with no seed file (or no `?slug=`) goes Home. The university screen's Overview and Student life tabs show the same empty state in the page. The `/` version (Sign out) is no longer shown anywhere, since Home replaced it. `/terms` and `/privacy` were placeholders until 2026-10-13; they're real pages now (12).
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
| 16 | The rest of deadlines (14): custom dates; then checking the first dates, applying the migrations and importing; then reminders on a real iPhone | Tables, the import file, real data, reminders and the Settings additions are merged (PR #3); review follow-ups on `deadlines-followups` (above). Next: `npx supabase db push`, check each row with `docs/date-check.md`, import, verify. Flag `customDeadlines` stays off until custom dates are built |
| 8 | Essays (04) | |
| 9 | Task complete and the run loop (05) | `motion` is installed (step 7 uses it for the springs); `canvas-confetti` isn't yet. Open the celebration from `onJourneyStepCompleted()` (see above) |

Not built yet, though 00 and 02 describe them: each tab keeping its own scroll position (tab bar), and Home's "View progress" node animation (it needs the step 9 celebration). Home does come back at the same scroll position after Back from the university screen.

## Open items

1. **WebKit crashes on Back to Create account.** In Playwright's WebKit on Windows, any history Back that lands on `/sign-up/` (from Terms, or from Enter code) crashes the page. Back to Sign in, Welcome or Forgot password is fine. It happens with or without step 10's changes, so it predates them. Check on a real iPhone in Safari; if it happens there too, bisect the Create account screen (its fields, the terms links).
2. ~~`out/` is 31 MB, mostly unused PNGs.~~ Fixed 2026-10-13 (Before TestFlight 1): 7.9 MB.
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
15. **A hidden tab's page transition logs a recoverable error.** When a tab in the background navigates (for example the other tab after a sign-out), the dev overlay shows "Recoverable InvalidStateError: Transition was aborted because of invalid state. Document hidden". The browser refuses a view transition in a hidden document; the navigation itself completes. Seen 2026-10-09; it comes from the page transitions, not from sign-in.
16. **App Review Guideline 4.2.** The team picked deadline push notifications as Stackd's native feature (16 → Decided). Version 1.0 adds native Sign in with Apple, but a minimum-functionality rejection is possible. Deadline reminders (local notifications) are built since 2026-10-16 (step 16, Abyan's part) but behind the `reminders` and `deadlines` flags, untested on an iPhone, and need verified dates in the database. If a rejection comes, finish those steps, turn the flags on and resubmit.
17. ~~Two clicks only a founder can make.~~ Both done 2026-10-13: Google's consent screen published, and Apple's updated Developer Program License Agreement accepted (it was blocking new submissions on the whole account).
18. **"Checked" dates show a day early.** A date-only `retrieved_at` like 2026-10-17 is stored as midnight UTC, and `checkedDate` in `lib/deadlines.ts` shows it in Pacific time, so the source lines read "checked Oct 16, 2026". Fix by formatting that date in UTC (or storing it as Pacific midnight); seen 2026-10-17 after the first real import.
19. **A verified row can't be corrected.** The import refuses any file that would change a verified row, and `verify` only moves rows to verified, so nothing in the pipeline can reopen one. Hit 2026-10-17: a new FAFSA or Dream Act summary (adding who files the FAFSA) stopped the dry run with "deadline fafsa-dream-act-fall-2027 is verified and the file would change it". The file and the database still have the earlier summary. Needs a decision: a reviewed way to reopen a verified row (a migration), or a one-off change in the Supabase SQL editor.

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
- **Demo mode is off by default.** 00 says `NEXT_PUBLIC_DEMO_STRIP` defaults to on. Since 2026-10-06 development runs in real mode unless it's set to `on`. The demo strip itself still follows the data, not the flag.
- **Enter code: how the email wraps.** 09 says `word-break: break-all`, which broke even short addresses at the 190 edge ("For student@example.co / m."). The build uses `overflow-wrap: anywhere`, so an address that fits on a line moves down whole and only a too-long one breaks. The address's last character and the closing period stay together, so the period never sits alone.
- **Sign in's Send code button reads "Sending…" while the code goes out,** and a failed send replaces the error with its own (too many tries or connection). 06 doesn't say what happens in between.
- **University toast position.** 00 puts a toast 12 above the primary button when there's no tab bar, but that rule is for a button fixed to the bottom. "Track application" scrolls with the page, so the toast sits at safe-area bottom + 12.
- **University `theme-color` is `--navy-900`.** 03 asks for it to match the status-bar scrim, which is translucent. Navy matches the demo strip directly under the status bar. iOS ignores `theme-color` with `black-translucent`; it only shows in Android Chrome.
- **University empty and placeholder tabs use the `Barricade` icon** from the placeholder screen. 03 gives the copy but no icon.
- **Requirement row layout.** The row link spans the whole row (so its pressed state covers it) with 68 left padding, and the status circle sits on top of it as a separate checkbox. That keeps the two tap targets separate and unnested, as 03's VoiceOver test expects.
- **Welcome needs a definite height.** It uses `h-dvh min-h-fit`. With only `min-height`, Chromium reports the husky zone as 0 tall to the container query (the first-paint fallback for the husky's height), and the husky and books never show.
- **Sign in in installed-app mode** fits 852 without scrolling now that the strip is gone. Create account scrolls by about 100, which 07 allows.

### Deadlines (step 16)
- **Timeline rows sit 8 in with 8 padding,** not full width with 16 padding. The content still starts at x 16, and the pressed tint keeps its rounded corners off the screen edge.
- **The countdown column is at least 72 wide,** not exactly 72. A three-digit count (early in a cycle) widens it rather than running into the title.
- **Second lines on timeline rows** come from the audience: "All UC campuses", "All CSU campuses", "Financial aid", or the campus's name, plus the time when the date has one. The table has no column for 14's "Most CSU campuses" or "For Cal Grant"; those ideas are in the summaries.
- **"Done and past" header** is a button inside an `h2`, so the heading stays a heading.
- **The steps sheet's ring at 40** has no number inside (it doesn't fit); "2 of 6" and "Due Nov 30" sit beside it.
- **Peek titles use the record's title,** so the third layer reads "UC Transfer Academic Update" where the mockup drew "UC grade update".
- **No light haptic on Mark done.** `@capacitor/haptics` isn't installed; adding it needs a Mac sync. The web vibrate call (as on University) stands in.
- **Nothing for 14's offline line** ("Showing dates from your last visit") yet. Since Abyan's part the dates come from the database with a copy on the device, so the data for it exists; the caption itself is a screen change still to do.

### v1 launch build (step 14)
- **`requirementDetail`** is a flag spec 13 doesn't list. Requirement rows only show for demo schools, but their link had to go through the table like every other unbuilt screen.
- **The Requirements tile** hides with the other tiles. Spec 13 says Home has no tiles, but only Essays, Mentors and Events have flags; the Requirements tile alone would repeat the card above it.
- **Unknown university slugs and unknown addresses go Home** (`app/not-found.tsx`). 03 sends a missing school to the placeholder, which spec 13 rules out.
- **`/dev/components`' tab bar specimens** show nothing unless `NEXT_PUBLIC_FEATURES=all` is set, since the tab bar now hides with one tab.

### Settings (step 13)
- **The Major row with several schools:** "Pick a major" if any school has none picked. Otherwise the picked major's name, or "{n} majors" when they differ, counting only real majors; "Not listed yet" only when that's the answer for every school. 11 doesn't say what a mix of the two shows.
- **Change password's errors** are one toast line made from 08's title and body ("Too many tries. Wait a few minutes, then try again.").
- **The sheet can't be dismissed while the account is being deleted** (Escape, the scrim and "Keep my account" all wait). 11 only says Keep is disabled.
- **Toast positions:** "Signed out" sits at safe-area bottom + 12 on Sign in (its button scrolls with the page, as on Enter code), and "Account deleted" sits 12 above Get started on Welcome.
- **Sign out marks Welcome as seen** first, so a student who never saw Welcome on this device still lands on Sign in.

### Home and University with a real account (step 12)
- **Home while the plan is loading or couldn't load.** 02 doesn't cover it. A device that has shown the plan before draws its saved copy at once. Otherwise the card's place shows nothing for 600 ms, then the loading component, and the tiles and Upcoming wait with it. A failed load shows the inline error "Couldn't load your plan" with Try again.
- **"Major not listed yet"** is the plan card's line for a school whose major the student marked "Not listed yet". 02 only has "Pick a major", which stays for a school with no major picked.
- **The plan card is two links,** as on 03's requirement rows: one covering the card, and "Edit" on top of it, so neither is inside the other.
- **University's subtitle** ("{college} to {major}.") only shows when the student has both a home college and a major for this school. It never ends in two periods after "B.S.".
- **University while it loads:** the sheet's color for 600 ms, then the loading component; inside the Requirements tab the same while the plan and link load. A failed load shows 03's "Couldn't load requirements".
- **The city is shown with the state** ("La Jolla, CA"), from the institution's `city` and `state`, matching 03's "Davis, CA".
- **The agreement card's body uses the college's full name** ("Las Positas College courses"), as the plan decided; there's no short-name column.

### Onboarding (step 11)
- **A confirmed email always goes to onboarding,** also when the code was asked for from Sign in's "Confirm your email first". flows-and-states sends that one path to Home; 09 and the plan say onboarding, and an account that was never confirmed has no plan yet.
- **`user_targets.major_not_listed`** isn't in 10. 10 saves "Not listed yet" as a missing major, the same as a school added later with no major, but 02 and 11 word the two differently.
- **The progress bar without Back or Skip** runs to the row's 16 padding on that side. 10 says "16 on each side", which could also mean 32 from the edge.
- **Step 3 with several schools:** each school's name has 24 above it (20 for the first, below the search) and its list 12 below. 10 says the name is "24 above its list", then gives 20 for the first as a distance from the search, so the 24 was read the same way.
- **An empty list with no search** says "No colleges listed yet." (or schools, majors). 10 only covers a search with no matches.
- **Skip's hit area** is the 44 tall link with 10 of padding each side, so it's 44 wide too.
- **The search key on the keyboard** puts the keyboard away. The list already filters as you type.
- **Choice rows** get 8 of padding above and below, so a name on two lines doesn't touch the row's edges.

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
- `NEXT_PUBLIC_FEATURES=all` in `.env.local` shows everything v1 hides, under `next dev` only (`lib/features.ts`). Restart `npm run dev` after changing it.
- `/dev/reset` (dev only) clears every `stackd.*` key from local and session storage and reloads `/welcome` as a first launch. It's `app/dev/reset/page.dev.tsx`; `next.config.ts` adds the `dev.tsx` page extension only under `next dev`, so production builds don't have the route.
- To see Welcome again, clear `stackd.seenWelcome` from local storage, or open `/dev/reset`.
- `npm run build` writes the static app to `out/` (stop the dev server first), and `npm start` serves it at `http://localhost:4000`.
- `npm run test:db` (schema and security) and `npm run test:import` (import pipeline) run on an in-memory database and touch nothing real.
- `npm run test:reminders` checks the reminder scheduling logic and copy with made-up clocks and a fake plugin.
- `npm run test:oauth` checks the Apple and Google callback handling. It calls no provider.
- Apple and Google sign-in work on `http://localhost:3000` (dev) and `http://localhost:4000` (`npm start`), the two addresses in Supabase's Redirect URLs. Another host or port falls back to the Site URL and the sign-in doesn't finish.
- If `next dev` answers 404 for `/auth/callback/` while other pages load, its cache is stale. Stop the dev server, delete `.next/dev`, and start it again. Seen once on 2026-10-10; the production build wasn't affected.
- Importing: see Phase 3 → Running the first slice. Deadlines files go in `data/raw/deadlines/` and run the same way (step 16, Abyan's part).
