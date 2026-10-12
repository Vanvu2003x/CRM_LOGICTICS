# Kết nối webphone ITY

Webphone dùng JsSIP, đăng ký máy lẻ qua WSS và truyền âm thanh bằng WebRTC.

## Cấu hình local

Các biến `ITY_WSS`, `ITY_DOMAIN`, `ITY_EXTENSION`, `ITY_SIP_PASSWORD`, `ITY_WEBPHONE_EMAIL` nằm trong `.env.local`, được Git bỏ qua. Tài khoản đã cấu hình hiện được gán cho `admin@logistics.vn`; máy lẻ `90933001`. Khởi động lại server khi đổi biến môi trường. Không đưa mật khẩu SIP vào biến `NEXT_PUBLIC_*`.

`GET /api/ity/webphone` yêu cầu phiên đăng nhập, chỉ cấp thông tin máy lẻ cho email đã gán và trả `Cache-Control: no-store, private`. Mật khẩu chỉ dùng trong bộ nhớ để xác thực SIP, không ghi vào localStorage. Secret API được giữ riêng phía server.

## Thao tác

1. Đăng nhập tài khoản được gán máy lẻ.
2. Bấm biểu tượng điện thoại ở góc phải → **Kết nối**.
3. Chờ **Đã kết nối** rồi chọn khách hoặc nhập số.
4. Bấm **Gọi điện**, cho phép microphone. Cuộc gọi thật chỉ bắt đầu từ thao tác này.
5. Có thể trả lời/từ chối cuộc gọi đến, tắt/bật microphone, kết thúc và ngắt đăng ký máy lẻ.

Trình duyệt cần HTTPS hoặc localhost để dùng microphone. Nếu không phát tiếng, dùng nút **Nghe âm thanh** trong cuộc gọi. Ngắt webphone khi kết thúc thử nghiệm.

## Đã xác minh và còn chờ

- Đã đăng ký SIP thành công từ Chromium với máy lẻ thực, ngày 08/10/2026.
- Đã kiểm tra truy cập ẩn danh bị từ chối, cấu hình không cache và giao diện mobile 390px.
- Chưa gọi ra hoặc xác minh âm thanh hai chiều, tuyến gọi và ghi âm thực tế.
- Chưa cấu hình webhook tại ITY; không tạo call log mô phỏng khi dùng webphone.
- Lịch sử cuộc gọi đầy đủ cần ITY gửi webhook về URL HTTPS công khai. Đã triển khai payload mục 13.1.1, gồm `start_stamp`, `answer_stamp`, `end_stamp`, nhà mạng, thông tin ngắt cuộc gọi, hotline, domain, MOS. Thời gian không có timezone được đọc theo UTC+07.
- REST click-to-call cần URL HTTPS riêng; WSS không phải URL API này. Các biến `ITY_CUSTOMER`, `ITY_API_SECRET` đã lưu riêng để nối luồng API khi có endpoint, chưa bật REST LIVE.
- Đã cấu hình 8 máy lẻ trong `ITY_SIP_ACCOUNTS` (JSON lưu riêng ở `.env.local`). Tài khoản CRM lấy đúng mật khẩu SIP theo `User.extension`, không phụ thuộc tên/email sau khi nhân viên sửa thông tin.
- Máy lẻ 90933001 gán cho Admin. Các máy lẻ 90933002–90933008 gán cho 7 tài khoản Sales tạm `sales02@logistics.vn` đến `sales08@logistics.vn`. Tên ban đầu là Nhân viên Sales 02–08, chưa gán team.
- Mật khẩu đăng nhập CRM được tạo ngẫu nhiên riêng, khác mật khẩu SIP. Bảng tài khoản đăng nhập nằm trong file riêng `output/ity-sales-accounts.json` (không được Git theo dõi, không nằm trong thư mục public).
- Nhân viên bấm avatar/tài khoản ở sidebar để vào trang cá nhân và đổi tên, email, mật khẩu CRM. Cần mật khẩu CRM hiện tại để xác nhận. Không được tự đổi quyền, team, ID hay máy lẻ; Admin quản lý các trường này.
- Cả 8 máy lẻ dùng chung webhook của customer C90933; call log được gán theo extension. Trang quản trị hiển thị từng máy lẻ và người đang sử dụng, không trả mật khẩu SIP trong danh sách.

## Webhook call logs — cập nhật 08/10/2026

- Endpoint chuẩn: `POST /wsapi/C90933/call_answered`. Endpoint `/api/wsapi/C90933/call_answered` dùng chung bộ xử lý để tương thích bản cũ.
- Khóa nhận webhook riêng: `ITY_WEBHOOK_SECRET` trong `.env.local`; không dùng mật khẩu SIP hoặc secret API gọi ra. Admin vào Quản trị hệ thống → Webhook nhận lịch sử gọi ITY → Sao chép URL webhook để lấy URL có khóa.
- Toàn bộ call log hợp lệ được lưu trong DB, kể cả số chưa có khách/lead. Không có nhu cầu trong payload thì lưu `UNKNOWN`, không tự tạo lead có nhu cầu.
- Gán Sales theo extension đã cấu hình trong User; máy lẻ webphone local có ánh xạ email riêng. Không tìm thấy Sales thì giữ call log chưa gán, Admin vẫn xem được.
- `callid` là khóa duy nhất. Gửi lại qua một trong hai URL không tạo dòng trùng hoặc tăng số lần gọi hai lần. Lưu call log và cập nhật lead dùng cùng transaction.
- Thành công trả 200; khóa sai 401; payload sai 400; quá lớn 413; lỗi lưu DB trả 500 để phía ITY có thể gửi lại.
- Đã gửi payload kiểm thử qua HTTP local và kiểm tra trực tiếp DB: lưu đủ trường, đúng Sales, đúng timezone, gửi lặp chỉ một dòng. Đây là dữ liệu thử, chưa phải cuộc gọi thực tế.
- DB trước cập nhật được sao lưu ở `output/backups/crm-before-ity-webhook-20261008.db`.
