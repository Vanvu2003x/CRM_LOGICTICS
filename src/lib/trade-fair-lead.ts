export type TradeFairLeadInput = {
  contactName: string;
  companyName: string;
  taxId: string;
  phone: string;
  industry: string;
  address: string;
  notes: string;
  quality: string;
};

export function normalizeTradeFairLeadInput(input: TradeFairLeadInput) {
  const normalized = {
    contactName: input.contactName.trim(),
    companyName: input.companyName.trim(),
    taxId: input.taxId.trim(),
    phone: input.phone.replace(/[\s().-]/g, ""),
    industry: input.industry.trim(),
    address: input.address.trim(),
    notes: input.notes.trim(),
    quality: input.quality.trim().toUpperCase(),
  };
  if ([normalized.contactName, normalized.companyName, normalized.taxId, normalized.phone, normalized.industry, normalized.address, normalized.notes].some(value => !value)) {
    throw new Error("Vui lòng nhập đủ thông tin khách hàng và nội dung trao đổi.");
  }
  if (!/^\+?\d{7,15}$/.test(normalized.phone)) throw new Error("Số điện thoại không hợp lệ.");
  if (!["HOT", "WARM", "COLD"].includes(normalized.quality)) throw new Error("Mức chất lượng khách hàng không hợp lệ.");
  return normalized;
}

export function tradeFairLeadHistoryEntry(
  input: ReturnType<typeof normalizeTradeFairLeadInput> & { fairName: string },
  at = new Date().toISOString(),
) {
  return {
    at,
    type: "TRADE_FAIR",
    fair: input.fairName,
    contactName: input.contactName,
    companyName: input.companyName,
    taxId: input.taxId,
    phone: input.phone,
    industry: input.industry,
    address: input.address,
    notes: input.notes,
    quality: input.quality,
  };
}
