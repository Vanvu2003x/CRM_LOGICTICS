import { NextResponse, type NextRequest } from "next/server";
import { userFromToken } from "@/lib/auth";
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/") || /^\/wsapi\/[a-zA-Z0-9_-]+\/call_answered$/.test(path)) return NextResponse.next();
  const user = await userFromToken(request.cookies.get("crm_session")?.value);
  if (!user && path !== "/login") return NextResponse.redirect(new URL("/login", request.url));
  if (user && path === "/login") return NextResponse.redirect(new URL("/dashboard", request.url));
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"] };
