# Stackd

Transfer-planning web app for California community college students. Next.js, TypeScript, React, Tailwind. Supabase later. Built mobile-first as an installable PWA.

## Read before any work

- `docs/build-status.md` for what's built, what's next, and open items
- `docs/specs/README.md` for the build order and how specs work
- `docs/17-phase1-agent-brief.md` for scope and the non-negotiable data rules
- `.claude/rules/ui-design.md` for all UI work
- `docs/04`, `05`, `06`, `07` as reference for anything touching academic data

## How screens get built

1. Each screen has a spec in `docs/specs/`. Build from the spec, not from guesses. Every value comes from `docs/specs/00-foundations.md`.
2. Start in plan mode. Give the design plan the UI rules ask for before writing code.
3. For any new screen or major UI change, use the Mobbin MCP to pull the references listed in that screen's spec (or 2–3 real shipped screens that match its pattern), and say which ones you used. Report differences as a list. Don't change the design based on them unless I say so. Skip this for small fixes.
4. Match the team's mockups in `docs/mockup/` first. Don't redesign them.
5. When a task is done: commit, update `docs/build-status.md`, and push.

## Current phase

Phase 3 is in progress (`docs/15-roadmap-and-non-goals.md`): Capacitor readiness, the Supabase database, real email sign-in, and an import pipeline for institution, major, and official agreement-link rows. The mockup screens (Welcome through University requirements) are built on demo data. Switching screens to the database waits for new specs. Progress is in `docs/build-status.md`.

## Rules that never bend

- No academic data hard-coded in components. It comes from `/data/seed` or the database.
- Never invent articulation data. Demo data is labeled as demo data.
- Comments stay short and plain. No banner or divider comment lines.
