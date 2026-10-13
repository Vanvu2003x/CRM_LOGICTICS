"use client";

import { useEffect, useRef, useState } from "react";
import type { UA } from "jssip";
import type { RTCSessionEvent } from "jssip/lib/UA";
import type { RTCSession, PeerConnectionEvent, EndEvent } from "jssip/lib/RTCSession";
import { friendlyWebphoneMessage, loadWebphoneConfig, shouldRetryWebphoneError } from "@/lib/webphone-response";
import { callFailureMessage } from "@/lib/ity-call-failure";
import { reconnectDelay, shouldReconnect } from "@/lib/webphone-reconnect";
import { ityDialPhone } from "@/lib/ity-call-log";

export function useItyWebphone() {
  const ua = useRef<UA | null>(null), session = useRef<RTCSession | null>(null);
  const domain = useRef(""), audio = useRef<HTMLAudioElement | null>(null);
  const registrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttempt = useRef(0), manuallyStopped = useRef(false), connecting = useRef(false);
  const connectRef = useRef<() => void>(() => undefined);
  const [state, setState] = useState<"offline" | "connecting" | "ready" | "error">("offline");
  const [callState, setCallState] = useState<"idle" | "dialing" | "incoming" | "active">("idle");
  const [message, setMessage] = useState(""), [extension, setExtension] = useState(""), [remote, setRemote] = useState("");
  const [muted, setMuted] = useState(false);

  const clearRegistrationTimer = () => { if (registrationTimer.current) clearTimeout(registrationTimer.current); registrationTimer.current = null; };
  const clearReconnectTimer = () => { if (reconnectTimer.current) clearTimeout(reconnectTimer.current); reconnectTimer.current = null; };
  const clearTimers = () => { clearRegistrationTimer(); clearReconnectTimer(); };

  function scheduleReconnect(reason: string) {
    clearReconnectTimer();
    const online = typeof navigator === "undefined" || navigator.onLine;
    if (!shouldReconnect({ manuallyStopped: manuallyStopped.current, online, attempt: retryAttempt.current })) {
      setState(online ? "error" : "offline");
      setMessage(online ? `${reason} Bấm Thử lại nếu cần.` : "Mất mạng. Điện thoại sẽ tự kết nối khi có Internet.");
      return;
    }
    const delay = reconnectDelay(retryAttempt.current++);
    setState("connecting");
    setMessage(`${reason} Tự kết nối lại sau ${Math.ceil(delay / 1000)} giây…`);
    reconnectTimer.current = setTimeout(() => {
      if (ua.current?.isRegistered()) return;
      ua.current?.stop(); ua.current = null; connecting.current = false;
      connectRef.current();
    }, delay);
  }

  function disconnect() {
    manuallyStopped.current = true; clearTimers(); connecting.current = false;
    ua.current?.stop(); ua.current = null; session.current = null;
    if (audio.current) { audio.current.pause(); audio.current.srcObject = null; }
    setState("offline"); setCallState("idle"); setMuted(false); setMessage("Đã ngắt điện thoại ITY.");
  }

  async function startConnection() {
    if (ua.current || connecting.current) return;
    connecting.current = true; setState("connecting"); setMessage("Đang tự động đăng ký máy lẻ…");
    try {
      const config = await loadWebphoneConfig();
      if (manuallyStopped.current) { connecting.current = false; config.password = ""; return; }
      const JsSIP = await import("jssip");
      const client = new JsSIP.UA({ sockets: [new JsSIP.WebSocketInterface(config.wss)], uri: config.uri, password: config.password, authorization_user: config.extension, register: true, register_expires: 300, session_timers: false });
      config.password = "";
      ua.current = client; domain.current = config.domain; setExtension(config.extension); connecting.current = false;
      client.on("registered", () => { clearTimers(); retryAttempt.current = 0; setState("ready"); setMessage("Máy lẻ tự động kết nối, sẵn sàng nghe/gọi."); });
      client.on("registrationFailed", () => {
        clearRegistrationTimer();
        if (ua.current === client) { client.stop(); ua.current = null; connecting.current = false; scheduleReconnect("Đăng ký máy lẻ chưa thành công."); }
      });
      client.on("disconnected", () => {
        if (ua.current === client && !manuallyStopped.current) scheduleReconnect("Mất kết nối tổng đài.");
      });
      client.on("newRTCSession", (event: RTCSessionEvent) => {
        if (session.current && !session.current.isEnded()) { event.session.terminate({ status_code: 486 }); return; }
        const current = event.session; session.current = current;
        setRemote(current.remote_identity.uri.user || "Không rõ số"); setMuted(false);
        setCallState(event.originator === "remote" ? "incoming" : "dialing");
        const playRemoteAudio = (stream: MediaStream) => {
          if (!audio.current) audio.current = new Audio();
          audio.current.autoplay = true;
          audio.current.muted = false;
          audio.current.volume = 1;
          audio.current.setAttribute("playsinline", "true");
          audio.current.srcObject = stream;
          void audio.current.play().catch(() => setMessage("Bấm Nghe âm thanh để bật tiếng cuộc gọi."));
        };
        current.on("peerconnection", ({ peerconnection }: PeerConnectionEvent) => {
          peerconnection.addEventListener("track", (track) => {
            playRemoteAudio(track.streams[0] || new MediaStream([track.track]));
          });
          peerconnection.addEventListener("addstream", (streamEvent) => {
            const stream = (streamEvent as Event & { stream?: MediaStream }).stream;
            if (stream) playRemoteAudio(stream);
          });
        });
        current.on("confirmed", () => {
          setCallState("active");
          const streams = current.connection?.getRemoteStreams?.() || [];
          if (streams[0]) playRemoteAudio(streams[0]);
          setMessage("Đang đàm thoại qua tổng đài ITY.");
        });
        current.on("progress", () => setMessage("Tổng đài ITY đã tiếp nhận, đang đổ chuông…"));
        const finish = (failed: boolean, event?: EndEvent) => {
          session.current = null; setCallState("idle"); setMuted(false);
          if (audio.current) { audio.current.pause(); audio.current.srcObject = null; }
          setMessage(failed ? callFailureMessage(event) : "Cuộc gọi đã kết thúc. Lịch sử đầy đủ sẽ được cập nhật khi ITY gửi webhook.");
        };
        current.on("ended", () => finish(false)); current.on("failed", (event: EndEvent) => finish(true, event));
      });
      registrationTimer.current = setTimeout(() => {
        if (ua.current === client && !client.isRegistered()) { client.stop(); ua.current = null; connecting.current = false; scheduleReconnect("Hết thời gian đăng ký."); }
      }, 15000);
      client.start();
    } catch (error) {
      clearRegistrationTimer(); connecting.current = false; ua.current?.stop(); ua.current = null;
      if (shouldRetryWebphoneError(error)) scheduleReconnect("Kết nối tổng đài bị gián đoạn.");
      else { setState("error"); setMessage(friendlyWebphoneMessage(error)); }
    }
  }

  function connect() { manuallyStopped.current = false; retryAttempt.current = 0; clearReconnectTimer(); return startConnection(); }
  useEffect(() => { connectRef.current = () => { void startConnection(); }; });

  useEffect(() => {
    manuallyStopped.current = false;
    const initial = setTimeout(() => connectRef.current(), 250);
    const reconnect = () => { if (!ua.current?.isRegistered()) { manuallyStopped.current = false; retryAttempt.current = 0; connectRef.current(); } };
    const visible = () => { if (document.visibilityState === "visible") reconnect(); };
    window.addEventListener("online", reconnect); document.addEventListener("visibilitychange", visible);
    return () => {
      clearTimeout(initial); manuallyStopped.current = true;
      if (registrationTimer.current) clearTimeout(registrationTimer.current);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      window.removeEventListener("online", reconnect); document.removeEventListener("visibilitychange", visible);
      ua.current?.stop(); ua.current = null; if (audio.current) audio.current.srcObject = null;
    };
  }, []);

  async function call(phone: string, userfield?: string) {
    if (!ua.current?.isRegistered()) {
      setMessage("Máy lẻ đang mất kết nối. Hệ thống sẽ tự kết nối lại rồi bạn có thể gọi.");
      if (!manuallyStopped.current && !connecting.current && !reconnectTimer.current) scheduleReconnect("Mất kết nối tổng đài.");
      return;
    }
    if (session.current) { setMessage("Đang có cuộc gọi. Kết thúc cuộc gọi hiện tại trước khi gọi tiếp."); return; }
    const number = ityDialPhone(phone);
    if (!/^\+?\d{7,15}$/.test(number)) { setMessage("Nhập số điện thoại hợp lệ."); return; }
    setMessage("Đang gửi yêu cầu gọi tới tổng đài ITY…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (!ua.current?.isRegistered() || session.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      try {
        const active = ua.current.call(`sip:${number}@${domain.current}`, { mediaStream: stream, mediaConstraints: { audio: true, video: false }, extraHeaders: userfield ? [`X-userfield: ${userfield.replace(/[^a-zA-Z0-9_-]/g, "")}`] : [] });
        const stop = () => stream.getTracks().forEach((track) => track.stop()); active.on("ended", stop); active.on("failed", stop);
      } catch { stream.getTracks().forEach((track) => track.stop()); setMessage("Không khởi tạo được cuộc gọi."); }
    } catch { setMessage("Cần cho phép microphone để gọi điện."); }
  }
  function answer() { try { session.current?.answer({ mediaConstraints: { audio: true, video: false } }); } catch { setMessage("Không nhận được cuộc gọi. Kiểm tra microphone."); } }
  function hangup() { session.current?.terminate(); }
  function toggleMute() { if (!session.current) return; if (muted) session.current.unmute({ audio: true }); else session.current.mute({ audio: true }); setMuted(!muted); }
  function playAudio() { void audio.current?.play().catch(() => setMessage("Chưa phát được âm thanh.")); }
  return { state, callState, message, extension, remote, muted, connect, disconnect, call, answer, hangup, toggleMute, playAudio };
}
