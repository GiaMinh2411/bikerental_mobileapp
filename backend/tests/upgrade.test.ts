import { test, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../src/app.js";
import { db, initialize } from "../src/db.js";
import { secret } from "../src/middleware/auth.js";
import { runTasks } from "../src/services/booking.js";
const api = request(app),
  auth = (id: number) => ({
    Authorization: `Bearer ${jwt.sign({}, secret(), { subject: String(id), expiresIn: "1h" })}`,
  });
after(() => db.$disconnect());
test("early pickup respects an earlier reservation; expiry releases coupon once", async () => {
  const a = auth(1),
    ids: number[] = [];
  const b = await db.bike.findFirstOrThrow({ where: { bike_model_id: 22 } }),
    s = new Date(Date.now() + 60000),
    middle = new Date(+s + 4 * 60000),
    end = new Date(+middle + 3600000);
  const c = await db.coupon.create({
    data: {
      code: `EXPIRE${Date.now()}`,
      kind: "FIXED",
      value: 1000,
      max_discount: 1000,
      min_subtotal: 0,
      starts_at: new Date(Date.now() - 60000),
      ends_at: new Date(Date.now() + 86400000),
      max_uses: 1,
      per_user_limit: 1,
    },
  });
  try {
    const input = {
      model_id: 22,
      station_id: b.station_id,
      start: s.toISOString(),
      end: middle.toISOString(),
      coupon_code: c.code,
      request_key: `early-a-${Date.now()}`,
    };
    const first = await api.post("/rentals").set(a).send(input).expect(201);
    ids.push(first.body.id);
    const second = await api
      .post("/rentals")
      .set(a)
      .send({
        ...input,
        start: middle.toISOString(),
        end: end.toISOString(),
        coupon_code: undefined,
        request_key: `early-b-${Date.now()}`,
      })
      .expect(201);
    ids.push(second.body.id);
    await api.post(`/rentals/${second.body.id}/pickup`).set(a).expect(409);
    await db.rental.update({
      where: { id: first.body.id },
      data: { planned_start_at: new Date(Date.now() - 40 * 60000) },
    });
    await runTasks();
    assert.equal(
      (await db.rental.findUniqueOrThrow({ where: { id: first.body.id } }))
        .status,
      "EXPIRED",
    );
    assert.equal(
      (
        await db.couponRedemption.findUniqueOrThrow({
          where: { rental_id: first.body.id },
        })
      ).status,
      "RELEASED",
    );
    const count = await db.notification.count({
      where: { rental_id: first.body.id, kind: "EXPIRED" },
    });
    await runTasks();
    assert.equal(
      await db.notification.count({
        where: { rental_id: first.body.id, kind: "EXPIRED" },
      }),
      count,
    );
    await api.post(`/rentals/${first.body.id}/pickup`).set(a).expect(409);
    await api.post(`/rentals/${second.body.id}/pickup`).set(a).expect(200);
    await api.post(`/rentals/${second.body.id}/return`).set(a).expect(200);
  } finally {
    await db.notification.deleteMany({ where: { rental_id: { in: ids } } });
    await db.rentalEvent.deleteMany({ where: { rental_id: { in: ids } } });
    await db.couponRedemption.deleteMany({ where: { rental_id: { in: ids } } });
    await db.rental.deleteMany({ where: { id: { in: ids } } });
    await db.coupon.delete({ where: { id: c.id } });
  }
});
test("idempotent booking, concurrent coupon limit, extension collision, review, ownership, incident and admin", async () => {
  await initialize();
  const user = await db.user.findUniqueOrThrow({
      where: { email: "demo1@bike.example" },
    }),
    admin = await db.user.findUniqueOrThrow({
      where: { email: "admin@bike.example" },
    }),
    a = auth(user.id),
    staff = auth(admin.id);
  const ids: number[] = [];
  let couponId = 0,
    ticketId = 0;
  try {
    const code = `TEST${Date.now()}`;
    const c = await db.coupon.create({
      data: {
        code,
        kind: "PERCENT",
        value: 20,
        max_discount: 20000,
        min_subtotal: 0,
        starts_at: new Date(Date.now() - 60000),
        ends_at: new Date(Date.now() + 86400000),
        max_uses: 1,
        per_user_limit: 1,
      },
    });
    couponId = c.id;
    const b = await db.bike.findFirstOrThrow({ where: { bike_model_id: 24 } }),
      other = await db.bike.findFirstOrThrow({ where: { bike_model_id: 23 } }),
      s = new Date(Date.now() + 5 * 60000),
      e = new Date(+s + 3600000),
      input = {
        model_id: 24,
        station_id: b.station_id,
        start: s.toISOString(),
        end: e.toISOString(),
        coupon_code: code,
        request_key: `book-${Date.now()}`,
      };
    const rivals = await Promise.all([
      api.post("/rentals").set(a).send(input),
      api
        .post("/rentals")
        .set(auth(2))
        .send({
          ...input,
          model_id: 23,
          station_id: other.station_id,
          request_key: `other-${Date.now()}`,
        }),
    ]);
    rivals.filter((r) => r.status === 201).forEach((r) => ids.push(r.body.id));
    assert.deepEqual(rivals.map((r) => r.status).sort(), [201, 409]);
    // Release the single coupon slot on cancellation, then reserve it again.
    const won = rivals.find((r) => r.status === 201)!;
    await api
      .post(`/rentals/${won.body.id}/cancel`)
      .set(auth(won.body.user_id))
      .expect(200);
    input.request_key = `fresh-${Date.now()}`;
    const together = await Promise.all([
      api.post("/rentals").set(a).send(input),
      api.post("/rentals").set(a).send(input),
    ]);
    assert.ok(together.every((r) => r.status === 201));
    assert.equal(together[0].body.id, together[1].body.id);
    const booked = together[0];
    ids.push(booked.body.id);
    const replay = await api.post("/rentals").set(a).send(input).expect(201);
    assert.equal(replay.body.id, booked.body.id);
    await api
      .post("/rentals")
      .set(a)
      .send({ ...input, end: new Date(+e + 3600000).toISOString() })
      .expect(409);
    const id = booked.body.id;
    await api
      .put(`/rentals/${id}/review`)
      .set(a)
      .send({ rating: 5, content: "Chuyến đi rất tốt." })
      .expect(409);
    const next = await api
      .post("/rentals")
      .set(a)
      .send({
        ...input,
        coupon_code: undefined,
        request_key: `next-${Date.now()}`,
        start: new Date(+e + 3600000).toISOString(),
        end: new Date(+e + 2 * 3600000).toISOString(),
      })
      .expect(201);
    ids.push(next.body.id);
    await api.post(`/rentals/${id}/pickup`).set(a).expect(200);
    await api
      .post(`/rentals/${id}/extension-quote`)
      .set(a)
      .send({ end: new Date(+e + 90 * 60000).toISOString() })
      .expect(409);
    const extension = {
      end: new Date(+e + 30 * 60000).toISOString(),
      request_key: `extension-${Date.now()}`,
    };
    const first = await api
        .post(`/rentals/${id}/extend`)
        .set(a)
        .send(extension)
        .expect(200),
      again = await api
        .post(`/rentals/${id}/extend`)
        .set(a)
        .send(extension)
        .expect(200);
    assert.deepEqual(first.body, again.body);
    const sameTime = await Promise.all([
      api.post(`/rentals/${id}/extend`).set(a).send(extension),
      api.post(`/rentals/${id}/extend`).set(a).send(extension),
    ]);
    assert.ok(
      sameTime.every(
        (x) =>
          x.status === 200 &&
          x.body.estimated_total === first.body.estimated_total,
      ),
    );
    assert.equal(
      await db.rentalEvent.count({
        where: { rental_id: id, kind: "EXTENDED" },
      }),
      1,
    );
    const incident = await api
      .post("/support")
      .set(a)
      .send({
        rental_id: id,
        kind: "DAMAGE",
        description: "Phanh xe gặp sự cố cần kiểm tra ngay.",
      })
      .expect(201);
    ticketId = incident.body.id;
    assert.equal(
      (await db.bike.findUniqueOrThrow({ where: { id: b.id } })).status,
      "MAINTENANCE",
    );
    assert.equal(
      (await db.rental.findUniqueOrThrow({ where: { id: next.body.id } }))
        .status,
      "CANCELLED",
    );
    await api
      .post(`/rentals/${id}/extend`)
      .set(a)
      .send({ ...extension, request_key: "another-key" })
      .expect(409);
    const returned = await api.post(`/rentals/${id}/return`).set(a).expect(200);
    assert.equal(
      returned.body.final_total,
      returned.body.final_subtotal - returned.body.final_discount,
    );
    await api
      .put(`/rentals/${id}/review`)
      .set(auth(2))
      .send({ rating: 4, content: "Đánh giá không hợp lệ." })
      .expect(404);
    await api
      .put(`/rentals/${id}/review`)
      .set(a)
      .send({ rating: 5, content: "Đã nhận hỗ trợ kịp thời." })
      .expect(200);
    await api
      .put(`/rentals/${id}/review`)
      .set(a)
      .send({ rating: 4, content: "Đã cập nhật nội dung." })
      .expect(200);
    assert.equal(await db.review.count({ where: { rental_id: id } }), 1);
    const note = await db.notification.findFirstOrThrow({
      where: { rental_id: id, user_id: user.id },
    });
    await api.patch(`/notifications/${note.id}/read`).set(auth(2)).expect(404);
    await api.patch(`/notifications/${note.id}/read`).set(a).expect(200);
    await api.get("/admin/stats").set(a).expect(403);
    await api.get("/admin/stats").set(staff).expect(200);
    await api
      .patch("/me")
      .set(a)
      .send({ full_name: user.full_name, phone: "", role: "ADMIN" })
      .expect(200);
    assert.equal(
      (await db.user.findUniqueOrThrow({ where: { id: user.id } })).role,
      "USER",
    );
    await api
      .patch(`/admin/support/${ticketId}`)
      .set(staff)
      .send({
        status: "RESOLVED",
        response: "Đội hỗ trợ đã ghi nhận và kiểm tra xe.",
      })
      .expect(200);
    const bike = await db.bike.findUniqueOrThrow({ where: { id: b.id } });
    await api
      .patch(`/admin/bikes/${b.id}`)
      .set(staff)
      .send({
        code: bike.code,
        bike_model_id: bike.bike_model_id,
        station_id: bike.station_id,
        price_per_hour: bike.price_per_hour,
        status: "ACTIVE",
      })
      .expect(200);
    const one = await api.get("/catalog?page=1&limit=5").expect(200),
      two = await api.get("/catalog?page=2&limit=5").expect(200);
    assert.equal(one.body.items.length, 5);
    assert.ok(
      !one.body.items.some((x: any) =>
        two.body.items.some((y: any) => x.id === y.id),
      ),
    );
    await api.get("/catalog?limit=1000").expect(400);
    await runTasks();
    const count = await db.notification.count();
    await runTasks();
    assert.equal(await db.notification.count(), count);
  } finally {
    if (ticketId)
      await db.supportTicket.deleteMany({ where: { id: ticketId } });
    await db.review.deleteMany({ where: { rental_id: { in: ids } } });
    await db.rentalAction.deleteMany({ where: { rental_id: { in: ids } } });
    await db.notification.deleteMany({ where: { rental_id: { in: ids } } });
    await db.rentalEvent.deleteMany({ where: { rental_id: { in: ids } } });
    await db.couponRedemption.deleteMany({ where: { rental_id: { in: ids } } });
    await db.rental.deleteMany({ where: { id: { in: ids } } });
    if (couponId) await db.coupon.delete({ where: { id: couponId } });
  }
});
