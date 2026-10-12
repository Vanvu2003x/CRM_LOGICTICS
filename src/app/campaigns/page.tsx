import { requireUser, permittedUserIds, publicUserSelect } from "@/lib/auth";


import { runReminders } from "@/lib/reminders";
import { db } from "@/lib/db";
import CampaignsClient from "./CampaignsClient";

export default async function CampaignsPage() {
 const activeUser=await requireUser(); await runReminders(); const ids=await permittedUserIds(activeUser); const scoped=ids?{userId:{in:ids}}:{};
  const users = await db.user.findMany({
    where: ids?{id:{in:ids}}:{}, select:publicUserSelect, orderBy: { name: "asc" }
  });

  const campaigns = await db.campaign.findMany({
 where:ids?{products:{some:{userId:{in:ids}}}}:{},
    orderBy: { deadline: "asc" }
  });

  const products = await db.campaignProduct.findMany({
    where:scoped, include: {
      user: {select:publicUserSelect},
      campaign: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8 lg:pt-6">
      <CampaignsClient users={users} campaigns={campaigns} products={products} nowIso={new Date().toISOString()} />
    </div>
  );
}
