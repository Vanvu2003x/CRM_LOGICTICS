import { describe, expect, it } from "vitest";
import { attendanceMinutes, percentage, uniqueById } from "./report-metrics";

describe("report metrics", () => {
  it("calculates safe rounded percentages", () => {
    expect(percentage(2, 3)).toBe(67);
    expect(percentage(0, 0)).toBe(0);
  });

  it("sums completed and active attendance sessions", () => {
    const now = new Date("2026-10-09T10:00:00Z");
    expect(attendanceMinutes([
      { checkIn: new Date("2026-10-09T08:00:00Z"), checkOut: new Date("2026-10-09T09:30:00Z") },
      { checkIn: new Date("2026-10-09T09:30:00Z"), checkOut: null },
    ], now)).toBe(120);
  });

  it("deduplicates linked orders before reporting wins", () => {
    expect(uniqueById([{ id: "A" }, { id: "A" }, { id: "B" }])).toHaveLength(2);
  });
});
