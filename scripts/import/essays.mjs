// Validate stage for a hand-written personal insight questions file in data/raw/essays (17). Same rules as the
// deadlines file: every problem is listed, and any problem stops the import before the database. Each row names the
// page it has to be checked on (confirm_on), and retrieved_at stays empty until a person has checked it there.
import { CYCLE, httpsProblem, PLACEHOLDER, SLUG } from "./deadlines.mjs";

const TEXT = ["key", "cycle", "short_name", "summary", "source_name", "source_url", "confirm_on", "retrieved_at"];
const ALLOWED = [...TEXT, "required", "sort"];

// UC asks transfer applicants for 4 answers: the one required question plus 3 of the others
const REQUIRED_PER_CYCLE = 1;

// Returns { payload, confirmOn, problems }. payload holds piq_prompts in the shape the database expects.
export function validateEssaysFile(file) {
  const problems = [];
  const say = (where, msg) => problems.push(`${where}: ${msg}`);

  if (!file || typeof file !== "object" || Array.isArray(file)) return { payload: null, problems: ["the file must be a JSON object"] };
  for (const key of Object.keys(file)) {
    if (!["written_by", "notes", "piq_prompts"].includes(key)) say(key, "isn't a section an essays file can have (piq_prompts, written_by, notes)");
  }
  if (typeof file.written_by !== "string" || !file.written_by.trim() || PLACEHOLDER.test(file.written_by)) say("written_by", "say who wrote this file");

  const rows = file.piq_prompts ?? [];
  if (!Array.isArray(rows) || rows.length === 0) {
    say("piq_prompts", "must be a list with at least one question");
    return { payload: null, problems };
  }

  const kept = [];
  rows.forEach((row, i) => {
    const where = `piq_prompts[${i}]${row?.key ? ` (${row.key})` : ""}`;
    if (!row || typeof row !== "object" || Array.isArray(row)) return say(where, "must be an object");
    for (const key of Object.keys(row)) {
      if (key === "verification_status" || key === "verified_at") say(where, `${key} can't be set by an import; rows start unverified and are verified with verify.mjs after a person checks them`);
      else if (!ALLOWED.includes(key)) say(where, `${key} isn't a field this table takes`);
    }
    for (const key of TEXT) {
      const value = row[key];
      if (key === "retrieved_at" && value === "") say(where, "retrieved_at is empty: check this row on the confirm_on page, then fill in the date you checked it (like 2026-10-19)");
      else if (typeof value !== "string" || !value.trim()) say(where, `${key} is missing`);
      else if (PLACEHOLDER.test(value)) say(where, `${key} still has a placeholder ("${value}")`);
    }
    if (typeof row.required !== "boolean") say(where, "required must be true or false");
    if (!Number.isInteger(row.sort) || row.sort < 1) say(where, "sort must be a whole number from 1");

    const usable = (key) => typeof row[key] === "string" && row[key].trim() && !PLACEHOLDER.test(row[key]);
    if (usable("key") && !SLUG.test(row.key)) say(where, "key must be lowercase letters, numbers and dashes");
    if (usable("cycle") && !CYCLE.test(row.cycle)) say(where, "cycle must look like fall-2027");
    if (usable("source_url")) {
      const p = httpsProblem(row.source_url);
      if (p) say(where, `source_url ${p}`);
    }
    if (usable("retrieved_at")) {
      const t = Date.parse(row.retrieved_at);
      if (!/^\d{4}-\d{2}-\d{2}/.test(row.retrieved_at) || Number.isNaN(t)) say(where, "retrieved_at must be a date like 2026-10-19");
      else if (t > Date.now() + 86_400_000) say(where, "retrieved_at is in the future");
    }
    kept.push(row);
  });

  // Across rows: no key or sort twice in a cycle, and exactly one required question per cycle
  const seen = new Set();
  const required = new Map();
  kept.forEach((row, i) => {
    const where = `piq_prompts[${i}] (${row.key})`;
    for (const k of [`key:${row.cycle}/${row.key}`, `sort:${row.cycle}/${row.sort}`]) {
      if (seen.has(k)) say(where, `${k.startsWith("key") ? "key" : "sort"} appears twice in ${row.cycle}`);
      seen.add(k);
    }
    if (row.required === true) required.set(row.cycle, (required.get(row.cycle) ?? 0) + 1);
  });
  for (const cycle of new Set(kept.map((r) => r.cycle))) {
    const n = required.get(cycle) ?? 0;
    if (n !== REQUIRED_PER_CYCLE) say(`piq_prompts (${cycle})`, `must have exactly ${REQUIRED_PER_CYCLE} required question (has ${n})`);
  }

  if (problems.length) return { payload: null, problems };
  // confirm_on is for the person checking, and goes in the review report; the database gets the rows alone
  return {
    payload: { piq_prompts: kept.map((row) => Object.fromEntries(Object.entries(row).filter(([k]) => k !== "confirm_on"))) },
    confirmOn: { piq_prompts: kept.map((r) => r.confirm_on) },
    problems,
  };
}
