# Đối chiếu yêu cầu

## Bản nâng cấp 12/11/2026

| Hạng mục                              | Kết quả hiện tại                                                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Giữ framework/navigation/ORM/database | Expo58 + React Navigation + Prisma6/SQLite, không khởi tạo lại                                                                         |
| UI app, token, states, responsive     | Home tìm kiếm/trạm/giờ/chuyến hiện tại; FlatList1/2/3 cột; modal select; badge/skeleton/empty/retry; gallery hỗ trợ nhiều ảnh          |
| Seed lớn riêng                        | 12 loại/60 mẫu/300 xe/20 trạm/200 users/2.402 đơn và600 review lúc seed; có favorites/notifications/coupons/support                    |
| Seed nhỏ và bảo toàn dữ liệu          | Không reset dev.db; backup trước migration; giữ24 mẫu và dữ liệu cũ, bổ sung admin/coupon bằng upsert                                  |
| Ảnh                                   | 60 ảnh chính khác nhau +60 thumbnail, lưu media; chưa có20 bộ góc phụ được xác minh                                                    |
| Thuê/gia hạn/fee                      | Transaction, key chống retry, expiry/no-show, early pickup guard, snapshot giá/coupon, bảng tiền và timeline                           |
| Review                                | Owner COMPLETED,1 review/đơn, sửa7 ngày, điểm trung bình từ DB, nhãn demo                                                              |
| Coupon                                | Date/min/cap/global/user limits, RESERVED/USED/RELEASED transaction, hoàn lượt khi hủy/hết hạn                                         |
| Notifications                         | Nội bộ/read/unread/deep link đơn/dedupe theo mốc, startup/30s/manual tasks                                                             |
| Support/bảo trì                       | Owner ticket, DAMAGE đưa xe bảo trì/hủy lịch sau, admin giải quyết và điều kiện ACTIVE                                                 |
| Admin                                 | USER/ADMIN backend, quản lý danh mục/xe/trạm/coupon, đơn read-only, support, stats từ DB; không xóa lịch sử                            |
| AI                                    | <=12 candidates lọc DB, ID/giá kiểm chứng, timeout/rate limit, mode/reason fallback/log không key; không tính tiền/sửa đơn             |
| Phân trang                            | Catalog, đơn, favorites, reviews, notifications, admin; bounded legacy endpoints; Redux bootstrap6 mẫu/3 đơn                           |
| Kiểm thử                              | Typecheck/lint,4 integration test cases, browser flow đầy đủ và responsive; verify-data/FK/fee/images; chưa thiết bị/APK/deploy        |
| Tài liệu/Postman                      | README/DESIGN/DATABASE/BUSINESS_RULES/API/IMAGE_SOURCES/TESTING/DEMO_SCRIPT/UPGRADE_SUMMARY; user/admin collection và env không secret |

Chi tiết bằng chứng, số lượng sau các thao tác browser và giới hạn nằm TESTING.md/UPGRADE_SUMMARY.md. Bảng dưới là đối chiếu của phiên bản đầu, không phải giới hạn dữ liệu của demo-large hiện tại.

## Phiên bản đầu

| Yêu cầu                                           | Triển khai                                                                                                                       | Kiểm chứng                                        |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| React Native + Expo + TS từ đầu, chung web/native | mobile/App.tsx, đã nâng từ SDK57 lên SDK58                                                                                       | Export web/Android/iOS PASS; native thật chưa thử |
| Tamagui/theme/responsive/animation                | src/theme, components/ui.tsx                                                                                                     | Typecheck, ảnh chụp 5 kích thước                  |
| Axios, Redux Toolkit, createAsyncThunk            | services/api, slices/session và data                                                                                             | API và browser workflow                           |
| React Navigation stack + 5 tabs                   | navigation/index.tsx                                                                                                             | Web navigation PASS                               |
| Express TS + SQLite/Prisma                        | backend/src, prisma                                                                                                              | Migrate/seed/typecheck/lint PASS                  |
| 1. Auth                                           | auth middleware, auth endpoints, AuthScreen                                                                                      | Register/login/expired token tests                |
| 2. Hồ sơ                                          | /me GET/PATCH, AccountScreen                                                                                                     | API test cập nhật hồ sơ                           |
| 3. Xe và trạm                                     | Models/Stations endpoints/screens                                                                                                | 24 models, 6 stations verified                    |
| 4. Tìm/lọc/sắp xếp                                | /models q/type/station/max/sort                                                                                                  | UI có bộ lọc, browser catalog chạy                |
| 5. Chi tiết/thông số/lịch                         | ModelScreen, /availability                                                                                                       | Quote server và screenshot                        |
| 6. Đặt theo thời gian/giá                         | Booking + Confirm + service                                                                                                      | Browser flow + concurrent API                     |
| 7. Đơn hiện tại/lịch sử/hủy                       | RentalsScreen/RentalScreen                                                                                                       | API cancel/state tests                            |
| 8. Nhận/trả/phí                                   | pickup/return transaction                                                                                                        | Browser flow, idempotency/billing tests           |
| 9. Yêu thích                                      | Favorite model relation, endpoints/screens                                                                                       | Upsert uniqueness test                            |
| 10. AI                                            | AdviceScreen, /advice DB candidates + Gemini                                                                                     | Fallback PASS; AI thật cần key                    |
| Khoảng 15 màn hình                                | Login, Register, Home, Models, Model, Stations, Station, Booking, Confirm, Rentals, Rental, Favorites, Advice, Account, Settings | 15 route/screen chức năng                         |
| 8 bảng và indexes/FK                              | schema.prisma + init migration                                                                                                   | FK PRAGMA test, counts                            |
| 6/8/24/48/3 seed                                  | prisma/seed.ts                                                                                                                   | Seed lặp và verify-data PASS                      |
| 24 ảnh chính riêng và thumbnails                  | backend/media                                                                                                                    | 24 hashes + 24 thumbnails                         |
| 8 mẫu x 2 ảnh phụ                                 | Chưa có bộ góc cùng chiếc xe đã xác minh                                                                                         | Còn thiếu 16 ảnh phụ, ghi IMAGE_SOURCES           |
| Đa dạng loại/màu/bối cảnh                         | 8 loại, 24 xe, nhiều màu; bộ ảnh studio                                                                                          | Bối cảnh ngoài trời chưa có                       |
| Chống trùng server, ONGOING quá giờ               | rentals service, Serializable retry                                                                                              | Concurrent và overdue tests PASS                  |
| Giá snapshot, làm tròn, trả trạm nhận             | rentals service                                                                                                                  | API/billing tests PASS                            |
| Bảo vệ dữ liệu user                               | JWT subject, where user_id                                                                                                       | Unauthorized tests PASS                           |
| Token native/web riêng                            | utils/token.ts và token.web.ts                                                                                                   | Web PASS; SecureStore thiết bị chưa thử           |
| Không secret Expo                                 | backend/.env, mobile public endpoint only                                                                                        | Có .gitignore và env examples                     |
| EAS APK và phân phối                              | mobile/eas.json + DEPLOY                                                                                                         | Chưa build: cần tài khoản/project/backend HTTPS   |
| Tài liệu/giải thích/kế hoạch/demo                 | 11 Markdown yêu cầu ở root                                                                                                       | Đã tạo                                            |
| Postman collection/environment                    | docs/postman                                                                                                                     | JSON import schema v2.1, auth/booking script      |
| GitHub ready                                      | Source, locks, .gitignore                                                                                                        | Chưa push theo phạm vi quyền                      |

Các giới hạn cần chủ dự án hoàn tất: GEMINI_API_KEY để thử AI thật; điện thoại Expo Go tương thích SDK58; tài khoản Expo/EAS và backend HTTPS có lưu bền để build/phân phối; Apple signing nếu phát hành iOS. Không coi bundle Android thành công là đã chạy Android, không coi EAS config là APK đã build.
