# Bike Rental App

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
