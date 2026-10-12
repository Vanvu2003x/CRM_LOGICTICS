"use client";

import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { useUserContext } from "./UserContext";

const input = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

export function MyAccount() {
  const { currentUser, setCurrentUser } = useUserContext();
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const passwordValid = !password || (password.length >= 8 && password === confirmPassword);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!passwordValid) { setMessage({ text: "Mật khẩu mới cần ít nhất 8 ký tự và hai ô phải trùng nhau.", ok: false }); return; }
    setBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, currentPassword, password, confirmPassword }),
      });
      const result = await response.json();
      if (!response.ok) { setMessage({ text: result.error || "Không lưu được thông tin.", ok: false }); return; }
      setCurrentUser(result.user); setCurrentPassword(""); setPassword(""); setConfirmPassword("");
      setMessage({ text: password ? "Đã đổi mật khẩu và đăng xuất các phiên khác." : "Đã cập nhật thông tin tài khoản.", ok: true });
    } catch { setMessage({ text: "Mất kết nối. Vui lòng thử lại.", ok: false }); } finally { setBusy(false); }
  }

  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b p-4 sm:p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><UserRound className="size-5" /></span>
        <div><h2 className="font-bold text-slate-950">Thông tin tài khoản</h2><p className="mt-1 text-xs text-slate-500">Cập nhật hồ sơ và mật khẩu đăng nhập CRM.</p></div>
      </div>
      <form onSubmit={save} className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Họ và tên" icon={UserRound}><input required maxLength={150} className={`${input} pl-10`} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></Field>
          <Field label="Email đăng nhập" icon={Mail}><input required maxLength={200} type="email" className={`${input} pl-10`} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></Field>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-4 flex items-center gap-2"><KeyRound className="size-4 text-blue-600" /><h3 className="text-sm font-bold text-slate-900">Đổi mật khẩu</h3><span className="text-[10px] text-slate-400">Có thể để trống nếu chỉ sửa hồ sơ</span></div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Mật khẩu hiện tại" icon={LockKeyhole}><PasswordInput value={currentPassword} onChange={setCurrentPassword} show={showPasswords} autoComplete="current-password" required /></Field>
            <Field label="Mật khẩu mới" icon={KeyRound}><PasswordInput value={password} onChange={setPassword} show={showPasswords} autoComplete="new-password" /></Field>
            <Field label="Xác nhận mật khẩu mới" icon={CheckCircle2}><PasswordInput value={confirmPassword} onChange={setConfirmPassword} show={showPasswords} autoComplete="new-password" /></Field>
          </div>
          <button type="button" onClick={() => setShowPasswords((value) => !value)} className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-blue-600">{showPasswords ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}{showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</button>
        </div>
        {message && <p role="status" className={`rounded-xl px-3 py-2.5 text-xs font-medium ${message.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{message.text}</p>}
        <button disabled={busy || !currentPassword || !passwordValid} type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><Save className="size-4" />{busy ? "Đang lưu…" : password ? "Cập nhật & đổi mật khẩu" : "Lưu thông tin"}</button>
      </form>
    </section>
    <aside className="space-y-4">
      <section className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck className="size-5" /></span><div><h2 className="text-sm font-bold">Bảo mật tài khoản</h2><p className="mt-0.5 text-[10px] text-slate-500">Phiên đăng nhập được bảo vệ</p></div></div><div className="mt-5 space-y-3 text-xs"><Info label="Vai trò" value={roleName(currentUser?.role)} /><Info label="Máy lẻ ITY" value={currentUser?.extension || "Chưa được gán"} /><Info label="Đội nhóm" value={currentUser?.teamId ? "Đã phân nhóm" : "Chưa phân nhóm"} /></div></section>
      <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4"><h3 className="text-xs font-bold text-blue-900">Mật khẩu an toàn</h3><ul className="mt-3 space-y-2 text-[11px] leading-4 text-blue-800"><li>• Tối thiểu 8 ký tự.</li><li>• Nên kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt.</li><li>• Khi đổi mật khẩu, các phiên đăng nhập khác sẽ bị thu hồi.</li></ul></section>
    </aside>
  </div>;
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof UserRound; children: React.ReactNode }) { return <label className="space-y-1.5"><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</span><span className="relative block"><Icon className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400" />{children}</span></label>; }
function PasswordInput({ value, onChange, show, autoComplete, required = false }: { value: string; onChange: (value: string) => void; show: boolean; autoComplete: string; required?: boolean }) { return <input required={required} minLength={required ? undefined : 8} maxLength={100} type={show ? "text" : "password"} className={`${input} pl-10`} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} placeholder={required ? "Nhập mật khẩu hiện tại" : "Tối thiểu 8 ký tự"} />; }
function Info({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 border-t pt-3 first:border-0 first:pt-0"><span className="text-slate-500">{label}</span><b className="text-right text-slate-800">{value}</b></div>; }
function roleName(role?: string) { return role === "ADMIN" ? "Quản trị viên" : role === "MANAGER" ? "Trưởng nhóm" : "Nhân viên Sales"; }
