"use client";
import { useListPagination } from "@/hooks/use-list-pagination";

import Link from "next/link";
import { useState } from "react";
import { useDemoData } from "@/components/demo/DemoDataProvider";
import { todayInVietnam } from "@/lib/dashboard";
import { invoiceState, type InvoiceStateId } from "@/lib/payment-status";

const stateStyle: Record<InvoiceStateId, string> = {
  UNISSUED: "bg-blue-100 text-blue-700",
  UNPAID: "bg-slate-100 text-slate-700",
  DUE: "bg-amber-100 text-amber-700",
  OVERDUE: "bg-rose-100 text-rose-700",
  PAID: "bg-emerald-100 text-emerald-700",
};

export default function PaymentsPage() {
  const { orders } = useDemoData();
  const [filter, setFilter] = useState<"ALL" | InvoiceStateId>("ALL");
  const today = todayInVietnam();
  const rows = orders
    .filter(order => order.status !== "FAILED" && (order.step >= 13 || Boolean(order.invoiceIssuedAt)))
    .map(order => ({ order, state: invoiceState(order, today) }));
  const visible = rows.filter(row => filter === "ALL" || row.state.id === filter);
 const paging=useListPagination(visible);
  const summaries: { id: "ALL" | InvoiceStateId; name: string; count: number; tone: string }[] = [
    { id: "ALL", name: "Đơn thanh toán", count: rows.length, tone: "text-blue-700 bg-blue-50" },
    { id: "UNISSUED", name: "Chưa phát hành", count: rows.filter(row => row.state.id === "UNISSUED").length, tone: "text-cyan-700 bg-cyan-50" },
    { id: "UNPAID", name: "Chưa thanh toán", count: rows.filter(row => row.state.id === "UNPAID").length, tone: "text-slate-700 bg-slate-50" },
    { id: "DUE", name: "Sắp hạn 7 ngày", count: rows.filter(row => row.state.id === "DUE").length, tone: "text-amber-700 bg-amber-50" },
    { id: "OVERDUE", name: "Quá hạn", count: rows.filter(row => row.state.id === "OVERDUE").length, tone: "text-rose-700 bg-rose-50" },
    { id: "PAID", name: "Đã thanh toán", count: rows.filter(row => row.state.id === "PAID").length, tone: "text-emerald-700 bg-emerald-50" },
  ];

  return <div className="space-y-5">
    <header><p className="text-xs text-blue-600">VẬN HÀNH</p><h1 className="mt-1 text-2xl font-semibold">Công nợ & Thanh toán</h1><p className="mt-2 text-slate-500">Theo dõi từ lúc chờ phát hành hóa đơn đến khi đã thu đủ tiền.</p></header>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{summaries.map(card => <button key={card.id} onClick={() => setFilter(card.id)} aria-pressed={filter === card.id} className={`min-h-24 rounded-xl border p-4 text-left transition ${card.tone} ${filter === card.id ? "ring-2 ring-blue-500" : "hover:border-blue-300"}`}><span className="text-sm font-medium">{card.name}</span><b className="mt-2 block text-2xl">{card.count}</b></button>)}</div>

    <div className="grid gap-3 md:hidden">{paging.items.map(({ order, state }) => <article key={order.id} className={`rounded-xl border bg-white p-4 ${state.id === "OVERDUE" ? "border-rose-200" : "border-slate-200"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-950">{order.customer}</p><p className="mt-1 font-mono text-xs text-slate-500">{order.invoiceNumber || order.id}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${stateStyle[state.id]}`}>{state.label}</span></div><dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-sm"><div><dt className="text-slate-500">Số tiền</dt><dd className="mt-1 font-semibold">{order.invoiceAmount ? `${order.invoiceAmount.toLocaleString("vi-VN")} ${order.invoiceCurrency}` : "Chưa nhập"}</dd></div><div><dt className="text-slate-500">Hạn thanh toán</dt><dd className="mt-1">{order.dueDate?.slice(0, 10) || "Chưa đặt"}</dd></div></dl><Link href={`/pipeline/${order.id}?step=13`} className="mt-4 flex min-h-10 items-center justify-center rounded-lg bg-blue-50 font-semibold text-blue-700">Mở thanh toán →</Link></article>)}</div>

    <div className="hidden overflow-x-auto rounded-2xl border bg-white md:block"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50"><tr>{["Hóa đơn / Đơn", "Khách hàng", "Số tiền", "Hạn thanh toán", "Trạng thái", ""].map(label => <th key={label} className="p-4 font-medium text-slate-500">{label}</th>)}</tr></thead><tbody>{paging.items.map(({ order, state }) => <tr key={order.id} className={`border-t ${state.id === "PAID" ? "bg-emerald-50/30" : state.id === "OVERDUE" ? "bg-rose-50/60" : state.id === "DUE" ? "bg-amber-50/50" : ""}`}><td className="p-4 font-semibold">{order.invoiceNumber || <span className="font-mono text-slate-500">{order.id}</span>}</td><td className="p-4">{order.customer}</td><td className="p-4">{order.invoiceAmount ? `${order.invoiceAmount.toLocaleString("vi-VN")} ${order.invoiceCurrency}` : "—"}</td><td className="p-4">{order.dueDate?.slice(0, 10) || "—"}</td><td className="p-4"><span className={`rounded-full px-2.5 py-1 font-semibold ${stateStyle[state.id]}`}>{state.label}</span></td><td className="p-4"><Link href={`/pipeline/${order.id}?step=13`} className="font-medium text-blue-600">Xem đơn →</Link></td></tr>)}</tbody></table></div>
    {!visible.length && <p className="rounded-xl border bg-white p-10 text-center text-slate-500">Không có đơn phù hợp bộ lọc.</p>}
    {paging.controls}
    <p className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">Phát hành hóa đơn và xác nhận đã thu tiền là hai trạng thái riêng. Đơn chỉ hoàn thành khi đã nhận đủ tiền.</p>
  </div>;
}
