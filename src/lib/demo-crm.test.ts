import { describe, expect, it } from "vitest";
import { calculateTotal, filterLeads, type DemoLead } from "./demo-crm";

const leads: DemoLead[] = [
  { id: "L-1", name: "Nguyễn An", phone: "0901", company: "VinaX", source: "ITY", needs: "Xuất khẩu", isInterested: true, callDurationSeconds: 120, callCount: 2, status: "ĐANG_CHĂM_SÓC", lastCall: "2026-10-03", sales: "Sales Demo" },
  { id: "L-2", name: "Trần Bình", phone: "0902", company: "Alpha", source: "Tự tìm kiếm", needs: "Nhập khẩu", isInterested: true, callDurationSeconds: 60, callCount: 1, status: "MỚI", lastCall: "2026-10-01", sales: "Chưa giao" },
];

describe("calculateTotal", () => {
  it("adds each line item from its price and quantity", () => {
    expect(calculateTotal([{ price: 280, quantity: 2 }, { price: 120, quantity: 2 }])).toBe(800);
  });
});

describe("filterLeads", () => {
  it("matches a lead by name and status", () => {
    expect(filterLeads(leads, "nguyễn", "ĐANG_CHĂM_SÓC")).toHaveLength(1);
    expect(filterLeads(leads, "nguyễn", "MỚI")).toHaveLength(0);
  });
});
