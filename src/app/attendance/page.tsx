import { requireUser, permittedUserIds, publicUserSelect } from "@/lib/auth";
import { periodBounds } from "@/lib/business-rules";
import { todayInVietnam } from "@/lib/dashboard";
import { db } from "@/lib/db";
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
      where: { ...(ids ? { salesId: { in: ids } } : {}), startedAt: { gte: range.start, lt: range.end } },
      select: { salesId: true },
    }),
  ]);
  const callCounts = calls.reduce<Record<string, number>>((result, call) => {
    if (call.salesId) result[call.salesId] = (result[call.salesId] || 0) + 1;
    return result;
  }, {});

  if (employeeView) return (
    <EmployeeAttendanceClient
      activeUser={activeUser}
      initialAttendances={attendances}
      today={today}
    />
  );

  return (
    <AttendanceClient
      activeUser={activeUser}
      users={users}
      initialAttendances={attendances}
      callCounts={callCounts}
      selectedDate={selectedDate}
      today={today}
    />
  );
}
