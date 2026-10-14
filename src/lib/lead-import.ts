import { isLeadPhone, normalizeLeadPhone } from "./phone";

export type LeadImportRow = { name:string;phone:string;email:string;company:string;companyFoundedAt:string;taxId:string;address:string;industry:string;needs:string };
export type LeadImportError = { row:number;name:string;phone:string;reason:string };

const clean = (value:unknown) => String(value ?? "").replace(/\s+/g," ").trim();
const key = (value:unknown) => clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/gi,"d").toLowerCase().replace(/[^a-z0-9]/g,"");
const aliases:Record<keyof LeadImportRow,string[]> = {
  name:["tennguoilienhe","tenkhach","hoten","name","contactname"],
  phone:["sodienthoai","dienthoai","sdt","phone","mobile"], email:["email","emailkhachhang","thuđientu","thudientu","mail"],
  company:["tencongty","congty","company"], companyFoundedAt:["ngaythanhlap","ngaythanhlapcongty","ngaythanhlapdn","companyfoundedat","foundedat"], taxId:["masothue","mst","taxid"],
  address:["diachi","diachicongty","address"], industry:["nganhnghe","industry"],
  needs:["nhucau","noidungtraodoi","nhucaunoidungtraodoi","needs","note"],
};

export const normalizeVietnamPhone = normalizeLeadPhone;

function normalizeCompanyFoundedAt(value:unknown) {
  const raw=clean(value);
  if(!raw)return "";
  if(/^\d+(\.\d+)?$/.test(raw)){
    const date=new Date(Date.UTC(1899,11,30)+Number(raw)*86400000);
    return Number.isNaN(date.getTime())?"":date.toISOString().slice(0,10);
  }
  const match=raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  const iso=raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const year=match?Number(match[3]):iso?Number(iso[1]):0;
  const month=match?Number(match[2]):iso?Number(iso[2]):0;
  const day=match?Number(match[1]):iso?Number(iso[3]):0;
  const date=new Date(Date.UTC(year,month-1,day));
  return year>=1900&&date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day?date.toISOString().slice(0,10):"";
}

export function parseLeadImportMatrix(matrix:unknown[][]) {
  if(!matrix.length)throw new Error("File Excel không có dữ liệu.");
  const headers=matrix[0].map(key);
  const indexes={} as Record<keyof LeadImportRow,number>;
  for(const field of Object.keys(aliases) as (keyof LeadImportRow)[])indexes[field]=headers.findIndex(item=>aliases[field].includes(item));
  if(indexes.name<0||indexes.phone<0)throw new Error("Không tìm thấy cột Tên người liên hệ và Số điện thoại.");
  const valid:LeadImportRow[]=[],errors:LeadImportError[]=[],phones=new Set<string>();
  matrix.slice(1).forEach((row,index)=>{
    if(!row.some(value=>clean(value)))return;
    const get=(field:keyof LeadImportRow)=>indexes[field]>=0?clean(row[indexes[field]]):"";
    const name=get("name"),phone=normalizeVietnamPhone(indexes.phone>=0?row[indexes.phone]:""),companyFoundedAt=normalizeCompanyFoundedAt(indexes.companyFoundedAt>=0?row[indexes.companyFoundedAt]:"");
    const problem=!name?"Thiếu tên người liên hệ":!isLeadPhone(phone)?"Thiếu hoặc sai số điện thoại":phones.has(phone)?"Trùng số điện thoại trong file":get("companyFoundedAt")&&!companyFoundedAt?"Ngày thành lập không hợp lệ":"";
    if(problem){errors.push({row:index+2,name,phone,reason:problem});return;}
    phones.add(phone);valid.push({name,phone,email:get("email"),company:get("company"),companyFoundedAt,taxId:get("taxId"),address:get("address"),industry:get("industry"),needs:get("needs")});
  });
  return {valid,errors};
}
