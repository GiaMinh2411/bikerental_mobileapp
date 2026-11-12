import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
const root = fileURLToPath(new URL("../", import.meta.url));
const file = new URL("../prisma/demo-large.db", import.meta.url);
if (!fs.existsSync(file)) fs.closeSync(fs.openSync(file, "wx"));
const env = { ...process.env, DATABASE_URL: "file:./demo-large.db" };
for (const args of [
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  [
    "node_modules/tsx/dist/cli.mjs",
    "prisma/seed-large.ts",
    ...process.argv.slice(2),
  ],
  ["node_modules/tsx/dist/cli.mjs", "scripts/verify-upgrade.ts"],
]) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
