# Expo Go, EAS và phân phối

## Lưu ý sau nâng cấp

Migration rental_upgrade phải được áp dụng trước chạy server mới. Dừng backend khi migrate/generate trên Windows. Giữ SQLite và media trên volume bền; chỉ một backend writer. Bộ demo lớn nằm demo-large.db riêng, không tự chuyển file production; không chạy seed/demo accounts trên production. ADMIN do seed phát triển tạo, không có nâng quyền qua profile. Không reset để giải quyết migration lock.

Scheduler nhắc giờ/hết hạn hiện chạy trong tiến trình30s và khi startup; triển khai phải giữ backend hoạt động, theo dõi lỗi/retry và backup. Khả năng xử lý nhiều replica/job queue chưa nằm trong bản này. Role, mã giảm giá, thông báo và support là backend thật; thanh toán vẫn mô phỏng. Key Gemini vẫn chỉ ở backend, còn EXPO_PUBLIC_API_URL là public endpoint.

Repo hiện có mobile là gitlink/embedded repository (`git ls-files --stage mobile` mode160000), chưa có thao tác chuẩn hóa/push trong lần nâng cấp. Cần bảo đảm source mobile được quản lý đúng bằng submodule có remote hoặc thư mục thường trước khi bàn giao GitHub; không tự sửa metadata Git/ghi đè thay đổi hiện có của người dùng.

Chưa tự động push GitHub, deploy host hoặc build APK; các thao tác cần tài khoản và cấu hình của chủ dự án. Source có thể đưa lên Git sau khi kiểm tra không chứa .env, database, node_modules hay tài khoản thật.

## Backend internet

Build `npm ci`, `npx prisma generate`, `npm run build`. Start từ thư mục backend bằng `npm start`. Host cần Node LTS, volume bền chứa database SQLite và media, một writer service. Đặt DATABASE_URL trỏ tới file trên volume bằng đường dẫn tuyệt đối, JWT_SECRET ngẫu nhiên, PORT do host cung cấp, CORS_ORIGINS chính xác origin web. Chạy `npm run db:migrate` trước start, seed chỉ cho demo mới. Không reset production. Reverse proxy cung cấp HTTPS; nếu bật trust proxy phải cấu hình theo số proxy thực tế trước khi tin IP cho rate limiting. Giữ bản backup và thử restore trong môi trường riêng.

## EAS Android APK

```powershell
cd mobile
npx eas-cli login
npx eas-cli init
# Dùng project/account của bạn; EAS init ghi projectId vào app.json.
# Đặt EXPO_PUBLIC_API_URL=https://api-ten-mien-cua-ban trên EAS environment.
npx eas-cli build --platform android --profile preview
```

`eas.json` preview là distribution internal, buildType apk. Sau build thành công, EAS cung cấp URL tải. Chia sẻ link đó, người nhận bật cho phép cài app từ nguồn tương ứng. Link internal không phải Play Store. Production profile tạo AAB để submit store. Không dùng API URL localhost/LAN cho APK phân phối internet; chỉ biến public endpoint được đưa vào app, không đưa GEMINI_API_KEY/JWT_SECRET.

Để rebuild với URL mới, cấu hình EAS environment tương ứng profile hoặc export biến trước local build; kiểm tra log cấu hình. Tài khoản EAS có thể có giới hạn/quota và yêu cầu xác nhận credentials. Chưa tạo credentials hay projectId giả trong source.

## iOS

Expo Go dùng cùng bundle JS nếu SDK tương thích. IPA phân phối cần Apple Developer, signing/provisioning phù hợp; EAS có thể build cloud, build local iOS cần macOS/Xcode. Không thể cài APK lên iOS. Project đã nâng từ SDK 57 lên SDK 58 để tương thích Expo Go SDK 58 trên iPhone. Dừng Metro cũ và chạy `npx expo start --clear --lan`, rồi quét QR mới.

Tài liệu chính thức đã đối chiếu: https://docs.expo.dev/get-started/create-a-project/ ; https://docs.expo.dev/build-reference/apk/ ; https://www.tamagui.dev/docs/guides/expo ; https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions ; https://ai.google.dev/gemini-api/docs/structured-output . GEMINI_MODEL có thể đổi khi provider thay model, không có key trong Expo.
