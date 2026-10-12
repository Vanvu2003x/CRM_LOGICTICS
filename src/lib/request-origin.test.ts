import { describe, expect, it } from "vitest";
import { requestOriginAllowed } from "./request-origin";

describe("requestOriginAllowed", () => {
  it("accepts the public origin forwarded by nginx", () => {
    expect(requestOriginAllowed({
      origin: "https://crmdemo.vanvucoder.id.vn",
      requestUrl: "http://127.0.0.1:3201/api/crm",
      forwardedHost: "crmdemo.vanvucoder.id.vn",
      host: "127.0.0.1:3201",
    })).toBe(true);
  });

  it("rejects a different website", () => {
    expect(requestOriginAllowed({
      origin: "https://evil.example",
      requestUrl: "http://127.0.0.1:3201/api/crm",
      forwardedHost: "crmdemo.vanvucoder.id.vn",
      host: "crmdemo.vanvucoder.id.vn",
    })).toBe(false);
  });

  it("allows requests without an Origin header", () => {
    expect(requestOriginAllowed({ origin: null, requestUrl: "https://crm.example/api/crm", forwardedHost: null, host: "crm.example" })).toBe(true);
  });
});
