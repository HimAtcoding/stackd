# Users

## Who they actually are

18–24. Mostly first-generation. Often part-time and working. Often on a phone, between classes or shifts. They arrive confused and anxious, and often after a counselor appointment they had to wait three weeks for. Every design decision should reduce that anxiety rather than add a new system to learn.

## Primary user — California community college student

Example:

- Current college: Las Positas College
- Current major: Business Administration
- Targets: San Diego State, San José State, UC Davis

For this student the product determines:

- Which requirements are already complete
- Which remain
- Which courses satisfy the remaining ones
- Which other California community colleges offer those courses
- Current availability, where reliable data exists
- Which options satisfy more than one target at once
- What to take next term

## Jobs to be done

Ranked by how often a student actually has the thought:

1. "Am I on track?" — status, not planning. The most common session by far.
2. "I need X and my college isn't offering it next term. Where else can I get it?"
3. "Which stats class works for all three of my schools?"
4. "What do I take next semester?"
5. "Can I still transfer by fall 2028?"

> **My note:** Job 1 is the retention loop and the spec treats it as a byproduct of the dashboard. A student who can open the app in ten seconds and see "9 of 12 done, 1 in progress, 2 left" will come back monthly for two years. A student who has to re-enter their coursework to get that will not.

## Secondary user — four-year university student

A student already at a four-year who wants to transfer to another four-year, or switch majors in the process. They enter completed coursework; the system estimates which credits have verified transfer relationships, which are uncertain, which requirements remain, and which destinations preserve the most coursework.

This is Phase 5 or later. See `15-roadmap-and-non-goals.md`. It is listed here only because the data model shouldn't make it impossible.

> **My note:** Four-year → four-year has no ASSIST. There is no authoritative, machine-readable articulation source for it, which means the confidence system would be reporting "unverified" for nearly everything. That's not a product, it's a disclaimer with a search box. Keep it out of the near-term conversation entirely.
