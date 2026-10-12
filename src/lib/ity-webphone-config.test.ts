import { describe, expect, it } from "vitest";
import { webphoneConfig, sipAccounts } from "./ity-webphone-config";

const env = { ITY_WSS: "wss://vpbx.ity.vn:7443", ITY_DOMAIN: "example.ity.vn", ITY_EXTENSION: "101", ITY_SIP_PASSWORD: "test-only", ITY_WEBPHONE_EMAIL: "admin@example.com" };
describe("ITY webphone credentials", () => {
  it("only gives credentials to the configured user", () => {
    expect(webphoneConfig({ email: "sales@example.com", extension: "102" }, env)).toBeNull();
    expect(webphoneConfig({ email: "admin@example.com", extension: null }, env)?.uri).toBe("sip:101@example.ity.vn");
  });
  it("requires explicit user mapping even with a matching extension", () => {
    expect(webphoneConfig({ email: "other@example.com", extension: "101" }, env)).toBeNull();
  });
  it("gives each assigned user only their own extension credentials", () => {
    const multi = { ...env, ITY_SIP_ACCOUNTS: JSON.stringify({ "102": "test-second", "103": "test-third" }) };
    expect(webphoneConfig({ email: "sales@example.com", extension: "102" }, multi)?.password).toBe("test-second");
    expect(webphoneConfig({ email: "sales@example.com", extension: "103" }, multi)?.password).toBe("test-third");
    expect(webphoneConfig({ email: "sales@example.com", extension: "104" }, multi)).toBeNull();
    expect(webphoneConfig({ email: "sales@example.com", extension: null }, multi)).toBeNull();
  });
  it("parses valid SIP accounts while rejecting malformed entries", () => {
    expect(sipAccounts({ ITY_SIP_ACCOUNTS: '{"102":"test-second","invalid":"x","103":""}' })).toEqual({ "102": "test-second" });
    expect(sipAccounts({ ITY_SIP_ACCOUNTS: "not-json" })).toEqual({});
  });
  it("rejects missing passwords, insecure transport and non-ITY hosts", () => {
    for (const change of [{ ITY_SIP_PASSWORD: "" }, { ITY_WSS: "ws://vpbx.ity.vn:7443" }, { ITY_WSS: "wss://ity.vn.evil.test" }, { ITY_DOMAIN: "example.ity.vn@evil.test" }]) {
      expect(webphoneConfig({ email: "admin@example.com", extension: null }, { ...env, ...change })).toBeNull();
    }
  });
});
