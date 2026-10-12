"use client";
import { useListPagination } from "@/hooks/use-list-pagination";
import Link from "next/link";
import { useState } from "react";
import { useDemoData } from "./DemoDataProvider";
import { stages } from "@/lib/dashboard";

export function OrderList({ failed = false }: { failed?: boolean }) {
  const { orders } = useDemoData();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const rows = orders.filter((order) => (!failed || order.status === "FAILED") && (status === "ALL" || order.status === status) && [order.id, order.customer, order.sales].some((value) => value.toLocaleLowerCase("vi-VN").includes(search.toLocaleLowerCase("vi-VN"))));
 const paging=useListPagination(rows);
  return <div className="space-y-5"><div><p className="text-xs text-blue-600">QUẢN LÝ KINH DOANH</p><h1 className="mt-1 text-2xl font-semibold">{failed ? "Đơn fail" : "Danh sách đơn hàng"}</h1><p className="mt-2 text-slate-500">{rows.length} đơn • Theo dõi khách hàng, sales và tiến độ xử lý.</p></div>
    <div className="flex flex-wrap gap-3"><input aria-label="Tìm đơn hàng" placeholder="Tìm mã đơn, khách hàng, sales…" value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 min-w-0 flex-1 rounded-xl border bg-white px-3" />{!failed && <select aria-label="Trạng thái đơn" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border bg-white px-3"><option value="ALL">Tất cả trạng thái</option><option value="IN_PROGRESS">Đang xử lý</option><option value="COMPLETED">Hoàn thành</option><option value="FAILED">Fail</option></select>}<Link href="/pipeline" className="rounded-xl bg-blue-600 px-4 py-2.5 text-white">Xem Pipeline</Link></div>
    <div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[650px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{["Mã đơn", "Khách hàng", "Sales", "Bước xử lý", "Trạng thái", ""].map((name, index) => <th key={index} className="p-4 font-medium">{name}</th>)}</tr></thead><tbody>{paging.items.map((order) => <tr key={order.id} className="border-t"><td className="p-4 font-semibold">{order.id}</td><td className="p-4">{order.customer}</td><td className="p-4">{order.sales}</td><td className="p-4">{stages[order.step - 1]}</td><td className="p-4">{order.status === "FAILED" ? "Fail" : order.status === "COMPLETED" ? "Hoàn thành" : "Đang xử lý"}</td><td className="p-4"><Link className="text-blue-600 hover:underline" href={`/pipeline/${order.id}`}>Chi tiết →</Link></td></tr>)}</tbody></table>{!rows.length && <p className="p-8 text-center text-slate-500">Không có đơn phù hợp.</p>}</div>{paging.controls}</div>;
}

