export type CampaignDeadlineState = "ACTIVE" | "DUE_SOON" | "OVERDUE" | "DONE_ON_TIME" | "DONE_LATE";

type DeadlineRecord = {
  deadline: Date | string;
  step: string;
  completedAt?: Date | string | null;
};

export function campaignDeadlineState(item: DeadlineRecord, now = new Date()): CampaignDeadlineState {
  const deadline = new Date(item.deadline);
  if (item.step === "DONE") {
    const completed = item.completedAt ? new Date(item.completedAt) : now;
    return completed.getTime() <= deadline.getTime() ? "DONE_ON_TIME" : "DONE_LATE";
  }
  const remaining = deadline.getTime() - now.getTime();
  if (remaining < 0) return "OVERDUE";
  if (remaining <= 24 * 60 * 60 * 1000) return "DUE_SOON";
  return "ACTIVE";
}

export function campaignDeadlineText(item: DeadlineRecord, now = new Date()) {
  const state = campaignDeadlineState(item, now);
  const deadline = new Date(item.deadline);
  if (state === "DONE_ON_TIME") return "Hoàn thành đúng hạn";
  if (state === "DONE_LATE") return "Hoàn thành trễ";
  const difference = Math.abs(deadline.getTime() - now.getTime());
  const days = Math.floor(difference / 86400000);
  const hours = Math.floor((difference % 86400000) / 3600000);
  const minutes = Math.floor((difference % 3600000) / 60000);
  const amount = days ? `${days} ngày${hours ? ` ${hours} giờ` : ""}` : hours ? `${hours} giờ${minutes ? ` ${minutes} phút` : ""}` : `${Math.max(minutes, 1)} phút`;
  return state === "OVERDUE" ? `Trễ ${amount}` : `Còn ${amount}`;
}

export function campaignPeriodStatus(value: Date | string, now = new Date()) {
  const deadline = new Date(value);
  const vietnamDay = (date: Date) => {
    const local = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) / 86_400_000;
  };
  const days = vietnamDay(deadline) - vietnamDay(now);
  if (days < 0) {
    const overdueDays = Math.abs(days);
    return { state: "OVERDUE" as const, label: `Quá hạn ${overdueDays} ngày`, days: overdueDays };
  }
  return {
    state: days <= 2 ? "DUE_SOON" as const : "ACTIVE" as const,
    label: days === 0 ? "Kết thúc hôm nay" : `Còn ${days} ngày`,
    days,
  };
}
