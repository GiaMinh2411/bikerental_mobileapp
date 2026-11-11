import { db, initialize } from "../src/db.js";
import bcrypt from "bcryptjs";
await initialize();
const types = [
  "Thành phố",
  "Địa hình",
  "Đường trường",
  "Touring",
  "Xe gấp",
  "Xe điện",
  "Trẻ em",
  "Xe đôi",
];
const colors = [
  "Xanh rừng",
  "Kem",
  "Xanh đêm",
  "Cam",
  "Đen nhám",
  "Đỏ",
  "Trắng",
  "Xanh biển",
  "Đen",
  "Ô liu",
  "Cát",
  "Đỏ rượu",
  "Vàng",
  "Bạc hà",
  "Bạc",
  "Xanh ngọc",
  "Đen",
  "Trắng",
  "Hồng",
  "Xanh biển",
  "Xanh chanh",
  "Đỏ",
  "Kem",
  "Xanh đêm",
];
const stations = [
  "Bến Bạch Đằng",
  "Thảo Cầm Viên",
  "Tao Đàn",
  "Bến Nhà Rồng",
  "Công viên Gia Định",
  "Phú Mỹ Hưng",
];
for (let i = 1; i <= 6; i++)
  await db.station.upsert({
    where: { id: i },
    update: {},
    create: {
      id: i,
      name: stations[i - 1],
      address:
        [
          "Bến Nghé, Quận 1",
          "Bến Nghé, Quận 1",
          "Bến Thành, Quận 1",
          "Phường 13, Quận 4",
          "Phường 3, Gò Vấp",
          "Tân Phong, Quận 7",
        ][i - 1] + " — địa điểm minh họa",
      latitude: 10.77 + i * 0.004,
      longitude: 106.69 + i * 0.003,
      image_path: `media/bike-${i}.webp`,
    },
  });
for (let i = 1; i <= 8; i++)
  await db.bikeType.upsert({
    where: { id: i },
    update: {},
    create: {
      id: i,
      name: types[i - 1],
      description: "Loại xe trong bộ dữ liệu học tập.",
    },
  });
for (let i = 1; i <= 24; i++) {
  const t = Math.ceil(i / 3),
    rate = [20000, 35000, 40000, 45000, 25000, 60000, 15000, 50000][t - 1];
  await db.bikeModel.upsert({
    where: { id: i },
    update: {},
    create: {
      id: i,
      type_id: t,
      name: `${types[t - 1]} ${colors[i - 1]} ${String(i).padStart(2, "0")}`,
      brand: "Minh họa không thương hiệu",
      description:
        "Xe minh họa cho bài tập thuê xe. Thông số và giá là dữ liệu demo, không phải cam kết của nhà sản xuất.",
      specifications: JSON.stringify({
        khung: "Hợp kim — thông số demo",
        loai: types[t - 1],
        mau: colors[i - 1],
        doi_tuong:
          t === 7
            ? "Trẻ em, có người giám hộ"
            : t === 8
              ? "Hai người"
              : "Người lớn",
        ghi_chu: "Chọn kích cỡ phù hợp khi nhận xe.",
      }),
    },
  });
  await db.bikeImage.upsert({
    where: { bike_model_id_sort_order: { bike_model_id: i, sort_order: 0 } },
    update: {},
    create: {
      bike_model_id: i,
      path: `media/bike-${i}.webp`,
      alt_text: `Xe ${types[t - 1]} ${colors[i - 1]}`,
      sort_order: 0,
    },
  });
  for (let j = 0; j < 2; j++) {
    const id = (i - 1) * 2 + j + 1;
    await db.bike.upsert({
      where: { id },
      update: {},
      create: {
        id,
        code: `BIKE-${String(id).padStart(3, "0")}`,
        bike_model_id: i,
        station_id: ((i + j - 1) % 6) + 1,
        price_per_hour: rate,
        status: "ACTIVE",
      },
    });
  }
}
const password_hash = await bcrypt.hash("Demo12345!", 12);
for (let i = 1; i <= 3; i++) {
  await db.user.upsert({
    where: { email: `demo${i}@bike.example` },
    update: {},
    create: {
      id: i,
      email: `demo${i}@bike.example`,
      full_name: `Người dùng demo ${i}`,
      password_hash,
    },
  });
  await db.favorite.upsert({
    where: { user_id_bike_model_id: { user_id: i, bike_model_id: i } },
    update: {},
    create: { user_id: i, bike_model_id: i },
  });
}
// Stable IDs and create-only upserts preserve user changes on a repeated seed.
const now = Date.now(),
  hour = 3600000;
for (let i = 1; i <= 4; i++) {
  const status = ["BOOKED", "ONGOING", "COMPLETED", "CANCELLED"][i - 1],
    bike = await db.bike.findUniqueOrThrow({ where: { id: i } });
  const start = new Date(
    now + (i === 1 ? 5 * 60000 : i === 2 ? -30 * 60000 : -24 * hour),
  );
  const end = new Date(+start + 2 * hour);
  await db.rental.upsert({
    where: { id: i },
    update: {},
    create: {
      id: i,
      user_id: 1,
      bike_id: i,
      pickup_station_id: bike.station_id,
      return_station_id: i === 3 ? bike.station_id : null,
      planned_start_at: start,
      planned_end_at: end,
      actual_start_at: i === 2 || i === 3 ? start : null,
      actual_end_at: i === 3 ? end : null,
      hourly_rate: bike.price_per_hour,
      estimated_total: 2 * bike.price_per_hour,
      final_total: i === 3 ? 2 * bike.price_per_hour : null,
      status,
      payment_status: i === 3 ? "SIMULATED_PAID" : "SIMULATED_PENDING",
    },
  });
}
console.log({
  users: await db.user.count(),
  stations: await db.station.count(),
  types: await db.bikeType.count(),
  models: await db.bikeModel.count(),
  bikes: await db.bike.count(),
  images: await db.bikeImage.count(),
  rentals: await db.rental.count(),
});
await db.$disconnect();
