# Hệ thống thiết kế Bike Rental

## Bản nâng cấp ứng dụng

Trang chủ nay là không gian tìm xe và quản lý chuyến đi: form tìm kiếm, trạm, thời gian ở cột chính; trợ lý và chuyến hiện tại ở cột phụ khi desktop; điện thoại xếp một cột. Bỏ ảnh hero chiếm màn hình. Danh sách dùng FlatList, 1/2/3 cột, bộ lọc ở đầu, chip bỏ từng bộ lọc, tải thêm có trạng thái riêng. Chi tiết đặt giá/hành động ngay sau ảnh, có thông số, trạm, lịch và review từ database; đánh giá demo được ghi rõ cả ở card và từng review.

Các màn hình đặt/chi tiết đơn có bảng tiền thuê–giảm giá–phí khác–tổng, chính sách trước xác nhận, timeline sự kiện, hành động theo trạng thái, gia hạn và đánh giá. Thông báo, mã giảm giá, hỗ trợ và khu quản trị dùng chung bộ component; admin là khu riêng theo role, không thay 5 tab chính.

Token thực tế: `mobile/src/theme/config.ts`: forest #164D3C, mint #E5F0E8, ground #F3F5EF, ink #172D25, muted #5A6C62, line #D7DFD8, error #A22C29. Named Tamagui color/space/radius tokens; metrics screen20/section24/card16/control48/radius14/maxWidth1120/formWidth680. Typography heading 30 trên điện thoại/36 desktop, section22, card19, body16/24, label14, metadata13. Border1; không bóng mặc định, ưu tiên phân cấp bằng nền và viền. Không thêm shader, gradient, emoji chức năng hoặc số liệu trang trí.

`ui.tsx`: button/input/card/select modal/photo/page; `states.tsx`: badge trạng thái, skeleton tĩnh, empty/error/retry và ScreenList virtualized. Vùng bấm button48, chip44, icon thông báo48+. Select là React Native Modal, không dùng select HTML. Form tối đa680, nội dung1120, danh sách1160 gồm padding. Các breakpoint vẫn <640 một cột, 640–999 hai cột, >=1000 ba cột. useWindowDimensions đổi bố cục khi xoay; không khóa portrait. KeyboardAvoidingView cho form/danh sách iOS, header/tab từ React Navigation và SafeAreaProvider.

Ảnh contain, không cắt xe, aspect1.4 ở card/1.5 ở ảnh lớn, chiều cao lớn tối đa380; thumbnail480 và ảnh lớn1200 WebP. Fallback icon cục bộ không tính vào số ảnh. Bộ dữ liệu ảnh mới thống nhất studio, có biến thể nền ánh sáng tự nhiên. Đã xem contact-sheet-60 và ảnh chụp Home/Catalog/Detail/Booking desktop/mobile. Chưa có bộ góc phụ cùng xe đã xác minh: gallery hỗ trợ nhiều ảnh nhưng không dùng xe khác làm góc phụ.

Motion: press scale .985, entrance nhẹ400ms tôn trọng giảm chuyển động; skeleton không nhấp nháy, modal không animation bắt buộc. Nội dung luôn đọc được khi giảm chuyển động. Áp dụng Taste Skill theo yêu cầu app: không section toàn màn hình, giá và tên được phép bên dưới ảnh, ảnh AI/demo/review demo được ghi rõ. Không dùng checker landing page để tuyên bố native PASS.

## Thiết kế ban đầu (tham khảo lịch sử)

Ứng dụng thuê xe học tập, không phải landing page. Đã đọc Taste Skill 2.5.1 cùng system, layout-v4, sections, copy, copy-voice, motion và photos. Áp dụng hệ thống thống nhất, lề cân nhau, ảnh sản phẩm lớn, chữ rõ và chuyển động có mục đích. Yêu cầu mobile và dữ liệu demo của đề bài ưu tiên hơn các quy tắc website: không ép section cao 900px, không chèn HTML/CSS kit vào native, không chạy checker chuyên cho DOM để tuyên bố kiểm tra native.

## Token

`mobile/src/theme/config.ts`: xanh rừng #164D3C, xanh nhạt #E5F0E8, nền #F6F7F2, chữ #172D25, chữ phụ #5A6C62, viền #D7DFD8, lỗi #A22C29, trắng #FFFFFF. Không dùng tím, gradient hoặc shader.

Font hệ thống có tiếng Việt: iOS San Francisco, Android Roboto, web system. Body 16/24, nhãn 15, metadata 13, tiêu đề card 19, tiêu đề phụ 23/30, tiêu đề chính 36/44. Trọng lượng 400/600/700/800. Không ảnh chữ, đánh giá hoặc lượt thuê giả.

Spacing 4/8/12/16/20/24/32/48. Lề màn hình 24, vùng nội dung tối đa 1120, form tài khoản 460. Radius input 10, button 12, card 16; viền 1. Không bóng trang trí. Button cao tối thiểu 48, chip 44; một màu action và một kiểu secondary. Input có nhãn nhìn thấy, màu lỗi và giữ nội dung khi request lỗi.

Ảnh chính khung 1.4:1, chi tiết 1.5:1, resizeMode contain để giữ toàn bộ xe. Card cùng cấu trúc, giá/giờ trong padding. Ảnh backend đường dẫn tương đối, URL từ EXPO_PUBLIC_API_URL. Ảnh hỏng chuyển icon cục bộ; icon không tính là ảnh xe.

Responsive dùng useWindowDimensions: <640 một cột; 640–999 hai; >=1000 ba cột. Bottom tabs năm mục, stack cho quy trình đặt. Không khóa chiều dọc. SafeAreaProvider và header/tab của React Navigation, KeyboardAvoidingView cho iOS, nội dung cuộn.

Animation: entrance trang chủ opacity 400ms, bỏ khi hệ thống giảm chuyển động; nút nhấn scale .985. Không parallax, carousel tự chạy, reveal theo scroll hay chuyển động lặp. Voice: tiếng Việt trực tiếp, tên xe/trạm và hành động cụ thể, báo rõ mô phỏng ở bước nhận/trả/thanh toán.

Ảnh AI được phép theo yêu cầu người dùng, là ngoại lệ có chủ đích với quy tắc tránh ảnh AI của skill. Giá, trạm và thông số đều ghi là demo theo đề bài. Không dùng web gate làm chứng cứ kiểm thử React Native.
