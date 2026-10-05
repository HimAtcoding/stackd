# 08 · Forgot password

Route: `/forgot-password`. No tab bar. No mockup: built from the sign-in screen's parts (`06-sign-in.md`) minus the wordmark, the social buttons, and the divider.

Rev 3 (October 2026): the reset email now carries a 6-digit code instead of a link. The "Check your email" state is gone. After sending, the student goes to Enter code (`09-enter-code.md`), which handles the code, resending, and the new password. This screen is now only the request form.

## Mobbin references

| Screen | What it grounds |
|---|---|
| [MyFitnessPal log in](https://mobbin.com/screens/7336baf0-22a8-4e07-be82-59bd383432a4) | Labelled field above one full-width blue button, same field and button sizes as 06 |
| [Fresha venue detail](https://mobbin.com/screens/a659b05e-4558-4a00-827f-927eb225db13) | 44 floating circle back button at safe-top + 8, left 16 (also used on 03) |

## Layout

```
┌───────────────────────────────┐  same background as 06
│ (←)                           │  circle button 44, safe-area top + 8
│                     ╭husky─╮  │  24
│ Reset your          │ 144  │  │  display 38/42, x 24, max 200
│ password            │ wide │  │
│ We'll email you a   │      │  │  body-md 16/22, 8 below, max 190
│ code to reset it.   ╰──────╯  │  24
│╭─────────────────────────────╮│  sheet as in 06, covers husky's base
││ Email                       ││  pad 20
││ [✉  you@example.com       ] ││
││ (         Send code       >) ││  16, primary 56
││                             ││  flexible
││   Remembered it? Sign in    ││  body 15/20, centered
│╰─────────────────────────────╯│  safe-area bottom + 16
└───────────────────────────────┘
```

Alignment: left, as on 06. The page never needs to scroll at 393 × 852.

| Element | Spec |
|---|---|
| Background | Same as 06 |
| Back | Circle button (00), `ArrowLeft` bold 22, `aria-label="Back"`, top = safe-area top + 8, left 16. No demo strip on this screen. History back; with no history, `/sign-in` |
| Headline | "Reset your password" `display`, `--navy-900`, `h1`, x 24, 24 below the back button, max-width 200 so it breaks after "your". The link that opens this screen still says "Forgot password?" |
| Subtitle | "We'll email you a code to reset it." `body-md` `--navy-900`, 8 below, max-width 190 |
| Husky | `husky-forgot`, width 144, height auto (~152). `position: absolute; right: 16px;` with its bottom edge 4 below the sheet's top edge, so the sheet covers the cut, exactly as on 06. `alt=""`. Hidden below 372 wide (between 360 and 371 the headline would run under it) |
| Sheet | Same as 06 (inset 16, radius 20 top, runs to the bottom, 20 top padding, content at x 32), 24 below the subtitle |
| Email field | Identical to the email field on 06. `enterkeyhint="send"`. If the student typed an email on Sign in, it arrives prefilled (passed in memory, never in the URL) |
| Button | Primary "Send code", 16 below the field |
| Bottom line | "Remembered it?" `body` `--slate-600`, 6 gap, "Sign in" `link` `--blue-600`. `margin-top: auto`, min 20 above. Goes to `/sign-in`, replacing this history entry, carrying the email back |

**Validation**: the email rules and messages from 06, on submit only.

**While sending**: the button's loading state, the field read-only.

## Results of `sendPasswordReset`

| Result | What happens |
|---|---|
| `ok` | Push `/enter-code/?for=reset` with the email in memory. Back from there returns here with the email still filled in |
| `rate_limited` | Inline error (00), 12 above the button: "Too many tries" / "Wait a few minutes, then try again." |
| `network` | Inline error, 12 above the button: "Couldn't reach Stackd" / "Check your connection, then try again." |

There is no "no account with that email" error. Saying whether an email has an account tells anyone who types it in. Supabase returns `ok` either way, the student moves on to Enter code either way, and an unregistered email simply never gets a code.

## Supabase setup this depends on

The Reset Password email template must show `{{ .Token }}` instead of the link. Supabase only allows template edits once custom SMTP is set up, which is on the before-TestFlight list in `docs/build-status.md`. Until then, the real reset email still sends a link, and this flow can only be fully tested in demo mode.

## Motion

The husky fades in as on 06 (the one non-triggered moment). Field and error motion only.

## Test

- Arrive from Sign in with an email typed: it's prefilled here.
- Submit empty: "Enter your email." and focus on the field.
- Submit a valid email: loading, then Enter code with that address in its subtitle.
- Back from Enter code: this screen, email still filled in.
- Email `offline@example.com`: the connection error, and no navigation.
- Any email that isn't registered moves on to Enter code exactly like one that is.
- The headline and subtitle never run under the husky at any width; below 372 wide the husky is hidden.
