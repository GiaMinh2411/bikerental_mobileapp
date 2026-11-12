import { test, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../src/app.js";
import { db, initialize } from "../src/db.js";
import { fee } from "../src/services/rentals.js";
import { secret } from "../src/middleware/auth.js";
const api = request(app);
after(async () => {
  await db.$disconnect();
});
test("full rental workflow, concurrency, ownership, idempotency and fallback", async () => {
  await initialize();
  const login = await api
    .post("/auth/login")
    .send({ email: "demo1@bike.example", password: "Demo12345!" })
    .expect(200);
  const auth = { Authorization: `Bearer ${login.body.token}` };
  const auth2 = {
    Authorization: `Bearer ${jwt.sign({}, secret(), { subject: "2", expiresIn: "1h" })}`,
  };
  await api.get("/rentals").expect(401);
  await api
    .get("/me")
    .set({
      Authorization: `Bearer ${jwt.sign({}, secret(), { subject: "1", expiresIn: -1 })}`,
    })
    .expect(401);
  assert.equal((await api.get("/models")).body.length, 24);
  assert.equal((await api.get("/stations")).body.length, 6);
  const filtered = await api
    .get("/models?type=7&max=20000&sort=price_desc")
    .expect(200);
  assert.equal(filtered.body.length, 3);
  assert.ok(filtered.body.every((m: any) => m.type_id === 7));
  assert.deepEqual((await api.get("/models?q=not-a-bike")).body, []);
  assert.equal(await db.bike.count(), 48);
  assert.equal(await db.bikeType.count(), 8);
  assert.equal(
    (await db.$queryRawUnsafe<any[]>("PRAGMA foreign_keys"))[0].foreign_keys,
    1n,
  );
  const b = await db.bike.findFirstOrThrow({ where: { bike_model_id: 24 } });
  const ids: number[] = [];
  try {
    const start = new Date(Date.now() + 120000),
      end = new Date(+start + 3600000);
    const input = {
      model_id: 24,
      station_id: b.station_id,
      start: start.toISOString(),
      end: end.toISOString(),
    };
    await api
      .post("/availability")
      .send({ ...input, end: input.start })
      .expect(400);
    await api
      .post("/availability")
      .send({ ...input, start: new Date(0).toISOString() })
      .expect(400);
    const concurrent = await Promise.all([
      api.post("/rentals").set(auth).send(input),
      api.post("/rentals").set(auth).send(input),
    ]);
    concurrent
      .filter((r) => r.status === 201)
      .forEach((r) => ids.push(r.body.id));
    assert.deepEqual(concurrent.map((r) => r.status).sort(), [201, 409]);
    const id = ids[0];
    await api.get(`/rentals/${id}`).set(auth2).expect(404);
    await api.post(`/rentals/${id}/pickup`).set(auth2).expect(404);
    await api.post(`/rentals/${id}/pickup`).set(auth).expect(200);
    const repeated = await api
      .post(`/rentals/${id}/pickup`)
      .set(auth)
      .expect(200);
    assert.equal(repeated.body.status, "ONGOING");
    await api.post(`/rentals/${id}/cancel`).set(auth).expect(409);
    // Even after planned end, an ONGOING bicycle remains unavailable.
    await db.rental.update({
      where: { id },
      data: { planned_end_at: new Date(Date.now() - 1000) },
    });
    await api
      .post("/rentals")
      .set(auth)
      .send({
        ...input,
        start: new Date(+start + 2 * 3600000).toISOString(),
        end: new Date(+start + 3 * 3600000).toISOString(),
      })
      .expect(409);
    const returned = await api
      .post(`/rentals/${id}/return`)
      .set(auth)
      .expect(200);
    assert.equal(returned.body.final_total, b.price_per_hour);
    const again = await api.post(`/rentals/${id}/return`).set(auth).expect(200);
    assert.equal(again.body.final_total, returned.body.final_total);
    const cancel = await api.post("/rentals").set(auth).send(input).expect(201);
    ids.push(cancel.body.id);
    await api.post(`/rentals/${cancel.body.id}/cancel`).set(auth).expect(200);
    await api.post(`/rentals/${cancel.body.id}/cancel`).set(auth).expect(200);
    await api.post(`/rentals/${cancel.body.id}/pickup`).set(auth).expect(409);
    const nextStart = new Date(Date.now() + 86400000);
    const nextEnd = new Date(+nextStart + 3600000);
    const nextInput = {
      ...input,
      start: nextStart.toISOString(),
      end: nextEnd.toISOString(),
    };
    const firstAdjacent = await api
      .post("/rentals")
      .set(auth)
      .send(nextInput)
      .expect(201);
    ids.push(firstAdjacent.body.id);
    const secondAdjacent = await api
      .post("/rentals")
      .set(auth)
      .send({
        ...nextInput,
        start: nextEnd.toISOString(),
        end: new Date(+nextEnd + 3600000).toISOString(),
      })
      .expect(201);
    ids.push(secondAdjacent.body.id);
    assert.equal(firstAdjacent.body.bike_id, secondAdjacent.body.bike_id);
    await api
      .post(`/rentals/${firstAdjacent.body.id}/pickup`)
      .set(auth)
      .expect(409);
    await api
      .post(`/rentals/${firstAdjacent.body.id}/return`)
      .set(auth)
      .expect(409);
    const advice = await api
      .post("/advice")
      .set(auth)
      .send({
        station_id: b.station_id,
        start: input.start,
        end: input.end,
        budget: 100000,
        purpose: "Đi dạo",
      })
      .expect(200);
    assert.equal(advice.body.mode, "Gợi ý theo bộ lọc");
    for (const m of advice.body.models) {
      assert.ok(m.matched_rate <= 100000);
      assert.ok(await db.bikeModel.findUnique({ where: { id: m.id } }));
    }
    await api.put("/favorites/24").set(auth).expect(200);
    assert.ok(
      !(await api.get("/favorites").set(auth2)).body.some(
        (m: any) => m.id === 24,
      ),
    );
    await api.put("/favorites/24").set(auth).expect(200);
    assert.equal(
      await db.favorite.count({ where: { user_id: 1, bike_model_id: 24 } }),
      1,
    );
    await api.delete("/favorites/24").set(auth).expect(200);
    const registration = await api
      .post("/auth/register")
      .send({
        full_name: "Kiểm thử",
        email: `test-${Date.now()}@bike.example`,
        password: "Test12345!",
      })
      .expect(201);
    const testAuth = { Authorization: `Bearer ${registration.body.token}` };
    await api
      .patch("/me")
      .set(testAuth)
      .send({ full_name: "Đã cập nhật", phone: "" })
      .expect(200);
    await db.user.delete({ where: { id: registration.body.user.id } });
  } finally {
    await db.notification.deleteMany({ where: { rental_id: { in: ids } } });
    await db.rentalEvent.deleteMany({ where: { rental_id: { in: ids } } });
    await db.rental.deleteMany({ where: { id: { in: ids } } });
  }
});
test("billing rounds up with one-hour minimum", () => {
  const s = new Date(0);
  assert.equal(fee(s, new Date(1), 20000), 20000);
  assert.equal(fee(s, new Date(3600000), 20000), 20000);
  assert.equal(fee(s, new Date(3600001), 20000), 40000);
});
