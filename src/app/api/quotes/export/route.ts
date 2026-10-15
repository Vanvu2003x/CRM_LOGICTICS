import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ownedOrder } from "@/lib/crm-data";
import { db } from "@/lib/db";
import { exportQuoteTemplate, type QuoteTemplateLine } from "@/lib/quote-template-export";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json() as {
      orderId?: string;
      mode?: "fcl" | "lcl";
      lines?: QuoteTemplateLine[];
    };
    const order = await ownedOrder(user, String(body.orderId || ""));
    if (order.status !== "IN_PROGRESS") throw new Error("Đơn hàng đã đóng, không thể xuất báo giá.");
    if (!Array.isArray(body.lines)) throw new Error("Dữ liệu báo giá không hợp lệ.");

    const mode = String(body.mode || order.transportMethod || "FCL").toUpperCase() === "LCL" ? "lcl" : "fcl";
    const [sales, lead] = await Promise.all([
      db.user.findUnique({ where: { id: order.salesId }, select: { name: true } }),
      order.leadId ? db.lead.findUnique({ where: { id: order.leadId }, select: { company: true } }) : null,
    ]);
    const path = join(process.cwd(), "public", "templates", `bao-gia-nhap-khau-${mode}.xlsx`);
    const template = await readFile(path);
    const workbook = await exportQuoteTemplate({
      template,
      incoterm: String(order.incoterms || "EXW"),
      company: lead?.company || order.customerName || "",
      attention: sales?.name || user.name,
      exchangeRate: 26600,
      mode,
      lines: body.lines,
    });
    return new NextResponse(Buffer.from(workbook), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${order.id}-bao-gia-${mode}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể xuất Excel báo giá." }, { status: 400 });
  }
}
