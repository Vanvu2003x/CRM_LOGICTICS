"use client";
import { useListPagination } from "@/hooks/use-list-pagination";

import type { Attendance } from "@prisma/client";
import type { PublicUser } from "@/lib/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  LogIn,
  LogOut,
  MapPin,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ATTENDANCE_CALL_TARGET,
  attendanceDay,
  attendanceMinutes,
  canStartAttendanceSession,
  isEarlyAttendance,
  isLateAttendance,
  monthlyAttendanceSummary,
} from "@/lib/attendance";
import { checkIn, checkOut } from "./actions";

type Props = { activeUser: PublicUser; initialAttendances: Attendance[]; today: string; callCount: number };
type Geo = { latitude: number; longitude: number; accuracy: number };

const time = (value: Date | string | null) => value ? new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }) : "--:--";
const longDate = (day: string) => new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(`${day}T12:00:00+07:00`));
const duration = (minutes: number) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;

function sessionStatus(session: Attendance) {
  if (!session.checkOut) return { label: "Đang làm việc", style: "bg-emerald-50 text-emerald-700" };
  if (session.closeType === "MANUAL_NOT_COUNTED") return { label: "Không tính công", style: "bg-rose-50 text-rose-600" };
  if (session.closeType === "AUTO_END_OF_DAY") return { label: "Hệ thống đóng ca", style: "bg-blue-50 text-blue-700" };
  if (isEarlyAttendance(session)) return { label: "Về sớm", style: "bg-rose-50 text-rose-600" };
  if (isLateAttendance(session)) return { label: "Đi muộn", style: "bg-amber-50 text-amber-700" };
  return { label: "Đúng giờ", style: "bg-emerald-50 text-emerald-700" };
}

export default function EmployeeAttendanceClient({ activeUser, initialAttendances, today, callCount }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const historyRef = useRef<HTMLElement>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [geo, setGeo] = useState<Geo | null>(null);
  const [geoError, setGeoError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"CLOCK" | "OVERVIEW">("CLOCK");
  const [historyStatus, setHistoryStatus] = useState("ALL");

  useEffect(() => {
    const kickoff = setTimeout(() => setNow(new Date()), 0);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      const unavailable = setTimeout(() => setGeoError("Trình duyệt không hỗ trợ định vị."), 0);
      return () => clearTimeout(unavailable);
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setGeo({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
      () => setGeoError("Chưa cấp quyền truy cập vị trí."),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const monthSummary = useMemo(() => monthlyAttendanceSummary(initialAttendances, today), [initialAttendances, today]);
  const todaySessions = initialAttendances.filter((session) => attendanceDay(session.checkIn) === today);
  const openSession = todaySessions.find((session) => !session.checkOut);
  const canStartSession = canStartAttendanceSession(todaySessions);
  const filteredHistory = [...initialAttendances].reverse().filter((session) => historyStatus === "ALL" || sessionStatus(session).label === historyStatus);

  const paging=useListPagination(filteredHistory,historyStatus+today);
  async function record(kind: "IN" | "OUT", forceWithoutAttendance = false) {
    if (kind === "OUT" && callCount < ATTENDANCE_CALL_TARGET && !forceWithoutAttendance) {
      const confirmed = window.confirm(`Hôm nay mới có ${callCount}/${ATTENDANCE_CALL_TARGET} cuộc gọi ITY thật. Nếu vẫn đóng ca thì sẽ KHÔNG được tính công. Bạn vẫn muốn đóng ca không?`);
      if (!confirmed) return;
      return record("OUT", true);
    }
    setLoading(true);
    const result = kind === "IN" ? await checkIn(activeUser.id, geo ?? undefined) : await checkOut(openSession!.id, geo ?? undefined, forceWithoutAttendance);
    setLoading(false);
    toast({ title: result.success ? (kind === "IN" ? "Đã chấm công vào" : forceWithoutAttendance ? "Đã đóng ca, không tính công" : "Đã chấm công ra") : "Không thể chấm công", description: result.success ? (forceWithoutAttendance ? "Ca đã đóng nhưng không được tính công vì chưa đủ 40 cuộc gọi ITY thật." : "Thời gian và vị trí đã được ghi nhận.") : result.error, variant: result.success ? "default" : "destructive" });
    if (result.success) router.refresh();
  }

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const rows = initialAttendances.map((session) => ({
      "Ngày": attendanceDay(session.checkIn),
      "Giờ vào": time(session.checkIn),
      "Giờ ra": time(session.checkOut),
      "Tổng giờ làm": session.checkOut ? duration(attendanceMinutes([session])) : "Đang làm việc",
      "Trạng thái": sessionStatus(session).label,
      "Vĩ độ": session.checkInLatitude ?? "",
      "Kinh độ": session.checkInLongitude ?? "",
      "Độ chính xác (m)": session.checkInAccuracy ? Math.round(session.checkInAccuracy) : "",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet["!cols"] = [{ wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 18 }];
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Cham cong");
    XLSX.writeFile(book, `cham-cong-${activeUser.name.replace(/\s+/g, "-").toLowerCase()}-${today.slice(0, 7)}.xlsx`);
  }

  return <div className="mx-auto w-full max-w-[1500px] space-y-4">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Chấm công</h1><p className="mt-1 text-sm text-slate-500">Ghi nhận thời gian làm việc, hỗ trợ tính KPI và quản lý hoạt động cá nhân.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => historyRef.current?.scrollIntoView({ behavior: "smooth" })}><RefreshCw className="size-4" />Lịch sử chấm công</Button><Button variant="outline" onClick={() => setTab("OVERVIEW")}><Settings2 className="size-4" />Quy định chấm công</Button></div>
    </header>

    <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 text-slate-600"><CalendarDays className="size-5 text-blue-600" /><p className="text-sm font-semibold capitalize">{longDate(today)}</p></div>
        <p className="my-4 text-center text-4xl font-bold tabular-nums tracking-tight text-blue-950 sm:text-5xl">{now ? now.toLocaleTimeString("vi-VN", { hour12: false, timeZone: "Asia/Ho_Chi_Minh" }) : "--:--:--"}</p>
        <div className="flex justify-center"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${openSession ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><span className={`size-2 rounded-full ${openSession ? "bg-emerald-500" : "bg-slate-400"}`} />{openSession ? "Đang trong giờ làm việc" : todaySessions.length ? `Đã hoàn thành ${todaySessions.length} ca hôm nay` : "Chưa bắt đầu làm việc"}</span></div>
        <div className="mt-5 space-y-4 border-t pt-4 text-sm"><div className="flex gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-blue-900" /><div><p className="text-slate-500">Vị trí hiện tại</p><p className="mt-0.5 font-medium text-slate-700">{geo ? `${geo.latitude.toFixed(6)}, ${geo.longitude.toFixed(6)}` : geoError || "Đang xác định vị trí..."}</p></div></div><div className="flex gap-3"><Settings2 className="mt-0.5 size-5 shrink-0 text-blue-900" /><div><p className="text-slate-500">Độ chính xác</p><p className="mt-0.5 font-medium text-slate-700">{geo ? `${Math.round(geo.accuracy)} m` : "—"}</p></div></div></div>
      </section>

      <section className="relative min-h-72 overflow-hidden rounded-2xl border border-blue-100 bg-[#eef5fb] shadow-sm">
        <div aria-hidden="true" className="absolute inset-0 opacity-70 [background-image:linear-gradient(#cbdced_1px,transparent_1px),linear-gradient(90deg,#cbdced_1px,transparent_1px)] [background-size:44px_44px]" />
        <div aria-hidden="true" className="absolute left-[15%] top-[12%] h-[75%] w-8 rotate-[28deg] bg-white/80 shadow-sm" /><div aria-hidden="true" className="absolute right-[22%] top-[-10%] h-[120%] w-10 -rotate-[35deg] bg-white/80 shadow-sm" />
        <span className={`absolute left-4 top-4 z-10 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${geo ? "bg-emerald-50 text-emerald-700" : "bg-white text-slate-500"}`}>{geo ? "Bạn đang ở vị trí đã xác định" : "Đang chờ quyền vị trí"}</span>
        <div className="absolute left-1/2 top-1/2 size-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400 bg-blue-200/30"><span className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-lg"><MapPin className="size-5" /></span><span className="absolute left-1/2 top-[63%] -translate-x-1/2 whitespace-nowrap rounded-md bg-white/90 px-2 py-1 text-[11px] font-bold text-blue-900 shadow">Logistics CRM</span></div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-2 border-b bg-slate-50"><button onClick={() => setTab("CLOCK")} className={`h-11 text-xs font-semibold ${tab === "CLOCK" ? "border-b-2 border-blue-600 bg-white text-blue-900" : "text-slate-500"}`}>Chấm công</button><button onClick={() => setTab("OVERVIEW")} className={`h-11 text-xs font-semibold ${tab === "OVERVIEW" ? "border-b-2 border-blue-600 bg-white text-blue-900" : "text-slate-500"}`}>Tổng quan</button></div>
        {tab === "CLOCK" ? <div className="space-y-3 p-5"><div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${callCount >= ATTENDANCE_CALL_TARGET ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>Cuộc gọi ITY thật hôm nay: {callCount}/{ATTENDANCE_CALL_TARGET}{callCount < ATTENDANCE_CALL_TARGET && <span className="ml-1 font-normal">· Chưa đủ để kết thúc ca</span>}</div><Button disabled={!canStartSession || loading} onClick={() => void record("IN")} className="h-16 w-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70"><LogIn className="size-5" /><span>{openSession ? <>Đang làm việc<br /><b>{time(openSession.checkIn)}</b></> : todaySessions.length ? "Bắt đầu ca mới" : "Chấm công vào"}</span></Button><Button disabled={!openSession || loading} onClick={() => void record("OUT")} variant="outline" className="h-14 w-full"><LogOut className="size-5" />{loading ? "Đang ghi nhận..." : openSession ? "Chấm công ra" : "Chưa có ca đang mở"}</Button><p className="pt-1 text-xs leading-5 text-slate-500">{openSession ? `Bạn đã bắt đầu ca lúc ${time(openSession.checkIn)}. Hãy chấm công ra khi kết thúc ca.` : todaySessions.length ? "Ca trước đã kết thúc. Bạn có thể bắt đầu ca làm tiếp theo." : "Hãy bật quyền vị trí và chấm công khi bắt đầu ca làm việc."}</p></div> : <div className="space-y-3 p-5 text-xs leading-5 text-slate-600"><p><b>Giờ làm việc:</b> 08:00–17:30.</p><p><b>Đi muộn:</b> chấm công sau 08:05.</p><p><b>Về sớm:</b> chấm công ra trước 17:00.</p><p>Có thể mở ca mới sau khi ca trước đã đóng. Vị trí GPS được ghi nhận để đối chiếu khi cần.</p></div>}
      </section>
    </div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SummaryCard icon={CheckCircle2} tone="emerald" label="Đã chấm công" value={`${monthSummary.checkedDays} ngày`} detail={`/ ${monthSummary.elapsedWorkdays} ngày làm việc`} />
      <SummaryCard icon={Clock3} tone="blue" label="Đi muộn" value={`${monthSummary.lateDays} ngày`} />
      <SummaryCard icon={LogOut} tone="rose" label="Về sớm" value={`${monthSummary.earlyDays} ngày`} />
      <SummaryCard icon={CalendarDays} tone="violet" label="Chưa chấm công" value={`${monthSummary.missingDays} ngày`} />
    </div>

    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section ref={historyRef} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">Lịch sử chấm công</h2><p className="mt-0.5 text-xs text-slate-500">Tháng {today.slice(5, 7)}/{today.slice(0, 4)}</p></div><div className="flex gap-2"><select aria-label="Lọc lịch sử" value={historyStatus} onChange={(event) => setHistoryStatus(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs"><option value="ALL">Tất cả trạng thái</option><option>Đúng giờ</option><option>Đi muộn</option><option>Về sớm</option><option>Đang làm việc</option></select><Button variant="outline" size="sm" onClick={() => void exportExcel()}><Download className="size-4" />Xuất Excel</Button></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">Ngày</th><th className="px-4 py-3">Giờ vào</th><th className="px-4 py-3">Giờ ra</th><th className="px-4 py-3">Tổng giờ làm</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Vị trí chấm công</th></tr></thead><tbody className="divide-y divide-slate-100">{paging.items.map((session) => { const status = sessionStatus(session); return <tr key={session.id}><td className="px-4 py-3 font-semibold text-slate-800">{attendanceDay(session.checkIn)}</td><td className="px-4 py-3 tabular-nums">{time(session.checkIn)}</td><td className="px-4 py-3 tabular-nums">{time(session.checkOut)}</td><td className="px-4 py-3">{session.checkOut ? duration(attendanceMinutes([session])) : "—"}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 font-semibold ${status.style}`}>{status.label}</span></td><td className="px-4 py-3 text-slate-500">{session.checkInLatitude != null ? <span className="flex items-center gap-1"><MapPin className="size-3.5" />GPS · {Math.round(session.checkInAccuracy || 0)}m</span> : "Không có vị trí"}</td></tr>; })}</tbody></table></div>
        {paging.controls}
        {!filteredHistory.length && <p className="p-10 text-center text-sm text-slate-500">Chưa có dữ liệu chấm công trong tháng này.</p>}
      </section>
      <MonthCalendar sessions={initialAttendances} today={today} />
    </div>
  </div>;
}

function SummaryCard({ icon: Icon, tone, label, value, detail }: { icon: typeof Clock3; tone: "emerald" | "blue" | "rose" | "violet"; label: string; value: string; detail?: string }) {
  const colors = { emerald: "bg-emerald-100 text-emerald-700", blue: "bg-blue-100 text-blue-700", rose: "bg-rose-100 text-rose-600", violet: "bg-violet-100 text-violet-700" };
  return <article className="flex min-h-28 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${colors[tone]}`}><Icon className="size-5" /></span><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold text-slate-950">{value}</p>{detail ? <p className="mt-1 text-[10px] text-slate-400">{detail}</p> : <button onClick={() => document.querySelector("table")?.scrollIntoView({ behavior: "smooth" })} className="mt-1 flex items-center gap-1 text-[10px] text-blue-600">Chi tiết <ArrowRight className="size-3" /></button>}</div></article>;
}

function MonthCalendar({ sessions, today }: { sessions: Attendance[]; today: string }) {
  const year = Number(today.slice(0, 4)), month = Number(today.slice(5, 7));
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, index) => index - offset + 1);
  const byDay = new Map(sessions.map((session) => [attendanceDay(session.checkIn), session]));
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-slate-900">Tháng {month}, {year}</h2><CalendarDays className="size-5 text-blue-600" /></div><div className="grid grid-cols-7 gap-y-2 text-center text-[11px]"><>{["T2","T3","T4","T5","T6","T7","CN"].map((day) => <b key={day} className="pb-1 text-slate-500">{day}</b>)}</>{cells.map((day, index) => { if (day < 1 || day > count) return <span key={index} />; const key = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`; const session = byDay.get(key); const dot = session ? isEarlyAttendance(session) ? "bg-rose-500" : isLateAttendance(session) ? "bg-amber-500" : "bg-emerald-500" : key < today && ![0,6].includes(new Date(`${key}T00:00:00Z`).getUTCDay()) ? "bg-slate-300" : ""; return <span key={key} className={`relative mx-auto flex size-8 items-center justify-center rounded-full font-medium ${key === today ? "bg-blue-600 text-white" : "text-slate-700"}`}>{day}{dot && <i className={`absolute bottom-0.5 size-1 rounded-full ${key === today ? "bg-white" : dot}`} />}</span>; })}</div><div className="mt-5 grid grid-cols-2 gap-2 text-[10px] text-slate-500"><Legend color="bg-emerald-500" label="Đã chấm công" /><Legend color="bg-amber-500" label="Đi muộn" /><Legend color="bg-rose-500" label="Về sớm" /><Legend color="bg-slate-300" label="Chưa chấm công" /></div></section>;
}

function Legend({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-2"><i className={`size-2 rounded-full ${color}`} />{label}</span>; }
