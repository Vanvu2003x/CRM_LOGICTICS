type OriginInput = { origin: string | null; requestUrl: string; forwardedHost: string | null; host: string | null };

export function requestOriginAllowed(input: OriginInput) {
  if (!input.origin) return true;
  try {
    const originHost = new URL(input.origin).host.toLowerCase();
    const forwardedHost = input.forwardedHost?.split(",")[0]?.trim().toLowerCase();
    const host = input.host?.split(",")[0]?.trim().toLowerCase();
    const requestHost = new URL(input.requestUrl).host.toLowerCase();
    return [forwardedHost, host, requestHost].filter(Boolean).includes(originHost);
  } catch {
    return false;
  }
}

export function requestHasAllowedOrigin(request: Request) {
  return requestOriginAllowed({
    origin: request.headers.get("origin"), requestUrl: request.url,
    forwardedHost: request.headers.get("x-forwarded-host"), host: request.headers.get("host"),
  });
}
