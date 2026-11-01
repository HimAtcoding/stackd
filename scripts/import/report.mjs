// The review report: one row per imported record, to check by hand against its source, then pass to verify.mjs.
import fs from "node:fs";
import path from "node:path";
import { pacificWall } from "./deadlines.mjs";

// cycle and confirm_on are for deadlines and essays files (cycle is an Explore pathway's effective term); a planning report leaves them blank
export const REPORT_COLUMNS = [
  "table", "id", "record", "academic_year", "cycle", "source_name", "source_url", "confirm_on", "retrieved_at", "verification_status", "updated_at",
  "checked_by", "checked_at",
];
const SHOWN_COLUMNS = REPORT_COLUMNS.filter((c) => c !== "checked_by" && c !== "checked_at");

const csvCell = (v) => (/[",\n]/.test(String(v ?? "")) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ""));
const mdCell = (v) => String(v ?? "").replace(/\|/g, "\\|");

// Only the records named in this file, as the database now holds them
export function reportRows(payload, stored) {
  const inst = new Map(stored.institutions.map((r) => [r.slug, r]));
  const byId = new Map(stored.institutions.map((r) => [r.id, r.slug]));
  const rows = [];
  for (const r of payload.institutions) {
    const s = inst.get(r.slug);
    if (s) rows.push({ table: "institutions", ...s, record: `${s.name} (${s.slug})` });
  }
  for (const r of payload.majors) {
    const s = stored.majors.find((m) => byId.get(m.institution_id) === r.institution && m.slug === r.slug);
    if (s) rows.push({ table: "majors", ...s, record: `${r.institution}: ${s.name}${s.degree_type ? ` (${s.degree_type})` : ""}` });
  }
  for (const r of payload.agreement_links) {
    const s = stored.agreement_links.find(
      (l) => byId.get(l.sending_institution_id) === r.sending && byId.get(l.receiving_institution_id) === r.receiving && l.academic_year === r.academic_year &&
        stored.majors.some((m) => m.id === l.major_id && m.slug === r.major),
    );
    if (s) rows.push({ table: "agreement_links", ...s, record: `${r.sending} → ${r.receiving}, ${r.major}` });
  }
  return finish(rows);
}

// Dates as ISO text with milliseconds, which verify.mjs compares against updated_at
const iso = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v]));
const finish = (rows) => rows.map((r) => ({ ...iso(r), checked_by: "", checked_at: "" }));

// "2026-11-30 23:59" or "2026-11-30" in Pacific time, so the reviewer compares the exact date the app will show
function pacificDay(value, withTime) {
  const [day, time] = pacificWall(value).split("T");
  return withTime ? `${day} ${time.slice(0, 5)} Pacific` : day;
}

// The deadlines file's records as the database now holds them, each with the page to check it on.
// The record column spells out the dates, which are what the reviewer checks.
export function deadlineReportRows(payload, confirmOn, stored) {
  const rows = [];
  payload.deadlines.forEach((r, i) => {
    const s = stored.deadlines.find((d) => d.slug === r.slug);
    if (!s) return;
    const opens = s.opens_at ? `opens ${pacificDay(s.opens_at, false)}, ` : "";
    const due = `due ${pacificDay(s.due_at, s.due_has_time)}${s.due_has_time ? "" : " (no time stated)"}`;
    const varies = s.varies_by_campus ? ", varies by campus" : "";
    rows.push({ table: "deadlines", ...s, record: `${s.title} [${s.audience}]: ${opens}${due}${varies}`, confirm_on: confirmOn.deadlines[i] });
  });
  const listSlug = new Map(stored.checklists.map((c) => [c.id, c.slug]));
  payload.checklists.forEach((r, i) => {
    const s = stored.checklists.find((c) => c.slug === r.slug);
    if (s) rows.push({ table: "checklists", ...s, record: `${s.name} checklist, applying at ${s.apply_url}`, confirm_on: confirmOn.checklists[i] });
  });
  payload.checklist_steps.forEach((r, i) => {
    const s = stored.checklist_steps.find((st) => listSlug.get(st.checklist_id) === r.checklist && st.position === r.position);
    if (s) rows.push({ table: "checklist_steps", ...s, cycle: stored.checklists.find((c) => c.id === s.checklist_id)?.cycle, record: `${r.checklist} step ${s.position}: ${s.title}. ${s.summary}`, confirm_on: confirmOn.checklist_steps[i] });
  });
  return finish(rows);
}

// The essays file's questions as the database now holds them. The record column has the short name and summary,
// which are what the reviewer checks against UC's page.
export function essayReportRows(payload, confirmOn, stored) {
  const rows = [];
  payload.piq_prompts.forEach((r, i) => {
    const s = stored.piq_prompts.find((q) => q.key === r.key && q.cycle === r.cycle);
    if (!s) return;
    const required = s.required ? " (required)" : "";
    rows.push({ table: "piq_prompts", ...s, record: `${s.key}${required}: ${s.short_name}. ${s.summary}`, confirm_on: confirmOn.piq_prompts[i] });
  });
  return finish(rows);
}

// The Explore file's pathways, requirements and campuses as the database now holds them. The record column has what
// the reviewer checks against the pathway page or the template: names, C-ID numbers, units and campus majors.
export function exploreReportRows(payload, stored) {
  const pathwayOf = new Map(stored.pathways.map((p) => [p.id, p]));
  const instSlug = new Map(stored.institutions.map((i) => [i.id, i.slug]));
  const label = (p) => (p.kind === "tmc" ? `TMC #${p.code}` : "UC pathway");
  const units = (n) => (n === null || n === undefined ? "" : `, ${Number(n)} units`);
  const rows = [];
  for (const r of payload.pathways) {
    const s = stored.pathways.find((p) => p.slug === r.slug && p.kind === r.kind);
    if (!s) continue;
    const tmc = s.kind === "tmc" ? ` rev. ${s.revision}: ${s.degree_name}, ${Number(s.major_units)} units in the major, ${Number(s.total_units)} in the degree` : "";
    rows.push({ table: "pathways", ...s, cycle: s.effective_term ?? "", record: `${s.slug}, ${label(s)}: ${s.name}${tmc}` });
  }
  for (const r of payload.pathway_requirements) {
    const s = stored.pathway_requirements.find((q) => pathwayOf.get(q.pathway_id)?.slug === r.pathway && pathwayOf.get(q.pathway_id)?.kind === r.kind && q.code === r.code);
    if (!s) continue;
    const p = pathwayOf.get(s.pathway_id);
    const ids = s.c_id.length ? ` [${s.c_id.join(" + ")}]` : "";
    const options = s.options.length ? ` Options: ${s.options.map((o) => `${o.label} [${o.c_id.join(" + ") || "no C-ID"}]${units(o.units)}`).join("; ")}.` : "";
    rows.push({
      table: "pathway_requirements", ...s, cycle: p.effective_term ?? "",
      record: `${p.slug}, ${label(p)} ${s.sort}. ${s.name} (topic ${s.topic}; ${s.how_many}${units(s.units)})${ids}: ${s.description}${options}`,
    });
  }
  for (const r of payload.pathway_campuses) {
    const s = stored.pathway_campuses.find((c) => pathwayOf.get(c.pathway_id)?.slug === r.pathway && pathwayOf.get(c.pathway_id)?.kind === r.kind && instSlug.get(c.institution_id) === r.institution);
    if (!s) continue;
    const p = pathwayOf.get(s.pathway_id);
    rows.push({ table: "pathway_campuses", ...s, cycle: p.effective_term ?? "", record: `${p.slug}, ${label(p)} at ${r.institution}: ${s.major_names.join("; ")}` });
  }
  return finish(rows);
}

// One table per major: each topic with its UC row and its Cal State row on one line, so every "Counts for both" pair
// is checked on purpose
export function topicSections(payload) {
  return [...new Set(payload.pathways.map((p) => p.slug))].map((slug) => {
    const reqs = payload.pathway_requirements.filter((r) => r.pathway === slug).sort((a, b) => a.sort - b.sort);
    const uc = reqs.filter((r) => r.kind === "uc_pathway");
    const tmc = reqs.filter((r) => r.kind === "tmc");
    const topics = [...new Set([...uc, ...tmc].map((r) => r.topic))];
    const cell = (r) => (r ? `${r.sort}. ${r.name}${r.c_id?.length ? ` [${r.c_id.join(" + ")}]` : ""}${r.options?.length ? ` [${r.options.length} options]` : ""}` : "");
    const both = topics.filter((t) => uc.some((r) => r.topic === t) && tmc.some((r) => r.topic === t));
    return [
      `## Counts for both: ${slug}`,
      "",
      `${both.length} of ${uc.length} UC course types also count for Cal State. A topic on both sides shows "Counts for both" in the app, so check that each pair below is really the same course.`,
      "",
      "| topic | UC pathway | Cal State (TMC) | counts for both |",
      "| --- | --- | --- | --- |",
      ...topics.map((t) => {
        const u = uc.find((r) => r.topic === t);
        const c = tmc.find((r) => r.topic === t);
        return `| ${mdCell(t)} | ${mdCell(cell(u))} | ${mdCell(cell(c))} | ${u && c ? "yes" : "no"} |`;
      }),
      "",
    ].join("\n");
  });
}

export function writeReport(rows, { name, status, counts, dir = "data/review", sections = [] }) {
  fs.mkdirSync(dir, { recursive: true });
  // Never overwrite an earlier report: milliseconds in the name, and a counter if that's still taken
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 23);
  let base = path.join(dir, `${stamp}-${name}`);
  for (let n = 2; fs.existsSync(`${base}.csv`); n++) base = path.join(dir, `${stamp}-${name}-${n}`);
  fs.writeFileSync(`${base}.csv`, [REPORT_COLUMNS.join(","), ...rows.map((r) => REPORT_COLUMNS.map((c) => csvCell(r[c])).join(","))].join("\n") + "\n");
  const md = [
    `# Import review: ${name}`,
    "",
    `Run ${new Date().toISOString()}, ${status}. Counts: ${JSON.stringify(counts)}`,
    "",
    "Open each source link and check the record against it. When a row is right, fill in `checked_by` and `checked_at` (a date) in the CSV, then run `npm run import:verify -- " + `${base.split(path.sep).join("/")}.csv` + "`.",
    "",
    `| ${SHOWN_COLUMNS.join(" | ")} |`,
    `| ${SHOWN_COLUMNS.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${SHOWN_COLUMNS.map((c) => mdCell(r[c])).join(" | ")} |`),
    "",
    ...sections,
  ].join("\n");
  fs.writeFileSync(`${base}.md`, md);
  return base;
}

export function readReportCsv(file) {
  const [header, ...lines] = parseCsv(fs.readFileSync(file, "utf8"));
  return lines.filter((l) => l.length > 1).map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""])));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const endRow = () => {
    row.push(cell);
    rows.push(row);
    row = [];
    cell = "";
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else cell += ch;
  }
  if (cell || row.length) endRow();
  return rows;
}
