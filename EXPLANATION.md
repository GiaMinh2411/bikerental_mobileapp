# Giải thích mã nguồn để bảo vệ bài

## Điểm mới cần giải thích khi bảo vệ bản nâng cấp

API route cơ bản vẫn ở app.ts; routes/features.ts quản lý các endpoint mới, role ADMIN kiểm lại từ DB. services/catalog.ts thực hiện filter/groupBy/min price, phân trang và aggregate review, không query một lần riêng cho từng xe. services/rentals.ts giữ quy tắc chung, services/booking.ts xử lý transaction/coupon/idempotency/extension/tasks. Các dữ liệu tiền không nhận từ UI.

Mỗi ý định đặt có request_key ổn định trên ConfirmScreen. Hash nội dung và unique(user,key) ngăn gửi lại tạo đơn mới; trong transaction phải tìm key cũ trước kiểm tra lịch và hạn mức mã. Gia hạn lưu RentalAction/result để retry nhận lại cùng dự toán, không thêm event lần hai. Coupon count RESERVED+USED trong transaction; cancel/expire giải phóng slot. Đây là điểm cần giải thích cho hai request đồng thời.

usePaged giữ dữ liệu từng màn hình và page metadata, bỏ response cũ theo sequence, làm mới khi màn hình focus. ScreenList dùng FlatList để không render toàn bộ lịch sử; Redux chỉ bootstrap thông tin dùng chung có giới hạn. Các màn hình CatalogUpgrade/RentalsUpgrade thay phần triển khai cũ, wrapper Catalog.tsx/Rentals.tsx giữ tương thích import; navigation vẫn là React Navigation.

runTasks chạy startup/30 giây/manual và khi mở dữ liệu cần catch-up; dedupe_key ngăn spam thông báo. ONGOING quá giờ không thành COMPLETED hoặc sẵn sàng tự động. Khi có DAMAGE, xe MAINTENANCE và lịch BOOKED sau được hủy/hoàn mã trong transaction; admin phải giải quyết ticket trước khi active lại.

Đánh giá gắn rental_id unique, kiểm user/status và cửa sổ sửa. Stats và rating từ aggregate database; seed review có nhãn demo, không dùng làm testimonial thật. Seed-large tạo database riêng, PRNG có seed, batches nhỏ, verify độc lập bắt lỗi cap/lịch/ownership. Kết quả browser/native bundle không chứng minh điện thoại thật hay production đã được kiểm tra.

## Luồng cơ bản ban đầu

Màn hình React Native hiển thị Tamagui YStack/XStack/Text và shared components. React Navigation có auth stack, năm bottom tabs, các stack chi tiết và quy trình đặt. Đăng nhập thay toàn bộ nhánh navigation nên không back vào màn hình riêng tư sau logout.

Redux session slice dùng createAsyncThunk cho restore và login/register. data slice dùng createAsyncThunk loadData với pending/fulfilled/rejected, quản lý catalog, trạm, favorites, rentals. Sau thao tác mutation, dispatch loadData cập nhật dữ liệu liên quan. State form nằm local để giữ dữ liệu khi request lỗi. Axios instance thêm token và xử lý 401 tập trung. Web dùng token.web.ts; Metro chọn token.ts cho native với SecureStore.

Luồng thuê: màn hình Booking chọn model/station và giờ Việt Nam → đổi thành ISO UTC → POST availability → xác nhận → POST rentals → backend validate → transaction tìm chiếc xe ACTIVE không có lịch giao nhau và không ONGOING → tạo Rental với đơn giá snapshot. Quote không giữ chỗ; booking luôn kiểm tra lại. Xung đột SQLite retry toàn bộ transaction. API kiểm tra quyền user từ JWT, không nhận user_id trong body.

Pickup xác nhận khung giờ, trạng thái xe/trạm và không có ONGOING khác. Return lấy actual_start, làm tròn phí theo giờ, cập nhật Rental và Bike cùng transaction. Lặp return lấy hóa đơn đã chốt nên không bị tính lại. Hoạt động trả về trạm nhận; không hỗ trợ trả khác trạm.

AI: backend lọc database theo trạm, giá, loại và khoảng thời gian; chỉ đưa candidates vào prompt. Provider chọn ID trong candidates, không được quyết định giá, tồn kho hoặc tạo xe. Backend kiểm tra JSON và ID, lấy nguyên record database. Nếu không có key/lỗi/timeout/ID sai, trả bộ lọc; nhãn giao diện phân biệt rõ. Mục đích dùng để xếp hạng; vẫn cần kiểm tra lại lịch khi đặt.

Chọn SQLite cho quy mô bài tập một backend, dễ cài trên Windows; không phù hợp mở rộng nhiều replica. JWT không có revoke server, logout xóa token local; token bị lộ vẫn dùng đến khi hết hạn. Production cần HTTPS, rate limit qua reverse proxy đúng trust proxy, quản lý key, backups và cơ chế session/revocation nếu mở rộng.
