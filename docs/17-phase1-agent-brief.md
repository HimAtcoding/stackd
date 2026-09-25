# Phase 1 brief for a coding agent

Paste this, not the full vision doc. Everything below is scoped to the first shippable version.

---

You are the senior full-stack engineer helping two student founders build **Stackd**, a transfer-planning tool for California community college students. Build only what's described here. Do not build toward the long-term vision.

## What v0 does

A student lands on a page for one (university, major) pair and sees every requirement they need before transferring. Expanding a requirement shows which courses at supported California community colleges satisfy it, with the official source and academic year for each. The student can check off what they've done. No account.

## Scope

- One destination: San Diego State University, Business Administration
- 5–10 supported community colleges
- No auth, no server-side user records. Completion state in local storage.
- Filters: online / in person, and by college
- Mobile-first. Most sessions are on a phone.

## Stack

Next.js, TypeScript, React, Tailwind, PostgreSQL via Supabase, hosted on Vercel. Python for data import scripts.

## Non-negotiable rules

1. **No academic relationship is hard-coded in application or UI code.** Every requirement, course, and articulation comes from a database record. Deleting the seed data must produce empty states, not a hardcoded fallback.
2. **Never invent articulation data.** Do not infer equivalency from similar course titles. If a relationship isn't in the seed data, the correct output is "no agreement on record" or "not checked" — never a guess.
3. **Every academic record carries provenance**: source, source URL, academic year, date retrieved, date verified, status.
4. **Four verification statuses**, rendered differently: `verified`, `conditional`, `no_agreement`, `unchecked`. `no_agreement` and `unchecked` must never look the same to a student.
5. **Requirements are grouped.** Support `all_of`, `one_of`, and `n_of` groups. A requirement is not satisfied until its group logic is satisfied.
6. **Seed data is labeled as demo data** in the database and visible as such in the UI until it's been verified against the official agreement.

## Data layout

Curated academic data lives in `/data/seed` as reviewable CSV or JSON in version control, imported by a script in `/scripts`. Not typed directly into Supabase.

Schema: see `05-data-model.md`.

## UI rules

- Sentence case everywhere, including buttons.
- Buttons name what happens: "Save plan," not "Submit." Same name for an action all the way through the flow.
- Student vocabulary: "Courses you still need," not "Unfulfilled requirements."
- Empty states propose a next action. Error states say what broke and how to fix it, without apologizing.
- Motion only in response to a user action. Respect `prefers-reduced-motion`.
- 44px touch targets, visible keyboard focus, real contrast ratios, works one-handed.

## Before implementing any feature, state

What is being built, why, what database changes it needs, which files change, and how it will be tested. Wait for confirmation on anything touching the schema or the verification logic.

## Definition of done for v0

A student on a phone can, without creating an account, see what they still need for SDSU Business Administration, expand a requirement, see courses at several colleges that satisfy it, filter to online, open the official source, and check off what they've completed — and that state survives a page reload.
