import { describe, expect, it } from "vitest";
import { socialCustomerKpi, socialKpiProgress, socialWinMetrics } from "./social-kpi";

describe("social KPI", () => {
  it("reaches the social KPI with at least one qualified customer", () => {
    expect(socialCustomerKpi([{ quality: "CONTENT", leadId: null }, { quality: "QUALIFIED", leadId: "lead-1" }])).toEqual({ customers: 1, reached: true });
    expect(socialCustomerKpi([{ quality: "QUALIFIED", leadId: "lead-1" }, { quality: "QUALIFIED", leadId: "lead-1" }]).customers).toBe(1);
  });
  it("tracks posts and comments without limiting extra submissions", () => {
    const incomplete = socialKpiProgress([{ type: "POST" }, { type: "POST" }, ...Array.from({ length: 5 }, () => ({ type: "COMMENT" }))]);
    expect(incomplete).toMatchObject({ posts: 2, comments: 5, done: false, postPercent: 67, commentPercent: 100 });
    const complete = socialKpiProgress([...Array.from({ length: 3 }, () => ({ type: "POST" })), ...Array.from({ length: 5 }, () => ({ type: "COMMENT" }))]);
    expect(complete.done).toBe(false);
    expect(socialKpiProgress([...Array.from({ length: 3 }, () => ({ type: "POST" })), ...Array.from({ length: 5 }, () => ({ type: "COMMENT" })), { type: "COMMENT", quality: "QUALIFIED", leadId: "lead-1" }]).done).toBe(true);
  });

  it("counts quality and wins from linked orders", () => {
    const metrics = socialWinMetrics([
      { quality: "QUALIFIED", order: { status: "COMPLETED", invoiceAmount: 12_000_000 } },
      { quality: "INQUIRY", order: { status: "IN_PROGRESS", invoiceAmount: 5_000_000 } },
      { quality: "CONTENT", order: null },
    ]);
    expect(metrics).toEqual({ qualified: 1, linkedOrders: 2, wins: 1, winRate: 50, wonValue: 12_000_000 });
  });
});
