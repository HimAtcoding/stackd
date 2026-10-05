// The import pipeline's connection to Supabase, with the service role key from .env.local.
// The key is read here and nowhere else, and it's never printed.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function readEnv(name) {
  const env = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "";
  return env.match(new RegExp(`^${name}=(.*)$`, "m"))?.[1]?.trim().replace(/^["']|["']$/g, "") || null;
}

// Calls the database functions in supabase/migrations/20261005130000_import_functions.sql
export function supabaseDatabase() {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be in .env.local");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const call = async (fn, args) => {
    const { data, error } = await client.rpc(fn, args);
    if (error) throw new Error(error.message);
    return data;
  };
  return {
    importBatch: (payload, sourceFile, dryRun) => call("import_planning_batch", { payload, source_file: sourceFile, dry_run: dryRun }),
    verifyRows: (rows) => call("verify_planning_rows", { rows }),
    // Rows as stored, for the review report
    async rowsFor(payload) {
      const slugs = payload.institutions.map((i) => i.slug);
      const all = [...new Set([...slugs, ...payload.majors.map((m) => m.institution), ...payload.agreement_links.flatMap((l) => [l.sending, l.receiving])])];
      const inst = await client.from("institutions").select("*").in("slug", all);
      if (inst.error) throw new Error(inst.error.message);
      const ids = inst.data.map((i) => i.id);
      const majors = await client.from("majors").select("*").in("institution_id", ids);
      const links = await client.from("agreement_links").select("*").in("receiving_institution_id", ids);
      if (majors.error || links.error) throw new Error((majors.error ?? links.error).message);
      return { institutions: inst.data, majors: majors.data, agreement_links: links.data };
    },
    async logFailure(sourceFile, dryRun, message) {
      await client.from("import_runs").insert({ source_file: sourceFile, dry_run: dryRun, status: "failed", error: message });
    },
  };
}
