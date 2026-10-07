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

// The plan: save_plan writes the caller's home college and targets, all or nothing
function check(name, pass, got) {
  if (pass) console.log("ok   ", name);
  else {
    failed++;
    console.log("FAIL ", name, "- got", JSON.stringify(got));
  }
}
const uniId = uni.rows[0].id;
const majorId = major.rows[0].id;
const uni2 = await as("service_role", null, `insert into institutions (slug, name, institution_type, source_name, source_url, academic_year, retrieved_at)
  values ('second-university', 'Second University', 'university', ${prov}) returning id`);
const uni2Id = uni2.rows[0].id;
const major2 = await as("service_role", null, `insert into majors (institution_id, slug, name, source_name, source_url, academic_year, retrieved_at)
  values ($1, 'other-major', 'Other major', ${prov}) returning id`, [uni2Id]);
const major2Id = major2.rows[0].id;
const savePlan = (role, sub, home, updateHome, targets) =>
  as(role, sub, "select save_plan($1, $2, $3::jsonb)", [home, updateHome, targets === null ? null : JSON.stringify(targets)]);
const targetsOf = async (sub) => (await db.query("select institution_id, major_id, major_not_listed, position from user_targets where user_id = $1 order by position", [sub])).rows;
const homeOf = async (sub) => (await db.query("select home_institution_id from profiles where user_id = $1", [sub])).rows[0]?.home_institution_id;

await expectError("anon can't call save_plan", () => savePlan("anon", null, instId, true, []), /permission denied/);
await expectError("save_plan needs a signed-in student", () => savePlan("authenticated", null, instId, true, []), /not signed in/);
await expectOk("a student saves a plan", () => savePlan("authenticated", A, instId, true, [{ institution_id: uniId, major_id: majorId }]));
check("the home college is saved", (await homeOf(A)) === instId, await homeOf(A));
let targets = await targetsOf(A);
check("the target is saved with its major", targets.length === 1 && targets[0].institution_id === uniId && targets[0].major_id === majorId, targets);
check("another student's plan is untouched", (await targetsOf(B)).length === 0 && (await homeOf(B)) === null, await targetsOf(B));

await expectOk("targets are replaced, in the order given", () =>
  savePlan("authenticated", A, null, false, [{ institution_id: uni2Id, major_id: null }, { institution_id: uniId, major_id: majorId }]));
targets = await targetsOf(A);
check("schools keep the order they were chosen in",
  targets.length === 2 && targets[0].institution_id === uni2Id && targets[0].position === 1 && targets[1].institution_id === uniId && targets[1].position === 2, targets);
check("a target can have no major", targets[0]?.major_id === null, targets);
check("a missing major is \"not picked yet\" unless the plan says otherwise", targets.every((t) => t.major_not_listed === false), targets);
await expectOk("\"Not listed yet\" is saved as its own answer", () =>
  savePlan("authenticated", A, null, false, [{ institution_id: uni2Id, major_id: null, major_not_listed: true }, { institution_id: uniId, major_id: majorId }]));
targets = await targetsOf(A);
check("the flag is on the school it was chosen for, and only that one", targets[0]?.major_not_listed === true && targets[0].major_id === null && targets[1]?.major_not_listed === false, targets);
await expectError("a school can't have a major and \"Not listed yet\" at once", () =>
  savePlan("authenticated", A, null, false, [{ institution_id: uniId, major_id: majorId, major_not_listed: true }]), /major_not_listed_check/);
check("the refused save changed nothing", (await targetsOf(A)).length === 2, await targetsOf(A));
check("the home college is left alone when p_update_home is false", (await homeOf(A)) === instId, await homeOf(A));

await expectError("a target that isn't on record stops the save", () =>
  savePlan("authenticated", A, null, true, [{ institution_id: "00000000-0000-0000-0000-0000000000ff", major_id: null }]), /university on record/);
check("a failed save changes nothing (home)", (await homeOf(A)) === instId, await homeOf(A));
check("a failed save changes nothing (targets)", (await targetsOf(A)).length === 2, await targetsOf(A));
await expectError("a major must belong to its school", () =>
  savePlan("authenticated", A, null, false, [{ institution_id: uni2Id, major_id: majorId }]), /belong to its school/);
await expectError("the home college must be a community college", () => savePlan("authenticated", A, uniId, true, null), /community college/);
await expectError("a school can't be in the plan twice", () =>
  savePlan("authenticated", A, null, false, [{ institution_id: uniId, major_id: null }, { institution_id: uniId, major_id: majorId }]), /only be in the plan once/);

// A removed school takes its saved progress with it; the schools that stay keep theirs
const requirement = (majorRow, code) => as("service_role", null, `insert into requirements (major_id, code, name, source_name, source_url, academic_year, retrieved_at)
  values ($1, $2, 'Test requirement', ${prov}) returning id`, [majorRow, code]);
const req1 = (await requirement(majorId, "req-1")).rows[0].id;
const req2 = (await requirement(major2Id, "req-2")).rows[0].id;
await as("authenticated", A, "insert into user_requirement_status (user_id, requirement_id, status) values ($1, $2, 'done'), ($1, $3, 'in_progress')", [A, req1, req2]);
await expectOk("a student removes a school from the plan", () => savePlan("authenticated", A, null, false, [{ institution_id: uni2Id, major_id: major2Id }]));
const statuses = (await db.query("select requirement_id from user_requirement_status where user_id = $1", [A])).rows.map((r) => r.requirement_id);
check("the removed school's progress is deleted, the kept school's stays", statuses.length === 1 && statuses[0] === req2, statuses);

await expectOk("null targets leave the targets alone", () => savePlan("authenticated", A, null, true, null));
check("\"My college isn't listed\" clears the home college", (await homeOf(A)) === null, await homeOf(A));
check("the targets are still there", (await targetsOf(A)).length === 1, await targetsOf(A));

// Deleting an account: only the caller's, with every per-student row
const course = await as("service_role", null, `insert into courses (institution_id, subject, course_number, title, source_name, source_url, academic_year, retrieved_at)
  values ($1, 'TEST', '1', 'Test course', ${prov}) returning id`, [instId]);
await as("authenticated", A, "insert into saved_courses (user_id, course_id) values ($1, $2)", [A, course.rows[0].id]);
await savePlan("authenticated", B, instId, true, [{ institution_id: uniId, major_id: majorId }]);
await as("authenticated", B, "insert into saved_schools (user_id, institution_id) values ($1, $2)", [B, uniId]);
const PER_STUDENT = ["profiles", "user_targets", "user_requirement_status", "saved_courses", "saved_schools"];
const rowCounts = async (sub) => Object.fromEntries(await Promise.all(
  PER_STUDENT.map(async (t) => [t, (await db.query(`select count(*)::int as n from ${t} where user_id = $1`, [sub])).rows[0].n])));
const before = await rowCounts(A);
check("the student has a row in every per-student table", Object.values(before).every((n) => n > 0), before);
await expectError("anon can't call delete_my_account", () => as("anon", null, "select delete_my_account()"), /permission denied/);
await expectError("delete_my_account needs a signed-in student", () => as("authenticated", null, "select delete_my_account()"), /not signed in/);
await expectOk("a student deletes their account", () => as("authenticated", A, "select delete_my_account()"));
const users = (await db.query("select id from auth.users order by id")).rows.map((r) => r.id);
check("only that account is gone", users.length === 1 && users[0] === B, users);
const after = await rowCounts(A);
check("every per-student row went with it", Object.values(after).every((n) => n === 0), after);
const others = await rowCounts(B);
check("another student's rows are untouched", others.profiles === 1 && others.user_targets === 1 && others.saved_schools === 1, others);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
