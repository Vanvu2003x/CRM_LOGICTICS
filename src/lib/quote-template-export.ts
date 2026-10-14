import JSZip from "jszip";

export type QuoteTemplateLine = {
  name?: string;
  loadPort?: string;
  dischargePort?: string;
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

const sheetIndex: Record<string, number> = { FCA: 1, FOB: 2, EXW: 3, CIF: 4 };

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
  const cellPattern = new RegExp(`<c(?=[^>]*\\br="${ref}"(?:\\s|>))[^>]*(?:\\/>|>[\\s\\S]*?<\\/c>)`);
  if (cellPattern.test(xml)) return xml.replace(cellPattern, replacement);
  const rowNumber = ref.match(/\d+/)?.[0];
  if (!rowNumber) return xml;
  const rowPattern = new RegExp(`(<row[^>]*\\br="${rowNumber}"[^>]*>)([\\s\\S]*?)(<\\/row>)`);
  return xml.replace(rowPattern, (_match, start, body, end) => `${start}${body}${replacement}${end}`);
};

const clearCell = (xml: string, ref: string) => {
  const style = cellStyle(xml, ref);
  return replaceCell(xml, ref, `<c r="${ref}"${style ? ` s="${style}"` : ""}/>`.replace(/\s+\/>$/, "/>"));
};

const patchText = (xml: string, ref: string, value: unknown) => replaceCell(xml, ref, textCell(ref, cellStyle(xml, ref), value));
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
}: {
  template: Uint8Array;
  incoterm: string;
  company: string;
  attention: string;
  lines: QuoteTemplateLine[];
  exchangeRate: number;
}) {
  const selectedSheet = String(incoterm || "EXW").toUpperCase();
  const layout = layouts[selectedSheet] || layouts.EXW;
  const zip = await JSZip.loadAsync(template);
  const sheetFile = zip.file(`xl/worksheets/sheet${sheetIndex[selectedSheet] || 3}.xml`);
  if (!sheetFile) throw new Error(`Không tìm thấy sheet ${selectedSheet} trong mẫu báo giá.`);
  let xml = await sheetFile.async("string");

  xml = patchText(xml, "A8", `Ngày báo giá: ${formatDate()}`);
  xml = patchText(xml, "C10", attention || company);
  xml = patchText(xml, "C11", company);

  const groups: Record<"FREIGHT" | "ORIGIN" | "VIETNAM", number[]> = {
    FREIGHT: layout.freight,
    ORIGIN: layout.origin,
    VIETNAM: layout.vietnam,
  };
  for (const category of Object.keys(groups) as Array<keyof typeof groups>) {
    const categoryLines = lines.filter(line => (line.category || "FREIGHT") === category);
    const rows = groups[category];
    if (categoryLines.length > rows.length) throw new Error(`Mẫu ${selectedSheet} chỉ hỗ trợ tối đa ${rows.length} dòng cho ${category}.`);
    for (const row of rows) {
      for (const column of ["A", "B", "C", "D", "E", "G", "H", "I", "J"]) xml = clearCell(xml, `${column}${row}`);
    }
    categoryLines.forEach((line, index) => {
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
  xml = patchFormula(xml, `G${layout.total}`, `SUM(G${Math.min(...Object.values(groups).flat())}:G${Math.max(...Object.values(groups).flat())})`);
  xml = patchFormula(xml, `H${layout.total}`, `SUM(H${Math.min(...Object.values(groups).flat())}:H${Math.max(...Object.values(groups).flat())})`);
  zip.file(`xl/worksheets/sheet${sheetIndex[selectedSheet] || 3}.xml`, xml);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
