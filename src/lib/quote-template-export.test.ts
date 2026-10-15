import { readFile } from "node:fs/promises";
import { join } from "node:path";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { exportQuoteTemplate } from "./quote-template-export";

describe("exportQuoteTemplate", () => {
  it("expands EXW for employee groups and fee volumes without losing the footer", async () => {
    const source = await readFile(join(process.cwd(), "public/templates/bao-gia-nhap-khau-fcl.xlsx"));
    const feeLines = Array.from({ length: 24 }, (_, index) => ({
      category: "ORIGIN" as const, groupId: `g${Math.floor(index / 8)}`,
      groupName: `Nhóm ${Math.floor(index / 8) + 1}`, name: `Khoản ${index + 1}`,
      quantity: index + 1, price: 10, unit: "Cont", vatRate: 8,
    }));
    const output = await exportQuoteTemplate({ template: source, mode: "fcl", incoterm: "FOB", company: "Công ty", attention: "Sales", exchangeRate: 26600,
      lines: [{ category: "FREIGHT", name: "Vận chuyển biển", quantity: 2, price: 100 }, ...feeLines] });
    const book = XLSX.read(output, { type: "array" });
    const sheet = book.Sheets.EXW;
    const find = (value: string) => Object.keys(sheet).find(ref => sheet[ref]?.v === value)!;
    expect(sheet.A16.v).toBe("1. Vận chuyển biển");
    for (const [index, line] of feeLines.entries()) {
      const ref = find(line.name);
      expect(ref, line.name).toBeTruthy();
      const row = ref.match(/\d+/)![0];
      expect(sheet[`C${row}`].v).toBe(index + 1);
      expect(sheet[`G${row}`].v).toBe((index + 1) * 10);
      expect(sheet[`H${row}`].v).toBeCloseTo((index + 1) * 10 * 26600 * 1.08);
    }
    for (const value of ["2. Nhóm 1", "3. Nhóm 2", "4. Nhóm 3"]) expect(find(value)).toBeTruthy();
    const total = Number(find("Tổng chi phí: ").match(/\d+/)![0]);
    expect(total).toBeGreaterThan(37);
    expect(sheet[`G${total}`].v).toBe(3200);
    expect(find("XÁC NHẬN BÁO GIÁ CỦA KHÁCH HÀNG")).toBe(`F${total + 8}`);
    const zip = await JSZip.loadAsync(output);
    const workbookXml = await zip.file("xl/workbook.xml")!.async("string");
    expect(workbookXml).toContain(`EXW!$A$1:$J$${total + 18}`);
    const xml = await zip.file("xl/worksheets/sheet1.xml")!.async("string");
    expect(xml).toContain(`ref="A${total + 9}:E${total + 9}"`);
  });

  it("keeps the original workbook assets and patches only quote data", async () => {
    const source = await readFile(join(process.cwd(), "public/templates/bao-gia-nhap-khau-lcl.xlsx"));
    const output = await exportQuoteTemplate({
      template: source,
      incoterm: "FCA",
      company: "Công ty mẫu",
      attention: "Nguyễn Văn A",
      exchangeRate: 26000,
      lines: [{ category: "FREIGHT", name: "Cước biển", loadPort: "Shanghai, China", dischargePort: "Hải Phòng, Việt Nam", line: "HPL", validUntil: "2026-10-15", unit: "CBM", quantity: 2, price: 100, note: "7 ngày" }],
    });
    const originalZip = await JSZip.loadAsync(source);
    const outputZip = await JSZip.loadAsync(output);
    const fileNames = (zip: JSZip) => Object.keys(zip.files).filter(name => !name.endsWith("/"));
    expect(fileNames(outputZip).sort()).toEqual(fileNames(originalZip).sort());
    const sheet = await outputZip.file("xl/worksheets/sheet1.xml")!.async("string");
    expect(sheet).toContain("Nguyễn Văn A");
    expect(sheet).toContain("Shanghai, China");
    expect(sheet).toContain("E18*C18");
    expect(sheet).toContain("G18*26000");
    expect(sheet).toContain("HPL");
    expect(sheet).toContain("15.OCT");
  });

  it("rejects more rows than the selected template can display", async () => {
    const source = await readFile(join(process.cwd(), "public/templates/bao-gia-nhap-khau-lcl.xlsx"));
    await expect(exportQuoteTemplate({
      template: source,
      incoterm: "CIF",
      company: "Công ty mẫu",
      attention: "Nguyễn Văn A",
      exchangeRate: 26000,
      lines: Array.from({ length: 8 }, (_, index) => ({ category: "VIETNAM" as const, name: `Phí ${index}`, unit: "Lô", quantity: 1, price: 1 })),
    })).rejects.toThrow("CIF chỉ hỗ trợ tối đa 7 dòng");
  });

  it("places custom fee groups into the available FOB fee area", async () => {
    const source = await readFile(join(process.cwd(), "public/templates/bao-gia-nhap-khau-lcl.xlsx"));
    const output = await exportQuoteTemplate({
      template: source,
      incoterm: "FOB",
      company: "Công ty FOB",
      attention: "Nguyễn Văn B",
      exchangeRate: 26000,
      lines: [{ category: "ORIGIN", groupName: "Phí local tự tạo", name: "Phí nâng hạ", unit: "Lô", quantity: 1, price: 25 }],
    });
    const zip = await JSZip.loadAsync(output);
    const sheet = await zip.file("xl/worksheets/sheet2.xml")!.async("string");
    expect(sheet).toContain("Phí nâng hạ");
    expect(sheet).toContain("E21*C21");
  });

  it("patches the active EXW sheet in the FCL template", async () => {
    const source = await readFile(join(process.cwd(), "public/templates/bao-gia-nhap-khau-fcl.xlsx"));
    const output = await exportQuoteTemplate({
      template: source,
      mode: "fcl",
      incoterm: "EXW",
      company: "Công ty thật",
      attention: "Người nhận thật",
      exchangeRate: 26500,
      lines: [
        { category: "FREIGHT", loadPort: "Cảng thật", dischargePort: "Cảng đích thật", line: "LINE thật", validUntil: "2026-10-20", unit: "40HC", quantity: 2, price: 123 },
        { category: "ORIGIN", groupName: "Nhóm phí thật", name: "Phí thật", unit: "Lô", quantity: 1, price: 45 },
      ],
    });
    const zip = await JSZip.loadAsync(output);
    const sheet = await zip.file("xl/worksheets/sheet1.xml")!.async("string");
    const workbook = await zip.file("xl/workbook.xml")!.async("string");
    const sharedStrings = await zip.file("xl/sharedStrings.xml")!.async("string");
    const originalZip = await JSZip.loadAsync(source);
    const originalSheet = await originalZip.file("xl/worksheets/sheet1.xml")!.async("string");
    const originalRels = await originalZip.file("xl/_rels/workbook.xml.rels")!.async("string");
    const outputRels = await zip.file("xl/_rels/workbook.xml.rels")!.async("string");
    // Keeping the bytes alone is insufficient: Excel must still be able to resolve them.
    for (const rel of originalRels.match(/<Relationship\b[^>]*\/>/g) || []) {
      if (!/\/worksheet"|\/calcChain"/.test(rel)) expect(outputRels).toContain(rel);
    }
    for (const part of ["xl/styles.xml", "xl/sharedStrings.xml", "xl/theme/theme1.xml"]) {
      expect(await zip.file(part)!.async("string")).toBe(await originalZip.file(part)!.async("string"));
    }
    const parsed = XLSX.read(output, { type: "array" });
    expect(parsed.SheetNames).toEqual(["EXW"]);
    const parsedSource = XLSX.read(source, { type: "array" });
    const totalCell = Object.keys(parsed.Sheets.EXW).find(ref => parsed.Sheets.EXW[ref]?.v === "Tổng chi phí: ")!;
    const delta = Number(totalCell.match(/\d+/)?.[0]) - 37;
    for (const ref of ["B1", "B3", "B4", "B5", "A7", "A10", "A11", "A17", "A38", "B39", "B40", "B41", "B42", "B43", "A46", "F45", "A47", "F47", "A54", "F54", "A55"]) {
      const moved = ref.replace(/(\d+)$/, n => String(Number(n) >= 37 ? Number(n) + delta : Number(n)));
      expect(parsed.Sheets.EXW[moved]?.v, ref).toBe(parsedSource.Sheets.EXW[ref]?.v);
      const cell = originalSheet.match(new RegExp(`<c\\b[^>]*\\br="${ref}"[^>]*(?:/>|>[\\s\\S]*?</c>)`))?.[0];
      if (cell) expect(sheet, ref).toContain(cell.replace(`r="${ref}"`, `r="${moved}"`));
    }
    expect(sheet).toContain("Cảng thật");
    expect(sheet).toContain("Phí thật");
    expect(sheet).toContain("Người nhận thật");
    expect(sheet).toContain("2. Nhóm phí thật");
    expect(workbook).toContain('name="EXW"');
    expect(workbook).not.toContain('name="FCA"');
    expect(workbook).not.toContain('name="FOB"');
    expect(sheet).toContain('fitToWidth="1" fitToHeight="1"');
    expect(sheet).toContain('r="B1" s="80" t="s"');
    expect(sharedStrings).toContain("LP INTERNATIONAL LOGISTICS AND TRADING COMPANY LIMITED");
  });
});
