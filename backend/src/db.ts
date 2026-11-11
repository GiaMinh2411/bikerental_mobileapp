import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
export const db = new PrismaClient();
export async function initialize() {
  await db.$executeRawUnsafe("PRAGMA foreign_keys = ON");
  await db.$queryRawUnsafe("PRAGMA journal_mode = WAL");
  await db.$queryRawUnsafe("PRAGMA busy_timeout = 5000");
}
// SQLite serializes writers. Retry the ENTIRE transaction after a lock conflict.
export async function transaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let n = 0; ; n++) {
    try {
      return await db.$transaction(fn, {
        isolationLevel: "Serializable",
        timeout: 10000,
      });
    } catch (e: any) {
      if (n >= 4 || !["P2034", "P1008", "P2028", "P2010"].includes(e.code))
        throw e;
      await new Promise((r) => setTimeout(r, 60 * (n + 1)));
    }
  }
}
