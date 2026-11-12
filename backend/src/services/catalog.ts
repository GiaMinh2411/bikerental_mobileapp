import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "../db.js";
import { dates } from "./rentals.js";
export const paging = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(40).default(12),
});
export const modelInclude = {
  type: true,
  images: { orderBy: { sort_order: "asc" as const }, take: 6 },
  bikes: {
    include: { station: true },
    take: 20,
    orderBy: { id: "asc" as const },
  },
};
export const pageResult = (
  items: unknown[],
  total: number,
  page: number,
  limit: number,
) => ({ items, total, page, limit, has_more: page * limit < total });
export async function catalog(query: unknown) {
  const q = paging
    .extend({
      q: z.string().max(100).optional(),
      type: z.coerce.number().int().positive().optional(),
      station: z.coerce.number().int().positive().optional(),
      min: z.coerce.number().int().nonnegative().optional(),
      max: z.coerce.number().int().nonnegative().optional(),
      start: z.string().optional(),
      end: z.string().optional(),
      sort: z.enum(["price_asc", "price_desc", "name"]).default("price_asc"),
    })
    .refine(
      (v) => Boolean(v.start) === Boolean(v.end),
      "Cần cả giờ nhận và trả.",
    )
    .refine(
      (v) => v.min === undefined || v.max === undefined || v.min <= v.max,
      "Giá từ không được lớn hơn giá đến.",
    )
    .parse(query);
  const times = q.start && q.end ? dates(q.start, q.end) : null;
  const bikeWhere: Prisma.BikeWhereInput = {
    status: "ACTIVE",
    station_id: q.station,
    station: { active: true },
    price_per_hour: { gte: q.min, lte: q.max },
    ...(times
      ? {
          rentals: {
            none: {
              OR: [
                { status: "ONGOING" },
                {
                  status: "BOOKED",
                  planned_start_at: { lt: times.e },
                  planned_end_at: { gt: times.s },
                },
              ],
            },
          },
        }
      : {}),
  };
  const where: Prisma.BikeModelWhereInput = {
    active: true,
    type: { active: true },
    name: { contains: q.q ?? "" },
    type_id: q.type,
    bikes: { some: bikeWhere },
  };
  const ranked =
    q.sort === "name"
      ? null
      : await db.bike.groupBy({
          by: ["bike_model_id"],
          where: {
            ...bikeWhere,
            model: {
              active: true,
              type: { active: true },
              name: { contains: q.q ?? "" },
              type_id: q.type,
            },
          },
          _min: { price_per_hour: true },
          orderBy: [
            {
              _min: {
                price_per_hour: q.sort === "price_desc" ? "desc" : "asc",
              },
            },
            { bike_model_id: "asc" },
          ],
          skip: (q.page - 1) * q.limit,
          take: q.limit,
        });
  const [items, total] = await Promise.all([
    db.bikeModel.findMany({
      where: ranked
        ? { id: { in: ranked.map((x) => x.bike_model_id) } }
        : where,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      ...(ranked ? {} : { skip: (q.page - 1) * q.limit, take: q.limit }),
      include: {
        ...modelInclude,
        bikes: {
          where: bikeWhere,
          include: { station: true },
          orderBy: { price_per_hour: "asc" },
          take: 10,
        },
        _count: { select: { reviews: { where: { is_demo: true } } } },
      },
    }),
    db.bikeModel.count({ where }),
  ]);
  if (ranked)
    items.sort(
      (a, b) =>
        ranked.findIndex((x) => x.bike_model_id === a.id) -
        ranked.findIndex((x) => x.bike_model_id === b.id),
    );
  const ratings = items.length
    ? await db.review.groupBy({
        by: ["bike_model_id"],
        where: { bike_model_id: { in: items.map((m) => m.id) } },
        _avg: { rating: true },
        _count: { id: true },
      })
    : [];
  return pageResult(
    items.map((m) => ({
      ...m,
      rating_average:
        ratings.find((r) => r.bike_model_id === m.id)?._avg.rating ?? null,
      review_count:
        ratings.find((r) => r.bike_model_id === m.id)?._count.id ?? 0,
      demo_review_count: m._count.reviews,
    })),
    total,
    q.page,
    q.limit,
  );
}
