import { safeUrl } from "./business-rules";

function normalizedDisposition(value: string | null) {
  return (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function familiarPhone(value: string) {
  return /^\+?84\d{9,10}$/.test(value) ? `0${value.replace(/^\+?84/, "")}` : value;
}

export function ityDialPhone(value: string) {
  const compact = value.replace(/[\s().-]/g, "");
  return familiarPhone(compact).replace(/^\+/, "");
}

function callOutcomeFrom(disposition: string, status: string, answeredAt: Date | null, billsec: number) {
  if (["CO_NHU_CAU", "INTERESTED", "HAS_DEMAND", "POTENTIAL"].includes(disposition)) return "INTERESTED";
  if (["KHONG_CO_NHU_CAU", "KHONG_NHU_CAU", "NO_NEED", "NOT_INTERESTED"].includes(disposition)) return "NO_NEED";
  if (["DA_CO_DON_VI_KHAC", "CO_DON_VI_KHAC", "USING_OTHER", "OTHER_PROVIDER"].includes(disposition)) return "USING_OTHER";
  // ITY can send a stale no-answer classification with the final call event.
  // An answer timestamp or billable seconds is stronger evidence that the call was answered.
  if (answeredAt || billsec > 0 || status.includes("ANSWERED") || status.includes("ANSWER")) return "ANSWERED";
  if (["KHONG_NGHE_MAY", "NO_ANSWER", "NOANSWER", "BUSY", "USER_BUSY"].includes(disposition)) return "NO_ANSWER";
  return ["NO ANSWER", "BUSY", "USER BUSY", "480", "404"].some((value) => status.includes(value)) ? "NO_ANSWER" : "UNKNOWN";
}
export function parseItyCallLog(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Payload không hợp lệ.");
  const data = value as Record<string, unknown>;
  function text(key: string, max = 150): string | null {
    const raw = data[key];
    if (raw === undefined || raw === null || raw === "") return null;
    if (!["string", "number"].includes(typeof raw) || String(raw).length > max || /[\r\n\x00]/.test(String(raw))) throw new Error("Trường không hợp lệ.");
    return String(raw);
  }
  function date(raw: unknown, required = false) {
    if ((!raw || raw === "0000-00-00 00:00:00") && !required) return null;
    if (typeof raw !== "string") throw new Error("Thời gian không hợp lệ.");
    const formatted = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw) ? raw.replace(" ", "T") + "+07:00" : raw;
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(formatted)) throw new Error("Thời gian không hợp lệ.");
    const result = new Date(formatted);
    if (!Number.isFinite(result.getTime())) throw new Error("Thời gian không hợp lệ.");
    return result;
  }
  const callid = text("callid"), rawPhone = text("phone", 25)?.replace(/[\s().-]/g, "");
  const phone = rawPhone ? familiarPhone(rawPhone) : rawPhone;
  if (!callid || !phone || !/^\+?\d{7,15}$/.test(phone)) throw new Error("Thiếu mã cuộc gọi hoặc số điện thoại.");
  const startedAt = date(data.start_stamp || data.calldate, true)!;
  const answeredAt = date(data.answer_stamp), endedAt = date(data.end_stamp);
  if (!["string", "number"].includes(typeof data.duration) || !["string", "number"].includes(typeof data.billsec) || data.duration === "" || data.billsec === "") throw new Error("Thiếu thời lượng.");
  const duration = Number(data.duration), billsec = Number(data.billsec);
  if (!Number.isInteger(duration) || duration < 0 || duration > 86400 || !Number.isInteger(billsec) || billsec < 0 || billsec > duration || (answeredAt && answeredAt < startedAt) || (endedAt && endedAt < (answeredAt || startedAt))) throw new Error("Thời lượng không hợp lệ.");
  let status = text("status", 40)?.toUpperCase();
  if (["NO ANSER", "NO_ANSWER", "NOANSWER"].includes(status || "")) status = "NO ANSWER";
  const direction = text("direction", 20)?.toLowerCase();
  if (!status || !/^[A-Z][A-Z0-9 _-]*$/.test(status) || !["inbound", "outbound"].includes(direction || "")) throw new Error("Trạng thái không hợp lệ.");
  const recordingUrl = text("recording", 2000);
  if (recordingUrl && !safeUrl(recordingUrl)) throw new Error("Link ghi âm không hợp lệ.");
  const mos = data.mos === undefined || data.mos === "" || data.mos === null ? null : Number(data.mos);
  if (mos !== null && (!Number.isFinite(mos) || mos < 0 || mos > 5)) throw new Error("MOS không hợp lệ.");
  const disposition = normalizedDisposition(text("call_outcome", 80) || text("disposition", 80) || text("classification", 80) || text("result", 80));
  const inferredOutcome = callOutcomeFrom(disposition, status, answeredAt, billsec);
  const demand = data.isInterested === true || data.demand === "YES" || inferredOutcome === "INTERESTED" ? "YES" : data.isInterested === false || data.demand === "NO" || ["NO_NEED", "USING_OTHER"].includes(inferredOutcome) ? "NO" : "UNKNOWN";
  const callOutcome = demand === "YES" ? "INTERESTED" : demand === "NO" && inferredOutcome === "UNKNOWN" ? "NO_NEED" : inferredOutcome;
  return { callid, phone, startedAt, answeredAt, endedAt, duration, billsec, status, direction: direction!, recordingUrl, demand, callOutcome,
    extension: text("extension", 30), userfield: text("userfield"), customerName: text("name", 200), company: text("company", 300), needs: text("needs", 2000), sourceTelco: text("source_telco"), destTelco: text("dest_telco"), hangupBy: text("hangup_by"), hangupCause: text("hangup_cause"), sipCode: text("sip_code", 20), hotline: text("hotline", 30), domain: text("domain"), mos };
}

export function callLogStorageData(call: ReturnType<typeof parseItyCallLog>) {
  const { callOutcome, ...data } = call;
  void callOutcome;
  return data;
}
