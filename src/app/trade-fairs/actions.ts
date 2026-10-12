"use server";

import { db } from "@/lib/db";
import { assertOwner, manager, permittedUserIds, requireUser } from "@/lib/auth";
import { readJson, safeUrl } from "@/lib/business-rules";
import { normalizeTradeFairLeadInput, tradeFairLeadHistoryEntry, type TradeFairLeadInput } from "@/lib/trade-fair-lead";
import { canChangeTradeFairSession } from "@/lib/trade-fair-workflow";
import { revalidatePath } from "next/cache";

const DAY = 86_400_000;
const sessions = ["NONE", "MORNING", "AFTERNOON", "BOTH"] as const;

function vietnamDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(NaN);
  return new Date(`${value}T00:00:00+07:00`);
}

function refreshFairPaths() {
  revalidatePath("/trade-fairs");
  revalidatePath("/leads");
  revalidatePath("/reports");
}

export async function createTradeFair(data: { name: string; location?: string; description?: string; startDate: string; endDate: string }) {
  try {
    const user = await requireUser();
    if (!manager(user)) throw new Error("Chỉ quản lý được tạo hội chợ.");
    const startDate = vietnamDate(data.startDate);
    const endDate = vietnamDate(data.endDate);
    if (!data.name.trim() || !Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate < startDate || endDate.getTime() - startDate.getTime() > 31 * DAY) throw new Error("Kiểm tra tên và lịch hội chợ (tối đa 31 ngày).");
    const ids = await permittedUserIds(user);
    const sales = await db.user.findMany({ where: { role: "SALES", ...(ids ? { id: { in: ids } } : {}) }, select: { id: true } });
    const dailyRows: { userId: string; day: Date; session: string }[] = [];
    for (let time = startDate.getTime(); time <= endDate.getTime(); time += DAY) for (const member of sales) dailyRows.push({ userId: member.id, day: new Date(time), session: "NONE" });
    await db.tradeFair.create({ data: { name: data.name.trim(), location: data.location?.trim() || null, description: data.description?.trim() || null, startDate, endDate, registrations: { create: sales.map(member => ({ userId: member.id })) }, participations: { create: dailyRows } } });
    refreshFairPaths();
    return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Không tạo được hội chợ." }; }
}

export async function updateFairRegistration(fairId: string, userId: string, status: string, declineReason?: string) {
  try {
    const user = await requireUser();
    await assertOwner(user, userId);
    if (!["PENDING", "PARTICIPATING", "DECLINED"].includes(status)) throw new Error("Trạng thái đăng ký không hợp lệ.");
    if (status === "DECLINED" && !declineReason?.trim()) throw new Error("Vui lòng ghi rõ lý do không tham gia.");
    await db.$transaction(async tx => {
      await tx.tradeFairRegistration.upsert({ where: { fairId_userId: { fairId, userId } }, update: { status, declineReason: status === "DECLINED" ? declineReason!.trim() : null }, create: { fairId, userId, status, declineReason: status === "DECLINED" ? declineReason!.trim() : null } });
      if (status === "DECLINED") await tx.tradeFairParticipation.updateMany({ where: { fairId, userId }, data: { session: "NONE", reason: declineReason!.trim() } });
    });
    refreshFairPaths();
    return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Không cập nhật được đăng ký." }; }
}

export async function updateParticipation(id: string, data: { session: string; resultNote?: string; marketingLink?: string }) {
  try {
    const user = await requireUser();
    const participation = await db.tradeFairParticipation.findUnique({ where: { id } });
    if (!participation) throw new Error("Không tìm thấy ngày tham gia.");
    await assertOwner(user, participation.userId);
    if (!sessions.includes(data.session as (typeof sessions)[number])) throw new Error("Ca tham gia không hợp lệ.");
    if (data.session !== participation.session && !canChangeTradeFairSession(participation.day)) throw new Error("Lịch tham gia đã khóa vì ngày hội chợ đã bắt đầu.");
    if (data.marketingLink && !safeUrl(data.marketingLink)) throw new Error("Link truyền thông không hợp lệ.");
    const resultNote = data.resultNote?.trim() || null;
    const marketingLink = data.marketingLink?.trim() || null;
    await db.$transaction(async tx => {
      await tx.tradeFairParticipation.update({ where: { id }, data: { session: data.session, resultNote, marketingLink, resultAt: resultNote ? new Date() : participation.resultAt, submittedAt: marketingLink ? new Date() : participation.submittedAt, reason: data.session === "NONE" ? participation.reason : null } });
      if (data.session !== "NONE") await tx.tradeFairRegistration.upsert({ where: { fairId_userId: { fairId: participation.fairId, userId: participation.userId } }, update: { status: "PARTICIPATING", declineReason: null }, create: { fairId: participation.fairId, userId: participation.userId, status: "PARTICIPATING" } });
    });
    refreshFairPaths();
    return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Không cập nhật được ngày tham gia." }; }
}

export async function addTradeFairLead(participationId: string, data: TradeFairLeadInput) {
  try {
    const user = await requireUser();
    const participation = await db.tradeFairParticipation.findUnique({ where: { id: participationId }, include: { fair: true } });
    if (!participation || participation.session === "NONE") throw new Error("Bạn cần đăng ký ca tham gia trước khi nộp kết quả.");
    await assertOwner(user, participation.userId);
    const normalized = normalizeTradeFairLeadInput(data);
    const result = await db.$transaction(async tx => {
      const existing = await tx.lead.findFirst({
        where: { salesId: participation.userId, OR: [{ phone: normalized.phone }, { taxId: normalized.taxId }] },
        orderBy: { updatedAt: "desc" },
      });
      const historyEntry = tradeFairLeadHistoryEntry({ ...normalized, fairName: participation.fair.name });
      const lead = existing
        ? await tx.lead.update({ where: { id: existing.id }, data: {
            company: existing.company || normalized.companyName,
            taxId: existing.taxId || normalized.taxId,
            address: existing.address || normalized.address,
            industry: existing.industry || normalized.industry,
            needs: existing.needs || normalized.notes,
            source: existing.source || "TRADE_FAIR",
            originRef: existing.originRef || participation.fairId,
            isInterested: existing.isInterested || normalized.quality !== "COLD",
            interestState: existing.interestState === "UNKNOWN" && normalized.quality !== "COLD" ? "YES" : existing.interestState,
            followUpAt: existing.followUpAt || new Date(Date.now() + DAY),
            contactHistory: JSON.stringify([...readJson<unknown[]>(existing.contactHistory, []), historyEntry]),
          } })
        : await tx.lead.create({ data: {
            name: normalized.contactName,
            company: normalized.companyName,
            taxId: normalized.taxId,
            phone: normalized.phone,
            industry: normalized.industry,
            address: normalized.address,
            needs: normalized.notes,
            source: "TRADE_FAIR",
            originRef: participation.fairId,
            salesId: participation.userId,
            status: "NEW",
            isInterested: normalized.quality !== "COLD",
            interestState: normalized.quality === "COLD" ? "UNKNOWN" : "YES",
            followUpAt: new Date(Date.now() + DAY),
            contactHistory: JSON.stringify([historyEntry]),
          } });
      await tx.tradeFairLead.create({ data: { participationId, ...normalized, crmLeadId: lead.id } });
      await tx.tradeFairParticipation.update({ where: { id: participationId }, data: { resultAt: new Date() } });
      return { reusedLead: Boolean(existing), leadId: lead.id };
    });
    refreshFairPaths();
    return { success: true, ...result };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Không lưu được khách hàng hội chợ." }; }
}
