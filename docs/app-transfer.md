# Moving Stackd to Ryan's Apple team

Written 2026-11-11. Stackd is moving from Shikhar's Apple Developer team (`4JNCSTKTHQ`) to Ryan's. This page covers the App Store app and the Apple pieces that change hands with it. Apple's rules come from the App Store Connect help pages ("Transfer an app") and the Sign in with Apple guide "Transferring your apps and users to another team".

## Where it stands

| | |
| --- | --- |
| App | Stackd: Transfer Planner, Apple ID 6822523006, `app.stackd.transfer` |
| Live | 1.4 (build 7) |
| In review | 1.4.1 (build 8), submitted 2026-11-11 22:55 PST, releases automatically when approved |
| Blocks the transfer | Apple won't transfer an app while a version is Waiting for Review, In Review, Pending Developer Release or Processing for Distribution. **The transfer can only start after 1.4.1 is live.** |
| Already fine | No in-app purchases, subscriptions, Game Center, app groups, iCloud, push keys, Apple Pay or Xcode Cloud. The app keeps no keychain items of its own, so nobody gets signed out by the team change. |
| Needs work | Sign in with Apple users (6 on 2026-11-11), TestFlight, the web Apple sign-in secret, signing for Ryan's builds |

## What Ryan needs to have

1. A paid Apple Developer Program membership where Ryan is the **Account Holder**.
2. His **Team ID** (developer.apple.com → Account → Membership details).
3. The **Apple Account email** of that Account Holder.
4. The latest agreements accepted in App Store Connect → Business.

## Before the transfer (Shikhar)

1. **Ryan tests 1.4.1 (8) on TestFlight first**, mainly Continue with Google, which is new in that build. TestFlight goes away in step 3.
2. **Make the Sign in with Apple transfer identifiers.** This is needed because Apple gives each user an ID that belongs to one team. After the transfer, the same person comes back with a new ID, and without this step Supabase makes them a new, empty account.
   - Export the Apple users in the Supabase SQL editor and download the result as `apple-users.csv`, outside the repo:
     `select user_id, provider_id as sub from auth.identities where provider = 'apple' order by created_at;`
   - You need a Sign in with Apple key on Shikhar's team. `B5ZPA5GGWL` works if its `.p8` is still around (it isn't on Mac 8). If it's gone, make a new key with Sign in with Apple, primary App ID `app.stackd.transfer`.
   - `node scripts/apple-user-transfer.mjs export <AuthKey.p8> 4JNCSTKTHQ <keyId> <RyanTeamId> apple-users.csv transfer-subs.csv`
   - Give Ryan `transfer-subs.csv`, which holds only user IDs and transfer identifiers. This can also be done up to 60 days after Ryan accepts, but doing it first is safer.
3. **Turn TestFlight off.** Apple requires beta testing to be off for every build. Expire builds 3–8 and turn off the public link of Stackd Transfer Beta.
4. **Start the transfer:** App Store Connect → Apps → Stackd → App Information → Transfer App, with Ryan's Account Holder email and Team ID. Only the Account Holder can do this (Shikhar). While it waits, Shikhar can't edit the listing.

## Ryan accepts

- App Store Connect → Business → Agreements → App Transfers → Review. Ryan enters the support, marketing and privacy URLs, App Review and App Store contacts, user access and App Privacy, then accepts. He has 60 days from the start. Apple can take up to two business days to finish.
- **Change the review contact and demo account.** The current contact is Shikhar's phone, and the demo account is a `+stackd-review` alias of Shikhar's Gmail. Make a review account Ryan controls, with a plan and a sample essay like the current one.

## Right after Ryan accepts (Ryan)

1. **Move the Apple users the same day.** Every Apple sign-in before this runs makes a duplicate account.
   - Make a Sign in with Apple key on Ryan's team, primary App ID `app.stackd.transfer`.
   - `node scripts/apple-user-transfer.mjs exchange <AuthKey.p8> <RyanTeamId> <keyId> transfer-subs.csv apple-update.sql`
   - Run `apple-update.sql` in the Supabase SQL editor. It updates `auth.identities` for each user and nothing else.
   - The deadline is 60 days after accepting. After that, Apple stops exchanging the identifiers.
2. **Fix Apple sign-in on the website.** The Services ID `app.stackd.transfer.signin` moves with the app, because it's grouped with its App ID, but the key behind Supabase's Apple secret stays on Shikhar's team. Run `npm run apple:secret -- <Ryan's AuthKey.p8> <RyanTeamId> <keyId> app.stackd.transfer.signin <file outside the repo>` and paste the result into Supabase → Authentication → Sign In / Providers → Apple → Secret Key. Apple sign-in in the iOS app doesn't use this secret: it checks Apple's identity token against the App ID.
3. **Check the Supabase Apple client IDs** still read `app.stackd.transfer.signin,app.stackd.transfer`. The IDs keep their names, so nothing should change.
4. **Look at the Google iOS client** "Stackd iOS" in Google Cloud `stackd-508823` (Ryan is already an Owner). If it has a Team ID set, change it to Ryan's.
5. Private relay email to Apple users stops working for anyone who uses no other app from Ryan's team, until Ryan registers `joinstackd@gmail.com` as an email source on his team (Sign in with Apple for Email Communication).

## Ryan's first build

- Set `DEVELOPMENT_TEAM` to Ryan's Team ID in `ios/App/App.xcodeproj/project.pbxproj` (both configurations), in place of `4JNCSTKTHQ`.
- Make an Apple Distribution certificate and an App Store provisioning profile for `app.stackd.transfer` on Ryan's team, with Sign in with Apple. Shikhar's certificate, profile and App Store Connect API key don't move.
- The next version has to be above 1.4.1, and the build number above 8.
- Signing gotcha: since the Google Sign-In packages arrived, a provisioning profile set for the whole build on the `xcodebuild` command line fails ("does not support provisioning profiles"). Set manual signing and the profile on the App target only, or use Xcode's automatic signing with an Admin account.
- Reviews, ratings and existing users stay with the app. Sales and Trends history stays, but Shikhar loses App Analytics.

## Not Apple: decide separately

These don't move with the App Store transfer: the Supabase organization "Stackd", the Vercel project behind joinstackd-chi.vercel.app, the GitHub repo (`HimAtcoding/stackd`), the usestackd.app domain, `joinstackd@gmail.com` and its SMTP, and the Google Cloud project (Ryan is already an Owner).
