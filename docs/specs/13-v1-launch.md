# 13 · v1 launch build

What the first App Store version contains, and what it hides. Decided October 12, 2026: ship a small, honest v1, then add features in updates. Revised October 14 after PR #2: Apple and Google sign-in stay (Apple uses the native sheet, Google opens in an in-app browser, and Google's consent screen is published), and the legal and support pages come from `12-legal-and-support.md`. This spec overrides any screen spec where they disagree, but only for the v1 release build. Everything hidden here stays in the code behind flags, so later updates turn it back on rather than rebuilding it.

Apple rejects apps that show placeholder, "coming soon", or unfinished screens (App Store Review Guideline 2.1), and apps with accounts must link a privacy policy (5.1.1). That's why most of this spec is about removing dead ends.

## Feature flags

One file, `lib/features.ts`, holds the flags. Production builds read these values; nothing else decides what's visible.

| Flag | v1 value | Hides |
|---|---|---|
| `essays` | off | Essays tile, Essays tab |
| `mentors` | off | Mentors tile, Mentors tab |
| `events` | off | Events tile |
| `explore` | off | Explore tab |
| `notifications` | off | The bell on Home |
| `upcoming` | off | The Upcoming section on Home |
| `trackApplication` | off | "Track application" on University (already hidden for real accounts) |
| `universityTabs` | off | Overview and Student life tabs on University |
| `savedSchools` | off | The heart on University (nothing lists saved schools yet) |
| `devRoutes` | off | `/dev/reset`, `/dev/components`, and any other `/dev/` route. They must not be in the release build at all, not just unlinked |

`NEXT_PUBLIC_DEMO_STRIP` is forced off in release builds, whatever `.env` says. A release build that can show a demo record is a bug.

## Sign in and Create account (06, 07)

Unchanged from PR #2: email, Apple (native sheet in the iOS app), and Google (in-app browser in the iOS app). Before submitting, test all three on a real iPhone through TestFlight, including cancelling each one.

## Home (02)

With the flags above, Home has no tiles, no Upcoming section and no bell.

```
┌───────────────────────────────┐
│ stackd                    (⚙) │  header: wordmark + gear only
│                               │  24
│ Hi, Ryan!            ╭husky╮  │  greeting as 02
│ Transferring to UC…  │     │  │
│ ▬                    ╰─────╯  │  32
│ ┌───────────────────────────┐ │
│ │ Your plan            Edit │ │  plan card or setup card (02 → Plan states)
│ │ UC San Diego              │ │
│ │ Computer Science B.S. …   │ │
│ └───────────────────────────┘ │  24
│ Unofficial planning tool. …   │  footer line (00), centered
│                               │  safe-area bottom + 24
└───────────────────────────────┘
```

- **Header**: the gear sits where the bell was (right edge 16), since the bell is gone.
- **No tab bar.** A tab bar with one tab isn't navigation, so it's hidden when only Home is enabled. The page's bottom padding becomes 24 + safe-area bottom.
- **Footer line**: the unofficial footer from 00, 24 below the card, because Home now names a university.
- The plan card is the only way into the University screen, and the setup card is the only way into onboarding from Home.

This is the screen's one bold element: the plan card (or the setup card's button). Nothing else competes with it.

## University (03)

With `universityTabs`, `trackApplication` and `savedSchools` off:

- No heart in the hero; only the back button.
- No tab row. "Transfer requirements" sits 24 below the meta line, and the URL drops `&tab=`.
- Content: the official agreement card (03 → Real accounts), then the footer line.

## Legal and support pages

As built in PR #2 and described in `12-legal-and-support.md`: Privacy, Terms and Support pages in the app, with public copies on the Vercel site. Two checks before submitting:

- The privacy text must match what the app really collects, including Apple and Google sign-in and Apple's private relay emails, and the App Store privacy answers must say the same.
- Every place that linked to the placeholder for Terms or Privacy (Create account, Settings) now opens the real page. Welcome has no such links and stays as drawn (01).

## Production cleanup

- `/dev/` routes excluded from the release build (`devRoutes` off), and a build check fails if any `/dev/` page is in the output.
- The existing check that the Supabase secret key isn't in the build output runs on every release build.
- The placeholder screen component stays in the code, but a check fails the build if any enabled screen links to it.
- Contact email constant set to `joinstackd@gmail.com` (it was "TODO"), if PR #2 didn't already.

## App Review account

Apple's reviewer needs a working login. PR #2 already made one; keep using it, and check it still has a saved plan:

- Email: an inbox you control, for example `joinstackd+review@gmail.com` (Gmail delivers `+` addresses to the main inbox).
- Confirm it with the code, save the Las Positas → UC San Diego CS plan, and keep the password somewhere safe.
- Put the email and password in App Store Connect → App Review Information, with this note (1.1): "Stackd is a transfer-planning app for California community college students. Sign in with the account above to see a saved plan. Home shows the next transfer deadlines and a checklist for the application. Deadlines lists every date with its official source. Reminders are local notifications, and the app asks for permission only when you tap Remind me."
- Don't delete this account or change its password while a review is open.

## 1.1 submission

Version 1.1.0 turns on the deadline features (`upcoming`, `getReady`, `deadlines`, `reminders`; `14`, `15`). Before submitting:

- **App Privacy answers:** check them against `/privacy/` (updated October 18, 2026). 1.1 adds the transfer term, the deadlines and checklist steps marked done, and the reminder days chosen for each deadline. All of it is user content linked to the student's account, used for app functionality only, and not used for tracking. Reminders are local notifications scheduled on the phone, so they need no data type of their own.
- **Screenshots:** a new 6.9-inch set taken from the 1.1 build, on a 6.9-inch simulator or iPhone. Show Home with Up next and Get ready, the Deadlines screen, and a date sheet.
- **Review note:** the 1.1 note above.
- **What's New:** "Deadlines are here. Home now shows your next transfer deadline with a countdown, and a checklist for your UC or Cal State application. The new Deadlines screen lists every date for your transfer year, each with its official source. Turn on reminders to get a heads-up before each one."
- **One version at a time:** 1.0 must be approved, released or withdrawn before 1.1 can go into review.

## Test

- Release build (`npm run build`): no `/dev/` routes in the output, no secret key, no demo strip, and no link anywhere to the placeholder screen.
- Email, Apple and Google sign-in all work on a real iPhone (TestFlight), and cancelling Apple or Google returns to Sign in with nothing shown.
- Home shows only the header (wordmark + gear), greeting, husky, the plan or setup card, and the footer line. No tab bar.
- University shows no heart, no tabs, and no Track application.
- Privacy and Terms open from Create account, and Privacy, Terms and Support from Settings; all three match the public pages.
- Every tappable thing in the app leads somewhere real.
