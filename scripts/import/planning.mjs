// Parse and validate stages for a hand-written planning file in data/raw (institutions, majors, agreement links).
// Validation is strict: any problem stops the import before the database is touched, and every problem is reported.
import { AGREEMENT_HOSTS } from "./config.mjs";

const COURSE_MATCH_KEYS = ["courses", "requirements", "requirement_groups", "articulations", "articulation_courses", "course_matches"];

const FIELDS = {
  institutions: {
    required: ["slug", "name", "institution_type", "source_name", "source_url", "academic_year", "retrieved_at"],
    optional: ["system", "state", "city", "website"],
  },
  majors: {
    required: ["institution", "slug", "name", "source_name", "source_url", "academic_year", "retrieved_at"],
    optional: ["degree_type"],
  },
  agreement_links: {
    required: ["sending", "receiving", "major", "academic_year", "source_name", "source_url", "retrieved_at"],
    optional: [],
  },
};

const SLUG = /^[a-z0-9-]+$/;
// Capitals only, so ordinary words can't trip it; matches inside names like PASTE_ASSIST_LINK too
const PLACEHOLDER = /TODO|PASTE|TBD/;

function academicYearProblem(value) {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return "must look like 2026-27";
  if ((Number(m[1]) + 1) % 100 !== Number(m[2])) return "must be two years in a row, like 2026-27";
  return null;
}

function httpsProblem(value) {
  try {
    return new URL(value).protocol === "https:" ? null : "must be an https:// link";
  } catch {
    return "must be a full https:// link";
  }
}

export function parsePlanningFile(text) {
  return JSON.parse(text);
}

// Returns { payload, problems }. payload holds only the three planning tables, in the shape the database expects.
export function validatePlanningFile(file) {
  const problems = [];
  const say = (where, msg) => problems.push(`${where}: ${msg}`);

  if (!file || typeof file !== "object" || Array.isArray(file)) return { payload: null, problems: ["the file must be a JSON object"] };

  for (const key of Object.keys(file)) {
    if (COURSE_MATCH_KEYS.includes(key)) {
      say(key, "course matches can't be imported until ASSIST's permission is recorded in docs/16-open-questions.md");
    } else if (!["written_by", "notes", ...Object.keys(FIELDS)].includes(key)) {
      say(key, "isn't a section a planning file can have (institutions, majors, agreement_links, written_by, notes)");
    }
  }
  if (typeof file.written_by !== "string" || !file.written_by.trim() || PLACEHOLDER.test(file.written_by)) say("written_by", "say who wrote this file");

  const payload = { institutions: [], majors: [], agreement_links: [] };
  for (const [table, { required, optional }] of Object.entries(FIELDS)) {
    const rows = file[table] ?? [];
    if (!Array.isArray(rows)) {
      say(table, "must be a list");
      continue;
    }
    rows.forEach((row, i) => {
      const where = `${table}[${i}]${row?.slug ? ` (${row.slug})` : ""}`;
      if (!row || typeof row !== "object") return say(where, "must be an object");
      for (const key of Object.keys(row)) {
        if (key === "verification_status" || key === "verified_at") say(where, `${key} can't be set by an import; rows start unverified and are verified with verify.mjs`);
        else if (![...required, ...optional].includes(key)) say(where, `${key} isn't a field this table takes`);
      }
      for (const key of required) if (row[key] === undefined || row[key] === null || String(row[key]).trim() === "") say(where, `${key} is missing`);
      for (const [key, value] of Object.entries(row)) {
        if (typeof value !== "string") say(where, `${key} must be text`);
        else if (PLACEHOLDER.test(value)) say(where, `${key} still has a placeholder ("${value}")`);
      }
      if (typeof row.academic_year === "string" && !PLACEHOLDER.test(row.academic_year)) {
        const p = academicYearProblem(row.academic_year);
        if (p) say(where, `academic_year ${p}`);
      }
      if (typeof row.retrieved_at === "string" && !PLACEHOLDER.test(row.retrieved_at)) {
        const t = Date.parse(row.retrieved_at);
        if (!/^\d{4}-\d{2}-\d{2}/.test(row.retrieved_at) || Number.isNaN(t)) say(where, "retrieved_at must be a date like 2026-10-05");
        else if (t > Date.now() + 86_400_000) say(where, "retrieved_at is in the future");
      }
      if (typeof row.source_url === "string" && !PLACEHOLDER.test(row.source_url)) {
        const p = httpsProblem(row.source_url);
        if (p) say(where, `source_url ${p}`);
      }
      if (typeof row.website === "string") {
        const p = httpsProblem(row.website);
        if (p) say(where, `website ${p}`);
      }
      for (const key of ["slug", "institution", "sending", "receiving", "major"]) {
        if (typeof row[key] === "string" && !PLACEHOLDER.test(row[key]) && !SLUG.test(row[key])) say(where, `${key} must be lowercase letters, numbers and dashes`);
      }
      payload[table].push(row);
    });
  }

  // Table-specific rules
  const seen = new Set();
  const dup = (where, key) => (seen.has(key) ? say(where, "appears twice in this file") : seen.add(key));
  payload.institutions.forEach((r, i) => {
    const where = `institutions[${i}] (${r.slug})`;
    dup(where, `i:${r.slug}`);
    if (!["community_college", "university"].includes(r.institution_type)) say(where, "institution_type must be community_college or university");
    if (r.state !== undefined && r.state !== "CA") say(where, "only California schools for now (state must be CA)");
  });
  payload.majors.forEach((r, i) => dup(`majors[${i}] (${r.slug})`, `m:${r.institution}/${r.slug}`));
  const typeOf = new Map(payload.institutions.map((r) => [r.slug, r.institution_type]));
  payload.agreement_links.forEach((r, i) => {
    const where = `agreement_links[${i}] (${r.sending} → ${r.receiving}, ${r.major})`;
    dup(where, `l:${r.sending}/${r.receiving}/${r.major}/${r.academic_year}`);
    if (r.sending === r.receiving) say(where, "sending and receiving must be different schools");
    if (typeOf.get(r.sending) === "university") say(where, "sending must be a community college");
    if (typeOf.get(r.receiving) === "community_college") say(where, "receiving must be a university");
    if (r.source_name !== "ASSIST") say(where, 'source_name must be "ASSIST" (the official agreement)');
    if (typeof r.source_url === "string" && !httpsProblem(r.source_url)) {
      const host = new URL(r.source_url).hostname;
      if (!AGREEMENT_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) say(where, `source_url must be an ASSIST agreement link (${AGREEMENT_HOSTS.join(", ")})`);
    }
  });

  return { payload: problems.length ? null : payload, problems };
}
