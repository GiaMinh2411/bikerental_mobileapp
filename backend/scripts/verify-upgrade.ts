import { db, initialize } from "../src/db.js";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fee } from "../src/services/rentals.js";
import { discount } from "../src/services/booking.js";
await initialize();
const foreign = await db.$queryRawUnsafe<any[]>("PRAGMA foreign_key_check");
assert.equal(foreign.length, 0);
const overlaps = await db.$queryRawUnsafe<any[]>(
  `WITH windows AS (SELECT id,bike_id,
    CASE WHEN status IN ('COMPLETED','ONGOING') THEN actual_start_at ELSE planned_start_at END AS begins,
    CASE WHEN status='COMPLETED' THEN actual_end_at WHEN status='ONGOING' THEN MAX(planned_end_at,CAST(strftime('%s','now') AS INTEGER)*1000) ELSE planned_end_at END AS ends
    FROM rentals WHERE status IN ('BOOKED','ONGOING','COMPLETED'))
    SELECT a.id FROM windows a JOIN windows b ON a.bike_id=b.bike_id AND a.id<b.id WHERE a.begins<b.ends AND b.begins<a.ends LIMIT 1`,
);
assert.equal(overlaps.length, 0, "Overlapping rental history");
const badReviews = await db.$queryRawUnsafe<any[]>(
  `SELECT v.id FROM reviews v JOIN rentals r ON v.rental_id=r.id JOIN bikes b ON r.bike_id=b.id WHERE r.status!='COMPLETED' OR v.user_id!=r.user_id OR v.bike_model_id!=b.bike_model_id OR v.rating<1 OR v.rating>5 LIMIT 1`,
);
assert.equal(badReviews.length, 0);
const badMoney = await db.$queryRawUnsafe<any[]>(
  `SELECT id FROM rentals WHERE estimated_total!=estimated_subtotal-estimated_discount OR (status='COMPLETED' AND final_total!=final_subtotal-final_discount) LIMIT 1`,
);
assert.equal(badMoney.length, 0);
const money = await db.rental.findMany({ where: { status: "COMPLETED" } });
for (const r of money) {
  assert.ok(r.actual_start_at && r.actual_end_at);
  assert.equal(
    r.final_subtotal,
    fee(r.actual_start_at!, r.actual_end_at!, r.hourly_rate),
  );
  assert.equal(
    r.final_discount ?? 0,
    discount(
      r.final_subtotal!,
      r.discount_type,
      r.discount_value,
      r.discount_cap,
    ),
  );
}
const images = await db.bikeImage.findMany({ where: { sort_order: 0 } }),
  hashes = new Set<string>();
let imageBytes = 0;
for (const i of images) {
  const data = await readFile(i.path);
  imageBytes += data.length;
  hashes.add(createHash("sha256").update(data).digest("hex"));
  await stat(i.path.replace(".webp", "-thumb.webp"));
}
assert.equal(hashes.size, images.length);
console.log({
  users: await db.user.count(),
  types: await db.bikeType.count(),
  models: await db.bikeModel.count(),
  bikes: await db.bike.count(),
  stations: await db.station.count(),
  rentals: await db.rental.count(),
  reviews: await db.review.count(),
  notifications: await db.notification.count(),
  tickets: await db.supportTicket.count(),
  unique_main_images: hashes.size,
  image_bytes: imageBytes,
  fk: "PASS",
  overlaps: "PASS",
  money: "PASS",
  review_ownership: "PASS",
});
await db.$disconnect();
