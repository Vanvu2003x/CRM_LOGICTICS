"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Layers, Plus, Search } from "lucide-react";
import { useDemoData } from "@/components/demo/DemoDataProvider";
import { useUserContext } from "@/components/auth/UserContext";
import { displayStageNumber, nextStage, workflowStageNumbers } from "@/lib/business-rules";

const steps = ["Chăm sóc", "Thông tin đơn", "Tổng hợp giá", "Báo giá", "Feedback khách", "Booking", "Đại lý", "Điều xe XK", "Chứng từ", "Hải quan", "Điều xe NK", "Bảng kê chi phí", "Thanh toán"];
const stageColors = ["#1d4ed8", "#6d28d9", "#0e7490", "#b45309", "#be185d", "#15803d", "#4d7c0f", "#0f766e", "#0369a1", "#4338ca", "#7e22ce", "#b91c1c"];
const stageBackgrounds = ["#dbeafe", "#ede9fe", "#cffafe", "#fef3c7", "#fce7f3", "#dcfce7", "#ecfccb", "#ccfbf1", "#e0f2fe", "#e0e7ff", "#f3e8ff", "#fee2e2"];
function toneFor(step: number, type: string) {
  const index = displayStageNumber(step, type) - 1;
  return { color: stageColors[index] || stageColors[0], backgroundColor: stageBackgrounds[index] || stageBackgrounds[0], borderColor: stageColors[index] || stageColors[0] };
}

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
  const [movingId, setMovingId] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState(() => {
    const requested = Math.min(13, Math.max(1, Number(params.get("step")) || 1));
    return workflowStageNumbers(initialType).includes(requested) ? requested : 1;
  });
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
  }

  return <div className="min-w-0 space-y-3 pb-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white"><Layers size={20} /></span><div><h1 className="text-xl font-semibold tracking-tight text-slate-900">Quy trình đơn hàng <span className="ml-1 text-sm font-normal text-slate-500">{filteredOrders.length} đơn</span></h1><p className="mt-0.5 text-sm text-slate-500">{visibleSteps.length} bước {typeFilter === "EXPORT" ? "xuất khẩu" : typeFilter === "IMPORT" ? "nhập khẩu" : "tổng hợp"} · Theo dõi và xử lý theo tiến độ</p></div></div>
      <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto"><label className="relative min-w-0 flex-1 lg:w-64 lg:flex-none"><Search size={15} className="pointer-events-none absolute left-3 top-3 text-slate-400"/><input aria-label="Tìm đơn hàng" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Mã đơn, khách hàng, sales…" className="h-9 w-full rounded-lg border bg-white pl-8 pr-2 text-xs"/></label><div role="tablist" aria-label="Loại hình đơn" className="flex h-9 rounded-lg border bg-slate-50 p-0.5">{[["EXPORT","Xuất khẩu"],["IMPORT","Nhập khẩu"]].map(([value,label])=><button key={value} role="tab" aria-selected={typeFilter===value} onClick={()=>{const stages=workflowStageNumbers(value);setTypeFilter(value);if(!stages.includes(selectedStep))setSelectedStep(stages[0]);}} className={`rounded-md px-3 text-xs font-semibold ${typeFilter===value?"bg-white text-blue-700 shadow-sm":"text-slate-500"}`}>{label}</button>)}</div><Link href="/orders" className="inline-flex min-h-9 items-center rounded-lg border bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">Danh sách đơn</Link><Link href="/leads?intent=create-order&outcome=INTERESTED" className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700"><Plus size={14} />Chọn khách để tạo đơn</Link></div>
    </div>
    <section aria-label="Tổng quan các bước quy trình" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-semibold text-slate-900">Tổng quan quy trình đơn hàng</h2><p className="mt-1 text-xs text-slate-500">Bấm vào từng bước để xem các đơn đang xử lý tại đó.</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{filteredOrders.length} đơn</span></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{visibleSteps.map((step)=>{const tone=toneFor(step,typeFilter),count=byStep[step-1].length;return <button key={step} type="button" aria-pressed={selectedStep===step} onClick={()=>selectStep(step)} className={"min-h-24 rounded-xl border-2 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md "+(selectedStep===step?"ring-2 ring-blue-200 ring-offset-1 ":"")} style={tone}><div className="flex items-start justify-between gap-2"><span className="text-xs font-bold">{displayStageNumber(step,typeFilter).toString().padStart(2,"0")}</span><span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold tabular-nums">{count}</span></div><p className="mt-3 text-sm font-semibold leading-5">{steps[step-1]}</p></button>})}</div>
    </section>
    <section aria-label={"Đơn hàng tại bước "+selectedStep} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-base font-semibold text-slate-900">{displayStageNumber(selectedStep,typeFilter).toString().padStart(2,"0")}. {steps[selectedStep-1]}</h2><p className="mt-1 text-xs text-slate-500">{byStep[selectedStep-1].length} đơn tại bước này · Bấm vào đơn để mở chi tiết</p></div><div className="rounded-full px-3 py-1 text-xs font-semibold" style={toneFor(selectedStep,typeFilter)}>Đang chọn</div></div><div className="grid gap-3 lg:grid-cols-2">{byStep[selectedStep-1].map(order=><article key={order.id} className={"rounded-xl border-2 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md "+(order.status==="FAILED"?"border-rose-200":order.status==="COMPLETED"?"border-emerald-200":"border-slate-200 hover:border-blue-300")}><Link href={"/pipeline/"+order.id} className="block outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="font-mono text-sm font-bold text-blue-700">{order.id}</span><p className="mt-2 truncate font-semibold text-slate-900">{order.customer}</p></div><span className={"shrink-0 rounded-full px-2 py-1 text-[10px] font-bold "+(order.type==="EXPORT"?"bg-blue-50 text-blue-700":"bg-teal-50 text-teal-700")}>{order.type==="EXPORT"?"Xuất khẩu":"Nhập khẩu"}</span></div><div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500"><span>Sales: <b className="text-slate-700">{order.sales}</b></span><span>Ngày: <b className="text-slate-700">{order.date.slice(5).split("-").reverse().join("/")}</b></span></div>{order.status!=="IN_PROGRESS"&&<p className={"mt-3 inline-flex rounded-full px-2 py-1 text-xs font-semibold "+(order.status==="FAILED"?"bg-rose-50 text-rose-700":"bg-emerald-50 text-emerald-700")}>{order.status==="FAILED"?"Thất bại":"Hoàn thành"}</p>}</Link>{order.status==="IN_PROGRESS"&&<div className="mt-3 flex gap-2 border-t border-slate-100 pt-3"><button type="button" disabled={movingId!==null} onClick={()=>void advanceOrder(order.id,nextStage(order.step,order.type))} className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{movingId===order.id?"Đang chuyển…":<>Tiếp: {steps[nextStage(order.step,order.type)-1]} <ArrowRight size={15}/></>}</button><Link href={"/pipeline/"+order.id} className="inline-flex min-h-10 items-center rounded-lg border px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Chi tiết</Link></div>}</article>)}{!byStep[selectedStep-1].length&&<div className="col-span-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">Chưa có đơn ở bước này. Hãy chọn ô khác để xem đơn.</div>}</div></section>
    <p className="hidden text-[10px] text-slate-400 md:block">Kéo ngang để xem các bước · Bấm tên bước tiếp theo trên thẻ sau khi hoàn tất thông tin · Mũi tên xuống để chọn bước khác.</p>
  </div>;
}

