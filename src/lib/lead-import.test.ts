import { describe, expect, it } from "vitest";
import { parseLeadImportMatrix } from "./lead-import";

describe("parseLeadImportMatrix", () => {
  it("maps Vietnamese customer columns and restores a missing leading zero", () => {
    const result = parseLeadImportMatrix([
      ["Tên người liên hệ", "Số điện thoại", "Tên công ty", "Ngày thành lập công ty", "Mã số thuế", "Địa chỉ", "Ngành nghề", "Nhu cầu"],
      ["Phương", 394782738, "LP", "12/03/2020", "09278274", "Hà Nội", "Logistics", "TQ - VN"],
    ]);
    expect(result.valid).toEqual([{ name: "Phương", phone: "0394782738", email: "", company: "LP", companyFoundedAt: "2020-03-12", taxId: "09278274", address: "Hà Nội", industry: "Logistics", needs: "TQ - VN" }]);
    expect(result.errors).toEqual([]);
  });

  it("reports invalid and duplicate rows without importing them", () => {
    const result = parseLeadImportMatrix([
      ["Tên khách", "Điện thoại", "Công ty", "Ngày thành lập"],
      ["An", "0901234567", "A"],
      ["An trùng", "0901234567", "A"],
      ["Thiếu số", "", "B"],
    ]);
    expect(result.valid).toHaveLength(1);
    expect(result.errors.map(item => item.reason)).toEqual(["Trùng số điện thoại trong file", "Thiếu hoặc sai số điện thoại"]);
  });

  it("requires recognizable name and phone columns", () => {
    expect(() => parseLeadImportMatrix([["Foo", "Bar"], ["A", "B"]])).toThrow("Không tìm thấy cột");
  });

  it("allows optional columns to be omitted and preserves international numbers", () => {
    const result = parseLeadImportMatrix([
      ["Tên khách", "Điện thoại"],
      ["Maria", "+1 (202) 555-0123"],
    ]);
    expect(result.valid[0]).toMatchObject({ name: "Maria", phone: "+12025550123", email: "", company: "" });
    expect(result.errors).toEqual([]);
  });
});
