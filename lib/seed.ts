import fs from "node:fs";
import path from "node:path";

// Shapes of the demo files in data/seed. Every record carries "demo": true.

export type RequirementStatus = "done" | "in_progress" | "not_started";

export type Requirement = {
  demo: true;
  id: string;
  title: string;
  status: RequirementStatus;
};

export type UniversitySeed = {
  demo: true;
  slug: string;
  name: string;
  type: string;
  city: string;
  // One of the campus pool ids (art-assets → Campus art). Without it, the image is picked by slug.
  heroImage?: string;
  requirements: Requirement[];
  reminder?: { demo: true; title: string; body: string; dueInDays: number };
};

export type JourneyStep = {
  id: string;
  label: string;
  status: RequirementStatus;
  requirementId?: string;
};

export type UpcomingItem = {
  demo: true;
  id: string;
  type: "deadline" | "event";
  title: string;
  body: string;
  dueInDays?: number;
};

export type HomeSeed = {
  demo: true;
  greeting?: { demoName?: string; subtitle?: string };
  notifications?: { unread: number };
  counts?: { drafts?: number; newMentorMessages?: number; upcomingEvents?: number };
  journey?: { demo: true; steps: JourneyStep[] };
  upcoming?: UpcomingItem[];
};

export type SeedResult<T> = { status: "ok"; data: T } | { status: "missing" } | { status: "broken" };

// Server only. Tells a file that isn't there from one that won't parse.
export function readSeedResult<T>(file: string): SeedResult<T> {
  let text: string;
  try {
    text = fs.readFileSync(path.join(process.cwd(), "data/seed", file), "utf8");
  } catch {
    return { status: "missing" };
  }
  try {
    return { status: "ok", data: JSON.parse(text) as T };
  } catch {
    return { status: "broken" };
  }
}

// Server only. A missing or broken file gives null, so screens show their empty states.
export function readSeed<T>(file: string): T | null {
  const result = readSeedResult<T>(file);
  return result.status === "ok" ? result.data : null;
}
