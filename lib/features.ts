import { DEMO_MODE } from "./flags";

// What the app shows (docs/specs/13-v1-launch.md). The only place that decides it: development and production use the
// same values, so `npm run dev` looks like the release. To work on something v1 hides, put NEXT_PUBLIC_FEATURES=all, or
// a list like NEXT_PUBLIC_FEATURES=explore,mentors, in .env.local; production builds ignore it.

const V1 = {
  // Essays (17, 19): the personal insight answers screen and editor, import, share and review links. On from v1.2.
  // essayFeedback: its AI feedback, which can ship or be turned off on its own; off, it isn't built yet.
  essays: true,
  essayFeedback: false,
  mentors: false,
  events: false,
  // Explore (21): what to take for your major, the major page and How we check this
  explore: false,
  notifications: false,
  // Deadlines (14, 15): Home's Up next stack, Home's Get ready, the Deadlines screen, and reminders in the iPhone app.
  // On from v1.1.
  upcoming: true,
  getReady: true,
  deadlines: true,
  reminders: true,
  trackApplication: false,
  universityTabs: false,
  savedSchools: false,
  // Requirement detail, the screen a requirement row opens (03). Rows only show for demo schools today.
  requirementDetail: false,
  // /dev/ pages exist only under `next dev` (next.config.ts → pageExtensions); scripts/check-release.mjs fails a build
  // that contains one. This flag can't put them in a build.
  devRoutes: false,
};

export type Feature = keyof typeof V1;

const wanted = process.env.NODE_ENV !== "production" ? (process.env.NEXT_PUBLIC_FEATURES ?? "").split(",").map((f) => f.trim()) : [];
const allOn = wanted.some((f) => f.toLowerCase() === "all");

export const FEATURES = Object.fromEntries(
  (Object.keys(V1) as Feature[]).map((k) => [k, V1[k] || allOn || wanted.includes(k)]),
) as Readonly<Record<Feature, boolean>>;

// Screens that aren't built yet. Every link to one comes from here (scripts/check-release.mjs fails the build
// otherwise), so a flag that's off takes its links away, and the route itself sends the student Home.
const UNBUILT = {
  mentors: { path: "/mentors/", feature: "mentors" },
  events: { path: "/events/", feature: "events" },
  notifications: { path: "/notifications/", feature: "notifications" },
  requirement: { path: "/requirement/", feature: "requirementDetail" },
  trackApplication: { path: "/track-application/", feature: "trackApplication" },
} as const satisfies Record<string, { path: string; feature: Feature }>;

export type Unbuilt = keyof typeof UNBUILT;

// The link to an unbuilt screen, or null when its flag is off (then nothing links to it). `query` starts with "?".
export function unbuiltHref(screen: Unbuilt, query = ""): string | null {
  const { path, feature } = UNBUILT[screen];
  return FEATURES[feature] ? path + query : null;
}

export const unbuiltFeature = (screen: Unbuilt): Feature => UNBUILT[screen].feature;

// The Deadlines screen, or null while its flag is off. `query` starts with "?".
export const deadlinesHref = (query = ""): string | null => (FEATURES.deadlines ? `/deadlines/${query}` : null);

// The Essays screen, or a path under it ("edit/?q=major"), or null while its flag is off. Also null in demo mode:
// the questions are read from the database, which needs a signed-in account.
export const essaysHref = (path = ""): string | null => (FEATURES.essays && !DEMO_MODE ? `/essays/${path}` : null);

// The Explore tab, or a path under it ("major/?slug=computer-science&tab=uc"), or null while its flag is off. Also null in
// demo mode: a student's course status needs a signed-in account.
export const exploreHref = (path = ""): string | null => (FEATURES.explore && !DEMO_MODE ? `/explore/${path}` : null);

// How we check this (21), or null while Explore's flag is off
export const aboutDataHref = (): string | null => (FEATURES.explore ? "/about/data/" : null);

// The University screen for a school. Without its tabs (v1) the URL has no &tab=.
export const universityHref = (slug: string) => `/university/?slug=${slug}${FEATURES.universityTabs ? "&tab=requirements" : ""}`;
