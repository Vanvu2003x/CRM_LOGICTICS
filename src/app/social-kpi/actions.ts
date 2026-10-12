"use server";

import { assertOwner, manager, requireUser } from "@/lib/auth";
import { safeUrl } from "@/lib/business-rules";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

const types = ["POST", "COMMENT"];
const platforms = ["FACEBOOK", "ZALO", "TIKTOK", "LINKEDIN", "OTHER"];
const qualities = ["CONTENT", "INQUIRY", "QUALIFIED"];

function refresh() {
  revalidatePath("/social-kpi");
  revalidatePath("/reports");
  revalidatePath("/attendance");
}

export async function submitSocialKpi(data: { attendanceId: string; type: string; link: string; imageUrl?: string; orderNotes?: string; platform: string; quality: string; orderId?: string; customerName?: string; customerPhone?: string; customerCompany?: string; customerNeeds?: string }) {
  try {
    const user = await requireUser();
    const attendance = await db.attendance.findUnique({ where: { id: data.attendanceId } });
    if (!attendance || attendance.checkOut) throw new Error("Bạn cần chấm công và giữ ca làm đang hoạt động.");
    await assertOwner(user, attendance.userId);
    if (!types.includes(data.type) || !platforms.includes(data.platform) || !qualities.includes(data.quality) || !safeUrl(data.link)) throw new Error("Kiểm tra loại nội dung, nền tảng và link bài đăng.");
    if (data.imageUrl && !safeUrl(data.imageUrl) && !data.imageUrl.startsWith("/api/social-kpi/image/")) throw new Error("Ảnh đính kèm không hợp lệ.");
    const customerName = data.customerName?.trim();
    const customerPhone = data.customerPhone?.replace(/\s+/g, "").trim();
    if (data.quality === "QUALIFIED" && (!customerName || !customerPhone)) throw new Error("Khách có nhu cầu rõ cần tên và số điện thoại để đưa vào danh sách chăm sóc.");
    if (await db.socialPost.findFirst({ where: { attendanceId: attendance.id, link: data.link.trim() } })) throw new Error("Link này đã được nộp trong ca.");
    if (data.orderId) {
      const order = await db.order.findUnique({ where: { id: data.orderId }, select: { salesId: true } });
      if (!order || order.salesId !== attendance.userId) throw new Error("Đơn hàng không thuộc nhân viên của ca này.");
    }
    await db.$transaction(async (tx) => {
      let leadId: string | null = null;
      if (data.quality === "QUALIFIED" && customerName && customerPhone) {
        const existing = await tx.lead.findFirst({ where: { salesId: attendance.userId, phone: customerPhone }, select: { id: true } });
        if (existing) {
          leadId = existing.id;
          await tx.lead.update({ where: { id: existing.id }, data: { name: customerName, company: data.customerCompany?.trim() || undefined, needs: data.customerNeeds?.trim() || data.orderNotes?.trim() || undefined, source: `MXH ${data.platform}`, isInterested: true, interestState: "YES", callOutcome: "INTERESTED", status: "IN_PROGRESS", lastContactAt: new Date() } });
        } else {
          const lead = await tx.lead.create({ data: { name: customerName, phone: customerPhone, company: data.customerCompany?.trim() || null, needs: data.customerNeeds?.trim() || data.orderNotes?.trim() || null, source: `MXH ${data.platform}`, salesId: attendance.userId, isInterested: true, interestState: "YES", callOutcome: "INTERESTED", status: "IN_PROGRESS", firstContactAt: new Date(), lastContactAt: new Date(), originRef: `social:${data.link.trim()}` } });
          leadId = lead.id;
        }
      }
      await tx.socialPost.create({ data: { userId: attendance.userId, attendanceId: attendance.id, type: data.type, link: data.link.trim(), imageUrl: data.imageUrl?.trim() || null, orderNotes: data.orderNotes?.trim() || null, platform: data.platform, quality: data.quality, orderId: data.orderId || null, leadId } });
    });
    refresh();
    return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Không ghi nhận được KPI." }; }
}

export async function deleteSocialKpi(id: string) {
  try {
    const user = await requireUser();
    const item = await db.socialPost.findUnique({ where: { id }, include: { attendance: true } });
    if (!item) throw new Error("Không tìm thấy nội dung.");
    await assertOwner(user, item.userId);
    if (!manager(user) && item.attendance?.checkOut) throw new Error("Ca đã kết thúc nên không thể xoá nội dung.");
    await db.socialPost.delete({ where: { id } });
    refresh();
    return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Không xoá được nội dung." }; }
}

export async function reviewSocialKpi(id: string, quality: string) {
  try {
    const user = await requireUser();
    if (!manager(user)) throw new Error("Chỉ quản lý được đánh giá chất lượng.");
    if (!qualities.includes(quality)) throw new Error("Mức chất lượng không hợp lệ.");
    const item = await db.socialPost.findUnique({ where: { id } });
    if (!item) throw new Error("Không tìm thấy nội dung.");
    await assertOwner(user, item.userId);
    await db.socialPost.update({ where: { id }, data: { quality, reviewedAt: new Date() } });
    refresh();
    return { success: true };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : "Không đánh giá được nội dung." }; }
}
