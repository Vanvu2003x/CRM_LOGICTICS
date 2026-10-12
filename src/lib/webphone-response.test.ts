import { describe, expect, it, vi } from "vitest";
import { friendlyWebphoneMessage, loadWebphoneConfig, shouldRetryWebphoneError } from "./webphone-response";

const valid = {
  configured: true,
  wss: "wss://vpbx.ity.vn:7443",
  uri: "sip:90933001@c90933.ity.vn",
  domain: "c90933.ity.vn",
  extension: "90933001",
  password: "private-password",
};

describe("loadWebphoneConfig", () => {
  it("returns a valid JSON webphone configuration", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify(valid), { status: 200, headers: { "content-type": "application/json" } }));
    await expect(loadWebphoneConfig(request)).resolves.toEqual(valid);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("retries once when a deployment temporarily returns HTML", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(new Response("<html><h1>Bad gateway</h1></html>", { status: 502, headers: { "content-type": "text/html" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify(valid), { status: 200, headers: { "content-type": "application/json" } }));
    await expect(loadWebphoneConfig(request)).resolves.toEqual(valid);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("shows a friendly message instead of a JSON parse error", async () => {
    const request = vi.fn().mockImplementation(async () => new Response("<html><h1>Bad gateway</h1></html>", { status: 502, headers: { "content-type": "text/html" } }));
    await expect(loadWebphoneConfig(request)).rejects.toThrow("CRM chưa phản hồi");
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("explains when the login session has expired", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Vui lòng đăng nhập." }), { status: 401, headers: { "content-type": "application/json" } }));
    await expect(loadWebphoneConfig(request)).rejects.toThrow("Phiên đăng nhập đã hết hạn");
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("never exposes a raw JSON or script parsing error", () => {
    expect(friendlyWebphoneMessage(new SyntaxError("Unexpected token '<', '<html>' is not valid JSON")))
      .toBe("Không kết nối được điện thoại ITY. Vui lòng thử lại.");
  });

  it("marks transient connection errors for automatic reconnect", async () => {
    const request = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    let error: unknown;
    try { await loadWebphoneConfig(request); } catch (caught) { error = caught; }
    expect(shouldRetryWebphoneError(error)).toBe(true);
  });

  it("does not reconnect an expired login session", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Vui lòng đăng nhập." }), { status: 401 }));
    let error: unknown;
    try { await loadWebphoneConfig(request); } catch (caught) { error = caught; }
    expect(shouldRetryWebphoneError(error)).toBe(false);
  });
});
