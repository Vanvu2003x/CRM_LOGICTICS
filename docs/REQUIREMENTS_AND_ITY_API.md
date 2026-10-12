# TÀI LIỆU YÊU CẦU DỰ ÁN CRM LOGISTICS & TÍCH HỢP TỔNG ĐÀI ẢO ITY
*Phiên bản: 2.0 (Production Blueprint) - Cập nhật 06/10/2026*

---

## 📌 PHẦN 1: IMPORT DỮ LIỆU ĐẦU VÀO TỪ TỔNG ĐÀI ẢO ITY

- Tích hợp phần mềm tổng đài ảo **ITY** vào CRM qua API.
- Dữ liệu ITY xuất ra: *Tên sales, thông tin khách, có nhu cầu / không có nhu cầu, thời lượng cuộc gọi, số lần gọi, link ghi âm...*
- **Phân luồng**:
  - Khách **có nhu cầu** ➔ Tạo danh sách **Khách Hàng Tiềm Năng** ➔ Đưa về **Phần 2 Bước 1 (Chăm sóc)**.
  - Các phần báo cáo còn lại ➔ Đưa về **Phần 4 (Báo cáo)**.

### API ITY

#### Webhook Call Logs (13.1.1)
- **POST** `https://{domain_crm}/api/wsapi/{customer}/call_answered?secret={secret}`
- JSON: `callid, start_stamp, answer_stamp, end_stamp, extension, phone, duration, billsec, status, recording, userfield, direction, source_telco, dest_telco, hangup_by, hangup_cause, sip_code, hotline, domain, mos`
- `userfield` = Mã đơn hàng (ORD-XXX) hoặc Mã Lead để liên kết cuộc gọi.

#### Click-to-Call Softphone (13.2.1)
- **GET** `https://{ip_tong_dai}/wsapi/{customer}/click2call.php?secret={secret}&extension={extension}&phone={phone}&domain={domain}&userfield={userfield}`

#### Click-to-Call Webphone JsSIP (13.2.2)
- Gắn `X-userfield` = orderId vào SIP session qua `request.setHeader('X-userfield', orderId)`.

---

## 📌 PHẦN 2: QUY TRÌNH 13 BƯỚC VẬN HÀNH ĐƠN HÀNG

Dùng dữ liệu đầu vào để lên list khách hàng tiềm năng. Sales nào gọi thì ghi rõ tên sales đó care vào trong list.

### Bước 1: Đang Chăm Sóc
- Khách hàng tiềm năng ở Phần 1 được **chia theo sales**.
- Sales cần **update ngày tháng đã liên lạc với khách (nhập thủ công)** và **nhu cầu cơ bản** (tuyến nào, hàng hoá là gì...) nếu có.
- Hệ thống **tự động nhắc nhở sales gửi khuyến mãi** cho khách hàng.
- Hệ thống **tự động nhắc nhở sales chăm sóc lại** khách hàng sau một khoảng thời gian.

### Bước 2: Thông Tin Đơn Hàng
Sales điền 11 trường:
- Cảng xuất / Sân bay xuất
- Cảng nhập / Sân bay nhập
- Xuất khẩu or Nhập khẩu
- Phương thức vận chuyển: `FCL, LCL, AIR, CPN, BỘ TN, BỘ CN`
- Ngày dự kiến xuất hàng
- Tên hàng
- Số lượng
- Địa điểm lấy hàng (nếu có)
- Địa điểm trả hàng (nếu có)
- Điều kiện vận chuyển: `EXW, FCA, FOB, CIF, CIP, CFR, DDU, DDP, DAP, Bộ CN, Bộ TN, CPN`
- Lưu ý (nếu có)

### Bước 3: Tổng Hợp Giá
- Nhân viên note **3-5 báo giá** so sánh từ các bên.

### Bước 4: Báo Giá
- Công ty có **form tính giá sẵn bằng Excel** ➔ Add vào phần mềm để nhân viên tính ➔ **Xuất ra PDF**.
- Sau khi xuất PDF thì **tick hoàn thành** bước này.

### Bước 5: Feedback Của Khách Hàng (RẼ NHÁNH)
- **Đồng ý** ➔ Bước 6.
- **Không đồng ý** ➔ Quay lại Bước 2 HOẶC note là **fail** vào lô hàng.

### Bước 6: Booking
- ETD (ngày tàu chạy)
- ETA (ngày đến)
- LINE (hãng tàu/bay)
- Giá

### Bước 7: Lựa Chọn Đại Lý
- Có list danh sách đại lý.
- Có thể **nhập tay nếu là đại lý mới**.
- ⚠️ **KHÔNG THỂ XOÁ ĐẠI LÝ CŨ** (chỉ deactivate).

### Bước 8: Điều Xe (Hàng XUẤT KHẨU)
- Tên công ty vận tải sử dụng
- Giá cả
- Thời gian đến lấy hàng
- Hình ảnh lấy hàng
- Số xe
- **Tick hoàn thành khi giao hàng xong.**

### Bước 9: Gửi Chứng Từ
- **Hàng XK**: Làm vận đơn (mẫu Excel) ➔ Xuất PDF.
- **Hàng NK**: Checklist đã nhận đủ: `MBL, HBL, INV, PL, C.O, DN` ➔ Sau đó nhận thêm `D.O, AN` ➔ Note lịch khai `MNF`.

### Bước 10: Khai Báo Hải Quan
- Số tờ khai
- Phân luồng: 🔴 Đỏ / 🟡 Vàng / 🟢 Xanh
- Trạng thái: `Đang xử lý / Đã thông quan / Đang đợi kiểm`
- Note

### Bước 11: Điều Xe (Hàng NHẬP KHẨU)
- **Tick hoàn thành khi giao hàng xong.**

### Bước 12: Gửi Chứng Từ (Bảng Kê Chi Phí)
- Mẫu bảng kê chi phí Excel ➔ Nhân viên làm ➔ **Xuất PDF** ➔ Đánh dấu hoàn thành.

### Bước 13: Thanh Toán
- Note **số hoá đơn phát hành** ➔ Tick hoàn thành phát hành hoá đơn.
- Note **hạn công nợ** ➔ **Tự động thông báo khi còn 7 ngày** đến hạn chót.
- Tick hoàn thành khi khách thanh toán.
- **Mã màu**: 🟢 Xanh (chưa gấp) | 🟡 Vàng (TB) | 🔴 Đỏ (gấp hoặc gần đến hạn).

---

## 📌 PHẦN 3: ĐẦU MỤC CÔNG VIỆC (TASK MANAGEMENT)

### 3.1. Chấm Công
- Như phần mềm chấm công thông thường.
- Nhân viên **tick vào để bắt đầu tính KPI** (liên quan mục 3.4 đăng bài MXH).
- Áp dụng cả nhân viên part-time: khi tick chấm công thì mới bắt đầu tính KPI.

### 3.2. Làm Truyền Thông (Chiến Dịch Marketing)
- **Phân công và triển khai theo chiến dịch**.
- Mỗi chiến dịch có:
  - Tên chiến dịch (VD: *"SỰ THẬT VỀ LOGISTICS"*)
  - Deadline
  - Yêu cầu (VD: *Mỗi deadline 1 video + 1 bài viết + 5 ảnh truyền thông*)
  - Nội dung chiến dịch
- **Tự động nhắc nhở khi cách Deadline 2 ngày.**
- **Quy trình triển khai 5 bước**:
  1. Nộp demo kịch bản
  2. Duyệt kịch bản (nếu không duyệt ➔ quay lại bước 1)
  3. Nộp sản phẩm nháp
  4. Duyệt sản phẩm nháp (nếu không duyệt ➔ quay lại bước 3)
  5. Tick hoàn thành
- Có chỗ để gắn **link sản phẩm**.
- **Quá Deadline**: Tự động thêm mục **nộp phạt thêm 1 bài truyền thông** (có phần gắn link nộp phạt). **Mỗi ngày chễ DL là thêm 1 bài phạt.**

### 3.3. Hội Chợ (Trade Fair)
- Mỗi tháng có **1-2 chiến dịch hội chợ**.
- Nhân viên có quyền **chọn tham gia vào ngày nào** (sáng/chiều).
- Nếu **không tham gia bất kỳ 1 ngày nào** trong chiến dịch ➔ **Ghi rõ lý do**.
- **Sau ngày tham gia hội chợ 1 ngày** cần note lại kết quả:
  - List: **Tên công ty + MST + SĐT liên hệ + Ngành nghề + Địa chỉ + Nội dung trao đổi** tại hội chợ.
  - Danh sách này **tự động thêm vào list khách hàng cần chăm sóc** của mỗi nhân viên.
  - Có link cho nhân viên **gắn truyền thông sau khi đi hội chợ về** (Deadline 1 ngày, nếu chưa gắn ➔ coi như chễ ➔ nộp phạt thêm bài như mục 3.2).
- **Phần 4 có báo cáo về số lượng và chất lượng win hàng từ hội chợ.**

### 3.4. Đăng Bài & Comment Trên MXH (Social Media KPI)
- Áp dụng cả nhân viên sales **part-time**: Khi tick chấm công ở mục 3.1 thì bắt đầu tính KPI.
- **Mỗi buổi làm tối thiểu**: 3 bài đăng + 5 comment.
- Có phần để nhân viên **gắn link bài đăng, hình ảnh bài đăng và ghi chú thông tin đơn hàng** trong bài đăng.
- **Phần 4 có báo cáo về số lượng và chất lượng win hàng từ MXH.**

---

## 📌 PHẦN 4: BÁO CÁO & PHÂN TÍCH HIỆU SUẤT

Báo cáo **hàng ngày, hàng tuần, hàng tháng** của từng nhân viên và cả teams:
1. **Thời gian và số lượng cuộc gọi** (tích hợp Phần 1 - ITY).
2. **Số khách hàng tiềm năng thu được** (Phần 1 & 2).
3. **Số đơn hàng hoàn thành trong tháng** (Phần 2 Bước 13).
4. **Số yêu cầu không đáp ứng được / đơn Fail** (Phần 2 Bước 5).
5. **Tỷ lệ thời gian trả lời tin nhắn của khách hàng**.
6. **Báo cáo truyền thông**: Số chiến dịch hoàn thành, số bài phạt, tiến độ (Phần 3.2).
7. **Báo cáo hội chợ**: Số lượng khách tiếp cận, chất lượng win hàng từ hội chợ (Phần 3.3).
8. **Báo cáo MXH**: Số bài đăng, số comment, chất lượng win hàng từ MXH (Phần 3.4).
9. **Báo cáo chấm công & KPI** (Phần 3.1 & 3.4).
