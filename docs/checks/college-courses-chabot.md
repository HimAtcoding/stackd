# Chabot College courses: notes for checking

File: `data/raw/planning/college-courses-chabot.json` (90 courses, 6 todos). Retrieved 2026-11-22.

## Catalog used

- **Chabot College Catalog 2025-2026** (PDF, published July 2025), academic_year `2025-26`.
- Base URL: https://www.chabotcollege.edu/academics/docs/catalogs/2025-2026%20catalog.pdf
  (the link on https://www.chabotcollege.edu/courses/archives.php is `2025-2026 Catalog.pdf`, which redirects to this lowercase name).
- Each row's `source_url` is that PDF plus `#page=N`, where N is the PDF page holding the course description. The PDF page is the printed page number plus 2 (for example, CSCI 14 is on printed page 202, PDF page 204).
- I also read the 2025-2026 Catalog Revision Notice (same folder). It only covers two programs approved after publication (Elementary Teacher Education AA-T, Public Health AS-T) and changes nothing here.
- A script checked every row: the course number, the exact title and the units appear together in a course description on the cited page. All 90 matched, except COMM 48, which prints 1-4 units (see todos).

## Blocked or missing

- **Chabot's 2026-27 online catalog**, https://chabot.curriqunet.com/catalog/alias/catalog2026-27 (linked from https://www.chabotcollege.edu/courses/index.php as "Online Catalog 2026-2027"), answered **403 Forbidden** ("Request forbidden by administrative rules") to a plain request. I didn't retry it or work around it. So I used the 2025-26 catalog, and nothing was compared with 2026-27. A person should check every row against the 2026-27 catalog in a browser.
- No 2026-2027 PDF catalog is listed on the archives page.
- **No C-IDs:** the 2025-2026 catalog doesn't print a C-ID on any course description. "C-ID" appears only in a few prerequisite notes and fire technology program text. So `c_id` is `null` on every row. Nothing was looked up elsewhere. The 2026-27 CurriQunet catalog may print C-IDs; a person can add them from there.

## Program pages used for list topics (PDF page numbers)

- Biology AS-T: 171-172
- Business Administration 2.0 AS-T: 175
- Communication Studies 2.0 AA-T: 200-201
- Economics AA-T: 226-227
- Mathematics AS-T: 304
- Political Science AA-T: 351-352
- Psychology AA-T: 368
- Sociology AA-T: 377-378
- Computer Science: Chabot has only an AS (PDF 203-204), no AS-T.

## Judgment calls

1. **`source_url` points to the course description page**, as in the LPC file, even when a topic came from a program page. The program pages are listed above.
2. **Later list topics:** a course in an ADT list also gets the later list topics that say "any course not already used". These are psych List A → B → C, comm List A → B, sociology List A → B, econ List A → B, polisci core → List A → List B, and math List A → List B.
3. **Mathematics AS-T doesn't line up with the topics.** Chabot's List A is *one* of MTH 4 or MTH 6. Its List B is one course from CSCI 14, 15, 19A, 20, MTH 8, STAT C1000 / PSY 5 / BUS 19, PHYS 4A / 7A, or the unused List A course.
   - I gave `math-list-a` to all of Chabot's List B courses, including MTH 4 and MTH 6 through the "any course from List A not used" line. List B is the closest list, and LPC gave STAT C1000 `math-list-a` the same way.
   - `diff-eq-and-linear-algebra` (which asks for both courses) goes to MTH 4 and MTH 6 because of their titles.
   - Worth a look by Ryan.
4. **biology-first = BIOS 21A.** It is the only course in BIOS 21A/21B/21C with no biology or chemistry prerequisite. BIOS 21B's prerequisite is BIOS 21A or CHEM 1A, and BIOS 21C's is CHEM 1A plus 21A or 21B. All three get `biology-sequence`, since the Biology AS-T core is these three.
5. **science-second:**
   - BIOS 21C (Cell and Molecular Biology) and CHEM 1A get it by title.
   - PHYS 4B gets it because the catalog calls it "the second course in the calculus-based sequence".
   - BIOS 21A and 21B aren't titled organismal biology, so they don't get it.
   - PHYS 7B has it with a todo (see below).
6. **physics-year** goes on the courses covering mechanics or electricity and magnetism: PHYS 4A, 4B, 7A, 7C, as LPC did. PHYS 3A and 3B ("College Physics", calculus for life sciences) are left out. The topic is the science and engineering sequence, and they're in no list for these majors. PHYS 4C, 5 and 7D are left out too (no plain topic).
7. **physics-mechanics** goes on PHYS 4A and PHYS 7A. Both are "first course" calculus mechanics, and the catalog says a student can't get credit for both.
8. **cs1** goes on CSCI 15 and CSCI 19A. The catalog says both are "designed to satisfy ACM guidelines for CS I". CSCI 14 also has it, with a todo. **cs2** = CSCI 20 (Introduction to Data Structures) and **comp-org** = CSCI 21, both by title. **discrete** = MTH 8 and CSCI 28, both titled Discrete Mathematics.
9. **calculus-first** goes on MTH 1 and MTH 15. The Biology AS-T lists "MTH 1 or MTH 15" in the calculus slot, and MTH 15's page says it's for business and life sciences majors. calculus-year and calculus-single go on MTH 1 and MTH 2 only, the same as LPC (LPC didn't give business calculus calculus-year).
10. **psych-research-methods = PSY 2** (Introduction to Psychological Methodology). It is in the Psychology AA-T core, next to intro psychology and statistics, and its description is a survey of psychological research methods.
11. **statistics** goes on STAT C1000, PSY 5 and BUS 19. All three are in the stats slot of the Psychology, Sociology, Economics and Business AS-T pages. MTH 43S has it with a todo.
12. **PHIL 55 Symbolic Logic** gets `comm-logic-computing-culture`, because the topic names symbolic logic, and `psych-social-science` (logic). LPC left `comm-logic-computing-culture` empty because it had no course titled symbolic logic. I didn't give that topic to a CS course, since "intro to computer science" isn't plain for any Chabot title.
13. **psych-social-science** goes on ANTH 3 (social and cultural anthropology), ANTH 4 (Language and Culture, whose description is linguistic anthropology), PHIL 55 and SOCI 1. Chabot has no modern philosophy course.
14. **comm-three-more** goes on COMM C1000, PSYC C1000 and SOCI 1. Chabot's catalog has no linguistics course. ANTH 4 is linguistic anthropology, so I didn't count it as linguistics, matching LPC.
15. **COMM 50 (Introduction to Communication Studies)** is in Chabot's Comm AA-T List A, so it gets comm-list-a-1/2/3 and comm-list-b. LPC's similar course was in List B only.
16. **comm-intro and science-extra** are left with no Chabot course, as LPC did. COMM 50 could be read as the UC "intro to communication" survey, but the catalog doesn't make that plain.
17. **COMM 70A** (2 units) is in the Comm AA-T List B, so it gets comm-list-b at its printed 2 units.
18. **business-intro-or-communication** goes on BUS 12 (from the Business AS-T) and BUS 14 Business Communications (by title).
19. **Polisci List A/B include statistics and economics.** Chabot's Political Science AA-T List A includes PSY 5, STAT C1000 and BUS 19. Its List B includes POSC 12, ECN 1, ECN 2 and ES 1. Those courses get those topics.
20. **Cross-listed pairs:** both rows are kept only where Chabot's list names both codes.
    - SOCI 7 and ES 7 are both in Sociology List B.
    - PSY 8 is in Psychology List C and SOCI 8 is in Sociology List B, so each gets only its own list.
    - HLTH 8 isn't named in either list, so it's left out.
21. **Left out:** courses with no topic a Chabot page plainly supports. These include ANTH 1, ANTH 1L, CSCI 7, CSCI 41, ECN 10, MTH 33S, MTH 25, PHYS 3A/3B/4C/5/7D, HIS courses, PSY 5W and PSY 25L. I wrote every course code in the subject-and-number form the import takes. No course was left out because of its code shape.

## Rows with a todo

1. **COMM 48 Activities in Forensics**, units. The course page prints "1-4 units (May be repeated 3 times)" and the Comm AA-T List A prints 1-4. Only the Public Speaking and Forensics certificate prints 4. `3` is a placeholder. Set the units the AA-T counts it at, or leave the row out.
2. **CSCI 14 Introduction to Structured Programming In C++**, `cs1`. It's Chabot's first C++ course and suits students with no programming experience. But the catalog says CSCI 15 and CSCI 19A are the courses "designed to satisfy ACM guidelines for CS I", and no C-ID is printed. Check which course Chabot counts as CS 1 (COMP 122). Its math-list-a and econ-list topics come from the Math AS-T and Econ AA-T lists and don't depend on this.
3. **ECN 1 Principles of Microeconomics**, Common Course Numbering. Las Positas (same district) replaced ECON 1 with ECON C2001 from Fall 2026. Check Chabot's 2026-27 catalog for a new code, title or units. I didn't write any new code.
4. **ECN 2 Principles of Macroeconomics**: same check (LPC's ECON 2 became ECON C2002).
5. **MTH 43S Introduction to Probability and Statistics with Support**, `statistics`. The title is plainly intro statistics, and the page calls it MTH 43 with extra lab hours (STAT C1000 is "Formerly MTH 43"). No Chabot ADT page lists MTH 43S in a stats slot, though. Keep it or drop it.
6. **PHYS 7B Physics for Scientists and Engineers: Fluid mechanics, Wave phenomena, Thermodynamics, Optics**, `science-second`. Chabot calls 7B "the recommended second course" of the 7A-7D sequence. But PHYS 7C (Electromagnetism) "can be taken directly after Physics 7A", and it's the course that pairs with PHYS 4B (PHYS 4B: "May not receive credit if PHYS 7C has been completed"). No C-ID is printed. Check which course is the second calculus-physics course, move the topic to PHYS 7C if needed, and drop PHYS 7B if it's left with no topic.

## Validator output

Run from the plan-b worktree with `validatePlanDataFile`: 6 problems, all of them the todos above ("still has a todo"). No other problems.
