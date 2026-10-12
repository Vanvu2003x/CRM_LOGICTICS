import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { manager, permittedUserIds, requireUser } from "@/lib/auth";
import { roundRobinLeadAssignments } from "@/lib/lead-distribution";
import { requestHasAllowedOrigin } from "@/lib/request-origin";

export async function POST(request:Request){
 try{
  const user=await requireUser();
  if(!manager(user))return NextResponse.json({error:"Chỉ Admin/Manager được chia data."},{status:403});
  if(!requestHasAllowedOrigin(request))return NextResponse.json({error:"Nguồn gửi yêu cầu không được phép."},{status:403});
  const body=await request.json() as {salesIds?:unknown;count?:unknown;batchId?:unknown};
  const salesIds=Array.isArray(body.salesIds)?[...new Set(body.salesIds.filter((item):item is string=>typeof item==="string"))].slice(0,50):[];
  const count=Math.floor(Number(body.count));
  if(!Number.isInteger(count)||count<1||count>2000)throw new Error("Số lượng chia phải từ 1 đến 2.000.");
  const permitted=await permittedUserIds(user);
  if(permitted&&salesIds.some(id=>!permitted.includes(id)))throw new Error("Có nhân viên ngoài phạm vi quản lý.");
  const staff=await db.user.findMany({where:{id:{in:salesIds},role:{in:["SALES","MANAGER"]}},select:{id:true,name:true}});
  if(staff.length!==salesIds.length)throw new Error("Danh sách nhân viên không hợp lệ.");
  const leads=await db.lead.findMany({where:{salesId:null,status:"NEW",...(typeof body.batchId==="string"&&body.batchId?{importBatchId:body.batchId}:{})},select:{id:true},orderBy:{createdAt:"asc"},take:count});
  const assignments=roundRobinLeadAssignments(leads.map(item=>item.id),salesIds,count),assignedAt=new Date();
  await db.$transaction(async tx=>{
   for(const item of assignments)await tx.lead.update({where:{id:item.leadId},data:{salesId:item.salesId,assignedAt}});
   await tx.leadDataRequest.updateMany({where:{userId:{in:salesIds},status:"OPEN"},data:{status:"FULFILLED",resolvedAt:assignedAt,resolvedById:user.id}});
  });
  const breakdown=staff.map(item=>({salesId:item.id,name:item.name,count:assignments.filter(assignment=>assignment.salesId===item.id).length}));
  return NextResponse.json({success:true,assigned:assignments.length,remaining:Math.max(0,await db.lead.count({where:{salesId:null,status:"NEW"}})),breakdown});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Không chia được data."},{status:400});}
}
