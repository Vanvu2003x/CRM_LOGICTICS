import { describe, expect, it } from "vitest";
import { campaignArtifacts } from "./campaign-artifacts";

describe("campaign submission artifacts", () => {
  it("keeps script and product links from workflow history", () => {
    const result = campaignArtifacts(JSON.stringify([
      { at: "2026-10-10T10:00:00Z", by: "Admin", from: "PRODUCT_APPROVED", to: "DONE", link: "https://files/final" },
      { at: "2026-10-10T09:00:00Z", by: "Sales", from: "PRODUCT_DRAFT", to: "PRODUCT_APPROVED", link: "https://files/draft" },
      { at: "2026-10-09T09:00:00Z", by: "Sales", from: "SCRIPT_DRAFT", to: "SCRIPT_APPROVED", link: "https://files/script" },
    ]));
    expect(result.scriptLink).toBe("https://files/script");
    expect(result.productLink).toBe("https://files/final");
  });

  it("exposes review feedback without losing older submissions", () => {
    const result = campaignArtifacts(JSON.stringify([
      { at: "2026-10-10T08:00:00Z", by: "Admin", from: "SCRIPT_APPROVED", to: "SCRIPT_DRAFT", link: "https://files/script", notes: "Thiếu CTA" },
    ]));
    expect(result.feedback[0]).toMatchObject({ by: "Admin", notes: "Thiếu CTA" });
  });
});
