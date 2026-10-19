// Validate stage for a hand-written deadlines file in data/raw/deadlines: dates and application checklists (14).
// Strict like the planning file: every problem is listed, and any problem stops the import before the database.
// Each row names the official page it has to be checked on (confirm_on). retrieved_at stays empty until a person has
// checked the row there, so a file nobody checked can't be imported. verified_at comes later, from the verify step.

export const PLACEHOLDER = /TODO|PASTE|TBD/;
export const SLUG = /^[a-z0-9-]+$/;
export const CYCLE = /^(fall|winter|spring|summer)-\d{4}$/;
const AUDIENCES = ["uc", "csu", "aid", "campus"];
const KINDS = ["application", "update", "aid", "decision", "enroll", "documents"];
const ZONE = "America/Los_Angeles";

const FIELDS = {
  deadlines: {
    text: ["slug", "cycle", "audience", "kind", "title", "summary", "due_at", "source_name", "source_url", "confirm_on", "retrieved_at"],
    flags: ["due_has_time", "varies_by_campus"],
    // null or absent: no filing window, or a date for a whole system
    nullable: ["opens_at", "institution"],
  },
  checklists: {
    text: ["slug", "cycle", "deadline", "name", "apply_label", "apply_url", "source_name", "source_url", "confirm_on", "retrieved_at"],
    flags: [],
    nullable: [],
  },
  checklist_steps: {
    text: ["checklist", "title", "summary", "source_name", "source_url", "confirm_on", "retrieved_at"],
    flags: [],
    nullable: [],
    numbers: ["position"],
  },
};

// Only the database's columns go in the payload; confirm_on is for the person checking, and goes in the review report
const FILE_ONLY = ["confirm_on"];

const wallFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

// The Pacific wall-clock time of an instant: "2026-11-30T23:59:00"
export function pacificWall(value) {
  const p = Object.fromEntries(wallFormat.formatToParts(new Date(value)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

// A Pacific time written with its offset, like 2026-11-30T23:59:00-08:00. The offset must be the one Pacific time
// really has that day (-07:00 in summer, -08:00 in winter), so a typo can't move a deadline by an hour.
function timeProblem(value) {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})([+-]\d{2}:\d{2})$/.exec(value);
  if (!m) return "must be a Pacific time with its offset, like 2026-11-30T23:59:00-08:00";
  if (Number.isNaN(Date.parse(value))) return "isn't a real date";
  if (pacificWall(value) !== `${m[1]}T${m[2]}`) return `has the wrong offset for Pacific time on ${m[1]} (use -07:00 in summer, -08:00 in winter)`;
  return null;
}

export function httpsProblem(value) {
  try {
    return new URL(value).protocol === "https:" ? null : "must be an https:// link";
  } catch {
    return "must be a full https:// link";
  }
}

export function parseDeadlinesFile(text) {
  return JSON.parse(text);
}

// Returns { payload, problems }. payload holds deadlines, checklists and checklist_steps in the shape the database expects.
export function validateDeadlinesFile(file) {
  const problems = [];
  const say = (where, msg) => problems.push(`${where}: ${msg}`);

  if (!file || typeof file !== "object" || Array.isArray(file)) return { payload: null, problems: ["the file must be a JSON object"] };
  for (const key of Object.keys(file)) {
    if (!["written_by", "notes", ...Object.keys(FIELDS)].includes(key)) {
      say(key, "isn't a section a deadlines file can have (deadlines, checklists, checklist_steps, written_by, notes)");
    }
  }
  if (typeof file.written_by !== "string" || !file.written_by.trim() || PLACEHOLDER.test(file.written_by)) say("written_by", "say who wrote this file");

  const payload = { deadlines: [], checklists: [], checklist_steps: [] };
  for (const [table, spec] of Object.entries(FIELDS)) {
    const rows = file[table] ?? [];
    if (!Array.isArray(rows)) {
      say(table, "must be a list");
      continue;
    }
    const allowed = [...spec.text, ...spec.flags, ...spec.nullable, ...(spec.numbers ?? [])];
    rows.forEach((row, i) => {
      const name = row?.slug ?? (row?.checklist ? `${row.checklist} step ${row.position}` : null);
      const where = `${table}[${i}]${name ? ` (${name})` : ""}`;
      if (!row || typeof row !== "object" || Array.isArray(row)) return say(where, "must be an object");
      for (const key of Object.keys(row)) {
        if (key === "verification_status" || key === "verified_at") say(where, `${key} can't be set by an import; rows start unverified and are verified with verify.mjs after a person checks them`);
        else if (!allowed.includes(key)) say(where, `${key} isn't a field this table takes`);
      }
      for (const key of spec.text) {
        const value = row[key];
        if (key === "retrieved_at" && value === "") {
          say(where, "retrieved_at is empty: check this row on the confirm_on page, then fill in the date you checked it (like 2026-10-16)");
        } else if (typeof value !== "string" || !value.trim()) say(where, `${key} is missing`);
        else if (PLACEHOLDER.test(value)) say(where, `${key} still has a placeholder ("${value}")`);
      }
      for (const key of spec.nullable) {
        const value = row[key];
        if (value === undefined || value === null) continue;
        if (typeof value !== "string" || !value.trim()) say(where, `${key} must be text or null`);
        else if (PLACEHOLDER.test(value)) say(where, `${key} still has a placeholder ("${value}")`);
      }
      for (const key of spec.flags) if (typeof row[key] !== "boolean") say(where, `${key} must be true or false`);
      for (const key of spec.numbers ?? []) if (!Number.isInteger(row[key]) || row[key] < 1) say(where, `${key} must be a whole number from 1`);

      const usable = (key) => typeof row[key] === "string" && row[key].trim() && !PLACEHOLDER.test(row[key]);
      for (const key of ["slug", "deadline", "checklist", "institution"]) {
        if (usable(key) && !SLUG.test(row[key])) say(where, `${key} must be lowercase letters, numbers and dashes`);
      }
      if (usable("cycle") && !CYCLE.test(row.cycle)) say(where, "cycle must look like fall-2027");
      for (const key of ["source_url", "apply_url"]) {
        if (usable(key)) {
          const p = httpsProblem(row[key]);
          if (p) say(where, `${key} ${p}`);
        }
      }
      if (usable("retrieved_at")) {
        const t = Date.parse(row.retrieved_at);
        if (!/^\d{4}-\d{2}-\d{2}/.test(row.retrieved_at) || Number.isNaN(t)) say(where, "retrieved_at must be a date like 2026-10-16");
        else if (t > Date.now() + 86_400_000) say(where, "retrieved_at is in the future");
      }
      if (table === "deadlines") deadlineRules(row, where, usable, say);

      const clean = Object.fromEntries(Object.entries(row).filter(([k]) => !FILE_ONLY.includes(k)));
      if (table === "deadlines") {
        clean.opens_at = row.opens_at ?? null;
        clean.institution = row.institution ?? null;
      }
      payload[table].push({ row: clean, confirmOn: row.confirm_on });
    });
  }

  // Across rows: no duplicates, and a checklist matches its deadline's cycle
  const seen = new Set();
  const dup = (where, key) => (seen.has(key) ? say(where, "appears twice in this file") : seen.add(key));
  payload.deadlines.forEach(({ row }, i) => dup(`deadlines[${i}] (${row.slug})`, `d:${row.slug}`));
  const deadlineCycle = new Map(payload.deadlines.map(({ row }) => [row.slug, row.cycle]));
  payload.checklists.forEach(({ row }, i) => {
    const where = `checklists[${i}] (${row.slug})`;
    dup(where, `c:${row.slug}`);
    dup(where, `cd:${row.deadline}`);
    if (deadlineCycle.has(row.deadline) && deadlineCycle.get(row.deadline) !== row.cycle) say(where, `cycle must match its deadline's (${deadlineCycle.get(row.deadline)})`);
  });
  payload.checklist_steps.forEach(({ row }, i) => dup(`checklist_steps[${i}] (${row.checklist} step ${row.position})`, `s:${row.checklist}/${row.position}`));

  if (problems.length) return { payload: null, problems };
  // The review report needs each row's confirm_on; the database gets the rows alone
  const confirmOn = Object.fromEntries(Object.entries(payload).map(([t, rows]) => [t, rows.map((r) => r.confirmOn)]));
  const rows = Object.fromEntries(Object.entries(payload).map(([t, list]) => [t, list.map((r) => r.row)]));
  return { payload: rows, confirmOn, problems };
}

function deadlineRules(row, where, usable, say) {
  if (usable("audience") && !AUDIENCES.includes(row.audience)) say(where, `audience must be one of ${AUDIENCES.join(", ")}`);
  if (usable("kind") && !KINDS.includes(row.kind)) say(where, `kind must be one of ${KINDS.join(", ")}`);
  if (row.audience === "campus" && !usable("institution")) say(where, "a campus-only date needs institution (the school's slug)");
  if (row.audience !== "campus" && row.institution != null) say(where, "only a campus-only date names an institution");

  const due = usable("due_at") ? timeProblem(row.due_at) : "skip";
  if (due && due !== "skip") say(where, `due_at ${due}`);
  // A date with no stated time sits at 23:59:59 Pacific, so the app knows not to show a time
  if (!due && row.due_has_time === false && !row.due_at.includes("T23:59:59")) {
    say(where, "due_at must be 23:59:59 Pacific when due_has_time is false (the source gives no time)");
  }
  if (!due && row.due_has_time === true && row.due_at.includes("T23:59:59")) {
    say(where, "due_has_time is true but due_at is 23:59:59, the time used for dates with no stated time; use the source's time, like 23:59:00");
  }
  if (usable("opens_at")) {
    const opens = timeProblem(row.opens_at);
    if (opens) say(where, `opens_at ${opens}`);
    else if (!row.opens_at.includes("T00:00:00")) say(where, "opens_at must be 00:00:00 Pacific, the start of the day the window opens");
    else if (!due && Date.parse(row.opens_at) >= Date.parse(row.due_at)) say(where, "opens_at must be before due_at");
  }
}
