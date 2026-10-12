import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { requireUser, publicUserSelect, verifyPassword, hashPassword, tokenHash } from "@/lib/auth";
import { profileValues } from "@/lib/profile-values";
const attempts = new Map<string, { count: number; until: number }>();

export async function POST(request: Request) {
  let user;
  try { user = await requireUser(); } catch { return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 }); }
  if (request.headers.get("origin") && new URL(request.headers.get("origin")!).origin !== new URL(request.url).origin) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  if (Number(request.headers.get("content-length")) > 8000) return NextResponse.json({ error: "Thông tin quá lớn." }, { status: 413 });
  let values;
  try { values = profileValues(await request.json()); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Thông tin không hợp lệ." }, { status: 400 }); }
  const entry = attempts.get(user.id);
  if (entry && entry.until > Date.now() && entry.count >= 10) return NextResponse.json({ error: "Thử lại sau 5 phút." }, { status: 429 });
  try {
    const stored = await db.user.findUnique({ where: { id: user.id }, select: { password: true } });
    if (!stored || !verifyPassword(values.currentPassword, stored.password)) {
      if (attempts.size > 1000) for (const [id, value] of attempts) if (value.until < Date.now()) attempts.delete(id);
      attempts.set(user.id, { count: entry && entry.until > Date.now() ? entry.count + 1 : 1, until: entry && entry.until > Date.now() ? entry.until : Date.now() + 300000 });
      return NextResponse.json({ error: "Mật khẩu CRM hiện tại chưa đúng." }, { status: 400 });
    }
    const token = (await cookies()).get("crm_session")?.value || "";
    const updated = await db.$transaction(async tx => {
      const result = await tx.user.update({ where: { id: user.id }, data: { name: values.name, email: values.email, ...(values.password ? { password: hashPassword(values.password) } : {}) }, select: publicUserSelect });
      if (values.password || values.email !== user.email) await tx.session.deleteMany({ where: { userId: user.id, id: { not: tokenHash(token) } } });
      return result;
    });
    attempts.delete(user.id);
    return NextResponse.json({ user: updated }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ error: "Email này đã có tài khoản khác sử dụng." }, { status: 409 });
    return NextResponse.json({ error: "Chưa lưu được thông tin. Vui lòng thử lại." }, { status: 500 });
  }
}
