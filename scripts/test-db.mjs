// An in-memory Postgres (PGlite) shaped like a Supabase project, with every migration in supabase/migrations applied.
// For tests only; it never touches a real database.
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

export async function createTestDatabase({ quiet = false } = {}) {
  const db = new PGlite();
  // What a Supabase project has before any migration runs
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  `);
  const dir = path.join(process.cwd(), "supabase/migrations");
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(fs.readFileSync(path.join(dir, file), "utf8"));
    if (!quiet) console.log("applied", file);
  }
  return db;
}

// Runs one query as a Supabase role, with sub as the signed-in user (authenticated only)
export async function asRole(db, role, sub, sql, params) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${sub ?? ""}', false); set role ${role};`);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec("reset role;");
  }
}
