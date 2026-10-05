// The review report: one row per imported record, to check by hand against its source, then pass to verify.mjs.
import fs from "node:fs";
import path from "node:path";

export const REPORT_COLUMNS = [
  "table", "id", "record", "academic_year", "source_name", "source_url", "retrieved_at", "verification_status", "updated_at", "checked_by", "checked_at",
];

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
  // Dates as ISO text with milliseconds, which verify.mjs compares against updated_at
  const iso = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v]));
  return rows.map((r) => ({ ...iso(r), checked_by: "", checked_at: "" }));
}

export function writeReport(rows, { name, status, counts, dir = "data/review" }) {
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
    `| ${REPORT_COLUMNS.slice(0, 9).join(" | ")} |`,
    `| ${REPORT_COLUMNS.slice(0, 9).map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${REPORT_COLUMNS.slice(0, 9).map((c) => mdCell(r[c])).join(" | ")} |`),
    "",
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
