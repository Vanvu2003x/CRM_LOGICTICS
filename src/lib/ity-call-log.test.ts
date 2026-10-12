import { describe, expect, it } from "vitest";
import { callLogStorageData, ityDialPhone, parseItyCallLog } from "./ity-call-log";
const sample = { callid: "test-call", start_stamp: "2025-03-02 15:29:30", answer_stamp: "2025-03-02 15:29:45", end_stamp: "2025-03-02 15:29:55", extension: "101", phone: "0901234567", duration: "23", billsec: 11, status: "ANSWERED", direction: "outbound", recording: "https://vpbx.ity.vn/recording.wav", source_telco: "YCALL", dest_telco: "Mobifone", hangup_by: "Agent", hangup_cause: "NORMAL_CLEARING", sip_code: "200", hotline: "666690003", domain: "test.ity.vn", mos: "4.5" };
describe("ITY call log payload", () => {
  it("accepts the supplied payload and preserves details with Vietnam timezone", () => {
    const call = parseItyCallLog(sample);
    expect(call.startedAt.toISOString()).toBe("2025-03-02T08:29:30.000Z");
    expect(call.duration).toBe(23); expect(call.answeredAt?.toISOString()).toBe("2025-03-02T08:29:45.000Z");
    expect(call.sourceTelco).toBe("YCALL"); expect(call.mos).toBe(4.5); expect(call.demand).toBe("UNKNOWN");
  });
  it("accepts legacy calldate and normalizes the documented NO ANSER typo", () => {
    expect(parseItyCallLog({ ...sample, start_stamp: undefined, calldate: sample.start_stamp, status: "NO ANSER", answer_stamp: "", billsec: "0" }).status).toBe("NO ANSWER");
  });
  it("maps ITY dispositions to CRM customer classifications", () => {
    expect(parseItyCallLog({ ...sample, disposition: "CO_NHU_CAU" }).callOutcome).toBe("INTERESTED");
    expect(parseItyCallLog({ ...sample, call_outcome: "khong co nhu cau" }).callOutcome).toBe("NO_NEED");
    expect(parseItyCallLog({ ...sample, result: "da co don vi khac" }).callOutcome).toBe("USING_OTHER");
    expect(parseItyCallLog({ ...sample, status: "BUSY", billsec: 0, answer_stamp: "" }).callOutcome).toBe("NO_ANSWER");
    expect(parseItyCallLog(sample).callOutcome).toBe("ANSWERED");
  });
  it("stores Vietnamese numbers returned by ITY in the familiar 0-prefix format", () => {
    expect(parseItyCallLog({ ...sample, phone: "84847855333" }).phone).toBe("0847855333");
    expect(parseItyCallLog({ ...sample, phone: "+84912345678" }).phone).toBe("0912345678");
    expect(parseItyCallLog({ ...sample, phone: "0901234567" }).phone).toBe("0901234567");
    expect(parseItyCallLog({ ...sample, phone: "+12025550123" }).phone).toBe("+12025550123");
  });
  it("dials ITY with the required local 0 prefix", () => {
    expect(ityDialPhone("08222423381")).toBe("08222423381");
    expect(ityDialPhone("090 123 4567")).toBe("0901234567");
    expect(ityDialPhone("0847855333")).toBe("0847855333");
    expect(ityDialPhone("84847855333")).toBe("0847855333");
    expect(ityDialPhone("+84847855333")).toBe("0847855333");
    expect(ityDialPhone("+12025550123")).toBe("12025550123");
  });
  it("rejects invalid timestamps, oversized lengths and invalid recording protocols", () => {
    for (const change of [{ start_stamp: "bad date" }, { billsec: 100 }, { callid: "x".repeat(151) }, { recording: "javascript:alert(1)" }, { end_stamp: "2025-03-01 01:00:00" }]) expect(() => parseItyCallLog({ ...sample, ...change })).toThrow();
  });
  it("removes Lead-only classification before creating a CallLog", () => {
    const data = callLogStorageData(parseItyCallLog({ ...sample, disposition: "CO_NHU_CAU" }));
    expect(data).not.toHaveProperty("callOutcome");
    expect(data.callid).toBe(sample.callid);
  });
});
