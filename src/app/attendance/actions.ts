"use server";
import { db } from "@/lib/db";
import { requireUser,assertOwner } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { automaticCheckoutAt, shouldAutoCloseAttendance } from "@/lib/attendance";
type GeoInput={latitude:number;longitude:number;accuracy:number};
function validGeo(value:GeoInput|undefined){
 if(!value)return undefined;
 if(!Number.isFinite(value.latitude)||value.latitude < -90||value.latitude > 90||!Number.isFinite(value.longitude)||value.longitude < -180||value.longitude > 180||!Number.isFinite(value.accuracy)||value.accuracy < 0||value.accuracy > 100000)throw new Error("Vị trí chấm công không hợp lệ.");
 return {latitude:value.latitude,longitude:value.longitude,accuracy:value.accuracy};
}
export async function checkIn(userId:string,location?:GeoInput) {
 try {const user=await requireUser();await assertOwner(user,userId);
 const geo=validGeo(location);
 const open=await db.attendance.findFirst({where:{userId,checkOut:null}});
 if(open){
  if(!shouldAutoCloseAttendance(open))throw new Error("Ca hiện tại chưa kết thúc.");
  await db.attendance.update({where:{id:open.id},data:{checkOut:automaticCheckoutAt(open.checkIn),closeType:"AUTO_END_OF_DAY",closeNote:"Tự kết thúc lúc 17:30 do nhân viên chưa chấm công ra."}});
 }
 await db.attendance.create({data:{userId,date:new Date(),checkIn:new Date(),...(geo?{checkInLatitude:geo.latitude,checkInLongitude:geo.longitude,checkInAccuracy:geo.accuracy}:{})}});
 revalidatePath("/attendance");
 revalidatePath("/social-kpi");
 return {success:true};
 }catch(error){return {success:false,error:error instanceof Error?error.message:"Không chấm công được."};}
}
export async function checkOut(id:string,location?:GeoInput) {
 try {const user=await requireUser();const attendance=await db.attendance.findUnique({where:{id}});
 if(!attendance || attendance.checkOut) throw new Error("Ca không tồn tại hoặc đã kết thúc.");
 await assertOwner(user,attendance.userId);
 const geo=validGeo(location);
 await db.attendance.update({where:{id},data:{checkOut:new Date(),closeType:"MANUAL",...(geo?{checkOutLatitude:geo.latitude,checkOutLongitude:geo.longitude,checkOutAccuracy:geo.accuracy}:{})}});
 revalidatePath("/attendance");revalidatePath("/social-kpi");return {success:true};
 }catch(error){return {success:false,error:error instanceof Error?error.message:"Không kết thúc được ca."};}
}
