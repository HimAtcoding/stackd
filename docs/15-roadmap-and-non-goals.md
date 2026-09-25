# Roadmap and non-goals

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
