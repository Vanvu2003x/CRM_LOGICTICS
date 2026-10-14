import { db } from "./db";
import { assertOwner, manager, permittedUserIds, publicUserSelect, type PublicUser } from "./auth";
import { readJson, type SavedSteps } from "./business-rules";
import type { LeadStatus } from "./demo-crm";

export async function scopedData(user: PublicUser) {
  const ids = await permittedUserIds(user);
  const scope = ids ? { salesId: { in: ids } } : {};
  const scopedLeadIds = ids ? (await db.lead.findMany({ where: scope, select: { id: true } })).map((lead) => lead.id) : [];
  const callScope = ids ? { OR: [{ salesId: { in: ids } }, { leadId: { in: scopedLeadIds } }] } : {};
  const [leads, orders, agents, activities, calls, users, dataRequests, importBatches, leadPoolCount] = await Promise.all([
    db.lead.findMany({ where: scope, include: { sales: { select: publicUserSelect } }, orderBy: { updatedAt: "desc" } }),
    db.order.findMany({ where: scope, include: { lead: true, sales: { select: publicUserSelect }, files: true }, orderBy: { updatedAt: "desc" } }),
    db.agent.findMany({ orderBy: { name: "asc" } }),
    db.activity.findMany({ where: ids ? { userId: { in: ids } } : {}, take: 30, orderBy: { createdAt: "desc" } }),
    db.callLog.findMany({ where: callScope, orderBy: { startedAt: "desc" }, take: 1000 }),
    db.user.findMany({ where: ids ? { id: { in: ids } } : {}, select: publicUserSelect }),
    db.leadDataRequest.findMany({where:ids?{userId:{in:ids}}:{},include:{user:{select:publicUserSelect}},orderBy:{requestedAt:"desc"},take:50}),
    manager(user)?db.leadImportBatch.findMany({orderBy:{createdAt:"desc"},take:30}):Promise.resolve([]),
    manager(user)?db.lead.count({where:{salesId:null,status:"NEW"}}):Promise.resolve(0),
  ]);
  const reminders=await db.reminder.findMany({where:{status:"OPEN",...(ids?{userId:{in:ids}}:{})},orderBy:{dueAt:"asc"}});
  const statuses: Record<string, LeadStatus> = { NEW: "MỚI", IN_PROGRESS: "ĐANG_CHĂM_SÓC", CONVERTED: "CHUYỂN_ĐƠN", FAILED: "FAIL" };
  return {
    leads: leads.map((lead) => ({
      id: lead.id, name: lead.name, phone: lead.phone, email: lead.email || "", company: lead.company || "", companyFoundedAt: lead.companyFoundedAt?.toISOString().slice(0, 10) || null, taxId: lead.taxId || "", address: lead.address || "", industry: lead.industry || "", source: lead.source || "",
      needs: lead.needs || "", isInterested: lead.interestState === "YES", interestState: lead.interestState,
      callDurationSeconds: lead.callDurationSeconds, callCount: lead.callCount, status: statuses[lead.status] || "MỚI",
      lastCall: (lead.lastContactAt || lead.createdAt).toISOString().slice(0, 10), sales: lead.sales?.name || "Chưa giao",
      salesId: lead.salesId, createdAt: lead.createdAt.toISOString(), followUpAt: lead.followUpAt?.toISOString() || null,
      history: readJson<unknown[]>(lead.contactHistory, []), originRef: lead.originRef, callOutcome: lead.callOutcome,
    })),
    orders: orders.map((order) => ({
      id: order.code, publicCode: order.publicCode, dbId: order.id, customer: order.customerName || order.lead?.company || order.lead?.name || order.code,
      customerName: order.lead?.name || order.customerName || null, company: order.lead?.company || null,
      step: order.currentStep, type: order.type === "IMPORT" ? "IMPORT" as const : "EXPORT" as const,
      date: order.createdAt.toISOString().slice(0, 10), sales: order.sales.name, salesId: order.salesId,
      exportPort: order.exportPort, importPort: order.importPort, expectedDate: order.expectedDate?.toISOString() || null, quantity: order.quantity, incoterms: order.incoterms,
      status: order.status as "IN_PROGRESS" | "COMPLETED" | "FAILED", leadId: order.leadId,
      data: readJson<SavedSteps>(order.stepsData, {}), completedSteps: readJson<number[]>(order.completedSteps, []),
      history: readJson<unknown[]>(order.workflowHistory, []), completedAt: order.completedAt?.toISOString() || null,
      failedAt: order.failedAt?.toISOString() || null, failureReason: order.failureReason,
      dueDate: order.dueDate?.toISOString() || null, paidAt: order.paidAt?.toISOString() || null,
      invoiceNumber: order.invoiceNumber, invoiceAmount: order.invoiceAmount, invoiceCurrency: order.invoiceCurrency,
      invoiceIssuedAt: order.invoiceIssuedAt?.toISOString()||null,
      files: order.files.map((file) => ({ id: file.id, filename: file.filename, step: file.step, kind: file.kind })),
      source: order.lead?.source || "", originRef: order.lead?.originRef || null,
    })),
    agents, activities: activities.map((item) => ({ id: item.id, at: item.createdAt.toISOString(), text: item.text, href: item.href })),
    calls: calls.map((call) => ({ ...call, startedAt: call.startedAt.toISOString(), createdAt: call.createdAt.toISOString() })), users,reminders:reminders.map(r=>({...r,dueAt:r.dueAt.toISOString()})),
    dataRequests:dataRequests.map(item=>({id:item.id,userId:item.userId,userName:item.user.name,status:item.status,note:item.note,requestedAt:item.requestedAt.toISOString(),resolvedAt:item.resolvedAt?.toISOString()||null})),
    importBatches:importBatches.map(item=>({...item,createdAt:item.createdAt.toISOString()})),leadPoolCount,
  };
}
export async function ownedOrder(user: PublicUser, code: string) {
  const order = await db.order.findUnique({ where: { code } });
  if (!order) throw new Error("Không tìm thấy đơn hàng.");
  await assertOwner(user, order.salesId);
  return order;
}
export async function ownedLead(user: PublicUser, id: string) {
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) throw new Error("Không tìm thấy khách hàng.");
  await assertOwner(user, lead.salesId);
  return lead;
}
export async function activity(user: PublicUser, text: string, href: string) {
  await db.activity.create({ data: { userId: user.id, text: user.name + " " + text, href } });
}
