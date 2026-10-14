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
      lines: [{ category: "FREIGHT", name: "Cước biển", unit: "CBM", quantity: 2, price: 100, note: "7 ngày" }],
    });
    const originalZip = await JSZip.loadAsync(source);
    const outputZip = await JSZip.loadAsync(output);
    const fileNames = (zip: JSZip) => Object.keys(zip.files).filter(name => !name.endsWith("/"));
    expect(fileNames(outputZip).sort()).toEqual(fileNames(originalZip).sort());
    const sheet = await outputZip.file("xl/worksheets/sheet1.xml")!.async("string");
    expect(sheet).toContain("Công ty mẫu");
    expect(sheet).toContain("Cước biển");
    expect(sheet).toContain("E18*C18");
    expect(sheet).toContain("G18*26000");
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
});
