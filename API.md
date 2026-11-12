# API

## API nâng cấp (giữ tương thích endpoint cũ)

Pagination mới trả `{items,total,page,limit,has_more}`; page>=1, limit mặc định12 và tối đa40. Thứ tự luôn có ID để phá hòa. Không tải toàn bộ 2.400 đơn vào Redux. Các endpoint cũ /models và /rentals vẫn trả array có giới hạn (40 mẫu, 20 đơn); client nâng cấp dùng /catalog, /my-rentals, /my-favorites.

| Endpoint                          | Auth     | Nội dung                                                                                                                                 |
| --------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| GET /catalog                      | Không    | q,type,station,min,max,start,end,sort=price_asc/price_desc/name,page,limit; lọc lịch ở backend; sắp xếp theo giá của xe thực sự khớp lọc |
| GET /models/:id/reviews           | Không    | page,limit; review public không email/phone, có is_demo và average                                                                       |
| GET /favorite-status/:id          | Có       | saved của model theo user hiện tại                                                                                                       |
| GET /my-favorites                 | Có       | Danh sách mẫu đã lưu, phân trang                                                                                                         |
| GET /my-rentals                   | Có       | group=current/history/all, phân trang, chạy bù expiry                                                                                    |
| POST /availability                | Tùy chọn | Thêm coupon_code; cần token nếu dùng coupon; trả subtotal/discount/other_fees/total/policy, không giữ chỗ                                |
| POST /rentals                     | Có       | Thêm coupon_code, request_key (8–100 ký tự); cùng key/body trả lại đơn cũ, đổi body bị409                                                |
| GET /rentals/:id                  | Có       | Thêm review, events (tối đa80), tickets (10), snapshot tiền/mã                                                                           |
| POST /rentals/:id/extension-quote | Có       | `{end:ISO8601}`; trả dự toán tổng mới và additional_total                                                                                |
| POST /rentals/:id/extend          | Có       | `{end,request_key}`; transaction kiểm lại, lưu kết quả chống gửi lặp                                                                     |
| PUT /rentals/:id/review           | Có       | `{rating:1..5,content:5..1000}`; upsert một review/đơn COMPLETED, sửa trong7 ngày                                                        |
| GET /coupons                      | Có       | Mã active trong thời gian hiệu lực, hạn mức kiểm lại lúc đặt                                                                             |
| GET /notifications                | Có       | Phân trang, thêm unread tổng; chỉ của user                                                                                               |
| PATCH /notifications/:id/read     | Có       | Idempotent, không truy cập thông báo người khác                                                                                          |
| GET /support                      | Có       | Phân trang yêu cầu của user                                                                                                              |
| POST /support                     | Có       | `{rental_id,kind:DAMAGE/BILLING/OTHER,description:10..2000}`; DAMAGE chuyển bảo trì và hủy lịch BOOKED liên quan                         |
| GET /admin/stats                  | ADMIN    | Counts, tổng final_total COMPLETED và xe thuê nhiều từ DB                                                                                |
| GET /admin/:resource              | ADMIN    | Phân trang stations/types/models/bikes/coupons/rentals/support                                                                           |
| POST /admin/:resource             | ADMIN    | Tạo stations/types/models/bikes/coupons; whitelist field theo schema                                                                     |
| PATCH /admin/:resource/:id        | ADMIN    | Cập nhật đầy đủ form cùng schema tạo; support cần status,response; rentals chỉ đọc                                                       |
| PUT /admin/models/:id/images      | ADMIN    | path cục bộ tồn tại dạng media/bike-N.webp, alt_text, sort_order0..5; upsert gallery slot                                                |
| POST /admin/tasks/run             | ADMIN    | Chạy expiry và nhắc giờ, trả expired/checked                                                                                             |

Form trạm: name,address,latitude,longitude,active. Loại: name,description,active. Mẫu: name,type_id,brand,description,specifications (JSON object string),active. Xe: code,bike_model_id,station_id,price_per_hour,status ACTIVE/MAINTENANCE. Coupon: code,kind PERCENT/FIXED,value,max_discount,min_subtotal,starts_at,ends_at,max_uses,per_user_limit,active. Không có delete API. Support admin: status OPEN/IN_PROGRESS/RESOLVED,response5..2000. Profile không nhận role; role không lấy từ JWT claim client.

403 nếu USER gọi admin; 409 nếu trùng lịch, hết lượt mã, tái dùng key cho body khác hoặc chuyển trạng thái không hợp lệ. Body JSON malformed400, quá32KB413. ID path phải số. Review/notification/rental/ticket kiểm quyền bằng user_id từ token.

Advice truy vấn catalog phân trang trước (tối đa12 candidates), gửi ID/tên/loại/giá và nhu cầu, không gửi user email/phone hoặc toàn bộ lịch sử. Gemini chỉ chọn ID hợp lệ, backend giữ thứ tự chọn, từ chối ID ngoài candidates; giá và xe lấy từ DB. Trả mode và fallback_reason (NOT_CONFIGURED/NO_CANDIDATES/PROVIDER_HTTP_xxx/PROVIDER_TIMEOUT_OR_INVALID_RESULT). Log provider/IDs hoặc mã fallback, không log key. Không đổi đơn/tính tiền bằng AI. Gợi ý rỗng hướng dẫn đổi ngân sách/trạm/giờ thay vì bịa xe.

Postman: collection BikeRentalUpgrade bổ sung user/admin flow. Login admin tự lưu admin_token riêng, không có token/key thật trong environment mẫu.

## Endpoint cơ bản giữ lại

Base URL mặc định http://localhost:4000, JSON, Bearer JWT 12 giờ. Không refresh token trong demo. HTTP 401 làm app xóa token và quay về đăng nhập. POST auth giới hạn 20/phút/IP; advice 10/phút/IP. Axios timeout 15s, Gemini 10s. API key chỉ backend.

| Method / path            | Auth  | Request / kết quả                                                                     |
| ------------------------ | ----- | ------------------------------------------------------------------------------------- |
| GET /health              | Không | status ok khi database truy cập được                                                  |
| POST /auth/register      | Không | full_name, email, password (8–72 ký tự) → user, token                                 |
| POST /auth/login         | Không | email, password → user, token                                                         |
| GET /me                  | Có    | Hồ sơ không password_hash                                                             |
| PATCH /me                | Có    | full_name (2–80), phone (0–20)                                                        |
| GET /types               | Không | 8 loại xe                                                                             |
| GET /stations            | Không | Trạm, _count.bikes                                                                    |
| GET /stations/:id        | Không | Trạm, xe và mẫu xe                                                                    |
| GET /models              | Không | q, type, station, max, sort=price_asc/price_desc/name                                 |
| GET /models/:id          | Không | Loại, ảnh, thông số JSON string, xe vật lý/trạm                                       |
| POST /availability       | Không | model_id, station_id, start, end → available, hourly_rate, estimated_total            |
| GET /favorites           | Có    | Mẫu xe đã lưu của user hiện tại                                                       |
| PUT /favorites/:id       | Có    | Thêm model, idempotent                                                                |
| DELETE /favorites/:id    | Có    | Xóa model, idempotent                                                                 |
| GET /rentals             | Có    | Chỉ đơn của user hiện tại                                                             |
| GET /rentals/:id         | Có    | Chi tiết đơn của user hiện tại                                                        |
| POST /rentals            | Có    | model_id, station_id, start, end → 201 Rental                                         |
| POST /rentals/:id/cancel | Có    | BOOKED → CANCELLED                                                                    |
| POST /rentals/:id/pickup | Có    | BOOKED → ONGOING                                                                      |
| POST /rentals/:id/return | Có    | ONGOING → COMPLETED, chốt tiền mô phỏng                                               |
| POST /advice             | Có    | purpose, budget, station_id, start, end, type_id tùy chọn → mode, explanation, models |

start/end ISO 8601 có offset, thời gian bắt đầu tương lai, end > start, tối đa 7 ngày. Giá tính ở server; client không gửi hourly_rate, final_total hay bike_id. Server gán chiếc xe trống. Chỉ trả về trạm nhận. Nhận xe từ start-15 phút đến start+30 phút và trước planned_end. Hủy chỉ BOOKED, trả chỉ ONGOING; lặp lại đúng action đã hoàn tất trả kết quả cũ, không tính tiền lần hai. Một request tạo đơn mới là một booking mới; frontend chặn gửi lặp khi đang xử lý.

Lỗi: `{message, fields?}`. 400 validation, 401 token/auth, 404 không có dữ liệu hoặc không sở hữu, 409 lịch đầy/trạng thái/email trùng, 429 rate limit, 500 lỗi máy chủ chung. fields là object mảng thông báo theo tên trường khi Zod validation thất bại. ID không thuộc user không tiết lộ dữ liệu.

Mỗi image.path là `media/bike-N.webp`; client nối vào API_URL. Không chứa origin trong database. API phục vụ media cục bộ qua Express static. Không có upload file, payment thật hoặc admin API.
