import { db, initialize } from "../src/db.js";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
await initialize();
const models = await db.bikeModel.findMany({
  include: { images: true, bikes: true },
});
const hashes = new Set<string>();
let bytes = 0;
for (const m of models) {
  assert.ok(m.images.length);
  assert.ok(m.bikes.length);
  for (const image of m.images) {
    const file = await readFile(image.path);
    hashes.add(createHash("sha256").update(file).digest("hex"));
    bytes += (await stat(image.path)).size;
    await stat(image.path.replace(".webp", "-thumb.webp"));
  }
}
assert.equal(models.length, 24);
assert.equal(hashes.size, 24);
const overlaps = await db.rental.findMany({
  where: { status: { in: ["BOOKED", "ONGOING"] } },
});
for (const a of overlaps)
  for (const b of overlaps)
    if (a.id < b.id && a.bike_id === b.bike_id)
      assert.ok(
        +a.planned_end_at <= +b.planned_start_at ||
          +b.planned_end_at <= +a.planned_start_at,
      );
console.log({
  models: models.length,
  uniqueMainImages: hashes.size,
  mainImageBytes: bytes,
  stations: await db.station.count(),
  types: await db.bikeType.count(),
  bikes: await db.bike.count(),
  users: await db.user.count(),
  rentals: await db.rental.count(),
});
await db.$disconnect();
