# Checking the fall 2027 dates

One line per row of `data/raw/deadlines/fall-2027.json`. Open the link, check what the line says, and tick the box. If the page says something different, fix the row; if it doesn't confirm it at all, delete the row (or the sentence). Then set that row's `retrieved_at` to the day you checked. Nothing here is verified yet, and no `retrieved_at` is filled in.

All times are Pacific. A date with no stated time is stored at 23:59:59 with `due_has_time: false`, so the app shows no time for it. If a page does state a time, set `due_has_time` to true and use that time.

**Flagged** means the row's summary says more than its `confirm_on` asks you to check. Confirm the flagged words on the page, or delete them from the summary.

## Dates

- [ ] **TAG (Transfer Admission Guarantee)**: [UC Admissions, TAG](https://admission.universityofcalifornia.edu/admission-requirements/transfer-requirements/uc-transfer-programs/transfer-admission-guarantee-tag.html). Check: the fall 2027 filing period opens September 1, 2026 and closes September 30, 2026 (no time stated, so 23:59:59 Pacific). The page may show it as closed. **Flagged:** "You file the TAG on UC's site before the UC application" (that it's filed on UC's site).
- [ ] **UC application**: [UC Admissions, Dates & deadlines](https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/dates-and-deadlines.html). Check: the filing period opens October 1, 2026 and closes November 30, 2026 at 11:59 p.m. Pacific, and that the page states that time and time zone. **Flagged:** "One application covers every UC campus you pick."
- [ ] **Cal State Apply**: [Cal State Apply, Application dates & deadlines](https://www.calstate.edu/apply/pages/application-dates-deadlines.aspx). Check: the fall 2027 priority filing period opens October 1, 2026 and closes November 30, 2026; whether the page states a time (none is stored now); and that some campuses accept later applications. **Flagged:** "One application covers every CSU campus you pick."
- [ ] **FAFSA or Dream Act**: [California Student Aid Commission](https://www.csac.ca.gov/apply) for the March 2, 2027 Cal Grant deadline (and any time stated; none is stored now), and [studentaid.gov, FAFSA deadlines](https://studentaid.gov/apply-for-aid/fafsa/fafsa-deadlines) that the 2027-28 FAFSA opens October 1, 2026. **Flagged:** "or the California Dream Act Application if you can't file the FAFSA" (who files it), and that the Dream Act Application also opens October 1, 2026, since the row's opening date covers both.
- [ ] **UC Transfer Academic Update**: [UC Admissions, Transfer academic update](https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/after-you-apply/transfer-academic-update.html). Check: January 31, 2027 for fall 2027, and whether a time is stated (none is stored now). Opening day is null: on 2026-10-17 the page gave no opening day, only "The priority deadline is January 31, 2027." Add one only if the page states it. The page calls it a priority deadline; decide whether the title or summary should say so. **Flagged:** both summary sentences, "add your fall grades and any changes to your spring classes" and "UC uses this update when it decides".
- [ ] **Accept your UC offer**: [UC Admissions, Admissions decisions](https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/after-you-apply/admissions-decisions.html). Check: June 1, 2027 as the deadline for fall transfer admits to accept (the Statement of Intent to Register), and whether a time is stated (none is stored now). **Flagged:** "through that campus's student portal".
- [ ] **Accept your CSU offer**: [Cal State Apply, Application dates & deadlines](https://www.calstate.edu/apply/pages/application-dates-deadlines.aspx), or the CSU's admitted-student page. Check: May 1, 2027 as the usual deadline to accept, and that campuses set their own dates (the row says the date varies by campus). If no official CSU page states May 1, delete the row.

## Checklists

- [ ] **UC application checklist**: [UC Admissions, Filling out the application](https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/filling-out-the-application.html). Check: the parts of the transfer application, and that [apply.universityofcalifornia.edu](https://apply.universityofcalifornia.edu/) opens the official application.
- [ ] **Cal State Apply checklist**: [Transfer Application Guide (PDF)](https://www.calstate.edu/apply/transfer/Documents/cal-state-apply-transfer-application-guide.pdf). Check: it's the 2027-2028 guide, the parts of the transfer application, and that [calstate.edu/apply](https://www.calstate.edu/apply) opens the official application.

## UC application steps

All on [Filling out the application](https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/filling-out-the-application.html), except step 6.

- [ ] **1. Pick your campuses and majors**: choosing campuses and a major at each, and that the fee is charged per campus.
- [ ] **2. Enter your courses and grades**: entering every college course and grade from your transcripts. **Flagged:** "UC uses what you enter."
- [ ] **3. Write your personal insight answers**: transfer applicants answer a set number of questions, including one required question.
- [ ] **4. Add activities and awards**: the activities and awards section. **Flagged:** the list "work, family responsibilities, clubs, volunteering" (that the page names those).
- [ ] **5. Pay the fee or ask for a waiver**: an application fee per campus, and fee waivers for students who qualify.
- [ ] **6. Submit by Nov 30**: on [Dates & deadlines](https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/dates-and-deadlines.html), November 30, 2026 at 11:59 p.m. Pacific.

## Cal State Apply steps

All in the [Transfer Application Guide (PDF)](https://www.calstate.edu/apply/transfer/Documents/cal-state-apply-transfer-application-guide.pdf), except step 6.

- [ ] **1. Pick your campuses and majors**: choosing campuses and programs.
- [ ] **2. Enter your courses and grades**: entering college coursework and grades from transcripts.
- [ ] **3. Add your work and activities**: the work and activities section, and that some campuses and programs use it.
- [ ] **4. Check for extra campus steps**: supplemental applications or materials some majors and campuses ask for.
- [ ] **5. Pay the fee or ask for a waiver**: an application fee per campus, and fee waivers for students who qualify.
- [ ] **6. Submit by Nov 30**: on [Application dates & deadlines](https://www.calstate.edu/apply/pages/application-dates-deadlines.aspx), the November 30, 2026 priority deadline, whether a time is stated, and that some campuses accept later applications.

## After every box is ticked

1. `npm run import -- data/raw/deadlines/fall-2027.json --dry-run`, then again without `--dry-run`.
2. Fill in `checked_by` and `checked_at` in the review CSV it writes, then `npm run import:verify -- <the csv>`. Only then do the dates reach students.
