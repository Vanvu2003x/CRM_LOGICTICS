import type { DemoLead, DemoOrder } from "./demo-crm";

export type Period = "day" | "week" | "month";
export const stages = ["Đang chăm sóc", "Thông tin đơn", "Tổng hợp giá", "Báo giá", "Feedback", "Booking", "Đại lý", "Điều xe XK", "Chứng từ", "Hải quan", "Điều xe NK", "Chi phí", "Thanh toán"];
export function todayInVietnam() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
export function addDays(date: string, count: number) { const day = new Date(`${date}T00:00:00Z`); day.setUTCDate(day.getUTCDate() + count); return day.toISOString().slice(0, 10); }
export function daysBetween(from: string, to: string) { return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000); }
export function periodStart(today: string, period: Period) {
  if (period === "day") return today;
  if (period === "month") return `${today.slice(0, 7)}-01`;
  const day = new Date(`${today}T00:00:00Z`).getUTCDay();
  return addDays(today, -((day + 6) % 7));
}
export function buildDashboard(leads: DemoLead[], orders: DemoOrder[], today: string, period: Period) {
  const start = periodStart(today, period);
  const inPeriod = (date: string) => date >= start && date <= today;
  const processing = orders.filter((order) => order.status === "IN_PROGRESS");
  const completed = orders.filter((order) => order.status === "COMPLETED");
  const interested = leads.filter((lead) => lead.isInterested && lead.status !== "FAIL");
  // Demo policy: a follow-up is due two calendar days after the last call.
  const followUps = interested.filter((lead) => lead.status !== "CHUYỂN_ĐƠN" && addDays(lead.lastCall, 2) <= today);
  const overdue = followUps.filter((lead) => addDays(lead.lastCall, 2) < today);
  const stepOrders = (step: number) => processing.filter((order) => order.step === step);
  // Payment amounts and due dates are clearly identified as demo scenarios in the UI.
  const invoices = processing.filter((order) => order.step >= 12).map((order) => {
    const numeric = Number(order.id.replace(/\D/g, "")) || 1;
    const dueDate = addDays(order.date, 8);
    return { order, id: `INV-${order.id.replace("ORD-", "")}`, amount: (4 + numeric % 12) * 7500000, dueDate, remaining: daysBetween(today, dueDate) };
  }).filter((invoice) => invoice.remaining <= 7).sort((a, b) => a.remaining - b.remaining);
  const tasks = [
    { key: "follow", title: "Khách cần follow-up", count: followUps.length, href: followUps[0] ? `/leads?lead=${followUps[0].id}` : "/leads", detail: `${overdue.length} khách quá hạn`, tone: "rose" },
    { key: "promotion", title: "Khách cần gửi khuyến mãi", count: interested.filter((lead) => lead.status === "MỚI").length, href: "/leads?status=MỚI", detail: "Lead mới có nhu cầu • demo", tone: "blue" },
    { key: "quote", title: "Báo giá chờ phản hồi", count: stepOrders(4).length + stepOrders(5).length, href: "/pipeline?step=5&also=4", detail: "Báo giá & feedback", tone: "amber" },
    { key: "booking", title: "Đơn cần booking", count: stepOrders(6).length, href: "/pipeline?step=6", detail: "Xác nhận với hãng tàu", tone: "blue" },
    { key: "docs", title: "Đơn cần kiểm tra chứng từ", count: stepOrders(9).length, href: "/pipeline?step=9", detail: "Checklist chứng từ • demo", tone: "amber" },
    { key: "customs", title: "Đơn chờ thông quan", count: stepOrders(10).length, href: "/pipeline?step=10", detail: "Kiểm tra trạng thái tờ khai", tone: "blue" },
    { key: "payment", title: "Hóa đơn đến hạn trong 7 ngày", count: invoices.length, href: invoices[0] ? `/pipeline/${invoices[0].order.id}?step=13` : "/pipeline?step=13", detail: "Kịch bản thanh toán demo", tone: "rose" },
  ];
  const attention = processing.flatMap((order) => {
    const age = Math.max(0, daysBetween(order.date, today));
    const reason = order.step === 9 ? "Kiểm tra HBL & Invoice" : order.step === 10 ? "Kiểm tra luồng hải quan" : order.step === 6 ? "Cần xác nhận booking" : order.step === 5 && age > 2 ? "Khách chưa phản hồi" : [8, 11].includes(order.step) ? "Kiểm tra tiến độ giao xe" : age > 4 ? "Cần cập nhật tiến độ" : "";
    return reason ? [{ order, reason, age, urgent: age > 4 || order.step === 9 }] : [];
  }).concat(orders.filter((order) => order.status === "FAILED").map((order) => ({ order, reason: "Đơn không thành công", age: Math.max(0, daysBetween(order.date, today)), urgent: true }))).sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.age - a.age);
  const names = [...new Set([...leads.map((lead) => lead.sales), ...orders.map((order) => order.sales)])].filter((name) => name !== "Chưa giao");
  const sales = names.map((name) => {
    const ownLeads = leads.filter((lead) => lead.sales === name && inPeriod(lead.lastCall));
    const ownOrders = orders.filter((order) => order.sales === name && inPeriod(order.date));
    return { name, calls: ownLeads.filter((lead) => lead.source.includes("ITY")).reduce((sum, lead) => sum + lead.callCount, 0), leads: ownLeads.length, orders: ownOrders.length, completed: ownOrders.filter((order) => order.status === "COMPLETED").length, overdue: overdue.filter((lead) => lead.sales === name).length };
  }).sort((a, b) => b.calls - a.calls);
  const chart = Array.from({ length: period === "day" ? 7 : 6 }, (_, index) => {
    let date: string;
    let end: string;
    if (period === "month") {
      const month = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
      month.setUTCMonth(month.getUTCMonth() - 5 + index);
      date = month.toISOString().slice(0, 10);
      month.setUTCMonth(month.getUTCMonth() + 1);
      end = addDays(month.toISOString().slice(0, 10), -1);
    } else {
      date = period === "week" ? addDays(periodStart(today, "week"), (-5 + index) * 7) : addDays(today, -6 + index);
      end = period === "week" ? addDays(date, 6) : date;
    }
    const within = (value: string) => value >= date && value <= end && value <= today;
    const bucketLeads = leads.filter((lead) => within(lead.lastCall));
    return { date, label: period === "month" ? `${date.slice(5, 7)}/${date.slice(0, 4)}` : `${period === "week" ? "Tuần " : ""}${date.slice(8)}/${date.slice(5, 7)}`, calls: bucketLeads.filter((lead) => lead.source.includes("ITY")).reduce((sum, lead) => sum + lead.callCount, 0), leads: bucketLeads.filter((lead) => lead.status === "MỚI").length, completed: completed.filter((order) => within(order.date)).length };
  });
  return { processing, completed, followUps, overdue, tasks, attention, invoices, sales, chart,
    callsToday: leads.filter((lead) => lead.lastCall === today && lead.source.includes("ITY")).reduce((sum, lead) => sum + lead.callCount, 0),
    newToday: leads.filter((lead) => lead.status === "MỚI" && lead.lastCall === today).length,
    failed: orders.filter((order) => order.status === "FAILED").length + leads.filter((lead) => lead.status === "FAIL").length,
    pipeline: stages.map((name, index) => ({ name, step: index + 1, count: stepOrders(index + 1).length })),
    funnel: [{ name: "Cuộc gọi ITY", value: leads.filter((lead) => lead.source.includes("ITY")).reduce((sum, lead) => sum + lead.callCount, 0) }, { name: "Có nhu cầu", value: interested.length }, { name: "Đang chăm sóc", value: leads.filter((lead) => lead.status === "ĐANG_CHĂM_SÓC").length }, { name: "Đã tạo đơn", value: leads.filter((lead) => lead.status === "CHUYỂN_ĐƠN").length }, { name: "Hoàn thành", value: completed.length }],
    ityLeads: leads.filter((lead) => lead.source.includes("ITY")).sort((a, b) => b.lastCall.localeCompare(a.lastCall)).slice(0, 4),
  };
}
