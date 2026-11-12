# Database

## Migration và seed bản nâng cấp

Giữ SQLite/Prisma6. Không sửa migration init đã áp dụng. Migration mới `20261112075202_rental_upgrade` thêm bảng/field với default và backfill `estimated_subtotal=estimated_total`, `final_subtotal=final_total`, min_price từ xe hiện có. Backup trước migration tại backend/backups; không reset dev.db. Backend phải dừng khi migrate/generate trên Windows để tránh SQLite lock và Prisma DLL đang được dùng.

User thêm role USER/ADMIN và is_demo; Station/BikeType/BikeModel thêm active; model thêm min_price. Rental thêm request_key/hash unique theo user, policy_version, các thành phần tiền dự kiến/thực tế, snapshot mã giảm và is_demo. Bảng mới: reviews (unique rental, user/model FK), coupons, coupon_redemptions (unique rental, RESERVED/USED/RELEASED), rental_events, rental_actions (unique rental/key), notifications (dedupe_key unique, read_at), support_tickets. Index trên catalog active/min_price/id, review model/date/id, thông báo user/read/date/id, support user/status/date/id và redemption coupon/status/user.

`npm run db:seed`: bộ nhỏ hiện có, 24 mẫu/48 xe/6 trạm/8 loại; thêm admin demo và DEMO10 bằng upsert. Không cập nhật lại thời gian/giá đơn đã dùng. `npm run db:demo-large -- --seed=42 --rentals=2400`: tự đặt DATABASE_URL chỉ cho subprocess tới `file:./demo-large.db`, tạo database RIÊNG, 12 loại/60 mẫu/300 xe/20 trạm/200 users/2.400 lịch sử + 2 chuyến hiện tại/600 reviews demo. Chạy lại theo ID ổn định, không nhân đôi. Batches100 rentals, dùng PRNG xác định theo seed, lịch trải gần 12 tháng; khoảng cách cùng xe không trùng.

Tài khoản bộ lớn: demo1/2/3@bike.example và rider4…rider199@bike.example, admin@bike.example là ADMIN; mật khẩu demo chung Demo12345!. Tất cả user seed có is_demo. Review seed chỉ gắn vào đơn COMPLETED của đúng user/model, nội dung demo rõ ràng. Có favorites, 2 coupons, notifications và support. Mã/seed chỉ cho môi trường phát triển; script chặn NODE_ENV=production và seed-large chặn đường dẫn ngoài demo-large.db.

`npm run db:verify` kiểm FK, tự join tìm lịch trùng (kể cả lịch sử hoàn thành), ownership review, khoảng rating, các thành phần tiền, công thức làm tròn/discount cap và SHA-256 ảnh chính khác nhau/thumbnail tồn tại. Đặt DATABASE_URL vào đúng terminal trước lệnh. Test tự dùng test-upgrade.db riêng. Sửa lỗi cap của seed cũ chỉ áp dụng các dòng lịch sử is_demo do generator tạo trong file demo lớn, không đụng dev.db.

Xem BUSINESS_RULES.md cho coupon reservation, expiry task, extension và bảo trì. Backup/restore phát triển bên dưới vẫn áp dụng; không restore khi backend đang mở database.

## Schema ban đầu và vận hành

SQLite qua Prisma ORM 6.19.0. File mặc định `backend/prisma/dev.db` do DATABASE_URL=file:./dev.db (đường dẫn tính từ schema). Thời gian DateTime UTC, JSON API ISO 8601; UI dùng Asia/Ho_Chi_Minh. VNĐ Int, không số thực.

## Quan hệ

users 1–n rentals; stations 1–n bikes và hai quan hệ pickup/return với rentals. bike_types 1–n bike_models; bike_models 1–n bike_images và bikes. favorites là liên kết n–n user–model với khóa chính kép. Mẫu xe giữ nội dung/ảnh; chiếc xe giữ code, trạm, giá và lịch riêng.

Schema chứa các trường yêu cầu trong đề bài. `specifications` là JSON string để giữ cấu hình linh hoạt với SQLite. `status` là string để dùng Prisma SQLite 6; chỉ service được phép chuyển trạng thái, không cung cấp API sửa tùy ý. Email và mã xe unique; ảnh unique theo model/sort_order. Index trên model/type, bikes(model,station,status), rentals(bike,status,start,end), rentals(user,created).

Khóa ngoại bật trong migration và khi mở API. WAL và busy_timeout 5000ms. Transaction Serializable kiểm tra lịch và tạo đơn; lock conflict retry toàn bộ transaction tối đa 4 lần. Khoảng [start,end), BOOKED giao nhau nếu existing.start < end và existing.end > start; ONGOING khóa xe kể cả quá giờ dự kiến. Không nhận xe MAINTENANCE hoặc không còn ở trạm. Trả về trạm nhận và chốt phí trong cùng transaction.

```powershell
cd backend
npx prisma generate
npm run db:migrate
npm run db:seed
```

Seed upsert theo ID/code/email, không nhân đôi. 6 trạm, 8 loại, 24 mẫu, 48 xe, 3 users, 3 favorites, 4 đơn. Thời gian tạo đơn tính tương đối lúc seed lần đầu. Giá theo loại: 20k/35k/40k/45k/25k/60k/15k/50k VNĐ mỗi giờ. Địa chỉ, tọa độ, thông số, tên và giá chỉ là demo. Mật khẩu bcrypt cost 12.

## Reset, backup, restore

`npm run db:reset` là Prisma migrate reset tương tác: **xóa toàn bộ dữ liệu phát triển**, chạy lại migration/seed sau xác nhận. Không dùng với production; không thêm --force vào quy trình demo.

```powershell
npm run db:backup
# In ra đường dẫn backups/bike-<timestamp>.db
# DỪNG backend trước khi restore, bảo đảm không còn kết nối SQLite.
npm run db:restore -- backups/bike-<timestamp>.db --confirm
```

Backup dùng SQLite VACUUM INTO, bao gồm committed WAL. Restore ghi đè database; chỉ dành cho môi trường phát triển, chặn NODE_ENV=production. Thư mục backups không đưa lên Git. Production dùng snapshot/backup có kiểm chứng của host; lưu SQLite trên volume bền, không chạy nhiều replica ghi cùng file qua network filesystem.
