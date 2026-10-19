import { stepSlug } from "./deadlines";

// What each checklist step needs (18 → What you'll need), in our own words, keyed by the checklist's system and the
// step's slug next to the icons in step-icons.ts. Each item was checked against the page in its comment on
// Oct 19, 2026. A step not in the map shows no list.

// UC1 https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/filling-out-the-application.html
// UC2 https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/personal-insight-questions.html
// UC3 https://admission.universityofcalifornia.edu/apply-now.html
// CSU https://www.calstate.edu/apply/transfer/Documents/cal-state-apply-transfer-application-guide.pdf
//     (Transfer Application Guide 2027-2028, revised 8/1/26; page numbers are the guide's)

const UC: Record<string, string[]> = {
  "pick-your-campuses-and-majors": [
    // UC1
    "The UC campuses you're applying to.",
    // UC1
    "A major for each one.",
  ],
  "enter-your-courses-and-grades": [
    // UC1
    "Your transcripts from every college you've attended, including any in high school.",
    // UC1
    "Your courses in progress and the ones you plan to take before you start at UC.",
  ],
  "write-your-personal-insight-answers": [
    // UC2
    "Your four answers, up to 350 words each.",
    // UC2
    "Which 3 of the other 7 questions you're answering.",
  ],
  "add-activities-and-awards": [
    // UC1
    "Your work, volunteering, clubs and prep programs.",
    // UC1
    "Any awards or honors.",
  ],
  "pay-the-fee-or-ask-for-a-waiver": [
    // UC1
    "A credit card for the fee.",
    // UC3
    "For a fee waiver: your family's income and household size. The application tells you if you qualify.",
  ],
  "submit-by": [
    // UC1
    "One last look at everything. Very few changes can be made after you submit.",
  ],
};

const CSU: Record<string, string[]> = {
  "pick-your-campuses-and-majors": [
    // CSU p. 15
    "The CSU campuses you're applying to.",
    // CSU p. 15
    "One major for each campus.",
    // CSU p. 15
    "A backup major, if a campus asks for one.",
    // CSU p. 13
    "Your AA-T or AS-T, if you're earning one.",
  ],
  "enter-your-courses-and-grades": [
    // CSU p. 8
    "Your transcripts from every college you've attended.",
    // CSU p. 30
    "Every course, including repeats and ones that won't transfer.",
    // CSU p. 8
    "Your college student ID, if you're earning an AA-T or AS-T.",
  ],
  "check-for-extra-campus-steps": [
    // CSU p. 46
    "Any extra questions or documents your program asks for.",
    // CSU p. 47
    "Your major's prerequisite courses, if the campus asks.",
    // CSU p. 47
    "Whether you want campus housing.",
  ],
  "pay-the-fee-or-ask-for-a-waiver": [
    // CSU p. 8
    "A credit card or PayPal for the fee.",
    // CSU p. 8
    "For a fee waiver: your parents' yearly income, or yours if you're independent.",
    // CSU p. 51
    "A coupon code, if your college gave you one.",
  ],
  "submit-by": [
    // CSU p. 49
    "One last look at everything. You can change very little after you submit.",
    // CSU p. 50
    "Your confirmation email, saved.",
  ],
};

const BY_SYSTEM: Record<string, Record<string, string[]>> = { uc: UC, csu: CSU };

// The submit step is matched by its start, since the date in its title changes with the cycle
const key = (title: string) => {
  const slug = stepSlug(title);
  return slug.startsWith("submit-by") ? "submit-by" : slug;
};

// "uc" or "csu" (the checklist's deadline audience) and the step's title
export function stepNeeds(system: string, title: string): string[] {
  return BY_SYSTEM[system]?.[key(title)] ?? [];
}
