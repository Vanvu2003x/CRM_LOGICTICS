import { describe, expect, it } from "vitest";
import { leadSourceLabel, paginate } from "./lead-display";

describe("lead display helpers", () => {
  it("translates internal source codes for users", () => {
    expect(leadSourceLabel("MANUAL")).toBe("Nhập thủ công");
    expect(leadSourceLabel("SOCIAL")).toBe("Mạng xã hội");
    expect(leadSourceLabel("TRADE_FAIR")).toBe("Hội chợ");
    expect(leadSourceLabel("TEST_E2E")).toBe("Dữ liệu kiểm thử");
    expect(leadSourceLabel("ITY Tổng đài")).toBe("ITY Tổng đài");
  });

  it("returns only the requested page", () => {
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual({ items: [3, 4], page: 2, totalPages: 3 });
    expect(paginate([1, 2, 3], 99, 2)).toEqual({ items: [3], page: 2, totalPages: 2 });
  });
});
