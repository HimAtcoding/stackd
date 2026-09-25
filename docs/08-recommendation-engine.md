# Recommendation engine

All post-MVP. Documented so the data model doesn't foreclose it.

## Modes

- **Best overall** — balance the factors below
- **Fastest transfer** — minimize terms to completion
- **All online**
- **Asynchronous** — no scheduled meetings
- **Fewest colleges** — minimize cross-enrollment
- **Maximum coverage** — satisfy the most targets per course
- **Short term** — prefer accelerated sections
- **Schedule fit** — build around stated availability

## Scoring factors

University coverage, verified articulation, course availability, modality match, schedule match, duration preference, start date preference, prerequisite penalty, additional-college penalty.

## The one hard rule

**An unverified course is never ranked as if it were verified.** Verification outranks convenience, always. A faster path built on an unconfirmed agreement is not a faster path.

## Semester planner

Eventually the system generates a full plan:

```
Fall 2027 — Las Positas College
  Financial accounting, 4 units
  English composition, 3 units
  Microeconomics, 3 units

Winter 2028 — Foothill College
  Statistics, 4 units, online asynchronous

Spring 2028 — Las Positas College
  Managerial accounting, 4 units
  Coastline College — Calculus, 4 units, online asynchronous

Summer 2028 — De Anza College
  Macroeconomics, 3 units, online

Preparation complete: summer 2028
```

> **My note:** Ship sorting before scoring. A weighted score students can't interrogate is a black box, and this is a product whose entire value proposition is that it shows its work. "Sorted by how many of your schools it counts for" is legible; "score: 87" is not. When a real scoring model does arrive, every result needs a one-line plain reason attached: *Counts for all three schools, offered online, 8 weeks.*
>
> Also: a generated semester plan implies the courses will be *offered* in those terms. Without reliable section data that plan is fiction dressed as a schedule. This feature depends on solving section data first, not on the scoring math.
