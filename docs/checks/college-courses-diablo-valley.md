# Diablo Valley College course draft: notes

File: `data/raw/planning/college-courses-diablo-valley.json` (96 courses, 4 todos). Validator output: only the 4 todos below.

## Catalog used

- **Diablo Valley College Catalog 2026-2027**, linked from https://www.dvc.edu/academics/class-schedule-catalog as DVC's official catalog.
- Base URL: https://dvc.elumenapp.com/catalog/DVC2026-2027Catalog/
- Course pages: `https://dvc.elumenapp.com/catalog/DVC2026-2027Catalog/course/<subject><number>` (e.g. `.../course/comsc165`). Every row's `source_url` is its own course page.
- Program (ADT) pages used for list topics, all in the same catalog under `.../DVC2026-2027Catalog/program/`:
  - `a-s-in-biology-for-transfer-fall-2026`
  - `a-s-in-business-administration-for-transfer-2-0-fall-2026`
  - `a-a-in-communication-studies-for-transfer-2-0-fall-2026`
  - `a-s-in-computer-science-for-transfer-fall-2025`
  - `a-a-in-economics-for-transfer-fall-2026`
  - `a-s-in-mathematics-2-0-for-transfer-fall-2026`
  - `a-a-political-science-for-transfer-fall-2026`
  - `a-a-in-psychology-for-transfer-fall-2026`
  - `a-a-in-sociology-for-transfer-fall-2025`
- One row (SOCIO 120) comes from the **2025-2026** catalog: https://dvc.elumenapp.com/catalog/DVC2025-2026Catalog/course/socio120
- `retrieved_at` is 2026-11-22 for every row.

How the pages were read: the catalog is an eLumen single-page app. The page itself loads each catalog page's HTML from eLumen's public endpoint `https://api-prod.elumenapp.com/catalog/sites/publish/content/DVC2026-2027Catalog,course,<slug>?tenant=dvc.elumenapp.com`, so I fetched that endpoint directly with plain curl (curl's own user agent, no browser headers, no proxy). It answered 200 to everything. Worth a glance from you that reading the catalog's own data endpoint this way is fine with you.

## Blocked or missing pages

- Nothing answered 403, a CAPTCHA or a login.
- `https://catalog.dvc.edu/` doesn't resolve (DNS). It isn't what dvc.edu links to, so nothing was lost.
- `DVC2026-2027Catalog/course/socio120` comes back empty (0 bytes), and SOCIO 120 isn't on the 2026-2027 Sociology course list. See the SOCIO 120 todo.
- No other sources were used: no ASSIST, no c-id.net, no other college, no search snippets.

## Judgment calls

- **C-ID with two values printed.** BIOL 130 prints "BIOL 190; BIOSC 130 + BIOSC 131 = BIOL 135S" → `BIOL 190`. CHEM 120 prints "CHEM 120+121 = C-ID CHEM 120S and CHEM-110 approved 10/18/2014" → `CHEM 110` (science-second names it). PHYS 130 → `PHYS 205`, PHYS 230 → `PHYS 210` (each also prints the PHYS 200S sequence).
- **C-ID null though something is printed.** BIOL 131, CHEM 121, CHEM 227 print only a sequence C-ID (BIOL 135S, CHEM 120S, CHEM 160S). CHEM 226 prints CHEM 150 plus the CHEM 160S sequence; COMSC 110 prints COMP 112 and ITIS 130. No pathway requirement for those courses' topics names any of these, so `null`, matching LPC's CHEM 12A and CS 7.
- **COMM 163 units = 3** (page prints 1.5-4.0; the Communication Studies AA-T 2.0 says at most 3 units count). Todo to confirm.
- **cs1.** COMSC 165 prints COMP 122 → cs1. COMSC 110 "Introduction to Programming" prints COMP 112, so it is not cs1 (only math-list-a, from the Math AS-T).
- **biology-first = BIOL 130**, because BIOL 131 lists BIOL 130 as an advisory.
- **Calculus.** MATH 192/193 get calculus-single and calculus-year (like LPC's MATH 1/2). MATH 182 (Calculus for Management, Life Science, and Social Science I, C-ID MATH 140) gets calculus-first because it's plainly calculus for life and social sciences and DVC's Biology AS-T lists it in that slot; it gets business-math and econ-calculus from those ADTs. It does not get calculus-year (LPC left business calculus out of calculus-year too). MATH 183 left out.
- **Political Science AA-T** isn't labeled List A / List B. I read its blocks as: first block (POLS 122, POLS 123, POLS C1000) = American government; the 9-unit block (BUS 240 or STAT C1000, POLS 120, 210, 220, 240, 250) = List A; the 6-unit block "any course not used above or" (ANTHR 130, ECON C2001, ECON C2002, HIST 140, HIST 141, POLS 127, POLS 151, SOCSC 101) = List B. Core topics go only to courses whose printed C-ID is POLS 110/120/130/140: POLS C1000, 122, 123 (POLS 110), POLS 210 and 240 (both print POLS 120), POLS 220 (POLS 130), POLS 250 (POLS 140). Core courses also get list-a and list-b, as in LPC.
- **Sociology AA-T** likewise isn't labeled. SOCIO 123 (SOCI 120) gets list-a/list-b by C-ID. The block "6 units from any course not used above, or: PSYC 225, SOCIO 122, 124, 125, 135" = List A; the last block "SOCIO 131, SOCSC 120" = List B. SOCIO 121 gets social-problems only (like LPC's SOC 6).
- **List topics only from DVC's ADT pages.** PSYC 214 and STAT C1000E print MATH 110, so they get `statistics`, but not polisci-list-a (no DVC ADT lists them there). BIOL 116 Human Biology (no lab) is left out: the Psychology AA-T lists only BIOL 117.
- **From the title only:** PHILO 170 Symbolic Logic → comm-logic-computing-culture and psych-social-science; ENGL 124 "The Nature of Language: An Introduction to Linguistics" → comm-three-more; PHILO 225 "History of Western Philosophy: Descartes to Present" → psych-social-science (modern philosophy); PHILO 130 Logic and Critical Thinking (PHIL 110, same C-ID as LPC's logic courses) → psych-social-science; ANTHR 130 Cultural Anthropology → psych-social-science.
- **PHYS 231** (Optics and Modern Physics) left out: physics-year needs mechanics and E&M, which PHYS 130 and PHYS 230 cover.
- **Subject renames seen on the pages:** BIOL was BIOSC until 2026-27, POLS was POLSC and PSYC was PSYCH until 2025-26. The 2026-27 CS AS-T page still prints the old code "BIOSC130" for its biology course; I used BIOL 130 from the course page.
- **Topics with no DVC course:** `comm-intro` and `science-extra`, as in LPC. All other 56 topics have at least one course.

## Rows with a todo

1. **BUS 250 Business Communications** — topic business-intro-or-communication from the title only. The page prints no C-ID, and DVC's Business Administration AS-T 2.0 lists only BUS 109 for this requirement. Check it should count, or drop the topic (or the row).
2. **COMM 163 Forensics - Speech and Debate** — variable units (page: 1.5-4.0). Set to 3 because the Communication Studies AA-T 2.0 says a maximum of 3 units count. Confirm 3.
3. **MATH 195 Discrete Mathematics** — topic discrete from the title only. No C-ID printed, and DVC's CS AS-T uses COMSC 230 for discrete math. Check it should count.
4. **SOCIO 120 Introduction to Sociology** — copied from the 2025-2026 catalog (academic_year 2025-26). It is missing from the 2026-2027 sociology course list and its 2026-2027 page is empty, yet the 2026-2027 Sociology AA-T and Communication Studies AA-T 2.0 still list it. Check whether DVC still offers it under this code.
