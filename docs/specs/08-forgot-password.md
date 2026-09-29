# 08 · Forgot password

Route: `/forgot-password`. No tab bar. No mockup: built from the sign-in screen's parts (`06-sign-in.md`) minus the wordmark, the social buttons, and the divider. Rev 2: the husky is back (the screen read as empty without it), and the copy is shorter so the text clears it. It has two states on the same route: the request form, and "Check your email".

## Mobbin references

| Screen | What it grounds |
|---|---|
| [MyFitnessPal log in](https://mobbin.com/screens/7336baf0-22a8-4e07-be82-59bd383432a4) | Labelled field above one full-width blue button, same field and button sizes as 06 |
| [Fresha venue detail](https://mobbin.com/screens/a659b05e-4558-4a00-827f-927eb225db13) | 44 floating circle back button at safe-top + 8, left 16 (also used on 03) |
| [Grab drafts, empty](https://mobbin.com/screens/83c0a32d-65e3-441d-9d8a-c532c338105e) | Confirmation layout: centered illustration, bold title, one muted line. Our empty state (00) already follows this |

## Request state layout

```
┌───────────────────────────────┐  same background as 06
│ (←)                           │  circle button 44, safe-area top + 8
│                     ╭husky─╮  │  24
│ Reset your          │ 144  │  │  display 38/42, x 24, max 200
│ password            │ wide │  │
│ We'll email you a   │      │  │  body-md 16/22, 8 below, max 190
│ link to reset it.   ╰──────╯  │  24
│╭─────────────────────────────╮│  sheet as in 06, covers husky's base
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
| Background | Same as 06 |
| Back | Circle button (00), `ArrowLeft` bold 22, `aria-label="Back"`, top = safe-area top + 8, left 16. No demo strip on this screen. History back; with no history, `/sign-in` |
| Headline | "Reset your password" `display`, `--navy-900`, `h1`, x 24, 24 below the back button, max-width 200 so it breaks after "your". ("Forgot your" is too wide to clear the husky.) The link that opens this screen still says "Forgot password?" |
| Subtitle | "We'll email you a link to reset it." `body-md` `--navy-900`, 8 below, max-width 190 |
| Husky | `husky-forgot`, width 144, height auto (~152). `position: absolute; right: 16px;` with its bottom edge 4 below the sheet's top edge, so the sheet covers the cut, exactly as on 06. `alt=""`. Until `husky-forgot.png` exists, use `husky-wave.png` at the same size. Hidden below 372 wide (between 360 and 371 the headline would run under it) |
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
| Headline | "Check your email" (same style and max-width as the request state). The husky stays |
| Subtitle | "We sent a link to {email}." Max-width 190. The email in weight 600, `word-break: break-all` so a long address wraps |
| Icon | 72 circle, `--tint-sky`, `EnvelopeSimpleOpen` fill 32 `--blue-600`, centered, 32 below the sheet top, `aria-hidden` |
| Body | "If there's an account for this email, the link will arrive in a few minutes. Check your spam folder too." `body` `--slate-600`, centered, max-width 280, 16 below the icon |
| Button | Primary "Back to sign in", 24 below the body. Goes to `/sign-in`, replacing this history entry, email carried over |
| Resend | Text link, centered, 12 below the button. For 30 s it's disabled and reads "Send again in {n}s" in `--slate-600` (counts down each second, `aria-live="off"` so screen readers aren't flooded). Then it reads "Send again" in `--blue-600`. Tapping it calls `sendPasswordReset` again and restarts the 30 s. A toast confirms: "Reset link sent". If the resend fails, a toast says "Couldn't send the link. Check your connection, then try again.", and "Send again" is available immediately (no countdown). The screen doesn't change state |

Toasts on this screen sit 12 above the safe-area bottom, since there's no tab bar and no pinned button.

**Transition**: the sheet contents and the headline crossfade over 200 ms. Focus moves to the new headline (`tabindex="-1"`). Under reduced motion, the swap is instant.

The back button in this state returns to the request state, with the email still filled in, rather than leaving the screen.

## Motion

The husky fades in as on 06 (the one non-triggered moment). Field, error, and state-swap motion only, as above.

## Test

- Arrive from Sign in with an email typed: it's prefilled here.
- Submit empty: "Enter your email." and focus on the field.
- Submit a valid email: loading, then "Check your email" with that address in the subtitle, and focus on the headline.
- "Send again" is disabled for 30 s, then sends and restarts the count.
- Email `offline@example.com`: the connection error, and no state change.
- Any email that isn't registered gets exactly the same confirmation as one that is.
- The headline and subtitle never run under the husky at any width; below 372 wide the husky is hidden.
