import { describe, expect, it } from "vitest";
import { linkedResults, taskTiming, fairSessionCount, operationReports } from "./operation-reports";

describe("operation report reconciliation", () => {
  it("deduplicates customers and orders across repeated social evidence", () => {
    const order = { id: "o1", code: "X1", status: "COMPLETED" };
    const lead = { id: "l1", name: "A", isInterested: false, interestState: "YES", callOutcome: "INTERESTED", order };
    expect(linkedResults([{ lead, order }, { lead, order }])).toMatchObject({ customers: 1, interested: 1, orders: 1, wins: 1 });
  });
  it("does not infer an on-time completion when its timestamp is absent", () => {
    expect(taskTiming({ step: "DONE", completedAt: null }, new Date("2026-10-10"), new Date("2026-10-11"))).toBe("UNKNOWN");
    expect(taskTiming({ step: "DONE", completedAt: new Date("2026-10-10") }, new Date("2026-10-10"), new Date())).toBe("ON_TIME");
    expect(taskTiming({ step: "SCRIPT_DRAFT", completedAt: null }, new Date("2026-10-10"), new Date("2026-10-11"))).toBe("OVERDUE");
  });
  it("counts both morning and afternoon as two sessions", () => {
    expect(fairSessionCount("BOTH")).toBe(2);
    expect(fairSessionCount("NONE")).toBe(0);
    expect(fairSessionCount("MORNING")).toBe(1);
  });
  it("reconciles all four summaries without counting penalties as normal tasks or duplicating wins", () => {
    type Input = Parameters<typeof operationReports>[0];
    const date = new Date("2026-10-10T01:00:00Z");
    const order = { id: "o1", code: "X1", status: "COMPLETED" };
    const lead = { id: "l1", name: "Khách A", isInterested: true, interestState: "YES", callOutcome: "INTERESTED", order };
    const posts = Array.from({ length: 8 }, (_, index) => ({ id: `p${index}`, userId: "u1", attendanceId: "a1", type: index < 3 ? "POST" : "COMMENT", lead, order, link: "https://example.com" })) as Input["posts"];
    const result = operationReports({
      users: [{ id: "u1", name: "Sales", extension: "02" }], now: new Date("2026-10-11T03:00:00Z"), posts,
      attendance: [{ id: "a1", userId: "u1", checkIn: date, checkOut: new Date("2026-10-10T10:30:00Z"), closeType: "AUTO_END_OF_DAY", posts }] as Input["attendance"],
      products: [
        { id: "n1", userId: "u1", type: "NORMAL", step: "DONE", completedAt: date, campaign: { name: "A", deadline: date } },
        { id: "n2", userId: "u1", type: "NORMAL", step: "SCRIPT_DRAFT", completedAt: null, campaign: { name: "A", deadline: date } },
        { id: "f1", userId: "u1", type: "PENALTY", step: "DONE", completedAt: date, campaign: { name: "A", deadline: date } },
        { id: "f2", userId: "u1", type: "PENALTY", step: "PRODUCT_DRAFT", completedAt: null, campaign: { name: "A", deadline: date } },
      ] as Input["products"],
      fairs: [1, 2].map(index => ({ id: `fair${index}`, userId: "u1", fair: { name: "Hội chợ" }, day: date, session: "BOTH", resultAt: date, leads: [{ id: `fl${index}`, crmLeadId: "l1", crmLead: lead }] })) as Input["fairs"],
    });
    expect(result.attendanceSummary).toEqual({ sessions: 1, minutes: 570, late: 0, early: 0, automatic: 1 });
    expect(result.campaignSummary).toEqual({ assigned: 2, completed: 1, onTime: 1, late: 1, penalties: 2, missing: 1 });
    expect(result.fairSummary).toMatchObject({ sessions: 4, submitted: 2, customers: 1, interested: 1, orders: 1, wins: 1 });
    expect(result.socialSummary).toMatchObject({ sessions: 1, posts: 3, comments: 5, met: 1, rate: 100, customers: 1, orders: 1, wins: 1 });
  });
});
