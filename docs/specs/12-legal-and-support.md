# 12 Privacy, Terms and Support

Three pages of text: `/privacy/`, `/terms/` and `/support/`. They replace the placeholder screens that Terms and Privacy opened. The App Store listing links to Privacy and Support, and Google's consent screen links to all three, so they must open for anyone, signed in or not, and work as plain pages on the hosted website.

No mockup. Built from Settings (11) and 00's tokens. Written 2026-10-13, with the build.

## Layout

```
┌───────────────────────────────┐  --sky-50
│ (←)                           │  safe-area top + 8, back button (00)
│                               │  24
│ Privacy Policy                │  title-1 --navy-900, x 24
│ Updated October 13, 2026      │  8, caption --slate-600 (Privacy and Terms only)
│                               │  24
│ Intro paragraph               │  body --slate-700
│                               │  32
│ What we collect               │  title-3 --navy-900
│ • list or paragraphs          │  8, body --slate-700
│ …                             │
│                               │  40
│ Unofficial planning tool. …   │  footer line (00)
│   Terms   Privacy   Support   │  8, label --blue-600, 24 apart, 44 hit areas
│ Developed by Ryan Saleh, …    │  8, caption --slate-600
└───────────────────────────────┘  safe-area bottom + 24
```

Alignment: left, text at x 24 in the 480 column. The footer is centered. No cards: it's text to read, so nothing is boxed.

- Back: history back, or Home when there's no history (Home sends a signed-out visitor to Welcome or Sign in).
- Links inside sentences: `--blue-600`, weight 600, underlined. Outside sites (ASSIST) open in a new tab or Safari; the email address opens Mail.
- No tab bar and no demo strip. Each page has its own `<title>` ("Stackd Privacy Policy", "Stackd Terms of Use", "Stackd Support").

## Content rules

- **Privacy** says only what the code does. Check it against `supabase/migrations/` and `lib/` whenever data collection changes, and change `POLICIES_UPDATED` in `lib/about.ts` with it.
- **Terms** keeps the unofficial-tool line from 06-trust-and-provenance: no affiliation, no admission or transfer guarantee, the official agreement and counselor are the final word.
- **Support** covers contacting the team, signing in (codes, Apple and Google), changing the plan, deleting the account, and whether Stackd is official.
- The support address and the developer credit come from `lib/about.ts` and appear nowhere else in code.

## Test

1. All three pages answer 200 with no session, from `out/` and on the hosted site.
2. Settings' Terms, Privacy and Support links open them; Back returns to Settings.
3. Create account's Terms and Privacy Policy links open them; Back returns to Create account.
4. At 320 wide nothing runs off the screen, including the email address.
5. The footer shows "Developed by Ryan Saleh, Shikhar Sisodia, and Antonio Avila." on every page.
