# Checking the fall 2027 dates

One line per row of `data/raw/deadlines/fall-2027.json`. Open the link, check what the line says, and tick the box. If the page says something different, fix the row; if it doesn't confirm it at all, delete the row (or the sentence). Then set that row's `retrieved_at` to the day you checked.

**Checked 2026-10-17 by Ryan Saleh.** Every row left in the file has `retrieved_at` 2026-10-17. Each line below ends with what the check found and what changed.

All times are Pacific. A date with no stated time is stored at 23:59:59 with `due_has_time: false`, so the app shows no time for it. If a page does state a time, set `due_has_time` to true and use that time.

**Flagged** means the row's summary says more than its `confirm_on` asks you to check. Confirm the flagged words on the page, or delete them from the summary.

## Dates

- [x] **TAG (Transfer Admission Guarantee)**: [UC Admissions, TAG](https://admission.universityofcalifornia.edu/admission-requirements/transfer-requirements/uc-transfer-programs/transfer-admission-guarantee-tag.html). Check: the fall 2027 filing period opens September 1, 2026 and closes September 30, 2026 (no time stated, so 23:59:59 Pacific). The page may show it as closed. **Flagged:** "You file the TAG on UC's site before the UC application" (that it's filed on UC's site).
  Confirmed. The TAG page gives "Sept. 1– 30 : Submit your TAG for fall term" without a year; Dates & deadlines gives "Transfer Admission Guarantee (TAG) application filing period for fall 2027 term." Flagged words confirmed ("Use our Transfer Admission Planner to fill out your TAG application"). No change.
- [x] **UC application**: [UC Admissions, Dates & deadlines](https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/dates-and-deadlines.html). Check: the filing period opens October 1, 2026 and closes November 30, 2026 at 11:59 p.m. Pacific, and that the page states that time and time zone. **Flagged:** "One application covers every UC campus you pick."
  Dates confirmed. No UC page states a time, so the due date is now 23:59:59 with `due_has_time: false`. Flagged words confirmed on Filling out the application ("with just one application").
- [x] **Cal State Apply**: [Cal State Apply, Application dates & deadlines](https://www.calstate.edu/apply/pages/application-dates-deadlines.aspx). Check: the fall 2027 priority filing period opens October 1, 2026 and closes November 30, 2026; whether the page states a time (none is stored now); and that some campuses accept later applications. **Flagged:** "One application covers every CSU campus you pick."
  Confirmed. The page gives "August 1, 2026 - November 30, 2026" and "Application submission opens on October 1, 2026", with no time. Flagged words confirmed in the Transfer Application Guide. No change.
- [x] **FAFSA or Dream Act**: [California Student Aid Commission](https://www.csac.ca.gov/apply) for the March 2, 2027 Cal Grant deadline (and any time stated; none is stored now), and [studentaid.gov, FAFSA deadlines](https://studentaid.gov/apply-for-aid/fafsa/fafsa-deadlines) that the 2027-28 FAFSA opens October 1, 2026. **Flagged:** "or the California Dream Act Application if you can't file the FAFSA" (who files it), and that the Dream Act Application also opens October 1, 2026, since the row's opening date covers both.
  Confirmed on UC Dates & deadlines (FAFSA and Dream Act open October 1, open through March 2, 2027) and CSAC (March 2, 2027, no time). studentaid.gov couldn't be read (it only loads in a browser), so it isn't used. The source is now UC Dates & deadlines; CSAC is named in `confirm_on`, since a row has one source. The who-files sentence was rewritten from CSAC's page to cover mixed-status families and that Pell Grants and Work-Study need the FAFSA.
- [x] **UC Transfer Academic Update**: [UC Admissions, Transfer academic update](https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/after-you-apply/transfer-academic-update.html). Check: January 31, 2027 for fall 2027, and whether a time is stated (none is stored now). Opening day is null: on 2026-10-17 the page gave no opening day, only "The priority deadline is January 31, 2027." Add one only if the page states it. The page calls it a priority deadline; decide whether the title or summary should say so. **Flagged:** both summary sentences, "add your fall grades and any changes to your spring classes" and "UC uses this update when it decides".
  Confirmed, no time. Dates & deadlines states the opening day ("December 15 Online transfer application update (TAU) opens"), so the row now opens December 15, 2026 and its source is Dates & deadlines; the TAU page is named in `confirm_on`. The summary now ends "January 31 is UC's priority deadline." Both flagged sentences confirmed.
- [x] **Accept your UC offer**: [UC Admissions, Admissions decisions](https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/after-you-apply/admissions-decisions.html). Check: June 1, 2027 as the deadline for fall transfer admits to accept (the Statement of Intent to Register), and whether a time is stated (none is stored now). **Flagged:** "through that campus's student portal".
  Date confirmed ("Transfer students admitted for fall must submit the SIR by June 1"), no time. The portal words aren't on the page; the summary is now "Accept your offer by submitting the Statement of Intent to Register (SIR) to the UC campus you pick."
- [x] **Accept your CSU offer**: [Cal State Apply, Application dates & deadlines](https://www.calstate.edu/apply/pages/application-dates-deadlines.aspx), or the CSU's admitted-student page. Check: May 1, 2027 as the usual deadline to accept, and that campuses set their own dates (the row says the date varies by campus). If no official CSU page states May 1, delete the row.
  **Row deleted.** No CSU page states May 1. [Transfer: Next Steps](https://www.calstate.edu/apply/transfer/pages/next-steps.aspx) only sends students to each campus's admitted-student site "to learn more about important deadlines".

## Checklists

- [x] **UC application checklist**: [UC Admissions, Filling out the application](https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/filling-out-the-application.html). Check: the parts of the transfer application, and that [apply.universityofcalifornia.edu](https://apply.universityofcalifornia.edu/) opens the official application.
  Confirmed. No change.
- [x] **Cal State Apply checklist**: [Transfer Application Guide (PDF)](https://www.calstate.edu/apply/transfer/Documents/cal-state-apply-transfer-application-guide.pdf). Check: it's the 2027-2028 guide, the parts of the transfer application, and that [calstate.edu/apply](https://www.calstate.edu/apply) opens the official application.
  Confirmed ("Transfer Application Guide 2027-2028", last revised 8/1/26). No change.

## UC application steps

All on [Filling out the application](https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/filling-out-the-application.html), except step 6.

- [x] **1. Pick your campuses and majors**: choosing campuses and a major at each, and that the fee is charged per campus.
  Confirmed. No change.
- [x] **2. Enter your courses and grades**: entering every college course and grade from your transcripts. **Flagged:** "UC uses what you enter."
  Confirmed; the flagged sentence isn't on the page and was deleted.
- [x] **3. Write your personal insight answers**: transfer applicants answer a set number of questions, including one required question.
  Confirmed ("You'll need to answer four questions: One question is required, and three are your choice"). The summary now says so.
- [x] **4. Add activities and awards**: the activities and awards section. **Flagged:** the list "work, family responsibilities, clubs, volunteering" (that the page names those).
  Section confirmed. The page doesn't name family responsibilities or clubs, so the list now follows its categories: work, volunteering, extracurricular activities, educational programs and awards.
- [x] **5. Pay the fee or ask for a waiver**: an application fee per campus, and fee waivers for students who qualify.
  Confirmed. No change.
- [x] **6. Submit by Nov 30**: on [Dates & deadlines](https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/dates-and-deadlines.html), November 30, 2026 at 11:59 p.m. Pacific.
  Date confirmed; no time on the page. The summary is now "Submit by November 30, 2026."

## Cal State Apply steps

All in the [Transfer Application Guide (PDF)](https://www.calstate.edu/apply/transfer/Documents/cal-state-apply-transfer-application-guide.pdf), except step 6. Numbers are as checked; after step 3 was deleted, steps 4 to 6 became 3 to 5.

- [x] **1. Pick your campuses and majors**: choosing campuses and programs.
  Confirmed. No change.
- [x] **2. Enter your courses and grades**: entering college coursework and grades from transcripts.
  Confirmed. No change.
- [x] **3. Add your work and activities**: the work and activities section, and that some campuses and programs use it.
  **Step deleted.** The guide has no work or activities section; it covers only the Academic History and Program Materials sections.
- [x] **4. Check for extra campus steps**: supplemental applications or materials some majors and campuses ask for.
  Confirmed. Now step 3.
- [x] **5. Pay the fee or ask for a waiver**: an application fee per campus, and fee waivers for students who qualify.
  Confirmed ("each campus you apply to requires a $70 fee"). Now step 4.
- [x] **6. Submit by Nov 30**: on [Application dates & deadlines](https://www.calstate.edu/apply/pages/application-dates-deadlines.aspx), the November 30, 2026 priority deadline, whether a time is stated, and that some campuses accept later applications.
  Confirmed, no time. November 30 is inside the period, so "Submit before" is now "Submit by". Now step 5.

## After every box is ticked

1. `npm run import -- data/raw/deadlines/fall-2027.json --dry-run`, then again without `--dry-run`.
2. Fill in `checked_by` and `checked_at` in the review CSV it writes, then `npm run import:verify -- <the csv>`. Only then do the dates reach students.
