"use server";
import { db } from "@/lib/db";
import { publicUserSelect, startSession, tokenHash, verifyPassword } from "@/lib/auth";
import { cookies } from "next/headers";
const attempts = new Map<string,{count:number;until:number}>();

export async function checkLogin(email: string, password?: string) {
  if (typeof email !== "string" || typeof password !== "string" || !password || email.length > 200 || password.length > 200) return { success: false, error: "Nhập email và mật khẩu hợp lệ." };
  const key=email.trim().toLowerCase(),now=Date.now(),entry=attempts.get(key);
  if(entry && entry.until>now && entry.count>=10)return{success:false,error:"Đăng nhập sai nhiều lần. Thử lại sau 5 phút."};
  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || !verifyPassword(password, user.password)) {
    if(attempts.size>1000)for(const [id,item]of attempts)if(item.until<now)attempts.delete(id);
    attempts.set(key,{count:entry&&entry.until>now?entry.count+1:1,until:entry&&entry.until>now?entry.until:now+300000});
    return { success: false, error: "Email hoặc mật khẩu không chính xác." };
  }
  attempts.delete(key);
  await startSession(user.id);
  const safe = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: publicUserSelect });
  return { success: true, user: safe };
}
export async function logout() {
  const jar = await cookies();
  const token = jar.get("crm_session")?.value;
  if (token) await db.session.deleteMany({ where: { id: tokenHash(token) } });
  jar.delete("crm_session");
}
