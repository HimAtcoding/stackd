# iOS App Store handoff (the Mac steps)

Everything that could be done on Windows is done (branch `feat/ios-app-store-prep`). What's left needs macOS with Xcode, a real iPhone, and the Apple account holder. Build from the exact commit named in the pull request, not a later one, unless you mean to.

Time: about 1–2 hours at the Mac, then Apple's processing (minutes to an hour) and review (usually 1–2 days).

**Not done or checked on Windows:** the iOS project was generated and configured but never compiled. The two Swift files (`ios/App/App/StackdBridgeViewController.swift`, `AppleSignInPlugin.swift`), native Sign in with Apple, Google sign-in in the in-app browser, deep links, the launch screen and the icon on a device are all unverified until step 5.

## What you need

- A Mac with current Xcode (from the Mac App Store) and Node 24 (`node -v`).
- Xcode → Settings → Accounts: signed in with the Apple ID that's on team `4JNCSTKTHQ`.
- An iPhone with a cable, Developer Mode on (Settings → Privacy & Security).
- The project's public Supabase values for `.env.local` (Ryan or Shikhar has them; the same two lines as on Windows):
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://vzsogzgcivpcmxqxepfr.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<the anon key from Supabase → Project Settings → API>
  ```
  Never put the service role key in this file.
- The App Store Connect record already exists and is filled in: **"Stackd: Transfer Planner"**, Apple ID `6822523006` ("Stackd" alone was taken). Only the build and screenshots are missing.
- Apple's updated Developer Program License Agreement was accepted on 2026-10-13, and Google sign-in is published for everyone.

## 0. Check once (Supabase dashboard; set 2026-10-13)

Supabase → Authentication → URL Configuration → Redirect URLs must include:
- `app.stackd.transfer://auth/callback/` (the iOS app's Google sign-in return)
- `https://joinstackd-chi.vercel.app/auth/callback/` (the hosted website)

Apple's Client IDs (Authentication → Sign In / Providers → Apple) must stay `app.stackd.transfer.signin,app.stackd.transfer`, the Services ID first.

## 1. Get the code

```bash
git clone https://github.com/HimAtcoding/stackd.git
cd stackd
git checkout <SHA from the pull request>
npm ci
```

Create `.env.local` with the two lines above.

## 2. Build the app and copy it into the iOS project

```bash
npm run ios:prepare
```

It checks `.env.local` (stops if the Supabase values are missing or demo mode is on), builds the static app into `out/`, and copies it into `ios/App/App/public` with `cap sync ios`. Swift Package Manager fetches Capacitor itself when Xcode opens; there's no CocoaPods step.

## 3. Open Xcode

```bash
npm run ios:open
```

In the App target → Signing & Capabilities, check:
- Team: `4JNCSTKTHQ`, Automatically manage signing on.
- Bundle Identifier: `app.stackd.transfer`.
- **Sign in with Apple** is listed. It comes from `App/App.entitlements`; if Xcode shows it red, click "+ Capability" → Sign in with Apple once and let Xcode register it.
- General: Version `1.0.0`, Build `1`, iPhone only, Portrait.

## 4. Run it on the iPhone

Pick the iPhone as the run destination and press Run (⌘R). If the build fails in a Stackd Swift file, that's code nobody could compile on Windows: fix it there and commit the fix.

## 5. Test on the iPhone

Use throwaway accounts (`you+stackd-test1@…`), never the App Store review account, which must keep its plan.

Sign-in:
- [ ] Sign in with Apple, new account: Apple's own sheet (not a web page) → onboarding → Home says "Hi, {your Apple first name}!"
- [ ] Sign in with Apple again after signing out → straight to Home, no onboarding
- [ ] Cancel the Apple sheet → back on Sign in, no error
- [ ] Continue with Google: Google's page opens in an in-app browser sheet, then closes by itself → onboarding (new) or Home (returning)
- [ ] Tap Done on Google's sheet without signing in → back on Sign in, no error
- [ ] Email sign-up → the 6-digit code arrives (iOS may offer it above the keyboard) → onboarding
- [ ] Wrong password → "Couldn't sign you in"
- [ ] Forgot password → code → new password → Home with "Password saved"
- [ ] Onboarding: college, schools, major → Home with the plan
- [ ] UC San Diego → Open on ASSIST opens Safari
- [ ] Settings shows "Stackd 1.0.0" and "Developed by Ryan Saleh, Shikhar Sisodia, Abyan Kashif, and Antonio Avila."; Terms, Privacy and Support open and Back returns
- [ ] Force-quit and reopen: still signed in, same plan
- [ ] Background the app for a minute, reopen: same screen
- [ ] Sign out → Sign in with "Signed out"
- [ ] Delete account (a throwaway) → Welcome with "Account deleted"; signing in again fails

The app itself:
- [ ] Launch screen: the wordmark on light blue, then Welcome with no white flash
- [ ] Home screen icon: the husky
- [ ] Status bar text is dark and readable on every screen; nothing under the notch or the home indicator
- [ ] The keyboard never covers the field being typed in
- [ ] Rotating the phone does nothing (portrait only)

## 6. Archive and upload

1. Run destination: **Any iOS Device (arm64)**.
2. Product → **Archive**.
3. In the Organizer: **Validate App**, fix anything it reports, then **Distribute App** → App Store Connect → Upload.

## 7. TestFlight

1. App Store Connect → Stackd → TestFlight: wait for build 1.0.0 (1) to finish processing.
2. Add it to an internal testing group, install from the TestFlight app on at least one iPhone, and repeat the sign-in lines of step 5 on that build.

## 8. Submit

App Store Connect → Stackd → version 1.0, everything from `docs/app-store/listing.md`:
1. Select build 1.0.0 (1).
2. Upload the five screenshots (6.9-inch, from the simulator or the phone, with the review account, no founder email on screen).
3. Check the review account and notes, App Privacy, age rating, content rights and copyright are filled in.
4. **Add for Review**, then **Submit for Review**.

Statuses after that, in order: Waiting for Review → In Review → Pending Developer Release or Ready for Distribution. It's only live once Apple approves it. Uploading isn't submitting.

## Known risks for review

- **Guideline 4.2 (minimum functionality).** The team decided push notifications for deadlines would be Stackd's native feature (`docs/16-open-questions.md → Decided`). They aren't built. Version 1.0 has native Sign in with Apple, but it's still mostly the web app in a native shell, so a 4.2 rejection is possible. If it happens, the plan is to build the deadline notifications and resubmit.
- **Google sign-in returns through the app's URL scheme.** If iOS asks "Open in Stackd?" when Google finishes, that's Safari's prompt for custom schemes. Tap Open. If reviewers find it confusing, the fix is a native Google plugin (needs an iOS OAuth client in Google Cloud project `stackd-508823`).
- **Expired Google sign-in.** If Google's page is left open for minutes, Supabase sends the expiry to the Site URL (`http://localhost:3000` today), which can't load inside the sheet. Done closes it. Changing Supabase's Site URL to `https://joinstackd-chi.vercel.app` fixes it, but it also changes where the local dev server's expired web sign-ins land.
