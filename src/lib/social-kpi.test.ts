import { describe, expect, it } from "vitest";
import { socialKpiProgress, socialWinMetrics } from "./social-kpi";

describe("social KPI", () => {
  it("requires three posts and five comments in each attendance session", () => {
    const incomplete = socialKpiProgress([{ type: "POST" }, { type: "POST" }, ...Array.from({ length: 5 }, () => ({ type: "COMMENT" }))]);
    expect(incomplete).toMatchObject({ posts: 2, comments: 5, done: false, postPercent: 67, commentPercent: 100 });
    const complete = socialKpiProgress([...Array.from({ length: 3 }, () => ({ type: "POST" })), ...Array.from({ length: 5 }, () => ({ type: "COMMENT" }))]);
    expect(complete.done).toBe(true);
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
