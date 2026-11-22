// Course codes students typed in the Plan's course sheet (24 → 3, Your course), for a person to check against each
// college's catalog before anything goes into college_courses.
//   npm run suggestions
//   npm run suggestions -- --college las-positas --since 2026-11-01 --csv data/review/suggestions.csv
// Prints counts only: never a student's id, name or email.
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { exploreTopics } from "./plan-data.mjs";

// "cs1" → "CS 1", "math  1a" → "MATH 1A", so the same course typed two ways is counted once
export function tidyCode(code) {
  const t = code.trim().replace(/\s+/g, " ").toUpperCase();
  return t.replace(/^([A-Z]+) ?(?=[A-Z]?\d)/, "$1 ");
}

// What college_courses already says about a code at that college, for that requirement
function catalogStatus(matches, topic) {
  if (!matches.length) return "not in college_courses";
  const verified = matches.filter((c) => c.verification_status === "verified");
  if (!verified.length) return "imported, not verified yet";
  if (topic && !verified.some((c) => c.topics.includes(topic))) return "verified, set to other requirements";
  return topic ? "verified for this requirement" : "verified";
}

// One line per college, code and requirement: how many students typed it, the units they gave, when, and what
// college_courses already has. Rows: { institution: { slug, name }, topic, ge_area, course_code, units, user_id, created_at }.
// Courses: { institution_slug, code, topics, verification_status }.
export function summarizeSuggestions(rows, courses, names = new Map()) {
  const groups = new Map();
  for (const r of rows) {
    if (!r.institution) continue;
    const code = tidyCode(r.course_code);
    const key = `${r.institution.slug}|${code}|${r.topic ?? `ge:${r.ge_area}`}`;
    const g = groups.get(key) ?? { slug: r.institution.slug, college: r.institution.name, code, topic: r.topic, geArea: r.ge_area, students: new Set(), times: 0, units: new Set(), first: r.created_at, last: r.created_at };
    g.students.add(r.user_id);
    g.times++;
    if (r.units !== null && r.units !== undefined) g.units.add(Number(r.units));
    if (r.created_at < g.first) g.first = r.created_at;
    if (r.created_at > g.last) g.last = r.created_at;
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({
      slug: g.slug,
      college: g.college,
      code: g.code,
      requirement: g.topic ? (names.has(g.topic) ? `${names.get(g.topic)} (${g.topic})` : g.topic) : `Cal-GETC Area ${g.geArea}`,
      students: g.students.size,
      times: g.times,
      units: [...g.units].sort((a, b) => a - b),
      first: g.first.slice(0, 10),
      last: g.last.slice(0, 10),
      catalog: catalogStatus(courses.filter((c) => c.institution_slug === g.slug && tidyCode(c.code) === g.code), g.topic),
    }))
    .sort((a, b) => a.college.localeCompare(b.college) || b.students - a.students || a.code.localeCompare(b.code, "en", { numeric: true }));
}

const unitsText = (units) => (units.length ? `${units.join(" or ")} ${units.length === 1 && units[0] === 1 ? "unit" : "units"}` : "no units given");

export function formatSuggestions(lines) {
  if (!lines.length) return "No typed courses yet.";
  const out = [];
  let college = null;
  for (const l of lines) {
    if (l.college !== college) {
      college = l.college;
      out.push(`${out.length ? "\n" : ""}${l.college} (${l.slug})`);
    }
    const who = `${l.students} ${l.students === 1 ? "student" : "students"}`;
    out.push(`  ${l.code} for ${l.requirement}: ${who}, ${unitsText(l.units)}, ${l.first === l.last ? l.first : `${l.first} to ${l.last}`}. ${l.catalog}`);
  }
  return out.join("\n");
}

const CSV_COLUMNS = ["college", "slug", "code", "requirement", "students", "times", "units", "first", "last", "catalog"];
const cell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
export const suggestionsCsv = (lines) =>
  [CSV_COLUMNS.join(","), ...lines.map((l) => CSV_COLUMNS.map((c) => cell(c === "units" ? l.units.join(" ") : l[c])).join(","))].join("\n") + "\n";

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const arg = (name) => {
    const at = process.argv.indexOf(`--${name}`);
    return at > 0 ? process.argv[at + 1] : undefined;
  };
  const college = arg("college");
  const since = arg("since");
  const csv = arg("csv");
  if (since && Number.isNaN(Date.parse(since))) {
    console.error("--since takes a date like 2026-11-01");
    process.exit(2);
  }
  const { supabaseDatabase } = await import("./db.mjs");
  const db = supabaseDatabase();
  const rows = await db.courseSuggestions({ college, since });
  const courses = await db.collegeCoursesAt([...new Set(rows.map((r) => r.institution?.slug).filter(Boolean))]);
  const lines = summarizeSuggestions(rows, courses, exploreTopics());
  console.log(formatSuggestions(lines));
  if (csv) {
    fs.writeFileSync(csv, suggestionsCsv(lines));
    console.log(`\nWrote ${csv}`);
  }
}
