import { describe, expect, it } from "vitest";
import { canChangeTradeFairSession, fairPenaltyData, fairReportDeadline, toggleFairSession } from "./trade-fair-workflow";

describe("trade fair workflow", () => {
  it("supports morning, afternoon and both without duplicate daily records", () => {
    expect(toggleFairSession("NONE", "MORNING")).toBe("MORNING");
    expect(toggleFairSession("MORNING", "AFTERNOON")).toBe("BOTH");
    expect(toggleFairSession("BOTH", "MORNING")).toBe("AFTERNOON");
    expect(toggleFairSession("AFTERNOON", "AFTERNOON")).toBe("NONE");
  });

  it("allows reporting through the end of the following Vietnam day", () => {
    const due = fairReportDeadline(new Date("2026-10-10T09:00:00+07:00"));
    expect(due.toISOString()).toBe("2026-10-11T16:59:59.999Z");
  });

  it("creates one independently submittable content penalty for each late day", () => {
    const due = new Date("2026-10-11T16:59:59.999Z");
    const item = fairPenaltyData({ id: "part-1", fairId: "fair-1", userId: "sales-1" }, "campaign-1", "VEC", due, 2);
    expect(item).toMatchObject({
      penaltyKey: "fair:part-1:2",
      step: "PRODUCT_DRAFT",
      title: "Bài phạt hội chợ ngày trễ thứ 2",
      requirements: "1 bài truyền thông phạt",
    });
    expect(item.deadline.toISOString()).toBe("2026-10-14T16:59:59.999Z");
  });

  it("locks session selection when the fair day has started", () => {
    expect(canChangeTradeFairSession("2026-10-10T00:00:00+07:00", new Date("2026-10-09T23:59:00+07:00"))).toBe(true);
    expect(canChangeTradeFairSession("2026-10-10T00:00:00+07:00", new Date("2026-10-10T00:00:00+07:00"))).toBe(false);
    expect(canChangeTradeFairSession("2026-10-09T00:00:00+07:00", new Date("2026-10-10T08:00:00+07:00"))).toBe(false);
  });
});
