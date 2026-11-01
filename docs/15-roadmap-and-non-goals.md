# Roadmap and non-goals

## Build-to-launch order (revised November 1, 2026)

The working plan from today through App Store launch and after. Each phase depends on the one before it. Step-by-step progress is tracked in `docs/build-status.md`; decisions behind this plan are in `16-open-questions.md → Decided`.

| # | Phase | What it covers | Who | Done when |
|---|---|---|---|---|
| 1 | Mockup screens | Welcome, sign-in flow, Home, University requirements (built). Essays and the celebration move to phase 9 | Claude Code | Done |
| 2 | Data access and accounts | Read ASSIST's terms and email them about data access; create the Supabase project; Apple Developer Program | Founders | Done |
| 3 | Database and real sign-in | Tables from `05-data-model.md` with provenance; an importer that works on agreements saved by hand; Supabase email sign-in replaces demo auth; progress saved per user with row-level security | Claude Code | Done |
| 4 | Planning layer on real structure | Colleges, universities, and majors in the database (names and official links only, no copied agreement data). Each plan links to the official ASSIST agreement | Claude Code | Done |
| 5 | Core screens | Onboarding, Home plan states, the official agreement card, Settings (built). Explore: all 147 California public schools, Computer Science at every UC and Cal State, the Explore tab and major pages (built, flag off until 1.4). Still to come: requirement detail, university Overview tab | Design chat (specs), Claude Code | Done for v1.4 |
| 6 | iOS app | Capacitor iOS project, Sign in with Apple (native) and Google (in-app browser). Native Google sign-in still to come | Claude Code, founders on the Mac | Done |
| 7 | TestFlight beta | Las Positas students, starting with the CS club: 10, fix, then 50. Time it to a registration window | Founders | Students return and save plans without help |
| 8 | App Store | v1.2.0 (Essays) and v1.3.0 (Essays start, notes, reviews) submitted Oct 2026 | Founders | Approved and live |
| 9 | Expand | See "Product roadmap after Explore" below | Everyone | Ongoing |

**On coverage speed:** the number of universities supported is limited by how fast data can be legitimately obtained and verified, not by code. Bulk-imported records show as "unverified" until checked (`06-trust-and-provenance.md`). A few schools covered correctly beats many covered loosely.

## Product roadmap after Explore (November 2026)

The goal is to reach tens of thousands of community college students and keep them coming back. What exists today (deadlines, the application checklist, Essays with reviewers, Explore) helps a student a few times a year. The work below gives them reasons to return every week, reaches every student, and spreads through students, colleges and counselors. Order is a working plan; real student use (validation stage 4) can reorder it.

| Order | Feature | What it does | Why |
|---|---|---|---|
| 1 | Explore, 9 majors | Computer Science plus batch 2a (8 majors), checked and live in v1.4 | One major isn't a product |
| 2 | Your college's courses | "At Las Positas: CS 1, CS 2, CS 21…" from C-ID numbers and college catalogs, Las Positas first, then every college once C-ID allows its approved-course list | Makes Explore personal; the Cal State side is official through C-ID |
| 3 | My plan | Mark what you've taken; see, for UC and Cal State together, what's done, what's missing and a term-by-term plan to finish by your transfer term, including online courses at other colleges through CVC | The original vision ("what to take next, where, and why"); nobody does it across UC and Cal State; brings students back every registration window |
| 4 | TAG checker and transfer GPA | "You're on track for a TAG at UC Davis; here's what's missing." UC and Cal State transfer GPA calculated their way | Six UC campuses guarantee admission; almost no tool explains eligibility clearly |
| 5 | Android | The same app on Android through Capacitor | About half of community college students aren't on iPhone |
| 6 | Community and forums | Forums by school, major and topic (PIQs, TAG, stats, course advice), plus anonymous admit results ("Las Positas → UC San Diego CS, admitted"). Woven into the rest of the app: each Explore major, school and event links to its discussion; admitted students become mentors; questions surface in My plan. Needs moderation, reporting and blocking from day one (Apple requires it) | Replaces scattered Reddit threads with structured, searchable answers; grows by itself |
| 7 | Events and opportunities | A feed matched to your major and schools: transfer fairs, UC and Cal State programs, scholarships, competitions, research programs, club events. Clubs post their own events, starting with the LPC CS club | A reason to open the app every week |
| 8 | Reminders that know your plan | "Registration opens Nov 12 and you still need Linear Algebra." Push notifications are built and switched off | Retention |
| 9 | Mentors and AI | Admitted transfers review essays; AI essay feedback; an AI counselor that answers only from Stackd's verified data | The mentor loop is the network effect; AI needs paid credits |
| 10 | Money | FAFSA and Dream Act deadlines, the Cal Grant for transfers, scholarships matched to the profile, what each campus costs | Money is a top reason students don't transfer |
| 11 | Application tracker | Submitted, documents due, decisions (`trackApplication` flag) | Keeps the student through the whole cycle |
| 12 | Spanish | The app in Spanish | Many students are first-generation and Latino; families help decide |
| 13 | Counselors and colleges | A counselor dashboard (students opt in to share their plan), campus ambassadors, partnerships with MESA, Puente, EOPS and Honors programs | Reaches whole campuses at once; the student stays the user whose experience wins (see Business model) |
| 14 | After transfer | Comparing offers, housing, orientation | Students stay and become mentors |
| 15 | Beyond California | States with statewide course numbering (Texas, Florida, Arizona) first | Expansion phase 6 |

## Course data track (runs alongside every release)

Showing course requirements inside the app, instead of sending students to ASSIST, is the core goal (`16 → In-app course requirements`). It's the slowest part of the project, so it runs in parallel with the releases above rather than waiting for phase 9.

| Step | What | Who | Done when |
|---|---|---|---|
| A | Read the terms of use for UC Transfer Pathways (UC Admissions) and the CSU Transfer Model Curricula (CCC Chancellor's Office). Record what's allowed in `16` | Founders, Claude Code | Done Oct 26, 2026: UC Admissions confirmed facts in Stackd's own words with links back |
| B | Import Transfer Pathways and TMCs as each major's requirement list, with source and year | Claude Code, founders check | Computer Science verified Oct 31, 2026; batch 2a (8 majors) drafted, being checked; batch 2b (the other 18 pathways and Cal State-only degrees) next |
| C | Ask C-ID for permission to show which courses at each college carry each C-ID number | Founders | Reply recorded in `16` |
| D | Ask Las Positas's articulation officer or transfer center to review Stackd and, ideally, check its course matches. A college-endorsed source is both more accurate and easier to defend | Founders | A meeting held |
| E | Course matches (which Las Positas courses meet each requirement) only from a permitted source: the college's own catalog (C-ID numbers), C-ID's list with permission, ASSIST licensed access, or a college partner. Every match carries source, year, and verification status. For UC, a match is shown as "matches the statewide course type", never as "counts for" a campus, until ASSIST or the campus confirms it | Claude Code, founders | The first verified match shows in the app |
| F | Check the ASSIST Resource Center Data page each term for outside access | Founders | Ongoing |

Until step E, Explore's "Find these at your college" links to ASSIST.

## Validation stages

1. **Data prototype** — small verified dataset; confirm the database answers the core query
2. **Search** — requirement → course
3. **UI** — the simplest interface around that search
4. **10 students** — watch, don't explain; record confusion, errors, gaps
5. **Improve** — fix the biggest problem
6. **50 students** — measure returns and saved plans
7. **Expand** — more majors, universities, colleges, filters

## Expansion phases

1. California CCC → CSU/UC, one university, one major
2. More majors at the same university, then more universities
3. Multi-university optimization
4. California private universities
5. Four-year → four-year
6. Out-of-state
7. Nationwide

> **My note on expansion order:** the axes cost wildly different amounts. Adding a **college** to an existing (university, major) pair is cheap — one more ASSIST agreement to curate. Adding a **major** at an existing university is moderate. Adding a **university** multiplies by every major you support. Go wide on colleges first, then majors, then universities. The braindump implies the reverse.
>
> And going statewide via ADT/TMC templates (see `04-california-transfer-domain.md`) is cheaper than any of them, because one template covers every community college at once.

## Four-year → four-year, in brief

A student at a four-year asks "where could I transfer?" The system analyzes current institution, major, completed credits and courses, GPA if voluntarily provided, desired major and location, deadlines, published transfer requirements, and verified equivalencies. Output per destination: estimated applicable coursework, prerequisites remaining, verified units, unknown units, application availability.

The system must never promise a university will accept credits without authoritative support.

> **My note:** There is no ASSIST for this. Without an authoritative equivalency source, nearly every result would read "unverified," which is not a product. Phase 5 at the earliest, and only if a data source appears.

## Transfer destination discovery

Later, students shouldn't need to know where they want to go. Given major, GPA, units, and location preferences, suggest destinations based on coursework compatibility, requirements, timing, and credit preservation. Admission probability is never presented, guaranteed or otherwise.

## Business model

Monetization is not the near-term objective. Validate first: does this save students time, does it make transfer planning easier, do they return, would they recommend it, do counselors find it useful. Possible later models are institutional partnerships or optional premium functionality, but basic transfer information stays free.

> **My note:** Say this out loud now, because it constrains design: if institutional partnerships are ever the model, the customer becomes the college, and products with that model drift toward serving the institution's reporting needs over the student's planning needs. Decide early that the student is the user whose experience wins, and write it down.

## Founder roles

**Business / product:** product strategy, student interviews, user research, prioritization, UX decisions, campus partnerships, transfer center and counselor relationships, marketing, growth, analytics, business model, expansion.

**Technical / data:** architecture, frontend, backend, database, ingestion, normalization, search, recommendation, testing, deployment, documentation.

Both participate in testing and major decisions.

> **My note:** Move **data curation** from the technical column to the business column. See `12-data-pipeline.md` — it's the highest-value work in the project, it isn't engineering, and splitting it this way roughly doubles the throughput of a two-person team.
