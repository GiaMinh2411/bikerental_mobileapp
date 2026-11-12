# Nghiệp vụ thuê xe — bản nâng cấp

## Đặt và giữ chỗ

Mẫu xe chứa ảnh/thông số; chiếc xe có mã, trạm, giá và lịch riêng. Backend gán chiếc ACTIVE còn trống trong transaction SQLite Serializable. Khoảng thuê `[start,end)`; hai đơn sát nhau end=start được phép. BOOKED giao nhau bị chặn; ONGOING luôn khóa xe dù quá giờ dự kiến. Trạm, loại và mẫu phải đang hoạt động. Thuê tối đa 7 ngày mỗi đơn.

Giữ chỗ bắt đầu ngay khi POST /rentals thành công. Không có bước chờ thanh toán hoặc đặt cọc. Ứng dụng gửi request_key riêng cho mỗi ý định đặt, giữ nguyên khi retry. Backend lưu hash nội dung và unique(user_id,request_key): gửi lại cùng nội dung trả đơn cũ, kể cả đơn đã hủy; thay nội dung cùng key bị 409. Legacy client không gửi key vẫn được hỗ trợ, nhưng không có bảo đảm chống tạo hai đơn cho hai chiếc khác nhau.

## Trạng thái

BOOKED → ONGOING → COMPLETED; BOOKED → CANCELLED hoặc EXPIRED. Không có đường chuyển ngược. Nhận từ 15 phút trước đến 30 phút sau planned_start và trước planned_end. Chỉ nhận nếu xe thật sự ở trạm, không có ONGOING khác và thời gian nhận sớm không chiếm lịch BOOKED trước đó. Hủy trước nhận miễn phí. Đơn quá cửa sổ nhận hoặc quá planned_end mà chưa nhận sẽ EXPIRED, không tính phí. Không suy ra xe ONGOING đã trả khi hết giờ.

Tác vụ chạy khi start backend, mỗi 30 giây và khi mở thông báo/danh sách đơn; có `npm run tasks:run` hoặc POST /admin/tasks/run. Mỗi lần xử lý tối đa 200 đơn hết hạn và 300 nhắc giờ. Với backlog lớn cần nhiều lượt. Backend phải được chạy liên tục; restart sẽ xử lý bù. Nếu tác vụ lỗi, log thông báo và thử lại; việc đặt xe cũng kiểm tra hết hạn trong transaction.

## Tính phí và mã giảm giá

VNĐ nguyên. Giờ tính phí = max(1, ceil((end-start)/1 giờ)). Lưu đơn giá và policy_version trên đơn, không nhận tiền từ client. Dự toán dùng planned_start/planned_end; hóa đơn thực tế dùng actual_start/actual_end. Quá giờ vẫn cùng đơn giá, không có phí khác hoặc đặt cọc. Khi nhận sớm, đồng hồ phí bắt đầu từ lúc thực nhận. Gia hạn cập nhật dự toán, không chốt tiền thực tế.

Lưu riêng estimated_subtotal, estimated_discount, estimated_total và final_subtotal, final_discount, final_total. Tổng = tiền thuê − giảm giá. Thanh toán khi trả là SIMULATED_PAID; hủy/hết hạn là SIMULATED_VOID, không thực thu hoặc hoàn tiền thật.

Mã FIXED hoặc PERCENT, có ngày hiệu lực, mức thuê tối thiểu, mức giảm tối đa, giới hạn toàn hệ thống/mỗi người. Điều kiện ngày và tiền tối thiểu xét khi đặt; mức giảm được chốt thành snapshot, áp vào tiền thực tế khi trả, giới hạn không vượt tiền thuê và cap. Ví dụ đặt đủ min rồi trả sớm: vẫn giữ quyền dùng mã, mức giảm tính lại từ subtotal thực tế. Sửa/vô hiệu hóa mã sau đặt không thay snapshot đơn cũ.

Lượt mã RESERVED cùng transaction tạo đơn; USED khi hoàn thành; RELEASED khi hủy hoặc hết hạn. RESERVED và USED đều tính vào hạn mức. Hai request cùng lượt cuối chỉ một được nhận. Quote không giữ lượt và không giữ xe; xác nhận luôn kiểm tra lại. Không giảm hạn mức admin xuống dưới số lượt đã dùng/đang giữ. Không tái sử dụng key đặt đã hủy để tạo ý định đặt mới.

## Gia hạn

Chỉ ONGOING, xe vẫn ACTIVE, giờ mới sau cả giờ dự kiến cũ lẫn hiện tại, tổng khoảng thuê không quá 7 ngày. Kiểm tra lịch kế tiếp trong transaction. POST extension-quote chỉ dự toán; POST extend kiểm tra lại và lưu lịch sử. request_key bắt buộc với extend; gửi lại key và nội dung cũ trả kết quả đã lưu, không sinh event lần hai. Hóa đơn cuối cùng luôn tính theo thời gian thực tế, không cộng tiền quote gia hạn hai lần.

## Trả xe, sự cố và bảo trì

Trả về trạm nhận; cập nhật Rental và Bike cùng transaction. Lặp pickup/return/cancel sau thành công không tính tiền hoặc chuyển trạng thái lần hai. Không cho sửa đơn COMPLETED, trả đơn chưa nhận hoặc nhận đơn đã hủy.

Báo DAMAGE cho chuyến đã nhận/đã trả sẽ đưa xe sang MAINTENANCE và hủy miễn phí các đơn BOOKED trên xe đó, hoàn lượt mã, tạo thông báo/event. Chuyến ONGOING vẫn được trả; không gia hạn xe hỏng. Admin không chỉnh xe ONGOING qua form chung. Chỉ đưa MAINTENANCE về ACTIVE khi không có ONGOING và không còn ticket DAMAGE chưa RESOLVED. Không di chuyển trạm/mẫu xe nếu còn BOOKED. Đổi giá chỉ tác động đơn mới.

## Đánh giá, thông báo, hỗ trợ và quyền

Chỉ chủ đơn COMPLETED gửi đánh giá 1–5, nội dung 5–1000 ký tự, một review/rental. Sửa trong 7 ngày từ lần gửi đầu, không kéo dài bằng mỗi lần sửa. Điểm trung bình/số lượt lấy từ bảng reviews. Tài khoản demo truyền is_demo sang đơn mới và đánh giá; review seed có is_demo=true và nhãn Dữ liệu demo.

Thông báo nội bộ có dedupe_key unique theo đơn/loại/thời điểm dự kiến: BOOKED, CANCELLED, EXPIRED, ONGOING, COMPLETED, PICKUP_SOON, RETURN_SOON, OVERDUE, SUPPORT. Gia hạn tạo mốc nhắc mới; chạy lại cùng mốc không tạo trùng. Không xin quyền push. Chỉ chủ sở hữu đọc/đánh dấu thông báo.

Support ticket thuộc chủ đơn, loại DAMAGE/BILLING/OTHER, mô tả 10–2000 ký tự, OPEN/IN_PROGRESS/RESOLVED. Admin phản hồi, user theo dõi lịch sử. Không có upload ảnh hoặc chat trực tiếp. Role ADMIN được tra lại từ database; không tin role do client gửi trong profile/JWT. API quản trị từ USER trả 403. Không có API xóa dữ liệu lịch sử; trạm/loại/mẫu/coupon được vô hiệu hóa. Không vô hiệu hóa danh mục đang chứa chuyến hiệu lực.
