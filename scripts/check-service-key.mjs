// Runs after `next build`: fails if the service role key's value appears anywhere in the built app (out/).
// Reads the key from .env.local and never prints it.
import fs from "node:fs";
import path from "node:path";

const env = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "";
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!key) {
  console.log("check-service-key: no SUPABASE_SERVICE_ROLE_KEY in .env.local, nothing to check");
  process.exit(0);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full) : [full];
  });
}

const leaks = walk("out").filter((file) => /\.(html|js|txt|json|css|map)$/.test(file) && fs.readFileSync(file, "utf8").includes(key));
if (leaks.length) {
  console.error(`check-service-key: the service role key is in ${leaks.length} built file(s):\n${leaks.join("\n")}`);
  process.exit(1);
}
console.log("check-service-key: the service role key is not in the build");
