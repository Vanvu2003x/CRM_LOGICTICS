import { requireUser, permittedUserIds, publicUserSelect } from "@/lib/auth";
import { periodBounds } from "@/lib/business-rules";
import { todayInVietnam } from "@/lib/dashboard";
import { db } from "@/lib/db";
import { ATTENDANCE_CALL_TARGET, attendanceMinutes, isAttendanceCounted } from "@/lib/attendance";
import AttendanceClient from "./AttendanceClient";
import EmployeeAttendanceClient from "./EmployeeAttendanceClient";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const activeUser = await requireUser();
  const ids = await permittedUserIds(activeUser);
  const today = todayInVietnam();
  const requestedDate = (await searchParams).date;
  const selectedDate = requestedDate && datePattern.test(requestedDate) ? requestedDate : today;
  const employeeView = activeUser.role === "SALES";
  const range = periodBounds(employeeView ? today : selectedDate, employeeView ? "month" : "day");
  const callRange = employeeView ? periodBounds(today, "day") : range;
  const dayFilter = { OR: [{ date: { gte: range.start, lt: range.end } }, { checkIn: { gte: range.start, lt: range.end } }] };

  const [users, attendances, calls] = await Promise.all([
    db.user.findMany({
      where: ids ? { id: { in: ids } } : {},
      select: publicUserSelect,
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
    db.attendance.findMany({
      where: {
        ...(ids ? { userId: { in: ids } } : {}),
        ...(employeeView ? { OR: [{ date: { gte: range.start, lt: range.end } }, { checkIn: { gte: range.start, lt: range.end } }] } : dayFilter),
      },
      orderBy: { checkIn: "asc" },
    }),
    db.callLog.findMany({
      where: { ...(ids ? { salesId: { in: ids } } : {}), callid: { not: { startsWith: "demo-" } }, startedAt: { gte: callRange.start, lt: callRange.end } },
      select: { salesId: true, callid: true },
    }),
  ]);
  const callCounts = calls.reduce<Record<string, number>>((result, call) => {
    if (call.salesId) result[call.salesId] = (result[call.salesId] || 0) + 1;
    return result;
  }, {});

  const monthlySummary = [] as { userId: string; name: string; shifts: number; workMinutes: number; kpiShifts: number; kpiRate: number }[];
  if (!employeeView) {
    const monthRange = periodBounds(selectedDate, "month");
    const [monthSessions, monthCalls] = await Promise.all([
      db.attendance.findMany({ where: { ...(ids ? { userId: { in: ids } } : {}), OR: [{ date: { gte: monthRange.start, lt: monthRange.end } }, { checkIn: { gte: monthRange.start, lt: monthRange.end } }] }, orderBy: { checkIn: "asc" } }),
      db.callLog.findMany({ where: { ...(ids ? { salesId: { in: ids } } : {}), callid: { not: { startsWith: "demo-" } }, startedAt: { gte: monthRange.start, lt: monthRange.end } }, select: { salesId: true, startedAt: true } }),
    ]);
    for (const user of users) {
      const sessions = monthSessions.filter(session => session.userId === user.id && isAttendanceCounted(session));
      const kpiShifts = sessions.filter(session => monthCalls.filter(call => call.salesId === user.id && call.startedAt >= session.checkIn && call.startedAt <= (session.checkOut || new Date())).length >= ATTENDANCE_CALL_TARGET).length;
      monthlySummary.push({ userId: user.id, name: user.name, shifts: sessions.length, workMinutes: attendanceMinutes(sessions), kpiShifts, kpiRate: sessions.length ? Math.round(kpiShifts / sessions.length * 100) : 0 });
    }
  }

  if (employeeView) return (
    <EmployeeAttendanceClient
      activeUser={activeUser}
      initialAttendances={attendances}
      today={today}
      callCount={callCounts[activeUser.id] || 0}
    />
  );

  return (
    <AttendanceClient
      activeUser={activeUser}
      users={users}
      initialAttendances={attendances}
      callCounts={callCounts}
      monthlySummary={monthlySummary}
      selectedDate={selectedDate}
      today={today}
    />
  );
}
