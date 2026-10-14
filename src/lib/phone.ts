export function normalizeLeadPhone(value: unknown) {
  const raw = String(value ?? "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("84") && digits.length >= 11) return `0${digits.slice(2)}`;
  if (digits.length === 9 && !digits.startsWith("0")) return `0${digits}`;
  return `${raw.startsWith("+") ? "+" : ""}${digits}`;
}

export function isLeadPhone(value: string) {
  return /^\+?\d{7,25}$/.test(value);
}
