import { useMemo } from "react";
import { useNow, useTerm } from "@/lib/data/deadlines";
import { useMajors } from "@/lib/data/explore";
import { usePlan } from "@/lib/data/plan";
import { majorNamer, pacificToday, type Student } from "@/lib/opportunities";

// What Stackd knows about the student for matching (22 → 5): their major, their schools and their transfer term
export function useStudent(): Student {
  const planState = usePlan();
  const { term } = useTerm();
  const plan = planState.status === "ok" ? planState.plan : null;
  return useMemo(() => {
    const target = plan?.targets.find((t) => t.exploreSlug);
    return {
      majorSlug: target?.exploreSlug ?? null,
      majorName: target?.majorName ?? null,
      schools: plan?.targets.map((t) => ({ name: t.name, system: t.system })) ?? [],
      term,
    };
  }, [plan, term]);
}

// Major names by slug, from Explore, for "Computer Science or Mathematics majors"
export function useMajorNamer() {
  const state = useMajors();
  return useMemo(() => majorNamer(state.status === "ok" ? Object.fromEntries(state.majors.map((m) => [m.slug, m.name])) : {}), [state]);
}

// Today in Pacific time, or null while prerendering
export function useToday() {
  const now = useNow();
  return now ? pacificToday(now) : null;
}
