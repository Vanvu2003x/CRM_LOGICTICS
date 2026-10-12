# Danh sách đầu việc tối ưu CRM Logistics

Ngày 07/10/2026. Đã triển khai bản demo; xem ghi nhận kiểm tra ở cuối file. Xem plan.md cho nguồn yêu cầu, phạm vi, quy tắc còn mở và mốc nghiệm thu. S khoảng 1–2 file; M khoảng 3–5 file. Các đường dẫn có chữ dự kiến là nơi đề xuất, không khẳng định file đã tồn tại. Nếu đầu việc lớn hơn giới hạn, chia theo từng luồng trước khi thực hiện. T14 và T15 đã chia nhỏ.

Điều kiện hoàn thành chung: tiêu chí được chứng minh, quyền server đúng, có trạng thái lỗi và lưu/reload đúng; test phù hợp hành vi, lint/build tại các checkpoint, manual/browser cho UI. Mỗi tính năng xác định màn hình/thao tác Admin và Sales, mặc định theo quyền, một hành động chính và đường quay lại giữ bộ lọc. Giữ Kanban 13 cột và bố cục Pipeline hiện tại. Giao diện đẹp, gọn, không modal lồng, không bắt nhập hoặc bấm dư. Các ô nghiệm thu gốc chỉ đánh dấu khi đủ bằng chứng; bản demo không thay thế nghiệm thu tích hợp thật.

## T01 Chốt ma trận yêu cầu

- [ ] Hoàn thành T01

Phụ thuộc: Không. Phạm vi dự kiến: M.

Mục tiêu: Map đủ Phần 1, 13 bước Phần 2, 4 mục Phần 3 và Phần 4; sitemap và thuật ngữ thống nhất.

Tiêu chí nghiệm thu:

- [ ] Map đủ Phần 1, 13 bước Phần 2, 4 mục Phần 3 và Phần 4; sitemap và thuật ngữ thống nhất.
- [ ] Ghi rõ quy tắc đã xác nhận, đề xuất tạm và phần còn chờ khách; danh sách 3 mẫu Excel/payload ITY cần lấy.
- [ ] Có luồng và bố cục dự kiến cho Admin/Sales trên các màn chính; quy định giữ nguyên Kanban và bố cục Pipeline; tiêu chí đẹp/gọn và số lần bấm gắn từng luồng.

Kiểm tra: Đối chiếu Word và ảnh truyền thông; rà từng dòng ma trận, không coi đề xuất là yêu cầu đã duyệt.

File dự kiến: docs/REQUIREMENTS_AND_ITY_API.md; tasks/plan.md; tasks/todo.md.

## T02 Phiên đăng nhập và dữ liệu người dùng

- [ ] Hoàn thành T02

Phụ thuộc: T01. Phạm vi dự kiến: M.

Mục tiêu: Mật khẩu được băm; đăng nhập bắt buộc kiểm tra; phiên được server xác thực và logout hủy phiên.

Tiêu chí nghiệm thu:

- [ ] Mật khẩu được băm; đăng nhập bắt buộc kiểm tra; phiên được server xác thực và logout hủy phiên.
- [ ] Client không nhận password; bỏ quyền tự đổi sang tài khoản khác qua dropdown/cookie ID.

Kiểm tra: Đăng nhập đúng/sai; giả cookie; logout rồi tải lại; kiểm tra dữ liệu trả client không có password.

File dự kiến: src/app/login/actions.ts; src/components/auth/UserContext.tsx; src/app/layout.tsx; src/proxy.ts; src/lib/auth.ts (dự kiến).

## T03 Quyền truy cập và team

- [ ] Hoàn thành T03

Phụ thuộc: T02. Phạm vi dự kiến: M.

Mục tiêu: Có team và thành viên; các vai trò/phạm vi theo đặc tả đã chốt.

Tiêu chí nghiệm thu:

- [ ] Có team và thành viên; các vai trò/phạm vi theo đặc tả đã chốt.
- [ ] Có helper server kiểm tra người, quyền và phạm vi; không tin userId hay vai trò client gửi.

Kiểm tra: Gọi action bằng tài khoản Sales/Manager/Admin; truy cập team khác bị từ chối; người chưa đăng nhập không sửa dữ liệu.

File dự kiến: prisma/schema.prisma; src/lib/auth.ts (dự kiến); src/app/settings/users/actions.ts (dự kiến); src/app/settings/teams/actions.ts (dự kiến); src/app/settings/teams/page.tsx (dự kiến).

## T04 Lead dùng database chung

- [ ] Hoàn thành T04

Phụ thuộc: T02–T03. Phạm vi dự kiến: M.

Mục tiêu: Xem/thêm/sửa/lọc Lead dùng database và salesId; Admin/Manager/Sales đúng phạm vi.

Tiêu chí nghiệm thu:

- [ ] Xem/thêm/sửa/lọc Lead dùng database và salesId; Admin/Manager/Sales đúng phạm vi.
- [ ] Có bản sao và quy trình nhập dữ liệu localStorage có kiểm tra; không âm thầm mất hoặc nhân đôi khách.

Kiểm tra: Thêm Lead rồi reload và mở trình duyệt khác; so sánh Dashboard/Báo cáo; thử tên sales gần giống nhau.

File dự kiến: src/app/leads/page.tsx; src/app/leads/actions.ts (dự kiến); src/lib/leads.ts (dự kiến); src/components/demo/DemoDataProvider.tsx; script nhập demo (dự kiến).

## T05 Danh sách và Kanban đơn dùng database

- [ ] Hoàn thành T05

Phụ thuộc: T03–T04. Phạm vi dự kiến: M.

Mục tiêu: Danh sách, Fail và Kanban đọc cùng Order, cùng mã và quyền; kéo thả lưu server theo quy tắc.

Tiêu chí nghiệm thu:

- [ ] Danh sách, Fail và Kanban đọc cùng Order, cùng mã và quyền; kéo thả lưu server theo quy tắc.
- [ ] Filter stage/status/search có thể mở bằng URL; không coi các đơn demo trùng mã là cùng dữ liệu thật.

Kiểm tra: Từ Dashboard vào đúng order/stage; kéo thả rồi reload; người khác team không thấy/sửa đơn.

File dự kiến: src/app/orders/page.tsx; src/components/demo/OrderList.tsx; src/app/pipeline/page.tsx; src/app/orders/actions.ts (dự kiến); src/lib/orders.ts (dự kiến).

## T06 Webhook ITY và lịch sử cuộc gọi

- [ ] Hoàn thành T06

Phụ thuộc: T03–T04. Phạm vi dự kiến: M.

Mục tiêu: Xác thực cấu hình, kiểm tra payload; cùng callid nhận nhiều lần chỉ xử lý một lần, ghi cuộc gọi và cập nhật liên quan nhất quán.

Tiêu chí nghiệm thu:

- [ ] Xác thực cấu hình, kiểm tra payload; cùng callid nhận nhiều lần chỉ xử lý một lần, ghi cuộc gọi và cập nhật liên quan nhất quán.
- [ ] Lưu sales, thời gian, thời lượng, ghi âm và userfield nếu ITY cung cấp; ánh xạ nhu cầu có/không/chưa xác định đúng hợp đồng.

Kiểm tra: Payload đủ/thiếu, sai secret, gọi trùng, đến sai thứ tự; kiểm tra số lần/thời lượng và sales không bị ghi sai.

File dự kiến: src/app/api/wsapi/[customer]/call_answered/route.ts; prisma/schema.prisma; src/lib/ity.ts (dự kiến); test webhook (dự kiến).

## T07 Cấu hình và thao tác ITY trong CRM

- [ ] Hoàn thành T07

Phụ thuộc: T02–T06. Phạm vi dự kiến: M.

Mục tiêu: Lưu cấu hình bằng quyền Admin; secret không trả client hoặc log toàn URL; chế độ demo có nhãn.

Tiêu chí nghiệm thu:

- [ ] Lưu cấu hình bằng quyền Admin; secret không trả client hoặc log toàn URL; chế độ demo có nhãn.
- [ ] Nút gọi/đồng bộ trả trạng thái thật của chế độ đang dùng; chỉ bật kết nối ITY thật khi có tài liệu và cấu hình kiểm chứng.

Kiểm tra: Lưu/reload cấu hình; API thất bại không hiện thành công; demo không phát cuộc gọi thật.

File dự kiến: src/app/settings/page.tsx; src/app/api/ity/click2call/route.ts; src/components/ity/WebphoneWidget.tsx; src/lib/ity.ts (dự kiến); src/app/leads/page.tsx.

## T08 Nhật ký và lịch chăm sóc

- [ ] Hoàn thành T08

Phụ thuộc: T04–T06. Phạm vi dự kiến: M.

Mục tiêu: Lưu từng lần chăm sóc, nhu cầu, người thực hiện và hạn tiếp theo; lịch sử gọi giữ riêng.

Tiêu chí nghiệm thu:

- [ ] Lưu từng lần chăm sóc, nhu cầu, người thực hiện và hạn tiếp theo; lịch sử gọi giữ riêng.
- [ ] Khách có nhu cầu vào danh sách tiềm năng; đủ dữ liệu sinh nhắc follow-up/khuyến mãi theo quy tắc.

Kiểm tra: Nhập liên hệ thủ công không đổi KPI cuộc gọi; lịch sử còn sau reload; nhu cầu chưa rõ không tự tính là có nhu cầu.

File dự kiến: prisma/schema.prisma; src/app/leads/actions.ts (dự kiến); src/app/leads/page.tsx; src/components/pipeline/steps/Step01Care.tsx.

## T09 Tạo đơn từ khách tiềm năng

- [ ] Hoàn thành T09

Phụ thuộc: T04–T05. Phạm vi dự kiến: M.

Mục tiêu: Tạo đơn và cập nhật Lead nhất quán; giữ sales, khách, nguồn và mã đơn duy nhất.

Tiêu chí nghiệm thu:

- [ ] Tạo đơn và cập nhật Lead nhất quán; giữ sales, khách, nguồn và mã đơn duy nhất.
- [ ] Bấm lặp không tạo đơn trùng; quan hệ nhiều đơn tuân theo quy tắc khách đã chốt.

Kiểm tra: Tạo rồi mở đúng chi tiết; thử hai yêu cầu đồng thời; kiểm tra nguồn hội chợ/ITY được giữ.

File dự kiến: src/app/leads/actions.ts (dự kiến); src/app/leads/page.tsx; src/lib/orders.ts (dự kiến); prisma/schema.prisma.

## T10 Lưu thông tin và quy tắc 13 bước

- [ ] Hoàn thành T10

Phụ thuộc: T05–T09. Phạm vi dự kiến: M.

Mục tiêu: Lưu đủ 11 trường/danh mục bước 2; xem bước không chuyển tiến độ, lưu nháp không hoàn thành.

Tiêu chí nghiệm thu:

- [ ] Lưu đủ 11 trường/danh mục bước 2; xem bước không chuyển tiến độ, lưu nháp không hoàn thành.
- [ ] Có trạng thái/lịch sử hoàn thành từng bước và nhánh XK/NK; chọn bước 13 không tự hoàn thành đơn.

Kiểm tra: Đổi tab và reload giữ thông tin; bước không áp dụng không chặn; bỏ qua điều kiện bị báo rõ; âm/dữ liệu sai bị chặn.

File dự kiến: src/app/pipeline/[orderId]/page.tsx; src/components/pipeline/steps/Step02OrderInfo.tsx; src/app/orders/actions.ts (dự kiến); src/lib/order-workflow.ts (dự kiến); prisma/schema.prisma.

## T11 Báo giá nhà cung cấp

- [ ] Hoàn thành T11

Phụ thuộc: T10. Phạm vi dự kiến: M.

Mục tiêu: Thêm/sửa danh sách khoảng 3–5 báo giá riêng từng đơn với nhà cung cấp, giá và ghi chú.

Tiêu chí nghiệm thu:

- [ ] Thêm/sửa danh sách khoảng 3–5 báo giá riêng từng đơn với nhà cung cấp, giá và ghi chú.
- [ ] Không dùng thẻ mẫu chung; thay đổi chỉ ảnh hưởng đơn đang mở.

Kiểm tra: Tạo 3 báo giá rồi reload; hai đơn dữ liệu khác nhau; tổng/tiền tệ hiển thị đúng.

File dự kiến: src/components/pipeline/steps/Step03PriceCollection.tsx; src/app/orders/actions.ts (dự kiến); prisma/schema.prisma.

## T12 Báo giá theo mẫu Excel công ty

- [ ] Hoàn thành T12

Phụ thuộc: T10–T11; mẫu báo giá. Phạm vi dự kiến: M.

Mục tiêu: Kiểm chứng sớm công thức/ô dữ liệu của mẫu; sửa phí/tên/ĐVT/đơn giá/số lượng, lưu báo giá theo đơn.

Tiêu chí nghiệm thu:

- [ ] Kiểm chứng sớm công thức/ô dữ liệu của mẫu; sửa phí/tên/ĐVT/đơn giá/số lượng, lưu báo giá theo đơn.
- [ ] PDF dùng dữ liệu đã lưu, đúng mẫu và tiếng Việt; giữ phiên bản/file; tick hoàn thành riêng sau khi xuất.

Kiểm tra: So vài ca tính với Excel gốc, kiểm tra làm tròn và tổng; mở PDF nhiều dòng; reload còn báo giá. Khi chưa có mẫu chỉ nghiệm thu mẫu demo có nhãn.

File dự kiến: src/components/pipeline/steps/Step04Quotation.tsx; src/lib/export-pdf.ts; src/lib/quotation.ts (dự kiến); prisma/schema.prisma; test tính giá (dự kiến).

## T13 Feedback và lý do fail

- [ ] Hoàn thành T13

Phụ thuộc: T10–T12. Phạm vi dự kiến: M.

Mục tiêu: Đồng ý chuyển bước 6; không đồng ý chọn quay về 2 hoặc fail kèm lý do.

Tiêu chí nghiệm thu:

- [ ] Đồng ý chuyển bước 6; không đồng ý chọn quay về 2 hoặc fail kèm lý do.
- [ ] Lưu lịch sử quyết định và ngày fail; khách không nhu cầu không tự trở thành đơn fail.

Kiểm tra: Chạy cả ba nhánh; đơn fail hiện đúng danh sách/báo cáo; dữ liệu báo giá cũ còn để tham chiếu.

File dự kiến: src/components/pipeline/steps/Step05Feedback.tsx; src/app/orders/actions.ts (dự kiến); src/lib/order-workflow.ts (dự kiến).

## T14a Booking

- [ ] Hoàn thành T14a

Phụ thuộc: T13. Phạm vi dự kiến: S.

Mục tiêu: ETD, ETA, LINE, giá/tiền tệ được lưu theo đơn; có kiểm tra dữ liệu ngày/giá.

Tiêu chí nghiệm thu:

- [ ] ETD, ETA, LINE, giá/tiền tệ được lưu theo đơn; có kiểm tra dữ liệu ngày/giá.
- [ ] Hoàn thành bước bằng thao tác riêng và điều kiện đã chốt.

Kiểm tra: Lưu/reload, nhập thiếu/ngày sai; hai đơn có booking riêng.

File dự kiến: src/components/pipeline/steps/Step06Booking.tsx; src/app/orders/actions.ts (dự kiến); prisma/schema.prisma.

## T14b Đại lý và liên kết đơn

- [ ] Hoàn thành T14b

Phụ thuộc: T10. Phạm vi dự kiến: M.

Mục tiêu: Tìm/thêm/sửa/deactivate đại lý hoạt động và dùng database.

Tiêu chí nghiệm thu:

- [ ] Tìm/thêm/sửa/deactivate đại lý hoạt động và dùng database.
- [ ] Chọn đại lý lưu vào đơn; đại lý ngừng hoạt động không mất lịch sử và không được chọn mới.

Kiểm tra: Deactivate đại lý đang có đơn; lịch sử còn; tạo/chọn đại lý mới rồi reload.

File dự kiến: src/app/agents/page.tsx; src/components/pipeline/steps/Step07Agent.tsx; src/app/agents/actions.ts (dự kiến); prisma/schema.prisma.

## T14c Điều xe và ảnh giao nhận

- [ ] Hoàn thành T14c

Phụ thuộc: T10–T14a. Phạm vi dự kiến: M.

Mục tiêu: Lưu nhà xe, giá, thời điểm, số xe và ảnh thật; ảnh còn truy cập sau reload.

Tiêu chí nghiệm thu:

- [ ] Lưu nhà xe, giá, thời điểm, số xe và ảnh thật; ảnh còn truy cập sau reload.
- [ ] Bước 8 áp dụng XK, bước 11 áp dụng NK; tick giao xong mới hoàn thành bước.

Kiểm tra: Đơn XK/NK đúng nhánh; upload đúng/sai định dạng/dung lượng; người không có quyền không đọc/sửa file.

File dự kiến: src/components/pipeline/steps/Step08TransportExport.tsx; src/components/pipeline/steps/Step11TransportImport.tsx; src/app/orders/actions.ts (dự kiến); route upload (dự kiến); prisma/schema.prisma.

## T15a Vận đơn xuất khẩu

- [ ] Hoàn thành T15a

Phụ thuộc: T10–T12; mẫu vận đơn. Phạm vi dự kiến: M.

Mục tiêu: Nhập/ánh xạ trường từ mẫu vận đơn thực tế và lưu theo đơn XK.

Tiêu chí nghiệm thu:

- [ ] Nhập/ánh xạ trường từ mẫu vận đơn thực tế và lưu theo đơn XK.
- [ ] Xuất PDF đúng dữ liệu/mẫu, lưu file và trạng thái gửi/xác nhận đã chốt.

Kiểm tra: Nhập một mẫu có dữ liệu rồi so PDF; không chỉ đếm dòng/file; thử file lỗi và đơn NK.

File dự kiến: src/components/pipeline/steps/Step09Documents.tsx; src/lib/bill-of-lading.ts (dự kiến); src/lib/export-pdf.ts; src/app/orders/actions.ts (dự kiến).

## T15b Checklist nhập khẩu và MNF

- [ ] Hoàn thành T15b

Phụ thuộc: T10. Phạm vi dự kiến: M.

Mục tiêu: Lưu trạng thái MBL/HBL/INV/PL/C.O/DN và nhóm D.O/AN, có lịch MNF.

Tiêu chí nghiệm thu:

- [ ] Lưu trạng thái MBL/HBL/INV/PL/C.O/DN và nhóm D.O/AN, có lịch MNF.
- [ ] Hiển thị rõ đủ/thiếu và áp dụng đúng trình tự tài liệu đã chốt.

Kiểm tra: Tick rồi reload; chưa đủ nhóm đầu không báo hoàn thành; ngày MNF được lưu/hiển thị đúng.

File dự kiến: src/components/pipeline/steps/Step09Documents.tsx; src/app/orders/actions.ts (dự kiến); prisma/schema.prisma.

## T15c Hải quan

- [ ] Hoàn thành T15c

Phụ thuộc: T10–T15b. Phạm vi dự kiến: S.

Mục tiêu: Lưu số tờ khai, luồng đỏ/vàng/xanh, trạng thái và ghi chú theo đơn.

Tiêu chí nghiệm thu:

- [ ] Lưu số tờ khai, luồng đỏ/vàng/xanh, trạng thái và ghi chú theo đơn.
- [ ] Phân biệt luồng với trạng thái thông quan; không đổi đơn khác.

Kiểm tra: Lưu/reload cả ba luồng và trạng thái; dữ liệu thiếu không báo hoàn thành giả.

File dự kiến: src/components/pipeline/steps/Step10Customs.tsx; src/app/orders/actions.ts (dự kiến); prisma/schema.prisma.

## T15d Bảng kê chi phí

- [ ] Hoàn thành T15d

Phụ thuộc: T12–T14c; mẫu bảng kê. Phạm vi dự kiến: M.

Mục tiêu: Bảng kê dùng dòng chi phí của đơn, sửa/thêm phí và tính tổng đúng.

Tiêu chí nghiệm thu:

- [ ] Bảng kê dùng dòng chi phí của đơn, sửa/thêm phí và tính tổng đúng.
- [ ] Xuất đúng mẫu công ty, đủ dòng/tiền tệ, lưu bản phát hành và tick hoàn thành.

Kiểm tra: Tổng từng dòng và PDF khớp; phí xe có trong PDF; thử nhiều dòng, không dùng số cố định chung.

File dự kiến: src/components/pipeline/steps/Step12CostSheet.tsx; src/lib/cost-sheet.ts (dự kiến); src/lib/export-pdf.ts; src/app/orders/actions.ts (dự kiến).

## T16 Hóa đơn và thanh toán

- [ ] Hoàn thành T16

Phụ thuộc: T10–T15d. Phạm vi dự kiến: M.

Mục tiêu: Lưu số hóa đơn, ngày phát hành, hạn, số tiền và trạng thái thanh toán theo đơn.

Tiêu chí nghiệm thu:

- [ ] Lưu số hóa đơn, ngày phát hành, hạn, số tiền và trạng thái thanh toán theo đơn.
- [ ] Tách phát hành/thu tiền; hoàn thành đơn khi xác nhận thanh toán; màu và filter theo hạn thật.

Kiểm tra: Còn 8/7/1 ngày, quá hạn, đã trả; tới bước 13 chưa trả vẫn đang xử lý; báo cáo khớp.

File dự kiến: src/components/pipeline/steps/Step13Payment.tsx; src/app/payments/page.tsx; src/app/orders/actions.ts (dự kiến); prisma/schema.prisma; test thanh toán (dự kiến).

## T17 Chấm công theo ca

- [ ] Hoàn thành T17

Phụ thuộc: T03. Phạm vi dự kiến: M.

Mục tiêu: Có giờ vào/ra và định danh từng ca; cho nhiều ca/ngày theo quy tắc đã chốt, chống ca trùng/chồng.

Tiêu chí nghiệm thu:

- [ ] Có giờ vào/ra và định danh từng ca; cho nhiều ca/ngày theo quy tắc đã chốt, chống ca trùng/chồng.
- [ ] Nhân viên chấm công của mình; quyền chỉnh của quản lý lưu lịch sử.

Kiểm tra: Hai ca cùng ngày, ca chồng, qua ngày; thử thao tác user khác; tính giờ Việt Nam.

File dự kiến: src/app/attendance/page.tsx; src/app/attendance/actions.ts; src/app/attendance/AttendanceClient.tsx; prisma/schema.prisma; test ca làm (dự kiến).

## T18 KPI MXH theo ca

- [ ] Hoàn thành T18

Phụ thuộc: T17–T04. Phạm vi dự kiến: M.

Mục tiêu: Một ca có 3 bài/5 comment theo định mức; lưu link/ảnh/ghi chú và gắn đúng ca, chống đếm trùng bằng chứng theo quy tắc.

Tiêu chí nghiệm thu:

- [ ] Một ca có 3 bài/5 comment theo định mức; lưu link/ảnh/ghi chú và gắn đúng ca, chống đếm trùng bằng chứng theo quy tắc.
- [ ] Khách phát sinh có liên kết bài/ca/nhân viên tới Lead; không tính nội dung ngoài ca nếu chưa được phép.

Kiểm tra: Hai ca không dùng chung 3 bài; chưa chấm công/đã ra ca; URL sai/trùng; truy nguồn khách và đơn.

File dự kiến: src/app/social-kpi/page.tsx; src/app/social-kpi/actions.ts; src/app/social-kpi/SocialKpiClient.tsx; prisma/schema.prisma; test KPI (dự kiến).

## T19 Phân công truyền thông theo deadline

- [ ] Hoàn thành T19

Phụ thuộc: T03. Phạm vi dự kiến: M.

Mục tiêu: Một chiến dịch có nhiều phân công, mỗi việc có nhân viên, deadline, loại sản phẩm, yêu cầu/nội dung phù hợp ảnh mẫu.

Tiêu chí nghiệm thu:

- [ ] Một chiến dịch có nhiều phân công, mỗi việc có nhân viên, deadline, loại sản phẩm, yêu cầu/nội dung phù hợp ảnh mẫu.
- [ ] Có nhiều link/bằng chứng cho bộ video/bài/ảnh; chỉ người có quyền giao/sửa.

Kiểm tra: Tạo hai việc khác deadline trong cùng chiến dịch; nhân viên chỉ thấy đúng phạm vi; lưu/reload đủ trường.

File dự kiến: prisma/schema.prisma; src/app/campaigns/actions.ts; src/app/campaigns/CampaignsClient.tsx; src/app/campaigns/page.tsx.

## T20 Nộp và duyệt truyền thông

- [ ] Hoàn thành T20

Phụ thuộc: T19. Phạm vi dự kiến: M.

Mục tiêu: Có hai vòng nộp/chờ duyệt/trả lại; người nộp và người duyệt phân quyền theo quy tắc.

Tiêu chí nghiệm thu:

- [ ] Có hai vòng nộp/chờ duyệt/trả lại; người nộp và người duyệt phân quyền theo quy tắc.
- [ ] Lưu phiên bản/link, nhận xét, người và thời điểm; không ghi đè mất sản phẩm trước.

Kiểm tra: Nhân viên không tự duyệt; quản lý trả lại đúng vòng; nộp lại và hoàn thành giữ lịch sử.

File dự kiến: src/app/campaigns/actions.ts; src/app/campaigns/CampaignsClient.tsx; prisma/schema.prisma; test duyệt (dự kiến).

## T21 Nghĩa vụ phạt truyền thông

- [ ] Hoàn thành T21

Phụ thuộc: T19–T20; quy tắc phạt. Phạm vi dự kiến: M.

Mục tiêu: Một bài phạt cho mỗi ngày trễ theo quy tắc chốt, có nguồn/ngày; chạy lại không tạo trùng.

Tiêu chí nghiệm thu:

- [ ] Một bài phạt cho mỗi ngày trễ theo quy tắc chốt, có nguồn/ngày; chạy lại không tạo trùng.
- [ ] Bài phạt có link nộp và trạng thái; dừng phát sinh đúng mốc; không phạt người chờ duyệt nếu quy tắc miễn.

Kiểm tra: Trễ 1–3 ngày, chạy lại/đồng thời, nộp sát hạn và chờ duyệt; kiểm tra số bài còn thiếu.

File dự kiến: src/lib/penalties.ts (dự kiến); src/app/campaigns/actions.ts; prisma/schema.prisma; test deadline (dự kiến).

## T22 Đăng ký hội chợ nhiều ngày và ca

- [ ] Hoàn thành T22

Phụ thuộc: T03. Phạm vi dự kiến: M.

Mục tiêu: Một hội chợ có các ngày/ca; nhân viên chọn nhiều ca cụ thể, không đăng ký ngoài lịch.

Tiêu chí nghiệm thu:

- [ ] Một hội chợ có các ngày/ca; nhân viên chọn nhiều ca cụ thể, không đăng ký ngoài lịch.
- [ ] Không tham gia ngày nào phải có lý do theo quy tắc; phân biệt chưa đăng ký và từ chối tham gia.

Kiểm tra: Sự kiện ba ngày chọn sáng ngày đầu/chiều ngày cuối; trùng ca/ngoài lịch; lưu lý do và quyền.

File dự kiến: src/app/trade-fairs/page.tsx; src/app/trade-fairs/actions.ts; src/app/trade-fairs/TradeFairsClient.tsx; prisma/schema.prisma.

## T23 Kết quả và truyền thông sau hội chợ

- [ ] Hoàn thành T23

Phụ thuộc: T22–T04–T08; quy tắc hạn hội chợ. Phạm vi dự kiến: M.

Mục tiêu: Lưu công ty, MST, SĐT, ngành nghề, địa chỉ, trao đổi; gắn Lead đúng sales và nguồn trong cùng thao tác nhất quán.

Tiêu chí nghiệm thu:

- [ ] Lưu công ty, MST, SĐT, ngành nghề, địa chỉ, trao đổi; gắn Lead đúng sales và nguồn trong cùng thao tác nhất quán.
- [ ] Có hạn nộp kết quả/link sau tham gia; phạt theo quy tắc; phát hiện khách trùng để xử lý, không tự gộp sai.

Kiểm tra: Nhập khách rồi vào Lead chăm sóc; quá hạn/đúng hạn; cùng khách hai lần; lỗi giữa thao tác không tạo nửa dữ liệu.

File dự kiến: src/app/trade-fairs/actions.ts; src/app/trade-fairs/TradeFairsClient.tsx; prisma/schema.prisma; src/lib/penalties.ts (dự kiến).

## T24 Nhắc việc có lịch và chống lặp

- [ ] Hoàn thành T24

Phụ thuộc: T08–T16–T21–T23. Phạm vi dự kiến: M.

Mục tiêu: Sinh nhắc follow-up/khuyến mãi, chiến dịch trước 2 ngày, công nợ trước 7 ngày, hạn hội chợ; gắn người và nguồn.

Tiêu chí nghiệm thu:

- [ ] Sinh nhắc follow-up/khuyến mãi, chiến dịch trước 2 ngày, công nợ trước 7 ngày, hạn hội chợ; gắn người và nguồn.
- [ ] Tác vụ lịch chạy không phụ thuộc trang đang mở, chống trùng; đóng/đổi hạn/đã trả tiền cập nhật đúng việc.

Kiểm tra: Chạy giả lập đồng hồ trước/sau hạn và chạy lặp; chỉ đúng người thấy; link vào đúng bản ghi; không gửi ngoài CRM mặc định.

File dự kiến: src/lib/reminders.ts (dự kiến); src/app/tasks/page.tsx; prisma/schema.prisma; scripts/run-reminders.ts (dự kiến); test nhắc việc (dự kiến).

## T25 Báo cáo kinh doanh và bộ lọc

- [ ] Hoàn thành T25

Phụ thuộc: T03–T06–T09–T13–T16. Phạm vi dự kiến: M.

Mục tiêu: Ngày/tuần/tháng theo nhân viên/team; calls/thời lượng, Lead, chốt báo giá, hoàn thành và fail dựa đúng ngày sự kiện.

Tiêu chí nghiệm thu:

- [ ] Ngày/tuần/tháng theo nhân viên/team; calls/thời lượng, Lead, chốt báo giá, hoàn thành và fail dựa đúng ngày sự kiện.
- [ ] Không biến số 0 thành dữ liệu giả; nguồn tin nhắn chưa có thì báo chưa kết nối, không tính số giả.

Kiểm tra: Đối chiếu bộ dữ liệu nhỏ biết trước kết quả; giao tháng/tuần/timezone; filters và quyền; Win không đếm mọi đơn.

File dự kiến: src/app/reports/page.tsx; src/app/reports/ReportsClient.tsx; src/lib/reports.ts (dự kiến); test báo cáo (dự kiến).

## T26 Báo cáo công việc và nguồn thành công

- [ ] Hoàn thành T26

Phụ thuộc: T18–T20–T21–T23–T25. Phạm vi dự kiến: M.

Mục tiêu: Báo cáo ca/KPI, tiến độ chiến dịch, đúng/trễ hạn, bài phạt phát sinh/đã nộp/còn thiếu.

Tiêu chí nghiệm thu:

- [ ] Báo cáo ca/KPI, tiến độ chiến dịch, đúng/trễ hạn, bài phạt phát sinh/đã nộp/còn thiếu.
- [ ] Tách số khách, Lead và đơn thành công theo hội chợ/MXH/ITY; quy tắc ghi nhận nguồn rõ, không đếm trùng.

Kiểm tra: Một khách qua nhiều lần tiếp cận; đơn quay lại rồi thành công; hai ca/ngày; tổng team bằng tổng nhân viên thuộc kỳ.

File dự kiến: src/app/reports/page.tsx; src/app/reports/ReportsClient.tsx; src/lib/reports.ts (dự kiến); test báo cáo nguồn (dự kiến).

## T27 Dashboard ưu tiên việc cần xử lý

- [ ] Hoàn thành T27

Phụ thuộc: T24–T26. Phạm vi dự kiến: M.

Mục tiêu: KPI đúng kỳ/phạm vi; việc hôm nay, pipeline summary, đơn cần chú ý, sales, một chart chính, công nợ và hoạt động.

Tiêu chí nghiệm thu:

- [ ] KPI đúng kỳ/phạm vi; việc hôm nay, pipeline summary, đơn cần chú ý, sales, một chart chính, công nợ và hoạt động.
- [ ] Badge/link/filter/thao tác nhanh dùng dữ liệu chung; không có lời báo thành công giả hoặc số fallback.
- [ ] Admin ưu tiên toàn công ty/team, chờ duyệt và rủi ro; Sales ưu tiên việc hôm nay/khách/đơn/ca của mình. KPI khoảng 4–6 cho Admin và 3–4 cho Sales; mỗi danh sách ban đầu khoảng 5 mục, một chart chính và link xem thêm.

Kiểm tra: Mở Dashboard và xử lý một Lead/đơn/hóa đơn rồi quay lại thấy số đổi đúng; nhân viên/team khác nhau đúng quyền.

File dự kiến: src/app/dashboard/page.tsx; src/components/dashboard/DashboardClient.tsx; src/components/layout/Sidebar.tsx; src/lib/dashboard.ts.

## T28a Rà luồng Admin và Trưởng nhóm

- [ ] Hoàn thành T28a

Phụ thuộc: T03–T16–T20–T23–T27. Phạm vi dự kiến: M.

Mục tiêu: Admin nhìn được việc cần can thiệp và xử lý trong đúng ngữ cảnh, giao diện gọn.

Tiêu chí nghiệm thu:

- [ ] Dashboard có việc ưu tiên, chờ duyệt và công nợ; mở đúng bản ghi trong tối đa 2 lần bấm; bộ lọc team/sales áp dụng nhất quán.
- [ ] Giao người, duyệt/trả lại và tra đơn không qua nhiều modal/màn trung gian; quay lại giữ filter, dữ liệu và vị trí hợp lý.
- [ ] Kanban giữ 13 cột, thứ tự, thẻ và kéo thả; chi tiết giữ thanh bước/vùng form hiện tại. Chỉ trau chuốt màu, độ rõ và khoảng cách.

Kiểm tra: Admin lọc team → mở Lead/đơn → xử lý → quay lại; duyệt/trả lại sản phẩm; xem hóa đơn sắp hạn. Đếm số lần bấm, chụp đối chiếu board/chi tiết trước và sau. Không bỏ kiểm tra quyền/điều kiện bước.

File dự kiến: src/components/dashboard/DashboardClient.tsx; src/app/campaigns/CampaignsClient.tsx; src/app/payments/page.tsx; src/app/pipeline/page.tsx; src/app/pipeline/[orderId]/page.tsx. Nếu phát hiện nhiều màn cần chỉnh, chia từng màn trước khi thực hiện.

## T28b Rà luồng Sales và Nhân viên

- [ ] Hoàn thành T28b

Phụ thuộc: T08–T18–T23–T27. Phạm vi dự kiến: M.

Mục tiêu: Sales mở lên biết hôm nay làm gì, thao tác chăm sóc/đơn/KPI ngắn và rõ.

Tiêu chí nghiệm thu:

- [ ] Mặc định khách/đơn/việc của tôi; nav và tìm kiếm chỉ trong quyền, không cần chọn sales của mình lại ở từng màn.
- [ ] Chăm sóc mở nhanh, lưu một lần; Pipeline mở đúng bước đang làm; chấm công, nộp KPI/link không đổi nhiều màn; hành động chính nổi bật và lỗi giữ dữ liệu để thử lại.
- [ ] Form chỉ yêu cầu trường cần thiết ở bước đó; lịch sử/chi tiết phụ mở khi cần; không thêm tab, card hoặc nút lặp làm rườm rà.

Kiểm tra: Sales xử lý follow-up → mở/tạo đơn → lưu bước → quay lại; chấm công → nộp bài/comment; nộp sản phẩm và xem lý do bị trả. Kiểm tra trên desktop/mobile và tài khoản khác.

File dự kiến: src/app/leads/page.tsx; src/app/pipeline/[orderId]/page.tsx; src/app/attendance/AttendanceClient.tsx; src/app/social-kpi/SocialKpiClient.tsx; src/components/layout/Header.tsx. Chia sửa theo từng luồng khi vượt phạm vi.

## T28c Hoàn thiện phong cách responsive và hiệu năng

- [ ] Hoàn thành T28c

Phụ thuộc: T28a–T28b. Phạm vi dự kiến: M.

Mục tiêu: Giao diện cùng phong cách Logistics CRM, đẹp và dễ đọc, giữ board/pipeline và đáp ứng thiết bị nhỏ.

Tiêu chí nghiệm thu:

- [ ] Chữ gọn dễ đọc, spacing/border thống nhất, trạng thái có chữ; một màu chủ đạo theo theme, màu cảnh báo dùng đúng mục đích. Header tìm kiếm dài/nút thu gọn/logo/tài khoản và Sales footer giữ; không thêm ảnh/banner/card trang trí chiếm chỗ.
- [ ] Desktop/mobile320px và bàn phím thao tác được; Kanban cuộn ngang trong vùng riêng, giữ đủ 13 cột và Pipeline; phản hồi tại chỗ, không modal lồng hoặc alert gây gián đoạn thường xuyên.
- [ ] Bảng lớn có phân trang/tìm/lọc phù hợp; trả tối thiểu trường cần dùng, tổng hợp server; kiểm tra trước khi tối ưu query/bundle và không đổi hạ tầng chỉ vì demo.

Kiểm tra: Chụp desktop/mobile cả Admin/Sales và từng theme; focus/nhãn, kiểm tra tràn ngang, logo khi thu gọn, board/stepper, trạng thái trống/lỗi/đang lưu; đo query/bundle khi có vấn đề. Chia từng màn khoảng tối đa 5 file/lượt.

File dự kiến: src/components/layout/Sidebar.tsx; src/components/layout/Header.tsx; src/app/globals.css; bảng/form theo luồng phát hiện lỗi.

## T29 Dữ liệu và kiểm tra nghiệm thu

- [ ] Hoàn thành T29

Phụ thuộc: T01–T27 và T28a–T28c. Phạm vi dự kiến: M.

Mục tiêu: Bộ mẫu phủ đầy đủ nhánh đúng/sai/đúng hạn/quá hạn và có fixture kết quả kỳ vọng; seed chỉ chạy trên database demo riêng được xác định.

Tiêu chí nghiệm thu:

- [ ] Bộ mẫu phủ đầy đủ nhánh đúng/sai/đúng hạn/quá hạn và có fixture kết quả kỳ vọng; seed chỉ chạy trên database demo riêng được xác định.
- [ ] Test nav theo sitemap thật; lint/test/build qua và luồng trình duyệt chứng minh lưu, quyền, deadline và báo cáo.

Kiểm tra: Chạy npm test/npm run lint/npm run build; smoke trình duyệt XK/NK, hai ca, duyệt/phạt/hội chợ; không chạy db:seed xóa dữ liệu hiện có.

File dự kiến: prisma/seed.ts; prisma/seed.cjs; src/lib/*.test.ts; test browser theo luồng (dự kiến); tasks/todo.md.

## T30 Hướng dẫn và bàn giao demo

- [ ] Hoàn thành T30

Phụ thuộc: T29. Phạm vi dự kiến: S.

Mục tiêu: Hướng dẫn theo vai trò và kịch bản end-to-end; danh sách tính năng thật/mô phỏng/đang chờ khách rõ.

Tiêu chí nghiệm thu:

- [ ] Hướng dẫn theo vai trò và kịch bản end-to-end; danh sách tính năng thật/mô phỏng/đang chờ khách rõ.
- [ ] Biên bản đối chiếu yêu cầu có bằng chứng; triển khai VPS được lập bước riêng với sao lưu/rollback, không tự deploy khi chỉ lập kế hoạch.

Kiểm tra: Người dùng đi theo hướng dẫn hoàn thành demo; rà mọi hàng ma trận yêu cầu và phần chưa đủ điều kiện nghiệm thu.

File dự kiến: docs/huong-dan-crm.md (dự kiến); docs/REQUIREMENTS_AND_ITY_API.md; tasks/plan.md; tasks/todo.md.

## Checkpoint chung

- [ ] A Nền dữ liệu và quyền: T02–T05; test quyền, dữ liệu chung, lint và build.
- [ ] B Kinh doanh: T06–T16; ITY → chăm sóc → đơn XK/NK → hóa đơn → trả tiền, bộ mẫu Excel đối chiếu hoặc nhãn demo rõ.
- [ ] C Nhân viên: T17–T21; hai ca, KPI riêng, giao việc và duyệt đúng quyền, phạt không trùng.
- [ ] D Hội chợ: T22–T24; nhiều ngày/ca, khách vào Lead và nhắc/phạt đúng hạn.
- [ ] E Báo cáo: T25–T27; số khớp fixture, ngày/tuần/tháng và sales/team, link hành động chính xác.
- [ ] F Bàn giao: T28a–T30; hai kịch bản Admin/Sales, giữ Kanban/Pipeline, ít lần bấm, đẹp/gọn, desktop/mobile, test/lint/build, hướng dẫn và giới hạn tích hợp.


## Ghi nhận triển khai demo · 07/10/2026

- Database được sao lưu tại output/backups/crm-before-plan-20261007.db trước migration; migration thêm cột/bảng, không reset dữ liệu.
- Phiên server với cookie HttpOnly và mật khẩu scrypt; Admin/Manager/Sales được kiểm tra ở server. Không trả password cho client, không đổi người dùng bằng dropdown.
- Lead, Kanban, đơn, đại lý, hóa đơn dùng chung Prisma. Các bản localStorage cũ vẫn giữ nguyên key để có thể phục hồi; không tự nhập các bản ghi không xác định người phụ trách.
- Giữ 13 cột Kanban và bố cục thanh bước / biểu mẫu. Click bước là xem; lưu nháp ghi dữ liệu thật, hoàn tất kiểm tra điều kiện; chặn kéo bỏ qua bước.
- 11 trường đơn; so sánh 3–5 báo giá; Excel/PDF demo báo giá và chi phí; B/L Excel/PDF demo; upload riêng theo quyền; import checklist 8 loại chứng từ; booking, đại lý, điều xe, hải quan, feedback RETURN/FAIL; phát hành hóa đơn riêng thu tiền.
- Marketing có nhiều sản phẩm và hạn riêng, nộp / duyệt / trả lại, bài bổ sung theo khoảng 24 giờ quá hạn; hội chợ có ngày và ca sáng/chiều, kết quả tạo lead; MXH tính 3 bài + 5 bình luận theo ca chấm công.
- Job nhắc việc chạy mỗi phút trong tiến trình Next.js, có khóa tránh chạy đồng thời và khóa bài phạt để không tạo trùng. Việc chăm sóc, khuyến mãi, vận hành, chiến dịch, hội chợ, thanh toán có link mở đúng màn.
- Tổng quan theo vai trò; báo cáo ngày/tuần/tháng + nhân viên/team, nguồn khách, gọi và thời lượng; xuất CSV ITY có thông tin khách và nhu cầu.

Bằng chứng: 17 unit tests; lint không lỗi; build production thành công. Playwright: tạo lead, tạo đơn, chặn thiếu trường và bỏ qua bước, lưu bước 2/3/4, PDF tiếng Việt 840 USD được tải và lưu đơn; feedback/booking; webhook gửi 2 lần chỉ thêm 1 gọi và 1 lead; call không nhu cầu chỉ thêm lịch sử; giả cookie bị 401; Sales chỉ nhận 1 user của mình và bị chặn sửa đơn khác/quản trị. Chấm công / kết thúc ca có lịch sử và nút mở ca mới. 9 màn kiểm tra ở 390px không tràn toàn trang.

Phần cần dữ liệu khách: 3 mẫu Excel/PDF chuẩn, payload và thông tin tổng đài ITY thật, định nghĩa win / KPI ca ngắn / quy tắc trễ và kênh tin nhắn. LIVE chưa được nghiệm thu với tổng đài. Không triển khai VPS trong lượt này. Test các trường hợp marketing/hội chợ thực tế theo dữ liệu khách vẫn cần nghiệm thu nghiệp vụ.

Chạy: npm run dev; npm run lint; npm test; npm run build. Seed an toàn: npm run db:seed, không còn --accept-data-loss hoặc deleteMany dữ liệu kinh doanh.
