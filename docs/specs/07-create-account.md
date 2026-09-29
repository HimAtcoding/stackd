# 07 · Create account

Route: `/sign-up`. No tab bar. No mockup: this screen is the sign-in screen (`06-sign-in.md`, drawn in `../mockup/mockup-sign-in.png`) with one field added, the forgot link removed, and new copy. Everything not listed here is identical to 06: background, top block layout, husky, sheet, field component, social buttons, divider, motion, and accessibility rules.

## Mobbin references

| Screen | What it grounds |
|---|---|
| [MyFitnessPal log in](https://mobbin.com/screens/7336baf0-22a8-4e07-be82-59bd383432a4) | Same field + CTA + "or" + social stack we use on 06; the sign-up version keeps the stack and only changes fields and copy |
| [Rodeo welcome](https://mobbin.com/screens/0918d7b7-2c6f-4848-b8dd-6ffd632674bd) | Terms and privacy line in small muted text at the very bottom |
| [DailyArt sign in](https://mobbin.com/screens/6bec1364-2e10-48d4-95d5-a124a7386380) | The "have an account? / don't have an account?" switch line pinned to the bottom |

## Differences from 06

| Part | 06 Sign in | 07 Create account |
|---|---|---|
| Headline | Welcome back! | Let's get started! (breaks after "get" at max-width 190) |
| Subtitle | Your transfer journey is waiting. (max-width 160) | Save your plan and pick up where you left off. (max-width 180, so it's two lines) |
| Fields | Email, Password | First name, Email, Password |
| Password `autocomplete` | `current-password` | `new-password` |
| Under the password field | "Forgot password?" link | Hint line "At least 8 characters." |
| Primary button | Sign in | Create account |
| Bottom line | New to stackd? Create an account | Already have an account? Sign in |
| Terms line | none | Below the bottom line (see below) |
| Page height | Fits 852 without scrolling | Scrolls. The Create account button must be fully visible at 393 × 852 before scrolling |

## Layout

```
┌───────────────────────────────┐
│ stackd                        │  same top block as 06
│                     ⸝⸝ ╭husky╮│
│ Let's get               │wave ││
│ started!                │     ││
│ Save your plan and pick │     ││
│ up where you left off.  ╰─────╯│
│╭─────────────────────────────╮│
││ First name                  ││  pad 20
││ [👤  Alex                  ] ││
││ Email                       ││  16
││ [✉  you@example.com       ] ││
││ Password                    ││  16
││ [🔒 ••••••••           👁 ] ││
││ At least 8 characters.      ││  hint, 6 below
││ (      Create account     >) ││  16, primary 56
││ ─────────── or ──────────── ││  12 / 24 / 12
││ [      Continue with Apple ] ││
││ [     Continue with Google ] ││  12
││                             ││  flexible, min 20
││ Already have an account?    ││  body 15/20, centered
││            Sign in          ││
││ By creating an account, you ││  12, caption, centered
││ agree to the Terms and …    ││
│╰─────────────────────────────╯│  safe-area bottom + 16
└───────────────────────────────┘
```

At 393 × 852 the sheet starts at 303 (same top block as 06). The Create account button sits at 303 + 20 + 3 × (22 + 8 + 48) + 2 × 16 + 24 + 16 = 629 to 685, so it's visible without scrolling. The social buttons and bottom lines may need a scroll, which is fine on a form this length.

## Fields

Shared text field (00), same spacing as 06.

| | First name | Email | Password |
|---|---|---|---|
| Label | "First name" | "Email" | "Password" |
| Leading icon | `User` regular 22 | `Envelope` regular 22 | `Lock` regular 22 |
| Placeholder | none | "you@example.com" | none |
| `type` | `text` | `email` | `password` / `text` while shown |
| `autocomplete` | `given-name` | `email` | `new-password` |
| `autocapitalize` | `words` | `off` | `off` |
| `enterkeyhint` | `next` | `next` | `go` |
| Trailing control | none | none | Show/hide toggle, same as 06 |

**Hint line** under the password field: the text field's hint state (00), "At least 8 characters." It stays visible while the field is valid. On a failed submit it turns into the error message for that field.

First name is used for the greeting on Home ("Hi, {firstName}!"). Only the first name is asked for, because it's all the app uses.

## Validation

Same rules as 06: check on submit only, then re-check each field as it changes. Focus moves to the first field with an error.

| Field | Condition | Message |
|---|---|---|
| First name | Empty after trimming spaces | Enter your first name. |
| Email | Empty | Enter your email. |
| Email | Not a valid address | Enter an email like name@example.com. |
| Password | Empty | Create a password. |
| Password | Fewer than 8 characters | Use at least 8 characters. |

No other password rules (no required symbols or numbers). Length is what matters, and extra rules make students write passwords down.

## Account errors

Inline error component (00), 12 above the Create account button, `role="alert"`, clears when any field changes.

| Result from `auth.signUp` | Title | Body | Action |
|---|---|---|---|
| `email_taken` | That email already has an account | Sign in with it, or use a different email. | Tinted button "Sign in", which opens `/sign-in` with the email carried over |
| `network` | Couldn't reach Stackd | Check your connection, then try again. | none |

Social button results are handled exactly as on 06.

## Links

| Text | Goes to |
|---|---|
| "Sign in" (bottom line) | `/sign-in`, replacing this history entry. Whatever is in the email field carries over (in memory, never in the URL) |
| "Terms" and "Privacy Policy" | Placeholder screen until those pages exist |

**Bottom line**: "Already have an account?" `body` `--slate-600`, 6 gap, "Sign in" `link` `--blue-600`. Same position rules as 06.

**Terms line**: 12 below the bottom line, centered, max-width 300. `caption` (13/16) `--slate-600`: "By creating an account, you agree to the Terms and Privacy Policy." "Terms" and "Privacy Policy" are small text links (`label` weight 600 at 13/16, `--blue-600`) with 44-tall hit areas. `06-trust-and-provenance.md` requires a terms page before the first real user.

## After creating the account

Same as signing in: write the session, save the first name (see Auth in `06-sign-in.md`), replace the history entry with `/`, 200 ms crossfade.

## Test

- Submit empty: three messages, focus on First name. The password hint is replaced by "Create a password."
- Password `abc`: "Use at least 8 characters." Typing up to 8 characters restores the hint line.
- Email `taken@example.com`: the "already has an account" error with a working Sign in button, and the email is filled in on the sign-in screen.
- Successful demo sign-up with first name "Maya": Home says "Hi, Maya!".
- At 393 × 852 the Create account button is visible without scrolling.
- iOS offers a strong password suggestion in the password field.
