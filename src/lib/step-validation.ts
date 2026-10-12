import { readJson, type StepFields } from "./business-rules";
export function validateStep(step: number, data: StepFields) {
  const required: Record<number, string[]> = {
    1: ["contactDate", "needs"], 2: ["exportPort", "importPort", "transportMethod", "expectedDate", "itemName", "quantity", "incoterms"],
    3: ["quotes"], 4: ["lines", "pdfExported"], 5: ["decision"], 6: ["etd", "eta", "line", "price"],
    7: ["agentId"], 8: ["carrier", "vehicle", "pickupAt", "delivered"], 9: ["documentsDone"],
    10: ["declaration", "lane", "customsStatus"], 11: ["carrier", "vehicle", "pickupAt", "delivered"],
    12: ["lines", "pdfExported"], 13: ["invoiceNumber", "amount", "dueDate", "invoiceIssued", "paid"],
  };
  const missing = (required[step] || []).filter(key => data[key] === undefined || data[key] === "" || data[key] === false || data[key] === null);
  if (missing.length) throw new Error(`Chưa đủ thông tin để hoàn thành bước ${step}: ${missing.join(", ")}.`);
  if (step === 5 && data.decision !== "ACCEPT") throw new Error("Chọn đồng ý, quay lại hoặc fail ở phần phản hồi.");
  if (step === 10 && data.customsStatus !== "CLEARED") throw new Error("Tờ khai chưa được thông quan.");
  if (step === 3) {
    const quotes = readJson<{vendor:string;price:number}[]>(String(data.quotes), []);
    if (quotes.length < 3 || quotes.length > 5 || quotes.some(q=>!q.vendor?.trim() || !Number.isFinite(q.price) || q.price<=0)) throw new Error("Cần 3–5 báo giá, có tên đơn vị và giá lớn hơn 0.");
  }
  if ([4,12].includes(step)) {
    const lines=readJson<{name:string;price:number;quantity:number}[]>(String(data.lines),[]);
    if (!lines.length || lines.some(l=>!l.name?.trim() || !Number.isFinite(l.price) || l.price<0 || !Number.isFinite(l.quantity) || l.quantity<=0)) throw new Error("Kiểm tra tên khoản phí, đơn giá và số lượng.");
  }
  if (step === 13 && Number(data.amount)<=0) throw new Error("Số tiền hóa đơn phải lớn hơn 0.");
  for (const key of ["expectedDate","contactDate","etd","eta","pickupAt","dueDate"]) if (data[key] && !Number.isFinite(new Date(String(data[key])).getTime())) throw new Error("Ngày giờ không hợp lệ.");
}
