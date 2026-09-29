# 06 · Sign in

Route: `/sign-in`. No tab bar. Mockup: `../mockup/mockup-sign-in.png`. That canvas is 393 × 786 with no status bar, so the vertical gaps below are tightened to fit an 852-tall phone with a status bar and the demo strip. Every change is listed under Normalizations at the end.

Scope note: `09-mvp-scope.md` says v0 has no accounts. The team added sign-in to the demo in September 2026. This spec builds the screen against a small auth interface with a demo implementation, so no real account system is needed for the demo. Wiring it to Supabase Auth (`11-tech-architecture.md`) is a separate decision.

## Mobbin references

| Screen | What it grounds |
|---|---|
| [MyFitnessPal log in](https://mobbin.com/screens/7336baf0-22a8-4e07-be82-59bd383432a4) | Closest match to our layout: labels above the fields, blue full-width CTA, forgot link near it, "or" divider with rules on both sides, stacked "Continue with" buttons at ~16 margins |
| [Polarsteps log in](https://mobbin.com/screens/a0880ebc-09f8-4f5c-9e97-3f2e2b90cf03) | Focus state: the focused field gets a 2 px blue border, the others stay grey |
| [Quizlet log in](https://mobbin.com/screens/65c9d24e-6054-46f7-8a62-55947ba658d3) | Eye toggle inside the password field on the right edge |
| [DailyArt sign in](https://mobbin.com/screens/6bec1364-2e10-48d4-95d5-a124a7386380) | "Don't have an account? Register here" pinned to the bottom, muted text + colored link on one line |
| [Fabric sign in](https://mobbin.com/screens/2213c0c1-1864-4899-897c-fb46ae86743f) | Apple and Google buttons as outlined white buttons with the logo left of a centered label |

What the references confirm: fields 44–52 tall, social buttons 44–48, 16 side margins, and none of them validate while the student is still typing.

## Layout

```
┌───────────────────────────────┐  --sky-100 → --sky-50
│ stackd                        │  wordmark 100 wide, safe-area top + 12
│                     ⸝⸝ ╭husky╮│  24
│ Welcome                 │wave ││  display 38/42, max-width 190
│ back!                   │     ││
│ Your transfer journey   │     ││  body-md 16/22, 8 below, max 180
│ is waiting.             ╰─────╯│  20
│╭─────────────────────────────╮│  sheet, margins 16, radius 20 top
││ Email                       ││  headline 16/22 700, pad 20
││ [✉  you@example.com       ] ││  field 48, 8 below label
││ Password                    ││  16
││ [🔒 ••••••••           👁 ] ││  field 48
││            Forgot password? ││  label 14/18 600, right, 8 below
││ (         Sign in        >) ││  primary 56, 16 below
││ ─────────── or ──────────── ││  row 24, 12 above and below
││ [      Continue with Apple ] ││  48
││ [     Continue with Google ] ││  48, 12 gap
││                             ││  flexible, min 20
││ New to stackd? Create an ac…││  body 15/20, centered
│╰─────────────────────────────╯│  safe-area bottom + 16
└───────────────────────────────┘
```

Alignment: top block left-aligned at x 24. Sheet content left-aligned at x 32, except the forgot link (right), the divider label, social button contents, and the bottom line (all centered).

### Vertical budget at 393 × 852

- Top block: 59 safe + 12 + 32 wordmark + 24 + 84 headline + 8 + 44 subtitle + 20 = sheet top at 283 (no demo strip on this screen).
- Sheet: 20 + 22 + 8 + 48 + 16 + 22 + 8 + 48 + 8 + 20 + 16 + 56 + 12 + 24 + 12 + 48 + 12 + 48 + 20 (min flex) + 20 + 16 + 34 safe = 538.
- Total 841. The 11 spare goes into the flexible gap above the bottom line.
- Shorter phones scroll: the whole page is one scroll container (`min-height: 100dvh`). Nothing is fixed.

## Background

`linear-gradient(180deg, var(--sky-100) 0, var(--sky-50) 320px)`, then `--sky-50`. `home-clouds` art at top 0, full width, height 300, behind everything, `alt=""` (same asset as Home).

## Top block

| Element | Spec |
|---|---|
| Wordmark | `wordmark.png` (trimmed), width 100, x 24, safe-area top + 12. No demo strip on this screen. `role="img"`, `aria-label="Stackd"`. Not a link |
| Headline | "Welcome back!" `display` (38/42, 900), `--navy-900`, `h1`, x 24, 24 below the wordmark, max-width 190 so it breaks after "Welcome" as drawn |
| Subtitle | "Your transfer journey is waiting." `body-md` (16/22, 400), `--navy-900`, 8 below the headline, max-width 160 so it breaks after "journey" as drawn |
| Husky | `husky-wave`, width 176, height auto (~186). `position: absolute; right: 16px;` bottom edge 4 below the sheet's top edge, so the sheet covers the cut (sheet z-index 1, husky 0). `alt=""` |
| Burst dashes | Painted into `husky-wave.png`. Don't draw a separate `burst-dashes` here |

At viewports under 360 wide, the husky shrinks to width 144 and the headline's max-width stays 190.

## Sheet

`position: relative;` margins 0 16 (16 in from each screen edge), running to the bottom of the screen. `--surface`, `border-radius: 20px 20px 0 0`, `box-shadow: 0 -8px 24px rgba(5,16,66,.06)`. Padding: 20 top, 16 sides (so content sits at x 32), `calc(16px + env(safe-area-inset-bottom))` bottom. `display: flex; flex-direction: column;` so the bottom line can be pushed down with `margin-top: auto`.

The sheet is a `<form novalidate>`; validation is handled by the page (see Validation).

## Fields

Two text fields using the shared text field component (00). Label above, 8 gap, field 48 tall.

| | Email | Password |
|---|---|---|
| Label | "Email" | "Password", 16 below the email field |
| Leading icon | `Envelope` regular 22 | `Lock` regular 22 |
| Placeholder | "you@example.com" | none (the mockup's dots are a filled value, not a placeholder) |
| `type` | `email` | `password`, or `text` while shown |
| `autocomplete` | `email` | `current-password` |
| `inputmode` | `email` | (default) |
| `autocapitalize` / `spellcheck` | `off` / `false` | `off` / `false` |
| `enterkeyhint` | `next` (moves focus to password) | `go` (submits) |
| Trailing control | none | Show/hide toggle |

**Show/hide toggle**: a 44 × 44 button at right 2 inside the field, vertically centered. Icon `Eye` regular 22 `--slate-600` while hidden, `EyeSlash` while shown. `aria-label` "Show password" / "Hide password", `aria-pressed`. Toggling keeps the caret position and focus in the field. No animation beyond the icon swap.

## Forgot password

"Forgot password?" `label` (14/18 600), `--blue-600`, right-aligned, 8 below the password field. Hit area 44 tall via 12 vertical padding and negative margin, so the layout doesn't move. Goes to `/forgot-password` (`08-forgot-password.md`), carrying the email.

## Sign in button

Primary button (00), "Sign in", 16 below the forgot link. Full sheet inner width. Trailing chevron at the right edge like every other primary button (N11). `type="submit"`.

While signing in: the button shows its loading state (00), both fields become `readOnly`, and the two social buttons get `disabled`. Nothing else changes.

## Divider

The labelled divider component (00): 24 tall, 12 below the button. Two 1 px `--border-strong` rules, "or" centered between them in `body` `--slate-600` with 16 of space on each side. `aria-hidden="true"`, because the buttons below already say what they do.

## Social buttons

Social button component (00), 48 tall, gap 12, the first one 12 below the divider.

**While an Apple or Google sign-in is pending**: the tapped button shows a 20 px `--navy-900` ring spinner (2 px stroke, 800 ms linear) in place of its logo, and its label stays. The other social button and the Sign in button get `disabled`, and both fields become `readOnly`. The Sign in button shows no spinner, because it isn't the thing the student tapped. Everything returns to normal when the call resolves.

| Button | Logo | Label | Action |
|---|---|---|---|
| Apple | Apple's official left-aligned logo file (black logo, for white buttons), shown at the button's full height, 48. The file includes Apple's own padding, so the visible apple is about 17 × 21 | "Continue with Apple" | `auth.signInWithOAuth("apple")` |
| Google | Google's official standard-color "G", taken from the icon in Google's download bundle, 20 × 20 | "Continue with Google" | `auth.signInWithOAuth("google")` |

The logos come from Apple's and Google's official brand kits, never redrawn (see `art-assets.md → Provider logos` for exactly how to take them out of the kits). Both brands require their logo on a white button, which is why the social button is `--white`, not `--surface`. Before public launch, check both buttons against Apple's Sign in with Apple guidelines and Google's sign-in branding guidelines. A native iOS app that offers Google sign-in must also offer Sign in with Apple, which the mockup already does.

## Bottom line

"New to stackd?" `body` `--slate-600`, 6 gap, "Create an account" `link` (15/20 700) `--blue-600`. One centered line, `margin-top: auto` with a minimum of 20 above it. If it wraps at narrow widths, it wraps between the two parts, never inside the link. The link's hit area is 44 tall. Goes to `/sign-up` (`07-create-account.md`), replacing this history entry and carrying the email.

"stackd" is lowercase here as drawn, since it's the wordmark's spelling. Everywhere else in UI copy the product is "Stackd".

## Validation

Check on submit only, never while the student is typing. After a failed submit, re-check each field as it changes, so an error disappears as soon as it's fixed.

| Field | Condition | Message |
|---|---|---|
| Email | Empty | Enter your email. |
| Email | Not a valid address (`input.validity.typeMismatch`) | Enter an email like name@example.com. |
| Password | Empty | Enter your password. |

Field errors use the text field's error state (00): 2 px `--coral-700` border and a message line under the field. Focus moves to the first field with an error. The field gets `aria-invalid="true"` and `aria-describedby` pointing at its message.

## Sign-in errors

Shown with the inline error component (00) between the forgot link and the Sign in button, 12 above the button. It pushes the button down; it doesn't cover anything. `role="alert"`. It clears when either field changes.

| Result from `auth` | Title | Body |
|---|---|---|
| `invalid_credentials` | Couldn't sign you in | That email and password don't match. Check them, or reset your password. |
| `network` | Couldn't reach Stackd | Check your connection, then try again. |
| `oauth_cancelled` | (nothing shown; the student backed out on purpose) | |
| `oauth_failed` | Couldn't sign in with {Apple / Google} | Try again, or sign in with your email. |

Don't say which of email or password was wrong. That's a security choice, not a copy choice.

## Auth interface

Sign in, create account (07), and forgot password (08) all use this one interface, so the screens don't care what's behind it:

```ts
type AuthError = "invalid_credentials" | "email_taken" | "network" | "oauth_cancelled" | "oauth_failed";
type AuthResult = { ok: true } | { ok: false; error: AuthError };
interface Auth {
  signInWithPassword(email: string, password: string): Promise<AuthResult>;
  signUp(firstName: string, email: string, password: string): Promise<AuthResult>;
  signInWithOAuth(provider: "apple" | "google"): Promise<AuthResult>;
  sendPasswordReset(email: string): Promise<AuthResult>;
}
```

**Demo implementation** (`lib/auth/demo.ts`), active while `NEXT_PUBLIC_DEMO_STRIP` is on:
- Every call resolves after 600 ms, so loading states are visible.
- Email `offline@example.com` returns `network` from any call.
- `signInWithPassword`: password `wrong` returns `invalid_credentials`.
- `signUp`: email `taken@example.com` returns `email_taken`.
- `sendPasswordReset`: returns `ok` for every other email, registered or not.
- OAuth calls return `ok`.
- Anything else valid returns `ok`.
- On a successful sign-in or sign-up, write `localStorage["stackd.session"] = "demo"`. After `signUp`, also write `localStorage["stackd.profile"] = JSON.stringify({ firstName })`. Never store the email or the password anywhere.

**Carrying the email between screens**: the three auth screens pass whatever is in the email field to each other in memory (a small shared store or router state), never in the URL or in storage.

## After signing in

Replace the history entry with `/` (Home), so Back doesn't return to the sign-in screen. 200 ms crossfade, as for Welcome.

## States summary

| State | What changes |
|---|---|
| Default | As drawn |
| Field focused | That field's focus state (00). The page scrolls the field into view if the keyboard would cover it (`scrollIntoView({ block: "center" })`) |
| Field error | Field error state + message line |
| Submitting | Button loading, fields read-only, social buttons disabled |
| Sign-in error | Inline error above the button |
| Password shown | `EyeSlash` icon, `type="text"` |

## Motion

One non-triggered moment: the husky fades in with translateY 12 → 0 over 320 ms `--ease-out`, 120 ms after the page appears (the same as Welcome). Everything else answers the student: field border color changes over 120 ms, error message lines expand from height 0 with opacity 0 → 1 over 200 ms `--ease-out`, and the inline error does the same. No shaking on errors. Under reduced motion, everything appears without transforms.

## Accessibility

- Reading order: wordmark, headline (`h1`), subtitle, Email, Password, show/hide, Forgot password, Sign in, Continue with Apple, Continue with Google, New to stackd? Create an account.
- Labels are real `<label for>` elements; the icons inside fields are `aria-hidden`.
- Password managers must be able to fill both fields (`autocomplete` values above, `name="email"` / `name="password"`).
- Text inputs are 16 so iOS Safari doesn't zoom in on focus.

## Normalizations

| # | Mockup drew | Spec uses | Why |
|---|---|---|---|
| N11 | "Sign in" with an arrow directly after the label | Shared primary button: chevron at the right edge | The other three primary buttons use the edge chevron. Majority, like N5 |
| N12 | Fields 46, social buttons 49, CTA 53 | Fields 48, social 48, CTA 56 | 4-grid and the shared button height (N2) |
| N13 | Sheet inset 12 from the screen edge, fields at 31 | Sheet inset 16, content at 32 | Same 16 page margin as every other screen (N1) |
| N14 | Gaps sized for a 786-tall canvas with no status bar | Gaps in the vertical budget above | Fits 852 with the status bar and demo strip. Order and grouping unchanged |
| N15 | Field border #C7D4EA (1.5:1), placeholder #8A99BF (2.8:1), field icons #6778A3 | `--field-border` #8090B8 (3.1:1), placeholder and icons `--slate-600` (5.1:1) | Contrast floor for control edges and text |

## Test

- Submit empty: both fields show their messages, focus lands on Email, nothing else moves except the pushed-down content below each field.
- Type a valid email into the errored field: its message disappears on that keystroke.
- Password `wrong`: the inline error appears above the button after the loading state, with focus announced.
- Correct demo sign-in: lands on Home, and the browser's back button doesn't return to Sign in.
- iPhone at 393 × 852: everything, including the bottom line, is visible without scrolling. At 375 × 667 the page scrolls and the focused field stays above the keyboard.
- iOS password autofill offers to fill both fields.
