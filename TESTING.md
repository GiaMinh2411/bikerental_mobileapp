# Kiểm thử thực tế

## Cập nhật tương thích Expo Go SDK 58

Project đã nâng từ SDK 57 lên SDK 58 theo lỗi không tương thích trên iPhone: Expo ~58.0.23, React/React DOM 19.3.0, React Native 0.88.1 và các module native do `expo install --fix` chọn. Typecheck và lint PASS; Expo Doctor 20/20 PASS; `expo install --check` PASS; export web, Android và iOS PASS (web khoảng 2.1 MB, native khoảng 3.9 MB mỗi bundle). Chưa xác minh trên iPhone thật. Các kết quả kiểm thử đầy đủ bên dưới là kết quả trước lần nâng SDK, không thay thế regression test trên thiết bị. Địa chỉ API LAN trong mobile/.env được giữ nguyên.

Dừng Metro cũ bằng Ctrl+C, chạy lại `cd mobile` rồi `npx expo start --clear --lan` và quét QR mới bằng Expo Go SDK 58. Không cần cài Expo Go SDK 57 trên iPhone.

Smoke test Chrome sau nâng SDK: màn hình đăng nhập render thành công, không có page error; chưa chạy lại toàn bộ luồng thuê trên SDK 58.

Ngày 11/11/2026, Windows, Node 24.13.0. Đây là kết quả chạy trong môi trường phát triển, không phải chứng nhận thiết bị thật.

| Kiểm tra                                  | Kết quả                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Backend TypeScript và ESLint              | PASS                                                                                                                |
| Mobile TypeScript và ESLint               | PASS                                                                                                                |
| Prisma migrate dev tạo migration init     | PASS; migration đã lưu trong source                                                                                 |
| Seed và seed lại                          | PASS; 3 users, 6 trạm, 8 loại, 24 mẫu, 48 xe; không nhân đôi                                                        |
| Ảnh cục bộ                                | PASS: 24 SHA-256 khác nhau, 24 thumbnail; tổng ảnh chính 1.98 MB                                                    |
| `npm test` backend                        | PASS: 2 test cases, nhiều assertions xuyên suốt API                                                                 |
| Expo install --check                      | PASS: Dependencies are up to date                                                                                   |
| Expo Doctor                               | PASS: 21/21 checks, đã cài expo-font trực tiếp                                                                      |
| Expo export web                           | PASS: JS bundle khoảng 2 MB, import riêng Ionicons                                                                  |
| Expo export android và ios                | PASS: mỗi Hermes bundle khoảng 3.8 MB; chỉ kiểm tra biên dịch                                                       |
| Chrome headless                           | PASS: thuê xuyên suốt, advice fallback, chi tiết trạm, yêu thích, sửa hồ sơ, cài đặt và logout                      |
| Responsive                                | PASS kiểm tra tràn ngang ở 1440/1024/768/390/320 cho Home, Detail, Booking; có 15 screenshot trong docs/screenshots |
| Xem ảnh chụp                              | Đã xem Home desktop/mobile, Detail desktop/mobile, Booking desktop/mobile; sửa lỗi lineHeight Tamagui Web           |
| API restart và lưu bền                    | PASS: restart tiến trình, đăng nhập và đọc dữ liệu SQLite cũ được                                                   |
| Backup                                    | PASS: VACUUM INTO tạo snapshot trong backend/backups                                                                |
| Gemini thật                               | Chưa chạy: chưa có GEMINI_API_KEY                                                                                   |
| Expo Go Android/iOS thật                  | Chưa kiểm tra trên thiết bị                                                                                         |
| APK/EAS, iOS signing, deploy, GitHub push | Chưa thực hiện                                                                                                      |

Test API bao gồm đăng ký/đăng nhập/sửa hồ sơ, 401 thiếu/hết hạn token, không xem/nhận đơn của user khác; thời gian quá khứ và end<=start; hai request đồng thời cùng chiếc xe chỉ một 201 và một 409; khoảng sát nhau end=start được phép; nhận quá sớm bị từ chối; trả đơn BOOKED bị từ chối; ONGOING quá giờ vẫn khóa xe; cancel chỉ BOOKED; pickup/return/cancel gọi lặp không chuyển sai hoặc tính lại tiền; favorites upsert không trùng; phí tối thiểu và làm tròn; fallback advice chỉ có ID database và đúng ngân sách. Seed kiểm tra số lượng không tính các đơn COMPLETED phát sinh từ browser demo là dữ liệu trùng seed.

## Chạy lại

```powershell
cd backend
npm run typecheck
npm run lint
npm test
npx tsx scripts/verify-data.ts
npm run db:backup
cd ..\mobile
npm run typecheck
npm run lint
npx expo install --check
npx expo export --platform web
```

Để chạy browser test, mở backend ở terminal khác, bảo đảm cổng 8081 trống, rồi `cd backend; node scripts/web-check.mjs`. Script hiện dùng Chrome tại `C:/Program Files/Google/Chrome/Application/chrome.exe`; sửa executablePath nếu máy có vị trí khác. Test dùng build mobile/dist, phục vụ HTTP localhost:8081, đóng đúng browser đã mở và server sau kiểm tra. Có tạo một đơn thuê mô phỏng hoàn thành trong database. Nếu cần lưu Android bundle riêng: `npx expo export --platform android --output-dir dist-android`; mặc định export vào dist sẽ thay build web.

Postman: import hai file trong docs/postman, chọn environment local, gọi Login để tự lưu token; Availability → Book tự lưu rental_id → Pickup → Return. Để thử Cancel tạo đơn mới rồi Cancel, không gọi Cancel sau Return. Clear biến start/end để tạo giờ demo mới khi đã quá hạn.

## Kiểm tra thủ công còn cần

- Expo Go: cùng LAN, IPv4 thật, ảnh không fallback, lưu/khôi phục token, 401 về Login, logout không back vào tài khoản.
- iOS/Android: safe area tai thỏ, bàn phím che input, xoay ngang, text scaling, screen reader và giảm chuyển động.
- Web: Tab/focus, sessionStorage bị chặn, mất mạng/timeout, retry, trường rỗng, giới hạn input, thay kích thước lúc đang mở form.
- Restore: dừng backend, sao lưu hiện tại, restore trên database phát triển riêng theo DATABASE.md, so sánh counts và mở app. Chưa thử ghi đè database đang demo.
- Gemini: đặt GEMINI_API_KEY và GEMINI_MODEL tại backend/.env, restart; gọi /advice với nhiều mục đích, kiểm tra mode AI; key sai/model sai/timeout phải trả Gợi ý theo bộ lọc. Thử prompt yêu cầu ID không tồn tại, bảo đảm không xuất hiện xe ngoài database; thử budget thấp và trạm không có xe.
- Production: kiểm tra HTTPS, CORS, SQLite/media trên volume, backups qua restart host, cấu hình proxy/rate limit.

## Dependency audit và giới hạn

Npm audit trong lần cài phát hiện backend 11 advisories (4 high, 7 moderate), mobile 10 moderate. Các high được truy tới Prisma CLI/config và deepmerge-ts/effect của nhánh Prisma 6; không tự nâng major lên Prisma 7 vì thay đổi adapter/config. Cần đánh giá/nâng cấp có kiểm thử trước triển khai thật. Không tuyên bố audit sạch. React/React DOM đã đồng bộ 19.2.3 và npm dedupe loại các peer bản 19.3.1; expo install --check đã PASS.

Không chạy website gate của Taste Skill trên native rồi coi là PASS. Đã điều chỉnh cho ứng dụng theo yêu cầu: TypeScript/lint, API integration, bundle native, Chrome thực và screenshot. Chưa đo performance trên điện thoại thật.
