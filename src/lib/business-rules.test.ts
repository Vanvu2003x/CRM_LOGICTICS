import { describe, expect, it } from "vitest";
import { displayStageNumber, nextStage, penaltyDays, safeUrl, periodBounds, workflowStageNumbers } from "./business-rules";
describe("CRM business rules", () => {
  it("shows the 12 relevant stages for each shipment direction", () => {
    expect(workflowStageNumbers("EXPORT")).toHaveLength(12);
    expect(workflowStageNumbers("EXPORT")).not.toContain(11);
    expect(workflowStageNumbers("IMPORT")).toHaveLength(12);
    expect(workflowStageNumbers("IMPORT")).not.toContain(8);
    expect(workflowStageNumbers("ALL")).toHaveLength(13);
  });
  it("skips only the transport step not applicable to the order", () => {
    expect(nextStage(7, "IMPORT")).toBe(9);
    expect(nextStage(10, "EXPORT")).toBe(12);
    expect(nextStage(12, "EXPORT")).toBe(13);
    expect(nextStage(13, "IMPORT")).toBe(13);
  });
  it("numbers the visible workflow continuously from one to twelve", () => {
    expect(displayStageNumber(12, "EXPORT")).toBe(11);
    expect(displayStageNumber(13, "EXPORT")).toBe(12);
    expect(displayStageNumber(9, "IMPORT")).toBe(8);
    expect(displayStageNumber(13, "IMPORT")).toBe(12);
  });
  it("counts started 24-hour overdue intervals and stops at completion", () => {
    expect(penaltyDays("2026-10-06T10:00:00Z", "2026-10-07T10:00:00Z")).toBe(1);
    expect(penaltyDays("2026-10-06T10:00:00Z", "2026-10-09T10:00:00Z", "2026-10-06T09:00:00Z")).toBe(0);
    expect(penaltyDays("2026-10-06T10:00:00Z", "2026-10-09T10:00:00Z", "2026-10-08T10:00:00Z")).toBe(2);
  });
  it("rejects unsafe links", () => {
    expect(safeUrl("javascript:alert(1)")).toBe(false);
    expect(safeUrl("https://example.com/post")).toBe(true);
  });
  it("uses Monday and Vietnam midnight for report periods", () => {
    const range = periodBounds("2026-10-07", "week");
    expect(range.start.toISOString()).toBe("2026-10-04T17:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-10-11T17:00:00.000Z");
  });
});
