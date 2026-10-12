const DAY = 86_400_000;

export type FairSession = "NONE" | "MORNING" | "AFTERNOON" | "BOTH";

export function toggleFairSession(current: FairSession, slot: "MORNING" | "AFTERNOON"): FairSession {
  if (current === "NONE") return slot;
  if (current === slot) return "NONE";
  if (current === "BOTH") return slot === "MORNING" ? "AFTERNOON" : "MORNING";
  return "BOTH";
}

function vietnamDay(value: Date | string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function canChangeTradeFairSession(day: Date | string | null, now = new Date()) {
  return Boolean(day && vietnamDay(now) < vietnamDay(day));
}

export function fairReportDeadline(day: Date) {
  const localDay = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(day);
  const start = new Date(`${localDay}T00:00:00+07:00`);
  return new Date(start.getTime() + 2 * DAY - 1);
}

export function fairPenaltyData(
  participation: { id: string; fairId: string; userId: string },
  campaignId: string,
  fairName: string,
  due: Date,
  lateDay: number,
) {
  return {
    campaignId,
    userId: participation.userId,
    type: "PENALTY",
    step: "PRODUCT_DRAFT",
    contentType: "POST",
    contentPillar: "OTHER",
    penaltyKey: `fair:${participation.id}:${lateDay}`,
    parentId: participation.id,
    title: `Bài phạt hội chợ ngày trễ thứ ${lateDay}`,
    deadline: new Date(due.getTime() + (lateDay + 1) * DAY),
    requirements: "1 bài truyền thông phạt",
    notes: `Phạt do chậm nộp link truyền thông sau hội chợ ${fairName}`,
  };
}
