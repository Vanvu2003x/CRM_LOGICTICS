export type LeadImportRow = { name:string;phone:string;company:string;taxId:string;address:string;industry:string;needs:string;source:string };
export type LeadImportError = { row:number;name:string;phone:string;reason:string };

const clean = (value:unknown) => String(value ?? "").replace(/\s+/g," ").trim();
const key = (value:unknown) => clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/gi,"d").toLowerCase().replace(/[^a-z0-9]/g,"");
const aliases:Record<keyof LeadImportRow,string[]> = {
  name:["tennguoilienhe","tenkhach","hoten","name","contactname"],
  phone:["sodienthoai","dienthoai","sdt","phone","mobile"],
  company:["tencongty","congty","company"], taxId:["masothue","mst","taxid"],
  address:["diachi","diachicongty","address"], industry:["nganhnghe","industry"],
  needs:["nhucau","noidungtraodoi","nhucaunoidungtraodoi","needs","note"], source:["nguonkhach","nguon","source"],
};

export function normalizeVietnamPhone(value:unknown) {
  let digits=clean(value).replace(/\D/g,"");
  if(digits.startsWith("84")&&digits.length>=11)digits="0"+digits.slice(2);
  if(digits.length===9&&!digits.startsWith("0"))digits="0"+digits;
  return digits;
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
    const name=get("name"),phone=normalizeVietnamPhone(indexes.phone>=0?row[indexes.phone]:"");
    const problem=!name?"Thiếu tên người liên hệ":!/^0\d{9,10}$/.test(phone)?"Thiếu hoặc sai số điện thoại":phones.has(phone)?"Trùng số điện thoại trong file":"";
    if(problem){errors.push({row:index+2,name,phone,reason:problem});return;}
    phones.add(phone);valid.push({name,phone,company:get("company"),taxId:get("taxId"),address:get("address"),industry:get("industry"),needs:get("needs"),source:get("source")||"EXCEL"});
  });
  return {valid,errors};
}
