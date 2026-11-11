# Hệ thống thiết kế Bike Rental

Ứng dụng thuê xe học tập, không phải landing page. Đã đọc Taste Skill 2.5.1 cùng system, layout-v4, sections, copy, copy-voice, motion và photos. Áp dụng hệ thống thống nhất, lề cân nhau, ảnh sản phẩm lớn, chữ rõ và chuyển động có mục đích. Yêu cầu mobile và dữ liệu demo của đề bài ưu tiên hơn các quy tắc website: không ép section cao 900px, không chèn HTML/CSS kit vào native, không chạy checker chuyên cho DOM để tuyên bố kiểm tra native.

## Token

`mobile/src/theme/config.ts`: xanh rừng #164D3C, xanh nhạt #E5F0E8, nền #F6F7F2, chữ #172D25, chữ phụ #5A6C62, viền #D7DFD8, lỗi #A22C29, trắng #FFFFFF. Không dùng tím, gradient hoặc shader.

Font hệ thống có tiếng Việt: iOS San Francisco, Android Roboto, web system. Body 16/24, nhãn 15, metadata 13, tiêu đề card 19, tiêu đề phụ 23/30, tiêu đề chính 36/44. Trọng lượng 400/600/700/800. Không ảnh chữ, đánh giá hoặc lượt thuê giả.

Spacing 4/8/12/16/20/24/32/48. Lề màn hình 24, vùng nội dung tối đa 1120, form tài khoản 460. Radius input 10, button 12, card 16; viền 1. Không bóng trang trí. Button cao tối thiểu 48, chip 44; một màu action và một kiểu secondary. Input có nhãn nhìn thấy, màu lỗi và giữ nội dung khi request lỗi.

Ảnh chính khung 1.4:1, chi tiết 1.5:1, resizeMode contain để giữ toàn bộ xe. Card cùng cấu trúc, giá/giờ trong padding. Ảnh backend đường dẫn tương đối, URL từ EXPO_PUBLIC_API_URL. Ảnh hỏng chuyển icon cục bộ; icon không tính là ảnh xe.

Responsive dùng useWindowDimensions: <640 một cột; 640–999 hai; >=1000 ba cột. Bottom tabs năm mục, stack cho quy trình đặt. Không khóa chiều dọc. SafeAreaProvider và header/tab của React Navigation, KeyboardAvoidingView cho iOS, nội dung cuộn.

Animation: entrance trang chủ opacity 400ms, bỏ khi hệ thống giảm chuyển động; nút nhấn scale .985. Không parallax, carousel tự chạy, reveal theo scroll hay chuyển động lặp. Voice: tiếng Việt trực tiếp, tên xe/trạm và hành động cụ thể, báo rõ mô phỏng ở bước nhận/trả/thanh toán.

Ảnh AI được phép theo yêu cầu người dùng, là ngoại lệ có chủ đích với quy tắc tránh ảnh AI của skill. Giá, trạm và thông số đều ghi là demo theo đề bài. Không dùng web gate làm chứng cứ kiểm thử React Native.
