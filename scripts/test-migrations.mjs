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

// Deadlines (14): only verified dates, checklists and steps reach the app, and only the service role writes them
const addDeadline = (slug, columns = {}) => {
  const row = {
    slug, cycle: "fall-2027", audience: "uc", kind: "application", title: "Test application", summary: "A test date.",
    opens_at: "2026-10-01T00:00:00-07:00", due_at: "2026-11-30T23:59:00-08:00", due_has_time: true,
    source_name: "Test source", source_url: "https://example.org/dates", ...columns,
  };
  // An undefined column is left out, so the table's default applies
  const entries = Object.entries(row).filter(([, v]) => v !== undefined);
  return as("service_role", null, `insert into deadlines (${entries.map(([k]) => k).join(", ")}, retrieved_at)
    values (${entries.map((_, i) => `$${i + 1}`).join(", ")}, now()) returning id`, entries.map(([, v]) => v));
};
const verifyRow = (table, id) => as("service_role", null, `update ${table} set verification_status = 'verified', verified_at = now() where id = $1`, [id]);

await expectError("anon cannot add a deadline", () => as("anon", null, "insert into deadlines (slug) values ('x')"), /permission denied/);
await expectError("a student cannot add a deadline", () => as("authenticated", A, "insert into deadlines (slug) values ('x')"), /permission denied/);
const dueId = (await expectOk("service role adds a deadline", () => addDeadline("test-application")))?.rows[0].id;
await expectRows("an unverified deadline is hidden from anon", () => as("anon", null, "select * from deadlines"), 0);
await expectRows("an unverified deadline is hidden from students", () => as("authenticated", A, "select * from deadlines"), 0);
await verifyRow("deadlines", dueId);
await expectRows("a verified deadline is readable by anon", () => as("anon", null, "select * from deadlines"), 1);
const dueRow = (await as("authenticated", A, "select due_at, due_has_time from deadlines where id = $1", [dueId])).rows[0];
check("an 11:59 p.m. Pacific deadline keeps its exact instant", dueRow?.due_at.toISOString() === "2026-12-01T07:59:00.000Z" && dueRow.due_has_time === true, dueRow);
const dateOnly = await addDeadline("date-only", { opens_at: undefined, due_at: "2027-01-31T23:59:59-08:00", due_has_time: undefined });
const dateOnlyRow = (await db.query("select due_has_time from deadlines where id = $1", [dateOnly.rows[0].id])).rows[0];
check("a date with no stated time defaults to due_has_time false", dateOnlyRow?.due_has_time === false, dateOnlyRow);
await expectError("a verified deadline can't be changed by an import", () =>
  as("service_role", null, "update deadlines set title = 'Changed' where id = $1", [dueId]), /refusing to update verified/);
await expectError("a deadline can't open after it's due", () => addDeadline("bad-window", { opens_at: "2026-12-01T00:00:00-08:00" }), /check/);
await expectError("a deadline's source must be https", () => addDeadline("bad-source", { source_url: "http://example.org" }), /source_url_check/);
await expectError("a cycle must look like fall-2027", () => addDeadline("bad-cycle", { cycle: "2027" }), /cycle_check/);
await expectError("a campus-only date needs its school", () => addDeadline("no-campus", { audience: "campus" }), /check/);
await expectError("a UC-wide date can't name one school", () => addDeadline("uc-with-school", { institution_id: uniId }), /check/);
await expectOk("a campus-only date names its school", () => addDeadline("campus-date", { audience: "campus", institution_id: uniId }));

const addChecklist = (slug, deadlineId) => as("service_role", null, `insert into checklists (slug, cycle, deadline_id, name, apply_label, apply_url, source_name, source_url, retrieved_at)
  values ($1, 'fall-2027', $2, 'Test application', 'Open the test application', 'https://example.org/apply', 'Test source', 'https://example.org/how', now()) returning id`, [slug, deadlineId]);
const addStep = (checklistId, position) => as("service_role", null, `insert into checklist_steps (checklist_id, position, title, summary, source_name, source_url, retrieved_at)
  values ($1, $2, 'A step', 'What to do.', 'Test source', 'https://example.org/how', now()) returning id`, [checklistId, position]);
const listId = (await expectOk("service role adds a checklist", () => addChecklist("test-checklist", dueId)))?.rows[0].id;
await expectError("one checklist per deadline", () => addChecklist("second-checklist", dueId), /duplicate key/);
const stepId = (await addStep(listId, 1)).rows[0].id;
await expectError("one step per position", () => addStep(listId, 1), /duplicate key/);
await expectRows("an unverified checklist is hidden", () => as("anon", null, "select * from checklists"), 0);
await verifyRow("checklists", listId);
await expectRows("a verified checklist on a verified deadline is readable", () => as("anon", null, "select * from checklists"), 1);
await expectRows("an unverified step is hidden", () => as("anon", null, "select * from checklist_steps"), 0);
await verifyRow("checklist_steps", stepId);
await expectRows("a verified step on a verified checklist is readable", () => as("authenticated", A, "select * from checklist_steps"), 1);
const hiddenDue = (await addDeadline("unverified-application")).rows[0].id;
const hiddenList = (await addChecklist("hidden-checklist", hiddenDue)).rows[0].id;
await verifyRow("checklists", hiddenList);
await expectRows("a verified checklist on an unverified deadline stays hidden", () => as("anon", null, "select * from checklists where id = $1", [hiddenList]), 0);
const hiddenStep = (await addStep(hiddenList, 1)).rows[0].id;
await verifyRow("checklist_steps", hiddenStep);
await expectRows("a verified step under a hidden checklist stays hidden", () => as("anon", null, "select * from checklist_steps where id = $1", [hiddenStep]), 0);
await expectError("a student cannot change a step", () => as("authenticated", A, "update checklist_steps set title = 'x'"), /permission denied/);

// The student's marks: owner only
await expectError("anon can't read deadline marks", () => as("anon", null, "select * from user_deadlines"), /permission denied/);
await expectOk("a student marks a deadline done with reminders", () =>
  as("authenticated", A, "insert into user_deadlines (user_id, deadline_id, done_at, reminders) values ($1, $2, now(), '{7,1}')", [A, dueId]));
await expectOk("reminders can follow the default (null)", () =>
  as("authenticated", B, "insert into user_deadlines (user_id, deadline_id) values ($1, $2)", [B, dueId]));
await expectError("reminders are only 7, 3, 1 or 0 days before", () =>
  as("authenticated", B, "update user_deadlines set reminders = '{5}' where user_id = $1", [B]), /reminders_check/);
await expectError("a student can't mark a deadline for someone else", () =>
  as("authenticated", A, "insert into user_deadlines (user_id, deadline_id) values ($1, $2)", [B, hiddenDue]), /row-level security/);
await expectRows("a student sees only their own marks", () => as("authenticated", A, "select * from user_deadlines"), 1);
const undone = await expectOk("a student can't undo another student's mark", () =>
  as("authenticated", B, "update user_deadlines set done_at = null where user_id = $1 returning user_id", [A]));
check("the update reached no one else's row", undone?.rows.length === 0, undone?.rows);
await expectOk("a student undoes their own mark", () => as("authenticated", B, "delete from user_deadlines where user_id = $1", [B]));
await expectOk("a student checks off a step", () => as("authenticated", A, "insert into user_checklist_steps (user_id, step_id) values ($1, $2)", [A, stepId]));
await expectRows("another student doesn't see it", () => as("authenticated", B, "select * from user_checklist_steps"), 0);
await expectError("a student can't check a step off for someone else", () =>
  as("authenticated", B, "insert into user_checklist_steps (user_id, step_id) values ($1, $2)", [A, hiddenStep]), /row-level security/);

// The transfer term on the profile
await expectOk("a student saves their transfer term", () =>
  as("authenticated", A, "update profiles set transfer_term = 'fall-2027', transfer_term_asked = true where user_id = $1", [A]));
await expectOk("\"Not sure yet\" saves no term, and stops the asking", () =>
  as("authenticated", B, "update profiles set transfer_term = null, transfer_term_asked = true where user_id = $1", [B]));
await expectError("a transfer term must look like fall-2027", () =>
  as("authenticated", A, "update profiles set transfer_term = 'next year' where user_id = $1", [A]), /transfer_term_check/);
await expectError("a term can't be saved without counting as asked", () =>
  as("authenticated", A, "update profiles set transfer_term = 'fall-2028', transfer_term_asked = false where user_id = $1", [A]), /transfer_term_asked_check/);
const termChange = await expectOk("a student can't change another student's term", () =>
  as("authenticated", B, "update profiles set transfer_term = 'fall-2028' where user_id = $1 returning user_id", [A]));
check("the term update reached no one else's row", termChange?.rows.length === 0, termChange?.rows);

// Essays (17): questions readable by signed-in students once verified, written only by the import
const addPrompt = (key, sort, required = false) => as("service_role", null, `insert into piq_prompts (key, cycle, short_name, summary, required, sort, source_name, source_url, retrieved_at)
  values ($1, 'fall-2027', 'Test question', 'A made-up summary.', $2, $3, 'Test source', 'https://example.org/piq', now()) returning id`, [key, required, sort]);
await expectError("a student cannot add a question", () => as("authenticated", A, "insert into piq_prompts (key) values ('x')"), /permission denied/);
const requiredQ = (await expectOk("service role adds a question", () => addPrompt("major", 1, true)))?.rows[0].id;
await addPrompt("leadership", 2);
await expectError("only one required question per cycle", () => addPrompt("other", 3, true), /piq_prompts_one_required/);
await expectRows("an unverified question is hidden from students", () => as("authenticated", A, "select * from piq_prompts"), 0);
await verifyRow("piq_prompts", requiredQ);
await expectRows("a verified question is readable by a signed-in student", () => as("authenticated", A, "select * from piq_prompts"), 1);
await expectError("anon can't read questions", () => as("anon", null, "select * from piq_prompts"), /permission denied/);
await expectError("a student cannot change a question", () => as("authenticated", A, "update piq_prompts set summary = 'x'"), /permission denied/);
await expectError("a verified question can't be changed, even by the service role", () =>
  as("service_role", null, "update piq_prompts set summary = 'Changed' where id = $1", [requiredQ]), /refusing to update verified/);

// Drafts: owner only, one per question and cycle
const addDraft = (sub, key, body = "Draft text.") =>
  as("authenticated", sub, "insert into essay_drafts (user_id, prompt_key, cycle, body, word_count) values ($1, $2, 'fall-2027', $3, 2) returning id", [sub, key, body]);
const draftA = (await expectOk("a student saves a draft", () => addDraft(A, "major")))?.rows[0].id;
await expectError("one draft per question and cycle", () => addDraft(A, "major"), /essay_drafts_user_id_prompt_key_cycle_key/);
await expectError("a draft needs a real question", () => addDraft(A, "no-such-question"), /foreign key/);
await expectError("a student can't save a draft as someone else", () =>
  as("authenticated", A, "insert into essay_drafts (user_id, prompt_key, cycle) values ($1, 'leadership', 'fall-2027')", [B]), /row-level security/);
const draftB = (await addDraft(B, "major", "Their own words.")).rows[0].id;
await expectRows("a student sees only their own drafts", () => as("authenticated", A, "select * from essay_drafts"), 1);
await expectRows("another student's draft can't be read by its id", () => as("authenticated", A, "select * from essay_drafts where id = $1", [draftB]), 0);
const draftEdit = await expectOk("a student can't change another student's draft", () =>
  as("authenticated", A, "update essay_drafts set body = 'x' where id = $1 returning id", [draftB]));
check("the draft update reached no one else's row", draftEdit?.rows.length === 0, draftEdit?.rows);
const draftDelete = await expectOk("a student can't delete another student's draft", () =>
  as("authenticated", A, "delete from essay_drafts where id = $1 returning id", [draftB]));
check("the draft delete reached no one else's row", draftDelete?.rows.length === 0, draftDelete?.rows);
await expectError("anon can't read drafts", () => as("anon", null, "select * from essay_drafts"), /permission denied/);

// Feedback: the function (service role) writes it; the student only reads their own
const addFeedback = (sub, draft) =>
  as("service_role", null, "insert into essay_feedback (user_id, draft_id, model, input_words, result) values ($1, $2, 'test-model', 2, '{}'::jsonb) returning id", [sub, draft]);
await expectError("a student can't write feedback", () =>
  as("authenticated", A, "insert into essay_feedback (user_id, draft_id, model, input_words, result) values ($1, $2, 'x', 1, '{}')", [A, draftA]), /permission denied/);
const feedbackA = (await expectOk("the function saves feedback", () => addFeedback(A, draftA)))?.rows[0].id;
await addFeedback(B, draftB);
await expectError("feedback can't point at another student's draft", () => addFeedback(A, draftB), /foreign key/);
await expectRows("a student reads their own feedback", () => as("authenticated", A, "select * from essay_feedback"), 1);
await expectRows("another student's feedback can't be read", () => as("authenticated", B, "select * from essay_feedback where user_id = $1", [A]), 0);
await expectError("a student can't change feedback, even their own", () =>
  as("authenticated", A, "update essay_feedback set helpful = true where id = $1", [feedbackA]), /permission denied/);
await expectError("a student can't delete feedback", () => as("authenticated", A, "delete from essay_feedback where id = $1", [feedbackA]), /permission denied/);
await expectError("anon can't read feedback", () => as("anon", null, "select * from essay_feedback"), /permission denied/);

// Consent to AI feedback, on the student's own profile
await expectOk("a student records consent to AI feedback", () =>
  as("authenticated", A, "update profiles set ai_feedback_consent_at = now() where user_id = $1", [A]));
const consentOther = await expectOk("a student can't record consent for someone else", () =>
  as("authenticated", B, "update profiles set ai_feedback_consent_at = now() where user_id = $1 returning user_id", [A]));
check("the consent update reached no one else's row", consentOther?.rows.length === 0, consentOther?.rows);

// Deleting an account: only the caller's, with every per-student row
const course =await as("service_role", null, `insert into courses (institution_id, subject, course_number, title, source_name, source_url, academic_year, retrieved_at)
  values ($1, 'TEST', '1', 'Test course', ${prov}) returning id`, [instId]);
await as("authenticated", A, "insert into saved_courses (user_id, course_id) values ($1, $2)", [A, course.rows[0].id]);
await savePlan("authenticated", B, instId, true, [{ institution_id: uniId, major_id: majorId }]);
await as("authenticated", B, "insert into saved_schools (user_id, institution_id) values ($1, $2)", [B, uniId]);
const PER_STUDENT = [
  "profiles", "user_targets", "user_requirement_status", "saved_courses", "saved_schools", "user_deadlines", "user_checklist_steps",
  "essay_drafts", "essay_feedback",
];
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
check("another student's draft and feedback are untouched", others.essay_drafts === 1 && others.essay_feedback === 1, others);
const leftover = (await db.query("select (select count(*)::int from essay_drafts where id = $1) as d, (select count(*)::int from essay_feedback where id = $2) as f", [draftA, feedbackA])).rows[0];
check("the deleted student's draft and feedback are gone by id", leftover.d === 0 && leftover.f === 0, leftover);

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
