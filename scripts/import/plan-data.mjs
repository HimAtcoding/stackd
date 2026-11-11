// Validate stage for the Plan's data files in data/raw/planning (24 → Data): topic-order.json (the usual order of course
// types, from college catalogs' prerequisites), cal-getc.json (the Cal-GETC areas) and college-courses-<college>.json
// (one college's own courses). Each file holds one of those sections. Strict like the others: every problem is listed,
// any problem stops the import before the database, an empty field is one a person still has to fill from the source,
// and a "todo" stops the import until it's deleted.
import fs from "node:fs";
import path from "node:path";
import { httpsProblem, PLACEHOLDER, SLUG } from "./deadlines.mjs";
import { C_ID } from "./explore.mjs";
import { academicYearProblem } from "./planning.mjs";

export const SECTIONS = ["topic_order", "ge_areas", "college_courses"];
const PROVENANCE = ["source_name", "source_url", "academic_year", "retrieved_at"];
const FIELDS = {
  topic_order: ["topic", "before_topic"],
  ge_areas: ["pattern", "code", "name", "courses", "units", "sort"],
  college_courses: ["institution", "code", "title", "units", "c_id", "topics"],
};
const GE_CODE = /^\d[A-Z]?$/;
// CS 1, MATH 1A, ENGL C1000
export const COURSE_CODE = /^[A-Z]{1,6} [A-Z]?\d{1,4}[A-Z]{0,2}$/;

// The files this validator takes, by name
export const isPlanDataFile = (rel) => /^data\/raw\/planning\/(.+\/)?(topic-order|cal-getc|college-courses-[a-z0-9-]+)\.json$/.test(rel);

const text = (v) => typeof v === "string" && v.trim() !== "";
// Units like 4 or 4.5: above zero, one decimal at most
const unitsProblem = (v) => (typeof v !== "number" || !Number.isFinite(v) || v <= 0 || v >= 100 || Math.round(v * 10) !== v * 10 ? "must be a number above 0 with one decimal at most, like 4 or 4.5" : null);
const wholeProblem = (v) => (!Number.isInteger(v) || v <= 0 ? "must be a whole number above 0" : null);

// Every topic in Explore's files, with its name, so order pairs and courses only name real course types
export function exploreTopics(dir = "data/raw/explore") {
  const names = new Map();
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    for (const p of data.pathways ?? []) for (const r of p.requirements ?? []) if (!names.has(r.topic)) names.set(r.topic, r.name);
  }
  return names;
}

// The first loop in the order pairs, as a list of topics, or null
function orderLoop(pairs) {
  const before = new Map();
  for (const p of pairs) before.set(p.topic, [...(before.get(p.topic) ?? []), p.before_topic]);
  const state = new Map();
  const walk = (t, trail) => {
    if (state.get(t) === "done") return null;
    if (state.get(t) === "open") return [...trail.slice(trail.indexOf(t)), t];
    state.set(t, "open");
    for (const b of before.get(t) ?? []) {
      const loop = walk(b, [...trail, t]);
      if (loop) return loop;
    }
    state.set(t, "done");
    return null;
  };
  for (const t of before.keys()) {
    const loop = walk(t, []);
    if (loop) return loop;
  }
  return null;
}

// Returns { payload, problems }. payload holds the file's one section in the shape apply_plan_data_batch expects.
export function validatePlanDataFile(file, topics = exploreTopics()) {
  const problems = [];
  const say = (where, msg) => problems.push(`${where}: ${msg}`);

  if (!file || typeof file !== "object" || Array.isArray(file)) return { payload: null, problems: ["the file must be a JSON object"] };
  for (const key of Object.keys(file)) {
    if (![...SECTIONS, "written_by", "notes"].includes(key)) say(key, `isn't a section a plan data file can have (${SECTIONS.join(", ")}, written_by, notes)`);
  }
  if (!text(file.written_by) || PLACEHOLDER.test(file.written_by)) say("written_by", "say who wrote this file");
  const sections = SECTIONS.filter((s) => s in file);
  if (sections.length !== 1) {
    say("file", `must have exactly one of ${SECTIONS.join(", ")}`);
    return { payload: null, problems };
  }
  const section = sections[0];
  if (!Array.isArray(file[section]) || file[section].length === 0) {
    say(section, "must be a list with at least one row");
    return { payload: null, problems };
  }

  const payload = { [section]: [] };
  const seen = new Set();
  const sorts = new Set();
  file[section].forEach((row, i) => {
    const where = `${section}[${i}]`;
    if (!row || typeof row !== "object" || Array.isArray(row)) return say(where, "must be an object");
    for (const key of Object.keys(row)) {
      if (key === "verification_status" || key === "verified_at") say(where, `${key} can't be set by an import; rows start unverified and are verified with verify.mjs after a person checks them`);
      else if (![...FIELDS[section], ...PROVENANCE, "todo"].includes(key)) say(where, `${key} isn't a field a ${section} row takes`);
    }
    if (row.todo !== undefined) say(where, `still has a todo ("${row.todo}"). Do it, then delete the todo`);

    // Empty means a person still has to fill it from the source
    const filled = (key) => {
      const v = row[key];
      if (v === "" || v === null || v === undefined || (Array.isArray(v) && v.length === 0)) {
        say(where, `${key} is empty: fill it in from the source`);
        return false;
      }
      if (typeof v === "string" && PLACEHOLDER.test(v)) {
        say(where, `${key} still has a placeholder ("${v}")`);
        return false;
      }
      return true;
    };
    for (const key of PROVENANCE) {
      if (!filled(key)) continue;
      if (typeof row[key] !== "string") say(where, `${key} must be text`);
      else if (key === "source_url" && httpsProblem(row[key])) say(where, `source_url ${httpsProblem(row[key])}`);
      else if (key === "academic_year" && academicYearProblem(row[key])) say(where, `academic_year ${academicYearProblem(row[key])}`);
      else if (key === "retrieved_at") {
        const t = Date.parse(row[key]);
        if (!/^\d{4}-\d{2}-\d{2}/.test(row[key]) || Number.isNaN(t)) say(where, "retrieved_at must be a date like 2026-11-10");
        else if (t > Date.now() + 86_400_000) say(where, "retrieved_at is in the future");
      }
    }
    const knownTopic = (key, t) => {
      if (typeof t !== "string" || !SLUG.test(t)) say(where, `${key} must be a topic like cs1`);
      else if (!topics.has(t)) say(where, `${key} "${t}" isn't a topic in any Explore file (data/raw/explore)`);
    };

    if (section === "topic_order") {
      const hasTopic = filled("topic");
      const hasBefore = filled("before_topic");
      if (hasTopic) knownTopic("topic", row.topic);
      if (hasBefore) knownTopic("before_topic", row.before_topic);
      const ok = hasTopic && hasBefore;
      if (ok && row.topic === row.before_topic) say(where, "a topic can't come before itself");
      const key = `${row.topic}<${row.before_topic}`;
      if (ok && seen.has(key)) say(where, "this pair appears twice in this file");
      seen.add(key);
    }

    if (section === "ge_areas") {
      if (filled("pattern") && (typeof row.pattern !== "string" || !SLUG.test(row.pattern))) say(where, "pattern must be like cal-getc");
      if (filled("code")) {
        if (typeof row.code !== "string" || !GE_CODE.test(row.code)) say(where, "code must be an area code like 1A or 2");
        else if (seen.has(`${row.pattern}/${row.code}`)) say(where, "this area appears twice in this file");
        seen.add(`${row.pattern}/${row.code}`);
      }
      if (filled("name") && typeof row.name !== "string") say(where, "name must be text");
      // 0 courses (and then 0 units) for an area met inside another area's course, like a lab
      if (filled("courses") && row.courses !== 0 && wholeProblem(row.courses)) say(where, `courses must be a whole number, 0 or more`);
      if (filled("units") && !(row.units === 0 && row.courses === 0) && unitsProblem(row.units)) {
        say(where, row.units === 0 ? "units can only be 0 when courses is 0" : `units ${unitsProblem(row.units)}`);
      }
      if (filled("sort")) {
        if (wholeProblem(row.sort)) say(where, `sort ${wholeProblem(row.sort)}`);
        else if (sorts.has(`${row.pattern}/${row.sort}`)) say(where, `sort ${row.sort} is used twice`);
        sorts.add(`${row.pattern}/${row.sort}`);
      }
    }

    if (section === "college_courses") {
      if (filled("institution") && (typeof row.institution !== "string" || !SLUG.test(row.institution))) say(where, "institution must be a school's slug, like las-positas");
      if (filled("code")) {
        if (typeof row.code !== "string" || !COURSE_CODE.test(row.code)) say(where, "code must be a course code as the catalog prints it, like CS 1, MATH 1A or ENGL C1000");
        else if (seen.has(`${row.institution}/${row.code}/${row.academic_year}`)) say(where, "this course appears twice in this file");
        seen.add(`${row.institution}/${row.code}/${row.academic_year}`);
      }
      if (filled("title") && typeof row.title !== "string") say(where, "title must be text");
      if (filled("units") && unitsProblem(row.units)) say(where, `units ${unitsProblem(row.units)}`);
      // null is a catalog that prints no C-ID number; empty text is one nobody has looked up yet
      if (row.c_id === "" || row.c_id === undefined) say(where, "c_id is empty: write the C-ID number the catalog prints, or null if it prints none");
      else if (row.c_id !== null && (typeof row.c_id !== "string" || !C_ID.test(row.c_id))) say(where, "c_id must be a C-ID number like COMP 122, or null");
      if (filled("topics")) {
        if (!Array.isArray(row.topics)) say(where, "topics must be a list");
        else {
          for (const t of row.topics) knownTopic("topics", t);
          if (new Set(row.topics).size !== row.topics.length) say(where, "topics lists a topic twice");
        }
      }
    }

    payload[section].push(Object.fromEntries(Object.entries(row).filter(([k]) => k !== "todo")));
  });

  if (section === "topic_order" && !problems.length) {
    const loop = orderLoop(payload.topic_order);
    if (loop) say("topic_order", `the order goes in a loop: ${loop.join(" needs ")}`);
  }

  return { payload: problems.length ? null : payload, problems };
}
