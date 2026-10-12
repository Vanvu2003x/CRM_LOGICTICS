import { describe, expect, it } from "vitest";
import { buildDashboard, daysBetween, periodStart } from "./dashboard";
import { initialLeads, initialOrders } from "./demo-crm";

describe("dashboard operations", () => {
  it("uses calendar days and a Monday week boundary", () => {
    expect(daysBetween("2026-09-30", "2026-10-06")).toBe(6);
    expect(periodStart("2026-10-06", "week")).toBe("2026-10-05");
    expect(periodStart("2026-10-04", "week")).toBe("2026-09-28");
  });
  it("does not count accumulated calls as today's calls when the last call was earlier", () => {
    const data = buildDashboard(initialLeads, initialOrders, "2026-10-06", "day");
    expect(data.callsToday).toBe(0);
    expect(data.pipeline.reduce((sum, stage) => sum + stage.count, 0)).toBe(data.processing.length);
  });
  it("removes completed orders from actionable queues", () => {
    const orders = initialOrders.map((order) => ({ ...order, status: "COMPLETED" as const }));
    const data = buildDashboard(initialLeads, orders, "2026-10-06", "month");
    expect(data.processing).toHaveLength(0);
    expect(data.attention).toHaveLength(0);
    expect(data.tasks.find((task) => task.key === "booking")?.count).toBe(0);
  });
  it("has safe empty states", () => {
    const data = buildDashboard([], [], "2026-10-06", "month");
    expect(data.sales).toEqual([]);
    expect(data.invoices).toEqual([]);
    expect(data.funnel.every((item) => item.value === 0)).toBe(true);
  });
  it("aggregates weekly and monthly chart buckets without losing calls", () => {
    const expected = initialLeads.filter((lead) => lead.source.includes("ITY")).reduce((sum, lead) => sum + lead.callCount, 0);
    const weekly = buildDashboard(initialLeads, initialOrders, "2026-10-06", "week").chart;
    const monthly = buildDashboard(initialLeads, initialOrders, "2026-10-06", "month").chart;
    expect(weekly).toHaveLength(6);
    expect(monthly).toHaveLength(6);
    expect(monthly.reduce((sum, point) => sum + point.calls, 0)).toBe(expected);
    expect(weekly.reduce((sum, point) => sum + point.calls, 0)).toBe(expected);
  });
});
