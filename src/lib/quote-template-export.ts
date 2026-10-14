import JSZip from "jszip";

export type QuoteTemplateLine = {
  name?: string;
  loadPort?: string;
  dischargePort?: string;
  groupName?: string;
  line?: string;
  validUntil?: string;
  unit?: string;
  price?: number;
  quantity?: number;
  category?: "FREIGHT" | "ORIGIN" | "VIETNAM";
  fixedVnd?: number;
  note?: string;
};

type SheetLayout = {
  freight: number[];
  origin: number[];
  vietnam: number[];
  total: number;
};

const layouts: Record<string, SheetLayout> = {
  FCA: { freight: [18], origin: [21, 22, 23, 24], vietnam: [27, 28, 29, 30, 31, 32], total: 34 },
  FOB: { freight: [18], origin: [], vietnam: [21, 22, 23, 24, 25], total: 27 },
  EXW: { freight: [18], origin: [21, 22, 23, 24, 25], vietnam: [28, 29, 30, 31, 32, 33], total: 35 },
  CIF: { freight: [], origin: [], vietnam: [17, 18, 19, 20, 21, 22, 23], total: 25 },
};
const fclLayouts: Record<string, SheetLayout> = {
  EXW: { freight: [18], origin: [21, 22, 23, 24, 25, 26], vietnam: [29, 30, 31, 32, 33, 34, 35], total: 37 },
  FCA: { freight: [18], origin: [21, 22, 23, 24, 25, 26], vietnam: [29, 30, 31, 32, 33, 34, 35], total: 37 },
  FOB: { freight: [18], origin: [], vietnam: [21, 22, 23, 24, 25, 26, 27], total: 29 },
};

const sheetIndex: Record<string, number> = { FCA: 1, FOB: 2, EXW: 3, CIF: 4 };
const fclSheetIndex: Record<string, number> = { EXW: 1, FCA: 2, FOB: 3 };
const feeSectionHeaderRows: Record<string, number[]> = { FCA: [20, 26], FOB: [20], EXW: [20, 27], CIF: [16] };
const fclFeeSectionHeaderRows: Record<string, number[]> = { FCA: [20, 28], FOB: [20], EXW: [20, 28] };

const escapeXml = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

const textCell = (ref: string, style: string | undefined, value: unknown) => {
  const styleAttr = style ? ` s="${style}"` : "";
  const text = escapeXml(value);
  return `<c r="${ref}"${styleAttr} t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
};

const numberCell = (ref: string, style: string | undefined, value: number) => {
  const styleAttr = style ? ` s="${style}"` : "";
  return `<c r="${ref}"${styleAttr}><v>${Number.isFinite(value) ? value : 0}</v></c>`;
};

const formulaCell = (ref: string, style: string | undefined, formula: string) => {
  const styleAttr = style ? ` s="${style}"` : "";
  return `<c r="${ref}"${styleAttr}><f>${formula}</f><v>0</v></c>`;
};

const cellStyle = (xml: string, ref: string) => {
  const match = xml.match(new RegExp(`<c[^>]*\\br="${ref}"[^>]*>`));
  return match?.[0].match(/\bs="(\d+)"/)?.[1];
};

const replaceCell = (xml: string, ref: string, replacement: string) => {
  const rowNumber = ref.match(/\d+/)?.[0];
  if (!rowNumber) return xml;
  const rowPattern = new RegExp(`(<row\\b[^>]*\\br="${rowNumber}"[^>]*>)([\\s\\S]*?)(<\\/row>)`);
  const cellPattern = new RegExp(`<c\\b[^>]*\\br="${ref}"[^>]*(?:\\/>|>[\\s\\S]*?<\\/c>)`);
  return xml.replace(rowPattern, (_match, start, body, end) => {
    if (cellPattern.test(body)) return `${start}${body.replace(cellPattern, replacement)}${end}`;
    return `${start}${body}${replacement}${end}`;
  });
};

const clearCell = (xml: string, ref: string) => {
  const style = cellStyle(xml, ref);
  return replaceCell(xml, ref, `<c r="${ref}"${style ? ` s="${style}"` : ""}/>`.replace(/\s+\/>$/, "/>"));
};

const patchText = (xml: string, ref: string, value: unknown) => replaceCell(xml, ref, textCell(ref, cellStyle(xml, ref), value));
const patchTextEnsureCell = (xml: string, ref: string, value: unknown) => {
  const patched = patchText(xml, ref, value);
  if (patched !== xml) return patched;
  const rowNumber = ref.match(/\d+/)?.[0];
  if (!rowNumber) return xml;
  const rowPattern = new RegExp(`(<row[^>]*\\br="${rowNumber}"[^>]*>)([\\s\\S]*?)(</row>)`);
  return xml.replace(rowPattern, (_match, start, body, end) => `${start}${textCell(ref, undefined, value)}${body}${end}`);
};
const patchNumber = (xml: string, ref: string, value: number) => replaceCell(xml, ref, numberCell(ref, cellStyle(xml, ref), value));
const patchFormula = (xml: string, ref: string, formula: string) => replaceCell(xml, ref, formulaCell(ref, cellStyle(xml, ref), formula));

const formatDate = (date = new Date()) => `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
const formatValidity = (value: unknown) => {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return raw;
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${match[3]}.${months[Number(match[2]) - 1] || match[2]}`;
};

export async function exportQuoteTemplate({
  template,
  incoterm,
  company,
  attention,
  lines,
  exchangeRate,
  mode = "lcl",
}: {
  template: Uint8Array;
  incoterm: string;
  company: string;
  attention: string;
  lines: QuoteTemplateLine[];
  exchangeRate: number;
  mode?: "fcl" | "lcl";
}) {
  const selectedSheet = String(incoterm || "EXW").toUpperCase();
  const selectedLayouts = mode === "fcl" ? fclLayouts : layouts;
  const selectedSheetIndex = mode === "fcl" ? fclSheetIndex : sheetIndex;
  const layout = selectedLayouts[selectedSheet] || selectedLayouts.EXW;
  const zip = await JSZip.loadAsync(template);
  const worksheetNumber = selectedSheetIndex[selectedSheet] || 1;
  const sheetFile = zip.file(`xl/worksheets/sheet${worksheetNumber}.xml`);
  if (!sheetFile) throw new Error(`Không tìm thấy sheet ${selectedSheet} trong mẫu báo giá.`);
  let xml = await sheetFile.async("string");

  xml = patchText(xml, "A8", `Ngày báo giá: ${formatDate()}`);
  xml = patchText(xml, "C10", attention || company);
  xml = patchText(xml, "C11", company);
  xml = patchText(xml, "A13", `LP xin được gửi lời chào trân trọng tới ${attention || "Quý khách hàng"} và ${company || "Quý Công ty"}`);
  xml = patchText(xml, "A14", `Dựa trên các thông tin nhận được, chúng tôi xin được gửi tới ${attention || "Quý khách hàng"} và Quý Công ty báo giá dịch vụ như sau:`);

  const groups: Record<"FREIGHT" | "ORIGIN" | "VIETNAM", number[]> = {
    FREIGHT: layout.freight,
    ORIGIN: layout.origin,
    VIETNAM: layout.vietnam,
  };
  const categoryLines: Record<"FREIGHT" | "ORIGIN" | "VIETNAM", QuoteTemplateLine[]> = {
    FREIGHT: lines.filter(line => (line.category || "FREIGHT") === "FREIGHT"),
    ORIGIN: lines.filter(line => line.category === "ORIGIN"),
    VIETNAM: lines.filter(line => line.category === "VIETNAM"),
  };
  if (categoryLines.ORIGIN.length && !groups.ORIGIN.length) {
    categoryLines.VIETNAM = [...categoryLines.ORIGIN, ...categoryLines.VIETNAM];
    categoryLines.ORIGIN = [];
  } else if (categoryLines.ORIGIN.length > groups.ORIGIN.length) {
    const overflow = categoryLines.ORIGIN.slice(groups.ORIGIN.length);
    categoryLines.ORIGIN = categoryLines.ORIGIN.slice(0, groups.ORIGIN.length);
    categoryLines.VIETNAM = [...overflow, ...categoryLines.VIETNAM];
  }
  const fallbackGroupNames = { ORIGIN: "Phí đầu nước ngoài", VIETNAM: "Phí tại Việt Nam" };
  const groupNames = Array.from(new Set(lines.filter(line => line.category !== "FREIGHT").map(line => line.groupName || fallbackGroupNames[line.category as "ORIGIN" | "VIETNAM"]).filter(Boolean)));
  for (const category of Object.keys(groups) as Array<keyof typeof groups>) {
    const linesForCategory = categoryLines[category];
    const rows = groups[category];
    if (linesForCategory.length > rows.length) throw new Error(`Mẫu ${selectedSheet} chỉ hỗ trợ tối đa ${rows.length} dòng cho ${category}.`);
    for (const row of rows) {
      for (const column of ["A", "B", "C", "D", "E", "G", "H", "I", "J"]) xml = clearCell(xml, `${column}${row}`);
    }
    linesForCategory.forEach((line, index) => {
      const row = rows[index];
      const quantity = Number(line.quantity || 0);
      const price = Number(line.price || 0);
      const fixedVnd = Number(line.fixedVnd || 0);
      xml = patchText(xml, `A${row}`, line.category === "FREIGHT" ? (line.loadPort || line.name || "") : (line.name || ""));
      xml = patchText(xml, `B${row}`, line.category === "FREIGHT" ? (line.dischargePort || "") : "");
      xml = patchNumber(xml, `C${row}`, quantity);
      xml = patchText(xml, `D${row}`, line.unit || "");
      xml = patchNumber(xml, `E${row}`, price);
      xml = patchFormula(xml, `G${row}`, `E${row}*C${row}`);
      xml = fixedVnd > 0 ? patchNumber(xml, `H${row}`, fixedVnd) : patchFormula(xml, `H${row}`, `G${row}*${Math.max(1, Number(exchangeRate || 26600))}`);
      xml = patchText(xml, `I${row}`, line.category === "FREIGHT" ? (line.line || "") : (line.note || ""));
      xml = patchText(xml, `J${row}`, line.category === "FREIGHT" ? formatValidity(line.validUntil) : "");
    });
  }
  const headerRows = (mode === "fcl" ? fclFeeSectionHeaderRows : feeSectionHeaderRows)[selectedSheet] || [];
  headerRows.forEach((row, index) => {
    const name = groupNames[index];
    if (name) xml = patchTextEnsureCell(xml, `A${row}`, `${index + 2}, ${name}`);
    else xml = clearCell(xml, `A${row}`);
  });
  xml = patchFormula(xml, `G${layout.total}`, `SUM(G${Math.min(...Object.values(groups).flat())}:G${Math.max(...Object.values(groups).flat())})`);
  xml = patchFormula(xml, `H${layout.total}`, `SUM(H${Math.min(...Object.values(groups).flat())}:H${Math.max(...Object.values(groups).flat())})`);
  zip.file(`xl/worksheets/sheet${worksheetNumber}.xml`, xml);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
