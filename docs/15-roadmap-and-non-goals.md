# Roadmap and non-goals

## Build-to-launch order (September 2026)

The working plan from where the build stands today through launch and after. Each phase depends on the one before it. Step-by-step progress inside a phase is tracked in `docs/build-status.md`; this section is the map.

| # | Phase | What it covers | Done when |
|---|---|---|---|
| 1 | Finish the drawn screens | University requirements, Essays, "Great job!" celebration (build steps 7–9 in `docs/specs/README.md`) | All mockup screens are built and pass their specs' tests |
| 2 | Design the missing core screens | Onboarding (college, major, target and reach schools); requirement detail (courses at nearby colleges that satisfy a requirement, with source and year). Mockup → spec → build | A student can pick their path and see which courses count, on demo data |
| 3 | Real data foundation | Supabase project and the tables in `05-data-model.md`; first verified dataset hand-curated from ASSIST (one university and major, 5–10 colleges) with provenance on every record; validate and import scripts (`12-data-pipeline.md`). Curation owned by the business co-founder, in parallel with phase 2 | The database answers "which courses at these colleges satisfy requirement X?" for the MVP slice |
| 4 | Real accounts | Supabase Auth: email and password with real reset emails; Google (OAuth client in Google Cloud); Apple (needs the paid Apple Developer Program, even for web). Progress moves from local storage to the database with row-level security | Real students can sign up, sign in, and keep their progress across devices |
| 5 | Launch readiness | Vercel deploy on a real domain; terms of use and privacy page; unofficial-tool disclaimer; error tracking; the metrics in `14-metrics.md`; testing on real iPhones and Androids, including old phones on slow connections | Safe to hand to a stranger |
| 6 | Soft launch at Las Positas | Validation stages 4–6 below: 10 students, fix, then 50. Time it to a registration window (October–November or April–May) | Students return and save plans without help |
| 7 | Expand coverage | Statewide ADT/TMC templates and Cal-GETC first (cover every CSU at once), then ASSIST agreements pair by pair, then UC TAG. Public requirement pages for search traffic (`13-distribution-and-app-store.md`) | Coverage grows without any unverified record shown as verified |
| 8 | Iterate after launch | Rive husky animations, more interactive layouts, personalized events, programs, and activities, the design rev 2 backlog, Mobbin comparisons. Native app only when deadline and registration notifications justify it | Ongoing |

**On coverage speed:** the number of universities supported is limited by how fast data can be verified, not by code. A few schools covered correctly beats many covered loosely; statewide templates in phase 7 are how coverage grows fast without breaking the no-guessing rule in `06-trust-and-provenance.md`.

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
