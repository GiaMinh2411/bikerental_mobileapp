# Bike Rental App

## Bản nâng cấp ngày 12/11/2026

Giữ Expo SDK58, React Navigation, Tamagui, Redux/Axios, Express/Prisma/SQLite. Có tìm kiếm/phân trang theo lịch, mã giảm giá, chống gửi lặp khi đặt/gia hạn, nhận/trả mô phỏng, đánh giá, thông báo nội bộ, hỗ trợ và quản trị. Quy tắc chi tiết ở BUSINESS_RULES.md; kết quả thực tế và giới hạn ở UPGRADE_SUMMARY.md.

**Database hiện có không bị reset.** Đã sao lưu trước migration mới `20261112075202_rental_upgrade`. Ảnh dùng chung có 60 ảnh chính và 60 thumbnail cục bộ. Bộ dữ liệu lớn ở `backend/prisma/demo-large.db` riêng: 12 loại, 60 mẫu, 300 xe, 20 trạm, 200 tài khoản, ít nhất 2.402 đơn và 600 đánh giá demo. Các thao tác kiểm thử có thể thêm một số đơn/đánh giá sau seed.

### Chạy bộ demo lớn trên Windows

Dừng backend trước khi migrate hoặc seed. Không ghi đè `.env` đang chứa key của bạn.

```powershell
cd D:\bike_rental_app\backend
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
# JWT_SECRET cần chuỗi ngẫu nhiên ít nhất 32 ký tự; giữ Gemini key đã có.
npx prisma generate
npm run db:backup
npm run db:migrate
npm run db:demo-large -- --seed=42 --rentals=2400
$env:DATABASE_URL = "file:./demo-large.db"
npm run dev
```

Lệnh demo-large tự migrate file riêng, seed theo batch, kiểm tra FK/lịch/tiền/chủ đánh giá/hash ảnh. Có thể đặt `--rentals=5000` (2.000–20.000) và `--seed=123` cho một database demo mới. Chạy lại không nhân đôi các ID seed hoặc xóa thao tác demo đã thực hiện. Muốn dữ liệu sinh lại với random seed khác, dùng một workspace/demo database mới; không xóa file hiện tại để chữa lỗi.

Terminal thứ hai:

```powershell
cd D:\bike_rental_app\mobile
npm ci
# Giữ mobile/.env hiện có. Web cùng máy có thể dùng http://localhost:4000.
npm run web
```

Đăng nhập người dùng `demo1@bike.example` hoặc quản trị `admin@bike.example`, mật khẩu chung **Demo12345!**. Các địa điểm, thông số, mã ưu đãi và review seed đều là dữ liệu mô phỏng. Không dùng những tài khoản này cho production.

### Chạy database nhỏ hiện có

Không đặt DATABASE_URL trong terminal, hoặc chạy `Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue` để dùng lại backend/.env. Chạy `npm run db:migrate`, `npm run db:seed`, `npm run dev`. Seed nhỏ giữ 24 mẫu/48 xe/6 trạm, bổ sung tài khoản admin demo và mã DEMO10; không nhân đôi seed cũ. Dữ liệu cũ được backfill các thành phần tiền khi migrate, không tự xóa đơn.

### Điện thoại thật

Giữ backend mở ở 0.0.0.0:4000, máy tính và điện thoại cùng Wi-Fi. `mobile/.env` đặt `EXPO_PUBLIC_API_URL=http://IP-LAN-CUA-MAY:4000`; địa chỉ LAN hiện có của bạn được giữ nguyên. Trên điện thoại mở `http://IP:4000/health` trước; nếu không thấy status ok, kiểm tra IP/mạng và Windows Firewall cho Node trên mạng private.

Đăng nhập cùng tài khoản Expo trên iPhone/Expo Go SDK58 và CLI, rồi `npx expo start --clear --lan`. Nếu Expo login lỗi mở trình duyệt Windows, dùng:

```powershell
$env:BROWSER="none"
npx expo login --browser
# Giữ terminal mở, copy link MỚI sang trình duyệt cùng máy, nhập mã email.
npx expo whoami
Remove-Item Env:BROWSER
npx expo start --clear --lan
```

Quét QR mới. Web thành công và native bundle thành công chưa phải kiểm chứng trên thiết bị thật. EAS APK/internet xem DEPLOY.md.

### Kiểm tra bản nâng cấp

```powershell
cd D:\bike_rental_app\backend
npm test
# Tests dùng test-upgrade.db riêng, không gọi Gemini thật và không sửa dev.db.
npm run typecheck
npm run lint
$env:DATABASE_URL="file:./demo-large.db"
npm run db:verify
npx tsx scripts/measure-catalog.ts
cd ..\mobile
npm run typecheck
npm run lint
npx expo-doctor
npx expo export --platform all
```

Kiểm thử trình duyệt nâng cấp có hướng dẫn riêng trong TESTING.md; chạy backend demo cổng 4100 và build `dist-review` để không thay API URL của phiên demo đang dùng.

## Hướng dẫn cài đặt cơ bản / bộ dữ liệu nhỏ

Ứng dụng học tập dùng chung React Native + Expo SDK 58 + TypeScript cho web, Android, iOS. Tamagui, React Navigation, Axios, Redux Toolkit; API Express, Prisma 6, SQLite. Không có website React riêng. Giữ nguyên `.agents` và `skills-lock.json`.

## Chạy trên Windows / VS Code

Cài Node.js LTS 22 hoặc 24, npm và VS Code. Mở thư mục `D:\bike_rental_app`. Các lệnh sau chạy ở PowerShell.

```powershell
cd D:\bike_rental_app\backend
npm ci
Copy-Item .env.example .env
# Mở .env: thay JWT_SECRET bằng chuỗi ngẫu nhiên ít nhất 32 ký tự.
# Có thể tạo bằng: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npx prisma generate
npm run db:migrate
npm run db:seed
npm run dev
```

API lắng nghe `0.0.0.0:4000`. Mở `http://localhost:4000/health` phải thấy `{"status":"ok"}`. SQLite tự tạo bảng từ migration, không cần cài database server hoặc nhập tay.

Terminal thứ hai:

```powershell
cd D:\bike_rental_app\mobile
npm ci
Copy-Item .env.example .env
npm run web
```

Mở URL Expo in ra (mặc định `http://localhost:8081`). Nếu Expo đổi cổng, thêm đúng origin đó vào `backend/.env` biến `CORS_ORIGINS`, phân tách bằng dấu phẩy, khởi động lại backend. Tài khoản `demo1@bike.example`, `demo2@bike.example`, `demo3@bike.example`, cùng mật khẩu **Demo12345!**. Demo1 có đơn đủ bốn trạng thái. Seed create-only, chạy lại không nhân đôi hoặc ghi đè đơn đã thao tác; đơn cũ không tự dịch thời gian. Muốn làm lại dữ liệu xem DATABASE.md.

## Điện thoại Expo Go

1. Cài Expo Go tương thích SDK 58 (kiểm tra phiên bản tại https://expo.dev/go).
2. Máy tính và điện thoại cùng Wi-Fi; chạy `ipconfig` lấy IPv4 LAN.
3. Đổi `mobile/.env`: `EXPO_PUBLIC_API_URL=http://192.168.1.10:4000` với IP thực tế của máy.
4. Khởi động lại Expo bằng `npx expo start --clear --lan`, quét QR bằng Expo Go.
5. Trên điện thoại mở trình duyệt vào `http://IP-MAY:4000/health` để kiểm tra kết nối. Nếu không vào được, kiểm tra mạng khách/AP isolation và Windows Firewall; chỉ mở cổng 4000 cho mạng private khi cần.
6. Kiểm tra token, ảnh, tab, nút back, bàn phím, safe area, xoay màn hình và giảm chuyển động theo TESTING.md.

`localhost` trên điện thoại là điện thoại, không phải máy tính. Ảnh lấy cùng origin API từ biến môi trường; không hardcode localhost trong đường dẫn media. Đổi biến Expo cần restart bundler. Dùng HTTPS khi chạy internet; không trộn web HTTPS với API HTTP.

## Lệnh kiểm tra

```powershell
cd D:\bike_rental_app\backend
npm run typecheck
npm run lint
npm test
cd ..\mobile
npm run typecheck
npm run lint
npx expo install --check
npx expo export --platform web
```

Kiểm thử API cần database đã seed và không nên chạy cùng phiên demo có người khác thay đổi dữ liệu. Tests chỉ tạo/xóa dữ liệu kiểm thử và favorite mẫu 24 của demo1.

## Cấu trúc và tài liệu

- `backend/src`: routes, middleware auth, service thuê, Prisma client.
- `backend/prisma`: schema, migration, seed. `backend/media`: ảnh cục bộ.
- `mobile/src`: screens, components, navigation, slices, store, services, types, theme, utils.
- DESIGN.md, DATABASE.md, API.md, IMAGE_SOURCES.md, TESTING.md, DEPLOY.md, EXPLANATION.md, PLAN_3_WEEKS.md, DEMO_SCRIPT.md, REQUIREMENTS_CHECKLIST.md.
- `docs/postman`: collection và environment nhập vào Postman.

Nếu ảnh không tải: kiểm tra API URL, `/health`, `backend/media`, restart Expo, kiểm tra firewall. Nếu Prisma báo engine/schema lỗi: dùng Node LTS, `npm ci`, `npx prisma generate`; không xóa database để chữa lỗi. Tài liệu TESTING.md ghi rõ kiểm tra đã chạy và các phần chưa được xác minh.
