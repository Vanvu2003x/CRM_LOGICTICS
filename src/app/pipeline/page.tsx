"use client";

import Link from "next/link";
import { Suspense, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, ChevronDown, CircleX, CircleCheck, Layers, Plus, Search } from "lucide-react";
import { useDemoData } from "@/components/demo/DemoDataProvider";
import { useUserContext } from "@/components/auth/UserContext";
import { displayStageNumber, nextStage, workflowStageNumbers } from "@/lib/business-rules";

const steps = ["Chăm sóc", "Thông tin đơn", "Tổng hợp giá", "Báo giá", "Feedback khách", "Booking", "Đại lý", "Điều xe XK", "Chứng từ", "Hải quan", "Điều xe NK", "Bảng kê chi phí", "Thanh toán"];
const tones = [
  { dot: "bg-blue-500", header: "bg-blue-50 text-blue-800", border: "border-t-blue-400" },
  { dot: "bg-teal-500", header: "bg-teal-50 text-teal-800", border: "border-t-teal-400" },
  { dot: "bg-amber-500", header: "bg-amber-50 text-amber-900", border: "border-t-amber-400" },
  { dot: "bg-violet-500", header: "bg-violet-50 text-violet-800", border: "border-t-violet-400" },
];
function toneFor(step: number) { return tones[step <= 5 ? 0 : step <= 9 ? 1 : step <= 11 ? 2 : 3]; }

export default function PipelinePage() {
  return <Suspense fallback={<div className="p-6 text-sm text-slate-500">Đang tải quy trình đơn hàng…</div>}><PipelineContent /></Suspense>;
}

function PipelineContent() {
  const params = useSearchParams();
  const { orders, moveOrder } = useDemoData();
  const { currentUser, isAdmin } = useUserContext();
  const [query, setQuery] = useState("");
  const initialType = params.get("type") === "IMPORT" ? "IMPORT" : "EXPORT";
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [dropStep, setDropStep] = useState<number | null>(null);
  const [selectedStep, setSelectedStep] = useState(() => {
    const requested = Math.min(13, Math.max(1, Number(params.get("step")) || 1));
    return workflowStageNumbers(initialType).includes(requested) ? requested : 1;
  });
  const columns = useRef<(HTMLElement | null)[]>([]);
  const stepButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const stageFilter = Number(params.get("step"));
  const alsoFilter = Number(params.get("also"));
  const filteredOrders = useMemo(() => orders.filter(order => {
    const search = query.trim().toLocaleLowerCase("vi-VN");
    return (isAdmin || order.salesId === currentUser?.id)
      && (!search || [order.id, order.customer, order.sales].some(value => value.toLocaleLowerCase("vi-VN").includes(search)))
      && (typeFilter === "ALL" || order.type === typeFilter)
      && (!stageFilter || order.step === stageFilter || order.step === alsoFilter);
  }), [orders, isAdmin, currentUser, query, typeFilter, stageFilter, alsoFilter]);
  const byStep = useMemo(() => steps.map((_, index) => filteredOrders.filter(order => order.step === index + 1)), [filteredOrders]);
  const visibleSteps = useMemo(() => workflowStageNumbers(typeFilter), [typeFilter]);

  async function advanceOrder(id: string, step: number) {
    setMovingId(id);
    try { await moveOrder(id, step); } finally { setMovingId(null); }
  }

  function selectStep(step: number) {
    setSelectedStep(step);
    if (window.matchMedia("(min-width: 768px)").matches) columns.current[step - 1]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    else stepButtons.current[step - 1]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  return <div className="min-w-0 space-y-3 pb-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white"><Layers size={20} /></span><div><h1 className="text-xl font-semibold tracking-tight text-slate-900">Quy trình đơn hàng <span className="ml-1 text-sm font-normal text-slate-500">{filteredOrders.length} đơn</span></h1><p className="mt-0.5 text-sm text-slate-500">{visibleSteps.length} bước {typeFilter === "EXPORT" ? "xuất khẩu" : typeFilter === "IMPORT" ? "nhập khẩu" : "tổng hợp"} · Theo dõi và xử lý theo tiến độ</p></div></div>
      <div className="flex gap-2"><Link href="/orders" className="inline-flex min-h-9 items-center rounded-lg border bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">Danh sách đơn</Link><Link href="/leads?intent=create-order&outcome=INTERESTED" className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700"><Plus size={14} />Chọn khách để tạo đơn</Link></div>
    </div>
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
      <label className="relative min-w-0 flex-1 basis-44"><Search size={15} className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" /><input aria-label="Tìm đơn hàng" value={query} onChange={event => setQuery(event.target.value)} placeholder="Mã đơn, khách hàng, sales…" className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
      <div role="tablist" aria-label="Loại hình đơn" className="flex h-9 rounded-lg border border-slate-200 bg-slate-50 p-0.5">{[["EXPORT","Xuất khẩu"],["IMPORT","Nhập khẩu"]].map(([value,label])=><button key={value} role="tab" aria-selected={typeFilter===value} onClick={()=>{const stages=workflowStageNumbers(value);setTypeFilter(value);if(!stages.includes(selectedStep))setSelectedStep(stages[0]);}} className={`rounded-md px-3 text-xs font-semibold transition ${typeFilter===value?"bg-white text-blue-700 shadow-sm":"text-slate-500 hover:text-slate-800"}`}>{label}</button>)}</div>
      {stageFilter > 0 && <Link href="/pipeline" className="px-2 py-2 text-xs text-blue-600">Bỏ lọc bước</Link>}
      <div className="ml-auto hidden items-center gap-3 px-2 text-[10px] text-slate-500 lg:flex">{["Kinh doanh", "Vận hành", "Giao nhận", "Thanh toán"].map((label, index) => <span key={label} className="flex items-center gap-1.5"><span className={`size-1.5 rounded-full ${tones[index].dot}`} />{label}</span>)}</div>
    </div>
    <nav aria-label="Chọn bước quy trình" className="flex items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1.5">
      {visibleSteps.map((step, index) => <div key={step} className="flex shrink-0 items-center gap-1"><button ref={element => { stepButtons.current[step - 1] = element; }} type="button" aria-pressed={selectedStep === step} onClick={() => selectStep(step)} className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${selectedStep === step ? "bg-blue-700 font-medium text-white" : "text-slate-600 hover:bg-blue-50"}`}><span className={`size-1.5 rounded-full ${toneFor(step).dot}`} />{index + 1}. {steps[step - 1]}<span className={selectedStep === step ? "text-blue-100" : "text-slate-400"}>{byStep[step - 1].length}</span></button>{index < visibleSteps.length - 1 && <ChevronRight className="size-4 shrink-0 text-slate-300" aria-hidden="true" />}</div>)}
    </nav>
    <div className="flex items-center justify-between text-sm text-slate-500 md:hidden"><button type="button" aria-label="Bước trước" disabled={visibleSteps.indexOf(selectedStep) <= 0} onClick={() => selectStep(visibleSteps[Math.max(0, visibleSteps.indexOf(selectedStep) - 1)])} className="flex min-h-10 items-center gap-1 rounded-lg px-2 disabled:opacity-30"><ChevronLeft size={16} />Trước</button><span>Bước {visibleSteps.indexOf(selectedStep) + 1} / {visibleSteps.length}</span><button type="button" aria-label="Bước tiếp theo" disabled={visibleSteps.indexOf(selectedStep) >= visibleSteps.length - 1} onClick={() => selectStep(visibleSteps[Math.min(visibleSteps.length - 1, visibleSteps.indexOf(selectedStep) + 1)])} className="flex min-h-10 items-center gap-1 rounded-lg px-2 disabled:opacity-30">Sau<ChevronRight size={16} /></button></div>
    <div aria-label="Quy trình đơn hàng theo từng bước" className="min-w-0 overflow-x-auto rounded-xl pb-2">
      <div className="flex items-start gap-2 md:w-max">
        {visibleSteps.map((step) => {
          const name = steps[step - 1], tone = toneFor(step), rows = byStep[step - 1];
          return <section key={name} ref={element => { columns.current[step - 1] = element; }} aria-label={`Bước ${step}: ${name}`} onDragOver={event => { if (draggedId) { event.preventDefault(); setDropStep(step); } }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropStep(null); }} onDrop={event => { event.preventDefault(); if (draggedId) void moveOrder(draggedId, step); setDraggedId(null); setDropStep(null); }} className={`${selectedStep === step ? "flex" : "hidden"} w-full shrink-0 flex-col overflow-hidden rounded-xl border border-t-2 ${tone.border} ${dropStep === step ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200" : "border-slate-200 bg-slate-100/80"} md:flex md:w-44`}>
            <div className={`flex min-h-11 items-center justify-between gap-2 border-b md:min-h-9 border-slate-200 px-2.5 ${tone.header}`}><h2 className="truncate text-sm font-semibold"><span className="mr-1.5 opacity-60">{displayStageNumber(step,typeFilter).toString().padStart(2, "0")}</span>{name}</h2><span className="rounded-md bg-white/80 px-1.5 py-0.5 text-xs font-semibold tabular-nums">{rows.length}</span></div>
            <div className="min-h-48 space-y-2 overflow-y-auto p-2 md:space-y-1 md:p-1 md:h-[calc(100dvh-300px)] md:min-h-72" aria-label={`Đơn ở bước ${step}`}>
              {rows.map(order => <article key={order.id} draggable={order.status === "IN_PROGRESS"} onDragStart={event => { event.dataTransfer.setData("text/plain", order.id); event.dataTransfer.effectAllowed = "move"; setDraggedId(order.id); }} onDragEnd={() => { setDraggedId(null); setDropStep(null); }} className={`group relative rounded-lg border shadow-sm transition-colors ${order.status === "FAILED" ? "border-rose-200 bg-white hover:border-rose-300" : order.status === "COMPLETED" ? "border-emerald-200 bg-white hover:border-emerald-300" : "border-slate-200 bg-white hover:border-blue-300"} ${draggedId === order.id ? "opacity-40" : ""} ${order.status === "IN_PROGRESS" ? "md:cursor-grab md:active:cursor-grabbing" : ""}`}>
                <Link href={`/pipeline/${order.id}`} onClick={event => { if (draggedId) event.preventDefault(); }} className="block rounded-lg p-2.5 md:px-1.5 md:py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"><div className="flex items-center justify-between gap-2"><span className={`truncate font-mono text-[11px] font-semibold ${order.status === "FAILED" ? "text-rose-800" : order.status === "COMPLETED" ? "text-emerald-800" : "text-blue-700"}`}>{order.id}</span><span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${order.type === "EXPORT" ? "bg-blue-50 text-blue-700" : "bg-teal-50 text-teal-700"}`}>{order.type === "EXPORT" ? "XK" : "NK"}</span></div><p title={order.customer} className="mt-1.5 truncate text-xs md:mt-1 md:text-[11px] font-medium text-slate-800">{order.customer}</p><div className="mt-2 md:mt-1 flex items-center justify-between gap-2 text-[10px] text-slate-500"><span title={order.sales} className="flex min-w-0 items-center gap-1.5"><span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-600">{order.sales.charAt(0)}</span><span className="truncate">{order.sales}</span></span><span className="shrink-0">{order.date.slice(5).split("-").reverse().join("/")}</span></div>{order.status !== "IN_PROGRESS" && <p title={order.failureReason || undefined} className={`mt-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${order.status === "FAILED" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{order.status === "FAILED" ? <CircleX size={11} /> : <CircleCheck size={11} />}{order.status === "FAILED" ? "Thất bại" : "Hoàn thành"}</p>}</Link>
                {order.status === "IN_PROGRESS" && <div className="border-t border-slate-100 p-1"><div className="flex gap-1">{order.step < 13 ? <button type="button" aria-label={`Chuyển ${order.id} sang bước ${nextStage(order.step, order.type)}: ${steps[nextStage(order.step, order.type)-1]}`} title={`Sang bước ${nextStage(order.step, order.type)}: ${steps[nextStage(order.step, order.type)-1]}`} disabled={movingId !== null} onClick={() => { void advanceOrder(order.id, nextStage(order.step, order.type)); }} className="flex min-h-10 min-w-0 flex-1 items-center justify-between gap-1 rounded-md bg-blue-600 px-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 md:min-h-8"><span className="truncate">{movingId === order.id ? "Đang chuyển…" : `Tiếp: ${steps[nextStage(order.step, order.type)-1]}`}</span><ArrowRight size={14} className="shrink-0" /></button> : <Link href={`/pipeline/${order.id}?step=13`} className="flex min-h-10 flex-1 items-center justify-center rounded-md bg-emerald-600 px-2 text-sm font-semibold text-white hover:bg-emerald-700 md:min-h-8">Xử lý thanh toán</Link>}<details className="group/transfer shrink-0"><summary aria-label={`Chọn bước khác cho ${order.id}`} title="Chọn bước khác" className="flex min-h-10 min-w-10 cursor-pointer list-none items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-500 md:min-h-8 md:min-w-8"><ChevronDown size={13} /></summary><div className="absolute right-1 top-full z-20 w-48 rounded-lg border bg-white p-2 shadow-lg"><select aria-label={`Chuyển bước ${order.id}`} value={order.step} disabled={movingId !== null} onChange={event => { void advanceOrder(order.id, Number(event.target.value)); event.currentTarget.closest("details")?.removeAttribute("open"); }} className="min-h-10 w-full rounded-md border bg-white px-1 text-sm">{workflowStageNumbers(order.type).map(target => <option key={target} value={target}>{workflowStageNumbers(order.type).indexOf(target) + 1}. {steps[target - 1]}</option>)}</select></div></details></div></div>}
              </article>)}
              {!rows.length && <p className="rounded-lg border border-dashed border-slate-300 px-2 py-6 text-center text-[11px] text-slate-400">Chưa có đơn ở bước này</p>}
            </div>
          </section>;
        })}
      </div>
    </div>
    <p className="hidden text-[10px] text-slate-400 md:block">Kéo ngang để xem các bước · Bấm tên bước tiếp theo trên thẻ sau khi hoàn tất thông tin · Mũi tên xuống để chọn bước khác.</p>
  </div>;
}

