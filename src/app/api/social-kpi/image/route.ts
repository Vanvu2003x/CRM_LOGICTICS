import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { requireUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await requireUser();
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== new URL(request.url).host) throw new Error("Yêu cầu không hợp lệ.");
    if (Number(request.headers.get("content-length")) > 5_500_000) throw new Error("Ảnh tối đa 5 MB.");
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > 5_000_000) throw new Error("Ảnh tối đa 5 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase();
    const valid = ext === "png" && bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" || ["jpg", "jpeg"].includes(ext || "") && bytes[0] === 255 && bytes[1] === 216 || ext === "webp" && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";
    if (!ext || !valid) throw new Error("Chỉ nhận ảnh PNG, JPG hoặc WebP đúng định dạng.");
    const name = `${randomUUID()}.${ext}`;
    const directory = join(process.cwd(), "uploads", "social-kpi");
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, name), bytes);
    return NextResponse.json({ success: true, url: `/api/social-kpi/image/${name}` });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Không tải được ảnh." }, { status: 400 }); }
}
