import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { webphoneConfig } from "@/lib/ity-webphone-config";

export async function GET() {
  const headers = { "Cache-Control": "no-store, private", "Pragma": "no-cache", "Vary": "Cookie" };
  try {
    const user = await requireUser();
    const config = webphoneConfig(user, process.env);
    return NextResponse.json(config ? { configured: true, ...config } : { configured: false }, { headers });
  } catch {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401, headers });
  }
}
