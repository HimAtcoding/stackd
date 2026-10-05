// Runs supabase/migrations against an in-memory Postgres (PGlite) with stand-ins for Supabase's roles and auth schema,
// then checks the row-level security and verified-record rules. Touches no real database: `node scripts/test-migrations.mjs`
import { asRole, createTestDatabase } from "./test-db.mjs";

const db = await createTestDatabase();

let failed = 0;
const as = (role, sub, sql, params) => asRole(db, role, sub, sql, params);
async function expectOk(name, fn) {
  try {
    const r = await fn();
    console.log("ok   ", name, r?.rows ? `(${r.rows.length} rows)` : "");
    return r;
  } catch (e) {
    failed++;
    console.log("FAIL ", name, "-", e.message);
  }
}
async function expectError(name, fn, match) {
  try {
    await fn();
    failed++;
    console.log("FAIL ", name, "- no error");
  } catch (e) {
    if (match && !match.test(e.message)) {
      failed++;
      console.log("FAIL ", name, "- wrong error:", e.message);
    } else console.log("ok   ", name, "-", e.message.split("\n")[0]);
  }
}
async function expectRows(name, fn, n) {
  const r = await expectOk(name, fn);
  if (r && r.rows.length !== n) {
    failed++;
    console.log("FAIL ", name, `- expected ${n} rows, got ${r.rows.length}`);
  }
}

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const prov = `'Test source', 'https://example.org/test', '2026-27', now()`;
const college = `insert into institutions (slug, name, institution_type, source_name, source_url, academic_year, retrieved_at)
  values ('example-college', 'Example College', 'community_college', ${prov}) returning id`;

// Academic tables: readable by everyone, writable only by the service role
await expectError("anon cannot insert an institution", () => as("anon", null, college), /permission denied/);
await expectError("a signed-in student cannot insert an institution", () => as("authenticated", A, college), /permission denied/);
const inst = await expectOk("service role inserts an institution", () => as("service_role", null, college));
const instId = inst?.rows[0].id;
await expectRows("anon can read institutions", () => as("anon", null, "select * from institutions"), 1);
await expectError("a student cannot update an institution", () => as("authenticated", A, "update institutions set name = 'x'"), /permission denied/);
await expectRows("anon can read app_config", () => as("anon", null, "select * from app_config where key = 'current_cycle'"), 1);
await expectError("anon cannot read import_runs", () => as("anon", null, "select * from import_runs"), /permission denied/);

// Provenance rules
await expectError("academic_year must look like 2026-27", () =>
  as("service_role", null, `insert into institutions (slug, name, institution_type, source_name, source_url, academic_year, retrieved_at)
    values ('bad-year', 'X', 'university', 'S', 'https://x', '2026', now())`), /check/);
await expectError("verified needs verified_at", () =>
  as("service_role", null, `update institutions set verification_status = 'verified' where id = $1`, [instId]), /check/);
const uni = await as("service_role", null, `insert into institutions (slug, name, institution_type, source_name, source_url, academic_year, retrieved_at)
  values ('example-university', 'Example University', 'university', ${prov}) returning id`);
const major = await as("service_role", null, `insert into majors (institution_id, slug, name, source_name, source_url, academic_year, retrieved_at)
  values ($1, 'test-major', 'Test major', ${prov}) returning id`, [uni.rows[0].id]);
const link = (url) => as("service_role", null, `insert into agreement_links (sending_institution_id, receiving_institution_id, major_id, source_name, source_url, academic_year, retrieved_at)
  values ($1, $2, $3, 'Test source', $4, '2026-27', now())`, [instId, uni.rows[0].id, major.rows[0].id, url]);
await expectError("agreement links must be https", () => link("http://example.org/agreement"), /source_url_check/);
await expectOk("an https agreement link is accepted", () => link("https://example.org/agreement"));
await expectError("one link per college, school, major and year", () => link("https://example.org/other"), /duplicate key/);
await expectRows("anon can read agreement links", () => as("anon", null, "select * from agreement_links"), 1);

// A verified row can't be changed or deleted, except through the verify step
await expectOk("service role verifies the institution", () =>
  as("service_role", null, `update institutions set verification_status = 'verified', verified_at = now() where id = $1`, [instId]));
await expectError("a verified row can't be changed by an import", () =>
  as("service_role", null, `update institutions set name = 'Changed' where id = $1`, [instId]), /refusing to update verified/);
await expectError("a verified row can't be deleted", () =>
  as("service_role", null, `delete from institutions where id = $1`, [instId]), /refusing to delete verified/);
await expectOk("the verify step can change it", async () => {
  await db.exec("begin; select set_config('stackd.allow_verified_change', 'on', true);");
  const r = await db.query(`update institutions set name = 'Example College' where id = $1 returning id`, [instId]);
  await db.exec("commit;");
  return r;
});

// New accounts get a profile with their first name
await db.query(`insert into auth.users (id, raw_user_meta_data) values ($1, '{"first_name":" Maya "}'), ($2, '{}')`, [A, B]);
const profile = await expectOk("a profile is created at sign-up", () => db.query("select first_name from profiles where user_id = $1", [A]));
if (profile?.rows[0]?.first_name !== "Maya") {
  failed++;
  console.log("FAIL  first name is trimmed and stored - got", profile?.rows[0]?.first_name);
} else console.log("ok    first name is trimmed and stored");

// Per-student tables: owner only
await expectRows("a student reads their own profile", () => as("authenticated", A, "select * from profiles"), 1);
await expectRows("a student can't see another student's profile", () => as("authenticated", A, "select * from profiles where user_id = $1", [B]), 0);
await expectError("anon can't read profiles", () => as("anon", null, "select * from profiles"), /permission denied/);
await expectOk("a student saves a school", () => as("authenticated", A, "insert into saved_schools (user_id, institution_id) values ($1, $2)", [A, instId]));
await expectError("a student can't save a school for someone else", () =>
  as("authenticated", A, "insert into saved_schools (user_id, institution_id) values ($1, $2)", [B, instId]), /row-level security/);
await expectRows("another student sees none of it", () => as("authenticated", B, "select * from saved_schools"), 0);
const changed = await expectOk("a student can't change another student's profile", () =>
  as("authenticated", B, "update profiles set first_name = 'x' where user_id = $1 returning user_id", [A]));
if (changed && changed.rows.length !== 0) {
  failed++;
  console.log("FAIL  the update reached another student's row");
}

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
