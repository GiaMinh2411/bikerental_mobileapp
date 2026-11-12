import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { transaction } from "../db.js";
import { AppError, available, dates, fee, rentalInclude } from "./rentals.js";
type Tx = Prisma.TransactionClient;
export type BookingInput = {
  model_id: number;
  station_id: number;
  start: string;
  end: string;
  coupon_code?: string;
  request_key?: string;
};
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function discount(
  subtotal: number,
  kind: string,
  value: number,
  cap: number,
) {
  return Math.min(
    subtotal,
    cap,
    kind === "PERCENT"
      ? Math.floor((subtotal * value) / 100)
      : kind === "FIXED"
        ? value
        : 0,
  );
}
export async function notify(
  tx: Tx,
  user: number,
  rental: number,
  kind: string,
  title: string,
  body: string,
  key = kind,
) {
  await tx.notification.upsert({
    where: { dedupe_key: `${rental}:${key}` },
    create: {
      user_id: user,
      rental_id: rental,
      kind,
      title,
      body,
      dedupe_key: `${rental}:${key}`,
    },
    update: {},
  });
}
export async function event(
  tx: Tx,
  rental: number,
  kind: string,
  note: string,
) {
  await tx.rentalEvent.create({ data: { rental_id: rental, kind, note } });
}
export async function expireIn(tx: Tx, now = new Date()) {
  const stale = await tx.rental.findMany({
    where: {
      status: "BOOKED",
      OR: [
        { planned_start_at: { lt: new Date(+now - 30 * 60000) } },
        { planned_end_at: { lte: now } },
      ],
    },
    take: 200,
    orderBy: { id: "asc" },
  });
  for (const r of stale) {
    await tx.rental.update({
      where: { id: r.id },
      data: { status: "EXPIRED", payment_status: "SIMULATED_VOID" },
    });
    await tx.couponRedemption.updateMany({
      where: { rental_id: r.id, status: "RESERVED" },
      data: { status: "RELEASED" },
    });
    await event(
      tx,
      r.id,
      "EXPIRED",
      "Quá cửa sổ nhận xe; đã giải phóng chỗ và lượt mã.",
    );
    await notify(
      tx,
      r.user_id,
      r.id,
      "EXPIRED",
      "Đơn hết hạn nhận xe",
      `Đơn #${r.id} không được nhận đúng hạn.`,
    );
  }
  return stale.length;
}
export async function cancelIn(
  tx: Tx,
  r: any,
  note: string,
  status = "CANCELLED",
) {
  await tx.rental.update({
    where: { id: r.id },
    data: { status, payment_status: "SIMULATED_VOID" },
  });
  await tx.couponRedemption.updateMany({
    where: { rental_id: r.id, status: "RESERVED" },
    data: { status: "RELEASED" },
  });
  await event(tx, r.id, status, note);
  await notify(tx, r.user_id, r.id, status, "Đơn thuê đã hủy", note);
}
export async function couponFor(
  tx: Tx,
  user: number | undefined,
  code: string | undefined,
  subtotal: number,
) {
  if (!code) return null;
  if (!user) throw new AppError(401, "Đăng nhập để dùng mã giảm giá.");
  const c = await tx.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    }),
    now = new Date();
  if (
    !c ||
    !c.active ||
    c.starts_at > now ||
    c.ends_at < now ||
    subtotal < c.min_subtotal
  )
    throw new AppError(
      400,
      "Mã không hợp lệ, hết hạn hoặc chưa đạt tiền thuê tối thiểu.",
    );
  const where = { coupon_id: c.id, status: { in: ["RESERVED", "USED"] } };
  const [all, mine] = await Promise.all([
    tx.couponRedemption.count({ where }),
    tx.couponRedemption.count({ where: { ...where, user_id: user } }),
  ]);
  if (all >= c.max_uses || mine >= c.per_user_limit)
    throw new AppError(
      409,
      "Mã đã hết lượt sử dụng cho bạn hoặc toàn hệ thống.",
    );
  return c;
}
export async function quote(
  model: number,
  station: number,
  start: string,
  end: string,
  code?: string,
  user?: number,
) {
  const { s, e } = dates(start, end);
  return transaction(async (tx) => {
    await expireIn(tx);
    const bikes = await available(tx, model, station, s, e);
    if (!bikes.length)
      throw new AppError(
        409,
        "Không còn xe phù hợp tại trạm và thời gian đã chọn.",
      );
    const subtotal = fee(s, e, bikes[0].price_per_hour),
      c = await couponFor(tx, user, code, subtotal),
      off = c ? discount(subtotal, c.kind, c.value, c.max_discount) : 0;
    return {
      available: bikes.length,
      hourly_rate: bikes[0].price_per_hour,
      estimated_subtotal: subtotal,
      estimated_discount: off,
      other_fees: 0,
      estimated_total: subtotal - off,
      coupon_code: c?.code ?? null,
      policy:
        "Hủy miễn phí trước khi nhận. Quá 30 phút sau giờ bắt đầu hoặc hết giờ thuê: đơn hết hạn. Nhận sớm tối đa 15 phút. Tối thiểu 1 giờ, làm tròn lên, quá giờ cùng đơn giá; trả tại trạm nhận.",
    };
  });
}
export async function book(user: number, input: BookingInput) {
  const fingerprint = hash({ ...input, request_key: undefined });
  return transaction(async (tx) => {
    if (input.request_key) {
      const prior = await tx.rental.findUnique({
        where: {
          user_id_request_key: {
            user_id: user,
            request_key: input.request_key,
          },
        },
        include: rentalInclude,
      });
      if (prior) {
        if (prior.request_hash !== fingerprint)
          throw new AppError(409, "Mã thao tác đã dùng cho nội dung khác.");
        return prior;
      }
    }
    const { s, e } = dates(input.start, input.end);
    await expireIn(tx);
    const bikes = await available(tx, input.model_id, input.station_id, s, e);
    if (!bikes.length)
      throw new AppError(409, "Xe vừa được đặt hoặc không còn trống.");
    const b = bikes[0],
      subtotal = fee(s, e, b.price_per_hour),
      c = await couponFor(tx, user, input.coupon_code, subtotal),
      off = c ? discount(subtotal, c.kind, c.value, c.max_discount) : 0;
    const owner=await tx.user.findUnique({where:{id:user},select:{is_demo:true}});
    if(!owner)throw new AppError(401,'Tài khoản không còn tồn tại.');
    const r = await tx.rental.create({
      data: {
        user_id: user,
        is_demo:owner.is_demo,
        bike_id: b.id,
        pickup_station_id: b.station_id,
        planned_start_at: s,
        planned_end_at: e,
        hourly_rate: b.price_per_hour,
        estimated_subtotal: subtotal,
        estimated_discount: off,
        estimated_total: subtotal - off,
        request_key: input.request_key,
        request_hash: fingerprint,
        coupon_id: c?.id,
        coupon_code: c?.code,
        discount_type: c?.kind ?? "NONE",
        discount_value: c?.value ?? 0,
        discount_cap: c?.max_discount ?? 0,
      },
    });
    if (c)
      await tx.couponRedemption.create({
        data: { coupon_id: c.id, user_id: user, rental_id: r.id },
      });
    await event(
      tx,
      r.id,
      "BOOKED",
      "Đặt thành công, xe được giữ chỗ ngay. Thanh toán mô phỏng khi trả.",
    );
    await notify(
      tx,
      user,
      r.id,
      "BOOKED",
      "Đặt xe thành công",
      `Xe ${b.code} đã giữ chỗ tại trạm nhận.`,
    );
    return tx.rental.findUniqueOrThrow({
      where: { id: r.id },
      include: rentalInclude,
    });
  });
}
export async function transition(user: number, id: number, action: string) {
  return transaction(async (tx) => {
    await expireIn(tx);
    const r = await tx.rental.findFirst({
      where: { id, user_id: user },
      include: { bike: true },
    });
    if (!r) throw new AppError(404, "Không tìm thấy đơn thuê.");
    const now = new Date();
    if (action === "cancel") {
      if (r.status === "CANCELLED")
        return tx.rental.findUniqueOrThrow({
          where: { id },
          include: rentalInclude,
        });
      if (r.status !== "BOOKED")
        throw new AppError(409, "Chỉ hủy đơn đang giữ chỗ.");
      await cancelIn(
        tx,
        r,
        "Khách hủy trước nhận xe. Không thu phí; giải phóng lượt mã.",
      );
    } else if (action === "pickup") {
      if (r.status === "ONGOING")
        return tx.rental.findUniqueOrThrow({
          where: { id },
          include: rentalInclude,
        });
      if (
        r.status !== "BOOKED" ||
        +now < +r.planned_start_at - 15 * 60000 ||
        +now > +r.planned_start_at + 30 * 60000 ||
        +now >= +r.planned_end_at
      )
        throw new AppError(
          409,
          "Nhận từ 15 phút trước đến 30 phút sau giờ đặt, trước giờ kết thúc.",
        );
      if (
        r.bike.status !== "ACTIVE" ||
        r.bike.station_id !== r.pickup_station_id ||
        (await tx.rental.count({
          where: { bike_id: r.bike_id, status: "ONGOING" },
        }))
      )
        throw new AppError(409, "Xe chưa sẵn sàng tại trạm.");
      if (
        await tx.rental.count({
          where: {
            bike_id: r.bike_id,
            id: { not: id },
            status: "BOOKED",
            planned_start_at: { lt: r.planned_start_at },
            planned_end_at: { gt: now },
          },
        })
      )
        throw new AppError(
          409,
          "Chưa thể nhận sớm vì xe còn lịch giữ chỗ trước giờ của bạn.",
        );
      await tx.rental.update({
        where: { id },
        data: { status: "ONGOING", actual_start_at: now },
      });
      await event(tx, id, "ONGOING", "Đã nhận xe mô phỏng.");
      await notify(
        tx,
        user,
        id,
        "ONGOING",
        "Đã nhận xe",
        "Chúc bạn có chuyến đi an toàn.",
      );
    } else if (action === "return") {
      if (r.status === "COMPLETED")
        return tx.rental.findUniqueOrThrow({
          where: { id },
          include: rentalInclude,
        });
      if (r.status !== "ONGOING" || !r.actual_start_at)
        throw new AppError(409, "Chỉ trả xe đang thuê.");
      const subtotal = fee(r.actual_start_at, now, r.hourly_rate),
        off = discount(
          subtotal,
          r.discount_type,
          r.discount_value,
          r.discount_cap,
        );
      await tx.bike.update({
        where: { id: r.bike_id },
        data: { station_id: r.pickup_station_id },
      });
      await tx.rental.update({
        where: { id },
        data: {
          status: "COMPLETED",
          actual_end_at: now,
          return_station_id: r.pickup_station_id,
          final_subtotal: subtotal,
          final_discount: off,
          final_total: subtotal - off,
          payment_status: "SIMULATED_PAID",
        },
      });
      await tx.couponRedemption.updateMany({
        where: { rental_id: id, status: "RESERVED" },
        data: { status: "USED" },
      });
      await event(
        tx,
        id,
        "COMPLETED",
        `Đã trả xe; tiền thuê ${subtotal}, giảm ${off}, tổng ${subtotal - off} VNĐ mô phỏng.`,
      );
      await notify(
        tx,
        user,
        id,
        "COMPLETED",
        "Chuyến đi hoàn thành",
        "Thanh toán mô phỏng đã chốt. Bạn có thể đánh giá xe.",
      );
    } else throw new AppError(400, "Thao tác không hợp lệ.");
    return tx.rental.findUniqueOrThrow({
      where: { id },
      include: rentalInclude,
    });
  });
}
export async function extension(
  user: number,
  id: number,
  end: string,
  key?: string,
) {
  return transaction(async (tx) => {
    const fingerprint = hash({ end });
    if (key) {
      const prior = await tx.rentalAction.findUnique({
        where: { rental_id_request_key: { rental_id: id, request_key: key } },
        include: { rental: { select: { user_id: true } } },
      });
      if (prior) {
        if (prior.rental.user_id !== user)
          throw new AppError(404, "Không có đơn thuê.");
        if (prior.request_hash !== fingerprint)
          throw new AppError(409, "Mã thao tác đã dùng.");
        return JSON.parse(prior.result);
      }
    }
    const r = await tx.rental.findFirst({
      where: { id, user_id: user },
      include: { bike: true },
    });
    if (!r) throw new AppError(404, "Không có đơn thuê.");
    const e = new Date(end);
    if (
      r.status !== "ONGOING" ||
      r.bike.status !== "ACTIVE" ||
      !Number.isFinite(+e) ||
      +e <= Date.now() ||
      +e <= +r.planned_end_at ||
      +e - +r.planned_start_at > 7 * 86400000
    )
      throw new AppError(
        409,
        "Chỉ gia hạn xe đang thuê, không sự cố; giờ mới sau giờ cũ và hiện tại, tối đa 7 ngày.",
      );
    const clashes = await tx.rental.count({
      where: {
        bike_id: r.bike_id,
        id: { not: id },
        status: { in: ["BOOKED", "ONGOING"] },
        planned_start_at: { lt: e },
        planned_end_at: { gt: r.planned_end_at },
      },
    });
    if (clashes) throw new AppError(409, "Giờ trả mới trùng lịch kế tiếp.");
    const subtotal = fee(r.planned_start_at, e, r.hourly_rate),
      off = discount(
        subtotal,
        r.discount_type,
        r.discount_value,
        r.discount_cap,
      );
    const result = {
      estimated_subtotal: subtotal,
      estimated_discount: off,
      estimated_total: subtotal - off,
      additional_total: Math.max(0, subtotal - off - r.estimated_total),
      new_end: e.toISOString(),
    };
    if (key) {
      await tx.rental.update({
        where: { id },
        data: {
          planned_end_at: e,
          estimated_subtotal: subtotal,
          estimated_discount: off,
          estimated_total: subtotal - off,
        },
      });
      await event(
        tx,
        id,
        "EXTENDED",
        `Gia hạn đến ${e.toISOString()}; dự kiến thêm ${result.additional_total} VNĐ.`,
      );
      await tx.rentalAction.create({
        data: {
          rental_id: id,
          request_key: key,
          request_hash: fingerprint,
          result: JSON.stringify(result),
        },
      });
    }
    return result;
  });
}
export async function runTasks() {
  return transaction(async (tx) => {
    const expired = await expireIn(tx);
    const now = Date.now();
    const active = await tx.rental.findMany({
      where: {
        OR: [
          {
            status: "BOOKED",
            planned_start_at: { lte: new Date(now + 15 * 60000) },
          },
          {
            status: "ONGOING",
            planned_end_at: { lte: new Date(now + 15 * 60000) },
          },
        ],
      },
      take: 300,
      orderBy: { planned_end_at: "asc" },
    });
    for (const r of active) {
      const kind =
        r.status === "BOOKED"
          ? "PICKUP_SOON"
          : +r.planned_end_at < now
            ? "OVERDUE"
            : "RETURN_SOON";
      await notify(
        tx,
        r.user_id,
        r.id,
        kind,
        kind === "PICKUP_SOON"
          ? "Sắp đến giờ nhận"
          : kind === "OVERDUE"
            ? "Chuyến đi quá giờ"
            : "Sắp đến giờ trả",
        `Mở đơn #${r.id} để kiểm tra thời gian.`,
        `${kind}:${r.status === "BOOKED" ? +r.planned_start_at : +r.planned_end_at}`,
      );
    }
    return { expired, checked: active.length };
  });
}
