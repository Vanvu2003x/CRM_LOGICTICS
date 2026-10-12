import { describe, expect, it } from "vitest";
import { callFailureMessage } from "./ity-call-failure";

describe("callFailureMessage", () => {
  it("shows a busy reason and SIP code", () => {
    expect(callFailureMessage({ cause: "Busy", message: { status_code: 486 } })).toBe("Tổng đài ITY đã tiếp nhận; thuê bao đang bận. (SIP 486)");
  });

  it("distinguishes no answer from rejection", () => {
    expect(callFailureMessage({ cause: "No Answer" })).toBe("Không có người nghe máy.");
    expect(callFailureMessage({ cause: "Rejected", message: { status_code: 603 } })).toBe("Cuộc gọi bị tổng đài hoặc đầu nhận từ chối. (SIP 603)");
  });

  it("keeps an unknown SIP response visible", () => {
    expect(callFailureMessage({ cause: "SIP Failure Code", message: { status_code: 503 } })).toBe("Cuộc gọi không kết nối được. Tổng đài trả về mã SIP 503.");
  });

  it("makes it clear that SIP 480 came back from ITY", () => {
    expect(callFailureMessage({ cause: "Unavailable", message: { status_code: 480 } })).toBe("Tổng đài ITY đã tiếp nhận; thuê bao hiện không liên lạc được. (SIP 480)");
  });

  it("handles a missing reason", () => {
    expect(callFailureMessage()).toBe("Cuộc gọi không kết nối được. Chưa nhận được nguyên nhân từ tổng đài.");
  });
});
