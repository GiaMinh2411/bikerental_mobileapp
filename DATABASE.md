# Database

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
