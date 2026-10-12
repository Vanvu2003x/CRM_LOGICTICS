import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireUser,permittedUserIds } from "@/lib/auth";
import { ownedOrder } from "@/lib/crm-data";
import { db } from "@/lib/db";
import { getItyConfig } from "@/lib/ity";
import { ityDialPhone } from "@/lib/ity-call-log";
export async function POST(request:Request) {
 try {
 const user=await requireUser();const {phone,userfield}=await request.json();
 if(typeof phone!=="string"||!/^\+?[\d\s().-]{7,25}$/.test(phone))throw new Error("Số điện thoại không hợp lệ.");
 const order=userfield?await ownedOrder(user,userfield):null;
 const ids=await permittedUserIds(user);
 const lead=order?.leadId?await db.lead.findUnique({where:{id:order.leadId}}):await db.lead.findFirst({where:{phone,...(ids?{salesId:{in:ids}}:{})}});
 if(!lead || lead.phone!==phone)throw new Error("Chỉ gọi khách thuộc phạm vi phụ trách.");
 const config=await getItyConfig();
 if(config.mode==="DEMO"){
 await db.$transaction([
 db.callLog.create({data:{callid:"demo-"+randomUUID(),phone,demand:lead.interestState,customerName:lead.name,company:lead.company,needs:lead.needs,salesId:user.id,extension:user.extension,duration:60,billsec:45,status:"ANSWERED",direction:"outbound",startedAt:new Date(),leadId:lead.id,orderCode:order?.code,userfield:order?.code}}),
 db.lead.update({where:{id:lead.id},data:{callCount:{increment:1},callDurationSeconds:{increment:45},lastContactAt:new Date()}})
 ]);
 return NextResponse.json({success:true,demo:true,message:"Đã ghi nhận cuộc gọi mô phỏng (45 giây), không gọi điện thật."});
 }
 if(!user.extension||!config.server||!config.customer||!config.secret)throw new Error("Cấu hình ITY chưa đủ.");
 const url=new URL("/wsapi/"+encodeURIComponent(config.customer)+"/click2call.php",config.server);
 for(const [key,value]of Object.entries({secret:config.secret,extension:user.extension,phone:ityDialPhone(phone),domain:config.domain,userfield:order?.code||lead.id}))url.searchParams.set(key,value);
 const response=await fetch(url,{signal:AbortSignal.timeout(10000),redirect:"error"});
 if(!response.ok)throw new Error("ITY không tiếp nhận yêu cầu.");
 return NextResponse.json({success:true,demo:false,message:"Đã gửi yêu cầu gọi. Kết quả được ghi khi nhận webhook."});
 }catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:"Không kết nối được ITY."},{status:400});}
}
