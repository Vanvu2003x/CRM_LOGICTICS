import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as XLSX from "xlsx";
import { calculateImportQuoteLine, calculateImportQuoteTotals, inferExchangeRate, parseImportQuoteMatrix } from "./import-quote";

function parseTemplate(filename: string, sheetName: string) {
  const workbook = XLSX.read(readFileSync(resolve(process.cwd(), "public/templates", filename)));
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
  const formulas: Record<string, string> = {};
  Object.entries(sheet).forEach(([address, cell]) => { if (!address.startsWith("!") && typeof cell.f === "string") formulas[address] = cell.f; });
  return { lines: parseImportQuoteMatrix(rows, formulas), rate: inferExchangeRate(formulas) };
}

describe("import quote", () => {
  it("parses the customer's grouped quote matrix", () => {
    const rows = [
      ["1, Cước vận chuyển quốc tế"],
      ["Cảng xếp", "Cảng hạ", "Vol", "Đơn vị tính", "Đơn giá (USD)"],
      ["Shanghai, China", "Hải Phòng, Việt Nam", 2, "20DC", 560, "", 1120, 29_680_000, "6-8 days", "30.OCT"],
      ["2, Các chi phí tại China"],
      ["Phí chứng từ", "", 1, "Lô", 25, "", 25, 662_500],
      ["3, Các chi phí tại Việt Nam"],
      ["Phí làm thủ tục HQ", "", 1, "Tờ khai", 32, "", 32, 915_840, "Chưa gồm kiểm hóa"],
      ["Tổng chi phí", "", "", "", "", "", 1177],
    ];
    const formulas = { H3: "=G3*26500", H7: "=G7*26500*1.08" };
    const lines = parseImportQuoteMatrix(rows, formulas);

    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatchObject({ category: "FREIGHT", name: "Cước quốc tế: Shanghai, China → Hải Phòng, Việt Nam", quantity: 2, unit: "20DC" });
    expect(lines[1].category).toBe("ORIGIN");
    expect(lines[2]).toMatchObject({ category: "VIETNAM", vatRate: 8, note: "Chưa gồm kiểm hóa" });
  });

  it("uses a fixed VND amount when the source template does not use a formula", () => {
    const line = { name: "Phí CSHT", unit: "Cont", price: 10, quantity: 1, category: "VIETNAM" as const, vatRate: 0, fixedVnd: 250_000, note: "" };
    expect(calculateImportQuoteLine(line, 26_600)).toEqual({ usd: 10, vnd: 250_000 });
  });

  it("calculates USD, exchange rate and VAT totals", () => {
    const lines = [
      { name: "Ocean Freight", unit: "20DC", price: 560, quantity: 1, category: "FREIGHT" as const, vatRate: 0, fixedVnd: 0, note: "" },
      { name: "THC", unit: "Cont", price: 240, quantity: 1, category: "VIETNAM" as const, vatRate: 8, fixedVnd: 0, note: "" },
    ];
    expect(calculateImportQuoteTotals(lines, 26_500)).toEqual({ usd: 800, vnd: 21_708_800 });
  });

  it("reads the real FCL import workbook", () => {
    const result = parseTemplate("bao-gia-nhap-khau-fcl.xlsx", "FCA");
    expect(result.rate).toBe(26_600);
    expect(result.lines.some(line => line.unit.toUpperCase().includes("20DC"))).toBe(true);
    expect(new Set(result.lines.map(line => line.category))).toEqual(new Set(["FREIGHT", "ORIGIN", "VIETNAM"]));
  });

  it("recognizes FOB destination charges even when the template numbers them as section 2", () => {
    const result = parseTemplate("bao-gia-nhap-khau-fcl.xlsx", "FOB");
    expect(result.lines.slice(1).every(line => line.category === "VIETNAM")).toBe(true);
  });

  it("reads the real LCL import workbook", () => {
    const result = parseTemplate("bao-gia-nhap-khau-lcl.xlsx", "FCA");
    expect(result.lines.some(line => /cbm|rt|khối/i.test(line.unit))).toBe(true);
    expect(result.lines.some(line => line.vatRate === 8)).toBe(true);
  });
});
