"use server";
import { runReminders } from "@/lib/reminders";
import { db } from "@/lib/db";
import { requireUser,assertOwner,manager } from "@/lib/auth";
import { safeUrl,readJson } from "@/lib/business-rules";
import { revalidatePath } from "next/cache";
export async function createCampaign(data:{name:string;description:string;requirements:string;startDate:Date;endDate:Date;userIds:string[]}) {
 try {const user=await requireUser();if(!manager(user))throw new Error("Chỉ quản lý được giao chiến dịch.");
 const startDate=new Date(data.startDate),endDate=new Date(data.endDate);
 if(!data.name.trim() || !data.userIds.length || data.userIds.length>50 || !Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate < startDate)throw new Error("Nhập tên, thời gian chiến dịch và nhân viên.");
 for(const id of data.userIds)await assertOwner(user,id);
 await db.campaign.create({data:{name:data.name.slice(0,200),description:data.description.slice(0,3000),requirements:data.requirements||null,startDate,endDate,deadline:endDate,participants:JSON.stringify(data.userIds)}});
 revalidatePath("/campaigns");return {success:true};
 }catch(error){return {success:false,error:error instanceof Error?error.message:"Không tạo được chiến dịch."};}
}
export async function updateProductStep(id:string,newStep:string,link?:string,notes?:string) {
 try {const user=await requireUser();const product=await db.campaignProduct.findUnique({where:{id}});
 if(!product)throw new Error("Không tìm thấy công việc.");await assertOwner(user,product.userId);
 const transitions:Record<string,string[]>={SCRIPT_DRAFT:["SCRIPT_APPROVED"],SCRIPT_APPROVED:["SCRIPT_DRAFT","PRODUCT_DRAFT"],PRODUCT_DRAFT:["PRODUCT_APPROVED","SCRIPT_APPROVED"],PRODUCT_APPROVED:["PRODUCT_DRAFT","DONE"]};
 if(!transitions[product.step]?.includes(newStep))throw new Error("Không thể bỏ qua bước duyệt.");
 const approval=product.step==="SCRIPT_APPROVED"||product.step==="PRODUCT_APPROVED";
 if(approval&&!manager(user))throw new Error("Quản lý duyệt hoặc trả lại sản phẩm.");
 const nextLink=link?.trim()||product.link;
 if(nextLink && !safeUrl(nextLink))throw new Error("Link cần bắt đầu bằng HTTP/HTTPS.");
 if(product.step.includes("DRAFT")&&!nextLink)throw new Error(product.type==="PENALTY"?"Gắn link nộp bài phạt trước khi gửi duyệt.":"Gắn link kịch bản / sản phẩm trước khi gửi duyệt.");
 if(newStep==="DONE")await runReminders();
 const history=readJson<unknown[]>(product.history,[]);history.unshift({at:new Date().toISOString(),by:user.name,from:product.step,to:newStep,link:nextLink,notes:notes||""});
 const activeNotes=notes?.trim()||(product.step.includes("DRAFT")?null:product.notes);
 await db.campaignProduct.update({where:{id},data:{step:newStep,link:nextLink,notes:activeNotes,history:JSON.stringify(history),submittedAt:nextLink?(product.submittedAt||new Date()):product.submittedAt,completedAt:newStep==="DONE"?new Date():product.completedAt}});
 revalidatePath("/campaigns");return {success:true};
 }catch(error){return {success:false,error:error instanceof Error?error.message:"Không cập nhật được."};}
}
export async function addAssignment(data:{campaignId:string;userId:string;title:string;deadline:string;contentType:string;requirements:string;durationSpec?:string;contentPillar?:string}){
 try{const user=await requireUser();if(!manager(user))throw new Error("Chỉ quản lý giao việc.");await assertOwner(user,data.userId);
 if(!data.campaignId||!data.title.trim()||!["VIDEO","POST","VIDEO_POST","PHOTOS"].includes(data.contentType)||!Number.isFinite(new Date(data.deadline).getTime()))throw new Error("Kiểm tra chiến dịch, nội dung, loại và deadline.");
 await db.campaignProduct.create({data:{campaignId:data.campaignId,userId:data.userId,title:data.title.trim().slice(0,200),deadline:new Date(data.deadline),contentType:data.contentType,requirements:data.requirements.trim().slice(0,2000),durationSpec:data.durationSpec?.trim().slice(0,100)||null,contentPillar:data.contentPillar?.trim().slice(0,30)||null}});
 revalidatePath("/campaigns");return{success:true};
 }catch(error){return{success:false,error:error instanceof Error?error.message:"Không giao được việc."};}
}

export async function addAssignments(rows:Array<{campaignId:string;userId:string;title:string;deadline:string;contentType:string;requirements:string;durationSpec?:string;contentPillar?:string}>){
 try{const user=await requireUser();if(!manager(user))throw new Error("Chỉ quản lý giao việc.");
 if(!Array.isArray(rows)||rows.length<1||rows.length>30)throw new Error("Mỗi lần lưu từ 1 đến 30 nội dung.");
 const data=[];
 for(const row of rows){
  await assertOwner(user,row.userId);
  const deadline=new Date(row.deadline);
  if(!row.campaignId||!row.title?.trim()||!["VIDEO","POST","VIDEO_POST","PHOTOS"].includes(row.contentType)||!Number.isFinite(deadline.getTime()))throw new Error("Kiểm tra chiến dịch, nhân viên, nội dung và deadline.");
  data.push({campaignId:row.campaignId,userId:row.userId,title:row.title.trim().slice(0,200),deadline,contentType:row.contentType,requirements:(row.requirements||"").trim().slice(0,2000),durationSpec:row.durationSpec?.trim().slice(0,100)||null,contentPillar:row.contentPillar?.trim().slice(0,30)||"OTHER"});
 }
 await db.$transaction(data.map(item=>db.campaignProduct.create({data:item})));
 revalidatePath("/campaigns");return {success:true};
 }catch(error){return {success:false,error:error instanceof Error?error.message:"Không lưu được kế hoạch."};}
}

export async function updateAssignmentDetails(data:{id:string;campaignId:string;userId:string;title:string;deadline:string;contentType:string;requirements:string;durationSpec?:string;contentPillar?:string;link?:string}){
 try{const user=await requireUser();if(!manager(user))throw new Error("Chỉ quản lý được sửa kế hoạch.");
 const product=await db.campaignProduct.findUnique({where:{id:data.id}});if(!product)throw new Error("Không tìm thấy nội dung.");
 await assertOwner(user,product.userId);await assertOwner(user,data.userId);
 if(!data.campaignId||!data.title.trim()||!["VIDEO","POST","VIDEO_POST","PHOTOS"].includes(data.contentType)||!Number.isFinite(new Date(data.deadline).getTime()))throw new Error("Kiểm tra chiến dịch, nội dung, loại và deadline.");
 if(data.link&&!safeUrl(data.link))throw new Error("Link final cần bắt đầu bằng HTTP/HTTPS.");
 await db.campaignProduct.update({where:{id:data.id},data:{campaignId:data.campaignId,userId:data.userId,title:data.title.trim().slice(0,200),deadline:new Date(data.deadline),contentType:data.contentType,requirements:data.requirements.trim().slice(0,2000),durationSpec:data.durationSpec?.trim().slice(0,100)||null,contentPillar:data.contentPillar?.trim().slice(0,30)||null,link:data.link?.trim()||null}});
 revalidatePath("/campaigns");return{success:true};
 }catch(error){return{success:false,error:error instanceof Error?error.message:"Không lưu được nội dung."};}
}
