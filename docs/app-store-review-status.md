# App Store review status: Stackd 1.2.0 (3)

Last checked 2026-10-28 02:25 PDT. No credentials in this file; the review account lives in `~/.stackd-secrets/` and in App Store Connect.

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


## 2026-10-29 (Mac): build 1.3.0 (6) uploaded, attached and submitted

1.3 is Waiting for Review. Build 6 is in Stackd Transfer Beta; Beta App Review still refuses it (Apple-side 422).

- **Built** from `release/v1.3-branding` at `302d99c` on the Mac (Xcode 27.1). `npm ci`, lint, `tsc --noEmit`, `npm test` (279 checks), `npm run test:db` (221) and `npm run ios:prepare` pass; no code changes.
- **Signing fix:** the archive is built unsigned (`CODE_SIGNING_ALLOWED=NO`, as for build 5), and the first export of build 6 had **no Sign in with Apple entitlement**, because an unsigned archive carries no entitlements into export. Build 5 was made the same way, so it most likely lacks it too (internal only; Sign in with Apple may fail on it). For build 6 the archived app was signed with the iPhone Distribution cert and `App.entitlements` (plus application-identifier, team ID, `get-task-allow` false) before export. No certificate, profile or key changed.
- **IPA checked:** 1.3.0 (6), `app.stackd.transfer`, iPhone Distribution: Shikhar Sisodia (4JNCSTKTHQ), `com.apple.developer.applesignin` Default, `get-task-allow` false, `ITSAppUsesNonExemptEncryption` false, `codesign --verify --deep --strict` OK. Export method app-store-connect, `testFlightInternalTestingOnly` **false**.
- **Icon:** Assets.car has AppIcon (1024 phone rendition, Opaque). The app's 120 px rendition matches `assets/branding/Stackd-AppIcon-1024.png` (mean difference 0.00/255; 94.8 against the old husky-on-blue icon), alpha 255 everywhere.
- **Uploaded** 2026-10-29 11:42 PDT with `altool` and the Stackd Mac API key (validation: no errors). Delivery / build ID `0566a26b-90c2-4c7a-baa6-2325fdd7d067`. App Store Connect upload date 11:45 PDT; **VALID** by 11:46, `usesNonExemptEncryption` false (no compliance question). TestFlight: internal `IN_BETA_TESTING`, external `READY_FOR_BETA_SUBMISSION` (so not internal-only). What to Test (en-US): "New app icon, Essays Answer and Notes tabs, starter card, private notes, reviewer highlights and Finish review. Please check the home-screen icon and Settings > Privacy."
- **Attached** to version 1.3 (`682bfa5d`) at 11:48 PDT (`PATCH appStoreVersions/…/relationships/build`, 204). Read back: build 6, VALID. What's New, promotional text, description (ends "Developed by Ryan Saleh, Shikhar Sisodia, Abyan Kashif, and Antonio Avila."), keywords, URLs, copyright and release type (after approval) are identical before and after.
- **Simulator** 11:49–11:56 PDT, Release build of the same `out/` on iPhone 18 Pro Max (driven with a scratch XCUITest, nothing added to the repo): home-screen icon is the new husky; Welcome, Sign up and Sign in load; Privacy (from Sign up and from Settings) shows "Updated October 28, 2026" and Who runs Stackd; Settings shows "Stackd 1.3.0" and all four names. Signed in with a fresh test account (`shikhar35sisodia35+stackdqa1029@gmail.com`, email code), never the review account; the account was deleted from Settings afterward (app returned to Welcome). Confirmed gone 2026-10-29: Supabase Auth `POST /auth/v1/otp` with `create_user: false` for that email returns 422 "Signups not allowed for otp" (no such user).
- **Submitted for review** 2026-10-29 18:42 PDT (2026-10-30 01:42 UTC), on Shikhar's go-ahead: review submission `078ab27f-ea09-4fe9-9ccb-91287c78c925` with version 1.3 (`682bfa5d`), build 1.3.0 (6). Read back: version 1.3 `WAITING_FOR_REVIEW`, build 6, release Automatically after approval. Review details (contact, demo account required) carried over from 1.2, unchanged.
- **Icon in App Store Connect:** the App Store icon Apple extracted from build 6 (1024, no alpha) and the TestFlight icon match `assets/branding/Stackd-AppIcon-1024.png` exactly (mean difference 0.00/255). The App Store listing switches to it when 1.3 is released.
- **Stackd Transfer Beta** (on Shikhar's go-ahead): build 6 added to the group 2026-10-29 18:44 PDT (204). Beta App Review submission for build 6 failed twice with the same `422 ENTITY_UNPROCESSABLE` "Please try again later." as build 3 since Oct 26 (error ids `cf674efa-4105-4ff9-a3f8-20799741d7ae`, `19714bd9-eaa8-49fc-903f-7ea5b7501a28`). Build 6 external state `READY_FOR_BETA_SUBMISSION`; Developer Support case 103009774048 still open. The public link stays unusable until a build passes Beta App Review.
- **PR #21** merged into main on Shikhar's go-ahead (conflict in this file only: both sides added dated sections; all kept).

## 2026-10-28 evening (Windows): 1.2 is live

- **1.2 released:** iTunes lookup shows version 1.2, released 2026-10-28 17:48 UTC (10:48 PDT), seller Shikhar Sisodia. App Store Connect shows "1.2 Ready for Distribution".
- **Website redeployed** from `release/v1.3-branding` (9c61d8b), as planned for after approval: preview checked, then production `joinstackd-b4iq045e0`, aliased to joinstackd-chi.vercel.app. All public routes 200; `/privacy/` "Updated October 28, 2026" with Who runs Stackd; new favicon; `/review/` has Finish review.
- **App Privacy** read in App Store Connect: Other User Content, Email Address, User ID, Name; Privacy Policy URL https://joinstackd-chi.vercel.app/privacy/. Unchanged.
- **Version 1.3 created** (Prepare for Submission): What's New and promotional text entered and saved (read back after reload); description with the four-name credit, copyright and review notes carried over; release Automatically, all users, keep rating. **No build attached** (1.3.0 (6) isn't uploaded yet) and nothing submitted.
- **Housekeeping:** the 2026-10-29 9 AM "Check Stackd App Review status" calendar reminder was deleted (1.2 is live; the inquiry already went out). `npx cap sync ios` on Windows copies the new `out/` into the app bundle cleanly (new favicon and privacy text in `ios/App/App/public`). A Gmail draft to the team asking them to confirm the Who runs Stackd wording is waiting in Shikhar's drafts, not sent.
- **Can't be done from Windows:** archive and upload of 1.3.0 (6). The Mac didn't answer on the network and has no SSH, and a GitHub Actions macOS build would need repo secrets, which need admin on HimAtcoding/stackd (Shikhar has write).

## 2026-10-28 02:10–02:25 PDT (Mac, new API key)

New App Store Connect API key **Stackd Mac** (Key ID `4G6H3BCY2Q`, App Manager), stored at `~/.appstoreconnect/private_keys/` on Shikhars-MacBook-Pro-2; helper `~/.stackd-asc/asc.mjs`.

- **App Store:** 1.2 still `WAITING_FOR_REVIEW` (API, 02:10 PDT).
- **Beta App Review retry (once):** `POST /v1/betaAppReviewSubmissions` for build 3 at 02:11 PDT → same `422 ENTITY_UNPROCESSABLE` "Please try again later." (error id `c84c00dd-ebe4-416c-9be6-7fa688518618`, x-request-id `OCYS66EUCXXTCIO3EEN6HR6XCY`). Not retried. Waiting on case 103009774048.
- **New icon build: 1.3.0 (5)** from branch `icon/husky-logo` (release/v1.3 + new husky icon from `Stackd Logo.jpg`, build number 5). Uploaded 02:15 PDT as **TestFlight internal only** (`testFlightInternalTestingOnly`), processed `VALID` 02:19, build id `99f5becb`. Internal team (all builds) has it; external state `NOT_APPLICABLE`, so it can't go to Stackd Transfer Beta or the App Store version. What to Test set.
- **Signing on this Mac:** new iOS Distribution certificate `GKLV6UR7SV` (expires 2027-10-28; private key in the login keychain and `~/.stackd-asc/signing/`) and profile "Stackd App Store (Mac 2026-10-28)". The earlier automatic-signing attempt also created development cert `57NK2229A5` (unused). Existing certificates were not touched.
- **Tester abykashif@gmail.com:** not added. Adding an internal tester needs a Users and Access invite with a role; Shikhar does that step (Developer role, Stackd only), then adds them to Internal team.
- **Build 1.2.0 (3) and the 1.2 submission:** untouched.

## 2026-10-28 ~02:00 PDT check (Mac, App Store Connect in Chrome)

Read-only except for opening and cancelling the Add Builds dialog. Nothing was submitted, sent, removed or changed.

- **App Store:** iOS 1.2 **Waiting for Review**. App Review page lists submission Thu Oct 22 12:45 AM (API user) Waiting for Review; Oct 21 and Oct 14 submissions Removed. **No messages from App Review.** Not live: iTunes lookup 0 results, apps.apple.com 404.
- **Gmail since Oct 26 (all mail + spam):** no App Review, TestFlight or support replies. Only the case 103009774048 auto-acknowledgement.
- **TestFlight, Stackd Transfer Beta:** 0 testers, 1 build: 1.2.0 (3) **Ready to Submit** (expires in 84 days). Public link on, 0 of 500. The web UI has no Submit for Review action for a build already in the group; Add Builds only offers 1.3.0 (4). Cancelled without adding anything. Getting a web submit for build 3 would mean removing it from the group first, which we don't do. Next retry should be the API (`POST /v1/betaAppReviewSubmissions`) from the Mac with `~/.stackd-asc/`, or follow support's answer.
- **Internal TestFlight:** 1.3.0 (4) Ready to Submit, Internal team only (uploaded 2026-10-27 09:58). Keep it out of the external group and the App Store version.
- **Public beta link:** https://testflight.apple.com/join/vR4cYTTp still Not Found.
- **Support case 103009774048:** no reply yet.
- **Status inquiry:** already sent 2026-10-27; not resent.

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

- **After Apple approves 1.2.0 (3), then redeploy the website** (Vercel project `joinstackd`) from `main` so the reviewer page gets Finish review for 1.3.0 (4) on internal TestFlight. Shikhar's call on 2026-10-27: not before approval, because Apple may open the review page while reviewing 1.2.

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
