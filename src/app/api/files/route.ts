import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { ownedOrder } from "@/lib/crm-data";
import { db } from "@/lib/db";
export async function POST(request:Request) {
 try {
  const user=await requireUser();
  if (request.headers.get("origin") && new URL(request.headers.get("origin")!).host!==new URL(request.url).host) throw new Error("Yêu cầu không hợp lệ.");
  if(Number(request.headers.get("content-length"))>11000000) throw new Error("Tệp tối đa 10 MB.");
  const form=await request.formData();const file=form.get("file");const step=Number(form.get("step"));
  const order=await ownedOrder(user,String(form.get("order")));
  if(order.status!=="IN_PROGRESS" || ![4,8,9,11,12].includes(step)) throw new Error("Không thể tải tệp vào bước này.");
  if(!(file instanceof File) || file.size>10000000 || !file.size) throw new Error("Tệp tối đa 10 MB.");
  const bytes=Buffer.from(await file.arrayBuffer()); const ext=file.name.split(".").pop()?.toLowerCase();
  const signatures:Record<string,boolean>={pdf:bytes.subarray(0,5).toString()==="%PDF-",png:bytes.subarray(0,8).toString("hex")==="89504e470d0a1a0a",jpg:bytes[0]===255&&bytes[1]===216,jpeg:bytes[0]===255&&bytes[1]===216,xlsx:bytes[0]===80&&bytes[1]===75};
  if(!ext || !signatures[ext]) throw new Error("Chỉ chấp nhận PDF, PNG, JPG và XLSX đúng định dạng.");
  const kind=String(form.get("kind")||"OTHER");if(!["OTHER","BL","MBL","HBL","INV","PL","CO","DN","DO","AN","PHOTO","QUOTE","COST"].includes(kind))throw new Error("Loại chứng từ không hợp lệ.");
  const directory=join(process.cwd(),"uploads"); await mkdir(directory,{recursive:true});
  const path=join(directory,randomUUID()+"."+ext);await writeFile(path,bytes);
  await db.attachment.create({data:{orderId:order.id,step,kind,filename:file.name.replace(/[\\/\x00-\x1f]/g,"").slice(0,150),path,mime:ext==="pdf"?"application/pdf":ext==="png"?"image/png":ext==="xlsx"?"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":"image/jpeg"}});
  return NextResponse.json({success:true});
 } catch(error) {return NextResponse.json({error:error instanceof Error?error.message:"Không tải được tệp."},{status:400});}
}
