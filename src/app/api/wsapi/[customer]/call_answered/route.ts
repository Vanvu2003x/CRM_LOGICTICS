import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { getItyConfig } from "@/lib/ity";
import { callLogStorageData, parseItyCallLog } from "@/lib/ity-call-log";

export async function POST(request: Request, { params }: { params: Promise<{ customer: string }> }) {
  const { customer } = await params;
  const config = await getItyConfig();
  const expectedCustomer = process.env.ITY_CUSTOMER || config.customer;
  const secret = process.env.ITY_WEBHOOK_SECRET || process.env.CRM_SECRET || config.secret || "";
  const provided = request.headers.get("x-crm-secret") || new URL(request.url).searchParams.get("secret") || "";
  const expectedBytes = Buffer.from(secret), providedBytes = Buffer.from(provided);
  if (!secret || customer !== expectedCustomer || providedBytes.length !== expectedBytes.length || !timingSafeEqual(expectedBytes, providedBytes)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let call: ReturnType<typeof parseItyCallLog>;
  try {
    if (Number(request.headers.get("content-length")) > 20000) return NextResponse.json({ error: "Payload quá lớn" }, { status: 413 });
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Thiếu payload");
    let size = 0; const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 20000) { await reader.cancel(); return NextResponse.json({ error: "Payload quá lớn" }, { status: 413 }); }
      chunks.push(value);
    }
    call = parseItyCallLog(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (call.domain && process.env.ITY_DOMAIN && call.domain.toLowerCase() !== process.env.ITY_DOMAIN.toLowerCase()) throw new Error("Domain không khớp");
  } catch { return NextResponse.json({ error: "Payload không hợp lệ." }, { status: 400 }); }
  try {
    let sales = call.extension ? await db.user.findUnique({ where: { extension: call.extension }, select: { id: true } }) : null;
    if (!sales && call.extension === process.env.ITY_EXTENSION && process.env.ITY_WEBPHONE_EMAIL) sales = await db.user.findUnique({ where: { email: process.env.ITY_WEBPHONE_EMAIL }, select: { id: true } });
    const result = await db.$transaction(async tx => {
      if (await tx.callLog.findUnique({ where: { callid: call.callid }, select: { id: true } })) return { duplicate: true };
      const linkedOrder = call.userfield ? await tx.order.findFirst({ where: { code: call.userfield }, select: { code: true, leadId: true } }) : null;
      let lead = linkedOrder?.leadId
        ? await tx.lead.findUnique({ where: { id: linkedOrder.leadId } })
        : sales ? await tx.lead.findFirst({ where: { salesId: sales.id, phone: call.phone } }) : null;
      const callOutcome = call.callOutcome;
      if (!lead) lead = await tx.lead.create({ data: { name: call.customerName || call.phone, phone: call.phone, company: call.company, source: "ITY", salesId: sales?.id, interestState: call.demand, callOutcome, isInterested: call.demand === "YES", needs: call.needs } });
      await tx.callLog.create({ data: { ...callLogStorageData(call), salesId: sales?.id, orderCode: linkedOrder?.code, leadId: lead?.id } });
      if (lead) await tx.lead.update({ where: { id: lead.id }, data: {
        callCount: { increment: 1 }, callDurationSeconds: { increment: call.billsec },
        lastContactAt: !lead.lastContactAt || call.startedAt > lead.lastContactAt ? call.startedAt : lead.lastContactAt,
        firstContactAt: !lead.firstContactAt || call.startedAt < lead.firstContactAt ? call.startedAt : lead.firstContactAt,
        ...(callOutcome !== "UNKNOWN" || lead.callOutcome === "UNKNOWN" ? { callOutcome } : {}),
        ...(call.demand !== "UNKNOWN" ? { interestState: call.demand, isInterested: call.demand === "YES" } : {})
      } });
      return { duplicate: false };
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002" && await db.callLog.findUnique({ where: { callid: call.callid }, select: { id: true } })) return NextResponse.json({ success: true, duplicate: true });
    console.error("[ITY webhook] Không thể lưu cuộc gọi", {
      callid: call.callid,
      extension: call.extension,
      code: error && typeof error === "object" && "code" in error ? error.code : undefined,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Chưa lưu được cuộc gọi. Vui lòng gửi lại." }, { status: 500 });
  }
}
