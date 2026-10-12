export type WebphoneConfig = {
  configured: true;
  wss: string;
  uri: string;
  domain: string;
  extension: string;
  password: string;
};

class WebphoneResponseError extends Error {
  constructor(message: string, readonly retryable = false) {
    super(message);
  }
}

/** True when the webphone can safely try to establish its registration again. */
export function shouldRetryWebphoneError(error: unknown) {
  return error instanceof WebphoneResponseError ? error.retryable : true;
}

export function friendlyWebphoneMessage(error: unknown) {
  return error instanceof WebphoneResponseError
    ? error.message
    : "Không kết nối được điện thoại ITY. Vui lòng thử lại.";
}

async function parseWebphoneResponse(response: Response): Promise<WebphoneConfig> {
  const raw = await response.text();
  let body: Record<string, unknown> | null = null;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new WebphoneResponseError("CRM chưa phản hồi đúng. Vui lòng bấm Kết nối lại sau vài giây.", true);
  }

  if (response.status === 401) throw new WebphoneResponseError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  if (!response.ok) throw new WebphoneResponseError(typeof body.error === "string" ? body.error : "Không lấy được cấu hình điện thoại ITY.", response.status >= 500);
  if (body.configured !== true) throw new WebphoneResponseError("Tài khoản chưa được gán máy lẻ webphone ITY.");

  for (const key of ["wss", "uri", "domain", "extension", "password"] as const) {
    if (typeof body[key] !== "string" || !body[key]) throw new WebphoneResponseError("Cấu hình điện thoại ITY chưa đầy đủ. Liên hệ Admin để kiểm tra.");
  }
  return body as WebphoneConfig;
}

export async function loadWebphoneConfig(request: () => Promise<Response> = () => fetch("/api/ity/webphone", { cache: "no-store" })) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await parseWebphoneResponse(await request());
    } catch (error) {
      if (attempt === 0 && error instanceof WebphoneResponseError && error.retryable) continue;
      throw error;
    }
  }
  throw new WebphoneResponseError("CRM chưa phản hồi đúng. Vui lòng bấm Kết nối lại sau vài giây.");
}
