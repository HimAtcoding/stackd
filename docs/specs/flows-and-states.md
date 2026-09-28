# Flows and states

How the baseline screens connect, and the shared behavior every screen follows. Pixel values live in `00-foundations.md` and the screen specs. This file is only routing, copy, and states.

## Screens

| Screen | Route | Spec | Tab bar |
|---|---|---|---|
| Welcome | `/welcome` | `01-welcome.md` | No |
| Sign in | `/sign-in` | `06-sign-in.md` | No |
| Create account | `/sign-up` | `07-create-account.md` | No |
| Forgot password | `/forgot-password` | `08-forgot-password.md` | No |
| Home | `/` | `02-home.md` | Yes (Home) |
| University, requirements tab | `/universities/[slug]?tab=requirements` | `03-university-requirements.md` | No (pushed) |
| Essays | `/essays` | `04-essays.md` | Yes (Essays) |
| Task complete | Modal over any screen | `05-task-complete.md` | No |
| Placeholder | Any destination that isn't drawn yet | `00-foundations.md → Placeholder screen` (three versions: signed out, signed in, and `/`) | Depends on version |

Destinations that use the placeholder for now: the Terms and Privacy pages, Explore tab, Mentors tab, Events, notifications, requirement detail, "Track application", upcoming items, new essay, essay editor, feedback, the university Overview and Student life tabs, and the essays Resources tab. Every tap goes somewhere; nothing is a dead button.

## Navigation map

Getting in:

```
first launch:    Welcome ──Get started──▶ Create account ──Create account / Continue with──▶ Home
later launches:  session? ──yes──▶ Home
                         └─no───▶ Sign in ──Sign in / Continue with──▶ Home
between them:    Create account ◀──Sign in / Create an account──▶ Sign in
                 Sign in ──Forgot password?──▶ Forgot password ──Back to sign in──▶ Sign in
```

Inside the app:

```
Home ──Requirements tile──▶ University (pushed)
 │                              │
 │                        status circle
 │                              │
 │               journey step done? ──no──▶ toast "Marked complete"
 │                              │yes
 │                              ▼
 │                        Task complete ──Keep going──▶ back to University
 │                              └──View progress──▶ Home
 ├──Essays tile──▶ Essays tab
 └──Mentors / Events / bell / upcoming cards──▶ placeholder

Tab bar: Home · Explore · Essays · Mentors
```

- Welcome shows once. After that, launch goes to Home when `stackd.session` is set, and to Sign in when it isn't.
- "Get started" goes to Create account. Students with an account use its "Sign in" link.
- Switching between Sign in and Create account replaces the history entry, so Back doesn't bounce between them.
- The email field's contents follow the student across the three auth screens, in memory only.
- Signing in or creating an account replaces the history entry with Home, so Back never returns to an auth screen.
- Every screen except Welcome and the three auth screens needs a session. Without one: if `stackd.seenWelcome` isn't set, redirect to `/welcome`; otherwise redirect to `/sign-in`.
- Tab bar destinations that aren't built yet (`/explore`, `/essays`, `/mentors`) render the placeholder screen, never a 404.
- Tabs switch instantly and keep their own scroll position.
- The university screen is pushed over Home. Back returns to Home at the same scroll position.
- The task-complete modal returns to the screen it covered ("Keep going") or goes to Home ("View progress").

## Local state

The demo has a sign-in screen but no real accounts: `lib/auth/demo.ts` stands in for auth (`06-sign-in.md → Auth interface`). Everything the student changes lives in local storage, read and written in try/catch. Passwords and emails are never stored.

| Key | Holds | Written by |
|---|---|---|
| `stackd.seenWelcome` | `"1"` after Get started | 01 |
| `stackd.session` | `"demo"` after a successful sign-in or sign-up | 06, 07 |
| `stackd.profile` | `{ firstName }` from Create account | 07 (read by 02) |
| `stackd.requirements` | `{ [requirementId]: status }` overrides on top of demo data | 03 |
| `stackd.saved` | Saved university slugs | 03 heart |
| `stackd.celebrated` | Journey step ids already celebrated this session (sessionStorage) | 05 |

## Celebration rule

Full-screen celebration only when a journey step completes. Anything smaller gets the inline check plus a "Marked complete" toast with Undo. At most once per step per session. Timing and layout are in `05-task-complete.md`.

## Copy rules

- Student words, not official terms. Use the "What the UI says" column of the vocabulary table in `04-california-transfer-domain.md`.
- Sentence case everywhere.
- Buttons say what happens, and an action keeps its name through the flow: "New essay" on the button and in the empty state; marking done gives "Marked complete".
- Any sentence about the student's own situation ("You're closer than you think", "you're on track") comes from demo JSON, never from a component.
- No admission predictions in any form.
- Relative times: "just now", "{n} min ago", "{n}h ago", then "Sep 24". Counts use tabular figures and are computed from data.

## Field validation

On submit only, never while typing. After a failed submit, each field re-checks as it changes. Messages: "Enter your first name.", "Enter your email.", "Enter an email like name@example.com.", "Enter your password.", "Create a password.", "Use at least 8 characters." Details in 06 and 07.

## Empty states

| Where | Title | Body | Action |
|---|---|---|---|
| Undrawn screen | This part isn't built yet | It's on the list. Your plan is still on the home screen. | Back to home |
| No essays | No essays yet | Start a draft and it'll show up here. | New essay |
| No requirements for a school | No requirements loaded for this school | We don't have this school's requirements yet. | Back to home |
| Home, nothing upcoming | Inline line: "Nothing coming up. Deadlines you save will show here." | | |

## Error states

Shown in place of the part that failed. The rest of the screen stays usable. No apologies.

| Failure | Title | Body | Action |
|---|---|---|---|
| Data didn't load | Couldn't load requirements | Check your connection, then try again. | Try again |
| Wrong email or password | Couldn't sign you in | That email and password don't match. Check them, or reset your password. | (none) |
| Sign-in network failure | Couldn't reach Stackd | Check your connection, then try again. | (none; the Sign in button is the retry) |
| Email already has an account | That email already has an account | Sign in with it, or use a different email. | Sign in |
| Local storage blocked (private browsing) | Changes won't be saved on this device | Private browsing blocks saving. Your checkmarks will reset when you close this tab. | Dismiss |

## Trust elements

Required by `06-trust-and-provenance.md`, on every build until real data replaces demo data:
- **Demo strip** ("Demo data") on every screen showing a demo record.
- **Unofficial footer line** on Welcome and on any screen that names a university.

## Quality floor

Designed at 393 × 852, works from 320 to 480 wide, centered beyond. 44 × 44 minimum touch targets. Visible keyboard focus. Contrast 4.5:1 for text, 3:1 for icons and control edges. Primary actions in the bottom half or the tab bar. Every animation respects `prefers-reduced-motion`. Art never blocks layout: text and buttons work before any image loads.
