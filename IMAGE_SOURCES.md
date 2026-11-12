# Nguồn ảnh

## Bộ ảnh nâng cấp ngày 12/11/2026

Hiện có **60 ảnh chính riêng + 60 thumbnail** tại backend/media. Giữ24 ảnh đầu, tạo thêm36 ảnh bằng công cụ image_gen tích hợp; không dùng ảnh trùng đổi tên. SHA-256 xác nhận60 file chính khác nhau, tổng dung lượng ảnh chính5.409.804 bytes. Ảnh chính1200px tối đa, thumbnail480px, WebP quality82/76; card tải thumbnail, chi tiết tải ảnh lớn. Ảnh không phụ thuộc dịch vụ hotlink hoặc AI lúc chạy app.

| IDs mới | Loại         | Chủ thể                                              |
| ------- | ------------ | ---------------------------------------------------- |
| 25–26   | Thành phố    | Đỏ rượu có giỏ mây, xanh sage có giá sau             |
| 27–28   | Địa hình     | Xanh cobalt hardtail, cát full-suspension            |
| 29–30   | Đường trường | Đỏ đậm và bạc, ghi đông cong                         |
| 31–32   | Touring      | Xanh đêm và đồng, túi hành lý                        |
| 33–34   | Gấp          | San hô và đen, bánh nhỏ và bản lề                    |
| 35–36   | Điện         | Vàng ochre và bạc, có pin                            |
| 37–38   | Trẻ em       | Cam và tím, mẫu tím có bánh phụ                      |
| 39–40   | Đôi          | Ngọc và vàng, hai yên/hai bộ bàn đạp                 |
| 41–45   | Gravel       | Ô liu, cát, đồng, than và kem, ghi đông cong/lốp sỏi |
| 46–50   | Hybrid       | Xanh, xám, bạc hà, san hô, ngà, ghi đông ngang       |
| 51–55   | Cruiser      | Ngọc, kem, đào, xanh rừng, xanh trời                 |
| 56–60   | Chở hàng     | Longtail/box cargo, ghế trẻ em hoặc giá/giỏ chở đồ   |

Đã xem `backend/media/contact-sheet-60.png` để kiểm tra loại xe, màu và khung hình; bộ ảnh chủ yếu studio sáng, một số có bóng ánh sáng tự nhiên. Không có logo hãng; tên mô tả trung tính, thông số demo không suy diễn hiệu năng/kích cỡ chính xác từ ảnh. Màu tím nằm trên chiếc xe trẻ em trong dữ liệu, không dùng làm màu nhận diện UI.

Prompt riêng cho36 ảnh mới ở docs/upgrade-image-prompts.json. Prompt chung: single photorealistic catalog image, entire bicycle visible side-on with both wheels in frame, no rider, light neutral backdrop/natural ground shadow, mechanically realistic, no branding/text/watermark. Công cụ tạo ảnh built-in, sau đó sharp tối ưu và lưu vào workspace; không có API key để chạy ứng dụng. Quyền dùng output theo điều khoản OpenAI của tài khoản, không tự gắn CC hoặc cam kết độc quyền.

**Gallery:** hiện chưa có bộ góc phụ đã xác minh cho20 mẫu; thiếu20 bộ góc phụ theo mục tiêu ưu tiên. Không dùng ảnh xe khác, ảnh crop/đổi tên hoặc thumbnail để tính thành góc phụ. UI và API admin đã hỗ trợ gallery nhiều slot, chỉ đưa vào bộ ảnh được kiểm chứng cùng xe. Đây là giới hạn còn lại, không tuyên bố đã đạt.

`prepare-upgrade-images.mjs` là script xử lý đã dùng; input path local upgrade-image-inputs.json được gitignore. Các file WebP hoàn chỉnh được lưu trong project, không cần input local khi clone/chạy app. Ảnh fallback và contact sheet không tính vào60 ảnh chính.

## Bộ ảnh ban đầu (nguồn của24 ảnh đầu)

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
