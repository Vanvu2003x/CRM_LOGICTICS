import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { manager, requireUser } from "@/lib/auth";
import { requestHasAllowedOrigin } from "@/lib/request-origin";

export async function POST(request:Request){
 try{
  const user=await requireUser();
  if(!requestHasAllowedOrigin(request))return NextResponse.json({error:"Nguồn gửi yêu cầu không được phép."},{status:403});
  const existing=await db.leadDataRequest.findFirst({where:{userId:user.id,status:"OPEN"}});
  if(existing)return NextResponse.json({success:true,requestId:existing.id,existing:true});
  const remaining=await db.lead.count({where:{salesId:user.id,status:"NEW",callOutcome:"UNKNOWN"}});
  const item=await db.leadDataRequest.create({data:{userId:user.id,note:`Còn ${remaining} data chưa xử lý tại thời điểm báo.`}});
  return NextResponse.json({success:true,requestId:item.id,remaining});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Không gửi được yêu cầu."},{status:400});}
}

export async function PATCH(request:Request){
 try{
  const user=await requireUser();
  if(!manager(user))return NextResponse.json({error:"Không có quyền xử lý yêu cầu."},{status:403});
  if(!requestHasAllowedOrigin(request))return NextResponse.json({error:"Nguồn gửi yêu cầu không được phép."},{status:403});
  const body=await request.json() as {id?:unknown;status?:unknown};
  if(typeof body.id!=="string")throw new Error("Yêu cầu không hợp lệ.");
  const status=body.status==="REJECTED"?"REJECTED":"RESOLVED";
  const updatedRequest=await db.leadDataRequest.update({where:{id:body.id},data:{status,resolvedAt:new Date(),resolvedById:user.id},include:{user:{select:{name:true}}}});
  await db.activity.create({data:{userId:user.id,text:`${user.name} ${status==="REJECTED"?"từ chối":"xử lý"} yêu cầu cấp data của ${updatedRequest.user.name}`,href:"/leads"}});
  return NextResponse.json({success:true,status});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Không xử lý được yêu cầu."},{status:400});}
}
