type SipUser = { email: string; extension: string | null };
export function sipAccounts(env: Record<string, string | undefined>): Record<string, string> {
  try {
    const entries: unknown = JSON.parse(env.ITY_SIP_ACCOUNTS || "{}");
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) return {};
    return Object.fromEntries(Object.entries(entries).slice(0, 50).filter(([extension, password]) => /^\d{2,20}$/.test(extension) && typeof password === "string" && password.length > 0 && password.length <= 128 && !/[\r\n\x00]/.test(password)));
  } catch { return {}; }
}
export function webphoneConfig(user: SipUser, env: Record<string, string | undefined>) {
  const { ITY_WSS: wss, ITY_DOMAIN: domain } = env;
  const accounts = sipAccounts(env);
  const assigned = user.extension && accounts[user.extension] ? user.extension : null;
  const legacy = user.email.toLowerCase() === env.ITY_WEBPHONE_EMAIL?.toLowerCase() && (!user.extension || user.extension === env.ITY_EXTENSION);
  const extension = assigned || (legacy ? env.ITY_EXTENSION : null);
  const password = assigned ? accounts[assigned] : legacy ? env.ITY_SIP_PASSWORD : null;
  if (!wss || !domain || !extension || !password) return null;
  try {
    const url = new URL(wss);
    if (url.protocol !== "wss:" || url.username || url.password || !url.hostname.endsWith(".ity.vn") || !/^[a-z0-9.-]+\.ity\.vn$/i.test(domain) || !/^\d{2,20}$/.test(extension)) return null;
    return { wss, uri: `sip:${extension}@${domain}`, domain, extension, password };
  } catch { return null; }
}
