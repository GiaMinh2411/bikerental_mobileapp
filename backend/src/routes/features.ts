import { Router, RequestHandler } from "express";
import { z } from "zod";
import { auth } from "../middleware/auth.js";
import { db, transaction } from "../db.js";
import { AppError, rentalInclude } from "../services/rentals.js";
import { catalog, paging, pageResult } from "../services/catalog.js";
import {
  cancelIn,
  event,
  extension,
  notify,
  runTasks,
} from "../services/booking.js";
import { existsSync } from "node:fs";
export const features = Router();
export const admin: RequestHandler = async (_req, res, next) => {
  const u = await db.user.findUnique({
    where: { id: res.locals.user },
    select: { role: true },
  });
  next(
    u?.role === "ADMIN"
      ? undefined
      : new AppError(403, "Chức năng chỉ dành cho quản trị viên."),
  );
};
features.get("/catalog", async (req, res) =>
  res.json(await catalog(req.query)),
);
features.get("/favorite-status/:id", auth, async (req, res) =>
  res.json({
    saved: !!(await db.favorite.findUnique({
      where: {
        user_id_bike_model_id: {
          user_id: res.locals.user,
          bike_model_id: Number(req.params.id),
        },
      },
    })),
  }),
);
features.get("/models/:id/reviews", async (req, res) => {
  const q = paging.parse(req.query),
    where = { bike_model_id: Number(req.params.id) };
  const [items, total, summary] = await Promise.all([
    db.review.findMany({
      where,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      select: {
        id: true,
        rating: true,
        content: true,
        is_demo: true,
        created_at: true,
      },
    }),
    db.review.count({ where }),
    db.review.aggregate({ where, _avg: { rating: true } }),
  ]);
  res.json({
    ...pageResult(items, total, q.page, q.limit),
    average: summary._avg.rating,
  });
});
features.use((req, res, next) => {
  const protectedPath =
    /^\/(my-rentals|notifications|support|coupons|admin)(\/|$)/.test(
      req.path,
    ) || /^\/rentals\/\d+\/(extend|extension-quote|review)$/.test(req.path);
  if (protectedPath) auth(req, res, next);
  else next();
});
features.get("/my-rentals", async (req, res) => {
  await runTasks();
  const q = paging
      .extend({ group: z.enum(["current", "history", "all"]).default("all") })
      .parse(req.query),
    where = {
      user_id: res.locals.user,
      ...(q.group === "current"
        ? { status: { in: ["BOOKED", "ONGOING"] } }
        : q.group === "history"
          ? { status: { in: ["COMPLETED", "CANCELLED", "EXPIRED"] } }
          : {}),
    };
  const [items, total] = await Promise.all([
    db.rental.findMany({
      where,
      include: rentalInclude,
      orderBy:
        q.group === "current"
          ? [{ status: "desc" }, { planned_start_at: "asc" }, { id: "desc" }]
          : [{ created_at: "desc" }, { id: "desc" }],
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    db.rental.count({ where }),
  ]);
  res.json(pageResult(items, total, q.page, q.limit));
});
features.get("/my-favorites", async (req, res) => {
  const q = paging.parse(req.query),
    where = { user_id: res.locals.user };
  const [items, total] = await Promise.all([
    db.favorite.findMany({
      where,
      include: {
        model: {
          include: {
            type: true,
            images: { take: 1 },
            bikes: { include: { station: true }, take: 5 },
          },
        },
      },
      orderBy: [{ created_at: "desc" }, { bike_model_id: "asc" }],
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    db.favorite.count({ where }),
  ]);
  res.json(
    pageResult(
      items.map((x) => x.model),
      total,
      q.page,
      q.limit,
    ),
  );
});
features.post("/rentals/:id/extension-quote", async (req, res) => {
  const d = z.object({ end: z.iso.datetime({ offset: true }) }).parse(req.body);
  res.json(await extension(res.locals.user, Number(req.params.id), d.end));
});
features.post("/rentals/:id/extend", async (req, res) => {
  const d = z
    .object({
      end: z.iso.datetime({ offset: true }),
      request_key: z.string().min(8).max(100),
    })
    .parse(req.body);
  res.json(
    await extension(
      res.locals.user,
      Number(req.params.id),
      d.end,
      d.request_key,
    ),
  );
});
features.put("/rentals/:id/review", async (req, res) => {
  const d = z
    .object({
      rating: z.number().int().min(1).max(5),
      content: z.string().trim().min(5).max(1000),
    })
    .parse(req.body);
  res.json(
    await transaction(async (tx) => {
      const r = await tx.rental.findFirst({
        where: { id: Number(req.params.id), user_id: res.locals.user },
        include: { review: true, bike: true },
      });
      if (!r) throw new AppError(404, "Không có đơn thuê.");
      if (r.status !== "COMPLETED")
        throw new AppError(409, "Chỉ đánh giá sau khi hoàn thành chuyến.");
      if (r.review && Date.now() - +r.review.created_at > 7 * 86400000)
        throw new AppError(409, "Chỉ sửa đánh giá trong 7 ngày sau khi gửi.");
      return tx.review.upsert({
        where: { rental_id: r.id },
        create: {
          ...d,
          user_id: r.user_id,
          rental_id: r.id,
          bike_model_id: r.bike.bike_model_id,
          is_demo: r.is_demo,
        },
        update: d,
      });
    }),
  );
});
features.get("/coupons", async (_req, res) =>
  res.json(
    await db.coupon.findMany({
      where: {
        active: true,
        starts_at: { lte: new Date() },
        ends_at: { gte: new Date() },
      },
      take: 30,
      orderBy: { code: "asc" },
    }),
  ),
);
features.get("/notifications", async (req, res) => {
  await runTasks();
  const q = paging.parse(req.query),
    where = { user_id: res.locals.user };
  const [items, total, unread] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    db.notification.count({ where }),
    db.notification.count({ where: { ...where, read_at: null } }),
  ]);
  res.json({ ...pageResult(items, total, q.page, q.limit), unread });
});
features.patch("/notifications/:id/read", async (req, res) => {
  const n = await db.notification.updateMany({
    where: {
      id: Number(req.params.id),
      user_id: res.locals.user,
      read_at: null,
    },
    data: { read_at: new Date() },
  });
  const own = await db.notification.findFirst({
    where: { id: Number(req.params.id), user_id: res.locals.user },
  });
  if (!own) throw new AppError(404, "Không có thông báo.");
  res.json({ ok: true, changed: n.count });
});
features.get("/support", async (req, res) => {
  const q = paging.parse(req.query),
    where = { user_id: res.locals.user };
  const [items, total] = await Promise.all([
    db.supportTicket.findMany({
      where,
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    db.supportTicket.count({ where }),
  ]);
  res.json(pageResult(items, total, q.page, q.limit));
});
features.post("/support", async (req, res) => {
  const d = z
    .object({
      rental_id: z.number().int().positive(),
      kind: z.enum(["DAMAGE", "BILLING", "OTHER"]),
      description: z.string().trim().min(10).max(2000),
    })
    .parse(req.body);
  res.status(201).json(
    await transaction(async (tx) => {
      const r = await tx.rental.findFirst({
        where: { id: d.rental_id, user_id: res.locals.user },
      });
      if (!r) throw new AppError(404, "Không có đơn thuê.");
      if (d.kind === "DAMAGE") {
        if (!["ONGOING", "COMPLETED"].includes(r.status))
          throw new AppError(409, "Chỉ báo hỏng xe đã nhận hoặc đã trả.");
        await tx.bike.update({
          where: { id: r.bike_id },
          data: { status: "MAINTENANCE" },
        });
        const next = await tx.rental.findMany({
          where: { bike_id: r.bike_id, status: "BOOKED" },
        });
        for (const n of next)
          await cancelIn(
            tx,
            n,
            "Xe cần bảo trì; đơn được hủy miễn phí, lượt mã được hoàn.",
          );
        await event(tx, r.id, "INCIDENT", "Đã báo sự cố, xe chuyển bảo trì.");
      }
      return tx.supportTicket.create({
        data: { ...d, user_id: res.locals.user },
      });
    }),
  );
});
features.use("/admin", admin);
features.post("/admin/tasks/run", async (_req, res) =>
  res.json(await runTasks()),
);
features.get("/admin/stats", async (_req, res) => {
  const [rentals, bikes, stations, open_tickets, paid, top] = await Promise.all(
    [
      db.rental.count(),
      db.bike.count(),
      db.station.count(),
      db.supportTicket.count({ where: { status: { not: "RESOLVED" } } }),
      db.rental.aggregate({
        where: { status: "COMPLETED" },
        _sum: { final_total: true },
      }),
      db.rental.groupBy({
        by: ["bike_id"],
        where: { status: "COMPLETED" },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ],
  );
  const popular = await db.bike.findMany({
    where: { id: { in: top.map((x) => x.bike_id) } },
    include: { model: { select: { name: true } } },
  });
  res.json({
    rentals,
    bikes,
    stations,
    open_tickets,
    simulated_revenue: paid._sum.final_total ?? 0,
    popular: top.map((x) => ({
      bike_id: x.bike_id,
      name: popular.find((b) => b.id === x.bike_id)?.model.name,
      count: x._count.id,
    })),
  });
});
const station = z.object({
  name: z.string().min(2).max(100),
  address: z.string().min(5).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  active: z.boolean().default(true),
});
const type = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(1000),
  active: z.boolean().default(true),
});
const model = z.object({
  name: z.string().min(2).max(100),
  type_id: z.number().int().positive(),
  brand: z.string().max(100),
  description: z.string().min(5).max(2000),
  specifications: z
    .string()
    .max(4000)
    .refine((v) => {
      try {
        const p = JSON.parse(v);
        return p && typeof p === "object" && !Array.isArray(p);
      } catch {
        return false;
      }
    }, "Thông số phải là JSON object."),
  active: z.boolean().default(true),
});
const bike = z.object({
  code: z.string().min(2).max(40),
  bike_model_id: z.number().int().positive(),
  station_id: z.number().int().positive(),
  price_per_hour: z.number().int().min(1000).max(1000000),
  status: z.enum(["ACTIVE", "MAINTENANCE"]),
});
const coupon = z
  .object({
    code: z
      .string()
      .min(3)
      .max(30)
      .transform((v) => v.trim().toUpperCase()),
    kind: z.enum(["PERCENT", "FIXED"]),
    value: z.number().int().positive(),
    max_discount: z.number().int().positive(),
    min_subtotal: z.number().int().nonnegative(),
    starts_at: z.coerce.date(),
    ends_at: z.coerce.date(),
    max_uses: z.number().int().positive(),
    per_user_limit: z.number().int().positive(),
    active: z.boolean().default(true),
  })
  .refine(
    (v) =>
      v.ends_at > v.starts_at && (!(v.kind === "PERCENT") || v.value <= 100),
    "Ngày hoặc mức giảm không hợp lệ.",
  );
const schemas: Record<string, z.ZodType<any>> = {
  stations: station,
  types: type,
  models: model,
  bikes: bike,
  coupons: coupon,
};
const table = (tx: any, resource: string) =>
  ({
    stations: tx.station,
    types: tx.bikeType,
    models: tx.bikeModel,
    bikes: tx.bike,
    coupons: tx.coupon,
    rentals: tx.rental,
    support: tx.supportTicket,
  })[resource];
features.put("/admin/models/:id/images", async (req, res) => {
  const d = z
    .object({
      path: z.string().regex(/^media\/bike-\d+(?:-[a-z0-9]+)?\.webp$/),
      alt_text: z.string().min(3).max(200),
      sort_order: z.number().int().min(0).max(5),
    })
    .parse(req.body);
  if (!existsSync(d.path))
    throw new AppError(400, "Ảnh chưa tồn tại trong media.");
  const id = Number(req.params.id);
  res.json(
    await db.bikeImage.upsert({
      where: {
        bike_model_id_sort_order: {
          bike_model_id: id,
          sort_order: d.sort_order,
        },
      },
      create: { ...d, bike_model_id: id },
      update: d,
    }),
  );
});
features.get("/admin/:resource", async (req, res) => {
  const q = paging.parse(req.query),
    t = table(db, String(req.params.resource));
  if (!t) throw new AppError(404, "Không có danh mục quản trị.");
  const [items, total] = await Promise.all([
    t.findMany({
      orderBy: { id: "desc" },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    t.count(),
  ]);
  res.json(pageResult(items, total, q.page, q.limit));
});
features.post("/admin/:resource", async (req, res) => {
  const resource = String(req.params.resource);
  if (!schemas[resource])
    throw new AppError(400, "Không hỗ trợ tạo dữ liệu này.");
  const d = schemas[resource].parse(req.body);
  res.status(201).json(
    await transaction(async (tx) => {
      const result = await table(tx, resource).create({
        data: { ...d, ...(resource === "stations" ? { image_path: "" } : {}) },
      });
      if (resource === "bikes") await syncPrice(tx, result.bike_model_id);
      return result;
    }),
  );
});
async function syncPrice(tx: any, id: number) {
  const price = await tx.bike.aggregate({
    where: { bike_model_id: id },
    _min: { price_per_hour: true },
  });
  await tx.bikeModel.update({
    where: { id },
    data: { min_price: price._min.price_per_hour ?? 0 },
  });
}
features.patch("/admin/:resource/:id", async (req, res) => {
  const resource = String(req.params.resource),
    id = Number(req.params.id);
  res.json(
    await transaction(async (tx) => {
      if (resource === "support") {
        const d = z
          .object({
            status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
            response: z.string().trim().min(5).max(2000),
          })
          .parse(req.body);
        const result = await tx.supportTicket.update({
          where: { id },
          data: d,
        });
        await notify(
          tx,
          result.user_id,
          result.rental_id,
          "SUPPORT",
          "Hỗ trợ đã cập nhật",
          d.response,
          `support:${id}:${result.updated_at.toISOString()}`,
        );
        return result;
      }
      if (!schemas[resource]) throw new AppError(400, "Danh mục này chỉ đọc.");
      const d = schemas[resource].parse(req.body);
      if (resource === "bikes") {
        const old = await tx.bike.findUniqueOrThrow({ where: { id } });
        if (
          await tx.rental.count({ where: { bike_id: id, status: "ONGOING" } })
        )
          throw new AppError(
            409,
            "Không sửa xe đang được thuê; hãy xử lý qua báo sự cố.",
          );
        if (
          old.status === "MAINTENANCE" &&
          d.status === "ACTIVE" &&
          (await tx.supportTicket.count({
            where: {
              kind: "DAMAGE",
              status: { not: "RESOLVED" },
              rental: { bike_id: id },
            },
          }))
        )
          throw new AppError(
            409,
            "Giải quyết yêu cầu sự cố trước khi đưa xe hoạt động lại.",
          );
        const upcoming = await tx.rental.findMany({
          where: { bike_id: id, status: "BOOKED" },
        });
        if (
          upcoming.length &&
          (d.station_id !== old.station_id ||
            d.bike_model_id !== old.bike_model_id)
        )
          throw new AppError(409, "Không đổi trạm/mẫu khi có lịch giữ chỗ.");
        if (d.status === "MAINTENANCE")
          for (const r of upcoming)
            await cancelIn(tx, r, "Quản trị chuyển xe bảo trì; hủy miễn phí.");
        const result = await tx.bike.update({ where: { id }, data: d });
        await syncPrice(tx, old.bike_model_id);
        await syncPrice(tx, result.bike_model_id);
        return result;
      }
      if (
        d.active === false &&
        ["stations", "models", "types"].includes(resource)
      ) {
        const scope =
          resource === "stations"
            ? { station_id: id }
            : resource === "models"
              ? { bike_model_id: id }
              : { model: { type_id: id } };
        if (
          await tx.rental.count({
            where: { status: { in: ["BOOKED", "ONGOING"] }, bike: scope },
          })
        )
          throw new AppError(
            409,
            "Danh mục đang có chuyến hiệu lực; xử lý các chuyến trước khi vô hiệu hóa.",
          );
      }
      if (resource === "coupons") {
        const used = await tx.couponRedemption.count({
          where: { coupon_id: id, status: { in: ["RESERVED", "USED"] } },
        });
        const users = await tx.couponRedemption.groupBy({
          by: ["user_id"],
          where: { coupon_id: id, status: { in: ["RESERVED", "USED"] } },
          _count: { id: true },
        });
        if (
          d.max_uses < used ||
          users.some((u) => u._count.id > d.per_user_limit)
        )
          throw new AppError(
            409,
            "Hạn mức mới thấp hơn số lượt đang giữ hoặc đã dùng.",
          );
      }
      return table(tx, resource).update({ where: { id }, data: d });
    }),
  );
});
