import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { officialOrderCode } from "@/lib/order-codes";
import { assertOwner, manager, requireUser } from "@/lib/auth";
import { activity, ownedLead, ownedOrder, scopedData } from "@/lib/crm-data";
import { nextStage, readJson, type SavedSteps, type StepFields } from "@/lib/business-rules";
import { validateStep } from "@/lib/step-validation";
import {runReminders} from "@/lib/reminders";
import { requestHasAllowedOrigin } from "@/lib/request-origin";
import { isLeadPhone, normalizeLeadPhone } from "@/lib/phone";

function text(value: unknown, max = 2000) { if (typeof value !== "string" || value.length > max) throw new Error("Thông tin không hợp lệ."); return value.trim(); }
function fields(value: unknown): StepFields {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Dữ liệu bước không hợp lệ.");
  const result: StepFields = {};
  for (const [key, val] of Object.entries(value)) {
    if (["__proto__","constructor","prototype"].includes(key))throw new Error("Trường không hợp lệ.");
    if (key.length > 60 || Object.keys(result).length > 40) throw new Error("Dữ liệu quá lớn.");
    if (typeof val === "string" && val.length <= 20000 || typeof val === "boolean" || typeof val === "number" && Number.isFinite(val)) result[key] = val;
    else if (Array.isArray(val) && val.length <= 30 && val.every((item) => typeof item === "string" && item.length <= 2000)) result[key] = val;
    else throw new Error("Dữ liệu không hợp lệ.");
  }
  return result;
}
export async function GET() {
  try { const user=await requireUser();await runReminders();return NextResponse.json(await scopedData(user)); }
  catch { return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 }); }
}
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!requestHasAllowedOrigin(request)) return NextResponse.json({ error: "Nguồn gửi yêu cầu không được phép." }, { status: 403 });
    if (Number(request.headers.get("content-length")) > 100000) throw new Error("Dữ liệu quá lớn.");
    const body = await request.json() as Record<string, unknown>;
    const action = text(body.action, 50);
    const id = typeof body.id === "string" ? body.id : "";
    const data = fields(body.data || {});
    if (action === "lead.delete") {
      await ownedLead(user, id);
      const existingOrder = await db.order.findUnique({ where: { leadId: id }, select: { code: true } });
      if (existingOrder) throw new Error("Khách đã có đơn hàng nên không thể xóa hồ sơ.");
      await db.$transaction([
        db.callLog.updateMany({ where: { leadId: id }, data: { leadId: null } }),
        db.socialPost.updateMany({ where: { leadId: id }, data: { leadId: null } }),
        db.tradeFairLead.deleteMany({ where: { crmLeadId: id } }),
        db.lead.delete({ where: { id } }),
      ]);
      await activity(user, "xóa khách tiềm năng", "/leads");
    } else if (action === "lead.create" || action === "lead.update") {
      const lead = action === "lead.update" ? await ownedLead(user, id) : null;
      let salesId: string | null = lead ? lead.salesId : user.id;
      if (data.salesId === "" && manager(user)) salesId = null;
      else if (typeof data.salesId === "string") { await assertOwner(user, data.salesId); salesId = data.salesId; }
      else if (typeof data.sales === "string" && manager(user)) { const sales = await db.user.findFirst({ where: { name: data.sales } }); if (sales) { await assertOwner(user, sales.id); salesId = sales.id; } }
      const statusMap: Record<string, string> = { "MỚI": "NEW", "ĐANG_CHĂM_SÓC": "IN_PROGRESS", "CHUYỂN_ĐƠN": "CONVERTED", FAIL: "FAILED" };
      const updates = {
        name: typeof data.name === "string" ? text(data.name, 200) : lead?.name || "", phone: normalizeLeadPhone(typeof data.phone === "string" ? text(data.phone, 50) : lead?.phone || ""),
        email: typeof data.email === "string" ? text(data.email, 200) : lead?.email || null,
        company: typeof data.company === "string" ? text(data.company, 300) : lead?.company,
        companyFoundedAt: typeof data.companyFoundedAt === "string" && data.companyFoundedAt ? new Date(data.companyFoundedAt + "T12:00:00+07:00") : lead?.companyFoundedAt,
        taxId: typeof data.taxId === "string" ? text(data.taxId, 50) : lead?.taxId,
        address: typeof data.address === "string" ? text(data.address, 500) : lead?.address,
        industry: typeof data.industry === "string" ? text(data.industry, 200) : lead?.industry,
        needs: typeof data.needs === "string" ? text(data.needs) : lead?.needs,
        source: typeof data.source === "string" ? text(data.source, 100) : lead?.source || "MANUAL",
        isInterested: typeof data.isInterested === "boolean" ? data.isInterested : lead?.isInterested ?? true,
        interestState: typeof data.interestState === "string" && ["YES","NO","UNKNOWN"].includes(data.interestState) ? data.interestState : typeof data.isInterested === "boolean" ? data.isInterested ? "YES" : "NO" : lead?.interestState || "YES",
        callOutcome: typeof data.callOutcome === "string" && ["UNKNOWN","ANSWERED","NO_ANSWER","NO_NEED","USING_OTHER","INTERESTED"].includes(data.callOutcome) ? data.callOutcome : lead?.callOutcome || "UNKNOWN",
        salesId, status: typeof data.status === "string" ? statusMap[data.status] || lead?.status || "NEW" : lead?.status || "NEW",
        firstContactAt: lead?.firstContactAt || (typeof data.lastCall === "string" ? new Date(data.lastCall + "T12:00:00+07:00") : null),
        lastContactAt: typeof data.lastCall === "string" ? new Date(data.lastCall + "T12:00:00+07:00") : lead?.lastContactAt,
        followUpAt: typeof data.followUpAt === "string" && data.followUpAt ? new Date(data.followUpAt + "T09:00:00+07:00") : lead?.followUpAt,
      };
      if (!updates.name || !isLeadPhone(updates.phone)) throw new Error("Nhập tên và số điện thoại hợp lệ.");
      if (updates.email && !/^\S+@\S+\.\S+$/.test(updates.email)) throw new Error("Email không hợp lệ.");
      if(updates.status==="CONVERTED" && (!lead || !await db.order.findUnique({where:{leadId:id}})))throw new Error("Dùng nút Tạo đơn để chuyển khách thành đơn hàng.");
      for(const date of [updates.lastContactAt,updates.firstContactAt,updates.followUpAt,updates.companyFoundedAt])if(date&&!Number.isFinite(date.getTime()))throw new Error("Ngày không hợp lệ.");
      if (lead) {
        const history = readJson<unknown[]>(lead.contactHistory, []);
        if (data.lastCall || data.needs || data.promotionSent || data.callOutcome || data.interestState) history.unshift({
          at: new Date().toISOString(), contactDate: data.lastCall, needs: data.needs,
          promotionSent:data.promotionSent===true, callOutcome: updates.callOutcome,
          interestState: updates.interestState, by: user.name,
        });
        await db.lead.update({ where: { id }, data: { ...updates, contactHistory: JSON.stringify(history.slice(0, 100)) } });
      } else await db.lead.create({ data: updates });
      await activity(user, lead ? "cập nhật chăm sóc khách" : "thêm khách tiềm năng", "/leads");
    } else if (action === "order.create") {
      const lead = await ownedLead(user, id);
      if (lead.interestState !== "YES") throw new Error("Xác nhận khách có nhu cầu trước khi tạo đơn.");
      const existing = await db.order.findUnique({ where: { leadId: id } });
      if (existing) return NextResponse.json({ orderCode: existing.code });
      const orderType = data.type === "IMPORT" ? "IMPORT" : "EXPORT";
      const now = new Date();
      const period = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "2-digit", month: "2-digit" }).format(now).replace("-", "");
      const prefix = orderType === "IMPORT" ? "LP-IM" : "LP-EX";
      const monthly = await db.order.count({ where: { code: { startsWith: `${prefix}-${period}-` } } });
      const code = `${prefix}-${period}-${String(monthly + 1).padStart(3, "0")}`;
      await db.$transaction([
        db.order.create({ data: { code, leadId: id, salesId: lead.salesId || user.id, customerName: lead.company || lead.name, currentStep: 2, type: orderType } }),
        db.lead.update({ where: { id }, data: { status: "CONVERTED" } }),
      ]);
      await activity(user, "tạo đơn " + code, "/pipeline/" + code);
      return NextResponse.json({ orderCode: code });
    } else if (action === "order.quickUpdate") {
      const order = await ownedOrder(user, id);
      const saved = readJson<SavedSteps>(order.stepsData, {});
      const info = saved[2] || {};
      const transport = saved[6] || {};
      const customerName = typeof data.customerName === "string" ? text(data.customerName, 300) : order.customerName;
      const company = typeof data.company === "string" ? text(data.company, 300) : "";
      const type = data.type === "IMPORT" ? "IMPORT" : data.type === "EXPORT" ? "EXPORT" : order.type;
      const etd = typeof data.etd === "string" ? text(data.etd, 40) : String(transport.etd || "");
      const eta = typeof data.eta === "string" ? text(data.eta, 40) : String(transport.eta || "");
      for (const value of [etd, eta]) if (value && !Number.isFinite(new Date(value + "T12:00:00+07:00").getTime())) throw new Error("ETD/ETA không hợp lệ.");
      saved[2] = { ...info, type: String(type), company, exportPort: typeof data.exportPort === "string" ? text(data.exportPort, 200) : String(info.exportPort || ""), importPort: typeof data.importPort === "string" ? text(data.importPort, 200) : String(info.importPort || ""), incoterms: typeof data.incoterms === "string" ? text(data.incoterms, 50) : String(info.incoterms || ""), quantity: typeof data.quantity === "string" ? text(data.quantity, 100) : String(info.quantity || "") };
      saved[6] = { ...transport, etd, eta };
      await db.$transaction(async tx => {
        await tx.order.update({ where: { id: order.id }, data: { customerName, type, exportPort: typeof data.exportPort === "string" ? text(data.exportPort, 200) : order.exportPort, importPort: typeof data.importPort === "string" ? text(data.importPort, 200) : order.importPort, incoterms: typeof data.incoterms === "string" ? text(data.incoterms, 50) : order.incoterms, quantity: typeof data.quantity === "string" ? text(data.quantity, 100) : order.quantity, expectedDate: eta ? new Date(eta + "T12:00:00+07:00") : order.expectedDate, stepsData: JSON.stringify(saved) } });
        if (order.leadId) await tx.lead.update({ where: { id: order.leadId }, data: { name: customerName || undefined, company: company || null } });
      });
      await activity(user, "sửa nhanh thông tin đơn " + order.code, "/orders");
    } else if (["order.save", "order.complete", "order.move", "order.feedback"].includes(action)) {
      const order = await ownedOrder(user, id);
      const step = Number(data.step ?? body.step);
      if (!Number.isInteger(step) || step < 1 || step > 13) throw new Error("Bước không hợp lệ.");
      if (order.paidAt || order.status !== "IN_PROGRESS") throw new Error("Đơn đã kết thúc; xem lịch sử hoặc tạo cơ hội mới.");
      const saved = readJson<SavedSteps>(order.stepsData, {});
      const completed = readJson<number[]>(order.completedSteps, []);
      const history = readJson<unknown[]>(order.workflowHistory, []);
      let target = order.currentStep;
      let status = order.status;
      let publicCode = order.publicCode;
      if (action === "order.save" || action === "order.complete") {
        if(step>order.currentStep)throw new Error("Chưa đến bước này. Hoàn tất các bước trước để lưu.");
        saved[step] = { ...saved[step], ...data };
        if(action==="order.save"&&step<order.currentStep){target=step;for(let i=completed.length-1;i>=0;i--)if(completed[i]>=step)completed.splice(i,1);}
      }
      if (action === "order.complete") {
        if (step !== order.currentStep) throw new Error("Chỉ hoàn thành bước đang xử lý.");
        validateStep(step, saved[step]);
        if([4,12].includes(step) && !await db.attachment.findFirst({where:{orderId:order.id,step,kind:step===4?"QUOTE":"COST"}}))throw new Error("Xuất và lưu PDF trước khi hoàn tất bước.");
        if(step===7 && !await db.agent.findFirst({where:{id:String(saved[step].agentId),status:"ACTIVE"}}))throw new Error("Chọn đại lý đang hoạt động.");
        if(step===9){
          const files=await db.attachment.findMany({where:{orderId:order.id,step:9}});
          const required=order.type==="IMPORT"?["MBL","HBL","INV","PL","CO","DN","DO","AN"]:["BL"];
          if(required.some(kind=>!files.some(file=>file.kind===kind)))throw new Error("Thiếu chứng từ: "+required.filter(kind=>!files.some(file=>file.kind===kind)).join(", "));
        }
        if (!completed.includes(step)) completed.push(step);
        target = nextStage(step, String(saved[2]?.type || order.type || "EXPORT"));
        if (step === 13) status = "COMPLETED";
      }
      if (action === "order.move") {
        if (step > order.currentStep && (step !== nextStage(order.currentStep, order.type || "EXPORT") || !completed.includes(order.currentStep))) throw new Error("Hoàn thành bước hiện tại trước khi kéo sang bước tiếp theo.");
        target = step;
        if(step<order.currentStep)for(let i=completed.length-1;i>=0;i--)if(completed[i]>=step)completed.splice(i,1);
      }
      if (action === "order.feedback") {
        const decision = data.decision === "GREEN" ? "ACCEPT" : data.decision === "YELLOW" ? "RETURN" : data.decision === "RED" ? "FAIL" : data.decision;
        if (order.currentStep !== 5) throw new Error("Đơn chưa ở bước phản hồi.");
        saved[5] = data;
        if (decision === "ACCEPT") { target = 6; if (!completed.includes(5)) completed.push(5); }
        else if (decision === "RETURN") { target = 2; for (let index = completed.length - 1; index >= 0; index--) if (completed[index] >= 2) completed.splice(index, 1); }
        else if (decision === "FAIL" && data.reason) status = "FAILED";
        else throw new Error("Chọn quyết định và ghi lý do nếu fail.");
      }
      if (action === "order.complete" && step === 6 && !publicCode) {
        const bookedAt = new Date();
        const prefix = order.type === "IMPORT" ? "LP-NK" : "LP-XK";
        const period = `${String(bookedAt.getFullYear()).slice(-2)}${String(bookedAt.getMonth() + 1).padStart(2, "0")}`;
        const sequence = await db.order.count({ where: { publicCode: { startsWith: `${prefix}-${period}-` } } });
        publicCode = officialOrderCode(order.type, bookedAt, sequence + 1);
      }
      if (action !== "order.save") history.unshift({ at: new Date().toISOString(), by: user.name, action, from: order.currentStep, to: target, reason: data.reason || "" });
      const info = saved[2] || {};
      const payment = saved[13] || {};
      const amount = Number(payment.amount);
      if (payment.amount !== undefined && (!Number.isFinite(amount) || amount < 0)) throw new Error("Số tiền không hợp lệ.");
      await db.order.update({ where: { id: order.id }, data: {
        currentStep: target, status, stepsData: JSON.stringify(saved), completedSteps: JSON.stringify(completed), workflowHistory: JSON.stringify(history.slice(0, 100)),
        publicCode,
        type: info.type === "IMPORT" ? "IMPORT" : info.type === "EXPORT" ? "EXPORT" : order.type,
        exportPort: typeof info.exportPort==="string"?info.exportPort:order.exportPort,
        importPort: typeof info.importPort==="string"?info.importPort:order.importPort,
        expectedDate: typeof info.expectedDate==="string"&&info.expectedDate?new Date(info.expectedDate+"T12:00:00+07:00"):order.expectedDate,
        itemName: typeof info.itemName==="string"?info.itemName:order.itemName,
        quantity: typeof info.quantity==="string"?info.quantity:order.quantity,
        pickupLocation: typeof info.pickupLocation==="string"?info.pickupLocation:order.pickupLocation,
        deliveryLocation: typeof info.deliveryLocation==="string"?info.deliveryLocation:order.deliveryLocation,
        incoterms: typeof info.incoterms==="string"?info.incoterms:order.incoterms,
        notes: typeof info.notes==="string"?info.notes:order.notes,
        agentId: typeof saved[7]?.agentId==="string"?saved[7].agentId:order.agentId,
        transportMethod: typeof info.transportMethod === "string" ? info.transportMethod : order.transportMethod,
        invoiceNumber: typeof payment.invoiceNumber === "string" ? payment.invoiceNumber : order.invoiceNumber,
        invoiceAmount: payment.amount !== undefined ? amount : order.invoiceAmount,
        invoiceCurrency: typeof payment.currency === "string" && ["VND", "USD"].includes(payment.currency) ? payment.currency : order.invoiceCurrency,
        invoiceIssuedAt: payment.invoiceIssued ? order.invoiceIssuedAt || new Date() : order.invoiceIssuedAt,
        dueDate: typeof payment.dueDate === "string" && payment.dueDate ? new Date(payment.dueDate + "T23:59:59+07:00") : order.dueDate,
        paidAt: status === "COMPLETED" ? new Date() : order.paidAt, completedAt: status === "COMPLETED" ? new Date() : order.completedAt,
        failedAt: status === "FAILED" ? new Date() : order.failedAt, failureReason: status === "FAILED" ? text(data.reason) : order.failureReason,
      } });
      if(step===1&&order.leadId&&saved[1]?.contactDate){
        const care=saved[1],lead=await db.lead.findUnique({where:{id:order.leadId}});
        const contacts=readJson<unknown[]>(lead?.contactHistory,[]);
        contacts.unshift({at:new Date().toISOString(),by:user.name,contactDate:care.contactDate,needs:care.needs});
        await db.lead.update({where:{id:order.leadId},data:{lastContactAt:new Date(String(care.contactDate)+"T12:00:00+07:00"),firstContactAt:lead?.firstContactAt||new Date(String(care.contactDate)+"T12:00:00+07:00"),needs:String(care.needs||""),followUpAt:care.followUpAt?new Date(String(care.followUpAt)+"T09:00:00+07:00"):lead?.followUpAt,contactHistory:JSON.stringify(contacts.slice(0,100))}});
      }
      await activity(user, action === "order.save" ? "lưu bước " + step + " của " + id : "cập nhật tiến độ " + id, "/pipeline/" + id);
      return NextResponse.json({ success: true, step: target });
    } else if (action === "agent.create" || action === "agent.update" || action === "agent.delete") {
      if (!manager(user) && action !== "agent.create") throw new Error("Chỉ quản lý được quản lý đại lý.");
      if (action === "agent.delete") {
        if (!id) throw new Error("Thiếu đại lý cần xóa.");
        const orderCount = await db.order.count({ where: { agentId: id } });
        if (orderCount > 0) throw new Error("Đại lý này đã có đơn hàng nên không thể xóa.");
        await db.agent.delete({ where: { id } });
      } else if (action === "agent.create") {if(!text(data.name,200))throw new Error("Nhập tên đại lý.");await db.agent.create({ data: { name: text(data.name, 200), country: text(data.country, 100), city: text(data.city, 100), contact: text(data.contactName ?? data.contact, 200), contactName:text(data.contactName ?? data.contact,200),phone:text(data.phone??"",50)||null,whatsapp:text(data.whatsapp??"",100)||null,email:text(data.email??"",200)||null,notes:text(data.notes??"",2000)||null,rating: Math.min(5, Math.max(1, Number(data.rating) || 4)) } });}
      else { const update: Record<string, string | null> = {}; for (const key of ["name", "country", "city", "contact", "contactName", "phone", "whatsapp", "email", "notes", "status"]) if (typeof data[key] === "string") update[key] = text(data[key], key==="notes"?2000:200)||null; if (update.status && !["ACTIVE", "INACTIVE"].includes(update.status)) throw new Error("Trạng thái không hợp lệ."); if(update.contactName)update.contact=update.contactName;await db.agent.update({ where: { id }, data: update }); }
      await activity(user, "cập nhật đại lý", "/agents");
    } else throw new Error("Thao tác không được hỗ trợ.");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && !error.name.startsWith("Prisma") ? error.message : "Không lưu được dữ liệu. Kiểm tra thông tin đầu vào." }, { status: 400 });
  }
}
