# Requirement search and multi-university coverage

## The core search

Given a requirement, return every course at every supported college that satisfies it, each with its verification status, source, and academic year.

```
Statistics (SDSU — Business Administration)

Foothill College — MATH 10, 5 units
  Online, asynchronous, 12 weeks
  Counts for: SDSU ✓  SJSU ✓  UC Davis ✓   (3 of 3 targets)
  Official 2026–27 agreement · View source
```

## Coverage

When a student has multiple targets, rank options by how many targets a single course satisfies. A course that satisfies all three preserves the most optionality; a course that satisfies one closes doors quietly.

| | SDSU | SJSU | UC Davis | Coverage |
|---|---|---|---|---|
| Course A | ✓ | ✓ | ✓ | 3 of 3 |
| Course B | ✓ | ✓ | no agreement | 2 of 3 |
| Course C | ✓ | no agreement | not checked | 1 of 3 |

> **My note — the coverage number needs a rule about missing data.** Course C above is scored 1 of 3, but one of those misses is "we haven't looked." Presenting that as a coverage score punishes the student for a gap in *your* dataset and can push them toward a worse course.
>
> Rules:
> 1. Coverage is expressed as *verified out of checked*, not out of total targets. "Counts for 2 of the 2 schools we have data for. UC Davis not yet checked."
> 2. A target with `unchecked` status is excluded from the denominator and shown separately.
> 3. Never sort a `no_agreement` result below an `unchecked` one. Known-negative is more useful to a student than unknown.

## Filters

The eventual filter set: modality (online, asynchronous, synchronous, hybrid, in person), seats (open, waitlist), no prerequisites, length (4/6/8/12/16 weeks, late start), term (winter, spring, summer, fall), time (evening, weekend), start and end date, units, specific college, UC transferable, CSU transferable.

The MVP needs three: **online / in person**, **college**, and **term**. Everything else waits for real usage data showing which filters students actually reach for.

> **My note on section data:** modality, length, and seat status all live in `sections`, and section data is the hardest data in this entire product to get and keep fresh. Every CCC runs its own SIS; there is no statewide feed. Do not promise seat counts in v1. Link out to CVC.edu, which already solves cross-enrollment discovery, and treat "we know this is offered online somewhere" as the v1 claim.
