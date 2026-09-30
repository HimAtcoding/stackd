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

// Server only. A missing or broken file gives null, so screens show their empty states.
export function readSeed<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/seed", file), "utf8")) as T;
  } catch {
    return null;
  }
}
