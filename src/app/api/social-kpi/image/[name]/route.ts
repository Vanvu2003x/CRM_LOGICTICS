import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    await requireUser();
    const name = (await params).name;
    if (!/^[0-9a-f-]+\.(png|jpg|jpeg|webp)$/i.test(name)) throw new Error("Tên ảnh không hợp lệ.");
    const bytes = await readFile(join(process.cwd(), "uploads", "social-kpi", name));
    const ext = name.split(".").pop()?.toLowerCase();
    return new NextResponse(bytes, { headers: { "Content-Type": ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg", "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" } });
  } catch { return NextResponse.json({ error: "Không tìm thấy ảnh." }, { status: 404 }); }
}
