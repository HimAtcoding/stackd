# Roadmap and non-goals

## Build-to-launch order (revised October 2026)

The working plan from today through App Store launch and after. Each phase depends on the one before it. Step-by-step progress is tracked in `docs/build-status.md`; decisions behind this plan are in `16-open-questions.md → Decided`.

| # | Phase | What it covers | Who | Done when |
|---|---|---|---|---|
| 1 | Mockup screens | Welcome, sign-in flow, Home, University requirements (built). Essays and the celebration move to phase 9 | Claude Code | Done |
| 2 | Data access and accounts | Read ASSIST's terms and email them about data access; create the Supabase project; Apple Developer Program | Founders | Supabase keys handed to Claude Code; ASSIST contacted |
| 3 | Database and real sign-in | Tables from `05-data-model.md` with provenance; an importer that works on agreements saved by hand; Supabase email sign-in replaces demo auth; progress saved per user with row-level security | Claude Code | A real account keeps its progress after reinstalling |
| 4 | First real data | Las Positas → UC San Diego CS, curated from ASSIST with source and academic year on every record | Founders (curation), Claude Code (import, validation) | The database answers "which courses count for requirement X?" |
| 5 | Core screens | Specs, then builds: onboarding (college, major, targets), Explore (search), requirement detail, university Overview tab. App reads the database instead of demo files | Design chat (specs), Claude Code | A student goes from sign-up to "these courses count" on real data |
| 6 | iOS app | Capacitor iOS project (built on the Mac with Xcode); Google sign-in and Sign in with Apple; push notifications for deadlines | Claude Code, founder on the Mac | Runs on a real iPhone from Xcode |
| 7 | TestFlight beta | Las Positas students, starting with the CS club: 10, fix, then 50. Time it to a registration window | Founders | Students return and save plans without help |
| 8 | App Store | Privacy policy, terms, unofficial disclaimer, App Store listing and review | Founders | Approved and live |
| 9 | Expand and polish | All of California via ASSIST, then states with statewide course numbering, then licensed sources. Essays, Mentors, Student life, the celebration, Rive animations, design rev 2 | Everyone | Ongoing |

**On coverage speed:** the number of universities supported is limited by how fast data can be legitimately obtained and verified, not by code. Bulk-imported records show as "unverified" until checked (`06-trust-and-provenance.md`). A few schools covered correctly beats many covered loosely.

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
