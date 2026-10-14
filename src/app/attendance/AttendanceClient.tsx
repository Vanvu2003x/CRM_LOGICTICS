"use client";
import { useListPagination } from "@/hooks/use-list-pagination";

import type { Attendance } from "@prisma/client";
import type { PublicUser } from "@/lib/auth";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListFilter,
  LogIn,
  LogOut,
  Phone,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  attendanceMinutes,
  attendanceSummary,
  filterAttendanceRows,
  latestAttendance,
  type AttendanceStatus,
} from "@/lib/attendance";
import { checkIn, checkOut } from "./actions";

type AttendanceClientProps = {
  activeUser: PublicUser;
  users: PublicUser[];
  initialAttendances: Attendance[];
  selectedDate: string;
  today: string;
};

const time = (value: Date | string | null) => value
  ? new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })
  : "--:--";

const duration = (minutes: number) => minutes < 60 ? `${minutes} phút` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const statusCopy: Record<AttendanceStatus, { label: string; className: string }> = {
  MISSING: { label: "Chưa chấm công", className: "bg-rose-50 text-rose-600 ring-rose-100" },
  WORKING: { label: "Đang làm việc", className: "bg-amber-50 text-amber-700 ring-amber-100" },
  DONE: { label: "Đã hoàn thành", className: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
};

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const copy = statusCopy[status];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${copy.className}`}>{copy.label}</span>;
}

export default function AttendanceClient({ activeUser, users, initialAttendances, selectedDate, today }: AttendanceClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [view, setView] = useState<"LIST" | "STATS">("LIST");
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const summary = useMemo(() => attendanceSummary(users, initialAttendances), [users, initialAttendances]);
  const rows = useMemo(() => filterAttendanceRows(users, initialAttendances, { query, role, status }), [users, initialAttendances, query, role, status]);
  const paging=useListPagination(rows,selectedDate+query+role+status);
  const isToday = selectedDate === today;
  const dateLabel = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" })
    .format(new Date(`${selectedDate}T12:00:00+07:00`));

  async function runAction(userId: string, attendanceId?: string) {
    setLoadingUser(userId);
    const result = attendanceId ? await checkOut(attendanceId) : await checkIn(userId);
    setLoadingUser(null);
    toast({
      title: result.success ? (attendanceId ? "Đã kết thúc ca" : "Chấm công thành công") : "Không thể chấm công",
      description: result.success ? "Dữ liệu hôm nay đã được cập nhật." : result.error,
      variant: result.success ? "default" : "destructive",
    });
    if (result.success) router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Chấm Công <span className="font-semibold text-slate-400">(Attendance)</span></h1>
        <p className="mt-1 text-sm text-slate-500">{activeUser.role === "ADMIN" ? "Quản lý chấm công và theo dõi hoạt động làm việc trong ngày." : "Chấm công để bắt đầu ghi nhận KPI làm việc trong ngày."}</p>
      <section aria-label="Bộ lọc chấm công" className="mt-3 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:ml-auto lg:max-w-5xl lg:flex-row lg:flex-wrap lg:items-center">
        <label className="relative min-w-0 flex-1 lg:max-w-sm"><span className="sr-only">Tìm nhân viên</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên hoặc máy lẻ..." className="h-10 pl-9" /></label>
        <select aria-label="Lọc bộ phận" value={role} onChange={(event) => setRole(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"><option value="ALL">Tất cả bộ phận</option><option value="ADMIN">Quản trị</option><option value="MANAGER">Quản lý</option><option value="SALES">Sales</option></select>
        <select aria-label="Lọc trạng thái" value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"><option value="ALL">Tất cả trạng thái</option><option value="MISSING">Chưa chấm công</option><option value="WORKING">Đang làm việc</option><option value="DONE">Đã hoàn thành</option></select>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600"><CalendarDays className="size-4" /><span className="sr-only">Chọn ngày</span><input type="date" max={today} value={selectedDate} onChange={(event) => router.push(`/attendance?date=${event.target.value}`)} className="min-w-0 bg-transparent outline-none" /></label>
        <Button type="button" variant="outline" onClick={() => router.refresh()} className="h-10"><RefreshCw className="size-4" />Làm mới</Button>
        <div className="flex rounded-xl bg-slate-100 p-1 lg:ml-auto">
          <button type="button" aria-pressed={view === "LIST"} onClick={() => setView("LIST")} className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-xs font-semibold transition ${view === "LIST" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}><ListFilter className="size-4" />Danh sách</button>
          <button type="button" aria-pressed={view === "STATS"} onClick={() => setView("STATS")} className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-xs font-semibold transition ${view === "STATS" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}><BarChart3 className="size-4" />Thống kê</button>
        </div>
      </section>
      </header>

      <section className="crm-themed-hero relative overflow-hidden rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 p-4 shadow-sm sm:p-5">
        <div aria-hidden="true" className="absolute -right-16 -top-20 size-56 rounded-full bg-blue-200/40 blur-2xl" />
        <div className="relative grid gap-4 xl:grid-cols-[1.45fr_2.2fr] xl:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white bg-white/80 text-blue-600 shadow-sm"><CalendarDays className="size-7" /></span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold capitalize text-blue-950 sm:text-xl">{dateLabel}</p>
              <p className="mt-1 text-xs text-blue-800/70">Xin chào, {activeUser.name} 👋</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <Metric icon={CheckCircle2} value={summary.checked} label="Đã chấm công" detail={`/ ${summary.total} nhân viên`} tone="emerald" />
            <Metric icon={Clock3} value={summary.missing} label="Chưa chấm công" detail={`/ ${summary.total} nhân viên`} tone="blue" />
            <Metric icon={Users} value={summary.working} label="Đang làm việc" detail="Hôm nay" tone="amber" />
            <Metric icon={BarChart3} value={`${summary.rate}%`} label="Tỷ lệ chấm công" detail="Theo ngày đã chọn" tone="violet" />
          </div>
        </div>
      </section>

      {view === "LIST" ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-5"><h2 className="text-base font-bold text-slate-900">Danh sách nhân viên</h2><p className="mt-0.5 text-xs text-slate-500">Hiển thị {rows.length} / {users.length} nhân viên</p></div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[880px] text-left text-sm"><thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><tr><th className="w-14 px-5 py-3">#</th><th className="px-4 py-3">Nhân viên</th><th className="px-4 py-3">Bộ phận</th><th className="px-4 py-3">Máy lẻ</th><th className="px-4 py-3">Giờ chấm công</th><th className="px-4 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{paging.items.map((row, index) => <AttendanceRow key={row.user.id} index={index+paging.offset} row={row} activeUser={activeUser} isToday={isToday} loading={loadingUser === row.user.id} onAction={runAction} />)}</tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-100 md:hidden">{paging.items.map((row) => <AttendanceCard key={row.user.id} row={row} activeUser={activeUser} isToday={isToday} loading={loadingUser === row.user.id} onAction={runAction} />)}</div>
          {paging.controls}
          {!rows.length && <div role="status" className="px-5 py-14 text-center"><Search className="mx-auto mb-3 size-8 text-slate-300" /><p className="text-sm font-medium text-slate-700">Không tìm thấy nhân viên phù hợp</p><p className="mt-1 text-xs text-slate-500">Thử đổi từ khóa hoặc bộ lọc trạng thái.</p></div>}
        </section>
      ) : <AttendanceStats summary={summary} />}
    </div>
  );
}

function Metric({ icon: Icon, value, label, detail, tone }: { icon: typeof Clock3; value: number | string; label: string; detail: string; tone: "emerald" | "blue" | "amber" | "violet" }) {
  const colors = { emerald: "bg-emerald-100 text-emerald-700", blue: "bg-blue-100 text-blue-700", amber: "bg-amber-100 text-amber-700", violet: "bg-violet-100 text-violet-700" };
  return <article className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/90 bg-white/85 p-3 shadow-sm"><span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${colors[tone]}`}><Icon className="size-5" /></span><div className="min-w-0"><p className="text-lg font-bold tabular-nums text-slate-950">{value}</p><p className="truncate text-[11px] font-semibold text-slate-700">{label}</p><p className="truncate text-[10px] text-slate-400">{detail}</p></div></article>;
}

type Row = ReturnType<typeof filterAttendanceRows>[number];
type ActionProps = { row: Row; activeUser: PublicUser; isToday: boolean; loading: boolean; onAction: (userId: string, attendanceId?: string) => void };

function Avatar({ user }: { user: PublicUser }) {
  const initials = user.name.split(" ").map((part) => part[0]).slice(-2).join("").toUpperCase();
  return <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700 ring-1 ring-blue-100">{initials}</span>;
}

function AttendanceAction({ row, activeUser, isToday, loading, onAction }: ActionProps) {
  const open = row.sessions.find((session) => !session.checkOut);
  const allowed = isToday && (activeUser.role === "ADMIN" || activeUser.id === row.user.id);
  if (!allowed) return <span className="text-xs text-slate-400">Chỉ xem</span>;
  return open
    ? <Button size="sm" variant="outline" disabled={loading} onClick={() => onAction(row.user.id, open.id)} className="border-rose-200 text-rose-600 hover:bg-rose-50"><LogOut className="size-3.5" />{loading ? "Đang lưu..." : "Kết thúc ca"}</Button>
    : <Button size="sm" disabled={loading} onClick={() => onAction(row.user.id)} className="bg-emerald-600 text-white hover:bg-emerald-700"><LogIn className="size-3.5" />{loading ? "Đang lưu..." : row.sessions.length ? "Ca tiếp theo" : "Chấm công"}</Button>;
}

function AttendanceRow({ row, index, ...props }: ActionProps & { index: number }) {
  const latest = latestAttendance(row.sessions);
  return <tr className="hover:bg-slate-50/70"><td className="px-5 py-3 text-xs text-slate-400">{index + 1}</td><td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar user={row.user as PublicUser} /><div><p className="font-semibold text-slate-900">{row.user.name}</p><p className="text-[11px] text-slate-400">Ext: {row.user.extension || "Chưa gán"}</p></div></div></td><td className="px-4 py-3"><span className={`rounded-md px-2 py-1 text-[10px] font-bold ${row.user.role === "ADMIN" ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-600"}`}>{row.user.role}</span></td><td className="px-4 py-3 text-xs text-slate-600"><span className="flex items-center gap-2"><Phone className="size-3.5 text-slate-400" />{row.user.extension || "—"}</span></td><td className="px-4 py-3"><p className="font-medium tabular-nums text-slate-700">{latest ? `${time(latest.checkIn)} – ${time(latest.checkOut)}` : "--:--"}</p><p className="mt-0.5 text-[10px] text-slate-400">{latest ? duration(attendanceMinutes(row.sessions)) : "Chưa có dữ liệu"}</p></td><td className="px-4 py-3"><StatusBadge status={row.status} /></td><td className="px-5 py-3 text-right"><AttendanceAction row={row} {...props} /></td></tr>;
}

function AttendanceCard({ row, ...props }: ActionProps) {
  const latest = latestAttendance(row.sessions);
  return <article className="space-y-3 p-4"><div className="flex items-start gap-3"><Avatar user={row.user as PublicUser} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{row.user.name}</p><p className="text-xs text-slate-400">{row.user.role} • Ext {row.user.extension || "—"}</p></div><StatusBadge status={row.status} /></div><div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"><span className="text-slate-500">Giờ làm việc</span><span className="font-semibold tabular-nums text-slate-700">{latest ? `${time(latest.checkIn)} – ${time(latest.checkOut)}` : "Chưa có dữ liệu"}</span></div><div className="flex justify-end"><AttendanceAction row={row} {...props} /></div></article>;
}

function AttendanceStats({ summary }: { summary: ReturnType<typeof attendanceSummary> }) {
  const items = [{ label: "Đã chấm công", value: summary.checked, color: "bg-emerald-500" }, { label: "Đang làm việc", value: summary.working, color: "bg-amber-500" }, { label: "Chưa chấm công", value: summary.missing, color: "bg-rose-400" }];
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5"><h2 className="text-base font-bold text-slate-900">Thống kê trong ngày</h2><p className="mt-1 text-xs text-slate-500">Tổng hợp trên {summary.total} nhân viên thuộc phạm vi quản lý.</p></div><div className="space-y-5">{items.map((item) => <div key={item.label}><div className="mb-2 flex justify-between text-sm"><span className="font-medium text-slate-700">{item.label}</span><span className="font-bold tabular-nums text-slate-900">{item.value}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${summary.total ? Math.round(item.value / summary.total * 100) : 0}%` }} /></div></div>)}</div></section>;
}
