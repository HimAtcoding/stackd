# App Store review status: Stackd 1.2.0 (3)

Last checked 2026-10-27 09:45 PDT. No credentials in this file; the review account lives in `~/.stackd-secrets/` and in App Store Connect.

| | |
| --- | --- |
| App | Stackd: Transfer Planner (Apple ID 6822523006, `app.stackd.transfer`) |
| Version | 1.2.0 |
| Build | 3 (uploaded 2026-10-22 00:34 PDT, built from `release/v1.2` at `10b01ec`) |
| Submitted | 2026-10-22 00:45 PDT (07:45 UTC), submission `5ebf2eeb-33a3-42df-8ffa-e9989c98c89c` |
| Production review status | **Waiting for Review** (checked 2026-10-26 18:10 and 18:25 PDT, and 2026-10-27 09:38 PDT via the App Store Connect API) |
| Release | Automatically release this version (already selected; not changed) |
| Expedite request | **Accepted.** Sent 2026-10-26 18:15 PDT (01:15 UTC Oct 27) from developer.apple.com/contact/app-store/?topic=expedite. Apple's confirmation page: "We'll expedite review for Stackd: Transfer Planner." It also says a rejection during this review goes straight back to the expedited queue on resubmit, so no second expedite is needed. No case number on the page. |
| Earlier contact | 2026-10-26 09:42 PDT email to appreview@apple.com asking for status; 09:44 PDT Apple Developer Program Support case **103009343600** (type not recorded). |
| TestFlight external | Group **Stackd Transfer Beta** created (0 testers). Build 3 is a normal build (not Internal Only; external state `READY_FOR_BETA_SUBMISSION`). Submitting it to Beta App Review failed three times with `422 ENTITY_UNPROCESSABLE` "There was an error processing your request. Please try again later." (request id `f958ae89-cc6e-4627-8c4c-a594dbb09d19`). Every beta field is filled, so this is Apple's side. 18:35 PDT: build 3 added to the group directly (204), then the submission failed again with the same 422 (request id `8a13b2e5-89d1-4dd6-9aff-6f607cbd4181`). The group now holds build 3; it's still not submitted for Beta App Review. 18:55 PDT: third 422 (request id `21dcdcd9-8287-4a93-8b38-16a4331384f3`). Developer Support case **103009774048** opened 18:58 PDT (Distribution → TestFlight, email) with all three request ids. 2026-10-27 09:40 PDT: one more try failed with the same 422 (error id `41a7449f-ded7-4f4b-8aff-59a34297e49f`, x-request-id `RUBTAPV4S5VFESGRSPME5NSAXA`). |
| Public beta link | **https://testflight.apple.com/join/vR4cYTTp** (created 2026-10-26 18:53 PDT, Open to Anyone, limit 500, not posted anywhere). Nobody can install from it until Beta App Review approves build 3. |
| Website fallback | https://joinstackd-chi.vercel.app works: Google sign-in, Home, Deadlines, the UC checklist and Essays all load; `/privacy/`, `/terms/`, `/support/` return 200 |
| Status inquiry | **Sent 2026-10-27 ~09:50 PDT** (owner asked to send it now instead of waiting for Oct 29) as a Gmail reply to appreview@apple.com in the Oct 26 thread, with the prepared text below plus the Apple ID and submission id. Status was still Waiting for Review right before sending. Don't send another. |

## 2026-10-27 follow-up (Mac, no App Store Connect access)

Checked about 2026-10-27 PDT from a Mac session with Gmail and public URLs only. No App Store Connect sign-in or API key was available, so the live App Review and TestFlight states were **not** re-read and nothing was submitted, sent or changed in App Store Connect.

- **Gmail (inbox, all mail, spam) since Oct 26:** no App Review, TestFlight or App Store Connect status mail for Stackd. The only Apple Developer mail is the automatic acknowledgement for case **103009774048** (2026-10-26 18:57 PDT: "We've received your support request… Your case ID is 103009774048"). Support hasn't replied yet. Other hits: the case 103009343600 acknowledgement (09:44 PDT Oct 26) and the 09:42 PDT email to appreview@apple.com (no reply). Spam has nothing from Apple.
- **Public App Store:** `itunes.apple.com/lookup?id=6822523006` returns 0 results and `apps.apple.com/us/app/id6822523006` returns 404, so 1.2.0 isn't live yet.
- **Public beta link:** https://testflight.apple.com/join/vR4cYTTp shows "Not Found", as expected while Beta App Review hasn't approved build 3.
- **Not done (needs App Store Connect in a signed-in browser):** reading the live App Review status and messages, and the single **Submit for Review** retry in TestFlight → Stackd Transfer Beta.
- **Oct 29 inquiry:** not sent; it's only Oct 27.

## 2026-10-27 09:40 PDT check (Mac, App Store Connect API)

The App Store Connect API key on the Mac (`~/.stackd-asc/` helpers, CalcBlast's key) works, so this check read the live states. The earlier Oct 27 note above, which said no API access, was wrong about that. All reads; the only write was the single Beta App Review submission below.

- **App Store:** version 1.2 (`dec15ce1`) `WAITING_FOR_REVIEW` with build 1.2.0 (3) (`8831cc2b`, VALID, not expired). Submission `5ebf2eeb` `WAITING_FOR_REVIEW`, submitted 2026-10-22 07:45:27 UTC; the two older submissions are COMPLETE. Screenshots (7 in the 6.7" set), review details and demo account are unchanged. Not live: iTunes lookup returns 0 results and apps.apple.com/us/app/id6822523006 returns 404.
- **App Review messages:** none in Gmail (inbox, all mail, spam, trash) since Oct 26. Nothing was sent to App Review.
- **TestFlight:** build 3 internal state `IN_BETA_TESTING`, external state `READY_FOR_BETA_SUBMISSION`, no Beta App Review submission exists. Group Stackd Transfer Beta (`9f7a7422`) holds build 3, public link on, limit 500. Every beta field is filled: en-US beta description, feedback email, privacy URL, review contact and notes, What to Test, export compliance (`usesNonExemptEncryption: false`). The beta license agreement text is blank, which is optional because Apple's standard agreement applies.
- **Beta App Review retry (once):** `POST /v1/betaAppReviewSubmissions` for build 3 at 16:40:38 UTC → `422 ENTITY_UNPROCESSABLE` "There was an error processing your request. Please try again later." (error id `41a7449f-ded7-4f4b-8aff-59a34297e49f`, x-request-id `RUBTAPV4S5VFESGRSPME5NSAXA`). Not retried.
- **Public beta link:** https://testflight.apple.com/join/vR4cYTTp still returns 404 "Not Found", as expected.
- **Support case 103009774048:** only the automatic acknowledgement (2026-10-26 18:57 PDT); no reply from support yet, so there was nothing to answer.
- **Oct 29 inquiry:** sent early, see below.

## 2026-10-27 ~09:50 PDT: status inquiry sent

The owner asked for the inquiry to go out now. Re-checked first: still `WAITING_FOR_REVIEW`, no new Apple mail. Sent the prepared text once as a Gmail reply to appreview@apple.com in the Oct 26 thread (contact form and App Store Connect reply both need a signed-in browser). Gmail message id `1a17e3e6c58de404`. No further messages to Apple about review status.

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

## Status inquiry (SENT 2026-10-27, don't resend)

Sent once by email reply to appreview@apple.com on 2026-10-27. Text as sent:

> **App Review status inquiry: Stackd 1.2.0 (3)**
>
> Stackd 1.2.0 (build 3) was submitted on October 22, 2026 and remains Waiting for Review. We submitted an expedited review request because Stackd helps California community college students prepare for the November 30 University of California transfer application deadline.
>
> Could you please confirm whether the submission is complete and whether any additional information is needed from us?
>
> A working review account and review instructions are included in App Store Connect.
>
> Thank you.
