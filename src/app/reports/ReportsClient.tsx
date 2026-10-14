"use client";
import { useState } from "react";
import { AttendanceReport, CampaignReport, FairReport, SocialReport } from "./OperationReports";
import { useListPagination } from "@/hooks/use-list-pagination";

import type { LucideIcon } from "lucide-react";
import {
  AlertCircle, ArrowDownToLine, ArrowUpRight, BadgeCheck, Banknote, BarChart3,
  BriefcaseBusiness, CalendarDays, Clock3, FileSpreadsheet,
  Flag, Headphones, Landmark, Medal, MessageSquareMore, PhoneCall, ReceiptText,
  Target, TrendingUp, Trophy, UserRoundCheck, UsersRound, WalletCards,
} from "lucide-react";
import type { Analytics } from "@/lib/analytics";
import type { PublicUser } from "@/lib/auth";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { leadSourceLabel } from "@/lib/lead-display";

type Props = {
  data: Analytics;
  query: Record<string, string>;
  activeUser: PublicUser;
};

const card = "rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_34px_-28px_rgba(15,23,42,.32)]";

function number(value: number) { return new Intl.NumberFormat("vi-VN").format(value); }
function compact(value: number) { return new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(value); }
function money(items: { currency: string; amount: number }[], short = false) {
  if (!items.length) return "0 đ";
  return items.map((item) => {
    const formatted = short ? compact(item.amount) : number(item.amount);
    return item.currency === "VND" ? `${formatted} đ` : `${formatted} ${item.currency}`;
  }).join(" · ");
}
function hours(minutes: number) { return `${Math.floor(minutes / 60)}h ${minutes % 60}p`; }
function periodText(data: Analytics) {
  const start = new Date(data.start);
  const end = new Date(new Date(data.end).getTime() - 1);
  const format = (date: Date) => date.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" });
  return data.period === "day" ? format(start) : `${format(start)} – ${format(end)}`;
}

export default function ReportsClient({ data, query, activeUser }: Props) {
  const [tab, setTab] = useState(["overview", "people", "operations", "finance", "attendance", "campaigns", "fairs", "social"].includes(query.tab) ? query.tab : "overview");
  const k = data.kpis;
  const m = data.marketing;
  const personal = data.sales[0];
  const best = data.sales[0];
  const exportParams = new URLSearchParams({ ...query, date: data.day, period: data.period });
  return <div className="space-y-4 pb-10 sm:space-y-5">
    <section className="relative overflow-hidden rounded-2xl bg-[#071b3a] px-5 py-5 text-white shadow-[0_22px_60px_-34px_rgba(15,42,86,.8)] sm:px-7 sm:py-6">
      <div className="pointer-events-none absolute -right-14 -top-20 size-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-px w-1/2 bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-cyan-300"><BarChart3 className="size-4" /> Báo cáo điều hành</div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{data.isManager ? "Trung tâm hiệu suất toàn đội" : `Hiệu suất của ${activeUser.name}`}</h1>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-300 sm:text-sm">{data.isManager ? "Theo dõi từ cuộc gọi ITY đến doanh thu, công việc và chất lượng nguồn khách trong một luồng thống nhất." : "Theo dõi kết quả cá nhân, KPI còn thiếu và giá trị bạn đã tạo ra trong kỳ."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-semibold text-blue-50"><CalendarDays className="size-4 text-cyan-300" />{periodText(data)}</span>
          <a href={`/api/reports/calls?${exportParams}`} className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3 text-xs font-bold text-slate-900 transition hover:bg-cyan-50"><FileSpreadsheet className="size-4 text-emerald-600" /> Xuất ITY</a>
        </div>
      </div>
    </section>

    <ReportFilters data={data} query={query} tab={tab} />

    {["overview", "people", "operations", "finance"].includes(tab) && <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 2xl:grid-cols-7">
      <Metric icon={PhoneCall} label="Cuộc gọi ITY" value={number(k.calls)} note={`${k.answerRate}% kết nối`} tone="blue" />
      <Metric icon={UserRoundCheck} label="Lead có nhu cầu" value={number(k.interestedLeads)} note="Tất cả nguồn khách" tone="cyan" />
      <Metric icon={MessageSquareMore} label="Lead tìm từ MXH" value={number(data.marketing.socialLeads)} note={`${data.marketing.socialQualified} hoạt động đủ thông tin`} tone="cyan" />
      <Metric icon={BriefcaseBusiness} label="Đơn phát sinh" value={number(k.orders)} note={`${k.conversionRate}% chuyển đổi`} tone="violet" />
      <Metric icon={BadgeCheck} label="Đơn hoàn thành" value={number(k.completed)} note={k.failed ? `${k.failed} đơn thất bại` : "Không có đơn thất bại"} tone="emerald" />
      <Metric icon={Banknote} label="Đã thu trong kỳ" value={money(k.collectedByCurrency, true)} note="theo thời điểm thu tiền" tone="amber" />
      <Metric icon={AlertCircle} label="Cần xử lý" value={number(k.overdueFollowups + k.overdueInvoices)} note={`${k.overdueFollowups} follow-up · ${k.overdueInvoices} công nợ`} tone="rose" />
    </section>}

    <Tabs value={tab} onValueChange={value => setTab(String(value))} className="gap-4">
      <div className="pb-1">
        <TabsList className="grid w-full grid-cols-2 gap-1 rounded-xl border bg-white p-1 shadow-sm group-data-horizontal/tabs:h-auto sm:grid-cols-4">
          <TabsTrigger className="h-10 min-w-0 whitespace-normal px-2 text-xs sm:px-3" value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger className="h-10 min-w-0 whitespace-normal px-2 text-xs sm:px-3" value="people">{data.isManager ? "Hiệu suất nhân viên" : "Hiệu suất cá nhân"}</TabsTrigger>
          <TabsTrigger className="h-10 min-w-0 whitespace-normal px-2 text-xs sm:px-3" value="operations">Công việc & nguồn khách</TabsTrigger>
          <TabsTrigger className="h-10 min-w-0 whitespace-normal px-2 text-xs sm:px-3" value="finance">Doanh thu & công nợ</TabsTrigger>
          <TabsTrigger className="h-10 min-w-0 whitespace-normal px-2 text-xs sm:px-3" value="attendance">Chấm công</TabsTrigger>
          <TabsTrigger className="h-10 min-w-0 whitespace-normal px-2 text-xs sm:px-3" value="campaigns">Chiến dịch truyền thông</TabsTrigger>
          <TabsTrigger className="h-10 min-w-0 whitespace-normal px-2 text-xs sm:px-3" value="fairs">Hội chợ</TabsTrigger>
          <TabsTrigger className="h-10 min-w-0 whitespace-normal px-2 text-xs sm:px-3" value="social">KPI MXH</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]">
          <section className={`${card} min-w-0 p-4 sm:p-5`}>
            <SectionTitle icon={TrendingUp} title="Xu hướng hiệu suất" note="Cuộc gọi, lead mới và đơn hoàn thành theo ngày" />
            <div className="mt-5"><PerformanceChart data={data.trend} /></div>
          </section>
          <section className={`${card} p-4 sm:p-5`}>
            <SectionTitle icon={Target} title="Phễu kinh doanh" note="Từ tiếp cận đến kết quả cuối" />
            <div className="mt-5 space-y-2.5">
              <Funnel label="Cuộc gọi ITY" value={k.calls} max={Math.max(k.calls, 1)} color="bg-blue-600" />
              <Funnel label="Lead có nhu cầu" value={k.interestedLeads} max={Math.max(k.calls, k.interestedLeads, 1)} color="bg-cyan-500" />
              <Funnel label="Đơn phát sinh" value={k.orders} max={Math.max(k.calls, k.orders, 1)} color="bg-violet-500" />
              <Funnel label="Đơn hoàn thành" value={k.completed} max={Math.max(k.calls, k.completed, 1)} color="bg-emerald-500" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 border-t pt-4">
              <Mini label="Phản hồi đầu" value={k.responseHours === null ? "Chưa có" : `${k.responseHours} giờ`} />
              <Mini label="Thời gian gọi" value={`${k.duration}s`} />
            </div>
          </section>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Insight icon={best ? Trophy : UsersRound} title={data.isManager ? "Nhân viên dẫn đầu" : "Kết quả nổi bật"} value={best ? `${best.name} · ${best.completed} đơn hoàn thành` : "Chưa có dữ liệu"} note={best ? `${best.calls} cuộc gọi · ${best.conversionRate}% chuyển đổi` : "Chọn kỳ khác để xem kết quả."} color="amber" />
          <Insight icon={Clock3} title="Thời gian làm việc" value={hours(k.workMinutes)} note={`${m.sessions} ca chấm công trong kỳ`} color="blue" />
          <Insight icon={AlertCircle} title="Việc cần ưu tiên" value={`${k.overdueFollowups + k.overdueInvoices} mục quá hạn`} note={`${k.upcomingInvoices} hóa đơn sẽ đến hạn trong 7 ngày`} color="rose" />
        </div>
      </TabsContent>

      <TabsContent value="people" className="space-y-4">
        {data.isManager ? <AdminPerformance data={data} /> : <PersonalPerformance person={personal} />}
      </TabsContent>

      <TabsContent value="operations" className="space-y-4">
        <Operations data={data} />
      </TabsContent>

      <TabsContent value="finance" className="space-y-4">
        <Finance data={data} />
      </TabsContent>
      <TabsContent value="attendance"><AttendanceReport data={data.operations} /></TabsContent>
      <TabsContent value="campaigns"><CampaignReport data={data.operations} /></TabsContent>
      <TabsContent value="fairs"><FairReport data={data.operations} /></TabsContent>
      <TabsContent value="social"><SocialReport data={data.operations} /></TabsContent>
    </Tabs>
  </div>;
}

function ReportFilters({ data, query, tab }: { data: Analytics; query: Record<string, string>; tab: string }) {
  return <form className={`${card} grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[180px_150px_minmax(180px,1fr)_minmax(170px,1fr)_auto] lg:items-end`}>
    <input type="hidden" name="tab" value={tab} />
    <Filter label="Ngày đối chiếu"><input className="h-10 w-full rounded-xl border bg-white px-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" type="date" name="date" defaultValue={data.day} /></Filter>
    <Filter label="Chu kỳ"><select className="h-10 w-full rounded-xl border bg-white px-3 text-xs outline-none focus:border-blue-400" name="period" defaultValue={data.period}><option value="day">Theo ngày</option><option value="week">Theo tuần</option><option value="month">Theo tháng</option></select></Filter>
    {data.isManager && <Filter label="Nhân viên"><select className="h-10 w-full rounded-xl border bg-white px-3 text-xs outline-none focus:border-blue-400" name="sales" defaultValue={query.sales || ""}><option value="">Toàn bộ nhân viên</option>{data.users.map((user) => <option key={user.id} value={user.id}>{user.name}{user.extension?` · máy lẻ ${user.extension}`:""}</option>)}</select></Filter>}
    {data.isManager && <Filter label="Đội nhóm"><select className="h-10 w-full rounded-xl border bg-white px-3 text-xs outline-none focus:border-blue-400" name="team" defaultValue={query.team || ""}><option value="">Toàn bộ đội nhóm</option>{data.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></Filter>}
    <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700"><BarChart3 className="size-4" /> Áp dụng</button>
  </form>;
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-1.5"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>{children}</label>; }

const tones: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600", cyan: "bg-cyan-50 text-cyan-600", violet: "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600", rose: "bg-rose-50 text-rose-600",
};
function Metric({ icon: Icon, label, value, note, tone }: { icon: LucideIcon; label: string; value: string; note: string; tone: string }) {
  return <article className={`${card} min-w-0 p-3.5 sm:p-4`}><div className="flex items-start justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><span className={`grid size-8 shrink-0 place-items-center rounded-xl ${tones[tone]}`}><Icon className="size-4" /></span></div><p className="mt-2 truncate text-xl font-bold tracking-tight text-slate-950" title={value}>{value}</p><p className="mt-1 truncate text-[10px] text-slate-500" title={note}>{note}</p></article>;
}
function SectionTitle({ icon: Icon, title, note }: { icon: LucideIcon; title: string; note: string }) { return <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon className="size-4" /></span><div><h2 className="font-bold text-slate-950">{title}</h2><p className="mt-0.5 text-[11px] text-slate-500">{note}</p></div></div>; }
function Funnel({ label, value, max, color }: { label: string; value: number; max: number; color: string }) { const width = value ? Math.max(14, value / max * 100) : 3; return <div><div className="mb-1.5 flex items-center justify-between text-[11px]"><span className="text-slate-600">{label}</span><b>{value}</b></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} /></div></div>; }
function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-500">{label}</p><b className="mt-1 block text-xs">{value}</b></div>; }
function Insight({ icon: Icon, title, value, note, color }: { icon: LucideIcon; title: string; value: string; note: string; color: string }) { return <article className={`${card} flex gap-3 p-4`}><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tones[color]}`}><Icon className="size-5" /></span><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{title}</p><b className="mt-1 block truncate text-sm text-slate-950">{value}</b><p className="mt-1 text-[10px] leading-4 text-slate-500">{note}</p></div></article>; }

function AdminPerformance({ data }: { data: Analytics }) {

 const paging=useListPagination(data.sales);
  return <section className={`${card} overflow-hidden`}><div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5"><SectionTitle icon={Medal} title="Bảng hiệu suất nhân viên" note="Xếp theo đơn hoàn thành, tiền đã thu và số cuộc gọi" /><span className="text-[10px] text-slate-400">{data.sales.length} nhân viên trong phạm vi</span></div><div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr>{["# / Nhân viên", "ITY", "Lead", "Đơn", "Hoàn thành", "Chuyển đổi", "Đã thu", "Giờ làm", "KPI MXH", "Quá hạn"].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody>{paging.items.map((person, index) => <tr key={person.id} className="border-t transition hover:bg-blue-50/30"><td className="px-4 py-3"><div className="flex items-center gap-3"><span className={`grid size-7 place-items-center rounded-lg text-[10px] font-bold ${index + paging.offset === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{index + paging.offset + 1}</span><div><b className="text-slate-900">{person.name}</b><p className="mt-0.5 text-[9px] text-slate-400">{person.extension ? `Ext. ${person.extension}` : "Chưa gán máy lẻ"}</p></div></div></td><td className="px-4 py-3"><b>{person.calls}</b><p className="text-[9px] text-slate-400">{person.answerRate}% nghe máy</p></td><td className="px-4 py-3"><b>{person.leads}</b><p className="text-[9px] text-slate-400">{person.interestedLeads} có nhu cầu</p></td><td className="px-4 py-3">{person.orders}</td><td className="px-4 py-3 font-bold text-emerald-600">{person.completed}</td><td className="px-4 py-3"><Rate value={person.conversionRate} /></td><td className="px-4 py-3 font-semibold">{money(person.collectedByCurrency, true)}</td><td className="px-4 py-3">{hours(person.workMinutes)}</td><td className="px-4 py-3"><b>{person.metSocialSessions}/{person.attendanceSessions} ca</b><p className="text-[9px] text-slate-400">{person.socialLeads} khách mới</p></td><td className="px-4 py-3"><span className={person.overdue ? "font-bold text-rose-600" : "text-emerald-600"}>{person.overdue}</span></td></tr>)}</tbody></table>{!data.sales.length && <Empty text="Không có nhân viên trong phạm vi đã chọn." />}</div>{paging.controls}</section>;
}

function PersonalPerformance({ person }: { person: Analytics["sales"][number] | undefined }) {
  if (!person) return <Empty text="Chưa có dữ liệu hiệu suất trong kỳ này." />;
  const groups = [
    { title: "ITY & chăm sóc", icon: Headphones, color: "blue", items: [["Cuộc gọi", person.calls], ["Kết nối", `${person.answerRate}%`], ["Lead mới", person.leads], ["Follow-up quá hạn", person.overdue]] },
    { title: "Kết quả kinh doanh", icon: Trophy, color: "emerald", items: [["Đơn mới", person.orders], ["Hoàn thành", person.completed], ["Thất bại", person.failed], ["Chuyển đổi", `${person.conversionRate}%`]] },
    { title: "Kỷ luật & hoạt động", icon: Clock3, color: "violet", items: [["Giờ làm", hours(person.workMinutes)], ["Ca đạt KPI MXH", person.metSocialSessions], ["Khách từ MXH", person.socialLeads], ["Bài bổ sung", person.penalties]] },
  ];
  return <div className="grid gap-4 lg:grid-cols-3">{groups.map((group) => <section key={group.title} className={`${card} p-4 sm:p-5`}><SectionTitle icon={group.icon} title={group.title} note="Kết quả cá nhân trong kỳ" /><div className="mt-4 grid grid-cols-2 gap-2">{group.items.map(([label, value]) => <Mini key={label} label={String(label)} value={String(value)} />)}</div></section>)}</div>;
}

function Operations({ data }: { data: Analytics }) {

 const paging=useListPagination(data.sources);
  const m = data.marketing;
  return <>
    <div className="grid gap-4 lg:grid-cols-3">
      <WorkCard icon={Flag} title="Chiến dịch truyền thông" color="blue" value={`${m.done}/${m.products}`} rate={m.campaignDoneRate} stats={[["Hoàn tất", m.done], ["Đang triển khai", Math.max(0, m.products - m.done)], ["Bài nộp phạt", m.penalties]]} href="/campaigns" />
      <WorkCard icon={UsersRound} title="Hội chợ & nguồn khách" color="amber" value={`${m.fairLeads} khách`} rate={m.fairWinRate} stats={[["Khách HOT", m.fairHot], ["Đơn tạo", m.fairOrders], ["Đơn win", m.fairWins]]} href="/trade-fairs" />
      <WorkCard icon={MessageSquareMore} title="KPI mạng xã hội" color="violet" value={`${m.metSessions}/${m.sessions} ca`} rate={m.socialCompletionRate} stats={[["Khách mới", m.socialLeads], ["Bình luận", m.comments], ["Đơn win", m.socialWins]]} href="/social-kpi" />
    </div>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className={`${card} overflow-hidden`}><div className="border-b p-4 sm:p-5"><SectionTitle icon={ArrowDownToLine} title="Hiệu quả theo nguồn khách" note="Nguồn nào tạo lead, đơn và doanh thu tốt nhất" /></div>{data.sources.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase text-slate-500"><tr>{["Nguồn", "Lead mới", "Đơn", "Hoàn thành", "Tỷ lệ", "Đã thu"].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{paging.items.map((source) => <tr key={source.source} className="border-t"><td className="px-4 py-3 font-bold text-slate-900">{leadSourceLabel(source.source)}</td><td className="px-4 py-3">{source.leads}</td><td className="px-4 py-3">{source.orders}</td><td className="px-4 py-3 font-bold text-emerald-600">{source.completed}</td><td className="px-4 py-3"><Rate value={source.conversionRate} /></td><td className="px-4 py-3 font-semibold">{source.collected ? money(source.collectedByCurrency, true) : "—"}</td></tr>)}</tbody></table></div> : <Empty text="Chưa có nguồn khách phát sinh trong kỳ." />}{paging.controls}</section>
      <section className={`${card} p-4 sm:p-5`}><SectionTitle icon={Target} title="Chất lượng đầu ra" note="Tín hiệu giúp đánh giá cơ hội thực" /><div className="mt-5 space-y-3"><Quality label="Lead hội chợ HOT" value={m.fairHot} total={m.fairLeads} color="bg-rose-500" /><Quality label="Khách tiềm năng từ MXH" value={m.socialLeads} total={m.socialQualified} color="bg-violet-500" /><Quality label="Ca MXH đạt KPI" value={m.metSessions} total={m.sessions} color="bg-emerald-500" /></div><div className="mt-5 rounded-xl bg-slate-50 p-3 text-[10px] leading-4 text-slate-500">Giá trị win từ MXH: <b className="text-slate-900">{number(m.socialWonValue)} đ</b>. Số liệu dựa trên đơn đã liên kết và trạng thái hoàn thành.</div></section>
    </div>
  </>;
}

function WorkCard({ icon: Icon, title, color, value, rate, stats, href }: { icon: LucideIcon; title: string; color: string; value: string; rate: number; stats: [string, number][]; href: string }) { return <section className={`${card} p-4 sm:p-5`}><div className="flex items-start justify-between"><SectionTitle icon={Icon} title={title} note="Tổng hợp trong kỳ" /><a href={href} aria-label={`Mở ${title}`} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-blue-600"><ArrowUpRight className="size-4" /></a></div><div className="mt-5 flex items-end justify-between"><div><p className="text-2xl font-bold text-slate-950">{value}</p><p className="mt-1 text-[10px] text-slate-500">Kết quả chính</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${tones[color]}`}>{rate}% đạt</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color === "blue" ? "bg-blue-500" : color === "amber" ? "bg-amber-500" : "bg-violet-500"}`} style={{ width: `${Math.min(100, rate)}%` }} /></div><div className="mt-4 grid grid-cols-3 gap-2">{stats.map(([label, count]) => <div key={label} className="rounded-xl bg-slate-50 p-2.5"><b className="text-sm">{count}</b><p className="mt-1 text-[9px] leading-3 text-slate-500">{label}</p></div>)}</div></section>; }
function Quality({ label, value, total, color }: { label: string; value: number; total: number; color: string }) { const rate = total ? Math.round(value / total * 100) : 0; return <div><div className="flex justify-between text-[11px]"><span className="text-slate-600">{label}</span><b>{value}/{total}</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${rate}%` }} /></div></div>; }

function Finance({ data }: { data: Analytics }) {

 const paging=useListPagination(data.sales);
  const k = data.kpis;
  return <>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <FinanceCard icon={WalletCards} label="Đã thu trong kỳ" value={money(k.collectedByCurrency)} note="Theo ngày xác nhận thanh toán" color="emerald" />
      <FinanceCard icon={ReceiptText} label="Giá trị đơn hoàn thành" value={money(k.completedByCurrency)} note={`${k.completed} đơn hoàn thành`} color="blue" />
      <FinanceCard icon={Landmark} label="Công nợ hiện tại" value={money(k.receivablesByCurrency)} note={`${k.upcomingInvoices} hóa đơn sắp hạn`} color="amber" />
      <FinanceCard icon={AlertCircle} label="Công nợ quá hạn" value={`${k.overdueInvoices} hóa đơn`} note="Cần ưu tiên thu hồi" color="rose" />
    </div>
    <section className={`${card} overflow-hidden`}><div className="border-b p-4 sm:p-5"><SectionTitle icon={Banknote} title={data.isManager ? "Giá trị thu theo nhân viên" : "Doanh thu cá nhân"} note="Tiền được ghi nhận theo thời điểm đơn xác nhận đã thu" /></div><div className="divide-y">{paging.items.map((person, index) => <div key={person.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(160px,1fr)_160px_120px_120px] sm:items-center"><div className="flex items-center gap-3"><span className={`grid size-8 place-items-center rounded-full text-[10px] font-bold ${index === 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{person.name.slice(0, 2).toUpperCase()}</span><div><b className="text-xs">{person.name}</b><p className="mt-0.5 text-[9px] text-slate-400">{person.completed} đơn hoàn thành</p></div></div><div><p className="text-[9px] text-slate-400">Đã thu</p><b className="text-xs text-emerald-700">{money(person.collectedByCurrency, true)}</b></div><div><p className="text-[9px] text-slate-400">Chuyển đổi</p><b className="text-xs">{person.conversionRate}%</b></div><div><p className="text-[9px] text-slate-400">Đơn fail</p><b className={person.failed ? "text-xs text-rose-600" : "text-xs text-slate-600"}>{person.failed}</b></div></div>)}{!data.sales.length && <Empty text="Chưa có dữ liệu doanh thu trong kỳ." />}</div>{paging.controls}</section>
  </>;
}
function FinanceCard({ icon: Icon, label, value, note, color }: { icon: LucideIcon; label: string; value: string; note: string; color: string }) { return <article className={`${card} min-w-0 p-4`}><span className={`grid size-9 place-items-center rounded-xl ${tones[color]}`}><Icon className="size-4" /></span><p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><b className="mt-1 block break-words text-base text-slate-950 sm:text-lg">{value}</b><p className="mt-1 text-[10px] leading-4 text-slate-500">{note}</p></article>; }
function Rate({ value }: { value: number }) { return <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${value >= 70 ? "bg-emerald-50 text-emerald-700" : value >= 40 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{value}%</span>; }
function Empty({ text }: { text: string }) { return <div className="px-5 py-12 text-center"><BarChart3 className="mx-auto size-8 text-slate-300" /><p className="mt-3 text-xs text-slate-500">{text}</p></div>; }
