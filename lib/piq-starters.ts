// Starter questions for each personal insight question (20 → Starter questions), in Stackd's own words, from UC's
// "things to consider" for transfer applicants. Coaching, not facts, so they live here like lib/step-content.ts and
// don't go through the import. Keyed `{prompt_key}-{n}`, in the order of UC's guidance.
// Source: https://admission.universityofcalifornia.edu/how-to-apply/applying-as-a-transfer/personal-insight-questions.html

export const PIQ_STARTERS: Record<string, string> = {
  "major-1": "When did this subject first pull you in? What were you doing?",
  "major-2": "What have you done for it outside class, like a job, club, project or internship?",
  "major-3": "Which class or professor pushed you furthest, and what came out of it?",
  "major-4": "Applying to different majors at different campuses? What ties them together?",

  "leadership-1": "When were you the one people counted on, at school, at work or at home?",
  "leadership-2": "Did you help a group get past a disagreement? What did you do?",
  "leadership-3": "What did you organize or take charge of, and how did it turn out?",
  "leadership-4": "How has leading changed the way you work with people?",

  "creativity-1": "What does being creative mean to you, in your own words?",
  "creativity-2": "What problem did you solve in a way nobody expected? Walk through the steps.",
  "creativity-3": "What do you make or build when nobody's asking you to?",
  "creativity-4": "Where does your creativity show up in your major or the career you want?",

  "talent-1": "What are you good at and proud of, award or not?",
  "talent-2": "Did it come naturally, or did you build it? What did that take?",
  "talent-3": "What has it opened up for you, in class or out of it?",
  "talent-4": "How do you fit it in around school, work and family?",

  "opportunity-1": "What program, class or chance did you go after, like honors or a career program?",
  "opportunity-2": "What stood in the way of your education, and what did you do about it?",
  "opportunity-3": "What about you got you through it?",
  "opportunity-4": "How are you different because of it?",

  "challenge-1": "What's the hardest thing you've dealt with, and why did it matter so much?",
  "challenge-2": "What steps did you take? Did anyone help, or did you handle it alone?",
  "challenge-3": "How did it affect your classes and grades?",
  "challenge-4": "If it's still going on, how are you handling it now?",

  "community-1": "Which community do you mean: a team, a club, your college, your neighborhood?",
  "community-2": "What did you want to fix or improve there, and what was your part?",
  "community-3": "Why did you care enough to do it?",
  "community-4": "Who's better off because of it, and what did you learn?",

  "beyond-1": "What's important about you that the rest of your application doesn't show?",
  "beyond-2": "Why would you do well at UC? Give a real example.",
  "beyond-3": "What do you want an admissions reader to remember about you?",
  "beyond-4": "Is there a skill, challenge or opportunity you haven't written about yet?",
};

export type Starter = { id: string; n: number; text: string };

// One question's starters in UC's order; none for a question that isn't in the map
export function startersFor(promptKey: string): Starter[] {
  const list: Starter[] = [];
  for (let n = 1; PIQ_STARTERS[`${promptKey}-${n}`]; n++) list.push({ id: `${promptKey}-${n}`, n, text: PIQ_STARTERS[`${promptKey}-${n}`] });
  return list;
}

export const starterText = (id: string | null) => (id ? (PIQ_STARTERS[id] ?? null) : null);
