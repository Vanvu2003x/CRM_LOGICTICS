import { describe, expect, it } from "vitest";
import { invoiceState } from "./payment-status";

describe("invoice state", () => {
  it("separates unissued orders from issued unpaid invoices", () => {
    expect(invoiceState({ invoiceIssuedAt: null, paidAt: null, dueDate: null }, "2026-10-10").id).toBe("UNISSUED");
    expect(invoiceState({ invoiceIssuedAt: "2026-10-01", paidAt: null, dueDate: "2026-10-20" }, "2026-10-10").id).toBe("UNPAID");
  });

  it("identifies upcoming, overdue and paid invoices", () => {
    expect(invoiceState({ invoiceIssuedAt: "2026-10-01", paidAt: null, dueDate: "2026-10-15" }, "2026-10-10").id).toBe("DUE");
    expect(invoiceState({ invoiceIssuedAt: "2026-10-01", paidAt: null, dueDate: "2026-10-09" }, "2026-10-10").id).toBe("OVERDUE");
    expect(invoiceState({ invoiceIssuedAt: "2026-10-01", paidAt: "2026-10-09", dueDate: "2026-10-15" }, "2026-10-10").id).toBe("PAID");
  });
});
