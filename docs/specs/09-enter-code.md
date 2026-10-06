# 09 · Enter code

Route: `/enter-code/?for=reset` or `/enter-code/?for=confirm`. No tab bar. No mockup: built from the parts of `08-forgot-password.md` (back button, top block, husky, sheet) plus one new component, the code field. Password reset and email confirmation use a 6-digit code typed into the app instead of an email link, because links don't open reliably inside the iOS app (decided October 2026, `docs/16-open-questions.md`).

The screen has two steps on the same route:

1. **Code**: both purposes.
2. **New password**: reset only, after the code is accepted.

## Mobbin references

| Screen | What it grounds |
|---|---|
| [OKX email code](https://mobbin.com/screens/514c7d4f-5962-45ee-82a5-6df0aaa5eed7) | Left-aligned bold headline, "sent to {email}" under it, six boxes, resend countdown below. Closest to our left-aligned auth screens |
| [Coinbase verify email](https://mobbin.com/screens/4040212f-7776-4f3c-bb28-1c9dc4191664) | "Enter code" label above six outlined boxes, the active box with a blue border |
| [CapCut sign-up code](https://mobbin.com/screens/d03733f5-fe18-4c89-8d2b-4ed86fa99933) | "Resend code 55 seconds" countdown directly under the boxes, button below |
| [Yami verify email](https://mobbin.com/screens/59194a3e-2a7f-4358-8ffa-1a8e712867a8) | Spam-folder help line under the boxes; checking starts on its own when the sixth digit lands |
| [DeepSeek new password](https://mobbin.com/screens/878d7fe4-8510-4e29-8e81-36d541729fe8) | New-password step names the account it's for |

What the references agree on: boxes 44–56 tall, a numeric keypad, a 30–60 s resend countdown, and no error shown until a full code is checked. Most new-password screens ask for the password twice. We ask once with show/hide, the same as Create account (07), so there's one rule across the app.

## Getting here

| From | When | How |
|---|---|---|
| Forgot password (08) | `sendPasswordReset` returns `ok` | Push `/enter-code/?for=reset`. Back returns to 08 with the email still filled in |
| Create account (07) | `signUp` returns `{ ok: true, needsCode: true }` (only while Confirm email is on in Supabase) | Push `/enter-code/?for=confirm`. Back returns to 07 with every field still filled in |
| Sign in (06) | `signInWithPassword` returns `email_not_confirmed`, and the student taps "Send code" in that error | `resendCode(email, "confirm")`, then push `/enter-code/?for=confirm` |

The email arrives in memory, like everywhere else in the auth screens, never in the URL or storage. If the screen opens without one (a reload, or iOS closed the app while the student was in Mail), it replaces itself with `/forgot-password` for `reset` and `/sign-in` for `confirm`. Nothing is shown; the student just types their email again.

## Code step layout

```
┌───────────────────────────────┐  same background as 06
│ (←)                           │  circle button 44, safe-area top + 8
│                     ╭husky─╮  │  24
│ Enter your          │ 144  │  │  display 38/42, x 24, max 200
│ code                │ wide │  │
│ We sent a 6-digit   │      │  │  body-md 16/22, 8 below, max 190
│ code to you@ex.com. ╰──────╯  │  24
│╭─────────────────────────────╮│  sheet as in 06
││ 6-digit code                ││  headline, pad 20
││ [ 4][ 7][ 1][ |][  ][  ]    ││  8 below, cells 56 tall, gap 8
││ (        Verify code      >) ││  16, primary 56
││   Send a new code in 42s    ││  16, centered
││ Not in your inbox? Check    ││  4, caption, centered
││ your spam folder.           ││
││                             ││  flexible, min 20
││   Remembered it? Sign in    ││  reset only
│╰─────────────────────────────╯│  safe-area bottom + 16
└───────────────────────────────┘
```

Alignment: top block left at x 24, sheet content left at x 32. The resend line, the help line, and the bottom line are centered.

### Copy by purpose

| | `for=reset` | `for=confirm` |
|---|---|---|
| Headline | "Enter your code" | "Confirm your email" |
| Subtitle | "We sent a 6-digit code to {email}." | Same |
| Husky | `husky-forgot` | `husky-wave` |
| Bottom line | "Remembered it?" + "Sign in" (as on 08) | None |
| On success | New password step | Home, toast "Email confirmed" |

### Top block

| Element | Spec |
|---|---|
| Back | Circle button (00), `ArrowLeft` bold 22, `aria-label="Back"`, safe-area top + 8, left 16. History back |
| Headline | `display`, `--navy-900`, `h1`, x 24, 24 below the back button, max-width 200 so it breaks after "your" in both versions |
| Subtitle | `body-md` `--navy-900`, 8 below, max-width 190. The email is weight 600 with `word-break: break-all`, so a long address wraps instead of running under the husky |
| Husky | Width 144, placed exactly as on 08 (right 16, bottom edge 4 below the sheet's top edge). `alt=""`. Hidden below 372 wide |

### Code field (new shared component, add to 00)

One real input drawn as six boxes. A single input is what lets iOS offer the code from Mail above the keyboard, and what makes pasting work.

- **Input**: `<input id="code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6" enterkeyhint="done">`, absolutely positioned over the whole row of boxes, full size, `opacity: 0`, `caret-color: transparent`, font-size 16 (so iOS doesn't zoom). It takes every tap on the row.
- **Label**: "6-digit code", `headline` `--navy-900`, a real `<label for="code">`, 8 above the row.
- **Boxes**: six equal columns filling the sheet's inner width, gap 8, height 56, `--r-sm` (12), `--surface`, 1 px `--field-border`. At 393 wide each box is about 48 wide; at 320 wide, about 36. `aria-hidden="true"`; the input is the control.
- **Digits**: centered, `title-2` (20/26 800) `--navy-900`, `tabular-nums`.
- **Active box**: while the input has focus, the box where the next digit goes gets the text field's focus style (2 px `--blue-600` inset + `0 0 0 4px rgba(3,100,250,.15)`) and a caret: a 2 × 24 `--blue-600` bar, radius 1, centered, blinking at 1 s (`steps(1)`). Under reduced motion the caret doesn't blink. When all six are filled, the last box keeps the focus style with no caret.
- **Typing**: only digits are accepted; anything else is dropped. Backspace removes the last digit.
- **Paste and autofill**: strip everything that isn't a digit and keep the first six, so "Your code is 471 902" works.
- **Error**: all six boxes get a 2 px `--coral-700` border (same inset method), and the message line from the text field component (00) sits 6 below the row. The input gets `aria-invalid="true"` and `aria-describedby` pointing at the message.
- **Read-only** (while checking): opacity 0.6, as for the text field.

On arrival, focus the input so the keypad opens. If iOS won't open the keyboard without a tap, tapping the boxes does it; don't work around that.

### Checking the code

The check starts on its own when the sixth digit lands, whether typed, pasted, or autofilled. The "Verify code" button does the same thing, for anyone who'd rather tap. With fewer than 6 digits, the button shows the field error "Enter all 6 digits." and focuses the input.

While checking: the button shows its loading state (00), and the code field is read-only.

| Result | What the student sees |
|---|---|
| `ok`, reset | The new password step (below) |
| `ok`, confirm | Replace history with `/` (Home), 200 ms crossfade, toast "Email confirmed". Home greets them by the first name from Create account |
| `invalid_code` | Field error "That code didn't work. Check the email, or send a new code." The boxes clear, the input keeps focus, and the error clears on the next digit |
| `rate_limited` | Inline error (00), 12 above the button: "Too many tries" / "Wait a few minutes, then try again." Boxes keep their digits |
| `network` | Inline error: "Couldn't reach Stackd" / "Check your connection, then try again." Boxes keep their digits; the button is the retry |

One message covers both wrong and expired codes, because Supabase reports both as the same error (`otp_expired`). The message tells the student both ways forward.

### Resend line

16 below the button, centered. Starts counting when the screen opens, because a code was just sent.

- **Counting down**: "Send a new code in {n}s", `body` `--slate-600`, `tabular-nums`, from 60 down to 1, once a second. `aria-live="off"`. Sixty seconds matches Supabase's limit of one email per address per minute.
- **Ready**: "Send a new code", text link (00, `link` `--blue-600`), 44 hit area.
- **Tapped**: calls `resendCode(email, purpose)`. While waiting, the link reads "Sending…" in `--slate-600`. Then:
  - `ok`: toast "New code sent", the boxes clear, focus returns to the input, and the 60 s count restarts.
  - `rate_limited`: toast "Wait a minute before sending another code." The count restarts at 60.
  - `network`: toast "Couldn't send a new code. Check your connection, then try again." The link stays ready.

**Help line**: 4 below the resend line, `caption` `--slate-600`, centered, max-width 260: "Not in your inbox? Check your spam folder."

**Bottom line** (reset only): exactly as on 08: "Remembered it?" + "Sign in", `margin-top: auto`, min 20 above. Goes to `/sign-in`, replacing this entry, email carried over.

Toasts on this screen sit 12 above the safe-area bottom.

## New password step (reset only)

After `verifyCode` returns `ok`, Supabase has signed the student in for this one purpose. The top block and sheet contents crossfade over 200 ms to this step, and focus moves to the new headline (`tabindex="-1"`). Under reduced motion the swap is instant.

```
│                               │  no back button in this step
│                     ╭husky─╮  │
│ Set a new           │      │  │  display, max 200
│ password            │      │  │
│ For you@example.com.╰──────╯  │  body-md, 8 below, max 190
│╭─────────────────────────────╮│
││ New password                ││  headline, pad 20
││ [🔒 ••••••••           👁 ] ││  field 48
││ At least 8 characters.      ││  hint, 6 below
││ (       Save password     >) ││  16, primary 56
│╰─────────────────────────────╯│
```

| Element | Spec |
|---|---|
| Back button | Hidden. The code is used up, so going back to it would lead nowhere |
| Headline | "Set a new password", same style and position as the code step. With no back button, it sits at safe-area top + 32 |
| Subtitle | "For {email}." Email in weight 600, as in the code step |
| Husky | `husky-forgot`, unchanged |
| Hidden username | `<input type="email" autocomplete="username" value="{email}" hidden readonly>` before the password field, so iOS saves the new password to the right account |
| Field | Shared text field (00): label "New password", `Lock` regular 22, `type="password"` with the show/hide toggle from 06, `autocomplete="new-password"`, `enterkeyhint="done"`. Not focused on arrival: focus goes to the headline so screen readers announce the new step, and one tap opens the keyboard |
| Hint | "At least 8 characters." (text field hint, as on 07) |
| Button | Primary "Save password", 16 below the hint |

**Validation** (on submit only, as on 07):

| Condition | Message |
|---|---|
| Empty | Create a password. |
| Fewer than 8 characters | Use at least 8 characters. |

**Results of `updatePassword`**:

| Result | What the student sees |
|---|---|
| `ok` | Replace history with `/` (Home), 200 ms crossfade, toast "Password saved" |
| `same_password` | Field error: "That's your current password. Pick a new one." |
| `weak_password` | Field error: "Pick a password that's harder to guess." |
| `network` | Inline error 12 above the button: "Couldn't reach Stackd" / "Check your connection, then try again." |

If the student closes the app here, they stay signed in with their old password unchanged. That's how Supabase works, and it's acceptable: they proved they own the email.

## Auth interface changes (06)

Add to the shared interface in `06-sign-in.md`. If Claude Code already named these differently in phase 3, keep its names; the behavior is what matters.

```ts
type AuthError =
  | "invalid_credentials" | "email_taken" | "network" | "oauth_cancelled" | "oauth_failed"
  | "invalid_code" | "rate_limited" | "same_password" | "weak_password" | "email_not_confirmed";

type CodePurpose = "reset" | "confirm";

interface Auth {
  // existing four, with one change:
  signUp(firstName: string, email: string, password: string): Promise<{ ok: true; needsCode: boolean } | { ok: false; error: AuthError }>;
  // sendPasswordReset now sends a code (Reset Password email template uses {{ .Token }})
  verifyCode(email: string, code: string, purpose: CodePurpose): Promise<AuthResult>;
  resendCode(email: string, purpose: CodePurpose): Promise<AuthResult>;
  updatePassword(password: string): Promise<AuthResult>;
}
```

**Supabase mapping**: `otp_expired` → `invalid_code`; `over_request_rate_limit` and `over_email_send_rate_limit` → `rate_limited`; `same_password`, `weak_password`, `email_not_confirmed` map to themselves. Anything with no response → `network`. Anything else unexpected → `network`, and log the real code to the console in development.

**Demo implementation** additions:
- `verifyCode`: `000000` returns `invalid_code`, `999999` returns `rate_limited`, any other 6 digits return `ok`.
- `resendCode`: `ok`.
- `updatePassword`: password `samepassword` returns `same_password`; anything else `ok`.
- `signUp`: email `confirm@example.com` returns `{ ok: true, needsCode: true }`; every other success returns `needsCode: false`.
- `signInWithPassword`: email `unconfirmed@example.com` returns `email_not_confirmed`.
- Email `limited@example.com` returns `rate_limited` from `signInWithPassword`, `signUp`, `sendPasswordReset`, and `resendCode`.
- `offline@example.com` still returns `network` from every call.

## Error fixes on 06, 07 and 08

These close the open item where rate-limit and weak-password errors showed "Couldn't reach Stackd".

| Screen | Result | Shown as |
|---|---|---|
| 06, 07, 08 | `rate_limited` | Inline error "Too many tries" / "Wait a few minutes, then try again." |
| 06 | `email_not_confirmed` | Inline error "Confirm your email first" / "We'll send a code to {email}." with a tinted button "Send code" (calls `resendCode`, then opens this screen) |
| 07 | `weak_password` | Field error on Password: "Pick a password that's harder to guess." |

## Motion

The husky fades in as on 06 (the one non-triggered moment). Box focus and error borders change over 120 ms. The step swap crossfades over 200 ms. No shake on a wrong code, no animation when a digit lands.

## Accessibility

- Reading order (code step): Back, headline, subtitle, "6-digit code" field, Verify code, resend line, help line, bottom line.
- The countdown isn't announced each second. When the link becomes ready, nothing is announced either; it's found in reading order.
- Field and inline errors use the same `role="alert"` and `aria-describedby` rules as 06.

## Test

- From 08 with an email: lands here with that email in the subtitle and the keypad open (or opening on a tap).
- Reload the page: it replaces itself with `/forgot-password` (reset) or `/sign-in` (confirm).
- Type `123456`: checking starts on the sixth digit without tapping the button, then the new password step appears with focus on its headline.
- Paste "Your code is 471 902": the boxes show 4 7 1 9 0 2 and checking starts.
- Tap Verify code with 3 digits: "Enter all 6 digits."
- Code `000000`: the boxes clear, "That code didn't work…" shows, and typing a new digit clears it.
- Code `999999`: the "Too many tries" inline error, with digits kept.
- Resend counts down 60 → 1, then "Send a new code" sends, shows "New code sent", clears the boxes, and restarts at 60.
- New password `abc`: "Use at least 8 characters." Password `samepassword`: "That's your current password…". A valid password lands on Home with "Password saved", and Back doesn't return here.
- Create account with `confirm@example.com`: lands here as "Confirm your email" with the wave husky. A valid code lands on Home with "Email confirmed" and the right first name.
- Sign in with `unconfirmed@example.com`: the "Confirm your email first" error, and "Send code" opens this screen.
- At 320 wide: six boxes fit in one row, about 36 wide each, and the husky is hidden.
- iOS offers the emailed code above the keypad when it can (real device, real email).
