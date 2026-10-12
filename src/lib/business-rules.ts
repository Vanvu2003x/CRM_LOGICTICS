export function nextStage(step: number, type: string) {
  const next = Math.min(13, step + 1);
  return type === "IMPORT" && next === 8 ? 9 : type === "EXPORT" && next === 11 ? 12 : next;
}
export function workflowStageNumbers(type: string) {
  const stages = Array.from({ length: 13 }, (_, index) => index + 1);
  if (type === "EXPORT") return stages.filter((step) => step !== 11);
  if (type === "IMPORT") return stages.filter((step) => step !== 8);
  return stages;
}

export function displayStageNumber(step: number, type: string) {
  const stages = workflowStageNumbers(type);
  const index = stages.indexOf(step);
  return index >= 0 ? index + 1 : step;
}
export function safeUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}
export function penaltyDays(deadline: string, now: string, completedAt?: string | null) {
  const until = completedAt ? Math.min(Date.parse(now), Date.parse(completedAt)) : Date.parse(now);
  return Math.max(0, Math.ceil((until - Date.parse(deadline)) / 86400000));
}
export function periodBounds(day: string, period: string) {
  const date = new Date(day + "T00:00:00+07:00");
  const calendar = new Date(day + "T00:00:00Z");
  if(period==="month"){
    const next=new Date(Date.UTC(calendar.getUTCFullYear(),calendar.getUTCMonth()+1,1));
    return {start:new Date(day.slice(0,7)+"-01T00:00:00+07:00"),end:new Date(next.toISOString().slice(0,10)+"T00:00:00+07:00")};
  }
  if (period === "week") date.setUTCDate(date.getUTCDate() - (calendar.getUTCDay() + 6) % 7);
  const end = new Date(date);
  end.setUTCDate(end.getUTCDate() + (period === "week" ? 7 : 1));
  return { start: date, end };
}
export type StepFields = Record<string, string | number | boolean | string[]>;
export type SavedSteps = Record<string, StepFields>;
export function readJson<T>(value: string | null | undefined, fallback: T): T {
  try { return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
