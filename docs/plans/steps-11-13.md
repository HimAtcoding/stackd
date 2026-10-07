# Plan: build steps 11–13

Onboarding (`10-onboarding.md`), Home plan states and the University agreement card (`02 → Plan states`, `03 → Real accounts`), and Settings (`11-settings.md`). All built and tested in real mode against the Supabase project, with no demo records on these screens. Agreed October 2026; nothing is built yet.

## Decisions

| Decision | Choice |
|---|---|
| Sign out | This device only (Supabase `signOut({ scope: "local" })`), then clear the device's cached copies of the student's data |
| Delete account | A database function, `delete_my_account()`, not an Edge Function. It can end every session, since deleting the auth user removes them all |
| `delete_my_account()` | `security definer` with an empty `search_path`, deleting only `auth.users where id = auth.uid()`. It takes no id. `anon` and `public` can't call it. If the project refuses the delete, switch to an Edge Function, and ask first |
| Onboarding entry points | `&from=signup`, `&from=home` or `&from=settings` on `/onboarding/?step=…` (table below). `&edit=1` stays as 10 says |
| Demo mode (`NEXT_PUBLIC_DEMO_STRIP=on`) | Home as before, the gear hidden, and sign-up straight to Home. Onboarding and Settings need a real account |
| College short name | No new column. The agreement card says "Las Positas College courses" |
| `save_plan` | `security invoker`, so row-level security applies as the student |
| Target order | A new `user_targets.position` keeps schools in the order they were chosen |
| "Not listed yet" (added October 6) | A new `user_targets.major_not_listed`. A school with no major is either "Not listed yet" (true) or not picked yet (false), and Home and Settings word the two differently |
| Throwaway test account | `oko15075+stackd-a@gmail.com` |

### Back and Skip on onboarding step 1

| Arriving from | Back on step 1 | Skip |
|---|---|---|
| Sign-up (`from=signup`) | No | Yes |
| Home's setup card (`from=home`) | Yes, to Home | Yes |
| Settings' "Set up your plan" (`from=settings`) | Yes, to Settings | No |
| A Settings edit (`edit=1`) | Yes, to Settings without saving | No (and no progress bar or step count) |

A query parameter survives a reload, unlike an in-memory flag.

## Database: one migration

`supabase/migrations/20261007…_plans_and_account.sql`:

- **`user_targets.position`** (`smallint`, not null). Rows saved in one go share a `created_at`, so time can't give the order.
- **`user_targets.major_not_listed`** (`boolean`, not null, default false), with a check that it's never true alongside a major.
- **`save_plan(p_home_institution_id uuid, p_update_home boolean, p_targets jsonb)`**: `security invoker`. In one transaction:
  - sets the home college when `p_update_home` is true
  - when `p_targets` isn't null, replaces the student's targets with that list, in order (`[{ institution_id, major_id, major_not_listed }]`, `major_id` may be null)
  - removing a school also deletes that school's saved requirement statuses for the student (10 → Editing from Settings)

  Onboarding's Save plan calls it once with everything. Each Settings edit saves only its own part.
- **`delete_my_account()`**, as in Decisions. `profiles`, `user_targets`, `user_requirement_status`, `saved_courses` and `saved_schools` already reference `auth.users` with `on delete cascade`, so they go in the same transaction.
- **Grants:** both functions are executable by `authenticated` only.
- **Tests:** `npm run test:db` gains checks that:
  - `save_plan` only writes the caller's rows, and applies all or nothing
  - removed schools take their progress with them
  - `delete_my_account` cascades to every per-student table and can't reach another student
  - `anon` can't call either function
- **Applying:** `npx supabase db push`, by Ryan.

**Risk:** Supabase recommends its admin API for deleting users. A direct delete from `auth.users` is a common pattern, but it depends on the project's `postgres` role being allowed to do it. The first real delete, with the throwaway account, proves it. If it's refused: stop, propose the Edge Function, and ask.

## Reading the plan (`lib/data/`, real mode)

- `getPlan()`: the profile (first name, home college) and the targets in `position` order, each with its school and major.
- `getInstitutions(type)`, `getMajors(institutionIds)`: the onboarding lists.
- `getUniversity(slug)`, and the agreement link for the student's path (home college → this school → their major), the latest academic year.
- They read with the anon key and row-level security, joining tables in the query, so no extra database functions are needed.
- **`lib/format.ts`** turns stored codes into what the specs show: `system` `UC` / `CSU` → "Public university", `degree_type` `BS` → "B.S.".

## Step 11: Onboarding

- **Route:** `app/(app)/onboarding/`. It needs a session and has no tab bar.
- **New shared components:**
  - choice row and choice circle (`components/ui/choice-row.tsx`, as in 00)
  - a search field: the text field with a `MagnifyingGlass` icon and a clear button
  - the pinned bottom area with its fade
- **One page for all three steps,** so changing `?step=` keeps the choices.
  - Each step loads its list, with 10's loading and error states. Search filters live, and the "isn't listed" rows stay visible.
  - Choices are checked on tap. Save plan calls `save_plan` once; a failure shows the inline error and keeps the choices.
- **Entry:**
  - Create account (no code needed) and Enter code (confirm) go to `/onboarding/?step=college&from=signup`, and "Email confirmed" shows there.
  - Saving lands on Home with "Plan saved", using the one-time message from `lib/flash.ts`.

## Step 12: Home plan states and the University agreement card

- **Home in real mode:**
  - The greeting comes from the profile ("Hi there!" when there's no name), with the subtitle for the state.
  - The setup card or the plan card ("Edit" opens Settings), with the husky anchored to whichever card comes first under the greeting.
  - Requirements tile: the first school, or setup. Essays, Mentors and Events: "Coming soon", with no unread dot.
  - The bell without a dot, the empty Upcoming line, and no demo strip.
- **02's other rev 3 changes, in both modes:**
  - the gear 8 left of the bell (hidden in demo mode, per Decisions)
  - the husky anchored to the card wrapper
  - square ends on the journey track and fill
  - Mentors' title clearing the unread dot by 20
- **University in real mode:**
  - Name and meta from the database, the campus image picked by slug, and the heart saving to the account.
  - Requirements tab: "{college} to {major}.", then the official agreement card. "Open on ASSIST" opens the imported link outside the app (`target="_blank" rel="noopener"`). Without a link, the card shows the "Open ASSIST" version.
  - Track application and the reminder banner are hidden. A slug that isn't in the database gets the placeholder.

## Step 13: Settings

- **Route:** `app/(app)/settings/`, pushed from Home's gear.
- **New shared components:** settings row, bottom sheet (focus held inside the sheet, closed by Escape or a tap on the scrim, slides up or only fades under reduced motion), and the destructive button, all as in 00.
- **Your plan:** College, Schools and Major rows, or the single "Set up your plan" row (`from=settings`). Each row opens its onboarding step with `edit=1`.
- **Account:** Email, and Change password: a spinner while sending, then Enter code (reset), then "Password saved" on Home.
- **Sign out:** this device only, then the device's cached copies cleared, then Sign in with "Signed out".
- **Delete account:** the confirm sheet, then `delete_my_account()`. Then a local sign-out, everything on the device cleared including "Welcome seen", then Welcome with "Account deleted".
- **Footer:** the unofficial line, Terms and Privacy, and "Stackd {version}" from `package.json` (passed through `next.config`).
- **The one-time message** (`lib/flash.ts`) is also read on Sign in and Welcome.

## Testing

- **Accounts:**
  - `oko15075+stackd-a@gmail.com`, a new account. It goes to Ryan's inbox and is the throwaway deleted at the end of step 13.
  - Ryan's main account, for the "sign in on another browser" checks.
- **Driving:** Playwright scripts against the dev server in real mode. They wait for codes Ryan pastes in chat, about three in total: account A's confirmation, the Change password reset, and possibly one more if a step needs a fresh account.
- **Coverage:** every line of 10's Test, 02's and 03's rev 3 Tests, and 11's Test, at 393 × 852 and 320 wide.
- **Delete check:** after deleting account A:
  - a query with its old token finds nothing
  - signing in with it shows "Couldn't sign you in"
  - Ryan confirms it's gone from Supabase → Authentication → Users
- **Mobbin:** each spec's references, pulled after its step is built. Differences only.
- **After each step:** commit, update `docs/build-status.md`, push, and screenshots at 393 × 852.

## What Ryan does

1. After step 11's migration is written: `npx supabase db push`.
2. Codes from the inbox when asked.
3. After the delete test: confirm the account is gone in Supabase → Authentication → Users.
