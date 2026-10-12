import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

export const publicUserSelect = { id: true, name: true, email: true, role: true, extension: true, teamId: true, createdAt: true, updatedAt: true } as const;
export type PublicUser = { id: string; name: string; email: string; role: string; extension: string | null; teamId: string | null; createdAt: Date; updatedAt: Date };
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return "scrypt:" + salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function verifyPassword(password: string, stored: string) {
  if (!stored.startsWith("scrypt:")) return false;
  const [, salt, expected] = stored.split(":");
  const actual = scryptSync(password, salt, 64);
  const encoded = Buffer.from(expected || "", "hex");
  return actual.length === encoded.length && timingSafeEqual(actual, encoded);
}
export function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
export async function userFromToken(token?: string): Promise<PublicUser | null> {
  if (!token || token.length !== 64) return null;
  const session = await db.session.findUnique({ where: { id: tokenHash(token) }, include: { user: { select: publicUserSelect } } });
  return session && session.expiresAt > new Date() ? session.user : null;
}
export async function currentUser() { return userFromToken((await cookies()).get("crm_session")?.value); }
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("Vui lòng đăng nhập lại.");
  return user;
}
export function manager(user: PublicUser) { return ["ADMIN", "MANAGER"].includes(user.role); }
export async function permittedUserIds(user: PublicUser) {
  if (user.role === "ADMIN") return undefined;
  if (user.role === "MANAGER" && user.teamId) return (await db.user.findMany({ where: { teamId: user.teamId,role:{in:["SALES","MANAGER"]} }, select: { id: true } })).map((item) => item.id);
  return [user.id];
}
export async function assertOwner(user: PublicUser, ownerId?: string | null) {
  const ids = await permittedUserIds(user);
  if (ids && (!ownerId || !ids.includes(ownerId))) throw new Error("Bạn không có quyền thao tác bản ghi này.");
}
export async function startSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  await db.session.create({ data: { id: tokenHash(token), userId, expiresAt: new Date(Date.now() + 7 * 86400000) } });
  (await cookies()).set("crm_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 86400 });
}
