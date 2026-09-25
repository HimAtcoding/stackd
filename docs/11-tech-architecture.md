# Technical architecture

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind
- Database: PostgreSQL via Supabase
- Auth: Supabase Auth (when auth arrives — not in v0)
- Hosting: Vercel
- Data processing: Python, for imports, cleaning, normalization, matching, validation, and recommendation experimentation

## Layer separation

Keep these four things in separate places and never let one leak into another:

1. **Raw source data** — as retrieved, unmodified, with provenance
2. **Normalized academic data** — the database
3. **Application and recommendation logic**
4. **UI**

**No academic relationship is ever hard-coded in a component.** Every articulation, requirement, and course comes from a database record. A test worth writing early: delete all seed data and confirm the UI renders empty states rather than a hardcoded fallback.

## Suggested repo layout

```
/app              Next.js routes
/components       UI
/lib
  /db             queries, typed
  /domain         requirement matching, coverage, status logic
/data
  /raw            source captures, never edited by hand
  /seed           curated CSV/JSON, human-editable, reviewed in PRs
/scripts          Python import, validate, normalize
/docs             these files
```

Curated academic data lives in version control as reviewable files, not typed straight into a Supabase table. When a record changes, the diff shows who changed it and why.

## Process for any major feature

Before implementing, state: what is being built, why, what database changes it needs, which files change, and how it will be tested.

## Web vs native

> **My note:** The stated end goal is an App Store listing. The stack above is a web stack, and the spec explicitly excludes native apps from the MVP. Both are right, but the tension needs resolving out loud rather than deferred. Full argument in `13-distribution-and-app-store.md`. The short version: build the web app as a proper installable PWA now, and treat a native shell as a distribution decision to make *after* there are users, not an architectural one to make today. If a native app ever happens, Expo/React Native lets the domain and query layers move over intact — which is another reason to keep them out of the components.
