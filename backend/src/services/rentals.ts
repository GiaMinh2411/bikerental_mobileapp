import { Prisma } from "@prisma/client";
import { db, transaction } from "../db.js";
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
export async function quote(
  model: number,
  station: number,
  start: string,
  end: string,
) {
  const { s, e } = dates(start, end);
  const bikes = await available(db, model, station, s, e);
  if (!bikes.length)
    throw new AppError(409, "Không còn xe phù hợp trong khoảng thời gian này.");
  return {
    available: bikes.length,
    hourly_rate: bikes[0].price_per_hour,
    estimated_total: fee(s, e, bikes[0].price_per_hour),
  };
}
export async function book(
  user: number,
  input: { model_id: number; station_id: number; start: string; end: string },
) {
  const { s, e } = dates(input.start, input.end);
  return transaction(async (tx) => {
    const bikes = await available(tx, input.model_id, input.station_id, s, e);
    if (!bikes.length)
      throw new AppError(
        409,
        "Xe vừa được đặt hoặc không còn trống. Vui lòng chọn lại.",
      );
    const b = bikes[0];
    return tx.rental.create({
      data: {
        user_id: user,
        bike_id: b.id,
        pickup_station_id: b.station_id,
        planned_start_at: s,
        planned_end_at: e,
        hourly_rate: b.price_per_hour,
        estimated_total: fee(s, e, b.price_per_hour),
      },
      include: rentalInclude,
    });
  });
}
export async function transition(user: number, id: number, action: string) {
  return transaction(async (tx) => {
    const r = await tx.rental.findFirst({
      where: { id, user_id: user },
      include: { bike: true },
    });
    if (!r) throw new AppError(404, "Không tìm thấy đơn thuê.");
    const now = new Date();
    if (action === "cancel") {
      if (r.status === "CANCELLED") return r;
      if (r.status !== "BOOKED") throw new AppError(409, "Chỉ hủy đơn đã đặt.");
      return tx.rental.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: rentalInclude,
      });
    }
    if (action === "pickup") {
      if (r.status === "ONGOING") return r;
      if (
        r.status !== "BOOKED" ||
        +now < +r.planned_start_at - 15 * 60000 ||
        +now > +r.planned_start_at + 30 * 60000 ||
        +now >= +r.planned_end_at
      )
        throw new AppError(
          409,
          "Nhận xe từ 15 phút trước đến 30 phút sau giờ bắt đầu, trước giờ kết thúc.",
        );
      const occupied = await tx.rental.count({
        where: { bike_id: r.bike_id, status: "ONGOING" },
      });
      if (
        occupied ||
        r.bike.status !== "ACTIVE" ||
        r.bike.station_id !== r.pickup_station_id
      )
        throw new AppError(409, "Xe chưa sẵn sàng tại trạm.");
      return tx.rental.update({
        where: { id },
        data: { status: "ONGOING", actual_start_at: now },
        include: rentalInclude,
      });
    }
    if (action === "return") {
      if (r.status === "COMPLETED") return r;
      if (r.status !== "ONGOING" || !r.actual_start_at)
        throw new AppError(409, "Chỉ trả xe đang thuê.");
      await tx.bike.update({
        where: { id: r.bike_id },
        data: { station_id: r.pickup_station_id },
      });
      return tx.rental.update({
        where: { id },
        data: {
          status: "COMPLETED",
          actual_end_at: now,
          return_station_id: r.pickup_station_id,
          final_total: fee(r.actual_start_at, now, r.hourly_rate),
          payment_status: "SIMULATED_PAID",
        },
        include: rentalInclude,
      });
    }
    throw new AppError(400, "Thao tác không hợp lệ.");
  });
}
