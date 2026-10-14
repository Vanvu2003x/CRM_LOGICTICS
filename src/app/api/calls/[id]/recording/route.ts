import { db } from "@/lib/db";
import { permittedUserIds, requireUser } from "@/lib/auth";

const allowedHosts = new Set(["ity.vn", "vpbx.ity.vn", "tongdai.ity.vn"]);

function allowedRecordingUrl(value: string) {
  try {
    const url = new URL(value);
    const configuredHosts = (process.env.ITY_RECORDING_HOSTS || "").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === "https:" && (allowedHosts.has(hostname) || configuredHosts.includes(hostname));
  } catch {
    return false;
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const call = await db.callLog.findUnique({ where: { id }, select: { recordingUrl: true, salesId: true } });
    if (!call?.recordingUrl) return new Response("Không có file ghi âm.", { status: 404 });
    const permitted = await permittedUserIds(user);
    if (permitted && (!call.salesId || !permitted.includes(call.salesId))) return new Response("Không có quyền xem ghi âm.", { status: 403 });
    if (!allowedRecordingUrl(call.recordingUrl)) return new Response("Đường dẫn ghi âm không hợp lệ hoặc chưa được cấu hình.", { status: 422 });

    const upstream = await fetch(call.recordingUrl, { redirect: "follow", signal: AbortSignal.timeout(15000), headers: { Accept: "audio/*, application/octet-stream" } });
    if (!upstream.ok || !upstream.body) return new Response("Không tải được file ghi âm từ tổng đài.", { status: 502 });
    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("audio/") && !contentType.toLowerCase().includes("octet-stream")) return new Response("Tổng đài không trả về file âm thanh.", { status: 502 });
    const headers = new Headers({ "Content-Type": contentType, "Cache-Control": "private, no-store", "Content-Disposition": "inline" });
    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);
    return new Response(upstream.body, { headers });
  } catch {
    return new Response("Không thể tải file ghi âm.", { status: 502 });
  }
}
