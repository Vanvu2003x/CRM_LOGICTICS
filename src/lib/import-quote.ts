export type ImportQuoteMode = "FCL" | "LCL";
export type ImportQuoteCategory = "FREIGHT" | "ORIGIN" | "VIETNAM";

export type ImportQuoteLine = {
  name: string;
  loadPort?: string;
  dischargePort?: string;
  unit: string;
  price: number;
  quantity: number;
  category: ImportQuoteCategory;
  vatRate: number;
  fixedVnd: number;
  note: string;
};

const numberValue = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value ?? "").trim().replace(/,/g, "");
  const result = Number(normalized);
  return Number.isFinite(result) ? result : 0;
};

const normalizedText = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

export function importQuoteIncoterms(mode: ImportQuoteMode) {
  return mode === "FCL" ? ["EXW", "FCA", "FOB"] : ["EXW", "FCA", "FOB", "CIF"];
}

export function importQuoteTemplate(mode: ImportQuoteMode) {
  return mode === "FCL" ? "/templates/bao-gia-nhap-khau-fcl.xlsx" : "/templates/bao-gia-nhap-khau-lcl.xlsx";
}

export function inferExchangeRate(formulas: Record<string, string>, fallback = 26_600) {
  for (const formula of Object.values(formulas)) {
    const match = formula.replace(/\s/g, "").match(/\*([12]\d{4})(?:\*1\.0?8)?$/);
    if (match) return Number(match[1]);
  }
  return fallback;
}

export function parseImportQuoteMatrix(rows: unknown[][], formulas: Record<string, string> = {}) {
  const lines: ImportQuoteLine[] = [];
  let category: ImportQuoteCategory = "FREIGHT";

  rows.forEach((row, index) => {
    const first = normalizedText(row[0]);
    const lowered = first.toLocaleLowerCase("vi");
    if (/^\s*1\s*[,.-]/.test(first) || lowered.includes("cước vận chuyển quốc tế")) {
      category = "FREIGHT";
      return;
    }
    if (lowered.includes("chi phí tại việt nam") || lowered.includes("phí tại việt nam")) {
      category = "VIETNAM";
      return;
    }
    if (/^\s*2\s*[,.-]/.test(first)) {
      category = "ORIGIN";
      return;
    }
    if (/^\s*3\s*[,.-]/.test(first)) {
      category = "VIETNAM";
      return;
    }
    if (!first || lowered.includes("tổng chi phí") || lowered.includes("cảng xếp") || lowered === "lưu ý:") return;

    const quantity = numberValue(row[2]);
    const price = numberValue(row[4]);
    const hCell = `H${index + 1}`;
    const hFormula = formulas[hCell] || "";
    const fixedVnd = !hFormula ? numberValue(row[7]) : 0;
    if (quantity <= 0 || (price <= 0 && fixedVnd <= 0)) return;

    const destination = normalizedText(row[1]);
    const note = [normalizedText(row[8]), normalizedText(row[9])].filter(Boolean).join(" · ");
    lines.push({
      name: category === "FREIGHT" && destination ? `Cước quốc tế: ${first} → ${destination}` : first,
      loadPort: category === "FREIGHT" ? first : "",
      dischargePort: category === "FREIGHT" ? destination : "",
      unit: normalizedText(row[3]),
      price,
      quantity,
      category,
      vatRate: /\*1\.0?8/i.test(hFormula) ? 8 : 0,
      fixedVnd,
      note,
    });
  });

  return lines;
}

export function calculateImportQuoteLine(line: ImportQuoteLine, exchangeRate: number) {
  const usd = line.price * line.quantity;
  const vnd = line.fixedVnd > 0 ? line.fixedVnd : usd * exchangeRate * (1 + line.vatRate / 100);
  return { usd, vnd };
}

export function calculateImportQuoteTotals(lines: ImportQuoteLine[], exchangeRate: number) {
  return lines.reduce((total, line) => {
    const amount = calculateImportQuoteLine(line, exchangeRate);
    return { usd: total.usd + amount.usd, vnd: total.vnd + amount.vnd };
  }, { usd: 0, vnd: 0 });
}
