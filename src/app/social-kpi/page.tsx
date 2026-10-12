import { manager, permittedUserIds, publicUserSelect, requireUser } from "@/lib/auth";
import { periodBounds } from "@/lib/business-rules";
import { todayInVietnam } from "@/lib/dashboard";
import { db } from "@/lib/db";
import SocialKpiClient from "./SocialKpiClient";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export default async function SocialKpiPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const activeUser = await requireUser();
  const isManager = manager(activeUser);
  const ids = await permittedUserIds(activeUser);
  const requested = (await searchParams).date;
  const selectedDate = requested && datePattern.test(requested) ? requested : todayInVietnam();
  const dayRange = periodBounds(selectedDate, "day");
  const monthRange = periodBounds(todayInVietnam(), "month");
  const userScope = ids ? { userId: { in: ids } } : {};
  const selectedDay = { OR: [{ date: { gte: dayRange.start, lt: dayRange.end } }, { checkIn: { gte: dayRange.start, lt: dayRange.end } }] };
  const sessions = await db.attendance.findMany({
    where: isManager ? { ...userScope, user: { role: "SALES" }, ...selectedDay } : { userId: activeUser.id, OR: [{ date: { gte: monthRange.start, lt: monthRange.end } }, { checkIn: { gte: monthRange.start, lt: monthRange.end } }, { checkOut: null }] },
    include: { user: { select: publicUserSelect }, posts: { include: { order: true, lead: true }, orderBy: { createdAt: "desc" } } },
    orderBy: { checkIn: "desc" },
    take: isManager ? 100 : 20,
  });
  const users = await db.user.findMany({ where: ids ? { id: { in: ids } } : { role: "SALES" }, select: publicUserSelect, orderBy: { name: "asc" } });
  const orderUserIds = isManager ? users.map(user => user.id) : [activeUser.id];
  const orders = await db.order.findMany({ where: { salesId: { in: orderUserIds } }, select: { id: true, code: true, customerName: true, status: true, salesId: true, invoiceAmount: true, invoiceCurrency: true }, orderBy: { updatedAt: "desc" }, take: 200 });
  return <SocialKpiClient activeUser={activeUser} isManager={isManager} selectedDate={selectedDate} sessions={sessions} users={users} orders={orders} />;
}
