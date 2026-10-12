export type AttendanceStatus = "MISSING" | "WORKING" | "DONE";

export type AttendanceUser = {
  id: string;
  name: string;
  role: string;
  extension: string | null;
  teamId: string | null;
};

export type AttendanceSession = {
  id: string;
  userId: string;
  checkIn: Date | string;
  checkOut: Date | string | null;
};

export function attendanceStatus(sessions: AttendanceSession[]): AttendanceStatus {
  if (sessions.some((session) => !session.checkOut)) return "WORKING";
  return sessions.length ? "DONE" : "MISSING";
}

export function canStartAttendanceSession(sessions: AttendanceSession[]) {
  return !sessions.some(session => !session.checkOut);
}

export function latestAttendance(sessions: AttendanceSession[]) {
  return [...sessions].sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())[0] ?? null;
}

export function automaticCheckoutAt(checkIn: Date | string) {
  const day = attendanceDay(checkIn);
  return new Date(`${day}T17:30:00+07:00`);
}

export function shouldAutoCloseAttendance(session: AttendanceSession, now = new Date()) {
  const cutoff = automaticCheckoutAt(session.checkIn);
  // A late check-in must stay open; otherwise opening KPI after 17:30
  // would immediately close the newly created session.
  return !session.checkOut && new Date(session.checkIn).getTime() < cutoff.getTime() && now.getTime() >= cutoff.getTime();
}

export function attendanceMinutes(sessions: AttendanceSession[], now = new Date()) {
  return sessions.reduce((total, session) => {
    const start = new Date(session.checkIn).getTime();
    const end = session.checkOut ? new Date(session.checkOut).getTime() : now.getTime();
    return total + Math.max(0, Math.floor((end - start) / 60000));
  }, 0);
}

export function attendanceSummary(users: AttendanceUser[], sessions: AttendanceSession[]) {
  const checkedIds = new Set(sessions.map((session) => session.userId));
  const workingIds = new Set(sessions.filter((session) => !session.checkOut).map((session) => session.userId));
  const total = users.length;
  const checked = users.filter((user) => checkedIds.has(user.id)).length;
  const working = users.filter((user) => workingIds.has(user.id)).length;
  return {
    total,
    checked,
    missing: Math.max(0, total - checked),
    working,
    rate: total ? Math.round((checked / total) * 100) : 0,
  };
}

export function filterAttendanceRows(
  users: AttendanceUser[],
  sessions: AttendanceSession[],
  filters: { query: string; role: string; status: string },
) {
  const normalized = filters.query.trim().toLocaleLowerCase("vi-VN");
  return users.flatMap((user) => {
    const ownSessions = sessions.filter((session) => session.userId === user.id);
    const status = attendanceStatus(ownSessions);
    const matchesQuery = !normalized || [user.name, user.extension ?? ""]
      .some((value) => value.toLocaleLowerCase("vi-VN").includes(normalized));
    const matchesRole = filters.role === "ALL" || user.role === filters.role;
    const matchesStatus = filters.status === "ALL" || status === filters.status;
    return matchesQuery && matchesRole && matchesStatus ? [{ user, sessions: ownSessions, status }] : [];
  });
}

const vietnamDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" });
const vietnamTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export function attendanceDay(value: Date | string) {
  return vietnamDate.format(new Date(value));
}

function minuteOfDay(value: Date | string) {
  const parts = vietnamTime.formatToParts(new Date(value));
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function isLateAttendance(session: AttendanceSession) {
  return minuteOfDay(session.checkIn) > 8 * 60 + 5;
}

export function isEarlyAttendance(session: AttendanceSession) {
  return Boolean(session.checkOut && minuteOfDay(session.checkOut) < 17 * 60);
}

function elapsedWeekdays(month: string, today: string) {
  const last = Math.min(Number(today.slice(8, 10)), new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate());
  let count = 0;
  for (let day = 1; day <= last; day += 1) {
    const weekday = new Date(`${month}-${String(day).padStart(2, "0")}T00:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6) count += 1;
  }
  return count;
}

export function monthlyAttendanceSummary(sessions: AttendanceSession[], today: string) {
  const month = today.slice(0, 7);
  const ownMonth = sessions.filter((session) => attendanceDay(session.checkIn).startsWith(month));
  const checkedDays = new Set(ownMonth.map((session) => attendanceDay(session.checkIn))).size;
  const lateDays = new Set(ownMonth.filter(isLateAttendance).map((session) => attendanceDay(session.checkIn))).size;
  const earlyDays = new Set(ownMonth.filter(isEarlyAttendance).map((session) => attendanceDay(session.checkIn))).size;
  const workdays = elapsedWeekdays(month, today);
  return { checkedDays, lateDays, earlyDays, missingDays: Math.max(0, workdays - checkedDays), elapsedWorkdays: workdays };
}
