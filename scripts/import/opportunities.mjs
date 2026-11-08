// Validate stage for a hand-written opportunities file in data/raw/opportunities (22): research programs, scholarships,
// competitions and events, each in Stackd's own words from its official page. Strict like the others: every problem is
// listed, and any problem stops the import before the database. retrieved_at stays empty until a person has checked
// the row on its source_url, and a "todo" stops the import until it's deleted.
import fs from "node:fs";
import { SOCIAL_HOSTS } from "./config.mjs";
import { CYCLE, httpsProblem, PLACEHOLDER, SLUG } from "./deadlines.mjs";
import { academicYearProblem } from "./planning.mjs";

export const KINDS = ["research", "scholarship", "competition", "program", "event", "internship"];
export const AUDIENCES = ["community_college", "admitted_transfer", "any"];
export const COSTS = ["free", "paid", "fee"];
const SYSTEMS = ["UC", "CSU"];

const TEXT = ["slug", "kind", "title", "org_name", "summary", "audience", "cost", "url", "source_name", "source_url", "academic_year", "retrieved_at"];
const LISTS = ["who_for", "wants", "offers", "major_slugs", "systems", "terms"];
const DATES = ["deadline", "starts_on", "ends_on"];
const ALLOWED = [...TEXT, ...LISTS, ...DATES, "location", "online", "todo"];

const text = (v) => typeof v === "string" && v.trim() !== "";

// A real calendar day written like 2027-02-01
function dateProblem(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "must be a date like 2027-02-01, or null";
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value ? "isn't a real date" : null;
}

// Explore's majors are the files in data/raw/explore
export function exploreSlugs(dir = "data/raw/explore") {
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
}

// Returns { payload, problems }. payload holds opportunities in the shape apply_opportunities_batch expects.
export function validateOpportunitiesFile(file, majors = exploreSlugs()) {
  const problems = [];
  const say = (where, msg) => problems.push(`${where}: ${msg}`);

  if (!file || typeof file !== "object" || Array.isArray(file)) return { payload: null, problems: ["the file must be a JSON object"] };
  for (const key of Object.keys(file)) {
    if (!["written_by", "notes", "opportunities"].includes(key)) say(key, "isn't a section an opportunities file can have (opportunities, written_by, notes)");
  }
  if (!text(file.written_by) || PLACEHOLDER.test(file.written_by)) say("written_by", "say who wrote this file");
  if (!Array.isArray(file.opportunities)) {
    say("opportunities", "must be a list");
    return { payload: null, problems };
  }

  const payload = { opportunities: [] };
  const seen = new Set();
  file.opportunities.forEach((row, i) => {
    const where = `opportunities[${i}]${typeof row?.slug === "string" ? ` (${row.slug})` : ""}`;
    if (!row || typeof row !== "object" || Array.isArray(row)) return say(where, "must be an object");
    for (const key of Object.keys(row)) {
      if (key === "verification_status" || key === "verified_at") say(where, `${key} can't be set by an import; rows start unverified and are verified with verify.mjs after a person checks them`);
      else if (!ALLOWED.includes(key)) say(where, `${key} isn't a field an opportunity takes`);
    }
    if (row.todo !== undefined) say(where, `still has a todo ("${row.todo}"). Confirm it against the official page, then delete the todo`);

    for (const key of TEXT) {
      const value = row[key];
      if (key === "retrieved_at" && value === "") say(where, "retrieved_at is empty: check this row on its source_url, then fill in the date you checked it (like 2026-11-08)");
      else if (!text(value)) say(where, `${key} is missing`);
      else if (PLACEHOLDER.test(value)) say(where, `${key} still has a placeholder ("${value}")`);
    }
    const usable = (key) => text(row[key]) && !PLACEHOLDER.test(row[key]);

    for (const key of LISTS) {
      const list = row[key];
      if (!Array.isArray(list)) say(where, `${key} must be a list, empty if there's nothing to say`);
      else if (list.some((v) => !text(v))) say(where, `${key} must hold text only, with no empty entries`);
      else for (const v of list) if (PLACEHOLDER.test(v)) say(where, `${key} still has a placeholder ("${v}")`);
    }
    for (const key of DATES) {
      if (row[key] === null) continue;
      if (typeof row[key] !== "string") say(where, `${key} must be a date like 2027-02-01, or null`);
      else {
        const p = dateProblem(row[key]);
        if (p) say(where, `${key} ${p}`);
      }
    }
    if (row.location !== null && !text(row.location)) say(where, "location must be text, or null");
    if (typeof row.online !== "boolean") say(where, "online must be true or false");

    if (usable("slug")) {
      if (!SLUG.test(row.slug)) say(where, "slug must be lowercase letters, numbers and dashes");
      else if (seen.has(row.slug)) say(where, "appears twice in this file");
      seen.add(row.slug);
    }
    if (usable("kind") && !KINDS.includes(row.kind)) say(where, `kind must be one of ${KINDS.join(", ")}`);
    if (usable("audience") && !AUDIENCES.includes(row.audience)) say(where, `audience must be one of ${AUDIENCES.join(", ")}`);
    if (usable("cost") && !COSTS.includes(row.cost)) say(where, `cost must be one of ${COSTS.join(", ")}`);
    if (usable("academic_year")) {
      const p = academicYearProblem(row.academic_year);
      if (p) say(where, `academic_year ${p}`);
    }
    if (usable("retrieved_at")) {
      const t = Date.parse(row.retrieved_at);
      if (!/^\d{4}-\d{2}-\d{2}/.test(row.retrieved_at) || Number.isNaN(t)) say(where, "retrieved_at must be a date like 2026-11-08");
      else if (t > Date.now() + 86_400_000) say(where, "retrieved_at is in the future");
    }
    for (const key of ["url", "source_url"]) {
      if (!usable(key)) continue;
      const p = httpsProblem(row[key]);
      if (p) say(where, `${key} ${p}`);
      else {
        const host = new URL(row[key]).hostname;
        if (SOCIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) say(where, `${key} is a social media link; use the program's official page`);
      }
    }
    if (Array.isArray(row.major_slugs)) {
      for (const m of row.major_slugs) if (text(m) && !majors.includes(m)) say(where, `major_slugs: "${m}" isn't an Explore major (no data/raw/explore/${m}.json)`);
    }
    if (Array.isArray(row.systems)) for (const s of row.systems) if (!SYSTEMS.includes(s)) say(where, `systems can hold ${SYSTEMS.join(" and ")} only`);
    if (Array.isArray(row.terms)) for (const t of row.terms) if (text(t) && !CYCLE.test(t)) say(where, `terms must look like fall-2027 ("${t}")`);
    if (typeof row.starts_on === "string" && typeof row.ends_on === "string" && !dateProblem(row.starts_on) && !dateProblem(row.ends_on) && row.starts_on > row.ends_on) {
      say(where, "starts_on must be on or before ends_on");
    }

    payload.opportunities.push(Object.fromEntries(Object.entries(row).filter(([k]) => k !== "todo")));
  });

  return { payload: problems.length ? null : payload, problems };
}
