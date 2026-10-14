import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { manager, requireUser } from "@/lib/auth";
import { parseLeadImportMatrix, type LeadImportRow } from "@/lib/lead-import";
import { requestHasAllowedOrigin } from "@/lib/request-origin";

const columns:(keyof LeadImportRow)[]=["name","phone","email","company","companyFoundedAt","taxId","address","industry","needs"];

export async function POST(request:Request) {
 try{
  const user=await requireUser();
  if(!manager(user))return NextResponse.json({error:"Chỉ Admin/Manager được import data khách hàng."},{status:403});
  if(!requestHasAllowedOrigin(request))return NextResponse.json({error:"Nguồn gửi yêu cầu không được phép."},{status:403});
  if(Number(request.headers.get("content-length"))>2_000_000)throw new Error("File có quá nhiều dữ liệu.");
  const body=await request.json() as {filename?:unknown;rows?:unknown};
  if(!Array.isArray(body.rows)||!body.rows.length||body.rows.length>2000)throw new Error("Mỗi lần import từ 1 đến 2.000 khách hàng.");
  const parsed=parseLeadImportMatrix([columns,...body.rows.map(row=>columns.map(column=>(row as Record<string,unknown>)?.[column]))]);
  const duplicateErrors=parsed.errors.filter(item=>item.reason==="Trùng số điện thoại trong file");
  const invalidErrors=parsed.errors.filter(item=>item.reason!=="Trùng số điện thoại trong file");
  if(invalidErrors.length)throw new Error(`Còn ${invalidErrors.length} dòng không hợp lệ. Kiểm tra lại trước khi nhập.`);
  const fileDuplicateCount=duplicateErrors.length;
  const phones=parsed.valid.map(row=>row.phone),taxIds=parsed.valid.map(row=>row.taxId).filter(Boolean);
  const existing=await db.lead.findMany({where:{OR:[{phone:{in:phones}},...(taxIds.length?[{taxId:{in:taxIds}}]:[])]},select:{phone:true,taxId:true}});
  const existingPhones=new Set(existing.map(item=>item.phone)),existingTaxes=new Set(existing.map(item=>item.taxId).filter(Boolean));
  const fresh=parsed.valid.filter(row=>!existingPhones.has(row.phone)&&(!row.taxId||!existingTaxes.has(row.taxId)));
  const filename=typeof body.filename==="string"?body.filename.replace(/[\\/\x00-\x1f]/g,"").slice(0,160)||"data-khach-hang.xlsx":"data-khach-hang.xlsx";
  const batch=await db.$transaction(async tx=>{
   const created=await tx.leadImportBatch.create({data:{filename,source:"COMPANY",totalRows:parsed.valid.length+fileDuplicateCount,importedRows:fresh.length,duplicateRows:fileDuplicateCount+parsed.valid.length-fresh.length,createdById:user.id}});
   for(const row of fresh)await tx.lead.create({data:{...row,email:row.email||null,company:row.company||null,companyFoundedAt:row.companyFoundedAt?new Date(`${row.companyFoundedAt}T12:00:00+07:00`):null,taxId:row.taxId||null,address:row.address||null,industry:row.industry||null,needs:row.needs||null,source:"COMPANY",salesId:null,interestState:"UNKNOWN",callOutcome:"UNKNOWN",isInterested:false,status:"NEW",importBatchId:created.id}});
   return created;
  },{maxWait:10000,timeout:120000});
  return NextResponse.json({success:true,batchId:batch.id,imported:fresh.length,duplicates:fileDuplicateCount+parsed.valid.length-fresh.length});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Không import được dữ liệu."},{status:400});}
}
