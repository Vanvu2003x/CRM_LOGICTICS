"use client";
import { useEffect, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2, X } from "lucide-react";
import { useDemoData } from "@/components/demo/DemoDataProvider";
import { useItyWebphone } from "./useItyWebphone";
import { familiarPhone } from "@/lib/ity-call-log";

export function WebphoneWidget() {
  const { refresh } = useDemoData();
  const phone = useItyWebphone();
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const dialPhone = phone.call;
  const visible = open || phone.callState !== "idle";
  const live = phone.state === "ready", active = phone.callState !== "idle";
  const input = "mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-blue-400";
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => { void refresh(); }, 15000);
    return () => clearInterval(timer);
  }, [live, refresh]);
  async function dial() { setBusy(true); try { await phone.call(number); } finally { setBusy(false); } }
  useEffect(() => {
    const callLead = (event: Event) => {
      const detail = (event as CustomEvent<{ phone: string; userfield?: string }>).detail;
      if (!detail || typeof detail.phone !== "string") return;
      setNumber(familiarPhone(detail.phone)); setOpen(true);
      void dialPhone(detail.phone, detail.userfield);
    };
    window.addEventListener("crm:ity-call", callLead);
    return () => window.removeEventListener("crm:ity-call", callLead);
  }, [dialPhone]);
  return <div className="fixed bottom-4 right-4 z-[60] max-w-[calc(100vw-2rem)]">
    {visible && <section aria-label="Điện thoại ITY" className="mb-3 max-h-[calc(100dvh-6rem)] w-80 max-w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-slate-900">Điện thoại ITY</h2><p className="mt-1 text-[11px] text-slate-500">{phone.extension ? `Máy lẻ ${phone.extension}` : "Nghe/gọi trực tiếp trên CRM"}</p></div><button type="button" aria-label="Đóng gọi điện" onClick={() => setOpen(false)} className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50"><X size={16} /></button></div>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
        <span className="flex items-center gap-2 text-xs text-slate-600"><span className={`size-2 rounded-full ${live ? "bg-emerald-500" : phone.state === "connecting" ? "animate-pulse bg-amber-400" : "bg-slate-400"}`} />{live ? "Đã tự động kết nối" : phone.state === "connecting" ? "Đang tự động kết nối" : phone.state === "error" ? "Chưa kết nối được" : "Đang chờ kết nối"}</span>
        {live ? <span className="text-[10px] font-semibold text-emerald-600">Sẵn sàng</span> : phone.state !== "connecting" && <button type="button" disabled={active} onClick={() => void phone.connect()} className="min-h-8 px-2 text-xs font-medium text-blue-600 disabled:opacity-50">Thử lại</button>}
      </div>
      {active ? <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-center"><p className="text-xs text-blue-600">{phone.callState === "incoming" ? "Cuộc gọi đến" : phone.callState === "active" ? "Đang đàm thoại" : "Đang gọi"}</p><p className="mt-2 text-lg font-semibold text-slate-900">{phone.remote}</p><div className="mt-4 flex flex-wrap justify-center gap-2">{phone.callState === "incoming" && <button type="button" onClick={phone.answer} className="flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs text-white"><Phone size={15} />Trả lời</button>}{phone.callState === "active" && <><button type="button" aria-label={phone.muted ? "Bật microphone" : "Tắt microphone"} onClick={phone.toggleMute} className="flex size-10 items-center justify-center rounded-lg border bg-white text-slate-600">{phone.muted ? <MicOff size={16} /> : <Mic size={16} />}</button><button type="button" aria-label="Nghe âm thanh" onClick={phone.playAudio} className="flex size-10 items-center justify-center rounded-lg border bg-white text-slate-600"><Volume2 size={16} /></button></>}<button type="button" onClick={phone.hangup} className="flex min-h-10 items-center gap-2 rounded-lg bg-rose-600 px-3 text-xs text-white"><PhoneOff size={15} />{phone.callState === "incoming" ? "Từ chối" : "Kết thúc"}</button></div></div> : <>
        <label className="mt-3 block text-xs text-slate-500">Số điện thoại<input type="tel" inputMode="tel" className={input} value={number} onChange={event => setNumber(event.target.value)} placeholder="Nhập số cần gọi" /></label>
        <button type="button" disabled={!live || !number || busy} onClick={() => void dial()} className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"><Phone size={15} />{busy ? "Đang khởi tạo…" : "Gọi điện"}</button>
      </>}
      {!active && <p className="mt-3 text-[10px] leading-4 text-slate-400">Gọi trực tiếp theo số. ITY gửi kết quả sau khi kết thúc; CRM lưu vào lịch sử cuộc gọi.</p>}
      {phone.message && <p role="status" className="mt-3 text-xs leading-5 text-slate-500">{phone.message}</p>}
    </section>}
    <button type="button" aria-label="Mở gọi ITY" className={`float-right flex size-12 items-center justify-center rounded-full text-white shadow-lg ${phone.callState === "incoming" ? "animate-pulse bg-emerald-600" : "bg-blue-600"}`} onClick={() => setOpen(!open)}><Phone size={19} /></button>
  </div>;
}
