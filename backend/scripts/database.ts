import { db } from "../src/db.js";
import { mkdir, copyFile, access } from "node:fs/promises";
import path from "node:path";
const action = process.argv[2];
if (process.env.NODE_ENV === "production")
  throw new Error("Công cụ này chỉ dành cho phát triển.");
const file = path.resolve(
  "prisma",
  (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, ""),
);
if (action === "backup") {
  await mkdir("backups", { recursive: true });
  const target = path.resolve("backups", `bike-${Date.now()}.db`);
  // SQLite VACUUM INTO creates a consistent backup including committed WAL data.
  await db.$executeRawUnsafe(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
  console.log(target);
} else if (action === "restore") {
  const source = process.argv[3];
  if (!source || process.argv[4] !== "--confirm")
    throw new Error(
      "Dừng backend; restore <file> --confirm sẽ ghi đè database phát triển.",
    );
  await access(source);
  await db.$queryRawUnsafe("PRAGMA wal_checkpoint(TRUNCATE)");
  await db.$disconnect();
  await copyFile(source, file);
  console.log("Đã khôi phục. Backend phải được dừng trước khi chạy.");
} else throw new Error("Dùng backup hoặc restore <file> --confirm");
await db.$disconnect();
