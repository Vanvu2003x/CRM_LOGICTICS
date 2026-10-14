const sourceLabels: Record<string, string> = {
  MANUAL: "Nhập thủ công",
  SOCIAL: "Mạng xã hội",
  TRADE_FAIR: "Hội chợ",
  TEST_E2E: "Dữ liệu kiểm thử",
  EXCEL: "Nhập từ Excel",
  COMPANY: "Công ty",
};

export function leadSourceLabel(source?: string | null) {
  const value = source?.trim() || "MANUAL";
  return sourceLabels[value] || value;
}

export function paginate<T>(items: T[], requestedPage: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(totalPages, Math.max(1, Math.trunc(requestedPage) || 1));
  return { items: items.slice((page - 1) * pageSize, page * pageSize), page, totalPages };
}
