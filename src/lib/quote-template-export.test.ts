import { readFile } from "node:fs/promises";
import { join } from "node:path";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { exportQuoteTemplate } from "./quote-template-export";

describe("exportQuoteTemplate", () => {
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
    expect(sheet).toContain("Cảng thật");
    expect(sheet).toContain("Phí thật");
    expect(sheet).toContain("Người nhận thật");
    expect(sheet).toContain("Nhóm phí thật");
  });
});
