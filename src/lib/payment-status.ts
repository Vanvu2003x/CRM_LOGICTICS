import { daysBetween } from "./dashboard";

type InvoiceLike = {
  invoiceIssuedAt?: string | Date | null;
  paidAt?: string | Date | null;
  dueDate?: string | Date | null;
};

export type InvoiceStateId = "UNISSUED" | "UNPAID" | "DUE" | "OVERDUE" | "PAID";

function day(value: string | Date | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

export function invoiceState(invoice: InvoiceLike, today: string) {
  if (!invoice.invoiceIssuedAt) return { id: "UNISSUED" as const, label: "Chưa phát hành", remaining: null };
  if (invoice.paidAt) return { id: "PAID" as const, label: "Đã thanh toán", remaining: null };
  const due = day(invoice.dueDate);
  if (!due) return { id: "UNPAID" as const, label: "Chưa thanh toán", remaining: null };
  const remaining = daysBetween(today, due);
  if (remaining < 0) return { id: "OVERDUE" as const, label: `Quá hạn ${-remaining} ngày`, remaining };
  if (remaining <= 7) return { id: "DUE" as const, label: `Còn ${remaining} ngày`, remaining };
  return { id: "UNPAID" as const, label: "Chưa thanh toán", remaining };
}
