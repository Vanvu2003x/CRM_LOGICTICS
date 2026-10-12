# Checklist cập nhật CRM sau phản hồi khách hàng

Ngày lập: 10/10/2026. Đã triển khai và phát hành đợt 1 trên VPS.

## Giai đoạn A — Dữ liệu

- [x] U01. Nhận payload ITY thực tế hoặc xác nhận không có trường phân loại.
- [x] U01. Chốt bảng ánh xạ bốn kết quả khách hàng.
- [x] U01. Thiết kế fallback Sales phân loại và lịch sử chỉnh sửa.
- [x] U01. Kiểm tra webhook gửi lặp, dữ liệu kỹ thuật và dữ liệu nghiệp vụ.
- [x] U02. Bổ sung tên người liên hệ ở khách Hội chợ.
- [x] U02. Chuyển đủ MST, địa chỉ, ngành nghề và nội dung sang Lead.
- [x] U02. Thêm cảnh báo/nối khách trùng theo điện thoại hoặc MST.
- [x] Checkpoint A: migration trên bản sao và kiểm tra dữ liệu trước/sau.

## Giai đoạn B — Đơn hàng

- [x] U03. Hiển thị 12 bước liên tục cho Xuất khẩu.
- [x] U03. Hiển thị 12 bước liên tục cho Nhập khẩu.
- [x] U03. Loại bước không hợp lệ khỏi kéo thả, nút tiếp và select chuyển bước.
- [x] U03. Thay chế độ “Tất cả 13 bước” bằng lựa chọn xuất/nhập rõ ràng.
- [x] U04. Đổi CTA thành “Chọn khách để tạo đơn”.
- [x] U04. Lọc sẵn khách có nhu cầu và hướng dẫn chọn loại đơn.
- [x] U04. Chống tạo trùng khi thao tác lặp.
- [ ] U05. Khách xác nhận công thức mã đơn.
- [ ] U05. Kiểm tra sequence khi tạo đồng thời, xóa và chuyển tháng.
- [x] Checkpoint B: chạy trọn hai quy trình và kiểm tra build/test.

## Giai đoạn C — Công việc nội bộ

- [x] U06. Thiết kế dữ liệu phiên bản link kịch bản/nháp/final.
- [x] U06. Hiển thị lý do trả lại và timeline lần nộp cho Sales.
- [x] U06. Kiểm tra quyền duyệt của Admin/Manager.
- [x] U07. Bổ sung KPI và bộ lọc “Chưa phát hành”.
- [x] U07. Đối chiếu từng nhóm công nợ với database.
- [x] U08. Chốt có cho nhiều ca cùng ngày hay không.
- [x] U08. Cho mở ca mới khi không còn ca đang mở theo chính sách.
- [x] U08. Kiểm tra tự đóng 17:30 và KPI MXH theo từng ca.
- [x] Checkpoint C: test chiến dịch, công nợ và chấm công theo hai vai trò.

## Giai đoạn D — Giao diện và báo giá

- [ ] U09. Rà Admin/Sales ở 360, 390, 768, 1366 và 1920 px. (đã kiểm tra 390 và 1440)
- [x] U09. Sửa responsive nhóm Lead/Đơn/Chiến dịch.
- [x] U09. Sửa responsive nhóm Hội chợ/Chấm công/KPI MXH.
- [x] U09. Sửa responsive nhóm Đại lý/Công nợ/Báo cáo/Cài đặt.
- [x] U09. Chụp ảnh đối chiếu và kiểm tra console.
- [ ] U10. Nhận hai file Excel và PDF mẫu từ khách.
- [ ] U10. Chốt công thức tiền tệ, thuế, làm tròn và phụ phí.
- [ ] U10. Nghiệm thu import, tính giá, lưu phiên bản và PDF.
- [ ] Checkpoint D: bộ ảnh responsive và golden test báo giá đạt.

## Giai đoạn E — Phát hành

- [x] U11. Chạy test, lint và production build.
- [x] U11. Test xuyên suốt Admin và Sales.
- [x] U11. Chuẩn bị ảnh/log chứng minh từng hạng mục.
- [x] U12. Backup database, uploads và cấu hình.
- [ ] U12. Deploy staging, migrate và smoke test HTTPS/webhook. (đã smoke test candidate nội bộ trước khi đổi production; chưa có domain staging riêng)
- [ ] U12. Khách duyệt staging.
- [x] U12. Deploy production VPS và chạy smoke test sau phát hành.
- [x] U12. Ghi nhận phiên bản rollback và kiểm tra log sau deploy.
