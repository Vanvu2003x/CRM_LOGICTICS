import { describe, expect, it } from "vitest";
import { validateCampaignLink } from "./campaign-link";

describe("validateCampaignLink", () => {
  it("trims and keeps a valid HTTP link", () => {
    expect(validateCampaignLink("  https://example.com/plan  ")).toBe("https://example.com/plan");
  });

  it("rejects an empty link with an actionable message", () => {
    expect(() => validateCampaignLink(" ")).toThrow("Nhập link kế hoạch trước khi lưu.");
  });

  it("rejects non HTTP links", () => {
    expect(() => validateCampaignLink("javascript:alert(1)")).toThrow("HTTP/HTTPS");
  });
});
