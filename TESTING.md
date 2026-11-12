# Kiểm thử thực tế

## Bản nâng cấp dữ liệu và nghiệp vụ — 12/11/2026

Kết quả cuối: Expo Doctor20/20 PASS, dependency check PASS sau cập nhật các bản vá SDK58; export web/Android/iOS PASS (web2.1MB, native khoảng3.9MB). Database demo sau2 lượt browser: **200 users,12 loại,60 mẫu,300 xe,20 trạm,2.404 đơn,602 reviews,211 notifications,22 tickets**,60 ảnh chính/60 thumbnail. Hai lượt tạo thêm2 đơn hoàn thành/2 review/2 ticket so với seed, không phải nhân đôi seed.

Database người dùng đã backup trước migration bổ sung; không reset dev.db. Tests nay chạy trên test-upgrade.db riêng, không dùng Gemini key thật, còn browser test trên demo-large.db riêng. Đã dừng đúng backend watch để giải phóng Prisma DLL/SQLite khi migrate, giữ Metro của người dùng.

- Backend và mobile typecheck/lint: PASS.
- npm test: 4 test cases nhiều assertions xuyên suốt API, PASS. Bao gồm double-booking, hai request dùng mã lượt cuối trên hai xe khác nhau, release lượt sau cancel, cùng key đặt trả cùng đơn, đổi payload cùng key409, review trước hoàn thành409, quyền review/notifications/admin, gia hạn trùng lịch409, retry và đồng thời gia hạn không sinh event lần hai, sự cố đưa xe bảo trì/hủy lịch sau, return/fee/discount, sửa review, phản hồi admin và pagination không lặp giữa trang.
- Seed lớn lần đầu: 12 loại/60 mẫu/300 xe/20 trạm/200 users/2.402 rentals/600 reviews demo/199 notifications/20 tickets/2 coupons. Chạy lại không nhân đôi ID seed; các thao tác browser có thể thêm rental/review/ticket/notification hợp lệ.
- verify-upgrade: FK PASS, lịch sử thuê không trùng PASS, ownership/rating review PASS, subtotal/discount/total và công thức phí/cap PASS. Kiểm tra cap nâng cao đã bắt lỗi seed giảm vượt25k; sửa generator và chỉ repair dữ liệu seed tương ứng ở demo-large.db.
- Kiểm tra lịch lịch sử dùng thời gian thực tế cho COMPLETED: trả sớm giải phóng xe nên không coi planned window cũ là còn giữ chỗ. Với BOOKED dùng lịch dự kiến, ONGOING dùng lúc nhận đến ít nhất hiện tại/giờ dự kiến. Các dòng legacy chưa có final_discount được hiểu0 khi không có mã; không sửa/xóa lịch sử để làm kiểm tra qua.
- 60 hash ảnh chính khác nhau, 60 thumbnail tồn tại; ảnh chính tổng5.409.804 bytes. Đã xem contact sheet60 và screenshot Home desktop/mobile, Catalog desktop, Detail/Booking mobile; không cắt mất xe.
- Chrome headless luồng nâng cấp: login → catalog → detail → quote có DEMO10 → confirm → pickup → extension quote/confirm → return → review → support → notifications → logout → admin login/stats → giải quyết support: PASS. Không có page error hoặc media404.
- Screenshot tại docs/screenshots-upgrade: Home1440/1024/768/390/320 và844×390 ngang; Detail/Booking1440/768/390/320; catalog/admin desktop. Kiểm tra không tràn ngang. Đã sửa role review demo trên card để không xem số seed như bằng chứng khách hàng thật.
- Đo30 GET /catalog với page12 trên60 models/2.404 rentals bằng Supertest trong tiến trình Windows: p50 **8,89ms**, p95 **16ms**, payload lớn nhất33.996 bytes. Đây không phải đo mạng, điện thoại, tải đồng thời hoặc cam kết production. Lệnh scripts/measure-catalog.ts cho phép đo lại sau thay đổi dữ liệu.

### Chạy kiểm tra lại

```powershell
cd backend
npm test
npm run typecheck
npm run lint
$env:DATABASE_URL="file:./demo-large.db"
npm run db:verify
npx tsx scripts/measure-catalog.ts
```

Browser test cần backend demo riêng, không dùng API/key thật:

```powershell
# Terminal A, backend
$env:DATABASE_URL="file:./demo-large.db"
$env:PORT="4100"
$env:CORS_ORIGINS="http://localhost:8181"
$env:GEMINI_API_KEY=""
npm run build
npm start
# Terminal B, mobile: chỉ thay biến của tiến trình, không sửa .env
$env:EXPO_PUBLIC_API_URL="http://localhost:4100"
npx expo export --platform web --output-dir dist-review
cd ..\backend
node scripts/web-upgrade-check.mjs
```

Chrome mặc định C:/Program Files/Google/Chrome/Application/chrome.exe, có thể đặt BROWSER_PATH. Script tự phục vụ build cổng8181 và đóng server/browser. Test có tạo một chuyến hoàn thành, review và support thật trong **database demo**. Không chạy đồng thời với người đang demo cùng tài khoản nếu không muốn thay dữ liệu demo của họ.

Chưa kiểm tra điện thoại thật sau nâng UI; chưa build APK/deploy. Gemini thật chưa kiểm tra trong lần nâng cấp, chỉ kiểm tra fallback và giới hạn candidates; key thật của người dùng được giữ nguyên. Bộ góc phụ cho20 mẫu chưa có. Test restore ghi đè chưa thực hiện. Không dùng gate landing page thay cho native verification; áp dụng quy tắc app theo yêu cầu người dùng.

## Lịch sử kiểm tra trước nâng cấp

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
