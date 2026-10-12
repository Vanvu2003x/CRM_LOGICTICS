import { db } from "./db";
import { notifyExhaustedData } from "./lead-data-alert";
import { penaltyDays,readJson } from "./business-rules";
import { campaignPenalties, shouldRemindCampaign } from "./campaign-workflow";
import { fairPenaltyData, fairReportDeadline } from "./trade-fair-workflow";
import { automaticCheckoutAt, shouldAutoCloseAttendance } from "./attendance";
export function runReminders(now=new Date()) {
 const state=globalThis as typeof globalThis & {crmRemindersPromise?:Promise<void>};
 if(state.crmRemindersPromise)return state.crmRemindersPromise;
 state.crmRemindersPromise=updateReminders(now).finally(()=>{state.crmRemindersPromise=undefined;});
 return state.crmRemindersPromise;
}
async function updateReminders(now:Date) {
 await notifyExhaustedData();
 const upcoming=new Date(now.getTime()+7*86400000);
 const [leads,orders,products,fairs,workSessions]=await Promise.all([
  db.lead.findMany({where:{status:{in:["NEW","IN_PROGRESS"]},interestState:"YES"}}),
  db.order.findMany({where:{status:"IN_PROGRESS"}}),
  db.campaignProduct.findMany({where:{step:{not:"DONE"},campaign:{status:{not:"CANCELLED"}}},include:{campaign:true}}),
  db.tradeFairParticipation.findMany({where:{session:{not:"NONE"}},include:{fair:true}}),
  db.attendance.findMany({where:{checkOut:null},include:{posts:true}})
 ]);
 const entries:{key:string;userId:string;title:string;href:string;dueAt:Date;kind:string}[]=[];
 const [dataRequests,admins]=await Promise.all([
  db.leadDataRequest.findMany({where:{status:"OPEN"},include:{user:{select:{name:true}}}}),
  db.user.findMany({where:{role:"ADMIN"},select:{id:true}}),
 ]);
 for(const request of dataRequests)for(const admin of admins)entries.push({key:`data-request:${request.id}:${admin.id}`,userId:admin.id,title:`Cấp thêm data · ${request.user.name}`,href:"/leads",dueAt:request.requestedAt,kind:"LEAD_DATA"});
 for(const session of workSessions)if(shouldAutoCloseAttendance(session,now)){
  const checkOut=automaticCheckoutAt(session.checkIn);
  await db.attendance.update({where:{id:session.id},data:{checkOut,closeType:"AUTO_END_OF_DAY",closeNote:"Tự kết thúc lúc 17:30 do nhân viên chưa chấm công ra."}});
  session.checkOut=checkOut;
 }
 for(const lead of leads)if(lead.salesId){const due=lead.followUpAt||new Date((lead.lastContactAt||lead.createdAt).getTime()+2*86400000);if(due<=upcoming)entries.push({key:"lead:"+lead.id,userId:lead.salesId,title:"Chăm sóc "+lead.name,href:"/leads?lead="+lead.id,dueAt:due,kind:"FOLLOW_UP"});}
 for(const lead of leads)if(lead.salesId&&lead.status==="NEW"&&!readJson(lead.contactHistory,[] as {promotionSent?:boolean}[]).some(entry=>entry.promotionSent))entries.push({key:"promotion:"+lead.id,userId:lead.salesId,title:"Gửi khuyến mãi · "+lead.name,href:"/leads?lead="+lead.id,dueAt:lead.createdAt,kind:"PROMOTION"});
 const stageTitles:Record<number,string>={4:"Gửi báo giá",5:"Theo dõi phản hồi khách",6:"Xác nhận booking",9:"Kiểm tra chứng từ",10:"Kiểm tra thông quan"};
 for(const order of orders){
  if(stageTitles[order.currentStep])entries.push({key:"order:"+order.id,userId:order.salesId,title:stageTitles[order.currentStep]+" · "+order.code,href:"/pipeline/"+order.code,dueAt:order.updatedAt,kind:"ORDER"});
  if(order.invoiceIssuedAt&&!order.paidAt&&order.dueDate&&order.dueDate<=upcoming)entries.push({key:"invoice:"+order.id,userId:order.salesId,title:"Thu tiền "+order.invoiceNumber,href:"/pipeline/"+order.code+"?step=13",dueAt:order.dueDate,kind:"PAYMENT"});
 }
 for(const product of products){
  const deadline=product.deadline||product.campaign.deadline;
  if(shouldRemindCampaign(deadline,now))entries.push({key:"campaign:"+product.id,userId:product.userId,title:(product.type==="PENALTY"?"Nộp bài phạt · ":"Nộp sản phẩm · ")+(product.title||product.campaign.name),href:"/campaigns",dueAt:deadline,kind:"CAMPAIGN"});
  for(const data of campaignPenalties({...product,title:product.title||product.campaign.name},deadline,now))await db.campaignProduct.upsert({where:{penaltyKey:data.penaltyKey},update:{},create:data});
 }
 for(const participation of fairs){
  const due=fairReportDeadline(participation.day||participation.fair.endDate);
  if(!participation.marketingLink || !participation.resultAt)entries.push({key:"fair:"+participation.id,userId:participation.userId,title:"Nộp kết quả / link hội chợ · "+participation.fair.name,href:"/trade-fairs",dueAt:due,kind:"TRADE_FAIR"});
  const days=penaltyDays(due.toISOString(),now.toISOString(),participation.submittedAt?.toISOString());
  if(days && !participation.marketingLink){
   const campaign=await db.campaign.upsert({where:{id:"fair-penalty-"+participation.fairId},update:{},create:{id:"fair-penalty-"+participation.fairId,name:"Bài bổ sung · "+participation.fair.name,deadline:due}});
   for(let day=1;day<=Math.min(days,365);day++)await db.campaignProduct.upsert({where:{penaltyKey:"fair:"+participation.id+":"+day},update:{},create:fairPenaltyData(participation,campaign.id,participation.fair.name,due,day)});
  }
 }
 for(const session of workSessions){
  const posts=session.posts.filter(item=>item.type==="POST").length,comments=session.posts.filter(item=>item.type==="COMMENT").length;
  if(posts<3||comments<5)entries.push({key:"social-kpi:"+session.id,userId:session.userId,title:`KPI ca · còn ${Math.max(0,3-posts)} bài, ${Math.max(0,5-comments)} bình luận`,href:"/social-kpi",dueAt:new Date(session.checkIn.getTime()+8*3600000),kind:"SOCIAL_KPI"});
 }
 await db.$transaction(async tx=>{
  await tx.reminder.updateMany({where:{status:"OPEN"},data:{status:"RESOLVED"}});
  for(const entry of entries)await tx.reminder.upsert({where:{key:entry.key},update:{...entry,status:"OPEN"},create:entry});
 });
 await db.session.deleteMany({where:{expiresAt:{lt:now}}});
}
