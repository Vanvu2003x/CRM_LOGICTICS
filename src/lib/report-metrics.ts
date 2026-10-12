export function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export function attendanceMinutes(
  sessions: { checkIn: Date; checkOut: Date | null }[],
  now = new Date(),
) {
  return sessions.reduce((total, session) => {
    const end = session.checkOut ?? now;
    const minutes = Math.max(0, (end.getTime() - session.checkIn.getTime()) / 60_000);
    return total + Math.min(minutes, 24 * 60);
  }, 0);
}

export function uniqueById<T extends { id: string }>(items: T[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}
