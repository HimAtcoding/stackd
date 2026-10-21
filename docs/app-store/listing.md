# App Store listing (version 1.2)

Everything App Store Connect asks for. Written 2026-10-13 from the code on `feat/ios-app-store-prep`, and **entered in App Store Connect the same day** (app record "Stackd: Transfer Planner", Apple ID `6822523006`, version 1.0 Prepare for Submission). Re-check the privacy answers whenever what the app collects changes (`docs/specs/12-legal-and-support.md`).

**Updated 2026-10-18 for version 1.1** (`docs/specs/13-v1-launch.md → 1.1 submission`): the privacy answers, the reviewer notes, the screenshots, What's New and the checklist.

**Updated 2026-10-21 for version 1.2** (Essays, specs 17 and 19, on branch `release/v1.2`): description, privacy answers, age rating, reviewer notes, screenshots and the checklist. 1.1 was never submitted. Version 1.0 was still Waiting for Review on 2026-10-21, and Shikhar chose to withdraw it and turn that same App Store version into 1.2 with build 1.2.0 (3). That makes 1.2 the app's first public release, so App Store Connect shows no What's New field (it's kept below for the record).

## Credits

- **Public developer credit, exact words:** "Developed by Ryan Saleh, Shikhar Sisodia, Abyan Kashif, and Antonio Avila." (all four of the team, decided 2026-10-13). It's at the end of the description, in Settings' footer, and on every public page (`lib/about.ts`).
- **Copyright (legal ownership), as the founders answered on 2026-10-12:** `2026 Ryan Saleh, Shikhar Sisodia, Abyan Kashif, Antonio Avila`. App Store Connect adds the © itself. The credit and the copyright both name all four.
- **Seller / developer name:** set by the Apple Developer account, not editable here. Team `4JNCSTKTHQ` is an **Individual** membership (Shikhar's), so the store shows the account holder's legal name. Apple doesn't allow the team's four names as the seller on an individual membership. A shared seller name needs an Organization membership for a registered legal entity (with a D-U-N-S number). Apple can convert the existing team and keep the Team ID, so Sign in with Apple keeps working.

## App record

| Field | Value |
|---|---|
| Platform | iOS (iPhone only; `TARGETED_DEVICE_FAMILY = 1`) |
| Name | **Stackd: Transfer Planner**. Plain "Stackd" is already taken on the App Store by another developer. The home-screen name under the icon is still "Stackd" (`CFBundleDisplayName`). The store name can be changed until the version is submitted |
| Apple ID | `6822523006` |
| Bundle ID | `app.stackd.transfer` |
| SKU | `stackd-ios-1` |
| Primary language | English (U.S.) |
| Version | 1.2 (the binary is 1.2.0, build 3). Earlier uploads: 1.0.0 (1) and 1.1.0 (2); never reuse those numbers |
| Primary category | Education |
| Secondary category | None |
| Price | Free ($0.00 in all regions) |
| Availability | United States only (Stackd is for California students); widen it in Pricing and Availability |
| User access | Full Access |
| In-app purchases / subscriptions | None |

## Product page

**Subtitle** (29 of 30 characters). Changed from "California transfer planner" because the store name already says "Transfer Planner":

```
Plan your California transfer
```

**Promotional text** (optional, 170 max):

```
Draft your four UC personal insight answers, see your next transfer deadline, and check off your UC or Cal State application.
```

**Keywords** (99 of 100 characters; no brand names):

```
transfer,college,community college,university,California,education,planning,major,courses,counselor
```

**Description:**

```
Stackd helps California community college students organize their transfer plan.

Never miss a transfer deadline
Home shows your next deadline with a countdown, and a checklist for your UC or Cal State application. The Deadlines screen lists every date for your transfer year, from the UC application to the FAFSA, each linked to its official source. Turn on reminders to get a heads-up before each one.

Draft your UC personal insight answers
Write all four of your UC personal insight answers in Stackd: the required one and the three you choose. Stackd counts your words against the 350-word limit, saves your drafts to your account, and shows when all four are done. Bring a draft in from a file or the clipboard, copy it out when it's ready, and send a private link to a counselor or teacher so they can comment, no account needed.

Pick your community college, the universities you're aiming for, and your major. Stackd saves your plan to your account, so it's there on any device you sign in on, and opens the official transfer agreement for your path on ASSIST, the official source for California transfer agreements.

What you can do:
- Create an account with email, Sign in with Apple, or Continue with Google
- Choose your college, the universities you're aiming for, and your major
- See your plan on Home, and change it any time in Settings
- Open the official agreement for your college, school, and major
- Draft, count and finish your UC personal insight answers, and ask someone to review them
- Delete your account and its data any time in Settings

Stackd starts with a small set of colleges, universities, and majors and adds more as each one is checked. When your path isn't covered yet, Stackd points you to ASSIST.

Stackd is an unofficial planning tool. It isn't affiliated with ASSIST, the University of California, the California State University, or any college, and it doesn't guarantee admission or that any course will transfer. Stackd doesn't submit applications and never writes your answers for you. Confirm your plan with a counselor.

Developed by Ryan Saleh, Shikhar Sisodia, Abyan Kashif, and Antonio Avila.
```

Kept truthful on purpose: no course matches, no statewide coverage, no admission chances, no AI (`essayFeedback` is off in 1.2). Course matches stay out until ASSIST grants data access (`docs/16-open-questions.md → Decided`).

**What's New in Version 1.2** (not shown by App Store Connect for a first release; kept for the record and for the next version):

```
Essays are here. Draft your four UC personal insight answers in Stackd, with a word counter for the 350-word limit, drafts saved to your account, and a check for each answer you finish. Bring a draft in from a file or your clipboard, copy or share it when it's ready, and send a private review link to a counselor or teacher. Home and Deadlines also have a refreshed look, with date tiles, official-source links, and a sheet for each application step.
```

**What's New in 1.1** (never submitted):

```
Deadlines are here. Home now shows your next transfer deadline with a countdown, and a checklist for your UC or Cal State application. The new Deadlines screen lists every date for your transfer year, each with its official source. Turn on reminders to get a heads-up before each one.
```

| Field | Value |
|---|---|
| Support URL | https://joinstackd-chi.vercel.app/support/ |
| Marketing URL | Leave empty |
| Privacy Policy URL | https://joinstackd-chi.vercel.app/privacy/ |
| Copyright | `2026 Ryan Saleh, Shikhar Sisodia, Abyan Kashif, Antonio Avila` |

## App Privacy (the "nutrition label")

Checked against the code: the Supabase tables (`profiles`, `user_targets`, `saved_schools`, `user_requirement_status`, `saved_courses`, from 1.1 `user_deadlines`, `user_checklist_steps` and `profiles.transfer_term`, and from 1.2 `essay_drafts`, `review_links` and `review_comments`), `lib/auth`, and `package.json`. There's no analytics, advertising, crash-reporting or tracking SDK in the app (1.2 adds only Capacitor's Clipboard and Share plugins and `mammoth`, which reads .docx files on the phone). Re-checked for 1.2 on 2026-10-21 against `/privacy/` (updated October 21, 2026).

**Do you or your third-party partners collect data from this app?** Yes.

| Apple data type | Collected | Linked to the user | Used for tracking | Purpose |
|---|---|---|---|---|
| Contact Info → Email Address | Yes (sign-up, or shared by Apple or Google) | Yes | No | App Functionality |
| Contact Info → Name | Yes (first name only; typed, or shared by Apple or Google) | Yes | No | App Functionality |
| Identifiers → User ID | Yes (the account ID, and the Apple or Google account ID behind a social sign-in) | Yes | No | App Functionality |
| User Content → Other User Content | Yes (the plan: community college, target schools, majors, saved schools, progress. From 1.1, the deadline data: the transfer term, the deadlines and checklist steps marked done, and the reminder days chosen for each deadline. From 1.2, essay drafts, their word counts and done marks, review links' snapshots, and reviewers' comments on them) | Yes | No | App Functionality |

Essays add no new data type either: drafts and review comments are user content stored with the student's account, used only to show them back, never used for tracking, and not sent to any AI (`essayFeedback` is off; spec 17's AI feedback isn't built). A file a student imports is read on the phone and only the text they keep is saved. A reviewer uses the website, not the app, and has no account.

The deadline data adds no new data type: it's the student's own content in the same row, linked to their account, used for app functionality only, and not used for tracking. Reminders are local notifications that the iPhone schedules itself. Nothing is sent when one goes off, and the reminders switch and default days in Settings stay on the phone, so notifications need no data type of their own.

Everything else (location, contacts, health, financial, browsing or search history, usage data, diagnostics, purchases, sensitive info, photos, audio): **not collected**.

**Tracking:** No. Stackd doesn't link its data with other companies' data for advertising and doesn't share it with data brokers. No App Tracking Transparency prompt is needed.

Note: Supabase's own server logs record IP addresses for security, and Gmail delivers the code emails. Neither is used by the app for any purpose, and the privacy policy says so. If the founders ever add analytics or crash reporting, these answers change.

## Age rating

Apple's current questionnaire (the 4+ / 9+ / 13+ / 16+ / 18+ system). Answer **None** or **No** to every content question: no violence, sexual content, profanity, horror, drugs, alcohol, tobacco, gambling, contests, or medical or treatment information.

| Question | Answer | Why |
|---|---|---|
| User-generated content shown to others, messaging, or chat | **Yes (1.2)** | A student can share one answer by a private review link, and the person with the link can comment. Nothing is public or browsable: only the student sees the comments. Moderation for guideline 1.2: the student can delete any comment and turn off any link; each comment has Report (emails joinstackd@gmail.com); the Terms forbid abusive comments and promise action within 24 hours; links end after 14 days; 60 comments a day per link. Plans and drafts stay visible only to their owner (row-level security) |
| Unrestricted web access | No | Outside links (ASSIST, the policy pages' links) open in Safari; the only in-app browser is Google's sign-in page |
| Advertising | No | |
| Parental controls / age assurance | No | |

Expected result: **4+** (1.0 and 1.1). With the 1.2 user-content answer App Store Connect may suggest a higher age; accept what it calculates, since the content is private sharing chosen by the student.

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

The review account: first name "Taylor", email confirmed, plan Las Positas College → UC San Diego, Computer Science (B.S.). Nothing personal in it. Since 2026-10-21 it also has a made-up 102-word "Your major" draft, so Essays isn't empty for the reviewer.

**Notes for the reviewer** (1.2):

```
Stackd is a transfer-planning app for California community college students. Sign in with the account above to see a saved plan (Las Positas College to UC San Diego, Computer Science).

Home shows the student's transfer route, the next deadline, and the UC application checklist. Deadlines lists every date with its official source. Reminders are local notifications, and the app asks for permission only when you tap Remind me.

Essays: on Home, tap "Personal insight answers" (or open the UC checklist step "Write your personal insight answers" and tap "Write them in Stackd"). Choose questions, then open one to write. Drafts are saved to the account. The ... menu in the editor copies or shares the text, imports a .docx or .txt, or makes a private review link. The link opens a web page where a reviewer can comment without an account; only the student sees the comments, and can delete any comment, report it, or turn the link off. Stackd has no AI features and never writes text for the student.

You can also create a new account with email (a 6-digit code is emailed), Sign in with Apple, or Continue with Google. A new account goes through a three-step setup: college, schools, major.

Account deletion: Settings > Delete account > Delete account. It deletes the account and all of its data right away.
```

## Screenshots (1.2)

Captured on the Mac from the iOS Simulator or a real iPhone, never from the web build. iPhone only: 6.9-inch (1320 × 2868, e.g. the iPhone 16 Pro Max simulator). App Store Connect scales them down for smaller iPhones.

Use the review account (no founder email on screen) and no debug or dev pages. Take a new set from the 1.2.0 (3) build; the 1.0 set showed tiles, the bell and the tab bar, which no longer exist.
1. Home with the route, Up next and Get ready, and the Personal insight answers row
2. Essays: the indigo panel, Required and Choose 3
3. The editor with the sample "Your major" draft and its counter
4. The Deadlines screen with its date tiles
5. A step sheet ("Write your personal insight answers")
6. UC San Diego with the official agreement card
7. Onboarding, choosing the schools (step 2)
8. Settings

## Before pressing Submit (1.2)

- [ ] Build 1.2.0 (3) uploaded from `release/v1.2`, processed, in TestFlight's Internal team, and tested on an iPhone
- [x] Version 1.0 removed from review (Shikhar's choice, 2026-10-21) and its version number changed to 1.2
- [ ] Build 1.2.0 (3) selected for version 1.2 (not 1.0.0 (1) or 1.1.0 (2))
- [x] Website redeployed from the same release commit, so https://joinstackd-chi.vercel.app/privacy/ says "Updated October 21, 2026"
- [x] App Privacy answers match the table above; age rating re-answered (user content: Yes)
- [x] Description, promotional text and 1.2 reviewer notes entered (2026-10-21)
- [ ] New screenshots from the 1.2.0 (3) build entered
- [ ] Review account still signs in, still has its plan, and shows the sample draft
- [x] Release: automatically after approval
- [ ] Add for Review, then Submit for Review
