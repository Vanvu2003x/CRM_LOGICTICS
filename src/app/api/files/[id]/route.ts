import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { requireUser,assertOwner } from "@/lib/auth";
import { db } from "@/lib/db";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
 try {
  const user=await requireUser();const {id}=await params;const file=await db.attachment.findUnique({where:{id},include:{order:true}});
  if(!file) return new Response("Không tìm thấy",{status:404});await assertOwner(user,file.order.salesId);
  return new Response(await readFile(file.path),{headers:{"Content-Type":file.mime,"Content-Disposition":"attachment; filename*=UTF-8''"+encodeURIComponent(file.filename),"X-Content-Type-Options":"nosniff","Cache-Control":"private, no-store"}});
 }catch{return NextResponse.json({error:"Không có quyền truy cập."},{status:403});}
}
