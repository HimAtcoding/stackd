# 08 · Forgot password

Route: `/forgot-password`. No tab bar. No mockup: built from the sign-in screen's parts (`06-sign-in.md`) minus the husky, the wordmark, the social buttons, and the divider. It has two states on the same route: the request form, and "Check your email".

## Mobbin references

| Screen | What it grounds |
|---|---|
| [MyFitnessPal log in](https://mobbin.com/screens/7336baf0-22a8-4e07-be82-59bd383432a4) | Labelled field above one full-width blue button, same field and button sizes as 06 |
| [Fresha venue detail](https://mobbin.com/screens/a659b05e-4558-4a00-827f-927eb225db13) | 44 floating circle back button at safe-top + 8, left 16 (also used on 03) |
| [Grab drafts, empty](https://mobbin.com/screens/83c0a32d-65e3-441d-9d8a-c532c338105e) | Confirmation layout: centered illustration, bold title, one muted line. Our empty state (00) already follows this |

## Why no husky

This screen is a short errand for a student who's already stuck. One field, one button, nothing to look past. The husky stays on the screens that greet the student (Welcome, Sign in, Create account).

## Request state layout

```
┌───────────────────────────────┐  --sky-100 → --sky-50, no clouds
│ Demo data                     │
│ (←)                           │  circle button 44, 8 below strip
│                               │  24
│ Forgot your                   │  display 38/42, x 24
│ password?                     │
│ Enter the email you signed up │  body-md 16/22, 8 below, max 330
│ with and we'll send a link to │
│ reset your password.          │
│╭─────────────────────────────╮│  24, sheet as in 06
││ Email                       ││  pad 20
││ [✉  you@example.com       ] ││
││ (     Send reset link     >) ││  16, primary 56
││                             ││  flexible
││   Remembered it? Sign in    ││  body 15/20, centered
│╰─────────────────────────────╯│  safe-area bottom + 16
└───────────────────────────────┘
```

Alignment: left, as on 06. The page never needs to scroll at 393 × 852.

| Element | Spec |
|---|---|
| Background | Same gradient as 06, without the clouds art |
| Back | Circle button (00), `ArrowLeft` bold 22, `aria-label="Back"`, top = strip bottom + 8, left 16. History back; with no history, `/sign-in` |
| Headline | "Forgot your password?" `display`, `--navy-900`, `h1`, x 24, 24 below the back button, max-width 240 so it breaks after "your" |
| Subtitle | "Enter the email you signed up with and we'll send a link to reset your password." `body-md` `--navy-900`, 8 below, max-width 330 |
| Sheet | Same as 06 (inset 16, radius 20 top, runs to the bottom, 20 top padding, content at x 32), 24 below the subtitle |
| Email field | Identical to the email field on 06. `enterkeyhint="send"`. If the student typed an email on Sign in, it arrives prefilled (passed in memory, never in the URL) |
| Button | Primary "Send reset link", 16 below the field |
| Bottom line | "Remembered it?" `body` `--slate-600`, 6 gap, "Sign in" `link` `--blue-600`. `margin-top: auto`, min 20 above. Goes to `/sign-in`, replacing this history entry, carrying the email back |

**Validation**: the email rules and messages from 06, on submit only.

**While sending**: the button's loading state, the field read-only.

**Errors**: only `network` is shown, as the inline error (00) 12 above the button: "Couldn't reach Stackd" / "Check your connection, then try again." There is no "no account with that email" error. Saying whether an email has an account tells anyone who types it in, so the confirmation is the same either way.

## Check-your-email state

Replaces the sheet's contents after `auth.sendPasswordReset` returns `ok`. Same route, same sheet, same top block, except the headline and subtitle change too.

```
│ (←)                           │
│ Check your                    │  display, breaks after "your"
│ email                         │
│ We sent a reset link to       │  body-md, 8 below
│ you@example.com.              │  the email in 600 weight
│╭─────────────────────────────╮│
││          ╭────╮             ││  pad 32
││          │ ✉✓ │             ││  72 circle --tint-sky, icon 32
││          ╰────╯             ││
││ If there's an account for   ││  16, body --slate-600, centered
││ this email, the link will   ││
││ arrive in a few minutes.    ││
││ Check your spam folder too. ││
││ (      Back to sign in    >) ││  24, primary 56
││      Send again in 30s      ││  12, link, disabled until 0
│╰─────────────────────────────╯│
```

| Element | Spec |
|---|---|
| Headline | "Check your email" (same style and max-width as the request state) |
| Subtitle | "We sent a reset link to {email}." The email in weight 600, `word-break: break-all` so a long address wraps |
| Icon | 72 circle, `--tint-sky`, `EnvelopeSimpleOpen` fill 32 `--blue-600`, centered, 32 below the sheet top, `aria-hidden` |
| Body | "If there's an account for this email, the link will arrive in a few minutes. Check your spam folder too." `body` `--slate-600`, centered, max-width 280, 16 below the icon |
| Button | Primary "Back to sign in", 24 below the body. Goes to `/sign-in`, replacing this history entry, email carried over |
| Resend | Text link, centered, 12 below the button. For 30 s it's disabled and reads "Send again in {n}s" in `--slate-600` (counts down each second, `aria-live="off"` so screen readers aren't flooded). Then it reads "Send again" in `--blue-600`. Tapping it calls `sendPasswordReset` again and restarts the 30 s. A toast confirms: "Reset link sent" |

**Transition**: the sheet contents and the headline crossfade over 200 ms. Focus moves to the new headline (`tabindex="-1"`). Under reduced motion, the swap is instant.

The back button in this state returns to the request state, with the email still filled in, rather than leaving the screen.

## Motion

No non-triggered motion on this screen. Field, error, and state-swap motion only, as above.

## Test

- Arrive from Sign in with an email typed: it's prefilled here.
- Submit empty: "Enter your email." and focus on the field.
- Submit a valid email: loading, then "Check your email" with that address in the subtitle, and focus on the headline.
- "Send again" is disabled for 30 s, then sends and restarts the count.
- Email `offline@example.com`: the connection error, and no state change.
- Any email that isn't registered gets exactly the same confirmation as one that is.
