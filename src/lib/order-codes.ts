export function officialOrderCode(type: string | null | undefined, date: Date, sequence: number) {
  const prefix = type === "IMPORT" ? "LP-NK" : "LP-XK";
  const yy = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${prefix}-${yy}${month}-${String(sequence).padStart(3, "0")}`;
}
