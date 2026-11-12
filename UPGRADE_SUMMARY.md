# Bàn giao nâng cấp Bike Rental App

## Phạm vi hoàn thành

Giữ kiến trúc React Native/Expo SDK58/Tamagui/Redux Toolkit/Axios/React Navigation và Express/Prisma6/SQLite. Không chuyển Router, framework hoặc database. Đã đọc Taste Skill, điều chỉnh cho app thay vì landing page. `.agents` và skills-lock.json không sửa; `.env` với Gemini key/API LAN của người dùng được giữ nguyên.

Migration mới thêm role/active, các thành phần tiền/snapshot, idempotency key, reviews, coupons/redemptions, rental events/actions, notifications và support. Backup database hiện có trước thay đổi; không reset. Migration đã áp dụng trên dev.db; db demo-large/test riêng. Khi backend watch giữ DLL/SQLite, đã dừng đúng backend để migrate, giữ Expo Web.

Nghiệp vụ từ tìm lịch đến đánh giá: backend gán xe trong transaction, chống trùng/xe quá giờ/bảo trì; đặt/gia hạn có key chống retry; coupon giữ/hoàn lượt trong transaction; expiry và nhắc giờ có lịch30 giây/startup/manual; nhận/trả/fee theo snapshot; timeline sự kiện; review đúng người/đơn hoàn thành, sửa7 ngày; ticket sự cố đưa xe bảo trì/hủy lịch BOOKED liên quan; admin có phân quyền thực và điều kiện đưa xe lại hoạt động.

UI nâng cấp Home/Catalog/Detail/Booking/Rental cùng shared tokens, states, select modal, FlatList và phân trang backend. Có thêm thông báo, mã ưu đãi, hỗ trợ, admin tách khu riêng, giữ5 tab người dùng. Catalog/đơn/favorites/reviews/notifications/admin phân trang; Redux bootstrap chỉ6 mẫu/3 chuyến hiện tại và danh mục nhỏ. Giữ endpoint cũ có giới hạn, client mới dùng endpoint phân trang.

## Dữ liệu và ảnh thực tế

Seed lớn riêng: **12 loại,60 mẫu,300 chiếc,20 trạm,200 tài khoản,2.400 lịch sử +2 đơn hiện tại,600 review demo**,2 coupon,favorites,199 thông báo và20 support lúc seed lần đầu. Các thao tác browser sau seed bổ sung record hợp lệ. Giá/coupon/công thức phí/ownership review/FK/lịch trùng đã kiểm tra bằng script; cap discount seed được kiểm tra và sửa đúng trước bàn giao. Seed nhỏ giữ24/48/6, thêm admin và DEMO10 mà không nhân đôi/xóa dữ liệu.

**60 ảnh chính khác nhau +60 thumbnail cục bộ**,5.409.804 bytes ảnh chính.36 ảnh mới được tạo bằng built-in image_gen, subject/prompt lưu docs/upgrade-image-prompts.json, asset ở backend/media. Không hotlink, không dùng logo/brand giả, không đếm fallback/crop/contact sheet như ảnh mới. Chưa có bộ góc phụ được xác minh cho20 mẫu; gallery/API đã hỗ trợ slot ảnh, số ảnh phụ hiện là0.

## Kiểm tra và giới hạn

Trạng thái cuối: Expo Doctor20/20 PASS và export web/Android/iOS PASS; dữ liệu demo sau kiểm thử có2.404 đơn,602 review,211 thông báo và22 yêu cầu hỗ trợ. Seed vẫn giữ số gốc, thao tác UI tạo record mới hợp lệ.

Typecheck/lint backend và mobile PASS;4 test cases integration API PASS với nhiều assertions về tranh chấp/ownership/discount/extension/review/maintenance/idempotency. Chrome chạy đầy đủ flow nâng cấp và admin response PASS, không page error/media404. Đã chụp/xem màn hình, kiểm tra ngang/dọc và5 kích thước. Đo30 catalog requests Supertest: p50 8,89ms/p95 16ms, payload tối đa33.996bytes trên máy hiện tại, không suy rộng sang điện thoại hay production.

Chưa có kiểm tra điện thoại thật sau nâng UI, Gemini thật trong lần này, APK/EAS build, deploy hoặc push. AI vẫn có fallback rõ ràng; không cần key để demo phần còn lại. Chưa có bộ góc phụ; không có upload, push, chat, thanh toán thật hoặc đặt cọc. Scheduler trong tiến trình một backend SQLite, không phải hàng đợi job phân tán; nhiều backlog xử lý qua nhiều lượt. Các thông báo/email liên hệ không được gửi ra ngoài.

Npm dependency audit còn các advisories đã ghi ở TESTING.md; không tự đổi major Prisma trong lần này. Không tuyên bố production-ready hoặc audit sạch. Lưu SQLite/media trên volume bền, HTTPS và backup đã thử restore trước khi mở internet.

## Chạy thử

Theo README.md: dừng backend trước migrate/seed; backend `npm run db:migrate`, `npm run db:demo-large -- --seed=42 --rentals=2400`, đặt `$env:DATABASE_URL="file:./demo-large.db"`, `npm run dev`. Mobile giữ API_URL4000 và `npm run web`. Người dùng demo1@bike.example, admin@bike.example, cùng Demo12345!. Muốn quay về dữ liệu cũ, bỏ biến DATABASE_URL của terminal để dùng backend/.env.

Tài liệu cập nhật: README, DESIGN, DATABASE, BUSINESS_RULES, API, IMAGE_SOURCES, TESTING, DEMO_SCRIPT và các collection Postman. Source test nằm backend/tests và scripts; ảnh chụp ở docs/screenshots-upgrade.
