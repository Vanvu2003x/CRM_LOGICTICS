import { describe, expect, it } from "vitest";
import { normalizeTradeFairLeadInput, tradeFairLeadHistoryEntry } from "./trade-fair-lead";

describe("trade fair lead mapping", () => {
  it("keeps contact and company as separate fields", () => {
    expect(normalizeTradeFairLeadInput({
      contactName: "  Nguyễn An  ",
      companyName: "  Công ty An Phát ",
      taxId: " 0101234567 ",
      phone: " 0909 123 456 ",
      industry: " Logistics ",
      address: " Hà Nội ",
      notes: " Quan tâm tuyến Mỹ ",
      quality: "HOT",
    })).toEqual({
      contactName: "Nguyễn An",
      companyName: "Công ty An Phát",
      taxId: "0101234567",
      phone: "0909123456",
      industry: "Logistics",
      address: "Hà Nội",
      notes: "Quan tâm tuyến Mỹ",
      quality: "HOT",
    });
  });

  it("creates a complete source history entry", () => {
    const entry = tradeFairLeadHistoryEntry({
      fairName: "VEC 2026",
      contactName: "Nguyễn An",
      companyName: "Công ty An Phát",
      taxId: "0101234567",
      phone: "0909123456",
      industry: "Logistics",
      address: "Hà Nội",
      notes: "Quan tâm tuyến Mỹ",
      quality: "HOT",
    }, "2026-10-10T08:00:00.000Z");
    expect(entry).toMatchObject({ type: "TRADE_FAIR", fair: "VEC 2026", contactName: "Nguyễn An", companyName: "Công ty An Phát", taxId: "0101234567", quality: "HOT" });
  });

  it("rejects incomplete customer details", () => {
    expect(() => normalizeTradeFairLeadInput({
      contactName: "",
      companyName: "Công ty An Phát",
      taxId: "0101234567",
      phone: "0909123456",
      industry: "Logistics",
      address: "Hà Nội",
      notes: "Đã trao đổi",
      quality: "WARM",
    })).toThrow("đủ thông tin");
  });
});
