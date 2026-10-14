"use client";
import { useState } from "react";
import { Download, Plus, Save, CheckCircle2, Upload, Trash2 } from "lucide-react";
import { useDemoData } from "@/components/demo/DemoDataProvider";
import type { DemoOrder } from "@/lib/demo-crm";
import { readJson, type StepFields } from "@/lib/business-rules";
import { exportPdf } from "@/lib/export-pdf";
import {
 calculateImportQuoteLine, calculateImportQuoteTotals, importQuoteIncoterms, importQuoteTemplate,
 inferExchangeRate, parseImportQuoteMatrix, type ImportQuoteCategory, type ImportQuoteLine, type ImportQuoteMode,
} from "@/lib/import-quote";
type Field = [string,string,string?];
const formFields: Record<number,Field[]> = {
 1:[["contactDate","Ngày liên hệ","date"],["needs","Nhu cầu khách"],["followUpAt","Ngày chăm sóc tiếp theo","date"],["notes","Nội dung trao đổi"]],
 2:[["type","Loại đơn","EXPORT|IMPORT"],["exportPort","Cảng xuất"],["importPort","Cảng nhập"],["transportMethod","Phương thức","FCL|LCL|AIR|CPN|BỘ TN|BỘ CN"],["expectedDate","Ngày dự kiến","date"],["itemName","Tên hàng"],["quantity","Số lượng"],["pickupLocation","Nơi lấy hàng"],["deliveryLocation","Nơi giao hàng"],["incoterms","Điều kiện","EXW|FCA|FOB|CIF|CIP|CFR|DDU|DDP|DAP|Bộ CN|Bộ TN|CPN"],["notes","Ghi chú"]],
 5:[["decision","Phản hồi","GREEN|YELLOW|RED"],["reason","Lý do / ghi chú phản hồi"]],
 6:[["etd","ETD","date"],["eta","ETA","date"],["line","Hãng vận chuyển"],["price","Giá booking","number"],["currency","Tiền tệ","USD|VND"]],
 8:[["carrier","Đơn vị xe"],["price","Giá xe","number"],["pickupAt","Thời gian lấy hàng","datetime-local"],["vehicle","Biển số xe"],["delivered","Đã giao hàng","checkbox"],["notes","Ghi chú"]],
 9:[["shipper","Shipper (XK)"],["consignee","Consignee (XK)"],["notify","Notify party (XK)"],["vessel","Vessel / Voyage (XK)"],["goods","Mô tả hàng (XK)"],["mnfAt","Hạn nộp MNF","datetime-local"],["documentsDone","Đã kiểm tra đủ chứng từ","checkbox"]],
 10:[["declaration","Số tờ khai"],["lane","Luồng","GREEN|YELLOW|RED"],["customsStatus","Trạng thái","PROCESSING|WAITING|CLEARED"],["notes","Ghi chú hải quan"]],
 11:[["carrier","Đơn vị xe"],["price","Giá xe","number"],["pickupAt","Thời gian lấy hàng","datetime-local"],["vehicle","Biển số xe"],["delivered","Đã giao hàng","checkbox"],["notes","Ghi chú"]],
 13:[["invoiceNumber","Số hóa đơn"],["amount","Giá trị hóa đơn","number"],["currency","Tiền tệ","VND|USD"],["dueDate","Hạn thanh toán","date"],["invoiceIssued","Đã phát hành hóa đơn","checkbox"],["paid","Đã nhận đủ tiền","checkbox"],["notes","Ghi chú thanh toán"]]
};
type Line = ImportQuoteLine;
type QuotePrice = {name:string;price:number};
type Quote = {company:string;prices:QuotePrice[];line:string;validUntil:string;space:string;transitTime:string};
const defaultLines: Line[] = [{name:"",unit:"",price:0,quantity:1,category:"FREIGHT",vatRate:0,fixedVnd:0,note:""}];
const normalizeLine = (line:Partial<Line>):Line => ({
 name:String(line.name||""),unit:String(line.unit||""),price:Number(line.price||0),quantity:Number(line.quantity||1),
 category:line.category||"FREIGHT",vatRate:Number(line.vatRate||0),fixedVnd:Number(line.fixedVnd||0),note:String(line.note||""),
});
const normalizeQuote = (quote:Partial<Quote> & {price?:number;currency?:string}):Quote => ({
 company:String(quote.company||""),
 prices:Array.isArray(quote.prices)&&quote.prices.length?quote.prices.map(item=>({name:String(item.name||""),price:Number(item.price||0)})):[{name:"",price:Number(quote.price||0)}],
 line:String(quote.line||""),validUntil:String(quote.validUntil||""),space:String(quote.space||""),transitTime:String(quote.transitTime||""),
});
const control = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const labels: Record<string,string> = {EXPORT:"Xuất khẩu",IMPORT:"Nhập khẩu",ACCEPT:"Khách đồng ý",RETURN:"Quay lại sửa thông tin",FAIL:"Đóng đơn thất bại",GREEN:"Xanh · Khách đồng ý",YELLOW:"Vàng · Cần sửa báo giá",RED:"Đỏ · Không tiếp tục",PROCESSING:"Đang xử lý",WAITING:"Chờ xử lý",CLEARED:"Đã thông quan"};
const quoteCategoryLabels:Record<ImportQuoteCategory,string>={FREIGHT:"Cước quốc tế",ORIGIN:"Phí đầu nước ngoài",VIETNAM:"Phí tại Việt Nam"};
const quoteCategoryStyles:Record<ImportQuoteCategory,string>={FREIGHT:"bg-blue-50 text-blue-700",ORIGIN:"bg-amber-50 text-amber-700",VIETNAM:"bg-emerald-50 text-emerald-700"};
export default function OrderStepEditor({order,step,onAdvance}:{order:DemoOrder;step:number;onAdvance:(step:number)=>void}) {
 const {mutate,agents,refresh} = useDemoData();
 const [values,setValues] = useState<StepFields>(()=>({
  type:order.type,
  quoteMode:String(order.data?.[step]?.quoteMode||order.data?.[2]?.transportMethod||"FCL").toUpperCase()==="LCL"?"LCL":"FCL",
  quoteIncoterm:String(order.data?.[step]?.quoteIncoterm||order.data?.[2]?.incoterms||"EXW").toUpperCase(),
  exchangeRate:Number(order.data?.[step]?.exchangeRate||26600),
  ...order.data?.[step],
 }));
 const [lines,setLines] = useState<Line[]>(()=>readJson<Partial<Line>[]>(String(order.data?.[step]?.lines || ""),defaultLines).map(normalizeLine));
  const [quotes,setQuotes] = useState<Quote[]>(()=>readJson<(Partial<Quote> & {price?:number;currency?:string})[]>(String(order.data?.[3]?.quotes || ""),[{company:"",price:0,line:"",validUntil:"",space:"",transitTime:""},{company:"",price:0,line:"",validUntil:"",space:"",transitTime:""},{company:"",price:0,line:"",validUntil:"",space:"",transitTime:""}]).map(normalizeQuote));
 const [busy,setBusy] = useState(false);
 const [message,setMessage] = useState("");
 const locked = order.status !== "IN_PROGRESS" || step>order.step;
 const isImportQuote = step===4 && order.type==="IMPORT";
 const quoteMode = (String(values.quoteMode||"FCL")==="LCL"?"LCL":"FCL") as ImportQuoteMode;
 const exchangeRate = Math.max(1,Number(values.exchangeRate||26600));
 const importTotals = calculateImportQuoteTotals(lines,exchangeRate);
 const set = (key:string,value:StepFields[string])=>setValues(old=>({...old,[key]:value}));
 const updateLine=(index:number,key:keyof Line,value:string|number)=>{setLines(old=>old.map((item,i)=>i===index?{...item,[key]:value}:item));set("pdfExported",false);};
  const updateQuote=(index:number,patch:Partial<Quote>)=>setQuotes(old=>old.map((item,i)=>i===index?{...item,...patch}:item));
  const updateQuotePrice=(quoteIndex:number,priceIndex:number,patch:Partial<QuotePrice>)=>setQuotes(old=>old.map((item,i)=>i===quoteIndex?{...item,prices:item.prices.map((price,index)=>index===priceIndex?{...price,...patch}:price)}:item));
  const addQuotePrice=(quoteIndex:number)=>setQuotes(old=>old.map((item,i)=>i===quoteIndex?{...item,prices:[...item.prices,{name:"",price:0}]}:item));
  const removeQuotePrice=(quoteIndex:number,priceIndex:number)=>setQuotes(old=>old.map((item,i)=>i===quoteIndex?{...item,prices:item.prices.length>1?item.prices.filter((_,index)=>index!==priceIndex):item.prices}:item));
 const removeLine=(index:number)=>{setLines(old=>old.filter((_,i)=>i!==index));set("pdfExported",false);};
 const addLine=()=>{setLines(old=>[...old,normalizeLine({category:isImportQuote?"VIETNAM":"FREIGHT"})]);set("pdfExported",false);};
 const selectQuoteMode=(mode:ImportQuoteMode)=>{const available=importQuoteIncoterms(mode);setValues(old=>({...old,quoteMode:mode,quoteIncoterm:available.includes(String(old.quoteIncoterm))?old.quoteIncoterm:available[0],pdfExported:false}));};
 const payload = ()=>({...values,...(step===3?{quotes:JSON.stringify(quotes)}:{}),...([4,12].includes(step)?{lines:JSON.stringify(lines)}:{})});
 async function save(complete=false) {
  setBusy(true);
  const result = await mutate(complete && step===5 ? "order.feedback" : complete?"order.complete":"order.save",order.id,{...payload(),step});
  setBusy(false);
  if(result.error) setMessage(String(result.error)); else {setMessage(complete?"Đã hoàn tất bước":"Đã lưu dữ liệu"); if(complete) onAdvance(Number(result.step || order.step));}
 }
 async function pdf() {
  const title=isImportQuote?`BÁO GIÁ NHẬP KHẨU ${quoteMode}`:step===4?"BÁO GIÁ LOGISTICS":"BẢNG KÊ CHI PHÍ";
  const quoteDetails=isImportQuote?[
   `Loại hình: ${quoteMode} · Điều kiện: ${String(values.quoteIncoterm||"")}`,
   `Tỷ giá tạm tính: 1 USD = ${exchangeRate.toLocaleString("vi-VN")} VND`,
   ...lines.map(line=>{const amount=calculateImportQuoteLine(line,exchangeRate);return `${line.name} · ${line.quantity} ${line.unit} × ${line.price.toLocaleString("vi-VN")} USD = ${amount.usd.toLocaleString("vi-VN")} USD / ${Math.round(amount.vnd).toLocaleString("vi-VN")} VND${line.vatRate?` (VAT ${line.vatRate}%)`:""}`;}),
   `Tổng USD: ${importTotals.usd.toLocaleString("vi-VN")}`,
   `Tổng quy đổi: ${Math.round(importTotals.vnd).toLocaleString("vi-VN")} VND`,
  ]:[
   ...lines.map(line=>line.name+" · "+line.unit+" · "+line.quantity+" × "+line.price+" = "+(line.price*line.quantity).toLocaleString("vi-VN")),
   "Tổng: "+lines.reduce((sum,line)=>sum+line.price*line.quantity,0).toLocaleString("vi-VN")+" "+String(values.currency||"USD")
  ];
  const blob=await exportPdf(title,[
   "Mã đơn: "+order.id,"Khách hàng: "+order.customer,
   ...quoteDetails,
  ],order.id+"-"+step+".pdf");
  const uploaded=await upload(new File([blob],order.id+"-"+step+".pdf",{type:"application/pdf"}),step===4?"QUOTE":"COST");
  set("pdfExported",uploaded);
 }
 async function importExcel(file:File) {
  try{
  if(file.size>5000000){setMessage("Excel tối đa 5 MB.");return;}
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer());
  if(isImportQuote){
   const incoterm=String(values.quoteIncoterm||"EXW").toUpperCase();
   const sheet=workbook.Sheets[incoterm];
   if(!sheet){setMessage(`File không có sheet ${incoterm}. Các sheet hiện có: ${workbook.SheetNames.join(", ")}.`);return;}
   const matrix=XLSX.utils.sheet_to_json<unknown[]>(sheet,{header:1,raw:true,defval:""});
   const formulas:Record<string,string>={};
   Object.entries(sheet).forEach(([address,cell])=>{if(!address.startsWith("!") && typeof cell.f==="string") formulas[address]=cell.f;});
   const imported=parseImportQuoteMatrix(matrix,formulas);
   if(!imported.length){setMessage("Không tìm thấy dòng chi phí trong sheet đã chọn. Hãy dùng đúng mẫu FCL/LCL của CRM.");return;}
   const detectedMode:ImportQuoteMode=imported.some(line=>/cbm|rt|khối/i.test(line.unit))?"LCL":imported.some(line=>/cont|dc|hc|ot/i.test(line.unit))?"FCL":quoteMode;
   setLines(imported);set("quoteMode",detectedMode);set("exchangeRate",inferExchangeRate(formulas,exchangeRate));set("currency","USD");set("pdfExported",false);
   setMessage(`Đã nhập ${imported.length} khoản phí từ sheet ${incoterm} (${detectedMode}). Kiểm tra tỷ giá và số tiền trước khi lưu.`);return;
  }
  const rows = XLSX.utils.sheet_to_json<Record<string,unknown>>(workbook.Sheets[workbook.SheetNames[0]]);
  if(step===9){if(!rows.length||!rows[0].shipper||!rows[0].consignee||!rows[0].goods){setMessage("Mẫu B/L cần shipper, consignee, notify, vessel, goods.");return;}const row=rows[0];setValues(old=>({...old,...Object.fromEntries(["shipper","consignee","notify","vessel","goods"].map(k=>[k,String(row[k]||"")]))}));setMessage("Đã nhập dữ liệu B/L. Kiểm tra và lưu.");return;}
  if (!rows.length || rows.length>200 || rows.some(row=>!row.name || !Number.isFinite(Number(row.price)) || !Number.isFinite(Number(row.quantity)) || Number(row.price)<0 || Number(row.quantity)<=0)) {
   setMessage("Excel cần các cột name, unit, price, quantity; tối đa 200 dòng, giá ≥ 0 và số lượng > 0."); return;
  }
  setLines(rows.map(row=>normalizeLine({name:String(row.name),unit:String(row.unit||""),price:Number(row.price),quantity:Number(row.quantity)})));
  set("pdfExported",false); setMessage("Đã nhập Excel. Kiểm tra rồi lưu.");
  }catch{setMessage("Không đọc được Excel. Hãy tải mẫu Excel và kiểm tra lại định dạng tệp.");}
 }
 async function template() {
  const XLSX=await import("xlsx"); const workbook=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook,XLSX.utils.json_to_sheet(step===9?[{shipper:"",consignee:"",notify:"",vessel:"",goods:""}]:defaultLines),step===9?"Bill of Lading":"Chi phí");
  XLSX.writeFile(workbook,step===9?"CRM-mau-BL.xlsx":"CRM-mau-chi-phi.xlsx");
 }
 async function upload(file:File,kind=String(values.docKind||"OTHER")) {
  setBusy(true); const form=new FormData();form.set("file",file);form.set("order",order.id);form.set("step",String(step));form.set("kind",kind);
  const response=await fetch("/api/files",{method:"POST",body:form});const result=await response.json();
  setMessage(response.ok?"Đã lưu chứng từ":result.error);await refresh();setBusy(false);return response.ok;
 }
 async function billOfLading(){
 const blob=await exportPdf("BILL OF LADING",["Mã đơn: "+order.id,"Khách hàng: "+order.customer,...["shipper","consignee","notify","vessel","goods"].map(key=>key+": "+String(values[key]||"")),"POL: "+String(order.data?.[2]?.exportPort||""),"POD: "+String(order.data?.[2]?.importPort||"")],order.id+"-BL.pdf");
 await upload(new File([blob],order.id+"-BL.pdf",{type:"application/pdf"}),"BL");
 }
 return <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4"><div><p className="font-semibold text-slate-900">Thông tin xử lý · Bước {step}</p><p className="mt-1 text-xs text-slate-500">Dữ liệu được lưu theo đơn hàng. {locked?"Đơn đã đóng.":"Có thể lưu nháp trước khi hoàn tất."}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">{order.completedSteps?.includes(step)?"Đã hoàn tất":"Đang xử lý"}</span></div>
  <fieldset disabled={locked||busy} className="space-y-5 disabled:opacity-70">
  <div className="grid gap-4 sm:grid-cols-2">{step===5&&<div className="space-y-2 sm:col-span-2"><span className="text-xs font-medium text-slate-600">Phản hồi của khách</span><div className="grid gap-2 sm:grid-cols-3"><button type="button" aria-pressed={values.decision==="GREEN"} onClick={()=>set("decision","GREEN")} className={`rounded-xl border-2 px-4 py-3 text-left transition ${values.decision==="GREEN"?"border-emerald-500 bg-emerald-100 text-emerald-800 ring-2 ring-emerald-200":"border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400"}`}><span className="block text-sm font-bold">Xanh · OK</span><span className="mt-1 block text-[11px]">Khách đồng ý</span></button><button type="button" aria-pressed={values.decision==="YELLOW"} onClick={()=>set("decision","YELLOW")} className={`rounded-xl border-2 px-4 py-3 text-left transition ${values.decision==="YELLOW"?"border-amber-500 bg-amber-100 text-amber-800 ring-2 ring-amber-200":"border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400"}`}><span className="block text-sm font-bold">Vàng · Đang cân nhắc</span><span className="mt-1 block text-[11px]">Cần theo dõi thêm</span></button><button type="button" aria-pressed={values.decision==="RED"} onClick={()=>set("decision","RED")} className={`rounded-xl border-2 px-4 py-3 text-left transition ${values.decision==="RED"?"border-rose-500 bg-rose-100 text-rose-800 ring-2 ring-rose-200":"border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-400"}`}><span className="block text-sm font-bold">Đỏ · Fail</span><span className="mt-1 block text-[11px]">Khách không tiếp tục</span></button></div></div>}{formFields[step]?.filter(([key])=>!(step===5&&key==="decision")).map(([key,label,type])=><label key={key} className="space-y-1.5 text-xs font-medium text-slate-600"><span>{label}</span>{type==="checkbox"?<div className="flex items-center gap-2 rounded-lg border p-3"><input type="checkbox" checked={values[key]===true} onChange={e=>set(key,e.target.checked)}/><span>Xác nhận</span></div>:type?.includes("|")?<select className={control} value={String(values[key]||"")} onChange={e=>set(key,e.target.value)}><option value="">Chọn...</option>{type.split("|").map(option=><option key={option} value={option}>{labels[option]||option}</option>)}</select>:<input className={control} type={type||"text"} value={String(values[key]??"")} onChange={e=>set(key,type==="number"?Number(e.target.value):e.target.value)}/>}</label>)}</div>
  {step===7&&<label className="block space-y-2 text-sm">Đại lý phụ trách<select className={control} value={String(values.agentId||"")} onChange={e=>set("agentId",e.target.value)}><option value="">Chọn đại lý đang hoạt động</option>{agents.filter(agent=>agent.status==="ACTIVE").map(agent=><option key={agent.id} value={agent.id}>{agent.name} · {agent.country}</option>)}</select></label>}
   {step===3&&<div className="space-y-3"><div><p className="text-xs text-slate-500">So sánh từ 3–5 đơn vị. Mỗi đơn vị có thể thêm nhiều dòng báo giá.</p><p className="mt-1 text-[11px] text-slate-400">Line, hiệu lực giá, space và transit time dùng chung cho từng đơn vị.</p></div><div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">{quotes.map((quote,index)=><article key={index} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-semibold text-slate-500">Đơn vị {index+1}</span><span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">Báo giá</span></div><label className="block text-[10px] font-medium text-slate-500">Tên công ty<input aria-label={"Tên công ty "+(index+1)} className={`${control} mt-1 h-9 px-2 text-xs`} placeholder="Tên công ty" value={quote.company} onChange={e=>updateQuote(index,{company:e.target.value})}/></label><div className="mt-3 rounded-lg border border-blue-100 bg-white p-2"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-semibold text-slate-600">Các dòng báo giá</span><button type="button" aria-label={"Thêm dòng báo giá "+(index+1)} className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800" onClick={()=>addQuotePrice(index)}><Plus size={13}/>Thêm dòng</button></div><div className="space-y-2">{quote.prices.map((price,priceIndex)=><div key={priceIndex} className="grid grid-cols-[minmax(0,1fr)_92px_auto] items-end gap-1"><label className="min-w-0 text-[10px] text-slate-500">Tên<input aria-label={`Tên báo giá ${index+1}-${priceIndex+1}`} className={`${control} mt-1 h-8 px-2 text-xs`} placeholder="Cước biển" value={price.name} onChange={e=>updateQuotePrice(index,priceIndex,{name:e.target.value})}/></label><label className="min-w-0 text-[10px] text-slate-500">Giá (VND)<input aria-label={`Giá báo giá VND ${index+1}-${priceIndex+1}`} className={`${control} mt-1 h-8 px-2 text-xs`} type="number" min="0" value={price.price} onChange={e=>updateQuotePrice(index,priceIndex,{price:Number(e.target.value)})}/></label><button type="button" aria-label="Xóa dòng báo giá" disabled={quote.prices.length===1} className="h-8 px-1 text-slate-400 hover:text-rose-600 disabled:opacity-30" onClick={()=>removeQuotePrice(index,priceIndex)}><Trash2 size={13}/></button></div>)}</div></div><div className="mt-2 grid grid-cols-2 gap-2"><label className="min-w-0 text-[10px] font-medium text-slate-500">Line<input aria-label={"Line "+(index+1)} className={`${control} mt-1 h-9 px-2 text-xs`} placeholder="Hãng tàu" value={quote.line} onChange={e=>updateQuote(index,{line:e.target.value})}/></label><label className="min-w-0 text-[10px] font-medium text-slate-500">Hiệu lực giá<input aria-label={"Hiệu lực giá "+(index+1)} className={`${control} mt-1 h-9 px-2 text-xs`} type="date" value={quote.validUntil} onChange={e=>updateQuote(index,{validUntil:e.target.value})}/></label><label className="min-w-0 text-[10px] font-medium text-slate-500">Space<input aria-label={"Space "+(index+1)} className={`${control} mt-1 h-9 px-2 text-xs`} placeholder="2x40HQ" value={quote.space} onChange={e=>updateQuote(index,{space:e.target.value})}/></label><label className="min-w-0 text-[10px] font-medium text-slate-500">Transit time<input aria-label={"Transit time "+(index+1)} className={`${control} mt-1 h-9 px-2 text-xs`} placeholder="7–10 ngày" value={quote.transitTime} onChange={e=>updateQuote(index,{transitTime:e.target.value})}/></label></div></article>)}</div>{quotes.length<5&&<button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-800" onClick={()=>setQuotes(old=>[...old,{company:"",prices:[{name:"",price:0}],line:"",validUntil:"",space:"",transitTime:""}])}>+ Thêm đơn vị</button>}</div>}
  {[4,12].includes(step)&&<div className="space-y-4">
   {isImportQuote&&<div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 sm:p-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
     <div><p className="text-sm font-semibold text-slate-900">Mẫu báo giá nhập khẩu</p><p className="mt-1 text-xs leading-5 text-slate-500">Chọn đúng loại hàng và điều kiện giá trước khi nhập file Excel của khách.</p></div>
     <div className="grid grid-cols-2 gap-2 sm:flex">
      {(["FCL","LCL"] as ImportQuoteMode[]).map(mode=><button type="button" key={mode} onClick={()=>selectQuoteMode(mode)} className={`rounded-xl border px-4 py-2 text-left transition ${quoteMode===mode?"border-blue-600 bg-blue-600 text-white shadow-sm":"border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`}><strong className="block text-sm">{mode}</strong><span className={`text-[11px] ${quoteMode===mode?"text-blue-100":"text-slate-400"}`}>{mode==="FCL"?"Nguyên container":"Hàng lẻ / CBM"}</span></button>)}
     </div>
    </div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[160px_220px_1fr]">
     <label className="space-y-1.5 text-xs font-medium text-slate-600"><span>Điều kiện giá</span><select className={control} value={String(values.quoteIncoterm||"EXW")} onChange={e=>{set("quoteIncoterm",e.target.value);set("pdfExported",false);}}>{importQuoteIncoterms(quoteMode).map(item=><option key={item}>{item}</option>)}</select></label>
     <label className="space-y-1.5 text-xs font-medium text-slate-600"><span>Tỷ giá tạm tính (VND/USD)</span><input className={control} type="number" min="1" value={exchangeRate} onChange={e=>{set("exchangeRate",Number(e.target.value));set("pdfExported",false);}}/></label>
     <div className="flex items-end"><a href={importQuoteTemplate(quoteMode)} download className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50"><Download size={16}/>Tải mẫu {quoteMode} gốc</a></div>
    </div>
   </div>}
   <div className="flex flex-wrap gap-2 text-xs">
    {!isImportQuote&&<button type="button" className="flex items-center gap-1 rounded-lg border px-3 py-2" onClick={template}><Download size={14}/> Tải mẫu Excel</button>}
    <label className="flex cursor-pointer items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700"><Upload size={14}/> {isImportQuote?`Nhập báo giá ${quoteMode}`:"Nhập Excel"}<input className="hidden" type="file" accept=".xlsx,.xls" onChange={e=>{if(e.target.files?.[0])void importExcel(e.target.files[0]);e.currentTarget.value="";}}/></label>
    {!isImportQuote&&<select aria-label="Tiền tệ" className="rounded-lg border px-2" value={String(values.currency||"USD")} onChange={e=>set("currency",e.target.value)}><option>USD</option><option>VND</option></select>}
   </div>
   <p className="text-xs leading-5 text-slate-500">{isImportQuote?"CRM đọc đúng sheet điều kiện giá, tách nhóm phí, áp dụng tỷ giá và VAT 8% theo công thức trong mẫu. Mọi dòng vẫn có thể sửa trước khi lưu.":"Các khoản phí là dữ liệu của từng đơn: có thể sửa, thêm hoặc xóa trước khi lưu và xuất PDF."}</p>
   {isImportQuote?<>
    <div className="space-y-3 md:hidden">{lines.map((line,index)=>{const amount=calculateImportQuoteLine(line,exchangeRate);return <div key={index} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
     <div className="flex items-center justify-between gap-2"><select aria-label={`Nhóm phí ${index+1}`} className={`rounded-lg border-0 px-2 py-1 text-xs font-medium ${quoteCategoryStyles[line.category]}`} value={line.category} onChange={e=>updateLine(index,"category",e.target.value as ImportQuoteCategory)}>{Object.entries(quoteCategoryLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select><button type="button" aria-label="Xóa phí" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={()=>removeLine(index)}><Trash2 size={15}/></button></div>
     <input aria-label={`Khoản phí ${index+1}`} className={`${control} mt-3 font-medium`} value={line.name} placeholder="Tên khoản phí" onChange={e=>updateLine(index,"name",e.target.value)}/>
     <div className="mt-2 grid grid-cols-3 gap-2"><input aria-label={`ĐVT ${index+1}`} className={control} value={line.unit} placeholder="ĐVT" onChange={e=>updateLine(index,"unit",e.target.value)}/><input aria-label={`Số lượng ${index+1}`} className={control} type="number" min="0" step="any" value={line.quantity} onChange={e=>updateLine(index,"quantity",Number(e.target.value))}/><input aria-label={`Đơn giá USD ${index+1}`} className={control} type="number" min="0" step="any" value={line.price} onChange={e=>updateLine(index,"price",Number(e.target.value))}/></div>
     <div className="mt-2 grid grid-cols-2 gap-2"><label className="text-[11px] text-slate-500">VAT %<input className={`${control} mt-1`} type="number" min="0" value={line.vatRate} onChange={e=>updateLine(index,"vatRate",Number(e.target.value))}/></label><label className="text-[11px] text-slate-500">VND cố định<input className={`${control} mt-1`} type="number" min="0" value={line.fixedVnd} onChange={e=>updateLine(index,"fixedVnd",Number(e.target.value))}/></label></div>
     <input aria-label={`Ghi chú ${index+1}`} className={`${control} mt-2`} value={line.note} placeholder="Ghi chú" onChange={e=>updateLine(index,"note",e.target.value)}/><div className="mt-3 flex justify-between border-t pt-2 text-xs"><span>{amount.usd.toLocaleString("vi-VN")} USD</span><strong>{Math.round(amount.vnd).toLocaleString("vi-VN")} VND</strong></div>
    </div>})}</div>
    <div className="hidden overflow-x-auto rounded-xl border md:block"><table className="w-full min-w-[1180px] text-xs"><thead><tr className="bg-slate-50 text-left text-slate-600"><th className="p-3">Nhóm phí</th><th>Khoản phí</th><th>ĐVT</th><th>SL</th><th>Đơn giá USD</th><th>VAT</th><th>VND cố định</th><th>Thành tiền USD</th><th>Quy đổi VND</th><th>Ghi chú</th><th/></tr></thead><tbody>{lines.map((line,index)=>{const amount=calculateImportQuoteLine(line,exchangeRate);return <tr key={index} className="border-t align-top"><td className="p-2"><select aria-label={`Nhóm phí ${index+1}`} className={`rounded-lg border-0 px-2 py-2 text-xs font-medium ${quoteCategoryStyles[line.category]}`} value={line.category} onChange={e=>updateLine(index,"category",e.target.value as ImportQuoteCategory)}>{Object.entries(quoteCategoryLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></td><td className="p-2"><input aria-label={`Khoản phí ${index+1}`} className={`${control} min-w-56`} value={line.name} onChange={e=>updateLine(index,"name",e.target.value)}/></td><td className="p-2"><input aria-label={`ĐVT ${index+1}`} className={`${control} w-24`} value={line.unit} onChange={e=>updateLine(index,"unit",e.target.value)}/></td><td className="p-2"><input aria-label={`Số lượng ${index+1}`} className={`${control} w-20`} type="number" min="0" step="any" value={line.quantity} onChange={e=>updateLine(index,"quantity",Number(e.target.value))}/></td><td className="p-2"><input aria-label={`Đơn giá USD ${index+1}`} className={`${control} w-28`} type="number" min="0" step="any" value={line.price} onChange={e=>updateLine(index,"price",Number(e.target.value))}/></td><td className="p-2"><input aria-label={`VAT ${index+1}`} className={`${control} w-20`} type="number" min="0" value={line.vatRate} onChange={e=>updateLine(index,"vatRate",Number(e.target.value))}/></td><td className="p-2"><input aria-label={`VND cố định ${index+1}`} className={`${control} w-32`} type="number" min="0" value={line.fixedVnd} onChange={e=>updateLine(index,"fixedVnd",Number(e.target.value))}/></td><td className="whitespace-nowrap p-3 text-right font-medium">{amount.usd.toLocaleString("vi-VN")}</td><td className="whitespace-nowrap p-3 text-right font-semibold text-blue-700">{Math.round(amount.vnd).toLocaleString("vi-VN")}</td><td className="p-2"><input aria-label={`Ghi chú ${index+1}`} className={`${control} min-w-48`} value={line.note} onChange={e=>updateLine(index,"note",e.target.value)}/></td><td className="p-3"><button type="button" aria-label="Xóa phí" className="text-slate-400 hover:text-red-600" onClick={()=>removeLine(index)}><Trash2 size={15}/></button></td></tr>})}</tbody></table></div>
   </>:<div className="overflow-x-auto"><table className="w-full min-w-[560px] text-xs"><thead><tr className="bg-slate-50 text-left"><th className="p-2">Khoản phí</th><th>ĐVT</th><th>Đơn giá</th><th>Số lượng</th><th>Thành tiền</th><th/></tr></thead><tbody>{lines.map((line,index)=><tr key={index} className="border-b">{(["name","unit","price","quantity"] as const).map(key=><td key={key} className="p-1"><input aria-label={key+" "+(index+1)} className={control} type={key==="price"||key==="quantity"?"number":"text"} value={line[key]} onChange={e=>updateLine(index,key,key==="price"||key==="quantity"?Number(e.target.value):e.target.value)}/></td>)}<td className="whitespace-nowrap px-2 text-right">{(line.price*line.quantity).toLocaleString("vi-VN")}</td><td><button type="button" aria-label="Xóa phí" onClick={()=>removeLine(index)}><Trash2 size={14}/></button></td></tr>)}</tbody></table></div>}
   <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><button type="button" className="flex items-center gap-1 text-sm font-medium text-blue-600" onClick={addLine}><Plus size={15}/>Thêm khoản phí</button>{isImportQuote?<div className="text-right"><p className="text-xs text-slate-500">Tổng báo giá</p><p className="font-semibold text-slate-900">{importTotals.usd.toLocaleString("vi-VN")} USD</p><p className="text-sm font-semibold text-blue-700">{Math.round(importTotals.vnd).toLocaleString("vi-VN")} VND</p></div>:<strong>{lines.reduce((sum,line)=>sum+line.price*line.quantity,0).toLocaleString("vi-VN")} {String(values.currency||"USD")}</strong>}</div>
   <button type="button" className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50" onClick={pdf}><Download size={16}/>Xuất PDF {values.pdfExported?"· Đã xuất":""}</button>
  </div>}
  {step===9&&order.type==="EXPORT"&&<button className="rounded-lg border px-3 py-2 text-sm" onClick={billOfLading}>Xuất B/L PDF</button>}
  {step===9&&order.type==="EXPORT"&&<div className="flex flex-wrap gap-2"><button onClick={template} className="rounded-lg border px-3 py-2 text-xs">Tải mẫu B/L Excel</button><label className="cursor-pointer rounded-lg border px-3 py-2 text-xs">Nhập B/L Excel<input type="file" className="hidden" accept=".xlsx,.xls" onChange={e=>{if(e.target.files?.[0])void importExcel(e.target.files[0]);}}/></label></div>}
  {step===9&&order.type==="IMPORT"&&<label className="block text-xs">Loại chứng từ tải lên<select className={control} value={String(values.docKind||"OTHER")} onChange={e=>set("docKind",e.target.value)}>{["OTHER","MBL","HBL","INV","PL","CO","DN","DO","AN"].map(k=><option key={k}>{k}</option>)}</select></label>}
  {[4,8,9,11,12].includes(step)&&<div className="rounded-xl bg-slate-50 p-4 space-y-3"><p className="text-sm font-medium">{step===9?(order.type==="IMPORT"?"Chứng từ NK: MBL, HBL, INV, PL, CO, DN, DO, AN":"Chứng từ XK: B/L theo mẫu công ty"):"Tệp đính kèm của bước"}</p><label className="inline-flex cursor-pointer gap-2 rounded-lg border bg-white px-3 py-2 text-xs"><Upload size={14}/>Thêm tệp PDF / ảnh / Excel<input type="file" accept=".pdf,.png,.jpg,.jpeg,.xlsx" className="hidden" onChange={e=>{if(e.target.files?.[0])void upload(e.target.files[0]);}}/></label><div className="flex flex-wrap gap-2">{order.files?.filter(file=>file.step===step).map(file=><a key={file.id} className="rounded border bg-white px-2 py-1 text-xs text-blue-600" href={"/api/files/"+file.id} target="_blank" rel="noreferrer">{file.kind} · {file.filename}</a>)}</div></div>}
  </fieldset>
  {message&&<p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
  <div className="flex flex-wrap justify-end gap-2 border-t pt-4"><button disabled={locked||busy} onClick={()=>save()} className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm disabled:opacity-50"><Save size={16}/>Lưu nháp</button><button disabled={locked||busy||order.step!==step} onClick={()=>save(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"><CheckCircle2 size={16}/>{step===13?"Xác nhận đã thu tiền":step===5?"Lưu phản hồi":"Hoàn tất bước"}</button></div>
 </div>;
}
