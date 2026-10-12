"use client";
import { useListPagination } from "@/hooks/use-list-pagination";

import type { Lead, Order, TradeFair, TradeFairLead, TradeFairParticipation, TradeFairRegistration } from "@prisma/client";
import type { PublicUser } from "@/lib/auth";
import { canChangeTradeFairSession, fairReportDeadline, toggleFairSession, type FairSession } from "@/lib/trade-fair-workflow";
import { addDays, format, isAfter, isBefore, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Building2, CalendarDays, Check, ChevronDown, ChevronUp, CircleAlert, ExternalLink, FileText, MapPin, Plus, Sparkles, TentTree, Users, X } from "lucide-react";
import { addTradeFairLead, createTradeFair, updateFairRegistration, updateParticipation } from "./actions";

type FairLead = TradeFairLead & { crmLead: (Lead & { order: Order | null }) | null };
type Participation = TradeFairParticipation & { user: PublicUser; leads: FairLead[] };
type Registration = TradeFairRegistration & { user: PublicUser };
type Fair = TradeFair & { participations: Participation[]; registrations: Registration[] };

const sessionLabels: Record<string, string> = { NONE: "Chưa chọn", MORNING: "Buổi sáng", AFTERNOON: "Buổi chiều", BOTH: "Cả ngày" };
const qualityStyles: Record<string, string> = { HOT: "bg-rose-50 text-rose-700 border-rose-200", WARM: "bg-amber-50 text-amber-700 border-amber-200", COLD: "bg-sky-50 text-sky-700 border-sky-200" };

function dayLabel(day: Date | string | null) {
  return day ? format(new Date(day), "EEEE, dd/MM", { locale: vi }) : "Chưa có ngày";
}

function sessionCount(session: string) { return session === "BOTH" ? 2 : session === "NONE" ? 0 : 1; }

function StatePill({ fair, now }: { fair: Fair; now: Date }) {
  const start = new Date(fair.startDate), end = addDays(new Date(fair.endDate), 1);
  if (isBefore(now, start)) return <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">Sắp diễn ra</span>;
  if (isBefore(now, end)) return <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Đang diễn ra</span>;
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Đã kết thúc</span>;
}

function fairPhase(fair: Fair, now: Date): "ACTIVE" | "UPCOMING" | "PAST" {
  const start = new Date(fair.startDate), end = addDays(new Date(fair.endDate), 1);
  return isBefore(now, start) ? "UPCOMING" : isBefore(now, end) ? "ACTIVE" : "PAST";
}

function PhaseHeader({ phase, count, action }: { phase: "ACTIVE" | "UPCOMING" | "PAST"; count: number; action?: React.ReactNode }) {
  const meta = { ACTIVE: ["Đang diễn ra", "Theo dõi đầy đủ lịch, khách và kết quả trong ngày.", "border-emerald-200 bg-emerald-50 text-emerald-800"], UPCOMING: ["Sắp diễn ra", "Chuẩn bị nhân sự, lịch tham gia và thông tin trước ngày bắt đầu.", "border-blue-200 bg-blue-50 text-blue-800"], PAST: ["Đã diễn ra", "Nhập bổ sung kết quả, link truyền thông và theo dõi chuyển đổi.", "border-slate-200 bg-slate-100 text-slate-700"] }[phase];
  return <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${meta[2]}`}><div><h2 className="font-bold">{meta[0]}</h2><p className="mt-0.5 text-xs opacity-75">{meta[1]}</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold">{count} hội chợ</span>{action}</div></div>;
}

type ViewMode = "overview" | "list" | "detail";

export default function TradeFairsClient({ activeUser, users, fairs, isManager, nowIso, mode = "overview", phaseFilter, detailFairId }: { activeUser: PublicUser; users: PublicUser[]; fairs: Fair[]; isManager: boolean; nowIso: string; mode?: ViewMode; phaseFilter?: "UPCOMING" | "PAST"; detailFairId?: string }) {
  const now = new Date(nowIso);
  const allParts = fairs.flatMap(fair => fair.participations);
  const allLeads = allParts.flatMap(part => part.leads);
  const missing = allParts.filter(part => part.session !== "NONE" && isAfter(now, fairReportDeadline(new Date(part.day || 0))) && (!part.marketingLink || !part.resultAt)).length;
  const activeFairs = fairs.filter(fair => !isAfter(now, addDays(new Date(fair.endDate), 1))).length;
  return <div className="space-y-5 pb-10">
    <section className="crm-themed-hero relative overflow-hidden rounded-3xl border border-blue-100 bg-[linear-gradient(120deg,#eff6ff_0%,#ffffff_48%,#ecfeff_100%)] p-5 shadow-[0_14px_42px_-28px_rgba(15,23,42,.45)] sm:p-7">
      <div className="absolute -right-12 -top-20 size-52 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-blue-600"><TentTree className="size-4" /> Hội chợ & phát triển khách hàng</div><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{isManager ? "Điều phối hội chợ" : "Lịch hội chợ của bạn"}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{isManager ? "Theo dõi đăng ký, khách tiếp cận, chất lượng lead và kết quả chuyển đổi trên cùng một luồng." : "Chọn ca tham gia, nộp kết quả trong ngày kế tiếp và đưa khách mới thẳng vào danh sách chăm sóc."}</p></div>
        {isManager && <CreateFairButton />}
      </div>
    </section>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi icon={CalendarDays} label="Chiến dịch" value={activeFairs} note="đang/sắp diễn ra" color="blue" />
      <Kpi icon={Users} label={isManager ? "Lượt đăng ký" : "Ca đã chọn"} value={isManager ? fairs.flatMap(f=>f.registrations).filter(r=>r.status==="PARTICIPATING").length : allParts.reduce((s,p)=>s+sessionCount(p.session),0)} note={isManager ? `${users.length} nhân sự trong phạm vi` : "sáng và chiều"} color="violet" />
      <Kpi icon={Building2} label="Khách tiếp cận" value={allLeads.length} note={`${allLeads.filter(l=>l.quality==="HOT").length} khách HOT`} color="emerald" />
      <Kpi icon={CircleAlert} label="Cần hoàn tất" value={missing} note="quá hạn kết quả/link" color="amber" />
    </div>
    {fairs.length === 0 ? <EmptyState isManager={isManager} /> : isManager ? <AdminView fairs={fairs} now={now} mode={mode} phaseFilter={phaseFilter} detailFairId={detailFairId} /> : <SalesView fairs={fairs} activeUser={activeUser} now={now} mode={mode} phaseFilter={phaseFilter} detailFairId={detailFairId} />}
  </div>;
}

function Kpi({ icon: Icon, label, value, note, color }: { icon: typeof CalendarDays; label: string; value: number; note: string; color: string }) {
  const colors: Record<string,string> = { blue:"bg-blue-50 text-blue-600", violet:"bg-violet-50 text-violet-600", emerald:"bg-emerald-50 text-emerald-600", amber:"bg-amber-50 text-amber-600" };
  return <div className="rounded-2xl border bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">{label}</span><span className={`grid size-8 place-items-center rounded-xl ${colors[color]}`}><Icon className="size-4" /></span></div><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p><p className="mt-1 text-[11px] text-slate-500">{note}</p></div>;
}

function EmptyState({ isManager }: { isManager: boolean }) { return <div className="rounded-3xl border border-dashed bg-white px-6 py-16 text-center"><TentTree className="mx-auto size-10 text-blue-400"/><h2 className="mt-4 font-semibold text-slate-900">Chưa có chiến dịch hội chợ</h2><p className="mt-2 text-sm text-slate-500">{isManager ? "Tạo chiến dịch đầu tiên để nhân viên chọn lịch tham gia." : "Admin chưa phân công chiến dịch hội chợ nào."}</p></div>; }

function AdminView({ fairs, now, mode, phaseFilter, detailFairId }: { fairs: Fair[]; now: Date; mode: ViewMode; phaseFilter?: "UPCOMING" | "PAST"; detailFairId?: string }) {
  const [activeOpen, setActiveOpen] = useState(true);
  const scopedFairs = phaseFilter ? fairs.filter(fair => fairPhase(fair, now) === phaseFilter) : fairs;
  const paging=useListPagination(scopedFairs,"",5);
  const grouped=(['ACTIVE','UPCOMING','PAST'] as const).map(phase=>({phase,items:paging.items.filter(fair=>fairPhase(fair,now)===phase)})).filter(group=>group.items.length);
  if (mode === "detail") {
    const fair = fairs.find(item => item.id === detailFairId);
    return fair ? <div className="space-y-4"><Link href="/trade-fairs" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"><ArrowLeft className="size-4"/>Quay lại tổng quan hội chợ</Link><AdminFairCard fair={fair} now={now}/></div> : <EmptyInline text="Không tìm thấy hội chợ."/>;
  }
  if (mode === "list") return <div className="space-y-4"><Link href="/trade-fairs" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"><ArrowLeft className="size-4"/>Quay lại tổng quan hội chợ</Link><PhaseHeader phase={phaseFilter || "UPCOMING"} count={scopedFairs.length}/><div className="space-y-3">{scopedFairs.map(fair => <FairSummaryCard key={fair.id} fair={fair} now={now}/>)}</div>{paging.controls}</div>;
  return <><div className="space-y-5">{grouped.map(group=><div key={group.phase} className="space-y-3"><PhaseHeader phase={group.phase} count={group.items.length} action={group.phase === "ACTIVE" ? <button type="button" onClick={()=>setActiveOpen(value=>!value)} className="inline-flex items-center gap-1 rounded-lg bg-white/70 px-2.5 py-1.5 text-xs font-semibold hover:bg-white" aria-expanded={activeOpen}>{activeOpen ? <ChevronUp className="size-3.5"/> : <ChevronDown className="size-3.5"/>}{activeOpen ? "Thu gọn" : "Mở rộng"}</button> : <Link href={`/trade-fairs/phase/${group.phase.toLowerCase()}`} className="inline-flex items-center gap-1 rounded-lg bg-white/70 px-2.5 py-1.5 text-xs font-semibold hover:bg-white">Xem danh sách<ArrowRight className="size-3.5"/></Link>}/>{group.phase === "ACTIVE" ? activeOpen && group.items.map(fair => <AdminFairCard key={fair.id} fair={fair} now={now}/>) : <div className="space-y-3">{group.items.map(fair => <FairSummaryCard key={fair.id} fair={fair} now={now}/>)}</div>}</div>)}</div>{paging.controls}</>;
}

function AdminFairCard({ fair, now }: { fair: Fair; now: Date }) {
    const leads = fair.participations.flatMap(part=>part.leads.map(lead=>({lead,part})));
    const wins = leads.filter(({lead})=>lead.crmLead?.order?.status==="COMPLETED").length;
    return <section key={fair.id} className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b bg-slate-50/60 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-slate-950">{fair.name}</h2><StatePill fair={fair} now={now}/></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span className="flex items-center gap-1.5"><CalendarDays className="size-3.5"/>{format(new Date(fair.startDate),"dd/MM/yyyy")} – {format(new Date(fair.endDate),"dd/MM/yyyy")}</span>{fair.location&&<span className="flex items-center gap-1.5"><MapPin className="size-3.5"/>{fair.location}</span>}</div></div><div className="flex gap-2 text-center"><MiniStat value={fair.registrations.filter(r=>r.status==="PARTICIPATING").length} label="tham gia"/><MiniStat value={leads.length} label="khách"/><MiniStat value={wins} label="win"/></div></div>
      <Tabs defaultValue="schedule" className="p-4 sm:p-5"><TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-slate-100 p-1 sm:w-fit sm:min-w-[430px]"><TabsTrigger value="schedule">Lịch tham gia</TabsTrigger><TabsTrigger value="customers">Khách hàng</TabsTrigger><TabsTrigger value="performance">Hiệu quả</TabsTrigger></TabsList>
        <TabsContent value="schedule" className="mt-4"><AdminSchedule fair={fair} now={now}/></TabsContent>
        <TabsContent value="customers" className="mt-4"><LeadTable leads={leads}/></TabsContent>
        <TabsContent value="performance" className="mt-4"><Performance fair={fair}/></TabsContent>
      </Tabs>
    </section>;
}

function FairSummaryCard({ fair, now }: { fair: Fair; now: Date }) {
  const leads = fair.participations.flatMap(part => part.leads);
  const wins = leads.filter(lead => lead.crmLead?.order?.status === "COMPLETED").length;
  return <Link href={`/trade-fairs/detail/${fair.id}`} className="group block rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-950 group-hover:text-blue-700">{fair.name}</h3><StatePill fair={fair} now={now}/></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span className="flex items-center gap-1.5"><CalendarDays className="size-3.5"/>{format(new Date(fair.startDate),"dd/MM/yyyy")} – {format(new Date(fair.endDate),"dd/MM/yyyy")}</span>{fair.location&&<span className="flex items-center gap-1.5"><MapPin className="size-3.5"/>{fair.location}</span>}</div></div><div className="flex items-center gap-2"><MiniStat value={fair.registrations.filter(r=>r.status==="PARTICIPATING").length} label="tham gia"/><MiniStat value={leads.length} label="khách"/><MiniStat value={wins} label="win"/><ArrowRight className="ml-1 size-5 text-blue-500 transition group-hover:translate-x-1"/></div></div></Link>;
}

function MiniStat({value,label}:{value:number;label:string}) { return <div className="min-w-16 rounded-xl border bg-white px-3 py-2"><b className="block text-base text-slate-950">{value}</b><span className="text-[10px] text-slate-500">{label}</span></div>; }

function AdminSchedule({ fair, now }: { fair: Fair; now: Date }) {

  const paging=useListPagination(fair.registrations,"",20);
  return <><div className="overflow-x-auto rounded-2xl border"><table className="w-full min-w-[820px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3.5">Nhân viên</th><th className="p-3.5">Đăng ký</th>{uniqueDays(fair).map(day=><th className="p-3.5" key={day.toISOString()}>{format(day,"dd/MM")}</th>)}<th className="p-3.5">Kết quả</th></tr></thead><tbody>{paging.items.map(reg=>{const parts=fair.participations.filter(p=>p.userId===reg.userId); const incomplete=parts.filter(p=>p.session!=="NONE"&&isAfter(now,fairReportDeadline(new Date(p.day||0)))&&(!p.marketingLink||!p.resultAt)).length; return <tr className="border-t" key={reg.id}><td className="p-3.5"><b>{reg.user.name}</b><span className="mt-1 block text-[10px] text-slate-400">{reg.user.extension?`Ext: ${reg.user.extension}`:reg.user.email}</span></td><td className="p-3.5">{reg.status==="DECLINED"?<div><Badge className="border-rose-200 bg-rose-50 text-rose-700">Không tham gia</Badge><p className="mt-1 max-w-40 text-[10px] text-slate-500">{reg.declineReason}</p></div>:reg.status==="PARTICIPATING"?<Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Đã chọn lịch</Badge>:<Badge variant="outline">Chờ phản hồi</Badge>}</td>{uniqueDays(fair).map(day=>{const p=parts.find(item=>item.day&&isSameDay(new Date(item.day),day));return <td className="p-3.5" key={day.toISOString()}><SessionBadge session={p?.session||"NONE"}/></td>})}<td className="p-3.5"><span className={incomplete?"font-semibold text-rose-600":"text-emerald-600"}>{incomplete?`${incomplete} ngày quá hạn`:`${parts.reduce((sum,p)=>sum+p.leads.length,0)} khách`}</span></td></tr>})}</tbody></table></div>{paging.controls}</>;
}

function LeadTable({ leads }: { leads: {lead: FairLead;part: Participation}[] }) {

  const paging=useListPagination(leads,"",20);
  if (!leads.length) return <EmptyInline text="Chưa có khách hàng nào được ghi nhận."/>;
  return <><div className="overflow-x-auto rounded-2xl border"><table className="w-full min-w-[1080px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{["Người liên hệ","Công ty","Điện thoại / Địa chỉ","Ngành nghề","Nội dung trao đổi","Sales","Chất lượng","CRM / Đơn"].map(h=><th className="p-3.5" key={h}>{h}</th>)}</tr></thead><tbody>{paging.items.map(({lead,part})=><tr className="border-t align-top" key={lead.id}><td className="p-3.5 font-semibold text-slate-900">{lead.contactName||lead.companyName}</td><td className="p-3.5"><b>{lead.companyName}</b><span className="mt-1 block text-[10px] text-slate-500">MST: {lead.taxId}</span></td><td className="p-3.5">{lead.phone}<span className="mt-1 block max-w-52 text-[10px] text-slate-500">{lead.address}</span></td><td className="p-3.5">{lead.industry}</td><td className="max-w-64 p-3.5 leading-5">{lead.notes}</td><td className="p-3.5">{part.user.name}</td><td className="p-3.5"><span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${qualityStyles[lead.quality]}`}>{lead.quality}</span></td><td className="p-3.5">{lead.crmLead?.order?<Badge className={lead.crmLead.order.status==="COMPLETED"?"bg-emerald-600":"bg-blue-600"}>{lead.crmLead.order.status==="COMPLETED"?"WIN":"Đang xử lý"}</Badge>:<span className="text-slate-500">Đã tạo Lead</span>}</td></tr>)}</tbody></table></div>{paging.controls}</>;
}

function Performance({ fair }: { fair: Fair }) {

  const paging=useListPagination(fair.registrations,"",20);
  return <><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{paging.items.map(reg=>{const parts=fair.participations.filter(p=>p.userId===reg.userId);const leads=parts.flatMap(p=>p.leads),wins=leads.filter(l=>l.crmLead?.order?.status==="COMPLETED").length;return <div key={reg.id} className="rounded-2xl border p-4"><div className="flex items-center justify-between"><b className="text-sm">{reg.user.name}</b><span className="text-xs font-semibold text-blue-600">{leads.length?Math.round(wins/leads.length*100):0}% win</span></div><div className="mt-4 grid grid-cols-4 gap-2 text-center"><Metric value={parts.reduce((s,p)=>s+sessionCount(p.session),0)} label="ca"/><Metric value={leads.length} label="khách"/><Metric value={leads.filter(l=>l.quality==="HOT").length} label="HOT"/><Metric value={wins} label="win"/></div></div>})}</div>{paging.controls}</>;
}

function Metric({value,label}:{value:number;label:string}) { return <div className="rounded-xl bg-slate-50 px-2 py-2.5"><b className="block">{value}</b><span className="text-[9px] uppercase text-slate-500">{label}</span></div>; }

function SalesView({ fairs, activeUser, now, mode, phaseFilter, detailFairId }: { fairs: Fair[]; activeUser: PublicUser; now: Date; mode: ViewMode; phaseFilter?: "UPCOMING" | "PAST"; detailFairId?: string }) {
  const [activeOpen, setActiveOpen] = useState(true);
  const scopedFairs = phaseFilter ? fairs.filter(fair => fairPhase(fair, now) === phaseFilter) : fairs;
  const paging=useListPagination(scopedFairs,"",5);
  const grouped=(['ACTIVE','UPCOMING','PAST'] as const).map(phase=>({phase,items:paging.items.filter(fair=>fairPhase(fair,now)===phase)})).filter(group=>group.items.length);
  if (mode === "detail") {
    const fair = fairs.find(item => item.id === detailFairId);
    return fair ? <div className="space-y-4"><Link href="/trade-fairs" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"><ArrowLeft className="size-4"/>Quay lại tổng quan hội chợ</Link><SalesFairCard fair={fair} activeUser={activeUser} now={now}/></div> : <EmptyInline text="Không tìm thấy hội chợ."/>;
  }
  if (mode === "list") return <div className="space-y-4"><Link href="/trade-fairs" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"><ArrowLeft className="size-4"/>Quay lại tổng quan hội chợ</Link><PhaseHeader phase={phaseFilter || "UPCOMING"} count={scopedFairs.length}/><div className="space-y-3">{scopedFairs.map(fair => <FairSummaryCard key={fair.id} fair={fair} now={now}/>)}</div>{paging.controls}</div>;
  return <><div className="space-y-5">{grouped.map(group=><div key={group.phase} className="space-y-3"><PhaseHeader phase={group.phase} count={group.items.length} action={group.phase === "ACTIVE" ? <button type="button" onClick={()=>setActiveOpen(value=>!value)} className="inline-flex items-center gap-1 rounded-lg bg-white/70 px-2.5 py-1.5 text-xs font-semibold hover:bg-white" aria-expanded={activeOpen}>{activeOpen ? <ChevronUp className="size-3.5"/> : <ChevronDown className="size-3.5"/>}{activeOpen ? "Thu gọn" : "Mở rộng"}</button> : <Link href={`/trade-fairs/phase/${group.phase.toLowerCase()}`} className="inline-flex items-center gap-1 rounded-lg bg-white/70 px-2.5 py-1.5 text-xs font-semibold hover:bg-white">Xem danh sách<ArrowRight className="size-3.5"/></Link>}/>{group.phase === "ACTIVE" ? activeOpen && group.items.map(fair => <SalesFairCard key={fair.id} fair={fair} activeUser={activeUser} now={now}/>) : <div className="space-y-3">{group.items.map(fair => <FairSummaryCard key={fair.id} fair={fair} now={now}/>)}</div>}</div>)}</div>{paging.controls}</>;
}

function SalesFairCard({ fair, activeUser, now }: { fair: Fair; activeUser: PublicUser; now: Date }) {
  const reg=fair.registrations.find(r=>r.userId===activeUser.id);
  const parts=fair.participations.filter(p=>p.userId===activeUser.id);
  return <section className="overflow-hidden rounded-3xl border bg-white shadow-sm"><div className="crm-themed-subtle border-b bg-[linear-gradient(120deg,#f8fafc,#eff6ff)] p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-slate-950">{fair.name}</h2><StatePill fair={fair} now={now}/></div><p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span className="flex items-center gap-1.5"><CalendarDays className="size-3.5"/>{format(new Date(fair.startDate),"dd/MM")} – {format(new Date(fair.endDate),"dd/MM/yyyy")}</span>{fair.location&&<span className="flex items-center gap-1.5"><MapPin className="size-3.5"/>{fair.location}</span>}</p>{fair.description&&<p className="mt-3 max-w-2xl text-xs leading-5 text-slate-600">{fair.description}</p>}</div><DeclineButton fair={fair} registration={reg} userId={activeUser.id}/></div></div>
    {reg?.status==="DECLINED"?<div className="p-5"><div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800"><b>Đã báo không tham gia</b><p className="mt-1 text-xs">{reg.declineReason}</p></div></div>:<div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-5"><div className="space-y-3"><div><h3 className="text-sm font-semibold">Chọn lịch tham gia</h3><p className="mt-1 text-xs text-slate-500">Có thể chọn sáng, chiều hoặc cả ngày. Thay đổi trước khi hội chợ diễn ra.</p></div><FairDays parts={parts} fair={fair} now={now}/></div><aside className="rounded-2xl border bg-slate-50/60 p-4"><div className="flex items-center gap-2"><Sparkles className="size-4 text-violet-600"/><h3 className="text-sm font-semibold">Kết quả của bạn</h3></div><div className="mt-4 grid grid-cols-2 gap-2"><Metric value={parts.reduce((s,p)=>s+sessionCount(p.session),0)} label="ca chọn"/><Metric value={parts.reduce((s,p)=>s+p.leads.length,0)} label="khách"/><Metric value={parts.flatMap(p=>p.leads).filter(l=>l.quality==="HOT").length} label="HOT"/><Metric value={parts.filter(p=>p.marketingLink).length} label="link đã nộp"/></div><p className="mt-4 rounded-xl bg-blue-50 p-3 text-[11px] leading-5 text-blue-700">Sau mỗi ngày tham gia, hãy nhập khách đã tiếp cận và link truyền thông trước 23:59 ngày hôm sau.</p></aside></div>}
  </section>;
}

function SalesDay({part,fair,now}:{part:Participation;fair:Fair;now:Date}) {
  const paging=useListPagination(part.leads,part.id,5);
  const selected=part.session!=="NONE", due=fairReportDeadline(new Date(part.day||fair.endDate)), overdue=selected&&isAfter(now,due)&&(!part.marketingLink||!part.resultAt), canChange=canChangeTradeFairSession(part.day,now);
  const canReport=selected && now.getTime()>=due.getTime()-2*86_400_000+1;
  return <div className={`rounded-2xl border p-4 transition ${overdue?"border-rose-200 bg-rose-50/30":selected?"border-blue-200 bg-blue-50/30":"bg-white"}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><b className="text-sm capitalize">{dayLabel(part.day)}</b>{overdue&&<span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">Quá hạn</span>}{!canChange&&<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Đã khóa lịch</span>}</div><p className="mt-1 text-[11px] text-slate-500">Hạn kết quả: {format(due,"HH:mm dd/MM/yyyy")}</p></div><div className="flex gap-2"><SessionToggle part={part} slot="MORNING" locked={!canChange}/><SessionToggle part={part} slot="AFTERNOON" locked={!canChange}/></div></div>{selected&&<div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3"><span className="mr-auto text-xs text-slate-500">{part.leads.length} khách · {part.marketingLink?"Đã nộp link":"Thiếu link truyền thông"}</span>{canReport&&<><LeadDialog part={part}/><ReportDialog part={part}/></>}</div>}{part.leads.length>0&&<div className="mt-3 flex flex-wrap gap-2">{paging.items.map(lead=><span key={lead.id} className="rounded-lg border bg-white px-2.5 py-1.5 text-[10px]"><b>{lead.companyName}</b> · <span className={lead.quality==="HOT"?"text-rose-600":lead.quality==="WARM"?"text-amber-600":"text-sky-600"}>{lead.quality}</span></span>)}</div>}{part.leads.length>0&&paging.controls}</div>;
}

function SessionToggle({part,slot,locked}:{part:Participation;slot:"MORNING"|"AFTERNOON";locked:boolean}) {
  const active=part.session===slot||part.session==="BOTH"; const [pending,start]=useTransition(); const router=useRouter(); const {toast}=useToast();
  const run=()=>start(async()=>{const result=await updateParticipation(part.id,{session:toggleFairSession(part.session as FairSession,slot),resultNote:part.resultNote||undefined,marketingLink:part.marketingLink||undefined});if(!result.success)toast({title:result.error,variant:"destructive"});else router.refresh();});
  return <button type="button" disabled={pending||locked} title={locked?"Lịch đã khóa vì ngày hội chợ đã bắt đầu":undefined} onClick={run} className={`min-w-24 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${active?"border-blue-600 bg-blue-600 text-white shadow-sm":"bg-white text-slate-600 hover:border-blue-300"}`}>{active&&<Check className="mr-1 inline size-3"/>}{slot==="MORNING"?"Buổi sáng":"Buổi chiều"}</button>;
}

function SessionBadge({session}:{session:string}) { const active=session!=="NONE";return <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${active?"bg-blue-50 text-blue-700":"bg-slate-100 text-slate-400"}`}>{sessionLabels[session]}</span>; }

function CreateFairButton() {
  const [open,setOpen]=useState(false),[pending,start]=useTransition(); const router=useRouter();const {toast}=useToast();
  const [form,setForm]=useState({name:"",location:"",description:"",startDate:"",endDate:""});
  const submit=()=>start(async()=>{const result=await createTradeFair(form);if(!result.success){toast({title:result.error,variant:"destructive"});return;}toast({title:"Đã tạo chiến dịch hội chợ"});setOpen(false);router.refresh();});
  return <><Button onClick={()=>setOpen(true)} className="h-11 rounded-xl bg-blue-600 px-5 shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Plus className="size-4"/>Tạo chiến dịch</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Tạo chiến dịch hội chợ</DialogTitle></DialogHeader><div className="space-y-4 pt-2"><Field label="Tên hội chợ *"><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ví dụ: VEC 2026"/></Field><Field label="Địa điểm"><Input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Trung tâm triển lãm..."/></Field><div className="grid grid-cols-2 gap-3"><Field label="Từ ngày *"><Input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></Field><Field label="Đến ngày *"><Input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/></Field></div><Field label="Mô tả"><Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Mục tiêu, lưu ý cho đội Sales..."/></Field><Button disabled={pending||!form.name||!form.startDate||!form.endDate} onClick={submit} className="w-full rounded-xl">{pending?"Đang tạo...":"Tạo và mở đăng ký"}</Button></div></DialogContent></Dialog></>;
}

function DeclineButton({fair,registration,userId}:{fair:Fair;registration?:Registration;userId:string}) {
  const [open,setOpen]=useState(false),[reason,setReason]=useState(registration?.declineReason||""),[pending,start]=useTransition(); const {toast}=useToast();const router=useRouter();
  const declined=registration?.status==="DECLINED";
  const submit=(status:string)=>start(async()=>{const result=await updateFairRegistration(fair.id,userId,status,reason);if(!result.success){toast({title:result.error,variant:"destructive"});return;}setOpen(false);router.refresh();});
  if(declined)return <Button variant="outline" onClick={()=>submit("PENDING")} disabled={pending} className="rounded-xl">Đăng ký lại</Button>;
  return <><Button variant="outline" onClick={()=>setOpen(true)} className="rounded-xl text-slate-600"><X className="size-4"/>Không tham gia</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Lý do không tham gia</DialogTitle></DialogHeader><p className="text-sm text-slate-500">Nếu không chọn bất kỳ ngày nào trong {fair.name}, bạn cần ghi rõ lý do.</p><Textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Nhập lý do cụ thể..."/><Button onClick={()=>submit("DECLINED")} disabled={pending||!reason.trim()} className="bg-rose-600 hover:bg-rose-700">Xác nhận không tham gia</Button></DialogContent></Dialog></>;
}

function LeadDialog({part}:{part:Participation}) {
  const [open,setOpen]=useState(false),[pending,start]=useTransition();const {toast}=useToast();const router=useRouter();
  const emptyForm={contactName:"",companyName:"",taxId:"",phone:"",industry:"",address:"",notes:"",quality:"WARM"};
  const [form,setForm]=useState(emptyForm);
  const submit=()=>start(async()=>{const result=await addTradeFairLead(part.id,form);if(!result.success){toast({title:result.error,variant:"destructive"});return;}const reusedLead="reusedLead" in result&&result.reusedLead;toast({title:reusedLead?"Đã cập nhật khách có sẵn":"Đã thêm khách vào danh sách chăm sóc",description:reusedLead?"Hệ thống tìm thấy khách trùng số điện thoại hoặc MST và đã nối kết quả hội chợ vào hồ sơ hiện có.":"Thông tin khách đã được chuyển đầy đủ sang danh sách chăm sóc."});setOpen(false);setForm(emptyForm);router.refresh();});
  return <><Button size="sm" variant="outline" onClick={()=>setOpen(true)} className="rounded-lg"><Plus className="size-3.5"/>Thêm khách</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Khách tiếp cận tại hội chợ</DialogTitle></DialogHeader><p className="rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-700">Sau khi lưu, khách sẽ tự động xuất hiện trong danh sách chăm sóc. Nếu trùng số điện thoại hoặc MST, kết quả sẽ được nối vào hồ sơ đã có.</p><div className="grid gap-3 sm:grid-cols-2"><Field label="Tên người liên hệ *"><Input value={form.contactName} onChange={e=>setForm({...form,contactName:e.target.value})}/></Field><Field label="Tên công ty *"><Input value={form.companyName} onChange={e=>setForm({...form,companyName:e.target.value})}/></Field><Field label="Mã số thuế *"><Input value={form.taxId} onChange={e=>setForm({...form,taxId:e.target.value})}/></Field><Field label="Số điện thoại *"><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></Field><Field label="Ngành nghề *"><Input value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})}/></Field><Field label="Địa chỉ *"><Input value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></Field></div><Field label="Chất lượng khách"><Select value={form.quality} onValueChange={quality=>setForm({...form,quality:quality||"WARM"})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="HOT">HOT — Có nhu cầu rõ</SelectItem><SelectItem value="WARM">WARM — Cần chăm sóc</SelectItem><SelectItem value="COLD">COLD — Chưa rõ nhu cầu</SelectItem></SelectContent></Select></Field><Field label="Nội dung trao đổi *"><Textarea rows={4} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Nhu cầu, tuyến hàng, thời điểm dự kiến..."/></Field><Button onClick={submit} disabled={pending||Object.entries(form).some(([key,value])=>key!=="quality"&&!value.trim())} className="w-full rounded-xl">{pending?"Đang lưu...":"Lưu và tạo Lead chăm sóc"}</Button></DialogContent></Dialog></>;
}

function ReportDialog({part}:{part:Participation}) {
  const [open,setOpen]=useState(false),[note,setNote]=useState(part.resultNote||""),[link,setLink]=useState(part.marketingLink||""),[pending,start]=useTransition();const {toast}=useToast();const router=useRouter();
  const submit=()=>start(async()=>{const result=await updateParticipation(part.id,{session:part.session,resultNote:note,marketingLink:link});if(!result.success){toast({title:result.error,variant:"destructive"});return;}toast({title:"Đã nộp kết quả hội chợ"});setOpen(false);router.refresh();});
  return <><Button size="sm" onClick={()=>setOpen(true)} className={`rounded-lg ${part.marketingLink&&part.resultAt?"bg-emerald-600 hover:bg-emerald-700":"bg-blue-600"}`}><FileText className="size-3.5"/>{part.marketingLink&&part.resultAt?"Đã nộp":"Nộp kết quả"}</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Kết quả ngày {part.day?format(new Date(part.day),"dd/MM/yyyy"):""}</DialogTitle></DialogHeader><Field label="Ghi chú kết quả trong ngày *"><Textarea rows={4} value={note} onChange={e=>setNote(e.target.value)} placeholder="Tổng số khách tiếp cận, điểm nổi bật, việc cần tiếp tục..."/></Field><Field label="Link truyền thông sau hội chợ *"><Input value={link} onChange={e=>setLink(e.target.value)} placeholder="https://..."/></Field>{part.marketingLink&&<a href={part.marketingLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600">Mở link hiện tại <ExternalLink className="size-3"/></a>}<Button onClick={submit} disabled={pending||!note.trim()||!link.trim()} className="w-full rounded-xl">{pending?"Đang nộp...":"Hoàn tất báo cáo ngày"}</Button></DialogContent></Dialog></>;
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <div className="space-y-1.5"><Label className="text-xs text-slate-600">{label}</Label>{children}</div>; }
function EmptyInline({text}:{text:string}) { return <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-slate-500">{text}</div>; }
function uniqueDays(fair:Fair) { const seen=new Map<string,Date>();for(const p of fair.participations)if(p.day){const d=new Date(p.day),key=format(d,"yyyy-MM-dd");if(!seen.has(key))seen.set(key,d);}return [...seen.values()].sort((a,b)=>a.getTime()-b.getTime()); }

function FairDays({parts,fair,now}:{parts:Participation[];fair:Fair;now:Date}) {
 const paging=useListPagination(parts,fair.id,5);
 return <>{paging.items.map(part=><SalesDay key={part.id} part={part} fair={fair} now={now}/>)}{paging.controls}</>;
}
