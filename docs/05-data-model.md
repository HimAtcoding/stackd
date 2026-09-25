# Data model

## Orientation: requirement-first

The system thinks in terms of **requirement → valid courses**, not only **course → equivalent course**. This is the central design decision.

Why it matters: a university requires Introductory Microeconomics. Las Positas satisfies it with ECON 1. Another college satisfies it with ECON 100. A third with ECON 1A. These three courses are not necessarily equivalent to each other, and it doesn't matter. The only question is whether each one satisfies the *receiving university's* requirement.

That makes the core query:

```
University → Major → Requirement → all courses at all supported colleges that satisfy it
```

A course-to-course model can't answer that. A requirement-first model can.

## Conceptual chain

```
Current institution
  → Completed coursework
    → Target institution
      → Target major
        → Requirements
          → Courses that satisfy them
            → Available sections
              → User preferences
                → Recommended path
```

## Tables

**institutions** — id, name, institution_type, system, state, city, website
Universities are represented here too rather than in a separate table.

**courses** — id, institution_id, subject, course_number, title, description, units, uc_transferable, csu_transferable

**majors** — id, institution_id, name, degree_type

**requirements** — id, major_id, name, description, category, academic_year

**requirement_groups** — id, requirement_id, logic_type (`all_of` | `one_of` | `n_of`), min_count, notes

**articulations** — id, source_course_id, requirement_group_id, destination_institution_id, academic_year, status, conditions, source_url, verified_at

**sections** — id, course_id, term, section_number, start_date, end_date, modality, asynchronous, meeting_days, meeting_time, instructor, seat_status

**users** — id, home_institution_id, transfer_term, catalog_year, ge_pattern_eligibility

**user_targets** — id, user_id, destination_institution_id, major_id

**user_courses** — id, user_id, course_id, status (`completed` | `in_progress` | `planned`), grade, term

**saved_plans** — id, user_id, name, created_at

**planned_courses** — id, saved_plan_id, course_id, term

> **My note — three changes from the braindump:**
>
> 1. **`requirement_groups` is new and not optional.** ASSIST agreements are full of "A and B together satisfy X" and "one of A, B, C." Attaching articulations directly to a flat requirement will produce wrong completion states — and a wrong "you're done" is the worst possible failure for this product. Add the layer now; retrofitting it later means rewriting every seed record.
> 2. **`catalog_year` and `ge_pattern_eligibility` on users.** Cal-GETC eligibility depends on when the student first enrolled. Without this the product can't tell a 2024-start student from a 2026-start student, and it will show the wrong GE pattern to one of them.
> 3. **`academic_year` on requirements as well as articulations.** Requirements change year to year independently of the course mappings under them.
>
> One thing to consider adding later, not now: `ge_areas` and `ge_course_approvals`, to carry Cal-GETC. Same shape as requirements/articulations, so it slots in cleanly.

## Rule

No academic relationship is ever hard-coded in application or UI code. Everything originates from database records, and every academic record carries provenance. See `06-trust-and-provenance.md`.
