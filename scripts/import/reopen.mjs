// Sets one verified deadline, checklist or checklist step back to unverified, so a corrected file can be imported
// and checked again (docs/date-check.md → Fixing a verified row). Logs who did it and why. A dry run unless --apply.
//   node scripts/import/reopen.mjs --id <row id> --by "<name>" --reason "<text>" [--apply]
// The row is hidden from students from the moment it's reopened until it's verified again; a reopened date also
// hides its checklist and steps.
import { pathToFileURL } from "node:url";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function reopenRow({ id, by, reason, apply, db }) {
  const problems = [];
  if (!id || !UUID.test(id)) problems.push("--id must be the row's id, from the review report's id column");
  if (!by?.trim()) problems.push("--by must name who is reopening it");
  if (!reason?.trim()) problems.push("--reason must say why");
  if (problems.length) return { ok: false, problems };
  try {
    return { ok: true, ...(await db.reopenRow(id, by.trim(), reason.trim(), !apply)) };
  } catch (e) {
    return { ok: false, problems: [e.message] };
  }
}

const option = (args, name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);
  const { supabaseDatabase } = await import("./db.mjs");
  const outcome = await reopenRow({
    id: option(args, "--id"),
    by: option(args, "--by"),
    reason: option(args, "--reason"),
    apply: args.includes("--apply"),
    db: supabaseDatabase(),
  });
  if (!outcome.ok) {
    console.error(`Nothing was reopened.\n${outcome.problems.map((p) => `  - ${p}`).join("\n")}`);
    console.error('usage: npm run import:reopen -- --id <row id> --by "<name>" --reason "<text>" [--apply]');
    process.exit(1);
  }
  const row = `${outcome.table} ${outcome.id} (${outcome.record}), verified ${outcome.verified_at}`;
  if (outcome.status === "dry_run") console.log(`dry run   would reopen ${row}\n          Nothing changed. Run again with --apply to reopen it.`);
  else console.log(`reopened  ${row}\n          Hidden from students until it's imported and verified again.`);
}
