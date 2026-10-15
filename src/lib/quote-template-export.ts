import JSZip from "jszip";

export type QuoteTemplateLine = {
  name?: string;
  loadPort?: string;
  dischargePort?: string;
  groupName?: string;
  groupId?: string;
  line?: string;
  validUntil?: string;
  unit?: string;
  price?: number;
  quantity?: number;
  category?: "FREIGHT" | "ORIGIN" | "VIETNAM";
  fixedVnd?: number;
  vatRate?: number;
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
  const cellPattern = new RegExp(`<c\\b[^>]*\\br="${ref}"[^>]*?(?:\\/>|>[\\s\\S]*?<\\/c>)`);
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
const patchNumber = (xml: string, ref: string, value: number) => replaceCell(xml, ref, numberCell(ref, cellStyle(xml, ref), value));
const patchFormula = (xml: string, ref: string, formula: string) => replaceCell(xml, ref, formulaCell(ref, cellStyle(xml, ref), formula));
const forceOnePage = (xml: string) => xml.replace(/<pageSetup\b[^>]*\/>/, (tag) => {
  const relId = tag.match(/\br:id="([^"]+)"/)?.[1];
  return `<pageSetup fitToWidth="1" fitToHeight="1" orientation="portrait"${relId ? ` r:id="${relId}"` : ""}/>`;
});

const formatDate = (date = new Date()) => `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
const formatValidity = (value: unknown) => {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return raw;
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return `${match[3]}.${months[Number(match[2]) - 1] || match[2]}`;
};

// Reuse the template's rows and styles, replacing only the fee area.
function dynamicFclFees(xml: string, lines: QuoteTemplateLine[], rate: number, incoterm: string) {
  const template = xml;
  const rowAt = (row: number) => template.match(new RegExp(`<row\\b[^>]*\\br="${row}"[^>]*>[\\s\\S]*?</row>`))?.[0] || "";
  const moveRow = (row: string, from: number, to: number) => row
    .replace(/(<row\b[^>]*\br=")\d+("|')/, `$1${to}$2`)
    .replace(/\br="([A-Z]+)\d+"/g, (_tag, col) => `r="${col}${to}"`)
    .replace(/<f\b[^>]*>[\s\S]*?<\/f>/g, "");
  const grouped = new Map<string, { name: string; lines: QuoteTemplateLine[] }>();
  for (const line of lines.filter(line => line.category !== "FREIGHT")) {
    const key = line.groupId || line.groupName || line.category || "fees";
    if (!grouped.has(key)) grouped.set(key, { name: line.groupName || "Chi phí khác", lines: [] });
    grouped.get(key)!.lines.push(line);
  }
  const amounts = (line: QuoteTemplateLine) => {
    const usd = Number(line.quantity ?? 0) * Number(line.price ?? 0);
    return { usd, vnd: Number(line.fixedVnd || 0) > 0 ? Number(line.fixedVnd) : usd * rate * (1 + Number(line.vatRate || 0) / 100) };
  };
  const formula = (source: string, ref: string, expression: string, value: number) => replaceCell(source, ref,
    formulaCell(ref, cellStyle(source, ref), expression).replace("<v>0</v>", `<v>${value}</v>`));
  const fill = (source: string, row: number, line: QuoteTemplateLine, freight: boolean) => {
    for (const col of ["A", "B", "C", "D", "E", "G", "H", "I", "J"]) source = clearCell(source, `${col}${row}`);
    source = patchText(source, `A${row}`, freight ? line.loadPort || "" : line.name || "");
    if (freight) source = patchText(source, `B${row}`, line.dischargePort || "");
    source = patchNumber(source, `C${row}`, Number(line.quantity ?? 0));
    source = patchText(source, `D${row}`, line.unit || "");
    source = patchNumber(source, `E${row}`, Number(line.price ?? 0));
    const amount = amounts(line);
    source = formula(source, `G${row}`, `E${row}*C${row}`, amount.usd);
    source = Number(line.fixedVnd || 0) > 0 ? patchNumber(source, `H${row}`, amount.vnd)
      : formula(source, `H${row}`, `G${row}*${rate}*(1+${Number(line.vatRate || 0)}/100)`, amount.vnd);
    source = patchText(source, `I${row}`, freight ? line.line || "" : line.note || "");
    if (freight) source = patchText(source, `J${row}`, formatValidity(line.validUntil));
    return source;
  };
  const freight = lines.find(line => line.category === "FREIGHT") || {};
  xml = patchText(xml, "A16", `1. ${freight.groupName || freight.name || "Cước vận chuyển quốc tế"}`);
  xml = fill(xml, 18, freight, true);
  let next = 20;
  const rows: string[] = [];
  const merges: string[] = [];
  let number = 2;
  for (const group of grouped.values()) {
    let header = moveRow(rowAt(20), 20, next);
    header = patchText(header, `A${next}`, `${number++}. ${group.name}`);
    rows.push(header);
    merges.push(`A${next}:B${next}`, `I${next}:J${next}`);
    next++;
    // Explicit column labels make Vol and unit unambiguous in every fee group.
    let labels = moveRow(rowAt(21), 21, next);
    for (const col of ["A", "B", "C", "D", "E", "G", "H", "I", "J"]) labels = clearCell(labels, `${col}${next}`);
    for (const [col, label] of Object.entries({ A: "Khoản phí", C: "Vol", D: "Đơn vị tính", E: "Đơn giá (USD)", G: "Thành tiền (USD)", H: "Thành tiền VND", I: "Lưu ý khác" })) labels = patchText(labels, `${col}${next}`, label);
    labels = labels.replace(/<c\b[^>]*\br="([A-Z]+)\d+"[^>]*>/g, (tag, col) => {
      const style = cellStyle(template, `${col}17`);
      return style ? tag.replace(/\s+s="\d+"/, "").replace(/\s*\/?>(?=$)/, (end: string) => ` s="${style}"${end}`) : tag;
    });
    labels = labels.replace(/\bht="[^"]*"/, 'ht="32"');
    rows.push(labels);
    merges.push(`A${next}:B${next}`, `E${next}:F${next}`, `I${next}:J${next}`);
    next++;
    for (const line of group.lines) {
      let row = moveRow(rowAt(21), 21, next);
      row = fill(row, next, line, false).replace(/\bht="[^"]*"/, `ht="${Math.max(22, Math.ceil(String(line.name || "").length / 30) * 16, Math.ceil(String(line.note || "").length / 28) * 16)}"`);
      rows.push(row);
      merges.push(`A${next}:B${next}`, `E${next}:F${next}`, `I${next}:J${next}`);
      next++;
    }
    rows.push(moveRow(rowAt(19), 19, next++));
  }
  const totalRow = next;
  const delta = totalRow - 37;
  const shiftRef = (ref: string) => ref.replace(/(\$?[A-Z]+\$?)(\d+)/g, (_m, col, row) => `${col}${Number(row) >= 37 ? Number(row) + delta : row}`);
  xml = xml.replace(/<sheetData>([\s\S]*?)<\/sheetData>/, (_tag, data: string) => {
    const originalRows = data.match(/<row\b[^>]*(?:\/>|>[\s\S]*?<\/row>)/g) || [];
    const head = originalRows.filter(row => Number(row.match(/\br="(\d+)"/)?.[1]) < 20);
    const tail = originalRows.filter(row => Number(row.match(/\br="(\d+)"/)?.[1]) >= 37).map(row => row
      .replace(/(<row\b[^>]*\br=")(\d+)(")/, (_m, a, n, b) => `${a}${Number(n) + delta}${b}`)
      .replace(/\br="([A-Z]+\d+)"/g, (_m, ref) => `r="${shiftRef(ref)}"`));
    return `<sheetData>${head.join("")}${rows.join("")}${tail.join("")}</sheetData>`;
  });
  xml = xml.replace(/<mergeCells\b[^>]*>[\s\S]*?<\/mergeCells>/, tag => {
    const preserved = [...tag.matchAll(/<mergeCell ref="([^"]+)"\/>/g)].map(match => match[1])
      .filter(ref => { const n = Number(ref.match(/\d+/)?.[0]); return n < 20 || n >= 37; }).map(shiftRef);
    const all = [...preserved, ...merges];
    return `<mergeCells count="${all.length}">${all.map(ref => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>`;
  });
  xml = xml.replace(/<dimension ref="([^"]+)"\/>/, (_m, ref) => `<dimension ref="${shiftRef(ref)}"/>`);
  const total = lines.reduce((sum, line) => { const amount = amounts(line); return { usd: sum.usd + amount.usd, vnd: sum.vnd + amount.vnd }; }, { usd: 0, vnd: 0 });
  xml = formula(xml, `G${totalRow}`, `SUM(G18:G${totalRow - 1})`, total.usd);
  xml = formula(xml, `H${totalRow}`, `SUM(H18:H${totalRow - 1})`, total.vnd);
  xml = patchText(xml, `B${totalRow}`, `${incoterm} ${freight.loadPort || ""} → ${freight.dischargePort || ""}`);
  return { xml, lastRow: 55 + delta };
}

const keepOnlyExwSheet = async (zip: JSZip) => {
  const workbookFile = zip.file("xl/workbook.xml");
  const relsFile = zip.file("xl/_rels/workbook.xml.rels");
  const contentTypesFile = zip.file("[Content_Types].xml");
  if (!workbookFile || !relsFile || !contentTypesFile) return;
  const workbook = await workbookFile.async("string");
  const relationships = await relsFile.async("string");
  const contentTypes = await contentTypesFile.async("string");
  const sheetMatch = workbook.match(/<sheet\b[^>]*\bname="EXW"[^>]*\/>/);
  if (!sheetMatch) return;
  const exwRelationshipId = sheetMatch[0].match(/\br:id="([^"]+)"/)?.[1];
  if (!exwRelationshipId) return;
  const keptWorkbook = workbook
    .replace(/<sheets>[\s\S]*?<\/sheets>/, `<sheets>${sheetMatch[0]}</sheets>`)
    .replace(/<definedName\b[^>]*\blocalSheetId="(\d+)"[^>]*>[\s\S]*?<\/definedName>/g, (tag, index) => index === "0" ? tag : "")
    .replace(/<calcPr\b[^>]*\/>/, '<calcPr fullCalcOnLoad="1" forceFullCalc="1"/>');
  const keptRelationships = relationships.replace(/<Relationship\b[^>]*\/>/g, (tag) => {
    const id = tag.match(/\bId="([^"]+)"/)?.[1];
    const type = tag.match(/\bType="([^"]+)"/)?.[1];
    if (type?.endsWith("/calcChain")) return "";
    if (type?.endsWith("/worksheet") && id !== exwRelationshipId) return "";
    return tag;
  });
  const keptContentTypes = contentTypes
    .replace(/<Override\b[^>]*\bPartName="\/xl\/worksheets\/sheet(?!1\.xml)[^"]+"[^>]*\/>/g, "")
    .replace(/<Override\b[^>]*\bPartName="\/xl\/calcChain.xml"[^>]*\/>/g, "");
  zip.file("xl/workbook.xml", keptWorkbook);
  zip.file("xl/_rels/workbook.xml.rels", keptRelationships);
  zip.file("[Content_Types].xml", keptContentTypes);
  zip.remove("xl/calcChain.xml");
  for (const name of Object.keys(zip.files)) {
    if (/^xl\/worksheets\/sheet[2-9]\d*\.xml$/.test(name) || /^xl\/worksheets\/_rels\/sheet[2-9]\d*\.xml\.rels$/.test(name)) zip.remove(name);
  }
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
  const selectedSheet = mode === "fcl" ? "EXW" : String(incoterm || "EXW").toUpperCase();
  const selectedLayouts = mode === "fcl" ? fclLayouts : layouts;
  const selectedSheetIndex = mode === "fcl" ? { EXW: 1 } : sheetIndex;
  const layout = selectedLayouts[selectedSheet] || selectedLayouts.EXW;
  const zip = await JSZip.loadAsync(template);
  if (mode === "fcl") await keepOnlyExwSheet(zip);
  const worksheetNumber = selectedSheetIndex[selectedSheet] || 1;
  const sheetFile = zip.file(`xl/worksheets/sheet${worksheetNumber}.xml`);
  if (!sheetFile) throw new Error(`Không tìm thấy sheet ${selectedSheet} trong mẫu báo giá.`);
  let xml = await sheetFile.async("string");

  xml = forceOnePage(xml);
  xml = patchText(xml, "A8", `Ngày báo giá: ${formatDate()}`);
  xml = patchText(xml, "B10", attention || company);
  xml = patchText(xml, "B11", company);
  xml = patchText(xml, "A13", `LP xin được gửi lời chào trân trọng tới ${attention || "Quý khách"} và Công Ty`);
  xml = patchText(xml, "A14", `Dựa trên các thông tin nhận được, chúng tôi xin được gửi tới ${attention || "Quý khách"} và Quý Công ty báo giá dịch vụ như sau:`);

  if (mode === "fcl") {
    const result = dynamicFclFees(xml, lines, Math.max(1, Number(exchangeRate || 26600)), incoterm);
    zip.file(`xl/worksheets/sheet${worksheetNumber}.xml`, result.xml);
    const workbook = await zip.file("xl/workbook.xml")!.async("string");
    zip.file("xl/workbook.xml", workbook.replace(/EXW!\$A\$1:\$J\$55/g, `EXW!$A$1:$J$${result.lastRow}`));
    return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  }

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
  xml = patchFormula(xml, `G${layout.total}`, `SUM(G${Math.min(...Object.values(groups).flat())}:G${Math.max(...Object.values(groups).flat())})`);
  xml = patchFormula(xml, `H${layout.total}`, `SUM(H${Math.min(...Object.values(groups).flat())}:H${Math.max(...Object.values(groups).flat())})`);
  zip.file(`xl/worksheets/sheet${worksheetNumber}.xml`, xml);
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
