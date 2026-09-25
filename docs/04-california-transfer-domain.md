# The California transfer system — domain rules

> **My note:** This file is almost entirely mine. The braindump describes a platform for a domain it never actually specifies, and several of the rules below change what the MVP should contain. Every fact here needs re-verifying each August when the new cycle opens; treat this document as dated September 2026.

## ASSIST

The official statewide repository of articulation agreements for California public higher education. Organized by (community college, receiving university, academic year), then by major or by department. It is the source of truth for CCC → UC/CSU course articulation and the underlying dataset every competitor uses.

Two structural facts that the braindump's data model does not currently handle:

1. **Agreements are grouped, not flat.** A requirement is frequently "take all of A and B," or "take one of A, B, C," or "take two courses from this list." A flat `source_course → requirement` table cannot express this and will silently tell students they're done when they're not.
2. **Agreements are per academic year.** A 2024–25 agreement and a 2026–27 agreement for the same pair can differ. Storing an articulation without its year is storing a guess.

## Cal-GETC — the general education pattern

As of fall 2025, **Cal-GETC is the single lower-division general education pattern** for California community college students transferring to either UC or CSU. It replaced IGETC and CSU GE Breadth, under AB 928.

- Students who first enrolled at a CCC **before fall 2025** and stayed continuously enrolled retain rights to IGETC or CSU GE Breadth.
- Cal-GETC requires a minimum grade of C in pattern courses.
- Completing it does not guarantee admission and is not required for most majors. For majors with heavy lower-division prep, focusing on major prep can be the better play.

Sources: <https://admission.universityofcalifornia.edu/admission-requirements/transfer-requirements/preparing-to-transfer/general-education-igetc/igetc/>, ICAS Cal-GETC standards.

> **My note:** The braindump is entirely about major preparation and never mentions GE. That's half the student's problem missing. Students are as confused about GE as they are about major prep, and GE is *easier data* — one statewide pattern, one set of areas, per-college approved course lists that colleges publish themselves. Adding "Cal-GETC progress" to the dashboard is cheap and immediately makes the product feel complete.
>
> It also forces one schema decision now: a student has a **catalog year and a pattern eligibility**, not just a transfer term. Get that field in from day one.

## ADT — the CSU path

The Associate Degree for Transfer (AA-T / AS-T) is built on statewide **Transfer Model Curriculum** templates. Completing one guarantees admission to the CSU system with junior standing — **to the system, not to a specific campus or major.** Impacted campuses and majors still compete.

> **My note:** This is the single biggest shortcut available and the braindump misses it. For any CSU target, the ADT is usually the dominant path, and TMC templates are *statewide* — one template covers every community college, instead of one agreement per college pair. If the MVP's first destination is SDSU Business Administration, the AS-T in Business Administration is the spine of the answer, and building against the TMC gets you 20+ colleges of coverage for the data-entry cost of one.

## UC — no system-wide guarantee

There is no UC equivalent of the ADT. Instead:

- **TAG** (Transfer Admission Guarantee) is offered by six campuses: **Davis, Irvine, Merced, Riverside, Santa Barbara, Santa Cruz**. **Berkeley, UCLA, and San Diego do not participate.** One TAG per student per year, filed through UC TAP September 1–30 for fall entry, and it is void unless the regular UC application is also submitted with a matching major.
- Roughly two-thirds of admitted UC transfers have no TAG at all.
- Under AB 1291, a UCLA pilot gives priority consideration to students completing an ADT in certain majors, and is required to expand to four more UC campuses by 2028. Worth tracking; not yet something to build on.
- UC also expects the seven-course pattern, 60 UC-transferable units, and campus/major GPA minimums.

Source: UC TAG matrix, <https://admission.universityofcalifornia.edu/counselors/_files/documents/uc-tag-matrix.pdf>

## Cross-enrollment

CVC.edu operates the statewide online course exchange that lets a student at one CCC enroll in an online course at another. This is the mechanism that makes the whole "take it at another college" premise work. Any cross-college recommendation should link to it rather than pretending Stackd handles enrollment.

## Vocabulary mapping

Use the student's words in the UI; keep the official term available underneath.

| Official term | What the UI says |
|---|---|
| Major preparation articulation agreement | Courses you need before transferring |
| Lower-division general education pattern | General ed |
| Articulates to | Counts for |
| Not articulated | No agreement on record |
| Transfer Model Curriculum | The statewide degree template |
| Impacted major | Extra competitive |

## Standing rule

Every rule on this page has an effective year and a source URL, and both belong in the database, not in a developer's head. When the rules change — and they change annually in August — the product must be able to say which year's rules it is showing.
