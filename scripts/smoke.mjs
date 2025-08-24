// Minimal, yarn-friendly smoke runner
import { execSync } from "node:child_process";
const run = (cmd) => execSync(cmd, { stdio: "inherit" });
try {
  console.log("→ Running agents tests (vitest)...");
  run("yarn workspace @opencanvas/agents test");
  // Optional health ping (only informational)
  const url = process.env.SMOKE_HEALTH_URL ?? "http://localhost:3000/api/healthz";
  try {
    const res = await fetch(url);
    if (res.ok) console.log("→ Health OK:", url);
    else console.warn("→ Health non-OK:", res.status, url);
  } catch (e) {
    console.warn("→ Health check skipped (web dev not running).");
  }
  process.exit(0);
} catch (e) {
  console.error("Smoke failed:", e?.message ?? e);
  process.exit(1);
}