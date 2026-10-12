# Kế hoạch tối ưu CRM Logistics theo yêu cầu khách hàng

Ngày lập 07/10/2026. Phạm vi là hoàn thiện bản demo nghiệp vụ dựa trên CRM (1).docx và ảnh bảng phân công truyền thông. Bản Word cập nhật là nguồn yêu cầu chính; docs/REQUIREMENTS_AND_ITY_API.md là tài liệu đối chiếu, cần chỉnh khi khác nguồn chính. Người dùng đã yêu cầu triển khai bản demo ngày 07/10/2026. Các quy tắc chưa chốt vẫn được ghi là giả định demo; không coi là xác nhận của khách.

Mục tiêu là làm một luồng dữ liệu xuyên suốt từ ITY, hội chợ và MXH đến chăm sóc, đơn hàng, công nợ và báo cáo; đồng thời tính công việc và KPI theo đúng người, ca làm và deadline. Giao diện phải đẹp, gọn và thuận tiện cho cả Admin lẫn Sales. Giữ nguyên Kanban và bố cục Pipeline đơn hàng hiện tại.

## Phạm vi và nguyên tắc

- Giữ Next.js, Prisma và SQLite cho demo; giữ header, theme và thiết kế đã có, chỉnh UX khi giúp hoàn thành nghiệp vụ.
- UX theo vai trò là tiêu chí xuyên suốt từ đặc tả tới mỗi luồng và nghiệm thu, không để toàn bộ giao diện tới cuối dự án. Mỗi tính năng nêu mặc định Admin/Sales, thao tác chính và đường quay lại trước khi triển khai.
- Giữ Kanban 13 cột, thứ tự và tên các bước nghiệp vụ, thao tác kéo thả, thẻ đơn và bố cục chi tiết Pipeline với thanh bước và vùng nội dung hiện có. Chỉ chỉnh màu, khoảng cách, độ rõ, tương tác và hành vi lưu/chuyển bước. Không thay board bằng giao diện khác hoặc gộp các cột.
- Database là nguồn dữ liệu nghiệp vụ duy nhất. localStorage chỉ giữ theme và tùy chọn giao diện; dữ liệu demo cũ cần được sao lưu và nhập có kiểm tra, không âm thầm xóa.
- Dữ liệu mẫu được gắn nguồn demo và tạo có kiểm soát. Không thay số 0 bằng số giả, không báo thành công khi thao tác chưa lưu.
- Mỗi đầu việc hoàn thành cả dữ liệu, xử lý phía server, UI và kiểm tra; mở rộng schema theo từng luồng thay vì xây toàn bộ trước rồi mới nối.
- Phân quyền ở server. Vai trò đề xuất: Admin, Trưởng nhóm, Sales/Nhân viên; quyền kế toán có thể là nhóm quyền trên công nợ, chưa cần thêm module kế toán.
- Nhắc việc vòng demo hiển thị trong CRM và có tác vụ lịch kiểm tra hạn. Email/Zalo, gọi điện ITY thật chỉ nối khi có cấu hình và yêu cầu tương ứng.
- Dùng múi giờ Asia/Ho_Chi_Minh cho ngày, tuần, ca làm và deadline. Tiền lưu có đơn vị tiền tệ và quy tắc làm tròn rõ.
- Không tự chuyển thông tin khách thật, đổi hạ tầng hoặc triển khai server trong giai đoạn lập kế hoạch.

## Hiện trạng và rủi ro phải xử lý trước

1. Tổng quan và báo cáo đọc database nhưng Lead, Pipeline, đơn, công nợ và đại lý đọc localStorage.
2. Cookie chứa ID không tạo phiên xác thực an toàn; User có password được đưa xuống client; Server Actions chưa kiểm tra người và quyền.
3. Xem bước chi tiết đang thay đổi tiến độ; tới bước 13 tự đánh dấu hoàn thành dù chưa thanh toán.
4. Nhiều form và nút chỉ hiện thông báo; các chi tiết vận hành chưa có nơi lưu theo đơn.
5. Chấm công và KPI tính theo ngày; chiến dịch có một deadline chung; hội chợ chỉ có một ca cho toàn sự kiện.
6. ITY gọi đi và ghi âm ở nhiều màn hình còn mô phỏng; webhook chưa nối lead/đơn và chưa chống xử lý trùng.
7. Báo cáo Win đếm tất cả đơn; bộ lọc và truy nguồn thành công chưa đầy đủ.
8. Lần kiểm tra 07/10/2026: build qua, test 7/9, lint 44 lỗi và 85 cảnh báo. Test nav đang theo cấu trúc cũ; cần cập nhật theo sitemap đã chốt, không chỉ sửa để xanh.

## Các quy tắc cần chốt

| Quy tắc | Đề xuất dùng cho demo | Phần khách cần xác nhận |
| --- | --- | --- |
| Chăm sóc lại | Thời gian cấu hình theo nhóm; lịch sử từng lần liên hệ | Bao nhiêu ngày và tần suất gửi khuyến mãi |
| Có nhu cầu | Giá trị từ ITY nếu có, nếu không sales xác nhận; có trạng thái chưa xác định | Payload ITY và trường phân loại thực tế |
| Người duyệt | Nhân viên nộp; Trưởng nhóm/Admin duyệt | Ai giao, ai duyệt, có cho duyệt thay không |
| Phạt deadline | Một nghĩa vụ bài phạt cho một đầu việc và một ngày trễ, chạy lại không tạo trùng | Theo ngày lịch hay 24 giờ; dừng khi nộp hay duyệt; xử lý chờ duyệt |
| KPI | 3 bài và 5 comment cho một ca; hai ca tính độc lập | Ca ngắn, part-time, ca qua đêm và nộp bổ sung sau ca |
| Hội chợ | Chọn nhiều ngày/ca; báo cáo gắn ngày tham gia | Một hạn sau mỗi ngày hay sau ngày tham gia cuối |
| Win | Báo cáo riêng chốt báo giá và hoàn thành thanh toán | Chỉ tiêu nào là Win chính để đánh giá nguồn |
| Tin nhắn | Chưa tính giả; hiển thị chưa kết nối nguồn | Kênh dữ liệu, thời gian phản hồi trung bình hay tỷ lệ đạt SLA |
| Excel | Đọc và ánh xạ 3 mẫu cụ thể, không xây công cụ chạy mọi Excel | File báo giá, vận đơn, bảng kê và công thức thực tế |
| Khách và đơn | Giữ nhận diện khách, nguồn phát sinh và liên kết nhiều cơ hội | Có cho một khách/lead phát sinh nhiều đơn; quy tắc gộp khách |
| Nhắc việc | Hiển thị trong CRM, chống gửi lặp | Có cần email/Zalo và ngưỡng màu công nợ cụ thể |

Các đề xuất trên là tạm thời, không được coi là yêu cầu đã được khách duyệt. Những nhánh cần mẫu Excel, payload ITY hoặc quy tắc phạt chỉ chốt nghiệm thu sau khi có dữ liệu/ý kiến khách. Các việc không phụ thuộc vẫn triển khai được khi bắt đầu làm.

## Thứ tự triển khai

| Giai đoạn | Đầu việc | Kết quả cần đạt | Phụ thuộc |
| --- | --- | --- | --- |
| 0 Chốt đặc tả | T01 | Ma trận yêu cầu, quy tắc còn mở, sitemap và luồng Admin/Sales thống nhất | Không |
| 1 Nền dữ liệu và quyền | T02–T05 | Phiên đăng nhập, quyền server, team, dữ liệu nghiệp vụ chung | T01 |
| 2 ITY và chăm sóc | T06–T09 | Lịch sử cuộc gọi, nhu cầu, sales và chăm sóc nối thật vào Lead | Giai đoạn 1 |
| 3 Đơn hàng và vận hành | T10–T16 | Toàn bộ 13 bước có lưu, điều kiện hoàn thành và chứng từ theo đơn | Giai đoạn 1–2; mẫu Excel ở T12/T15 |
| 4 Ca làm và KPI | T17–T18 | Từng ca chấm công có chỉ tiêu và bằng chứng MXH riêng | Giai đoạn 1 |
| 5 Truyền thông | T19–T21 | Nhiều phân công/deadline, nộp/duyệt và nghĩa vụ phạt | Giai đoạn 1; quy tắc duyệt/phạt |
| 6 Hội chợ | T22–T23 | Đăng ký nhiều ngày/ca, nộp kết quả và truy nguồn Lead | Giai đoạn 2; quy tắc hạn |
| 7 Nhắc việc và báo cáo | T24–T27 | Nhắc hạn đúng, báo cáo ngày/tuần/tháng và Dashboard có hành động | Các luồng phát sinh dữ liệu |
| 8 Nghiệm thu demo | T28a–T30 | Rà UX Admin/Sales, responsive, bộ dữ liệu mẫu, kiểm tra và kịch bản demo hoàn chỉnh | Các giai đoạn trước |

Trong giai đoạn 2 cần kiểm chứng sớm khả năng ánh xạ các mẫu Excel (thuộc T12/T15) khi khách cung cấp, trước khi đầu tư nhiều vào UI báo giá. Lập lịch nền dùng giải pháp đơn giản phù hợp một ứng dụng demo; không thêm hệ thống hàng đợi hoặc dịch vụ độc lập nếu chưa cần.

## Ma trận yêu cầu và nghiệm thu

| Yêu cầu khách | Đầu việc | Nghiệm thu tiêu biểu |
| --- | --- | --- |
| Phần 1 ITY | T06–T07 | Nhận một cuộc gọi hai lần chỉ có một bản ghi; số lần và thời lượng đúng; khách có nhu cầu được giao đúng sales |
| Bước 1 chăm sóc | T08, T24 | Lưu liên hệ thủ công không sửa lịch sử gọi; tới hạn có việc chăm sóc/gửi khuyến mãi |
| Bước 2 thông tin đơn | T09–T10 | Đủ 11 trường và danh mục; reload không mất; xem bước không đổi tiến độ |
| Bước 3 tổng hợp giá | T11 | Thêm/sửa danh sách 3–5 báo giá theo từng đơn |
| Bước 4 báo giá | T12 | Mẫu công ty có tính giá kiểm chứng, PDF đúng dữ liệu, lưu phiên bản và tick hoàn thành |
| Bước 5 feedback | T13 | Đồng ý tới 6; từ chối chọn quay về 2 hoặc fail với lý do |
| Bước 6 booking | T14a | ETD, ETA, LINE, giá và tiền tệ được lưu theo đơn |
| Bước 7 đại lý | T14b | Chọn/thêm đại lý; deactivate không mất lịch sử đơn |
| Bước 8 và 11 điều xe | T14c | Đúng nhánh xuất/nhập, có thông tin xe/ảnh và xác nhận giao xong |
| Bước 9 chứng từ | T15a–T15b | XK xuất vận đơn; NK đủ nhóm chứng từ, D.O/AN và lịch MNF |
| Bước 10 hải quan | T15c | Số tờ khai, luồng, trạng thái và ghi chú lưu riêng cho đơn |
| Bước 12 bảng kê | T15d | Chi phí của chính đơn, đúng mẫu, PDF đủ dòng và tổng khớp |
| Bước 13 thanh toán | T16 | Phát hành hóa đơn tách thanh toán; nhắc trước 7 ngày; chưa trả tiền chưa hoàn thành |
| Phần 3.1 chấm công | T17 | Một ngày có thể có nhiều ca theo quy tắc; ghi giờ vào/ra và quyền sửa |
| Phần 3.2 truyền thông | T19–T21, T24 | Deadline từng phân công, hai vòng duyệt, nhắc trước 2 ngày, phạt mỗi ngày không trùng |
| Phần 3.3 hội chợ | T22–T23, T24 | Chọn các ngày/ca; lý do nếu không đi; báo cáo và truyền thông hạn một ngày theo quy tắc chốt |
| Phần 3.4 MXH | T18 | Mỗi ca 3 bài và 5 comment; lưu link, ảnh, ghi chú và nguồn khách phát sinh |
| Phần 4 báo cáo | T25–T26 | Ngày/tuần/tháng, nhân viên/team, số cuộc gọi/thời lượng, Lead, Win/Fail, KPI và nguồn thành công |
| Tổng quan và thao tác | T27–T28c | KPI có định nghĩa, đúng vai trò, việc hôm nay, đơn cần chú ý, công nợ và link xử lý chính xác; Kanban/Pipeline giữ bố cục |

## Tổ chức giao diện

Giữ bốn nhóm phù hợp phạm vi đã mở rộng. Giữ header/theme và hệ thống nhận diện Logistics CRM; trau chuốt cùng phong cách, không thêm ảnh trang trí làm mất không gian làm việc.

- Kinh doanh: Tổng quan; Khách hàng tiềm năng; Đơn hàng với Pipeline/Danh sách/Fail; Công việc và nhắc nhở.
- Công việc nhân viên: Chấm công; Truyền thông; Hội chợ; KPI MXH.
- Vận hành: Đại lý và đối tác; Công nợ và thanh toán; Báo cáo.
- Hệ thống: Người dùng; Team; Phân quyền; ITY; Mẫu Excel/PDF; Quy tắc nhắc việc; Danh mục.

Nhân viên nhìn dữ liệu thuộc phạm vi được giao; quản lý nhìn phạm vi team; Admin nhìn toàn bộ. Badge là số việc/khách cần xử lý trong đúng phạm vi đó, không là tổng dữ liệu hệ thống. Xem bước tách khỏi nút hoàn thành. Nút chỉ báo thành công sau khi lưu. Form có trạng thái đang lưu, lỗi và thử lại; bảng có tìm/lọc, phân trang khi cần và link vào đúng bản ghi.

## Giao diện theo góc nhìn Admin và Sales

Hai vai trò dùng cùng phong cách và các màn hình nghiệp vụ, với dữ liệu, mặc định và thao tác theo quyền. Không nhân đôi ứng dụng hoặc bắt nhân viên chọn lại phạm vi ở mỗi trang. Các mục không được phép truy cập không xuất hiện trong nav của họ; server vẫn kiểm tra quyền.

| Khu vực | Admin và Trưởng nhóm | Sales và Nhân viên |
| --- | --- | --- |
| Trang mở đầu | Tổng quan toàn công ty hoặc team: việc quá hạn, đơn mắc bước, công nợ và hàng chờ duyệt | Hôm nay của tôi: khách cần care, đơn của tôi, ca đang làm và việc đến hạn |
| KPI | Khoảng 4–6 chỉ số chủ đạo trong kỳ; drill-down sang danh sách đã lọc | Khoảng 3–4 chỉ số liên quan công việc cá nhân; không đưa số liệu toàn công ty |
| Việc cần xử lý | Ưu tiên quá hạn, cần giao người, chờ duyệt, sắp đến hạn | Một danh sách ưu tiên có hạn và nút xử lý rõ; xong việc quay về danh sách giữ bộ lọc |
| Lead | Lọc sales/team và nhu cầu; giao/đổi sales theo quyền, tra lịch sử | Mặc định khách của tôi; cập nhật chăm sóc ngay trên dòng hoặc panel gọn, ít trường bắt buộc |
| Kanban đơn hàng | Board hiện tại, lọc sales/team/trạng thái; nhìn nhanh tuổi đơn và vướng mắc | Cùng board hiện tại, mặc định đơn của tôi; mở đúng bước đang làm, giữ vị trí và filter khi quay lại |
| Chi tiết Pipeline | Cùng bố cục hiện có; nhìn tiến độ, lịch sử và phần cần kiểm tra | Cùng bố cục hiện có; form của bước đang chọn là trọng tâm, một thao tác chính là lưu/hoàn thành bước |
| Chiến dịch | Hàng chờ duyệt, giao việc và hạn từng phân công; duyệt/trả lại ngay trong ngữ cảnh | Việc của tôi, yêu cầu sản phẩm, hạn, link nộp và lý do cần sửa |
| Chấm công và MXH | Tình trạng ca, người thiếu KPI và bộ lọc team | Chấm công/tan ca dễ thấy, tiến độ 3 bài/5 comment của ca hiện tại, form nộp ngắn |
| Hội chợ | Lịch sự kiện, người chưa đăng ký/chưa nộp, khách thu được | Chọn ngày/ca bằng lịch hoặc ô chọn rõ; thêm khách và nộp link tại đúng lần tham gia |
| Công nợ | Xem nhiều đơn, ưu tiên đến hạn/quá hạn; lọc khách/sales và trạng thái | Công nợ các đơn thuộc phạm vi được giao, nhắc xử lý đúng trách nhiệm |
| Báo cáo | Bộ lọc ngày/tuần/tháng, team/sales; mở dữ liệu nguồn | Báo cáo cá nhân, cùng định nghĩa chỉ tiêu, không dư bộ lọc không được dùng |

## Quy tắc làm giao diện đẹp và gọn

- Chữ nhỏ dễ đọc theo phong cách đã chọn, phân cấp rõ tiêu đề/nội dung/phụ chú; khoảng cách nhất quán, bảng và form gọn nhưng không chen chúc.
- Dùng nền sạch, border và đường chia nhẹ, một màu chủ đạo theo theme; màu đỏ/vàng/xanh dành cho trạng thái. Trạng thái luôn có chữ, không chỉ màu.
- Header giữ tìm kiếm dài, logo Logistics CRM, nút thu gọn, tài khoản và theme; hạn chế thêm badge/CTA lặp. Giữ tài khoản cuối sidebar và logo khi thu gọn.
- Mỗi vùng có một hành động chính nổi bật. Hành động phụ nằm cạnh ngữ cảnh hoặc menu gọn; không trải nhiều nút màu trên mỗi dòng.
- Dashboard ưu tiên KPI và việc cần xử lý trước; mỗi danh sách hiển thị ban đầu khoảng 5 mục rồi xem thêm. Chỉ một biểu đồ chính; báo cáo chi tiết, lịch sử dài và nội dung phụ mở khi cần.
- Thêm/sửa nhanh các bản ghi ngắn dùng dialog/panel; form dài ở vùng nội dung trang. Không mở nhiều modal lồng nhau, không chia thành nhiều tab nếu một form ngắn đã đủ.
- Lọc quan trọng luôn dễ thấy; bộ lọc ít dùng mở thêm khi cần. Giữ query, filter và vị trí sau khi xem/sửa; xóa lọc một thao tác.
- Tìm kiếm toàn cục chỉ trả bản ghi đúng quyền và mở đúng khách/đơn. Badge không đếm trùng và không hiển thị 0 không cần thiết.
- Desktop giữ cấu trúc board, cuộn ngang riêng vùng Kanban và cuộn riêng vùng cần thiết; không làm cả trang tràn ngang. Mobile giữ đủ 13 cột qua cuộn ngang, bộ lọc gọn, thao tác chạm rõ; không tự đổi sang loại pipeline khác.
- Trạng thái đang lưu, đã lưu, lỗi và trống đều có phản hồi tại chỗ; lỗi giữ nội dung người dùng và có thử lại. Hạn chế alert chặn thao tác, animation, gradient và card lồng nhiều tầng.

Mục tiêu thao tác để nghiệm thu: từ Dashboard mở đúng việc/khách/đơn trong tối đa 2 lần bấm; cập nhật chăm sóc bằng mở nhanh và một lần lưu; chấm công/nộp KPI không phải đổi nhiều màn. Không bỏ bước xác nhận cần thiết hoặc kiểm tra nghiệp vụ chỉ để giảm số lần bấm.

## Quyết định dữ liệu

- Tách người dùng và team khỏi dữ liệu đưa ra client; không xuất password/secret.
- Cuộc gọi liên kết sales và khách/lead/đơn; giữ callid để nhận lại an toàn.
- Nhật ký chăm sóc tách thời điểm gọi; Lead giữ nhu cầu và nguồn.
- Đơn có chi tiết từng bước, lịch sử chuyển trạng thái, thời điểm fail/hoàn thành và người thực hiện.
- Lưu báo giá, dòng phí, booking, liên kết đại lý, chuyến xe/ảnh, checklist, tờ khai, bảng kê, hóa đơn theo đơn.
- Ca làm có giờ bắt đầu/kết thúc; bằng chứng MXH liên kết ca bằng quan hệ dữ liệu, không chỉ chuỗi ID.
- Chiến dịch có nhiều phân công với deadline riêng; nội dung nộp và kết quả duyệt giữ lịch sử.
- Hội chợ có ngày/ca và đăng ký; khách thu thập có liên kết Lead, không chỉ sao chép nội dung.
- Nhắc việc và bài phạt có nguồn, người nhận, hạn, trạng thái và khóa chống phát sinh lặp.
- Không gán nguồn đơn thành công theo phỏng đoán; nguồn gốc khách và các lần tiếp cận được lưu để áp dụng quy tắc ghi nhận đã chốt.

## Kiểm tra và mốc nghiệm thu

Sau từng đầu việc: kiểm tra hành vi chính, quyền truy cập, reload/lưu lại; chạy test phù hợp phần thay đổi. Sau mỗi cụm 2–3 đầu việc: lint, test, build và một luồng trình duyệt. Mốc nghiệm thu được lưu bằng checklist và bằng chứng demo; không tự tạo thêm thủ tục xin phép.

- Mốc A: đăng nhập đúng quyền, dữ liệu Lead và đơn không còn tách đôi.
- Mốc B: ITY → chăm sóc → tạo đơn → feedback → vận hành → hóa đơn → thanh toán; không nhảy sai trạng thái.
- Mốc C: hai ca cùng ngày có KPI độc lập; nhân viên nộp và quản lý duyệt chiến dịch đúng quyền.
- Mốc D: hội chợ nhiều ngày/ca, khách vào danh sách chăm sóc, deadline và phạt kiểm tra được.
- Mốc E: số liệu báo cáo khớp dữ liệu nguồn và link Dashboard mở đúng bản ghi/filter.
- Mốc F: chạy hai kịch bản Admin và Sales trên desktop/mobile; giữ Kanban và bố cục Pipeline; việc chính mở trong tối đa 2 lần bấm, lưu có phản hồi, không modal lồng hoặc nút thành công giả; test/lint/build qua; bàn giao hướng dẫn thao tác và danh sách giới hạn tích hợp.

Bộ dữ liệu nghiệm thu có: khách có/không/chưa xác định nhu cầu; gọi lặp webhook; đơn xuất/nhập; feedback đồng ý/quay lại/fail; công nợ còn 8/7/1 ngày, quá hạn và đã trả; hai ca/ngày; chiến dịch đúng hạn/trễ 1–3 ngày/chờ duyệt; hội chợ nhiều ca; Lead trùng; nguồn ITY/hội chợ/MXH. Kiểm tra deadline bằng đồng hồ kiểm thử, không chỉnh giờ máy hoặc chờ ngày thật.

## Ngoài phạm vi ban đầu

Chưa mở thêm ERP, kho, tính lương, kế toán tổng hợp, đồng bộ mọi mạng xã hội hay công cụ Excel đa năng. Kết nối gọi điện thật, đo phản hồi tin nhắn thật và xuất đúng mẫu công ty phụ thuộc tài liệu/config/mẫu khách cung cấp. Mọi mô phỏng phải được gắn nhãn trong demo.

Triển khai server là một bước riêng sau khi có bản nghiệm thu; cần sao lưu dữ liệu và phương án quay lại bản trước. Không chạy script db:seed hiện tại lên dữ liệu cần giữ vì nó có thao tác xóa dữ liệu và db push --accept-data-loss.
