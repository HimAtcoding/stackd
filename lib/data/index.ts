import { readSeed, readSeedResult, type HomeSeed, type SeedResult, type UniversitySeed } from "@/lib/seed";

// Where screens get academic and demo data. Runs in the browser, so the app needs no server.
// Today it's the bundled demo seed; the database source goes behind these same functions.

export function getHome(): HomeSeed | null {
  return readSeed<HomeSeed>("home.json");
}

// The student's target school, which Home's journey and Requirements tile follow
export function getTargetUniversity(): UniversitySeed | null {
  const result = getUniversity(getHome()?.target?.university ?? null);
  return result.status === "ok" ? result.data : null;
}

// Slugs are checked before they're used as a key.
export function getUniversity(slug: string | null): SeedResult<UniversitySeed> {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return { status: "missing" };
  return readSeedResult<UniversitySeed>(`universities/${slug}.json`);
}

// requirementId → journey step id, so marking a linked row can hand off to the celebration (step 9)
export function getJourneySteps(): Record<string, string> {
  const steps = getHome()?.journey?.steps ?? [];
  return Object.fromEntries(steps.flatMap((s) => (s.requirementId ? [[s.requirementId, s.id]] : [])));
}
