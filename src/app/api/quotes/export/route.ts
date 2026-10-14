import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ownedOrder } from "@/lib/crm-data";
import { exportQuoteTemplate, type QuoteTemplateLine } from "@/lib/quote-template-export";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json() as {
      orderId?: string;
      mode?: "fcl" | "lcl";
      incoterm?: string;
      company?: string;
      attention?: string;
      exchangeRate?: number;
      lines?: QuoteTemplateLine[];
    };
    const order = await ownedOrder(user, String(body.orderId || ""));
    if (order.status !== "IN_PROGRESS") throw new Error("Đơn hàng đã đóng, không thể xuất báo giá.");
    if (!Array.isArray(body.lines)) throw new Error("Dữ liệu báo giá không hợp lệ.");

    const mode = String(body.mode || order.transportMethod || "FCL").toUpperCase() === "LCL" ? "lcl" : "fcl";
    const path = join(process.cwd(), "public", "templates", `bao-gia-nhap-khau-${mode}.xlsx`);
    const template = await readFile(path);
    const workbook = await exportQuoteTemplate({
      template,
      incoterm: String(body.incoterm || order.incoterms || "EXW"),
      company: String(body.company || order.customerName || ""),
      attention: String(body.attention || order.customerName || ""),
      exchangeRate: Number(body.exchangeRate || 26600),
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
