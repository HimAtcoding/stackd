// End-to-end test of the import pipeline on an in-memory database (PGlite). Uses made-up schools and dates only
// (Example College, Example University, "Test application"); nothing touches the real project. `npm run test:import`
import fs from "node:fs";
import path from "node:path";
import { asRole, createTestDatabase } from "../test-db.mjs";
import { CONTACT_EMAIL } from "./config.mjs";
import { validateDeadlinesFile } from "./deadlines.mjs";
import { fetchSource } from "./fetch.mjs";
import { readReportCsv } from "./report.mjs";
import { runImport } from "./run.mjs";
import { verifyFromCsv } from "./verify.mjs";

const db = await createTestDatabase({ quiet: true });
const RAW = "data/raw/.test-import";
const REVIEW = "data/review/.test-import";
fs.mkdirSync(RAW, { recursive: true });

// The pipeline's database calls, made as the service role, the way the Supabase client makes them
const testDatabase = {
  async importBatch(payload, sourceFile, dryRun) {
    const r = await asRole(db, "service_role", null, "select import_planning_batch($1::jsonb, $2, $3) as r", [JSON.stringify(payload), sourceFile, dryRun]);
    return r.rows[0].r;
  },
  async verifyRows(rows) {
    const r = await asRole(db, "service_role", null, "select verify_planning_rows($1::jsonb) as r", [JSON.stringify(rows)]);
    return r.rows[0].r;
  },
  async rowsFor() {
    const q = async (t) => (await asRole(db, "service_role", null, `select * from ${t}`)).rows;
    return { institutions: await q("institutions"), majors: await q("majors"), agreement_links: await q("agreement_links") };
  },
  async importDeadlines(payload, sourceFile, dryRun) {
    const r = await asRole(db, "service_role", null, "select import_deadlines_batch($1::jsonb, $2, $3) as r", [JSON.stringify(payload), sourceFile, dryRun]);
    return r.rows[0].r;
  },
  async deadlineRowsFor() {
    const q = async (t) => (await asRole(db, "service_role", null, `select * from ${t}`)).rows;
    return { deadlines: await q("deadlines"), checklists: await q("checklists"), checklist_steps: await q("checklist_steps") };
  },
  async logFailure(sourceFile, dryRun, error) {
    await asRole(db, "service_role", null, "insert into import_runs (source_file, dry_run, status, error) values ($1, $2, 'failed', $3)", [sourceFile, dryRun, error]);
  },
};

const prov = { source_name: "Test source", academic_year: "2026-27", retrieved_at: "2026-10-05" };
const base = () => ({
  written_by: "test",
  institutions: [
    { slug: "example-college", name: "Example College", institution_type: "community_college", system: "CCC", city: "Testville", ...prov, source_url: "https://example.org/college" },
    { slug: "example-university", name: "Example University", institution_type: "university", system: "UC", ...prov, source_url: "https://example.org/university" },
  ],
  majors: [{ institution: "example-university", slug: "test-major-bs", name: "Test major", degree_type: "BS", ...prov, source_url: "https://example.org/major" }],
  agreement_links: [
    { sending: "example-college", receiving: "example-university", major: "test-major-bs", academic_year: "2026-27", source_name: "ASSIST", source_url: "https://assist.org/transfer/results?test=1", retrieved_at: "2026-10-05" },
  ],
});
function writeFixture(name, data) {
  const file = path.join(RAW, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}
const count = async (t, where = "true") => Number((await db.query(`select count(*)::int as n from ${t} where ${where}`)).rows[0].n);

let failed = 0;
function check(name, ok, detail = "") {
  if (!ok) failed++;
  console.log(ok ? "ok   " : "FAIL ", name, ok ? "" : detail);
}

// 1. Dry run: everything checked and counted, nothing kept
let out = await runImport({ file: writeFixture("base", base()), dryRun: true, db: testDatabase, reportDir: REVIEW });
check("a dry run reports what it would insert", out.ok && out.status === "dry_run" && out.counts.institutions.inserted === 2, JSON.stringify(out));
check("a dry run keeps nothing", (await count("institutions")) === 0 && (await count("agreement_links")) === 0);
check("a dry run is logged", (await count("import_runs", "status = 'dry_run'")) === 1);

// 2. Apply: rows arrive unverified, with a review report
out = await runImport({ file: writeFixture("base", base()), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("an import applies", out.ok && out.status === "applied", JSON.stringify(out));
check("imported rows start unverified", (await count("institutions", "verification_status = 'unverified'")) === 2 && (await count("agreement_links", "verification_status = 'unverified'")) === 1);
const report = `${out.report}.csv`;
const reportRows = readReportCsv(report);
check("the review report lists every record", reportRows.length === 4, `${reportRows.length} rows`);
check("the review report carries the source link and year", reportRows.every((r) => r.source_url.startsWith("https://") && r.academic_year === "2026-27"));

// 3. Same file again: nothing changes
out = await runImport({ file: writeFixture("base", base()), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("re-importing the same file changes nothing", out.ok && out.counts.institutions.unchanged === 2 && out.counts.agreement_links.unchanged === 1, JSON.stringify(out.counts));

// 4. Verify checked rows from the CSV
const csv = fs.readFileSync(report, "utf8").split("\n");
fs.writeFileSync(report, [csv[0], ...csv.slice(1).filter(Boolean).map((l) => l.replace(/,,$/, ",tester,2026-10-05"))].join("\n") + "\n");
let v = await verifyFromCsv({ file: report, db: testDatabase });
check("checked rows become verified", v.ok && v.verified === 4, JSON.stringify(v));
check("verified rows carry verified_at", (await count("institutions", "verification_status = 'verified' and verified_at is not null")) === 2);

// 5. A file that would change a verified row stops, and nothing in it applies
const changed = base();
changed.institutions[0].name = "Example College (renamed)";
changed.majors.push({ institution: "example-university", slug: "new-major-ba", name: "New major", ...prov, source_url: "https://example.org/new" });
out = await runImport({ file: writeFixture("changes-verified", changed), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("changing a verified row stops the import", !out.ok && out.stage === "upsert" && /verified and the file would change it/.test(out.problems[0]), JSON.stringify(out));
check("nothing from that file applied", (await count("majors", "slug = 'new-major-ba'")) === 0 && (await count("institutions", "name like '%renamed%'")) === 0);
check("the failed run is logged", (await count("import_runs", "status = 'failed'")) === 1);

// 6. A row changed after its review can't be verified from the old report
const second = base();
second.agreement_links.push({ ...second.agreement_links[0], academic_year: "2025-26", source_url: "https://assist.org/transfer/results?test=2" });
out = await runImport({ file: writeFixture("second", second), dryRun: false, db: testDatabase, reportDir: REVIEW });
const oldReport = `${out.report}.csv`;
second.agreement_links[1].source_url = "https://assist.org/transfer/results?test=3";
await runImport({ file: writeFixture("second", second), dryRun: false, db: testDatabase, reportDir: REVIEW });
const old = fs.readFileSync(oldReport, "utf8").split("\n");
fs.writeFileSync(oldReport, [old[0], ...old.slice(1).filter(Boolean).map((l) => (l.includes("2025-26") ? l.replace(/,,$/, ",tester,2026-10-05") : l))].join("\n") + "\n");
v = await verifyFromCsv({ file: oldReport, db: testDatabase });
check("a row changed since its review isn't verified", !v.ok && /changed since the review report/.test(v.problems[0]), JSON.stringify(v));
check("so it stays unverified", (await count("agreement_links", "academic_year = '2025-26' and verification_status = 'unverified'")) === 1);

// 7. Validation stops bad files before the database
const before = await count("import_runs");
const bad = (name, mutate, pattern) => {
  const data = base();
  mutate(data);
  return runImport({ file: writeFixture(name, data), dryRun: false, db: testDatabase, reportDir: REVIEW }).then((o) =>
    check(`refused: ${name}`, !o.ok && o.stage === "validate" && o.problems.some((p) => pattern.test(p)), JSON.stringify(o.problems)),
  );
};
await bad("course matches", (d) => (d.articulations = [{}]), /course matches can't be imported/);
await bad("a link that isn't ASSIST", (d) => (d.agreement_links[0].source_url = "https://example.org/agreement"), /ASSIST agreement link/);
await bad("an http link", (d) => (d.institutions[0].source_url = "http://example.org"), /https/);
await bad("a placeholder", (d) => (d.agreement_links[0].source_url = "PASTE_ASSIST_LINK"), /placeholder/);
await bad("a bad academic year", (d) => (d.majors[0].academic_year = "2026-28"), /two years in a row/);
await bad("setting verified", (d) => (d.institutions[0].verification_status = "verified"), /can't be set by an import/);
await bad("an out-of-state school", (d) => (d.institutions[1].state = "NV"), /only California/);
await bad("a duplicate", (d) => d.institutions.push({ ...d.institutions[0] }), /appears twice/);
await bad("agreement text", (d) => (d.agreement_links[0].notes = "CS 1 → CSE 11"), /isn't a field/);
await bad("a missing source", (d) => delete d.majors[0].source_url, /source_url is missing/);
check("validation failures never reach the database", (await count("import_runs")) === before);

// 8. The app's roles can't run imports
try {
  await asRole(db, "authenticated", "00000000-0000-0000-0000-00000000000a", "select import_planning_batch('{}'::jsonb, 'x', false)");
  check("a signed-in student can't run an import", false);
} catch (e) {
  check("a signed-in student can't run an import", /permission denied/.test(e.message), e.message);
}

// 9. Fetching stays off
try {
  await fetchSource({ sourceId: "assist", url: "https://assist.org/" });
  check("fetching is refused", false);
} catch (e) {
  check(`fetching is refused (${CONTACT_EMAIL === "TODO" ? "contact email not set" : "no permitted source"})`, /CONTACT_EMAIL|sources\.json|permission/.test(e.message), e.message);
}

// 10. Deadlines and checklists (14), with made-up dates: the same pipeline, the same rules
const RAW_DATES = "data/raw/deadlines/.test-import";
fs.mkdirSync(RAW_DATES, { recursive: true });
const dateProv = { source_name: "Test source", source_url: "https://example.org/dates", confirm_on: "Test source, dates page", retrieved_at: "2026-10-05" };
const dates = () => ({
  written_by: "test",
  deadlines: [
    { slug: "test-application", cycle: "fall-2027", audience: "uc", kind: "application", title: "Test application", summary: "A made-up date.",
      opens_at: "2026-10-01T00:00:00-07:00", due_at: "2026-11-30T23:59:00-08:00", due_has_time: true, varies_by_campus: false, ...dateProv },
    { slug: "test-update", cycle: "fall-2027", audience: "aid", kind: "aid", title: "Test aid form", summary: "A made-up date with no time.",
      opens_at: null, due_at: "2027-03-02T23:59:59-08:00", due_has_time: false, varies_by_campus: false, ...dateProv },
  ],
  checklists: [
    { slug: "test-checklist", cycle: "fall-2027", deadline: "test-application", name: "Test application", apply_label: "Open the test application",
      apply_url: "https://example.org/apply", ...dateProv },
  ],
  checklist_steps: [
    { checklist: "test-checklist", position: 1, title: "First step", summary: "Do the first thing.", ...dateProv },
    { checklist: "test-checklist", position: 2, title: "Second step", summary: "Do the second thing.", ...dateProv },
  ],
});
function writeDates(name, data) {
  const file = path.join(RAW_DATES, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

out = await runImport({ file: writeDates("dates", dates()), dryRun: true, db: testDatabase, reportDir: REVIEW });
check("deadlines: a dry run reports what it would insert", out.ok && out.status === "dry_run" && out.counts.deadlines.inserted === 2 && out.counts.checklist_steps.inserted === 2, JSON.stringify(out));
check("deadlines: a dry run keeps nothing", (await count("deadlines")) === 0 && (await count("checklists")) === 0);
out = await runImport({ file: writeDates("dates", dates()), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("deadlines: an import applies", out.ok && out.status === "applied", JSON.stringify(out));
check("deadlines: imported rows start unverified",
  (await count("deadlines", "verification_status = 'unverified'")) === 2 && (await count("checklist_steps", "verification_status = 'unverified'")) === 2);
check("deadlines: the 11:59 p.m. Pacific instant is kept", (await count("deadlines", "due_at = '2026-12-01T07:59:00Z' and due_has_time")) === 1);
const dateReport = `${out.report}.csv`;
const dateRows = readReportCsv(dateReport);
check("deadlines: the review report lists every record", dateRows.length === 5, `${dateRows.length} rows`);
check("deadlines: each report row says where to confirm it", dateRows.every((r) => r.confirm_on === "Test source, dates page"));
check("deadlines: the report spells out the dates to check",
  dateRows.some((r) => r.record.includes("opens 2026-10-01, due 2026-11-30 23:59 Pacific")) && dateRows.some((r) => r.record.includes("due 2027-03-02 (no time stated)")),
  JSON.stringify(dateRows.map((r) => r.record)));
out = await runImport({ file: writeDates("dates", dates()), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("deadlines: re-importing the same file changes nothing", out.ok && out.counts.deadlines.unchanged === 2 && out.counts.checklist_steps.unchanged === 2, JSON.stringify(out.counts));

const dateCsv = fs.readFileSync(dateReport, "utf8").split("\n");
fs.writeFileSync(dateReport, [dateCsv[0], ...dateCsv.slice(1).filter(Boolean).map((l) => l.replace(/,,$/, ",tester,2026-10-16"))].join("\n") + "\n");
v = await verifyFromCsv({ file: dateReport, db: testDatabase });
check("deadlines: checked rows become verified", v.ok && v.verified === 5, JSON.stringify(v));
check("deadlines: the app can read them now", (await asRole(db, "anon", null, "select id from checklist_steps")).rows.length === 2);

const movedDate = dates();
movedDate.deadlines[0].due_at = "2026-12-02T23:59:00-08:00";
movedDate.checklist_steps.push({ checklist: "test-checklist", position: 3, title: "Third step", summary: "Do the third thing.", ...dateProv });
out = await runImport({ file: writeDates("moved", movedDate), dryRun: false, db: testDatabase, reportDir: REVIEW });
check("deadlines: moving a verified date stops the import", !out.ok && out.stage === "upsert" && /verified and the file would change it/.test(out.problems[0]), JSON.stringify(out));
check("deadlines: nothing from that file applied", (await count("checklist_steps")) === 2 && (await count("deadlines", "due_at = '2026-12-03T07:59:00Z'")) === 0);

// 11. Bad deadline files never reach the database
const beforeDates = await count("import_runs");
const badDates = (name, mutate, pattern) => {
  const data = dates();
  mutate(data);
  return runImport({ file: writeDates(name, data), dryRun: false, db: testDatabase, reportDir: REVIEW }).then((o) =>
    check(`refused: ${name}`, !o.ok && o.stage === "validate" && o.problems.some((p) => pattern.test(p)), JSON.stringify(o.problems)),
  );
};
await badDates("an empty retrieved_at", (d) => (d.deadlines[0].retrieved_at = ""), /retrieved_at is empty: check this row on the confirm_on page/);
await badDates("a TODO opening date", (d) => (d.deadlines[0].opens_at = "TODO: mid-December"), /opens_at still has a placeholder/);
await badDates("a summer offset in winter", (d) => (d.deadlines[0].due_at = "2026-11-30T23:59:00-07:00"), /wrong offset for Pacific time/);
await badDates("a date with no time at 11:59 p.m.", (d) => (d.deadlines[1].due_at = "2027-03-02T23:59:00-08:00"), /must be 23:59:59 Pacific when due_has_time is false/);
await badDates("a window that opens after it's due", (d) => (d.deadlines[0].opens_at = "2026-12-01T00:00:00-08:00"), /opens_at must be before due_at/);
await badDates("setting verified_at", (d) => (d.deadlines[0].verified_at = "2026-10-16"), /can't be set by an import/);
await badDates("an http source", (d) => (d.checklist_steps[0].source_url = "http://example.org"), /https/);
await badDates("a missing confirm_on", (d) => delete d.checklists[0].confirm_on, /confirm_on is missing/);
await badDates("a campus date with no school", (d) => (d.deadlines[0].audience = "campus"), /needs institution/);
await badDates("an unknown kind", (d) => (d.deadlines[0].kind = "party"), /kind must be one of/);
await badDates("a checklist in another cycle", (d) => (d.checklists[0].cycle = "fall-2028"), /cycle must match its deadline's/);
await badDates("a step twice", (d) => d.checklist_steps.push({ ...d.checklist_steps[0] }), /appears twice/);
await badDates("a flag as text", (d) => (d.deadlines[0].due_has_time = "yes"), /must be true or false/);
check("deadlines: validation failures never reach the database", (await count("import_runs")) === beforeDates);

// 12. The real fall 2027 file, checked on 2026-10-17 (docs/date-check.md)
const real = JSON.parse(fs.readFileSync("data/raw/deadlines/fall-2027.json", "utf8"));
const realCheck = validateDeadlinesFile(real);
const rowCount = real.deadlines.length + real.checklists.length + real.checklist_steps.length;
check("fall-2027.json passes as checked", realCheck.problems.length === 0, JSON.stringify(realCheck.problems));
check("fall-2027.json rows have no placeholder left", !/TODO|TBD|PASTE/.test(JSON.stringify([real.deadlines, real.checklists, real.checklist_steps])));
// UC Dates & deadlines states the Transfer Academic Update's opening day
check("the Transfer Academic Update opens December 15", real.deadlines.find((d) => d.slug === "uc-academic-update-fall-2027").opens_at === "2026-12-15T00:00:00-08:00");
check("summaries leave out the claims removed after review",
  ![...real.deadlines, ...real.checklist_steps].some((r) => /late applications|Six UC campuses|deposit/.test(r.summary)));
// No page states a time, and no CSU page states May 1
check("no date in the file shows a time", real.deadlines.every((d) => d.due_has_time === false) && !/11:59/.test(JSON.stringify(real)));
check("the unconfirmed CSU offer date is gone", !real.deadlines.some((d) => d.slug === "accept-csu-fall-2027"));
check("a null opening day reaches the database as null",
  realCheck.payload.deadlines.find((d) => d.slug === "accept-uc-fall-2027").opens_at === null);
// Emptied here only, never written: a row nobody has checked is still refused
for (const table of ["deadlines", "checklists", "checklist_steps"]) for (const row of real[table]) row.retrieved_at = "";
const emptied = validateDeadlinesFile(real);
check("fall-2027.json is refused while any row is unchecked",
  emptied.problems.filter((p) => /retrieved_at is empty/.test(p)).length === rowCount && emptied.problems.every((p) => /retrieved_at is empty/.test(p)),
  `${rowCount} rows, problems: ${JSON.stringify(emptied.problems)}`);

// 13. The app's roles can't run a deadlines import
try {
  await asRole(db, "authenticated", "00000000-0000-0000-0000-00000000000a", "select import_deadlines_batch('{}'::jsonb, 'x', false)");
  check("a signed-in student can't run a deadlines import", false);
} catch (e) {
  check("a signed-in student can't run a deadlines import", /permission denied/.test(e.message), e.message);
}

fs.rmSync(RAW, { recursive: true, force: true });
fs.rmSync(RAW_DATES, { recursive: true, force: true });
fs.rmSync(REVIEW, { recursive: true, force: true });
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
