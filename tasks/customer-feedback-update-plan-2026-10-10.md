# Kế hoạch cập nhật CRM sau phản hồi khách hàng

Ngày lập: 10/10/2026. Trạng thái: chỉ lập kế hoạch, chưa triển khai mã nguồn và chưa phát hành VPS.

## 1. Mục tiêu

Hoàn thiện các điểm còn thiếu sau video phản hồi của khách, giữ các luồng đã được khách xác nhận ổn, bảo toàn dữ liệu hiện tại và nghiệm thu riêng theo hai vai trò Admin/Sales. Các thay đổi ưu tiên tính đúng dữ liệu trước, sau đó mới tối ưu thao tác và giao diện.

## 2. Phạm vi vòng cập nhật

- Hoàn thiện dữ liệu khách hàng từ ITY và Hội chợ.
- Làm rõ quy trình đơn xuất/nhập 12 bước và luồng tạo đơn từ khách có nhu cầu.
- Hoàn thiện bằng chứng, phản hồi và lịch sử duyệt chiến dịch truyền thông.
- Bổ sung hóa đơn chưa phát hành và rà chính sách chấm công nhiều ca.
- Rà responsive cho các màn hình Admin nhiều dữ liệu.
- Tích hợp mẫu báo giá thật khi nhận đủ file và công thức từ khách.
- Kiểm thử theo vai trò, triển khai staging, nghiệm thu, sau đó phát hành VPS có phương án rollback.

Không làm lại Dashboard, hệ thống theme, cấu trúc báo cáo hoặc các phần khách đã xác nhận ổn nếu không phát hiện lỗi hồi quy.

## 3. Quyết định kiến trúc

- Database tiếp tục là nguồn dữ liệu nghiệp vụ duy nhất; không lưu nghiệp vụ mới vào localStorage.
- Dữ liệu từ Hội chợ sang Lead phải sao chép đủ trường và giữ liên kết nguồn để truy ngược.
- Quy trình đơn vẫn giữ số bước nội bộ hiện tại để tránh phá dữ liệu; số hiển thị được đánh lại 01–12 theo loại xuất/nhập.
- Mỗi lần nộp chiến dịch là một bằng chứng có thời điểm, loại bằng chứng và người thao tác; không chỉ ghi đè một link duy nhất.
- ITY chỉ tự phân loại khi payload có trường nghiệp vụ đáng tin cậy. Nếu ITY không cung cấp, Sales phân loại trong CRM và lịch sử phải ghi người/thời gian sửa.
- Báo giá thật dùng adapter theo mẫu khách cung cấp, không mặc định Ocean Freight/THC là khoản phí cố định.
- Thay đổi schema phải có migration, sao lưu database trước deploy và kiểm tra dữ liệu sau migration.

## 4. Thứ tự triển khai

### Giai đoạn A — Chốt hợp đồng dữ liệu và bảo vệ dữ liệu

#### U01. Chốt hợp đồng phân loại ITY

**Mô tả:** Xác định trường nào trong webhook ITY thể hiện không nghe máy, không nhu cầu, đã dùng đơn vị khác và có nhu cầu. Thiết kế fallback thủ công nếu ITY chỉ trả thông tin kỹ thuật cuộc gọi.

**Tiêu chí nghiệm thu:**

- Có bảng ánh xạ giá trị ITY → bốn phân loại CRM, bao gồm giá trị không xác định.
- Một cuộc gọi được gửi lại không tạo bản ghi trùng và không ghi đè phân loại đã được Sales xác nhận bằng dữ liệu kém tin cậy hơn.
- Khi payload không có phân loại nghiệp vụ, Sales có thể chọn kết quả và lịch sử lưu người sửa, thời điểm sửa.

**Kiểm tra:** Replay payload ANSWERED, BUSY, 404, 480 và payload có/không có `disposition`; kiểm tra Lead, lịch sử gọi và báo cáo.

**Phụ thuộc:** Cần một payload thực tế có phân loại từ ITY hoặc xác nhận ITY không cung cấp trường này.

**Phạm vi dự kiến:** M.

#### U02. Sửa luồng khách Hội chợ → Lead

**Mô tả:** Bổ sung tên người liên hệ riêng, chuyển đủ công ty, MST, điện thoại, ngành nghề, địa chỉ và nội dung trao đổi sang Lead; tránh tạo trùng khách.

**Tiêu chí nghiệm thu:**

- Form Hội chợ tách “Tên người liên hệ” và “Tên công ty”.
- Lead tạo tự động có đủ `name`, `company`, `taxId`, `phone`, `industry`, `address`, `needs`, Sales phụ trách và nguồn Hội chợ.
- Trùng số điện thoại hoặc MST được cảnh báo và cho phép nối vào Lead có sẵn thay vì tạo bản sao âm thầm.

**Kiểm tra:** Tạo khách mới, tạo khách trùng số điện thoại, tạo khách trùng MST; mở lại ở Hội chợ, Lead và Báo cáo nguồn.

**Phụ thuộc:** U01 không bắt buộc.

**Phạm vi dự kiến:** M.

### Checkpoint A

- Migration chạy thành công trên bản sao database.
- Dữ liệu Lead cũ không mất và không bị đổi Sales phụ trách.
- Test webhook và luồng Hội chợ → Lead qua.

### Giai đoạn B — Quy trình đơn hàng

#### U03. Chuẩn hóa quy trình 12 bước theo xuất/nhập

**Mô tả:** Giữ ID bước nội bộ nhưng hiển thị số liên tục 01–12 theo từng loại đơn. Tách rõ hai chế độ Xuất khẩu và Nhập khẩu.

**Tiêu chí nghiệm thu:**

- Xuất khẩu hiển thị 12 bước liên tục và không có “Điều xe nhập khẩu”.
- Nhập khẩu hiển thị 12 bước liên tục và không có “Điều xe xuất khẩu”.
- Nút tiếp theo, kéo thả và chọn bước khác chỉ cho phép các bước hợp lệ của loại đơn.

**Kiểm tra:** Chuyển một đơn xuất và một đơn nhập qua toàn bộ luồng; kiểm tra desktop, tablet và điện thoại.

**Phụ thuộc:** Không.

**Phạm vi dự kiến:** M.

#### U04. Làm rõ luồng tạo đơn từ khách hàng

**Mô tả:** Thay luồng “Tạo đơn” đang đưa người dùng về Lead mà không giải thích bằng một hành trình có chủ đích: chọn khách có nhu cầu → chọn loại xuất/nhập → xác nhận → mở đơn mới.

**Tiêu chí nghiệm thu:**

- Nút trên trang quy trình ghi rõ “Chọn khách để tạo đơn”.
- Danh sách mặc định lọc khách có nhu cầu và chưa có đơn đang mở, nhưng vẫn cho phép tìm khách khác theo quyền.
- Sau khi tạo, hệ thống mở đúng đơn mới và giữ liên kết với Lead; thao tác lặp không tạo hai đơn ngoài ý muốn.

**Kiểm tra:** Admin và Sales tạo đơn; Sales không tạo được đơn từ khách ngoài phạm vi; double-click không nhân đôi đơn.

**Phụ thuộc:** U03.

**Phạm vi dự kiến:** M.

#### U05. Xác nhận quy tắc mã đơn

**Mô tả:** Nghiệm thu công thức đang dùng `LP-EX-YYMM-###` và `LP-IM-YYMM-###`, đồng thời làm chắc việc tăng số thứ tự khi có đơn bị xóa hoặc tạo đồng thời.

**Tiêu chí nghiệm thu:**

- Khách xác nhận prefix, dấu phân cách, kỳ đánh số và việc tách sequence xuất/nhập.
- Sinh mã không trùng khi hai người tạo đơn gần như đồng thời.
- Xóa/khôi phục đơn không làm tái sử dụng mã cũ.

**Kiểm tra:** Tạo đồng thời nhiều đơn, chuyển tháng và kiểm tra ràng buộc unique.

**Phụ thuộc:** Xác nhận công thức từ khách.

**Phạm vi dự kiến:** S–M.

### Checkpoint B

- Hai quy trình đều hoàn thành đúng 12 bước.
- Tạo đơn từ Lead chạy xuyên suốt và không nhân bản.
- Build và các test nghiệp vụ đơn hàng qua.

### Giai đoạn C — Chiến dịch, công nợ và chấm công

#### U06. Hoàn thiện bằng chứng và phản hồi duyệt chiến dịch

**Mô tả:** Tách các lần nộp kịch bản, sản phẩm nháp và sản phẩm final thành lịch sử bằng chứng; hiển thị rõ phản hồi trả lại cho nhân viên.

**Tiêu chí nghiệm thu:**

- Mỗi đầu việc hiển thị riêng link kịch bản, link sản phẩm nháp và link final hoặc timeline các phiên bản tương đương.
- Admin duyệt/trả lại được; lý do trả lại bắt buộc và Sales nhìn thấy ngay ở đầu việc.
- Nộp lại không xóa lịch sử cũ; chỉ Admin/Manager trong phạm vi được duyệt.

**Kiểm tra:** Sales nộp → Admin trả lại → Sales nộp lại → Admin duyệt qua hai vòng; kiểm tra lịch sử và quyền.

**Phụ thuộc:** Migration dữ liệu chiến dịch hiện có.

**Phạm vi dự kiến:** M.

#### U07. Bổ sung trạng thái hóa đơn chưa phát hành

**Mô tả:** Mở rộng màn Công nợ để Admin thấy các đơn đã đến bước thanh toán nhưng chưa phát hành hóa đơn, song song với các nhóm chưa thanh toán, sắp hạn, quá hạn và đã thanh toán.

**Tiêu chí nghiệm thu:**

- Có KPI/bộ lọc “Chưa phát hành”.
- Các nhóm không đếm trùng sai định nghĩa; tổng có chú thích phạm vi rõ ràng.
- Bấm vào KPI mở đúng danh sách và từ mỗi dòng vào đúng bước thanh toán của đơn.

**Kiểm tra:** Chuẩn bị tối thiểu một đơn cho từng trạng thái và đối chiếu số tổng với database.

**Phụ thuộc:** Không.

**Phạm vi dự kiến:** S.

#### U08. Hoàn thiện chính sách nhiều ca chấm công

**Mô tả:** Cho mở ca mới khi không còn ca đang mở, kể cả cùng ngày nếu doanh nghiệp dùng nhiều ca; ca cũ quá 17:30 được đóng tự động trước khi mở ca mới.

**Tiêu chí nghiệm thu:**

- Không thể có hai ca đang mở cùng lúc cho một nhân viên.
- Ca quên checkout tự đóng 17:30 và hiển thị lý do hệ thống đóng.
- Ca mới cùng ngày hoặc ngày tiếp theo mở được theo chính sách đã chốt; KPI MXH gắn đúng từng ca.

**Kiểm tra:** Ca bình thường, quên checkout, hai ca cùng ngày, mở ca ngày hôm sau và chạy tác vụ tự động nhiều lần.

**Phụ thuộc:** Xác nhận doanh nghiệp có cho nhiều ca cùng ngày hay chỉ một ca/ngày.

**Phạm vi dự kiến:** M.

### Checkpoint C

- Luồng duyệt chiến dịch có đầy đủ lịch sử và quyền.
- Số liệu công nợ khớp database.
- Chấm công không sinh hai ca mở và không làm sai KPI MXH.

### Giai đoạn D — Responsive và mẫu nghiệp vụ thật

#### U09. Rà responsive theo vai trò

**Mô tả:** Kiểm tra tất cả màn hình chính ở 360, 390, 768, 1366 và 1920 px. Ưu tiên các bảng Admin đang phụ thuộc kéo ngang.

**Thứ tự màn hình:** Quy trình đơn → Lead → Chiến dịch → Hội chợ → Chấm công → Đại lý → Công nợ → Báo cáo → Cài đặt.

**Tiêu chí nghiệm thu:**

- Không có cuộn ngang toàn trang ở điện thoại; bảng rộng chuyển thành card, danh sách tóm tắt hoặc drawer chi tiết phù hợp.
- Hành động chính luôn nhìn thấy và vùng bấm tối thiểu 40 px.
- Chữ nghiệp vụ không nhỏ hơn 13 px; tăng chữ không làm che nút hoặc mất dữ liệu.

**Kiểm tra:** Playwright chụp ảnh Admin/Sales tại các kích thước chuẩn; kiểm tra menu con, modal, bàn phím và lỗi console.

**Phụ thuộc:** U02–U08 để tránh sửa responsive hai lần.

**Phạm vi dự kiến:** Chia thành ba tác vụ M theo nhóm màn hình.

#### U10. Tích hợp mẫu Excel/PDF báo giá thật

**Mô tả:** Ánh xạ đúng hai file báo giá của khách, công thức, tiền tệ, thuế/phụ phí và bố cục PDF. Loại bỏ nhãn demo và dữ liệu mẫu khỏi luồng thật.

**Tiêu chí nghiệm thu:**

- Import hai file khách cung cấp cho kết quả đúng từng dòng và tổng tiền.
- Ocean Freight, THC và phụ phí đều sửa/xóa/thêm được theo cấu hình; không coi khoản mẫu là cố định.
- PDF khớp mẫu nhận diện và số liệu sau khi lưu/reload; phiên bản báo giá cũ vẫn tra được.

**Kiểm tra:** Golden test với hai file mẫu đã chốt; đối chiếu tổng tiền thủ công và PDF render.

**Phụ thuộc:** Hai file thật, công thức tính, quy tắc làm tròn/thuế và mẫu PDF được khách xác nhận.

**Phạm vi dự kiến:** M–L, tách riêng import, tính giá và PDF nếu mẫu phức tạp.

### Checkpoint D

- Bộ ảnh responsive Admin/Sales được rà đủ.
- Không còn chữ “demo” trong luồng báo giá đã nghiệm thu.
- Import, tính giá và PDF khớp dữ liệu chuẩn của khách.

### Giai đoạn E — Kiểm thử, staging và phát hành

#### U11. Regression và nghiệm thu theo vai trò

**Mô tả:** Chạy test tự động và kịch bản nghiệp vụ xuyên suốt bằng hai tài khoản Admin/Sales.

**Tiêu chí nghiệm thu:**

- Test, lint và production build qua; không có lỗi console/nghiệp vụ nghiêm trọng.
- Các luồng ITY → Lead → Đơn → Thanh toán và Hội chợ/MXH → Lead → Báo cáo chạy xuyên suốt.
- Có ảnh chứng minh desktop/mobile cho từng phần được sửa và danh sách giới hạn còn lại.

**Phụ thuộc:** U01–U10, trừ phần đang chờ dữ liệu bên ngoài được ghi rõ.

**Phạm vi dự kiến:** M.

#### U12. Phát hành staging rồi production VPS

**Mô tả:** Sao lưu, triển khai, migrate, smoke test và chuẩn bị rollback. Staging được khách duyệt trước khi thay bản production.

**Tiêu chí nghiệm thu:**

- Có backup database, uploads và cấu hình cần thiết; restore được kiểm tra tối thiểu trên bản sao.
- Staging chạy HTTPS, webhook/call flow, đăng nhập và các trang chính hoạt động.
- Production chỉ phát hành sau khi checklist staging được duyệt; có commit/build/database để rollback.

**Kiểm tra:** Health check, đăng nhập Admin/Sales, tạo Lead/đơn thử, webhook thử, kiểm tra Nginx/PM2 log và chứng chỉ HTTPS.

**Phụ thuộc:** U11 và quyền truy cập hạ tầng còn hiệu lực.

**Phạm vi dự kiến:** M.

## 5. Definition of Done

Một đầu việc chỉ được coi là xong khi:

- Dữ liệu lưu thật, reload không mất và quyền Admin/Sales đúng.
- Có trạng thái loading, thành công, lỗi và cách thử lại.
- Test tập trung cho logic có rủi ro; build production qua.
- Manual test desktop và mobile theo vai trò.
- Không làm sai số liệu Dashboard/Báo cáo hiện có.
- Migration có backup và đường rollback.
- Có ảnh hoặc log kiểm thử để đối chiếu với tiêu chí nghiệm thu.

## 6. Dữ liệu cần nhận thêm

1. Một payload ITY thực tế có kết quả phân loại khách, hoặc xác nhận ITY không gửi trường đó.
2. Hai file Excel báo giá thật và một PDF đầu ra mong muốn.
3. Quy tắc tiền tệ, thuế, làm tròn và các khoản phí mặc định nếu có.
4. Xác nhận mã đơn chính xác và sequence xuất/nhập.
5. Xác nhận nhân viên có được mở nhiều ca trong cùng một ngày.

Các mục U02, U03, U04, U06, U07 và phần lớn U09 có thể triển khai trước mà không chờ các dữ liệu trên.

## 7. Rủi ro và giảm thiểu

| Rủi ro | Mức | Cách giảm thiểu |
| --- | --- | --- |
| ITY không gửi phân loại nghiệp vụ | Cao | Fallback phân loại thủ công, không suy diễn từ trạng thái SIP ngoài “không nghe máy” |
| Migration làm mất hoặc nhân đôi Lead | Cao | Backup, chạy trên bản sao, kiểm tra count và mapping trước/sau |
| Thay số bước làm hỏng đơn cũ | Cao | Giữ ID bước nội bộ, chỉ đổi số hiển thị và giới hạn transition |
| Tăng chữ làm vỡ bảng | Trung bình | Chụp ảnh nhiều viewport và chuyển bảng dài thành card/drawer |
| File Excel khách thay đổi cấu trúc | Trung bình | Adapter theo phiên bản mẫu, validate header và báo lỗi rõ |
| Deploy làm gián đoạn webhook | Cao | Staging trước, cửa sổ phát hành ngắn, backup và rollback nhanh |

