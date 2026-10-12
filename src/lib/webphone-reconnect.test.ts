import { describe, expect, it } from "vitest";
import { reconnectDelay, shouldReconnect } from "./webphone-reconnect";

describe("webphone reconnect policy", () => {
  it("backs off before reconnecting", () => {
    expect([0, 1, 2, 3, 8].map(reconnectDelay)).toEqual([1000, 3000, 7000, 15000, 15000]);
  });

  it("does not reconnect after a manual stop or while offline", () => {
    expect(shouldReconnect({ manuallyStopped: false, online: true })).toBe(true);
    expect(shouldReconnect({ manuallyStopped: true, online: true })).toBe(false);
    expect(shouldReconnect({ manuallyStopped: false, online: false })).toBe(false);
    expect(shouldReconnect({ manuallyStopped: false, online: true, attempt: 5 })).toBe(false);
  });
});
