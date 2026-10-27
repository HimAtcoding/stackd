# App Store review status: Stackd 1.2.0 (3)

Last checked 2026-10-26 18:25 PDT. No credentials in this file; the review account lives in `~/.stackd-secrets/` and in App Store Connect.

| | |
| --- | --- |
| App | Stackd: Transfer Planner (Apple ID 6822523006, `app.stackd.transfer`) |
| Version | 1.2.0 |
| Build | 3 (uploaded 2026-10-22 00:34 PDT, built from `release/v1.2` at `10b01ec`) |
| Submitted | 2026-10-22 00:45 PDT (07:45 UTC), submission `5ebf2eeb-33a3-42df-8ffa-e9989c98c89c` |
| Production review status | **Waiting for Review** (checked 2026-10-26 18:10 and 18:25 PDT) |
| Release | Automatically release this version (already selected; not changed) |
| Expedite request | **Accepted.** Sent 2026-10-26 18:15 PDT (01:15 UTC Oct 27) from developer.apple.com/contact/app-store/?topic=expedite. Apple's confirmation page: "We'll expedite review for Stackd: Transfer Planner." It also says a rejection during this review goes straight back to the expedited queue on resubmit, so no second expedite is needed. No case number on the page. |
| Earlier contact | 2026-10-26 09:42 PDT email to appreview@apple.com asking for status; 09:44 PDT Apple Developer Program Support case **103009343600** (type not recorded). |
| TestFlight external | Group **Stackd Transfer Beta** created (0 testers). Build 3 is a normal build (not Internal Only; external state `READY_FOR_BETA_SUBMISSION`). Submitting it to Beta App Review failed three times with `422 ENTITY_UNPROCESSABLE` "There was an error processing your request. Please try again later." (request id `f958ae89-cc6e-4627-8c4c-a594dbb09d19`). Every beta field is filled, so this is Apple's side. 18:35 PDT: build 3 added to the group directly (204), then the submission failed again with the same 422 (request id `8a13b2e5-89d1-4dd6-9aff-6f607cbd4181`). The group now holds build 3; it's still not submitted for Beta App Review. |
| Public beta link | Not available (needs Beta App Review approval first) |
| Website fallback | https://joinstackd-chi.vercel.app works: Google sign-in, Home, Deadlines, the UC checklist and Essays all load; `/privacy/`, `/terms/`, `/support/` return 200 |
| Next status inquiry | **2026-10-29**, only if still Waiting for Review (calendar reminder set for 9:00 AM PDT) |

## What was checked

- **App Review:** one submission in flight (1.2.0 (3), Waiting for Review); the two earlier ones are Removed. No messages from App Review and no Unresolved Issues. Nothing in Gmail (inbox or spam) from App Review about Stackd.
- **Review account:** App Store Connect has Sign-in required on, with the review account's user name, and its password matches the saved one (compared by hash, never shown). In Supabase the account is confirmed, not banned, email provider on, last signed in 2026-10-22 00:51 PDT. Apple's reviewer hasn't signed in yet.
- **Agreements:** Free Apps Agreement Active (Oct 13, 2026 – Jun 16, 2027); Digital Services Act Active. Paid Apps Agreement shows "New", which only matters for paid apps or in-app purchases, so it doesn't block a free app. No agreement banner on developer.apple.com/account.
- **TestFlight Test Information** (saved 2026-10-26): beta description, feedback email joinstackd@gmail.com, privacy URL, review contact (same as App Review's). Sign-in required is **off** for Beta App Review. The notes ask the reviewer to create an account with Sign in with Apple, Google, or email (password plus emailed 6-digit code), because a password can't be typed in by the assistant. To give Beta App Review the demo account instead, tick Sign-in required and paste the review account's password.
- **What to Test** on build 3: "Please test sign-in, your transfer plan, application deadlines and reminders, the UC application checklist, and Personal Insight draft saving. Please report any crashes, incorrect dates, or problems saving your work."

## Rules until Apple decides

- Don't cancel, remove, resubmit or change 1.2.0 (3), its screenshots or its metadata.
- Don't send another expedite request; Apple already accepted one.
- Don't upload a new build unless App Review rejects 1.2.0 (3) and a code change is actually needed (that needs the Mac).
- Beta App Review: try **Submit for Review** again later from TestFlight → Stackd Transfer Beta → Add Builds → 1.2.0 (3). If it keeps failing with the same 422, open a Developer Support case with the request id above. Once Apple approves the beta, create a public link (Open to Anyone, limit 500) and share it by hand.

## October 29 status inquiry (prepared, not sent)

Send once, through developer.apple.com/contact/app-store/ (or a reply in App Store Connect → App Review), only if 1.2.0 (3) is still Waiting for Review on 2026-10-29.

> **App Review status inquiry: Stackd 1.2.0 (3)**
>
> Stackd 1.2.0 (build 3) was submitted on October 22, 2026 and remains Waiting for Review. We submitted an expedited review request because Stackd helps California community college students prepare for the November 30 University of California transfer application deadline.
>
> Could you please confirm whether the submission is complete and whether any additional information is needed from us?
>
> A working review account and review instructions are included in App Store Connect.
>
> Thank you.
