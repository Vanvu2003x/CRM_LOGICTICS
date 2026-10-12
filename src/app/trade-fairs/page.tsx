import { manager, permittedUserIds, publicUserSelect, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { PublicUser } from "@/lib/auth";
import TradeFairsClient from "./TradeFairsClient";

export async function getTradeFairsData(activeUser: PublicUser, fairId?: string) {
  const ids = await permittedUserIds(activeUser);
  const userIds = ids || (await db.user.findMany({ where: { role: "SALES" }, select: { id: true } })).map(user => user.id);
  const users = await db.user.findMany({ where: { id: { in: userIds } }, select: publicUserSelect, orderBy: { name: "asc" } });
  const fairs = await db.tradeFair.findMany({
    where: { ...(fairId ? { id: fairId } : {}), ...(manager(activeUser) ? {} : { registrations: { some: { userId: activeUser.id } } }) },
    include: {
      registrations: { where: { userId: { in: userIds } }, include: { user: { select: publicUserSelect } } },
      participations: {
        where: { userId: { in: userIds } },
        include: { user: { select: publicUserSelect }, leads: { include: { crmLead: { include: { order: true } } }, orderBy: { createdAt: "desc" } } },
        orderBy: [{ day: "asc" }, { user: { name: "asc" } }],
      },
    },
    orderBy: { startDate: "desc" },
  });
  return { activeUser, users, fairs, isManager: manager(activeUser) };
}

export default async function TradeFairsPage() {
  const data = await getTradeFairsData(await requireUser());
  return <TradeFairsClient {...data} nowIso={new Date().toISOString()} />;
}
