# Demo 5–7 phút

## Kịch bản bản nâng cấp (khoảng7 phút)

Chuẩn bị: dùng demo-large.db, backend4000, Expo Web8081; login demo1@bike.example / Demo12345!. Không reset database. Nếu chuyến BOOKED seed đã hết hạn, tạo đơn mới; ONGOING không tự trả chỉ vì quá giờ.

1. Phút0–1: Trang chủ tìm kiếm/trạm/giờ, 12 loại; mở catalog chọn giá/trạm/giờ và xem bộ lọc đang dùng, tải thêm. Chỉ ra60 mẫu/300 chiếc từ dữ liệu, không hardcode số lên UI.
2. Phút1–2: Chi tiết mẫu có ảnh, thông số demo, trạm, review có nhãn demo. Lưu yêu thích. Chọn trạm, bắt đầu sau5–10 phút, thuê2 giờ; nhập DEMO10 để đạt min20k với xe rẻ.
3. Phút2–3: Xem subtotal/discount/total và chính sách hủy, xác nhận. Nhận mô phỏng trong cửa sổ sớm15 phút. Mở timeline và nhấn xem phí gia hạn1 giờ, xác nhận. Giải thích transaction ngăn trùng lịch kế tiếp và request_key chống lặp.
4. Phút3–4: Trả mô phỏng; tiền thực tế có tối thiểu1 giờ và mức giảm theo snapshot. Gửi review và xem trong chi tiết mẫu; không đánh giá đơn chưa hoàn thành.
5. Phút4–5: Gửi yêu cầu BILLING/OTHER liên quan đơn, mở thông báo và trạng thái đọc. Nếu minh họa DAMAGE, dùng một chuyến đã nhận, giải thích xe chuyển bảo trì/hủy lịch sau; không nhận là IoT tự phát hiện.
6. Phút5–6: Mở AI với nhu cầu/ngân sách/trạm/thời gian. Chỉ nói Gemini đang hoạt động nếu mode là Gợi ý AI; mode bộ lọc có lý do dự phòng. Không gửi PII và không cho AI tính tiền hoặc sửa đơn.
7. Phút6–7: Logout, login admin@bike.example / Demo12345!, mở Quản trị đội xe. Xem thống kê DB, hỗ trợ mới nhất, phản hồi RESOLVED, xem xe/coupon/danh mục. Giải thích vô hiệu hóa và điều kiện đưa xe bảo trì hoạt động lại. Có thể chạy tác vụ nhắc/hết hạn thủ công.

Phần thiết bị/EAS chỉ trình diễn sau khi tự xác minh; kết quả browser không phải chứng cứ iPhone đã chạy. Bản nâng cấp không có thanh toán thật, upload, push hoặc chat trực tiếp.

## Kịch bản cơ bản ban đầu

1. 0:00–0:45: giới thiệu Expo chung web/native, Express/SQLite; mở health và đăng nhập demo1.
2. 0:45–1:45: xem trang chủ, lọc một loại xe, đổi sắp xếp và ngân sách; mở xe xem ảnh/thông số demo.
3. 1:45–2:30: yêu thích xe, mở tab Yêu thích rồi mở trạm.
4. 2:30–4:00: đặt xe bắt đầu sau 5–10 phút, kết thúc sau một giờ; kiểm tra lịch/giá, xác nhận mô phỏng, nhận xe trong cửa sổ sớm 15 phút. Trả xe mô phỏng, chỉ ra mức tối thiểu một giờ và hóa đơn chốt.
5. 4:00–4:45: đặt đơn khác rồi hủy; so sánh tab hiện tại/lịch sử.
6. 4:45–5:30: AI chọn xe theo trạm/ngân sách; thiếu key hiển thị Gợi ý theo bộ lọc, không giả là AI thật.
7. 5:30–6:15: sửa hồ sơ, logout. Giải thích quyền sở hữu và token hết hạn.
8. 6:15–7:00: mở kết quả tests, giải thích transaction và ngăn double-booking. Nếu đã kiểm tra điện thoại thật mới trình diễn Expo Go; không xem web là native.

Trước demo chạy backend, seed nếu database mới, Expo Web. Đơn seed có giờ tương đối tại lần seed đầu; không dùng đơn BOOKED cũ để nhận xe quá cửa sổ. Có thể đặt đơn mới để demo, không bắt buộc reset.
