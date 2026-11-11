# Nguồn ảnh

24 ảnh chính được tạo riêng bằng công cụ image_gen tích hợp trong phiên làm việc ngày 11/11/2026, sau đó chuyển WebP cục bộ. Không hotlink, không tải ảnh hãng, không sử dụng watermark hoặc logo hãng. Ảnh AI minh họa, không xác nhận thiết kế, hiệu năng, thông số của sản phẩm thương mại có thật. Quyền sử dụng output tuân theo điều khoản OpenAI áp dụng cho tài khoản; không gán giấy phép Creative Commons hay tuyên bố độc quyền.

Đường dẫn: `backend/media/bike-1.webp` đến `bike-24.webp` (rộng tối đa 1200), thumbnail `bike-N-thumb.webp` (rộng tối đa 480). Mỗi mẫu có một ảnh chính riêng. Contact sheet kiểm tra `backend/media/contact-sheet.png`, không tính vào ảnh sản phẩm. Icon fallback lấy từ Expo blank template, không tính vào 24 ảnh xe.

| IDs   | Loại         | Màu theo thứ tự                         |
| ----- | ------------ | --------------------------------------- |
| 1–3   | Thành phố    | Xanh rừng, kem, xanh đêm                |
| 4–6   | Địa hình     | Cam, đen nhám, đỏ                       |
| 7–9   | Đường trường | Trắng, xanh biển, đen                   |
| 10–12 | Touring      | Ô liu, cát, đỏ rượu                     |
| 13–15 | Gấp          | Vàng, bạc hà, bạc                       |
| 16–18 | Điện         | Xanh ngọc, đen, trắng                   |
| 19–21 | Trẻ em       | Hồng có bánh phụ, xanh biển, xanh chanh |
| 22–24 | Xe đôi       | Đỏ, kem, xanh đêm                       |

Prompt chung: “Single photorealistic catalog photograph of [subject]. Entire bicycle clearly visible side-on, both wheels in frame, studio off-white background, soft daylight, mechanically plausible bicycle. No brand, no letters, no text, no watermark. This is the main image for a fictional bike rental teaching demo. Landscape composition.” Subject riêng được lưu trong `docs/image-prompts.json`.

Đã xem contact sheet đủ 24 ảnh: kiểu xe và màu phù hợp tên; thông số chỉ nêu cấu hình demo chung, không suy diễn kích cỡ/hiệu năng thực. Cả bộ thống nhất ánh sáng studio, đa dạng hình dáng/màu; chưa có bối cảnh ngoài trời đa dạng. Không dùng crop/ảnh cùng loại xe khác để giả làm góc phụ.

Số lượng: **24/24 ảnh chính**, **24 thumbnail**, **0/16 ảnh phụ** cho 8 mẫu nổi bật. Chưa có bộ góc phụ đã xác minh cùng một chiếc xe; đây là hạng mục còn thiếu. Không có ảnh trạm thực tế vì trạm chỉ là địa điểm minh họa; giao diện trạm dùng tên/địa chỉ và xe, không giả ảnh một địa điểm khác.

`scripts/prepare-images.mjs` là pipeline tối ưu đã dùng; đầu vào local `image-inputs.json` không commit vì đường dẫn máy tạo ảnh. Tài sản WebP hoàn chỉnh được commit trực tiếp, chạy ứng dụng không cần gọi AI hoặc chạy pipeline này.
