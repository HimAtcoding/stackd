// Marks records verified after a person has checked them against their source.
//   node scripts/import/verify.mjs data/review/<run>.csv
// Only rows with checked_by and checked_at filled in. A row that changed since the report was made is refused,
// and then nothing is verified.
import { pathToFileURL } from "node:url";
import { readReportCsv } from "./report.mjs";

export async function verifyFromCsv({ file, db }) {
  const rows = readReportCsv(file).filter((r) => r.checked_by.trim() && r.checked_at.trim() && r.verification_status !== "verified");
  const bad = rows.filter((r) => Number.isNaN(Date.parse(r.checked_at)));
  if (bad.length) return { ok: false, problems: bad.map((r) => `${r.table} ${r.id}: checked_at must be a date like 2026-10-05`) };
  if (!rows.length) return { ok: true, verified: 0 };
  try {
    const result = await db.verifyRows(rows.map((r) => ({ table: r.table, id: r.id, updated_at: r.updated_at, source_url: r.source_url, checked_at: r.checked_at })));
    return { ok: true, verified: result.verified };
  } catch (e) {
    return { ok: false, problems: [e.message] };
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: node scripts/import/verify.mjs data/review/<run>.csv");
    process.exit(2);
  }
  const { supabaseDatabase } = await import("./db.mjs");
  const outcome = await verifyFromCsv({ file, db: supabaseDatabase() });
  if (!outcome.ok) {
    console.error(`Nothing was verified.\n${outcome.problems.map((p) => `  - ${p}`).join("\n")}`);
    process.exit(1);
  }
  console.log(`${outcome.verified} record(s) marked verified`);
}
