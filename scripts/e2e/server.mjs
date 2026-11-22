// Starts `next dev` with the flags a browser test needs, and stops it with every process it started.
import { execSync, spawn } from "node:child_process";

export async function startDevServer({ port = 3107, features = "plan" } = {}) {
  const base = `http://localhost:${port}`;
  // One command string: Node warns about arguments passed alongside a shell
  const child = spawn(`npx next dev -p ${Number(port)}`, {
    env: { ...process.env, NEXT_PUBLIC_FEATURES: features },
    shell: true,
    stdio: "ignore",
  });
  const stop = () => {
    if (child.exitCode !== null) return;
    // On Windows the server runs under npx and a shell, so the whole tree has to go, or it keeps the port
    if (process.platform === "win32") execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" });
    else child.kill("SIGTERM");
  };
  for (let i = 0; i < 120; i++) {
    try {
      // The first request compiles the page, so ask for the one the tests open
      if ((await fetch(`${base}/plan/`)).ok) return { base, stop };
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  stop();
  throw new Error(`next dev didn't answer on ${base} within 2 minutes`);
}
