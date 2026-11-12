import { db, initialize } from "../src/db.js";
import bcrypt from "bcryptjs";
import { existsSync } from "node:fs";
const dbUrl = process.env.DATABASE_URL ?? "";
if (!/demo-large\.db/.test(dbUrl) || process.env.NODE_ENV === "production")
  throw new Error("Seed lớn chỉ chạy trên file demo-large.db riêng.");
await initialize();
const seed = Number(
  process.argv.find((v) => v.startsWith("--seed="))?.split("=")[1] ?? 42,
);
const rentalCount = Math.max(
  2000,
  Math.min(
    20000,
    Number(
      process.argv.find((v) => v.startsWith("--rentals="))?.split("=")[1] ??
        2400,
    ),
  ),
);
let rng = seed >>> 0;
const random = () => {
  rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
  return rng / 4294967296;
};
const types = [
  "Thành phố",
  "Địa hình",
  "Đường trường",
  "Touring",
  "Xe gấp",
  "Xe điện",
  "Trẻ em",
  "Xe đôi",
  "Gravel",
  "Hybrid",
  "Cruiser",
  "Chở hàng",
];
const names = [
  [
    "Dạo Phố Rừng",
    "Thanh Lịch Kem",
    "Bến Sông Đêm",
    "Gió Chiều Đỏ",
    "Sớm Mai Xanh",
  ],
  ["Đồi Cam", "Đá Đen", "Rừng Đỏ", "Đỉnh Xanh", "Dốc Cát"],
  ["Tốc Độ Trắng", "Chân Trời Xanh", "Đường Đua Đen", "Bứt Phá Đỏ", "Ánh Bạc"],
  [
    "Hành Trình Ô Liu",
    "Đường Xa Cát",
    "Lữ Hành Đỏ",
    "Vượt Đèo Đêm",
    "Đồng Nội Đồng",
  ],
  ["Gọn Vàng", "Gấp Bạc Hà", "Phố Bạc", "Nhịp San Hô", "Gọn Đen"],
  [
    "Trợ Lực Ngọc",
    "Đồi Điện Đen",
    "Dạo Điện Trắng",
    "Nắng Vàng Điện",
    "Bạc Trợ Lực",
  ],
  ["Bé Hồng", "Tuổi Thơ Xanh", "Chồi Chanh", "Năng Động Cam", "Bé Tím"],
  ["Song Hành Đỏ", "Đôi Kem", "Đồng Điệu Đêm", "Song Ca Ngọc", "Đôi Vàng"],
  ["Đường Sỏi Ô Liu", "Bụi Cát", "Đồng Hoang", "Sỏi Than", "Kem Viễn Du"],
  [
    "Đa Năng Xanh",
    "Linh Hoạt Xám",
    "Bạc Hà Phố",
    "San Hô Hằng Ngày",
    "Ngà Đô Thị",
  ],
  ["Biển Ngọc", "Sóng Kem", "Hoàng Hôn Đào", "Bờ Rừng", "Trời Biển"],
  ["Chở Bé Cam", "Thùng Gỗ Rừng", "Hàng Kem", "Chợ Đêm", "Giỏ Đỏ"],
];
const rates = [
  20000, 35000, 40000, 45000, 25000, 60000, 15000, 50000, 42000, 28000, 25000,
  65000,
];
const now = Date.now(),
  day = 86400000,
  hour = 3600000;
for (let t = 1; t <= 12; t++)
  await db.bikeType.upsert({
    where: { id: t },
    update: {},
    create: {
      id: t,
      name: types[t - 1],
      description: `Xe ${types[t - 1].toLowerCase()} phục vụ nhu cầu di chuyển khác nhau; dữ liệu demo.`,
    },
  });
const places = [
  ["Bến Bạch Đằng", 10.776, 106.706, "Bến Nghé, Quận 1"],
  ["Thảo Cầm Viên", 10.788, 106.705, "Bến Nghé, Quận 1"],
  ["Tao Đàn", 10.776, 106.688, "Bến Thành, Quận 1"],
  ["Bến Nhà Rồng", 10.768, 106.707, "Phường 13, Quận 4"],
  ["Gia Định", 10.815, 106.677, "Phường 3, Gò Vấp"],
  ["Phú Mỹ Hưng", 10.729, 106.72, "Tân Phong, Quận 7"],
  ["Hồ Con Rùa", 10.782, 106.695, "Võ Thị Sáu, Quận 3"],
  ["Văn Thánh", 10.797, 106.715, "Phường 25, Bình Thạnh"],
  ["Thanh Đa", 10.826, 106.729, "Phường 27, Bình Thạnh"],
  ["Lê Văn Tám", 10.788, 106.694, "Đa Kao, Quận 1"],
  ["Tân Định", 10.79, 106.691, "Tân Định, Quận 1"],
  ["Thảo Điền", 10.806, 106.732, "Thảo Điền, TP Thủ Đức"],
  ["An Phú", 10.802, 106.751, "An Phú, TP Thủ Đức"],
  ["Bình An", 10.793, 106.729, "Bình An, TP Thủ Đức"],
  ["Cầu Ánh Sao", 10.723, 106.722, "Tân Phú, Quận 7"],
  ["Khánh Hội", 10.759, 106.7, "Phường 5, Quận 4"],
  ["Hòa Bình", 10.767, 106.638, "Phường 5, Quận 11"],
  ["Lê Thị Riêng", 10.786, 106.665, "Phường 15, Quận 10"],
  ["Hoàng Văn Thụ", 10.8, 106.666, "Phường 2, Tân Bình"],
  ["Bình Phú", 10.746, 106.631, "Phường 11, Quận 6"],
];
for (let i = 0; i < 20; i++) {
  const [name, latitude, longitude, address] = places[i];
  await db.station.upsert({
    where: { id: i + 1 },
    update: {},
    create: {
      id: i + 1,
      name: String(name),
      address: address + " — trạm demo, không phải cơ sở thật",
      latitude: Number(latitude),
      longitude: Number(longitude),
      image_path: "",
    },
  });
}
for (let t = 1; t <= 12; t++)
  for (let v = 0; v < 5; v++) {
    const id =
      t <= 8
        ? v < 3
          ? (t - 1) * 3 + v + 1
          : 25 + (t - 1) * 2 + v - 3
        : 41 + (t - 9) * 5 + v;
    const rate = rates[t - 1];
    const specs = {
      loai: types[t - 1],
      khung: "Hợp kim — dữ liệu demo",
      banh:
        t === 7
          ? "16–20 inch minh họa"
          : t === 5
            ? "20 inch minh họa"
            : t === 12
              ? "Cấu hình chở hàng minh họa"
              : "Bánh người lớn minh họa",
      tay_lai: [3, 4, 9].includes(t)
        ? "Ghi đông cong"
        : "Ghi đông ngang / cong đô thị",
      doi_tuong:
        t === 7
          ? "Trẻ em có giám hộ"
          : t === 8
            ? "Hai người"
            : t === 12
              ? "Chở đồ, kiểm tra tải trọng khi nhận"
              : "Người lớn",
      ghi_chu: "Không xác nhận thông số thương hiệu hay hiệu năng từ ảnh AI.",
    };
    await db.bikeModel.upsert({
      where: { id },
      update: {},
      create: {
        id,
        type_id: t,
        name: names[t - 1][v],
        brand: "Bộ sưu tập demo",
        description: `${names[t - 1][v]} thuộc nhóm xe ${types[t - 1].toLowerCase()}. Chọn trạm và giờ thuê để kiểm tra xe còn lịch. Ảnh và thông số minh họa cho bài tập.`,
        specifications: JSON.stringify(specs),
        min_price: rate,
      },
    });
    await db.bikeImage.upsert({
      where: { bike_model_id_sort_order: { bike_model_id: id, sort_order: 0 } },
      update: {},
      create: {
        bike_model_id: id,
        path: `media/bike-${id}.webp`,
        alt_text: `${types[t - 1]} ${names[t - 1][v]}`,
        sort_order: 0,
      },
    });
    for (let j = 0; j < 5; j++) {
      const bid = (id - 1) * 5 + j + 1;
      await db.bike.upsert({
        where: { id: bid },
        update: {},
        create: {
          id: bid,
          code: `DEMO-${String(bid).padStart(4, "0")}`,
          bike_model_id: id,
          station_id: ((id + j - 1) % 20) + 1,
          price_per_hour: rate,
          status: bid % 37 === 0 ? "MAINTENANCE" : "ACTIVE",
        },
      });
    }
  }
const password_hash = await bcrypt.hash("Demo12345!", 12);
const users = Array.from({ length: 200 }, (_, i) => ({
  id: i + 1,
  email:
    i === 199
      ? "admin@bike.example"
      : i < 3
        ? `demo${i + 1}@bike.example`
        : `rider${i + 1}@bike.example`,
  full_name:
    i === 199
      ? "Quản trị demo"
      : `Khách demo ${String(i + 1).padStart(3, "0")}`,
  password_hash,
  role: i === 199 ? "ADMIN" : "USER",
  is_demo: true,
}));
for (let n = 0; n < users.length; n += 50) {
  const missing = users.slice(n, n + 50);
  for (const u of missing)
    await db.user.upsert({ where: { id: u.id }, update: {}, create: u });
}
for (const [id, code, kind, value, min] of [
  [1, "DEMO10", "PERCENT", 10, 20000],
  [2, "DEMO15", "FIXED", 15000, 60000],
] as const)
  await db.coupon.upsert({
    where: { id },
    update: {},
    create: {
      id,
      code,
      kind,
      value,
      max_discount: 25000,
      min_subtotal: min,
      starts_at: new Date(now - 365 * day),
      ends_at: new Date(now + 90 * day),
      max_uses: 10000,
      per_user_limit: 50,
    },
  });
const bikes = await db.bike.findMany({ orderBy: { id: "asc" } });
const all = [];
for (let i = 0; i < rentalCount; i++) {
  const b = bikes[i % 300],
    cycle = Math.floor(i / 300),
    age = 1 + Math.floor((cycle * 300 * 365) / rentalCount) + (i % 30),
    start = new Date(now - age * day + (i % 12) * hour),
    hours = 1 + Math.floor(random() * 4),
    end = new Date(+start + hours * hour),
    subtotal = hours * b.price_per_hour,
    cancel = i % 9 === 0,
    off =
      !cancel && i % 10 === 0 ? Math.min(25000, Math.floor(subtotal * 0.1)) : 0;
  all.push({
    id: i + 1,
    user_id: (i % 199) + 1,
    bike_id: b.id,
    pickup_station_id: b.station_id,
    return_station_id: cancel ? null : b.station_id,
    planned_start_at: start,
    planned_end_at: end,
    actual_start_at: cancel ? null : start,
    actual_end_at: cancel ? null : end,
    hourly_rate: b.price_per_hour,
    estimated_subtotal: subtotal,
    estimated_discount: off,
    estimated_total: subtotal - off,
    final_subtotal: cancel ? null : subtotal,
    final_discount: cancel ? null : off,
    final_total: cancel ? null : subtotal - off,
    status: cancel ? "CANCELLED" : "COMPLETED",
    payment_status: cancel ? "SIMULATED_VOID" : "SIMULATED_PAID",
    discount_type: off ? "PERCENT" : "NONE",
    discount_value: off ? 10 : 0,
    discount_cap: off ? 25000 : 0,
    coupon_id: off ? 1 : null,
    coupon_code: off ? "DEMO10" : null,
    is_demo: true,
    created_at: new Date(+start - hour),
  });
}
for (let n = 0; n < all.length; n += 100) {
  const batch = all.slice(n, n + 100),
    existing = await db.rental.findMany({
      where: { id: { in: batch.map((r) => r.id) } },
      select: { id: true },
    }),
    ids = new Set(existing.map((r) => r.id));
  await db.rental.createMany({ data: batch.filter((r) => !ids.has(r.id)) });
}
const reviewRows = all.filter((r) => r.status === "COMPLETED").slice(0, 600);
for (let n = 0; n < reviewRows.length; n += 100) {
  for (const r of reviewRows.slice(n, n + 100))
    await db.review.upsert({
      where: { rental_id: r.id },
      update: {},
      create: {
        rental_id: r.id,
        user_id: r.user_id,
        bike_model_id: bikes[r.bike_id - 1].bike_model_id,
        rating: 3 + (r.id % 3),
        content: [
          "Xe phù hợp chuyến đi, nhận và trả rõ ràng.",
          "Yên xe dễ điều chỉnh, thao tác đặt thuận tiện.",
          "Chuyến đi ổn, cần kiểm tra phanh trước khi nhận.",
        ][r.id % 3],
        is_demo: true,
        created_at: r.actual_end_at!,
      },
    });
}
for (const r of all.filter((r) => r.coupon_id))
  await db.couponRedemption.upsert({
    where: { rental_id: r.id },
    update: {},
    create: {
      rental_id: r.id,
      coupon_id: 1,
      user_id: r.user_id,
      status: "USED",
    },
  });
// Repair only generator-owned historical demo rows if an older demo seed omitted the cap.
for (const r of await db.rental.findMany({
  where: { id:{lte:rentalCount},is_demo: true, status: "COMPLETED", coupon_code: "DEMO10" },
})) {
  const estimated = Math.min(
      r.estimated_subtotal,
      r.discount_cap,
      Math.floor((r.estimated_subtotal * r.discount_value) / 100),
    ),
    final = Math.min(
      r.final_subtotal!,
      r.discount_cap,
      Math.floor((r.final_subtotal! * r.discount_value) / 100),
    );
  if (r.estimated_discount !== estimated || r.final_discount !== final)
    await db.rental.update({
      where: { id: r.id },
      data: {
        estimated_discount: estimated,
        estimated_total: r.estimated_subtotal - estimated,
        final_discount: final,
        final_total: r.final_subtotal! - final,
      },
    });
}
for (let i = 1; i <= 200; i++) {
  await db.favorite.upsert({
    where: {
      user_id_bike_model_id: { user_id: i, bike_model_id: (i % 60) + 1 },
    },
    update: {},
    create: { user_id: i, bike_model_id: (i % 60) + 1 },
  });
  const r = all.find((r) => r.user_id === i);
  if (r) {
    await db.notification.upsert({
      where: { dedupe_key: `large:${seed}:${i}` },
      update: {},
      create: {
        user_id: i,
        rental_id: r.id,
        kind: "COMPLETED",
        title: "Chuyến đi demo đã hoàn thành",
        body: "Thông báo thuộc bộ dữ liệu mô phỏng.",
        dedupe_key: `large:${seed}:${i}`,
      },
    });
    if (i <= 20)
      await db.supportTicket.upsert({
        where: { id: i },
        update: {},
        create: {
          id: i,
          user_id: i,
          rental_id: r.id,
          kind: "OTHER",
          description:
            "Yêu cầu hỗ trợ minh họa: hướng dẫn kiểm tra hóa đơn mô phỏng.",
          status: i % 2 ? "OPEN" : "RESOLVED",
          response: i % 2 ? "" : "Đã kiểm tra hóa đơn demo.",
        },
      });
  }
}
for (const [offset, status, bid] of [
  [1, "BOOKED", 298],
  [2, "ONGOING", 299],
] as const) {
  const b = bikes[bid - 1],
    start = new Date(now + (status === "BOOKED" ? 10 * 60000 : -30 * 60000));
  await db.rental.upsert({
    where: { id: rentalCount + offset },
    update: {},
    create: {
      id: rentalCount + offset,
      user_id: 1,
      bike_id: bid,
      pickup_station_id: b.station_id,
      planned_start_at: start,
      planned_end_at: new Date(+start + 2 * hour),
      actual_start_at: status === "ONGOING" ? start : null,
      hourly_rate: b.price_per_hour,
      estimated_subtotal: b.price_per_hour * 2,
      estimated_total: b.price_per_hour * 2,
      status,
      is_demo: true,
    },
  });
}
await db.rental.updateMany({where:{is_demo:false,user:{is_demo:true}},data:{is_demo:true}});
await db.review.updateMany({where:{is_demo:false,user:{is_demo:true}},data:{is_demo:true}});
console.log({
  seed,
  rentals: rentalCount,
  database: "demo-large.db",
  missing_images: Array.from({ length: 60 }, (_, i) => i + 1).filter(
    (i) => !existsSync(`media/bike-${i}.webp`),
  ),
});
await db.$disconnect();
