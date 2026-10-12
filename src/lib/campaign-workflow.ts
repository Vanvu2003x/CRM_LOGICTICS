import { penaltyDays } from "./business-rules";
export function shouldRemindCampaign(deadline: Date, now: Date) {
  return deadline.getTime() - now.getTime() <= 2 * 86400000;
}

export function campaignPenaltyData(product: { id: string; campaignId: string; userId: string; title: string | null }, deadline: Date, day: number) {
  return {
    campaignId: product.campaignId,
    userId: product.userId,
    type: "PENALTY",
    step: "PRODUCT_DRAFT",
    contentType: "POST",
    contentPillar: "OTHER",
    parentId: product.id,
    penaltyKey: `${product.id}:${day}`,
    title: `Bài phạt ngày trễ thứ ${day}`,
    deadline: new Date(deadline.getTime() + (day + 1) * 86400000),
    requirements: "1 bài truyền thông phạt",
    notes: `Phạt do quá hạn: ${product.title || "Sản phẩm truyền thông"}`,
  };
}

export function campaignPenalties(product:{id:string;campaignId:string;userId:string;title:string|null;type:string;completedAt?:Date|null},deadline:Date,now:Date) {
 if(product.type!=="NORMAL")return [];
 const days=penaltyDays(deadline.toISOString(),now.toISOString(),product.completedAt?.toISOString());
 return Array.from({length:Math.min(days,365)},(_,index)=>campaignPenaltyData(product,deadline,index+1));
}
