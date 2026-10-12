import { db } from "@/lib/db";
import { requireUser,permittedUserIds,assertOwner } from "@/lib/auth";
import { periodBounds } from "@/lib/business-rules";
import { todayInVietnam } from "@/lib/dashboard";
export async function GET(request:Request){
 try{
 const user=await requireUser(),query=new URL(request.url).searchParams;let ids=await permittedUserIds(user);
 if(query.get("sales")){await assertOwner(user,query.get("sales"));ids=[query.get("sales")!];}
 if(query.get("team")){const members=await db.user.findMany({where:{teamId:query.get("team")!},select:{id:true}});ids=members.map(u=>u.id).filter(id=>!ids||ids.includes(id));}
 const day=query.get("date")||todayInVietnam();if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error("Ngày không hợp lệ.");
 const {start,end}=periodBounds(day,query.get("period")||"day");
 const calls=await db.callLog.findMany({where:{...(ids?{salesId:{in:ids}}:{}),startedAt:{gte:start,lt:end}},include:{sales:{select:{name:true}}},orderBy:{startedAt:"desc"}});
 const escape=(value:unknown)=>'"'+String(value??"").replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
 const rows=[["Sales","Tên khách","Công ty","Điện thoại","Nhu cầu","Nội dung nhu cầu","Thời lượng (s)","Đàm thoại (s)","Số lần gọi trong kỳ","Thời điểm","Trạng thái","Mã đơn"],...calls.map(c=>[c.sales?.name,c.customerName,c.company,c.phone,c.demand,c.needs,c.duration,c.billsec,calls.filter(other=>other.phone===c.phone&&other.salesId===c.salesId).length,c.startedAt.toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"}),c.status,c.orderCode])];
 return new Response("\uFEFF"+rows.map(row=>row.map(escape).join(",")).join("\r\n"),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="ITY-calls.csv"',"Cache-Control":"private, no-store"}});
 }catch{return new Response("Không có quyền xuất báo cáo.",{status:403});}
}
