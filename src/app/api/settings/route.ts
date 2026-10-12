import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { requireUser,publicUserSelect,hashPassword } from "@/lib/auth";
import { getItyConfig } from "@/lib/ity";
import { sipAccounts } from "@/lib/ity-webphone-config";
export async function GET(){
 try{const user=await requireUser();if(user.role!=="ADMIN")return NextResponse.json({error:"Chỉ Admin quản trị hệ thống."},{status:403});
 const [users,teams,ity]=await Promise.all([db.user.findMany({select:publicUserSelect,orderBy:{name:"asc"}}),db.team.findMany({orderBy:{name:"asc"}}),getItyConfig()]);
 const customer=process.env.ITY_CUSTOMER||ity.customer;
 const webhookSecret=process.env.ITY_WEBHOOK_SECRET||process.env.CRM_SECRET||ity.secret;
 const webhook={customer,path:customer&&webhookSecret?`/wsapi/${encodeURIComponent(customer)}/call_answered`:""};
 const webphoneAccounts=Object.keys(sipAccounts(process.env)).sort().map(extension=>({extension,userId:users.find(user=>user.extension===extension)?.id||null}));
 const publicIty={mode:ity.mode,customer:ity.customer,domain:ity.domain,server:ity.server};
 return NextResponse.json({users,teams,ity:publicIty,webhook,webphoneAccounts},{headers:{"Cache-Control":"private, no-store"}});}catch{return NextResponse.json({error:"Vui lòng đăng nhập."},{status:401});}
}
export async function POST(request:Request) {
 try{
 const user=await requireUser();if(user.role!=="ADMIN")throw new Error("Chỉ Admin được thay đổi cấu hình.");
 if(request.headers.get("origin")&&new URL(request.headers.get("origin")!).host!==new URL(request.url).host)throw new Error("Yêu cầu không hợp lệ.");
 const {action,data}=await request.json();if(!data||typeof data!=="object"||Array.isArray(data))throw new Error("Dữ liệu cấu hình không hợp lệ.");
 if(action==="webhook-url"){
  const config=await getItyConfig();const customer=process.env.ITY_CUSTOMER||config.customer;const secret=process.env.ITY_WEBHOOK_SECRET||process.env.CRM_SECRET||config.secret;
  if(!customer||!secret)throw new Error("Webhook chưa được cấu hình đầy đủ.");
  return NextResponse.json({success:true,path:`/wsapi/${encodeURIComponent(customer)}/call_answered?secret=${encodeURIComponent(secret)}`},{headers:{"Cache-Control":"private, no-store"}});
 }else if(action==="ity"){
  if(!["DEMO","LIVE"].includes(data.mode)||typeof data.customer!=="string"||!/^[a-zA-Z0-9_-]{0,80}$/.test(data.customer))throw new Error("Cấu hình ITY không hợp lệ.");
  if(data.mode==="LIVE"){
   const url=new URL(data.server);
   if(url.protocol!=="https:"||url.username||url.password||!(/^[a-z0-9.-]+\.ity\.vn$/i.test(url.hostname)||/^(?!10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname)))throw new Error("Máy chủ phải là HTTPS của ITY hoặc IP công cộng của tổng đài.");
   if(!data.customer||!data.domain)throw new Error("Nhập mã khách và domain tổng đài.");
  }
  const existing=await getItyConfig();const value=JSON.stringify({mode:data.mode,customer:data.customer,domain:String(data.domain||"").slice(0,150),server:String(data.server||"").slice(0,200),secret:data.rotateSecret?randomBytes(24).toString("hex"):existing.secret||randomBytes(24).toString("hex")});
  await db.setting.upsert({where:{key:"ity"},update:{value},create:{key:"ity",value}});
 }else if(action==="team"){
  if(typeof data.name!=="string"||!data.name.trim())throw new Error("Nhập tên team.");
  await db.team.upsert({where:{name:data.name.trim()},update:{},create:{name:data.name.trim().slice(0,100)}});
 }else if(action==="user"){
  if(!["ADMIN","MANAGER","SALES"].includes(data.role)||typeof data.name!=="string"||!data.name.trim()||typeof data.email!=="string"||!/^\S+@\S+\.\S+$/.test(data.email))throw new Error("Nhập tên, email và vai trò hợp lệ.");
  if(data.id===user.id&&data.role!=="ADMIN")throw new Error("Không tự hạ quyền Admin đang đăng nhập.");
  if(data.extension && (typeof data.extension!=="string"||!/^\d{2,20}$/.test(data.extension)))throw new Error("Máy lẻ ITY không hợp lệ.");
  const values={name:data.name.trim().slice(0,150),email:data.email.toLowerCase().trim(),role:data.role,teamId:data.teamId||null,extension:data.extension||null};
  if(data.password && (typeof data.password!=="string"||data.password.length<8||data.password.length>100))throw new Error("Mật khẩu mới cần 8–100 ký tự.");
  if(data.id){await db.user.update({where:{id:data.id},data:{...values,...(data.password?{password:hashPassword(data.password)}:{})}});await db.session.deleteMany({where:{userId:data.id,...(data.id===user.id?{NOT:{id:(await import("@/lib/auth")).tokenHash((await (await import("next/headers")).cookies()).get("crm_session")?.value||"")}}:{})}});}
  else{if(!data.password)throw new Error("Nhập mật khẩu tài khoản mới.");await db.user.create({data:{...values,password:hashPassword(data.password)}});}
 }else throw new Error("Thao tác không hợp lệ.");
 return NextResponse.json({success:true});
 }catch(error){return NextResponse.json({error:error instanceof Error && !("code" in error)?error.message:"Không lưu được. Kiểm tra email / máy lẻ trùng."},{status:400});}
}
