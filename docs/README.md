# Stackd — project documentation

Source: Ryan's master braindump (the "Transfer Pathway Platform" spec). Split by topic, deduplicated, and annotated. The braindump itself should be kept unchanged somewhere as the historical artifact; these files are the working version.

## How to read the annotations

Everything in normal prose is the spec as written (tightened, not changed in meaning).

> **My note:** blocks are my additions, corrections, or disagreements. They are proposals, not decisions. Nothing in a note has been folded into the spec silently.

## The files

| File | What it holds |
|---|---|
| `01-vision-scope.md` | What the product is, the question it answers, how far the scope goes and when |
| `02-problem-and-landscape.md` | The fragmentation problem, positioning, and who else is already building this |
| `03-users.md` | Who uses it, in what state of mind, and the jobs they're hiring it for |
| `04-california-transfer-domain.md` | The actual rules of CA transfer: ASSIST, Cal-GETC, ADT, TAG, UC-7. Mostly new. |
| `05-data-model.md` | Tables, relationships, and why the model is requirement-first |
| `06-trust-and-provenance.md` | Verification statuses, provenance fields, staleness, what the product may never claim |
| `07-requirement-search.md` | Requirement → valid courses, and multi-university coverage |
| `08-recommendation-engine.md` | Modes, scoring factors, semester planning. All post-MVP. |
| `09-mvp-scope.md` | What ships first, what explicitly does not |
| `11-tech-architecture.md` | Stack, layer separation, repo layout |
| `12-data-pipeline.md` | How academic data gets in, gets validated, and gets refreshed |
| `13-distribution-and-app-store.md` | Launch, growth, SEO, and the honest path to an App Store listing |
| `14-metrics.md` | What to measure, what to ignore |
| `15-roadmap-and-non-goals.md` | Phases, and the four-year → four-year expansion |
| `16-open-questions.md` | Decisions that need making, with my recommendation on each |
| `17-phase1-agent-brief.md` | The short prompt to hand a coding agent. Derived from all of the above. |
| `specs/` | Screen-by-screen design specs. Build UI from these. |

## Reading order

New collaborator: 01 → 03 → 04 → 09.
Building UI: the spec in `specs/`, plus `.claude/rules/ui-design.md` at the repo root.
Coding agent: 17 only, with 04, 05, 06, 07 as reference.
Deciding what to build next: 16 → 15.

## Status

These docs describe a product that does not exist yet. Nothing here should be quoted to a student, a counselor, or a college as a description of a live service.
