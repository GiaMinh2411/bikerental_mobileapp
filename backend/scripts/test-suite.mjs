import { spawnSync } from "node:child_process";
import fs from "node:fs";
if (!fs.existsSync("prisma/test-upgrade.db"))
  fs.closeSync(fs.openSync("prisma/test-upgrade.db", "wx"));
const env = {
  ...process.env,
  DATABASE_URL: "file:./test-upgrade.db",
  GEMINI_API_KEY: "",
  JWT_SECRET: "test-only-secret-at-least-32-characters-2026",
};
for (const args of [
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  ["node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"],
  [
    "node_modules/tsx/dist/cli.mjs",
    "--test",
    "--test-concurrency=1",
    "tests/api.test.ts",
    "tests/upgrade.test.ts",
  ],
]) {
  const r = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
