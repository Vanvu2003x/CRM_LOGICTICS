type CallFailure = {
  cause?: string;
  message?: unknown;
};

const causeMessages: Record<string, string> = {
  Busy: "Tổng đài ITY đã tiếp nhận; thuê bao đang bận.",
  Rejected: "Cuộc gọi bị tổng đài hoặc đầu nhận từ chối.",
  "No Answer": "Không có người nghe máy.",
  Unavailable: "Tổng đài ITY đã tiếp nhận; thuê bao hiện không liên lạc được.",
  "Not Found": "Tổng đài ITY không tìm thấy số điện thoại hoặc chưa có định tuyến.",
  "Address Incomplete": "Số điện thoại chưa đầy đủ.",
  "Authentication Error": "Tổng đài từ chối xác thực máy lẻ.",
  "Request Timeout": "Tổng đài không phản hồi kịp thời.",
  "Connection Error": "Mất kết nối với tổng đài.",
  "WebRTC Error": "Trình duyệt không thiết lập được âm thanh cuộc gọi.",
  "Incompatible SDP": "Thiết bị không tương thích định dạng âm thanh của tổng đài.",
  "User Denied Media Access": "Trình duyệt chưa được cấp quyền microphone.",
  Canceled: "Cuộc gọi đã được hủy trước khi kết nối.",
};

export function callFailureMessage(event?: CallFailure) {
  const message = event?.message;
  const code = message && typeof message === "object" && "status_code" in message && typeof message.status_code === "number"
    ? message.status_code
    : undefined;
  const detail = event?.cause ? causeMessages[event.cause] : undefined;
  if (detail) return code ? `${detail} (SIP ${code})` : detail;
  if (code) return `Cuộc gọi không kết nối được. Tổng đài trả về mã SIP ${code}.`;
  return "Cuộc gọi không kết nối được. Chưa nhận được nguyên nhân từ tổng đài.";
}
