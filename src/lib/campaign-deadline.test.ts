import { describe, expect, it } from "vitest";
import { campaignDeadlineState, campaignDeadlineText, campaignPeriodStatus } from "./campaign-deadline";

const now = new Date("2026-10-09T08:00:00+07:00");

describe("campaignDeadlineState", () => {
  it("marks unfinished work overdue after its deadline", () => {
    expect(campaignDeadlineState({ deadline: "2026-10-09T07:59:00+07:00", step: "PRODUCT_DRAFT" }, now)).toBe("OVERDUE");
  });

  it("marks work due within 24 hours", () => {
    expect(campaignDeadlineState({ deadline: "2026-10-10T07:00:00+07:00", step: "SCRIPT_APPROVED" }, now)).toBe("DUE_SOON");
  });

  it("distinguishes on-time and late completion", () => {
    expect(campaignDeadlineState({ deadline: "2026-10-10T08:00:00+07:00", step: "DONE", completedAt: "2026-10-10T07:00:00+07:00" }, now)).toBe("DONE_ON_TIME");
    expect(campaignDeadlineState({ deadline: "2026-10-10T08:00:00+07:00", step: "DONE", completedAt: "2026-10-10T09:00:00+07:00" }, now)).toBe("DONE_LATE");
  });

  it("returns a useful remaining-time label", () => {
    expect(campaignDeadlineText({ deadline: "2026-10-09T10:30:00+07:00", step: "PRODUCT_DRAFT" }, now)).toBe("Còn 2 giờ 30 phút");
  });

  it("marks a campaign overdue immediately after its end time", () => {
    expect(campaignPeriodStatus("2026-10-09T23:59:00+07:00", new Date("2026-10-10T00:01:00+07:00"))).toEqual({
      state: "OVERDUE",
      label: "Quá hạn 1 ngày",
      days: 1,
    });
  });

  it("counts overdue days by Vietnam calendar date when deadline is stored at midnight", () => {
    expect(campaignPeriodStatus("2026-10-09T00:00:00+07:00", new Date("2026-10-10T21:00:00+07:00"))).toEqual({
      state: "OVERDUE",
      label: "Quá hạn 1 ngày",
      days: 1,
    });
  });
});
