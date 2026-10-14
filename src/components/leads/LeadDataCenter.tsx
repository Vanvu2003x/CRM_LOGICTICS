"use client";
import { useListPagination } from "@/hooks/use-list-pagination";

import { useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Database, Download, FileSpreadsheet, Send, Upload, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useDemoData } from "@/components/demo/DemoDataProvider";
import { useUserContext } from "@/components/auth/UserContext";
import { parseLeadImportMatrix, type LeadImportRow } from "@/lib/lead-import";

type ApiResult = { error?: string; imported?: number; duplicates?: number; assigned?: number; remaining?: number; breakdown?: { salesId: string; name: string; count: number }[] };
const button = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

async function readApi(response: Response): Promise<ApiResult> {
  const text = await response.text();
  try { return JSON.parse(text) as ApiResult; } catch { return { error: response.ok ? "Máy chủ trả về dữ liệu không hợp lệ." : "Không thể xử lý yêu cầu lúc này." }; }
}

export function LeadDataCenter() {
  const { currentUser, isAdmin } = useUserContext();
  const { leads, users, dataRequests, importBatches, leadPoolCount, refresh } = useDemoData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [filename, setFilename] = useState("");
  const [rows, setRows] = useState<LeadImportRow[]>([]);
  const [rowErrors, setRowErrors] = useState<{ row: number; name: string; phone: string; reason: string }[]>([]);
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [batchId, setBatchId] = useState("");
  const [assignCount, setAssignCount] = useState(20);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [salesQuery, setSalesQuery] = useState("");

  const salesUsers = users.filter((user) => user.role === "SALES" || user.role === "MANAGER");
  const openRequests = dataRequests.filter((item) => item.status === "OPEN");
  const filteredSalesUsers = salesUsers.filter((user) => `${user.name} ${user.email} ${user.extension || ""}`.toLowerCase().includes(salesQuery.toLowerCase()));
  const importPaging=useListPagination(rows,filename,10);
  const errorsPaging=useListPagination(rowErrors,filename,10);
  const ownOpenRequest = openRequests.find((item) => item.userId === currentUser?.id);
  const ownRemaining = leads.filter((lead) => lead.salesId === currentUser?.id && lead.status === "MỚI" && lead.callOutcome === "UNKNOWN").length;
  const latestBatch = importBatches[0];
  const poolUnclassified = leads.filter(lead => !lead.salesId && (!lead.callOutcome || lead.callOutcome === "UNKNOWN")).length;
  const poolClassified = leads.filter(lead => !lead.salesId && lead.callOutcome && lead.callOutcome !== "UNKNOWN").length;
  const expected = useMemo(() => selectedSales.map((id, index) => ({ id, count: Math.floor(Math.min(assignCount, leadPoolCount) / selectedSales.length) + (index < Math.min(assignCount, leadPoolCount) % selectedSales.length ? 1 : 0) })), [assignCount, leadPoolCount, selectedSales]);

  function openAssignment(userId?: string) {
    setSelectedSales(userId ? [userId] : []);
    setAssignCount(Math.min(Math.max(leadPoolCount, 1), 20));
    setMessage("");
    setAssignOpen(true);
  }

  async function chooseFile(file?: File) {
    if (!file) return;
    setFilename(file.name); setRows([]); setRowErrors([]); setMessage("");
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
      const result = parseLeadImportMatrix(matrix);
      setRows(result.valid); setRowErrors(result.errors);
      if (!result.valid.length) setMessage("File chưa có dòng khách hàng hợp lệ để nhập.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không đọc được file Excel."); }
  }

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const sample = [["Tên người liên hệ", "Số điện thoại", "Email", "Tên công ty", "Ngày thành lập công ty", "Mã số thuế", "Địa chỉ công ty", "Ngành nghề", "Nhu cầu / nội dung trao đổi"], ["Nguyễn Văn A", "0901234567", "contact@example.com", "Công ty ABC", "12/03/2010", "0101234567", "Hà Nội", "Logistics", "Cần tư vấn vận chuyển"]];
    const book = XLSX.utils.book_new(); const sheet = XLSX.utils.aoa_to_sheet(sample);
    sheet["!cols"] = [22, 17, 28, 24, 16, 28, 18, 34, 30].map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(book, sheet, "Khach hang"); XLSX.writeFile(book, "mau-import-khach-hang.xlsx");
  }

  async function importRows() {
    if (!rows.length || rowErrors.length) return;
    setBusy(true); setMessage("");
    const response = await fetch("/api/leads/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename, rows }) });
    const result = await readApi(response); setBusy(false);
    if (!response.ok) return setMessage(result.error || "Không nhập được dữ liệu.");
    setMessage(`Đã nhập ${result.imported || 0} khách vào kho${result.duplicates ? `, đã tự loại ${result.duplicates} dòng trùng` : ""}.`);
    setRows([]); setRowErrors([]); setFilename(""); if (fileRef.current) fileRef.current.value = ""; await refresh();
  }

  async function assign() {
    if (!selectedSales.length) return setMessage("Chọn ít nhất một nhân viên nhận data.");
    setBusy(true); setMessage("");
    const response = await fetch("/api/leads/assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ salesIds: selectedSales, count: assignCount, batchId: batchId || undefined }) });
    const result = await readApi(response); setBusy(false);
    if (!response.ok) return setMessage(result.error || "Không chia được data.");
    setMessage(`Đã giao ${result.assigned || 0} khách. Kho còn ${result.remaining || 0} khách.`); await refresh();
  }

  async function rejectRequest(id: string) {
    setBusy(true); setMessage("");
    const response = await fetch("/api/leads/data-requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "REJECTED" }) });
    const result = await readApi(response); setBusy(false);
    if (!response.ok) return setMessage(result.error || "Không từ chối được yêu cầu.");
    setMessage("Đã từ chối yêu cầu và ghi nhận lên tổng quan."); await refresh();
  }

  async function requestMoreData() {
    setBusy(true); setMessage("");
    const response = await fetch("/api/leads/data-requests", { method: "POST" }); const result = await readApi(response); setBusy(false);
    if (!response.ok) return setMessage(result.error || "Không gửi được yêu cầu.");
    setMessage("Đã báo Admin. Bạn sẽ nhận thông báo khi được cấp thêm data."); await refresh();
  }

  if (!currentUser) return null;
  if (!isAdmin) return <section className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-4 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"><Database className="size-5" /></span><div><h2 className="font-semibold text-slate-900">Data khách được giao</h2><p className="mt-1 text-sm text-slate-600"><b className="text-blue-700">{ownRemaining} khách</b> chưa liên hệ hoặc phân loại.</p></div></div><button onClick={requestMoreData} disabled={busy || Boolean(ownOpenRequest)} className={`${button} border border-blue-200 bg-white text-blue-700 hover:bg-blue-50`}>{ownOpenRequest ? <CheckCircle2 className="size-4" /> : <Send className="size-4" />}{ownOpenRequest ? "Đang chờ Admin cấp data" : "Báo hết data / Xin cấp thêm"}</button></div>
    {message && <p role="status" className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-blue-800">{message}</p>}
  </section>;

  return <>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4"><div className="flex min-h-28 items-center gap-3 p-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Database className="size-5" /></span><div className="min-w-0"><p className="text-xs font-medium text-slate-500">Kho chưa phân công</p><b className="mt-1 block text-2xl leading-none text-slate-950">{leadPoolCount}</b><p className="mt-2 truncate text-xs text-slate-500">{poolUnclassified} chưa phân loại · {poolClassified} đã phân loại</p></div></div><div className="flex min-h-28 items-center gap-3 p-4"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${openRequests.length ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}><AlertCircle className="size-5" /></span><div className="min-w-0"><p className="text-xs font-medium text-slate-500">Yêu cầu cấp data</p><b className="mt-1 block text-2xl leading-none text-slate-950">{openRequests.length}</b><p className="mt-2 truncate text-xs text-slate-500">{openRequests.length ? "Chờ xử lý yêu cầu mới" : "Không có yêu cầu đang chờ"}</p></div></div><div className="flex min-h-28 items-center gap-3 p-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Users className="size-5" /></span><div className="min-w-0"><p className="text-xs font-medium text-slate-500">Khách hàng</p><b className="mt-1 block text-2xl leading-none text-slate-950">{leads.length}</b><p className="mt-2 truncate text-xs text-slate-500">Trong hệ thống</p></div></div><div className="flex min-h-28 items-center gap-3 p-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><FileSpreadsheet className="size-5" /></span><div className="min-w-0"><p className="text-xs font-medium text-slate-500">Lần nhập gần nhất</p><b className="mt-1 block truncate text-sm text-slate-950">{latestBatch ? new Date(latestBatch.createdAt).toLocaleDateString("vi-VN") : "Chưa có"}</b><p className="mt-2 truncate text-xs text-slate-500">{latestBatch ? `${latestBatch.filename} · ${latestBatch.importedRows} khách` : "Tải file Excel để bắt đầu"}</p></div></div></div>
      <div className="flex flex-col gap-2 border-t bg-slate-50 p-3 sm:flex-row"><button onClick={() => { setMessage(""); setImportOpen(true); }} className={`${button} bg-blue-600 text-white hover:bg-blue-700`}><Upload className="size-4" />Nhập data từ Excel</button><button onClick={() => openAssignment()} disabled={!leadPoolCount} className={`${button} border bg-white text-slate-800 hover:bg-slate-100`}><Users className="size-4" />Chia data cho nhân viên</button></div>
      {openRequests.length > 0 && <div className="border-t px-3 py-2"><h2 className="mb-1 text-sm font-semibold text-slate-900">Nhân viên đang cần thêm data</h2><div className="grid gap-1.5 lg:grid-cols-2">{openRequests.map((item) => <div key={item.id} className="flex flex-col gap-1.5 rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="font-medium text-slate-900">{item.userName}</p><p className="mt-0.5 truncate text-xs text-slate-500">{item.note} · {new Date(item.requestedAt).toLocaleString("vi-VN")}</p></div><div className="flex shrink-0 gap-2"><button onClick={() => openAssignment(item.userId)} disabled={!leadPoolCount} className={`${button} min-h-9 px-2.5 py-1.5 bg-slate-900 text-white hover:bg-slate-700`}>Cấp data</button><button onClick={() => void rejectRequest(item.id)} disabled={busy} className={`${button} min-h-9 px-2.5 py-1.5 border border-rose-200 bg-white text-rose-700 hover:bg-rose-50`}>Từ chối</button></div></div>)}</div></div>}
    </section>

    <Dialog open={importOpen} onOpenChange={setImportOpen}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl"><DialogTitle>Nhập data khách hàng từ Excel</DialogTitle><DialogDescription>Chỉ cần có Tên người liên hệ và Số điện thoại; các cột còn lại có thể để trống hoặc bỏ qua. Hệ thống kiểm tra số điện thoại và dữ liệu trùng trước khi lưu vào kho.</DialogDescription>
      <div className="flex flex-col gap-2 rounded-xl border border-dashed bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-slate-900">File Excel hoặc CSV</p><p className="mt-1 text-xs text-slate-500">Tối đa 2.000 khách/lần, dung lượng tối đa 2 MB.</p></div><div className="flex gap-2"><button onClick={downloadTemplate} className={`${button} border bg-white text-slate-700`}><Download className="size-4" />File mẫu</button><label className={`${button} cursor-pointer bg-blue-600 text-white`}><FileSpreadsheet className="size-4" />Chọn file<input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} /></label></div></div>
      {filename && <div className="rounded-lg border p-3"><p className="font-medium">{filename}</p><div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{rows.length} dòng hợp lệ</span><span className={`rounded-full px-2 py-1 ${rowErrors.length ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{rowErrors.length} dòng lỗi</span></div></div>}
      {rows.length > 0 && <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-2">Tên khách</th><th className="p-2">Điện thoại</th><th className="p-2">Email</th><th className="p-2">Công ty</th><th className="p-2">MST</th></tr></thead><tbody>{importPaging.items.map((row, index) => <tr className="border-t" key={`${row.phone}-${index}`}><td className="p-2 font-medium">{row.name}</td><td className="p-2">{row.phone}</td><td className="p-2">{row.email || "—"}</td><td className="p-2">{row.company || "—"}</td><td className="p-2">{row.taxId || "—"}</td></tr>)}</tbody></table>{importPaging.controls}</div>}
      {rowErrors.length > 0 && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3"><p className="font-semibold text-rose-800">Sửa các dòng lỗi trước khi nhập</p>{errorsPaging.items.map((item) => <p className="mt-1 text-xs text-rose-700" key={`${item.row}-${item.phone}`}>Dòng {item.row}: {item.reason}{item.name ? ` · ${item.name}` : ""}</p>)}{errorsPaging.controls}</div>}
      {message && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}<DialogFooter><button onClick={() => setImportOpen(false)} className={`${button} border bg-white`}>Đóng</button><button onClick={importRows} disabled={busy || !rows.length || Boolean(rowErrors.length)} className={`${button} bg-blue-600 text-white`}>{busy ? "Đang nhập..." : `Nhập ${rows.length} khách vào kho`}</button></DialogFooter>
    </DialogContent></Dialog>

    <Dialog open={assignOpen} onOpenChange={setAssignOpen}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"><DialogTitle>Chia data cho nhân viên</DialogTitle><DialogDescription>Khách được chia luân phiên, số lượng cân bằng giữa các nhân viên đã chọn.</DialogDescription>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Nguồn data<select value={batchId} onChange={(event) => setBatchId(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border bg-white px-3"><option value="">Toàn bộ kho ({leadPoolCount})</option>{importBatches.map((item) => <option key={item.id} value={item.id}>{item.filename} · {item.importedRows}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Số khách cần chia<input type="number" min={1} max={Math.max(leadPoolCount, 1)} value={assignCount} onChange={(event) => setAssignCount(Math.max(1, Number(event.target.value) || 1))} className="mt-1.5 h-11 w-full rounded-lg border px-3" /></label></div>
      <div><label className="mb-2 block text-sm font-medium text-slate-700">Tìm nhân viên<input value={salesQuery} onChange={(event) => setSalesQuery(event.target.value)} placeholder="Tên, email, máy lẻ..." className="mt-1.5 h-10 w-full rounded-lg border px-3 text-sm" /></label><p className="mb-2 text-sm font-medium text-slate-700">Nhân viên nhận data</p><div className="grid gap-2 sm:grid-cols-2">{filteredSalesUsers.map((user) => { const checked = selectedSales.includes(user.id); const allocation = expected.find((item) => item.id === user.id)?.count || 0; return <label key={user.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${checked ? "border-blue-500 bg-blue-50" : "bg-white"}`}><input type="checkbox" checked={checked} onChange={() => setSelectedSales((items) => checked ? items.filter((id) => id !== user.id) : [...items, user.id])} className="size-4" /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{user.name}</span><span className="text-xs text-slate-500">{user.extension?`Máy lẻ ${user.extension} · `:""}{user.email}</span></span>{checked && <b className="text-sm text-blue-700">+{allocation}</b>}</label>; })}</div></div>
      {message && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}<DialogFooter><button onClick={() => setAssignOpen(false)} className={`${button} border bg-white`}>Đóng</button><button onClick={assign} disabled={busy || !leadPoolCount || !selectedSales.length} className={`${button} bg-blue-600 text-white`}>{busy ? "Đang chia..." : `Chia ${Math.min(assignCount, leadPoolCount)} khách`}</button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}
