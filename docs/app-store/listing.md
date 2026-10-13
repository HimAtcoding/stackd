# App Store listing (version 1.0)

Everything App Store Connect asks for, ready to paste. Written 2026-10-13 from the code on `feat/ios-app-store-prep`. Re-check the privacy answers whenever what the app collects changes (`docs/specs/12-legal-and-support.md`).

## Credits

- **Public developer credit, exact words:** "Developed by Ryan Saleh, Shikhar Sisodia, Abyan Kashif, and Antonio Avila." (all four of the team, decided 2026-10-13). It's at the end of the description, in Settings' footer, and on every public page (`lib/about.ts`).
- **Copyright (legal ownership), as the founders answered on 2026-10-12:** `2026 Ryan Saleh, Shikhar Sisodia, Abyan Kashif, Antonio Avila`. App Store Connect adds the © itself. The credit and the copyright both name all four.
- **Seller / developer name:** set by the Apple Developer account, not editable here. Team `4JNCSTKTHQ` is an **Individual** membership (Shikhar's), so the store shows the account holder's legal name. Apple doesn't allow the team's four names as the seller on an individual membership. A shared seller name needs an Organization membership for a registered legal entity (with a D-U-N-S number). Apple can convert the existing team and keep the Team ID, so Sign in with Apple keeps working.

## App record

| Field | Value |
|---|---|
| Platform | iOS (iPhone only; `TARGETED_DEVICE_FAMILY = 1`) |
| Name | Stackd |
| Bundle ID | `app.stackd.transfer` |
| SKU | `stackd-ios-1` |
| Primary language | English (U.S.) |
| Version | 1.0 (the binary is 1.0.0, build 1) |
| Primary category | Education |
| Secondary category | None |
| Price | Free, all countries and regions the founders pick (start with the United States) |
| In-app purchases / subscriptions | None |

## Product page

**Subtitle** (27 of 30 characters):

```
California transfer planner
```

**Promotional text** (optional, 170 max):

```
Plan your transfer from a California community college: pick your college, schools, and major, and open the official agreement for your path.
```

**Keywords** (99 of 100 characters; no brand names):

```
transfer,college,community college,university,California,education,planning,major,courses,counselor
```

**Description:**

```
Stackd helps California community college students organize their transfer plan.

Pick your community college, the universities you're aiming for, and your major. Stackd saves your plan to your account, so it's there on any device you sign in on, and opens the official transfer agreement for your path on ASSIST, the official source for California transfer agreements.

What you can do:
- Create an account with email, Sign in with Apple, or Continue with Google
- Choose your college, the universities you're aiming for, and your major
- See your plan on Home, and change it any time in Settings
- Open the official agreement for your college, school, and major
- Delete your account and its data any time in Settings

Stackd starts with a small set of colleges, universities, and majors and adds more as each one is checked. When your path isn't covered yet, Stackd points you to ASSIST.

Stackd is an unofficial planning tool. It isn't affiliated with ASSIST, the University of California, the California State University, or any college, and it doesn't guarantee admission or that any course will transfer. Confirm your plan with a counselor.

Developed by Ryan Saleh, Shikhar Sisodia, Abyan Kashif, and Antonio Avila.
```

Kept truthful on purpose: no course matches, no statewide coverage, no admission chances. Course matches stay out until ASSIST grants data access (`docs/16-open-questions.md → Decided`).

| Field | Value |
|---|---|
| Support URL | https://joinstackd-chi.vercel.app/support/ |
| Marketing URL | Leave empty |
| Privacy Policy URL | https://joinstackd-chi.vercel.app/privacy/ |
| Copyright | `2026 Ryan Saleh, Shikhar Sisodia, Abyan Kashif, Antonio Avila` |

## App Privacy (the "nutrition label")

Checked against the code: the Supabase tables (`profiles`, `user_targets`, `saved_schools`, `user_requirement_status`, `saved_courses`), `lib/auth`, and `package.json`. There's no analytics, advertising, crash-reporting or tracking SDK in the app.

**Do you or your third-party partners collect data from this app?** Yes.

| Apple data type | Collected | Linked to the user | Used for tracking | Purpose |
|---|---|---|---|---|
| Contact Info → Email Address | Yes (sign-up, or shared by Apple or Google) | Yes | No | App Functionality |
| Contact Info → Name | Yes (first name only; typed, or shared by Apple or Google) | Yes | No | App Functionality |
| Identifiers → User ID | Yes (the account ID, and the Apple or Google account ID behind a social sign-in) | Yes | No | App Functionality |
| User Content → Other User Content | Yes (the plan: community college, target schools, majors, saved schools, progress) | Yes | No | App Functionality |

Everything else (location, contacts, health, financial, browsing or search history, usage data, diagnostics, purchases, sensitive info, photos, audio): **not collected**.

**Tracking:** No. Stackd doesn't link its data with other companies' data for advertising and doesn't share it with data brokers. No App Tracking Transparency prompt is needed.

Note: Supabase's own server logs record IP addresses for security, and Gmail delivers the code emails. Neither is used by the app for any purpose, and the privacy policy says so. If the founders ever add analytics or crash reporting, these answers change.

## Age rating

Apple's current questionnaire (the 4+ / 9+ / 13+ / 16+ / 18+ system). Answer **None** or **No** to every content question: no violence, sexual content, profanity, horror, drugs, alcohol, tobacco, gambling, contests, or medical or treatment information.

| Question | Answer | Why |
|---|---|---|
| User-generated content shown to others, messaging, or chat | No | Each plan is visible only to its owner (row-level security) |
| Unrestricted web access | No | Outside links (ASSIST, the policy pages' links) open in Safari; the only in-app browser is Google's sign-in page |
| Advertising | No | |
| Parental controls / age assurance | No | |

Expected result: **4+**.

## Export compliance

`ITSAppUsesNonExemptEncryption` is `false` in `ios/App/App/Info.plist`, so App Store Connect won't ask about each build. Stackd only uses the encryption built into iOS (HTTPS through the system's networking, and Apple's own Sign in with Apple). It implements no encryption of its own, which makes it exempt. If asked anyway: "None of the algorithms mentioned above."

## Content rights

**Does your app contain, show, or access third-party content?** Yes.
- It shows the names of colleges, universities, and majors, and links to official agreements on assist.org. These are facts and links, with the source named; no ASSIST agreement text or course data is copied into the app.
- The Apple and Google sign-in buttons use each company's logo under its sign-in branding guidelines.
- All other art (the husky, the wordmark, the campus images) belongs to Stackd.

**Do you have all necessary rights?** Yes, on the basis above.

## App Review information

| Field | Value |
|---|---|
| Sign-in required | Yes |
| Demo account user name | In `~/.stackd-secrets/app-review-account.txt` on Shikhar's laptop (a disposable Stackd account made 2026-10-13, not anyone's personal password) |
| Demo account password | Same file. Never commit it |
| Contact first / last name | The account holder's |
| Contact email | joinstackd@gmail.com |
| Contact phone | The account holder's (App Store Connect requires one) |

The review account: first name "Taylor", email confirmed, plan Las Positas College → UC San Diego, Computer Science (B.S.). Nothing personal in it.

**Notes for the reviewer:**

```
Stackd is an unofficial transfer-planning tool for California community college students. It is not affiliated with ASSIST, the UC, the CSU, or any college, and it does not guarantee admission.

Sign in with the demo account above (email and password). It already has a plan: Las Positas College to UC San Diego, Computer Science.

Core path:
1. Sign in.
2. Home shows the plan. Tap the plan card or the Requirements tile to open UC San Diego.
3. "Open on ASSIST" opens the official transfer agreement for that college, school, and major in Safari.
4. Settings (the gear on Home) changes the college, schools, or major.

You can also create a new account with email (a 6-digit code is emailed), Sign in with Apple, or Continue with Google. A new account goes through a three-step setup: college, schools, major.

Account deletion: Settings > Delete account > Delete account. It deletes the account and all of its data right away.
```

## Screenshots

Captured on the Mac from the iOS Simulator or a real iPhone, never from the web build. iPhone only, so only iPhone sizes: 6.9-inch (1320 × 2868, e.g. iPhone 16 Pro Max simulator). App Store Connect scales them down for smaller iPhones.

Use the review account (no founder email on screen) and no debug or dev pages:
1. Welcome
2. Home with the plan
3. Onboarding, choosing the schools (step 2)
4. UC San Diego with the official agreement card
5. Settings

## Before pressing Submit

- [ ] Build 1.0.0 (1) uploaded, processed, and tested in TestFlight
- [ ] That build selected for version 1.0
- [ ] Screenshots uploaded
- [ ] Every field above filled in
- [ ] Review account still signs in and still has its plan
- [ ] Add for Review, then Submit for Review
