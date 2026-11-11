# API

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
