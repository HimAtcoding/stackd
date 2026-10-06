# 11 · Settings

Route: `/settings/`. Pushed screen, no tab bar. No mockup: built from the circle button, the list container and rows from 03, and the toast. It holds the student's plan answers, their account, sign out, and account deletion. Apple requires apps that let people create an account to let them delete it from inside the app (App Store Review Guideline 5.1.1(v)), so Delete account is required for launch.

Opened from the gear button on Home's header (02).

## Mobbin references

| Screen | What it grounds |
|---|---|
| [Yuka account](https://mobbin.com/screens/c1cb62aa-a7ae-4f6b-a481-167319b76b28) | Grouped rows with label left, value right, chevron, and Sign out on its own below the groups |
| [Luma account settings](https://mobbin.com/screens/b83035f0-7cec-4920-bc66-aff9c29b77c7) | Section names above each group, Delete account alone at the bottom in red text |
| [Opal my account](https://mobbin.com/screens/d5e4b0a7-4221-461a-b7b1-3f1ead469c61) | Floating circle back button at the top left, sign out separate from account details |

## Layout

```
┌───────────────────────────────┐  --sky-50, no gradient
│ (←)                           │  circle button, safe-area top + 8
│                               │  24
│ Settings                      │  title-1, x 24
│                               │  24
│ Your plan                     │  title-3, x 24
│ ┌───────────────────────────┐ │  12
│ │ College   Las Positas Co… >│ │  rows 56
│ │ Schools        UC San Diego>│ │
│ │ Major     Computer Science >│ │
│ └───────────────────────────┘ │  24
│ Account                       │
│ ┌───────────────────────────┐ │
│ │ Email     ryan@example.com │ │  no chevron, not tappable
│ │ Change password           >│ │
│ └───────────────────────────┘ │  24
│ ┌───────────────────────────┐ │
│ │ Sign out                   │ │
│ └───────────────────────────┘ │  24
│ ┌───────────────────────────┐ │
│ │ Delete account             │ │  --coral-700 label
│ └───────────────────────────┘ │  24
│ Unofficial planning tool. …   │  footer line
│      Terms   Privacy          │
│        Stackd 0.1.0           │  safe-area bottom + 24
└───────────────────────────────┘
```

Alignment: left. Text at x 24, containers at 16. The page scrolls if it has to.

## Header

| Element | Spec |
|---|---|
| Back | Circle button (00), `ArrowLeft` bold 22, `aria-label="Back"`, safe-area top + 8, left 16. Returns to Home |
| Title | "Settings", `title-1` `--navy-900`, `h1`, x 24, 24 below the back button |

No demo strip: this screen shows no demo records.

## Groups

Each group is a list container (03: margins 16, `--surface`, 1 px `--border`, `--r-md`, `--shadow-card`). Section names are `title-3` `--navy-900` `h2` at x 24, 12 above their container. Groups are 24 apart. Sign out and Delete account each sit in their own container with no section name, because each one is a single action unlike the rows around it.

**Settings row**: height 56, padding 0 16, 1 px `--border` between rows.

| Part | Spec |
|---|---|
| Label | `row-title` `--navy-900`, left |
| Value | `body` `--slate-600`, right-aligned, single line with an ellipsis, max 60% of the row. 12 gap to the chevron |
| Chevron | `CaretRight` bold 20 `--navy-900`, `aria-hidden`, only on rows that open another screen (as in 03) |
| Pressed | `--surface-pressed` |

A tappable row is one `<a>` or `<button>` whose name includes the value, for example "College, Las Positas College".

### Your plan

| Row | Value | Opens |
|---|---|---|
| College | The home college's name, or "Not listed" | `/onboarding/?step=college&edit=1` |
| Schools | One school: its name. More: "{n} schools" | `/onboarding/?step=schools&edit=1` |
| Major | One target: the major's name, or "Not listed yet". Several with the same major: that name. Several different: "{n} majors". Any target missing a major: "Pick a major" in `--blue-600` | `/onboarding/?step=major&edit=1` |

A student who skipped onboarding sees one row instead of the three: "Set up your plan", label in `--blue-600`, with a chevron, opening `/onboarding/?step=college` in first-run mode but without Skip.

### Account

| Row | Spec |
|---|---|
| Email | Value: the account's email. Not tappable, no chevron, no pressed state |
| Change password | Only for accounts with a password (hidden for Apple and Google sign-ins). Tap: calls `sendPasswordReset(email)`. While waiting, a 20 px `--navy-900` ring spinner replaces the chevron and the row is disabled. `ok`: push `/enter-code/?for=reset` (09). `rate_limited` or `network`: a toast with the same words as 08's errors ("Too many tries. Wait a few minutes, then try again." / "Couldn't reach Stackd. Check your connection, then try again."), and the row returns to normal |

After a password change started from here, the "Password saved" toast lands on Home, as 09 says.

### Sign out

One row, label "Sign out", no value, no chevron. No confirmation: the plan and progress are saved to the account, so nothing is lost.

Tap: sign out of Supabase, clear the student's cached data on the device (session, profile, saved progress copies), then replace history with `/sign-in`, 200 ms crossfade, toast "Signed out". `/dev/reset` stays for development only.

### Delete account

One row, label "Delete account" in `--coral-700` (`row-title`), no chevron. Tap: opens the confirm sheet.

**Confirm sheet**: a bottom sheet over a `rgba(5,16,66,.4)` scrim.

| Part | Spec |
|---|---|
| Sheet | `--surface`, radius `--r-sheet` (24) on the top corners, padding 24 24 `calc(24px + env(safe-area-inset-bottom))`. Enters translateY 100% → 0 over 280 ms `--ease-out`; scrim fades in 200 ms. Exits in 200 ms. Reduced motion: fade only |
| Title | "Delete your account?" `title-2` `--navy-900`. `role="dialog"`, `aria-modal="true"`, `aria-labelledby` the title. Focus starts on the title |
| Body | "This deletes your account, your plan, and your progress from Stackd. You can't undo it." `body` `--slate-700`, 8 below |
| Delete button | 24 below. Same shape as the primary button (56, `--r-full`, `button-lg` white) but background `--coral-700` and no chevron or blue shadow. Label "Delete account". Pressed: `scale(0.97)`, background darkened with `rgba(0,0,0,.12)` overlay. This is the one coral fill in the app, used only for deleting |
| Keep button | Text link (00), `link` `--blue-600`, centered, 12 below: "Keep my account". Closes the sheet. A tap on the scrim or Escape does the same |

While deleting: the Delete button shows the loading state, and Keep my account is disabled.

| Result | What the student sees |
|---|---|
| Deleted | Sign out locally as above, replace history with `/welcome`, toast "Account deleted" |
| Network failure | Inline error (00) inside the sheet, 12 above the Delete button: "Couldn't delete your account" / "Check your connection, then try again." |

Deleting the account must also delete the student's profile, targets, and saved progress. Removing a user from Supabase Auth needs the service role key, which never goes in the app, so this runs on Supabase's side: a Supabase Edge Function (or a database function with the right permissions) that deletes the signed-in user only. Claude Code picks how and says which in its plan.

## Footer

24 below the Delete account container:

- Unofficial footer line (00), centered.
- 8 below: "Terms" and "Privacy" as small text links (`label` `--blue-600`), centered, 24 apart, 44 hit areas. Placeholder screens until those pages exist. Both are required before App Store review.
- 8 below: "Stackd {version}", `caption` `--slate-600`, centered, from the app's version number.

## Motion

Push in and out per 00. Pressed states. The confirm sheet as above. Nothing on load.

## Test

- Home's gear opens Settings. Back returns to Home at the same scroll position.
- With the Las Positas → UC San Diego CS plan: College, Schools and Major show those names.
- Tap Schools, add nothing, tap Save plan: back to Settings with "Plan saved".
- A skipped plan shows only "Set up your plan".
- Change password: a real code arrives by email, Enter code works, and Home shows "Password saved". Then sign out and sign in with the new password.
- Sign out: Sign in screen with "Signed out". Back doesn't return to Settings. Home redirects to Sign in.
- Delete account with a throwaway real account: the sheet opens with focus on its title. "Keep my account" closes it. Delete account lands on Welcome with "Account deleted". In Supabase → Authentication → Users the account is gone, along with its profile and targets. Signing in with it shows "Couldn't sign you in".
- At 320 wide, long values truncate with an ellipsis and labels never do.
