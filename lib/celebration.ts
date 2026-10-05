// Journey step ids already celebrated this session (flows-and-states → Celebration rule).
const KEY = "stackd.celebrated";

// True the first time a step completes this session, so the celebration opens at most once per step.
export function claimCelebration(stepId: string): boolean {
  try {
    const done: string[] = JSON.parse(window.sessionStorage.getItem(KEY) ?? "[]");
    if (done.includes(stepId)) return false;
    window.sessionStorage.setItem(KEY, JSON.stringify([...done, stepId]));
    return true;
  } catch {
    return true;
  }
}
