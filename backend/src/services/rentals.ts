import { Prisma } from "@prisma/client";
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function dates(start: string, end: string) {
  const s = new Date(start),
    e = new Date(end);
  if (
    !Number.isFinite(+s) ||
    !Number.isFinite(+e) ||
    +s < Date.now() ||
    +e <= +s ||
    +e - +s > 7 * 86400000
  )
    throw new AppError(
      400,
      "Chọn thời gian tương lai, kết thúc sau bắt đầu, tối đa 7 ngày.",
    );
  return { s, e };
}
export const fee = (start: Date, end: Date, rate: number) =>
  Math.max(1, Math.ceil((+end - +start) / 3600000)) * rate;
export const rentalInclude = {
  bike: { include: { model: { include: { images: true } } } },
  review: true,
  events: { orderBy: { created_at: "asc" as const }, take: 80 },
  tickets: { orderBy: { created_at: "desc" as const }, take: 10 },
  pickup: true,
  return_station: true,
};
export async function available(
  tx: Prisma.TransactionClient,
  model: number,
  station: number,
  s: Date,
  e: Date,
) {
  return tx.bike.findMany({
    where: {
      bike_model_id: model,
      station_id: station,
      status: "ACTIVE",
      model: { active: true, type: { active: true } },
      station: { active: true },
      rentals: {
        none: {
          OR: [
            { status: "ONGOING" },
            {
              status: "BOOKED",
              planned_start_at: { lt: e },
              planned_end_at: { gt: s },
            },
          ],
        },
      },
    },
    orderBy: { id: "asc" },
  });
}
export { quote, book, transition } from "./booking.js";
