// Runs before the iOS build (npm run ios:prepare). The app is built once and shipped, so a missing Supabase URL or
// anon key, or demo mode left on, would put a broken app in the App Store. Prints names only, never values.
import { existsSync, readFileSync } from "node:fs";

const env = { ...process.env };
for (const file of [".env.production.local", ".env.local", ".env.production", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && env[match[1]] === undefined) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const problems = [];
if (!env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://")) problems.push("NEXT_PUBLIC_SUPABASE_URL is missing or not https");
if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
if (["on", "true", "1"].includes(env.NEXT_PUBLIC_DEMO_STRIP?.toLowerCase())) problems.push("NEXT_PUBLIC_DEMO_STRIP is on (demo auth)");

if (problems.length) {
  console.error(`Not building the iOS app:\n- ${problems.join("\n- ")}\nPut the project's public values in .env.local (docs/ios-app-store-handoff.md).`);
  process.exit(1);
}
console.log("iOS build env: Supabase URL and anon key set, real sign-in.");
