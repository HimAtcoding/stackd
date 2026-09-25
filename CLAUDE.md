# Stackd

Transfer-planning web app for California community college students. Next.js, TypeScript, React, Tailwind. Supabase later. Built mobile-first as an installable PWA.

## Read before any work

- `docs/17-phase1-agent-brief.md` for scope and the non-negotiable data rules
- `.claude/rules/ui-design.md` for all UI work
- `docs/04`, `05`, `06`, `07` as reference for anything touching academic data

## How screens get built

1. Each screen has a spec in `docs/specs/`. Build from the spec, not from guesses.
2. Start in plan mode. Give the design plan the UI rules ask for before writing code.
3. Use the Mobbin MCP to pull 2–3 real shipped screens that match the spec's pattern, and say which ones you used.
4. Match the team's mockup first. Don't redesign it.

## Current phase

Demo build of the team's 4-page mockup. Sign-up and log-in screens are UI only: no Supabase Auth yet.

## Rules that never bend

- No academic data hard-coded in components. It comes from `/data/seed` or the database.
- Never invent articulation data. Demo data is labeled as demo data.
- Comments stay short and plain. No banner or divider comment lines.
