# MVP scope

Do not attempt to build the whole product. The first version should prove one workflow extremely well.

## The slice

- Student: California community college student
- Home institution: Las Positas College
- Destination: San Diego State University
- Major: Business Administration
- Supported colleges: 5–10 CCCs (Las Positas, Foothill, De Anza, Diablo Valley, Ohlone, Coastline, plus a few)

## Functionality as specified

1. Select home college
2. Select destination university
3. Select major
4. See major/transfer requirements
5. Mark what's already completed
6. See what remains
7. Tap a requirement
8. See courses at supported colleges that satisfy it
9. Filter online / in person
10. Every result shows its source and academic year
11. Save a planned course

## Explicitly not in the MVP

Nationwide support. Four-year → four-year. AI chatbot. Transcript OCR. Native iOS or Android apps. Admission probability. Social features. Counselor accounts. Notifications. Automatic schedule generation. Payments. Premium tiers. Multiple optimization modes.

Structure the code so these become possible. Write none of them.

---

## My revised v0 — smaller than the above

> **My note:** The eleven items above are a good *second* release. As a first release they contain three things that will kill the launch: an account system, an onboarding wizard, and a course-history step that demands work before the student has seen anything of value. Students on a phone between classes abandon all three.
>
> **Ship this first (target: two focused weekends):**
>
> - One route, no auth, no onboarding. Land directly on SDSU Business Administration with the full requirement list visible.
> - Every requirement is expandable. Expanding shows the courses that satisfy it across all supported colleges, with source links.
> - Checkboxes to mark requirements done, persisted in local storage. No account, no server-side user.
> - Filter: online / in person, and by college.
> - A footer stating what's covered, what isn't, and that this is unofficial.
>
> That's it. It answers the student's real first question — *what do I still need and where can I get it* — in one screen with zero setup cost.
>
> **Add in v0.1, only once students are using v0:** accounts (so state survives a new phone), saved plans, a second major at the same university, Cal-GETC progress.
>
> **Why this ordering:** the value is in the data, not the account system. Auth is the highest-drop-off step in any tool a student tries once on a recommendation from a friend. Every hour spent on Supabase Auth in week one is an hour not spent curating the articulation records that are the actual product.

## Success criteria for the first version

A real Las Positas student can open the site, find a requirement they still need, see valid courses across several California community colleges, understand why each one counts, open the official evidence, and save it — and do all of it noticeably faster than the tabs-and-PDFs method they use now.

If that works reliably, the concept is validated enough to expand.

> **My note:** Add one more criterion, because "faster than the manual method" is easy to satisfy and hard to prove: **the student takes an action outside the app because of it** — enrolls in the course, brings the plan to a counselor appointment, or sends it to a friend. That's the difference between a tool that's pleasant and one that's load-bearing.
