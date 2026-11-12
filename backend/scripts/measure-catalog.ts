import request from "supertest";
import { performance } from "node:perf_hooks";
import { app } from "../src/app.js";
import { db, initialize } from "../src/db.js";
await initialize();
const timings: number[] = [],
  bytes: number[] = [];
for (let i = 0; i < 30; i++) {
  const start = performance.now();
  const r = await request(app).get(
    `/catalog?page=${(i % 3) + 1}&limit=12&sort=${i % 2 ? "price_asc" : "price_desc"}`,
  );
  if (r.status !== 200) throw new Error(JSON.stringify(r.body));
  timings.push(performance.now() - start);
  bytes.push(Buffer.byteLength(JSON.stringify(r.body)));
}
timings.sort((a, b) => a - b);
console.log({
  requests: timings.length,
  models: await db.bikeModel.count(),
  rentals: await db.rental.count(),
  p50_ms: Number(timings[14].toFixed(2)),
  p95_ms: Number(timings[28].toFixed(2)),
  max_payload_bytes: Math.max(...bytes),
  note: "In-process Supertest on this Windows machine; not phone/network/production throughput.",
});
await db.$disconnect();
