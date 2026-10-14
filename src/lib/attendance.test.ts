import { describe, expect, it } from "vitest";
import { attendanceCallKpi, attendanceStatus, attendanceSummary, automaticCheckoutAt, canStartAttendanceSession, filterAttendanceRows, isRealItyCall, monthlyAttendanceSummary, shouldAutoCloseAttendance } from "./attendance";

const users = [
  { id: "u1", name: "Admin Quản Lý", role: "ADMIN", extension: "90933001", teamId: null },
  { id: "u2", name: "Nhân viên Sales 02", role: "SALES", extension: "90933002", teamId: "team-1" },
  { id: "u3", name: "Nhân viên Sales 03", role: "SALES", extension: "90933003", teamId: "team-1" },
];

const sessions = [
  { id: "a1", userId: "u1", checkIn: "2026-10-08T01:00:00.000Z", checkOut: "2026-10-08T09:00:00.000Z" },
  { id: "a2", userId: "u2", checkIn: "2026-10-08T02:00:00.000Z", checkOut: null },
];

describe("attendance dashboard", () => {
  it("excludes demo calls from the real ITY KPI", () => {
    expect(isRealItyCall({ callid: "demo-123" })).toBe(false);
    expect(isRealItyCall({ callid: "ity-123" })).toBe(true);
    expect(isRealItyCall({ callid: null })).toBe(false);
  });
  it("calculates the 40-call KPI and warns below target", () => {
    expect(attendanceCallKpi(12)).toEqual({ calls: 12, target: 40, percent: 30, reached: false, warning: true });
    expect(attendanceCallKpi(40).reached).toBe(true);
  });
  it("distinguishes completed, working, and missing employees", () => {
    expect(attendanceStatus(sessions.filter((item) => item.userId === "u1"))).toBe("DONE");
    expect(attendanceStatus(sessions.filter((item) => item.userId === "u2"))).toBe("WORKING");
    expect(attendanceStatus([])).toBe("MISSING");
  });

  it("auto closes an unfinished shift at 17:30 Vietnam time", () => {
    const session = { id: "late", userId: "u2", checkIn: "2026-10-08T01:00:00.000Z", checkOut: null };
    expect(automaticCheckoutAt(session.checkIn).toISOString()).toBe("2026-10-08T10:30:00.000Z");
    expect(shouldAutoCloseAttendance(session, new Date("2026-10-08T10:29:59.000Z"))).toBe(false);
    expect(shouldAutoCloseAttendance(session, new Date("2026-10-08T10:30:00.000Z"))).toBe(true);
  });

  it("keeps a shift started after 17:30 open for KPI tracking", () => {
    const session = { id: "late-start", userId: "u2", checkIn: "2026-10-08T12:38:00.000Z", checkOut: null };
    expect(shouldAutoCloseAttendance(session, new Date("2026-10-08T13:00:00.000Z"))).toBe(false);
  });

  it("allows another shift after the previous shift has closed", () => {
    expect(canStartAttendanceSession([])).toBe(true);
    expect(canStartAttendanceSession([{ id: "closed", userId: "u2", checkIn: "2026-10-08T01:00:00.000Z", checkOut: "2026-10-08T05:00:00.000Z" }])).toBe(true);
    expect(canStartAttendanceSession([{ id: "open", userId: "u2", checkIn: "2026-10-08T01:00:00.000Z", checkOut: null }])).toBe(false);
  });

  it("calculates admin KPI from unique employees", () => {
    expect(attendanceSummary(users, sessions)).toEqual({
      total: 3,
      checked: 2,
      missing: 1,
      working: 1,
      rate: 67,
    });
  });

  it("filters rows by keyword, role, and status", () => {
    const rows = filterAttendanceRows(users, sessions, {
      query: "sales 02",
      role: "SALES",
      status: "WORKING",
    });
    expect(rows.map((row) => row.user.id)).toEqual(["u2"]);
  });

  it("summarizes an employee month using Vietnam work hours", () => {
    const monthSessions = [
      { id: "d1", userId: "u2", checkIn: "2026-10-01T01:00:00.000Z", checkOut: "2026-10-01T10:30:00.000Z" },
      { id: "d2", userId: "u2", checkIn: "2026-10-02T01:12:00.000Z", checkOut: "2026-10-02T10:20:00.000Z" },
      { id: "d3", userId: "u2", checkIn: "2026-10-05T01:03:00.000Z", checkOut: "2026-10-05T09:30:00.000Z" },
      { id: "d4", userId: "u2", checkIn: "2026-10-08T01:00:00.000Z", checkOut: null },
    ];
    expect(monthlyAttendanceSummary(monthSessions, "2026-10-08")).toEqual({
      checkedDays: 4,
      lateDays: 1,
      earlyDays: 1,
      missingDays: 2,
      elapsedWorkdays: 6,
    });
  });
});
