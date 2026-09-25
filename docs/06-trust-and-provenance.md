# Trust, confidence, and provenance

This is the most important file in the repo. Academic decisions have real consequences: a wrong recommendation costs a student a semester and thousands of dollars.

## The absolute rules

The product must **never**:

- Fabricate an articulation relationship
- Infer official equivalency from similar course titles or descriptions
- Guarantee admission
- Guarantee credit acceptance without authoritative evidence
- Hide the academic year of the data
- Silently use an outdated agreement
- Represent itself as an official university or state service

AI may explain official information. AI may never create it.

## Verification statuses

**Verified** — an official published articulation exists.
Display: *Counts for this requirement.* With source, academic year, verification date, and a link.

**Conditional** — the relationship exists but has conditions: a required sequence, a minimum grade, two courses needed for one, department approval. Show the condition in the same breath as the result, never in a footnote.

**Not verified** — insufficient authoritative information.
Display: *We couldn't confirm an official agreement for this course. Check with your counselor or the university before enrolling on this basis.*

> **My note — a fourth status is needed.** "Not verified" currently collapses two very different situations:
>
> - **No agreement on record** — Stackd checked the current ASSIST agreement between these two institutions and this course is not in it. This is close to a real "no."
> - **Not checked** — Stackd has no data for this pair at all. This is "we don't know," and it is not the student's problem to distinguish.
>
> Ranking a course lower because of the second case actively misleads. Split the status into `verified` / `conditional` / `no_agreement` / `unchecked`, and never let `unchecked` and `no_agreement` render the same way.

## Provenance

Every academic relationship stores: source, source URL, academic year, date retrieved, date verified, verification status. Provenance is never discarded during import. It's what lets the product show a student *why* a recommendation exists.

## Staleness

> **My note:** The spec says never silently use outdated agreements, but gives no mechanism. Here's one: store the current articulation cycle as a single config value. Any record whose `academic_year` is older than the current cycle is automatically displayed as *From the 2025–26 agreement — check for changes*, regardless of what its status field says. Downgrade is automatic, not manual, so nobody has to remember to do it in August.

## Display

Verified:

```
Counts for this requirement
Official 2026–27 agreement
Last checked August 2026
View source
```

Not verified:

```
No agreement on record
We couldn't confirm this course satisfies the requirement for this university.
Check with your counselor before enrolling on this basis.
```

Never hide uncertainty. Never apologize for it either — state it and give the next step.

## Demo data

Seed and demo records must be labeled as demo data in the database and visible as such in the UI. Do not invent academic data to make a screen look finished.

## Legal posture

> **My note:** Not in the braindump and needed before the first real user:
>
> - A short terms page and an "unofficial planning tool, not affiliated with ASSIST, the UC, the CSU, or any college" line in the footer of every page.
> - No admission probability, ever — not as a percentage, not as a color, not as "likely."
> - If transcript upload ever happens, transcripts are education records. Parse client-side or don't store them.
> - Be deliberate about how ASSIST data is obtained. Hand-curated records with citations are defensible. A scraper hammering assist.org is a good way to get blocked and to make an enemy of the one institution whose goodwill you need.
