# Roadmap and non-goals

## Build-to-launch order (revised October 2026)

The working plan from today through App Store launch and after. Each phase depends on the one before it. Step-by-step progress is tracked in `docs/build-status.md`; decisions behind this plan are in `16-open-questions.md → Decided`.

| # | Phase | What it covers | Who | Done when |
|---|---|---|---|---|
| 1 | Mockup screens | Welcome, sign-in flow, Home, University requirements (built). Essays and the celebration move to phase 9 | Claude Code | Done |
| 2 | Data access and accounts | Read ASSIST's terms and email them about data access; create the Supabase project; Apple Developer Program | Founders | Done |
| 3 | Database and real sign-in | Tables from `05-data-model.md` with provenance; an importer that works on agreements saved by hand; Supabase email sign-in replaces demo auth; progress saved per user with row-level security | Claude Code | Done |
| 4 | Planning layer on real structure | Colleges, universities, and majors in the database (names and official links only, no copied agreement data). Each plan links to the official ASSIST agreement | Claude Code | Done |
| 5 | Core screens | Onboarding, Home plan states, the official agreement card, Settings (built). Still to come: Explore (search), requirement detail, university Overview tab | Design chat (specs), Claude Code | A student goes from sign-up to "these courses count" on real data |
| 6 | iOS app | Capacitor iOS project, Sign in with Apple (native) and Google (in-app browser), App Store listing (PR #2). Native Google sign-in and push notifications for deadlines still to come | Claude Code, founders on the Mac | Runs on a real iPhone |
| 7 | TestFlight beta | Las Positas students, starting with the CS club: 10, fix, then 50. Time it to a registration window | Founders | Students return and save plans without help |
| 8 | App Store | v1 per `docs/specs/13-v1-launch.md`: no dead ends, privacy, terms, support, review account | Founders | Approved and live |
| 9 | Expand and polish | v1.1 Essays and deadlines with push notifications; v1.2 Explore, more schools and majors, native Google sign-in; v1.3+ Events and Mentors after their product decisions. An ASSIST-like database for out-of-state transfers, each source's terms checked first. Student life, the celebration, Rive animations, design rev 2 | Everyone | Ongoing |

**On coverage speed:** the number of universities supported is limited by how fast data can be legitimately obtained and verified, not by code. Bulk-imported records show as "unverified" until checked (`06-trust-and-provenance.md`). A few schools covered correctly beats many covered loosely.

## Course data track (runs alongside every release)

Showing course requirements inside the app, instead of sending students to ASSIST, is the core goal (`16 → In-app course requirements`). It's the slowest part of the project, so it runs in parallel with the releases above rather than waiting for phase 9.

| Step | What | Who | Done when |
|---|---|---|---|
| A | Read the terms of use for UC Transfer Pathways (UC Admissions) and the CSU Transfer Model Curricula (CCC Chancellor's Office). Record what's allowed in `16` | Founders, Claude Code | Terms recorded |
| B | If allowed: import the UC Computer Science Transfer Pathway as the requirement list for every UC CS target, with source and year. This gives requirement names and course types, not yet which Las Positas courses match | Claude Code | UC San Diego CS shows its requirement list in the app |
| C | Ask UC San Diego (then the other 8 UC campuses) for permission to show their published major requirements. One email per campus | Founders | Replies recorded in `16` |
| D | Ask Las Positas's articulation officer or transfer center to review Stackd and, ideally, check its course matches. A college-endorsed source is both more accurate and easier to defend | Founders | A meeting held |
| E | Course matches (which Las Positas courses meet each requirement) only from a permitted source: ASSIST licensed access, a campus's permission, or a college partner. Every match carries source, year, and verification status | Claude Code, founders | The first verified match shows in the app |
| F | Check the ASSIST Resource Center Data page each term for outside access | Founders | Ongoing |

Until step E, the official agreement card stays as the way to see course matches, and the requirement list (step B) says plainly that matches are on ASSIST.

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
