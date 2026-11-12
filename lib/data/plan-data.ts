import type { GeNeed, OrderPair } from "@/lib/plan/build";
import { getSupabase } from "@/lib/supabase/client";
import { preload, useLoaded, type Loaded } from "@/lib/use-loaded";

// The academic rows the Plan uses (24 → Data): the usual order of course types, the Cal-GETC areas, and the home
// college's own courses. Row-level security returns verified rows only. Read once per launch and shared.

export type CollegeCourse = { id: string; code: string; title: string; units: number; topics: string[] };

export type PlanData = { order: OrderPair[]; geAreas: GeNeed[] };

const PLAN_DATA_KEY = "planData";
const coursesKey = (collegeId: string) => `collegeCourses:${collegeId}`;

async function fetchPlanData(): Promise<PlanData> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase isn't configured");
  const [order, areas] = await Promise.all([
    supabase.from("topic_order").select("topic, before_topic").eq("verification_status", "verified").eq("is_demo", false),
    supabase
      .from("ge_areas")
      .select("code, name, courses, units, sort")
      .eq("pattern", "cal-getc")
      .eq("verification_status", "verified")
      .eq("is_demo", false)
      .order("sort"),
  ]);
  if (order.error) throw order.error;
  if (areas.error) throw areas.error;
  return {
    order: order.data as OrderPair[],
    geAreas: (areas.data as GeNeed[]).map((a) => ({ ...a, units: a.units === null ? null : Number(a.units) })),
  };
}

async function fetchCollegeCourses(collegeId: string): Promise<CollegeCourse[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase isn't configured");
  const { data, error } = await supabase
    .from("college_courses")
    .select("id, code, title, units, topics, academic_year")
    .eq("institution_id", collegeId)
    .eq("verification_status", "verified")
    .eq("is_demo", false);
  if (error) throw error;
  // A course listed for two years shows once, from the newest
  const newest = new Map<string, CollegeCourse & { academic_year: string }>();
  for (const c of data as (CollegeCourse & { academic_year: string })[]) {
    const had = newest.get(c.code);
    if (!had || c.academic_year > had.academic_year) newest.set(c.code, { ...c, units: Number(c.units) });
  }
  return [...newest.values()].map(({ academic_year, ...c }) => (void academic_year, c)).sort((a, b) => a.code.localeCompare(b.code, "en", { numeric: true }));
}

export const usePlanData = (): [Loaded<PlanData>, () => void] => useLoaded(PLAN_DATA_KEY, fetchPlanData);

export function useCollegeCourses(collegeId: string | null): Loaded<CollegeCourse[]> {
  const [courses] = useLoaded(collegeId ? coursesKey(collegeId) : null, () => fetchCollegeCourses(collegeId!));
  return courses;
}

// Read ahead with the other tabs' data
export function preloadPlanData(collegeId: string | null) {
  preload(PLAN_DATA_KEY, fetchPlanData);
  if (collegeId) preload(coursesKey(collegeId), () => fetchCollegeCourses(collegeId));
}
