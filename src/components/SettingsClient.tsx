"use client";
import { useListPagination } from "@/hooks/use-list-pagination";

import { useCallback, useEffect, useState } from "react";
import type { PublicUser } from "@/lib/auth";
import type { ItyConfig } from "@/lib/ity";
import { MyAccount } from "@/components/auth/MyAccount";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Activity, BadgeCheck, BellRing, Building2, CheckCircle2, ChevronRight, CircleDot,
  ClipboardCopy, FileSpreadsheet, Gauge, Headphones, KeyRound, LayoutGrid, LockKeyhole,
  Pencil, PhoneCall, Plus, RefreshCw, Save, ServerCog, ShieldCheck, Sparkles, UsersRound,
} from "lucide-react";

type Section = "overview" | "account" | "users";
type Team = { id: string; name: string };
type WebphoneAccount = { extension: string; userId: string | null };
type UiItyConfig = Omit<ItyConfig, "secret">;
type DraftUser = { id: string; name: string; email: string; role: string; teamId: string; extension: string; password: string };

const input = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
const card = "rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_35px_-30px_rgba(15,23,42,.45)]";
const emptyDraft: DraftUser = { id: "", name: "", email: "", role: "SALES", teamId: "", extension: "", password: "" };

const sectionMeta: Record<Section, { label: string; description: string; icon: typeof LayoutGrid }> = {
  overview: { label: "Tổng quan", description: "Trạng thái hệ thống", icon: LayoutGrid },
  account: { label: "Tài khoản", description: "Hồ sơ & mật khẩu", icon: KeyRound },
  users: { label: "Người dùng", description: "Tài khoản nhân viên", icon: UsersRound },
};

export default function SettingsClient({ activeUser, initialSection = "overview" }: { activeUser: PublicUser; initialSection?: string }) {
  const admin = activeUser.role === "ADMIN";
  const normalized = normalizeSection(initialSection, admin);
  const [section, setSection] = useState<Section>(normalized);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [webphoneAccounts, setWebphoneAccounts] = useState<WebphoneAccount[]>([]);
  const [draft, setDraft] = useState<DraftUser>(emptyDraft);
  const [editorOpen, setEditorOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(admin);

  const load = useCallback(async () => {
    if (!admin) return;
    setLoading(true);
    try {
      const response = await fetch("/api/settings", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không tải được cấu hình.");
      setUsers(data.users); setTeams(data.teams); setWebphoneAccounts(data.webphoneAccounts || []);
    } catch (error) { setMessage({ text: error instanceof Error ? error.message : "Không tải được cấu hình.", ok: false }); } finally { setLoading(false); }
  }, [admin]);

  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);

  async function save(action: string, data: object, success = "Đã lưu cấu hình.") {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, data }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không lưu được cấu hình.");
      setMessage({ text: success, ok: true }); await load(); return true;
    } catch (error) { setMessage({ text: error instanceof Error ? error.message : "Không lưu được cấu hình.", ok: false }); return false; } finally { setBusy(false); }
  }

  const sections = (Object.keys(sectionMeta) as Section[]).filter((item) => admin || item === "account");
  const currentMeta = sectionMeta[section];

  return <div className="space-y-4 pb-10 sm:space-y-5">
    <section className="relative overflow-hidden rounded-2xl bg-[#071b3a] px-5 py-5 text-white shadow-[0_22px_60px_-34px_rgba(15,42,86,.8)] sm:px-7 sm:py-6">
      <div className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-cyan-300"><ServerCog className="size-4" /> Thiết lập CRM</div><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{admin ? "Trung tâm quản trị hệ thống" : "Tài khoản & bảo mật"}</h1><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-300 sm:text-sm">{admin ? "Quản lý tài khoản nhân viên và bảo mật đăng nhập tại một nơi." : "Cập nhật thông tin đăng nhập và chủ động đổi mật khẩu của bạn."}</p></div><span className="inline-flex h-9 w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-semibold"><ShieldCheck className="size-4 text-emerald-300" />{admin ? "Toàn quyền hệ thống" : roleLabel(activeUser.role)}</span></div>
    </section>

    <div className="grid gap-4 xl:grid-cols-[230px_minmax(0,1fr)]">
      <aside className={`${card} h-fit overflow-hidden p-2 xl:sticky xl:top-24`}>
        <nav aria-label="Thiết lập hệ thống" className="grid grid-cols-3 gap-1 xl:block xl:space-y-1">
          {sections.map((item) => { const meta = sectionMeta[item]; const Icon = meta.icon; const active = section === item; return <button key={item} onClick={() => setSection(item)} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-center transition sm:flex-row sm:gap-2 sm:px-3 sm:text-left xl:w-full xl:justify-start xl:gap-3 xl:py-2.5 ${active ? "bg-blue-600 text-white shadow-md shadow-blue-600/15" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><span className={`grid size-8 shrink-0 place-items-center rounded-lg ${active ? "bg-white/15" : "bg-slate-100"}`}><Icon className="size-4" /></span><span className="min-w-0 xl:flex-1"><b className="block truncate text-[10px] sm:text-xs">{meta.label}</b><span className={`hidden text-[9px] xl:block ${active ? "text-blue-100" : "text-slate-400"}`}>{meta.description}</span></span>{active && <ChevronRight className="hidden size-3.5 xl:block" />}</button>; })}
        </nav>
      </aside>

      <main className="min-w-0 space-y-4">
        <div className="flex items-center gap-3 px-1"><span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><currentMeta.icon className="size-4" /></span><div><h2 className="font-bold text-slate-950">{currentMeta.label}</h2><p className="text-[10px] text-slate-500">{currentMeta.description}</p></div></div>
        {message && <div role="status" className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium ${message.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{message.ok ? <CheckCircle2 className="size-4" /> : <CircleDot className="size-4" />}{message.text}</div>}
        {loading ? <Loading /> : <>
          {section === "overview" && admin && <Overview users={users} setSection={setSection} />}
          {section === "account" && <MyAccount />}
          {section === "users" && admin && <UsersPanel users={users} teams={teams} webphoneAccounts={webphoneAccounts} onCreate={() => { setDraft(emptyDraft); setEditorOpen(true); }} onEdit={(user) => { setDraft(toDraft(user)); setEditorOpen(true); }} />}
        </>}
      </main>
    </div>

    <UserEditor open={editorOpen} setOpen={setEditorOpen} draft={draft} setDraft={setDraft} teams={teams} accounts={webphoneAccounts} busy={busy} submit={async () => { if (await save("user", draft, draft.id ? "Đã cập nhật tài khoản." : "Đã tạo tài khoản mới.")) setEditorOpen(false); }} />
  </div>;
}

function Overview({ users, setSection }: { users: PublicUser[]; setSection: (section: Section) => void }) {
  const cards = [
    { label: "Tổng tài khoản", value: users.length, note: "đang quản lý", icon: UsersRound, color: "blue", section: "users" as Section },
    { label: "Nhân viên Sales", value: users.filter((user) => user.role === "SALES").length, note: "tài khoản nghiệp vụ", icon: UsersRound, color: "emerald", section: "users" as Section },
    { label: "Quản lý", value: users.filter((user) => user.role === "MANAGER").length, note: "Manager đang hoạt động", icon: ShieldCheck, color: "violet", section: "users" as Section },
    { label: "Tài khoản của tôi", value: "Bảo mật", note: "hồ sơ & mật khẩu", icon: KeyRound, color: "amber", section: "account" as Section },
  ];
  return <div className="space-y-4"><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map((item) => <button key={item.label} onClick={() => setSection(item.section)} className={`${card} min-w-0 p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-4`}><span className={`grid size-9 place-items-center rounded-xl ${tone[item.color]}`}><item.icon className="size-4" /></span><p className="mt-3 text-[9px] font-bold uppercase tracking-wide text-slate-500 sm:mt-4 sm:text-[10px]">{item.label}</p><p className="mt-1 truncate text-lg font-bold text-slate-950 sm:text-xl">{item.value}</p><p className="mt-1 truncate text-[9px] text-slate-500 sm:text-[10px]">{item.note}</p></button>)}</div><section className={`${card} p-4 sm:p-5`}><Header icon={Gauge} title="Sẵn sàng vận hành" note="Kiểm tra nhanh tài khoản truy cập CRM" /><div className="mt-5 grid gap-2 sm:grid-cols-2"><Health label="Tài khoản Admin" ok={users.some((user) => user.role === "ADMIN")} detail="Có quyền quản trị toàn hệ thống" /><Health label="Nhân viên Sales" ok={users.some((user) => user.role === "SALES")} detail="Có tài khoản nghiệp vụ" /><Health label="Tài khoản Manager" ok={users.some((user) => user.role === "MANAGER")} detail="Quản lý nhân viên theo vai trò" /><Health label="Máy lẻ nhân viên" ok={users.some((user) => Boolean(user.extension))} detail={`${users.filter((user) => Boolean(user.extension)).length} tài khoản đã gán máy lẻ`} /></div></section></div>;
}

function UsersPanel({ users, teams, webphoneAccounts, onCreate, onEdit }: { users: PublicUser[]; teams: Team[]; webphoneAccounts: WebphoneAccount[]; onCreate: () => void; onEdit: (user: PublicUser) => void }) {

  const paging=useListPagination(users,"",20);
  return <><section className={`${card} overflow-hidden`}><div className="flex items-center justify-between gap-3 border-b p-4 sm:p-5"><Header icon={UsersRound} title="Tài khoản nhân viên" note={`${users.length} tài khoản · phân quyền theo vai trò và team`} /><button onClick={onCreate} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-lg shadow-blue-600/15"><Plus className="size-4" /> <span className="hidden sm:inline">Thêm tài khoản</span></button></div><div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr>{["Nhân viên", "Vai trò", "Team", "Máy lẻ ITY", "Trạng thái", ""].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{paging.items.map((user) => { const hasAccount = Boolean(user.extension && webphoneAccounts.some((account) => account.extension === user.extension)); return <tr key={user.id} className="border-t hover:bg-blue-50/30"><td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={user.name} /><div><b>{user.name}</b><p className="mt-0.5 text-[9px] text-slate-400">{user.email}</p></div></div></td><td className="px-4 py-3"><Role role={user.role} /></td><td className="px-4 py-3">{teams.find((team) => team.id === user.teamId)?.name || "—"}</td><td className="px-4 py-3"><b>{user.extension || "—"}</b>{user.extension && <p className={`mt-0.5 text-[9px] ${hasAccount ? "text-emerald-600" : "text-amber-600"}`}>{hasAccount ? "Có tài khoản SIP" : "Chưa có SIP"}</p>}</td><td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700"><span className="size-1.5 rounded-full bg-emerald-500" /> Hoạt động</span></td><td className="px-4 py-3 text-right"><button onClick={() => onEdit(user)} className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600"><Pencil className="size-3" /> Sửa</button></td></tr>; })}</tbody></table></div><div className="divide-y sm:hidden">{paging.items.map((user) => <button key={user.id} onClick={() => onEdit(user)} className="flex w-full items-center gap-3 p-4 text-left"><Avatar name={user.name} /><span className="min-w-0 flex-1"><b className="block truncate text-xs">{user.name}</b><span className="mt-1 block truncate text-[10px] text-slate-500">{user.email} · {user.extension || "chưa có máy lẻ"}</span></span><Role role={user.role} /><ChevronRight className="size-4 text-slate-300" /></button>)}</div></section>{paging.controls}</>;
}

// Kept as an internal implementation reference; the customer-facing section is intentionally hidden.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TeamsPanel({ teams, users, team, setTeam, busy, add, managers }: { teams: Team[]; users: PublicUser[]; team: string; setTeam: (value: string) => void; busy: boolean; add: () => void; managers: number }) {

  const paging=useListPagination(teams,"",20);
  return <><div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]"><section className={`${card} p-4 sm:p-5`}><Header icon={Building2} title="Cơ cấu đội nhóm" note={`${teams.length} team · ${managers} trưởng nhóm`} /><div className="mt-5 grid gap-3 sm:grid-cols-2">{paging.items.map((item) => { const members = users.filter((user) => user.teamId === item.id); return <article key={item.id} className="rounded-2xl border bg-slate-50/50 p-4"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><UsersRound className="size-4" /></span><b className="text-xs text-slate-500">{members.length} thành viên</b></div><h3 className="mt-4 font-bold text-slate-950">{item.name}</h3><p className="mt-1 text-[10px] text-slate-500">{members.filter((member) => member.role === "MANAGER").map((member) => member.name).join(", ") || "Chưa có trưởng nhóm"}</p><div className="mt-3 flex -space-x-1">{members.slice(0,6).map((member) => <span key={member.id} title={member.name} className="grid size-6 place-items-center rounded-full border-2 border-white bg-slate-200 text-[8px] font-bold text-slate-600">{member.name.slice(0, 1)}</span>)}</div></article>; })}{!teams.length && <p className="text-xs text-slate-500">Chưa có team nào.</p>}</div></section><aside className="space-y-4"><section className={`${card} p-4`}><h3 className="text-sm font-bold">Tạo team mới</h3><p className="mt-1 text-[10px] leading-4 text-slate-500">Sau khi tạo, gán nhân viên và Manager tại mục Người dùng.</p><input aria-label="Tên team" className={`${input} mt-4`} value={team} placeholder="VD: Sales miền Bắc" onChange={(event) => setTeam(event.target.value)} /><button disabled={busy || !team.trim()} onClick={add} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white disabled:opacity-50"><Plus className="size-4" /> Thêm team</button></section><section className={`${card} p-4`}><h3 className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="size-4 text-emerald-600" /> Phạm vi quyền</h3><div className="mt-4 space-y-3"><Permission role="Admin" text="Toàn bộ dữ liệu và cấu hình" /><Permission role="Manager" text="Nhân viên thuộc team mình" /><Permission role="Sales" text="Dữ liệu được giao cho cá nhân" /></div></section></aside></div>{paging.controls}</>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ItyPanel({ ity, setIty, webhook, accounts, users, busy, save, notify, editUser }: { ity: UiItyConfig; setIty: (value: UiItyConfig) => void; webhook: { customer: string; path: string }; accounts: WebphoneAccount[]; users: PublicUser[]; busy: boolean; save: () => void; notify: (value: { text: string; ok: boolean }) => void; editUser: (user: PublicUser) => void }) {

  const paging=useListPagination(accounts,"",20);
  const assigned = accounts.filter((account) => account.userId).length;
  async function copyWebhook() { try { const response=await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"webhook-url",data:{}})});const result=await response.json();if(!response.ok)throw new Error(result.error);await navigator.clipboard.writeText(window.location.origin+result.path);notify({ text: "Đã sao chép webhook kèm khóa xác thực. Chỉ gửi URL này cho ITY.", ok: true }); } catch(error) { notify({ text: error instanceof Error&&error.message?error.message:"Trình duyệt chưa cho phép sao chép.", ok: false }); } }
  return <><div className="space-y-4"><div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]"><section className={`${card} p-4 sm:p-5`}><Header icon={Headphones} title="Kết nối tổng đài" note="REST click-to-call và thông tin định danh ITY" /><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Chế độ"><select className={input} value={ity.mode} onChange={(event) => setIty({ ...ity, mode: event.target.value as UiItyConfig["mode"] })}><option value="DEMO">Demo · mô phỏng</option><option value="LIVE">Live · kết nối thật</option></select></Field><Field label="Mã khách hàng ITY"><input className={input} value={ity.customer} onChange={(event) => setIty({ ...ity, customer: event.target.value })} placeholder="C90933" /></Field><Field label="Domain tổng đài"><input className={input} value={ity.domain} onChange={(event) => setIty({ ...ity, domain: event.target.value })} placeholder="c90933.ity.vn" /></Field><Field label="Máy chủ click-to-call"><input className={input} value={ity.server} onChange={(event) => setIty({ ...ity, server: event.target.value })} placeholder="https://..." /></Field></div><button disabled={busy} onClick={save} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white disabled:opacity-50"><Save className="size-4" /> Lưu kết nối</button></section><section className={`${card} p-4 sm:p-5`}><div className="flex items-start justify-between"><Header icon={Activity} title="Trạng thái" note="Cấu hình hiện tại" /><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${ity.mode === "LIVE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{ity.mode}</span></div><div className="mt-5 space-y-3"><InfoRow label="Mã khách" value={ity.customer || "Chưa cấu hình"} /><InfoRow label="Domain" value={ity.domain || "Chưa cấu hình"} /><InfoRow label="Máy lẻ đã gán" value={`${assigned}/${accounts.length}`} /><InfoRow label="Webhook" value={webhook.path ? "Sẵn sàng" : "Chưa sẵn sàng"} /></div></section></div><section className={`${card} p-4 sm:p-5`}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><Header icon={ServerCog} title="Webhook nhận lịch sử cuộc gọi" note="ITY gửi POST khi cuộc gọi kết thúc; CRM tự lưu và chống trùng callid" /><button disabled={!webhook.path} onClick={copyWebhook} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border px-3 text-[10px] font-bold text-blue-600 disabled:opacity-40"><ClipboardCopy className="size-3.5" /> Sao chép URL đầy đủ</button></div><div className="mt-4 break-all rounded-xl border bg-slate-950 p-3 font-mono text-[10px] leading-5 text-emerald-300">{webhook.path ? `${typeof window === "undefined" ? "https://crm.example.vn" : window.location.origin}${webhook.path.split("?")[0]}?secret=••••••••••••` : "Chưa có cấu hình webhook"}</div><p className="mt-3 text-[10px] text-amber-700">Khóa webhook được che trên màn hình. Nút sao chép vẫn lấy URL đầy đủ để gửi trực tiếp cho ITY.</p></section><section className={`${card} overflow-hidden`}><div className="flex items-center justify-between border-b p-4 sm:p-5"><Header icon={PhoneCall} title="Máy lẻ Webphone" note="Mỗi máy lẻ gán cho tối đa một nhân viên" /><span className="text-[10px] text-slate-400">{assigned}/{accounts.length} đã gán</span></div><div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-4">{paging.items.map((account) => { const owner = users.find((user) => user.id === account.userId); return <article key={account.extension} className={`rounded-xl border p-3 ${owner ? "bg-emerald-50/40" : "bg-slate-50"}`}><div className="flex items-center justify-between"><b className="text-sm">{account.extension}</b><span className={`size-2 rounded-full ${owner ? "bg-emerald-500" : "bg-slate-300"}`} /></div><p className="mt-2 truncate text-[10px] text-slate-500">{owner?.name || "Chưa gán nhân viên"}</p>{owner && <button onClick={() => editUser(owner)} className="mt-2 text-[10px] font-bold text-blue-600">Sửa phân công →</button>}</article>; })}{!accounts.length && <p className="col-span-full py-8 text-center text-xs text-slate-500">Chưa khai báo tài khoản SIP trên server.</p>}</div></section></div>{paging.controls}</>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Policies() {
  const rules = [
    { icon: BellRing, title: "Nhắc chăm sóc Lead", value: "Theo lịch follow-up", note: "Cảnh báo Sales khi đến hạn hoặc quá hạn chăm sóc." },
    { icon: Sparkles, title: "Chiến dịch truyền thông", value: "Nhắc trước 2 ngày", note: "Quá hạn phát sinh một bài bổ sung cho mỗi ngày chậm." },
    { icon: PhoneCall, title: "KPI mạng xã hội", value: "3 bài + 5 bình luận / ca", note: "Chỉ tính từ thời điểm nhân viên chấm công." },
    { icon: BellRing, title: "Công nợ", value: "Cảnh báo trước 7 ngày", note: "Theo ngày đến hạn trên hóa đơn của đơn hàng." },
  ];
  return <div className="space-y-4"><section className={`${card} p-4 sm:p-5`}><Header icon={ServerCog} title="Quy tắc đang áp dụng" note="Các mốc nghiệp vụ thống nhất trong toàn CRM" /><div className="mt-5 grid gap-3 sm:grid-cols-2">{rules.map((rule) => <article key={rule.title} className="rounded-2xl border bg-slate-50/60 p-4"><span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><rule.icon className="size-4" /></span><h3 className="mt-4 text-sm font-bold">{rule.title}</h3><p className="mt-1 text-xs font-semibold text-blue-600">{rule.value}</p><p className="mt-2 text-[10px] leading-4 text-slate-500">{rule.note}</p></article>)}</div></section><section className={`${card} p-4 sm:p-5`}><Header icon={FileSpreadsheet} title="Mẫu biểu xuất dữ liệu" note="Các mẫu hiện được gắn với đúng bước nghiệp vụ" /><div className="mt-5 grid gap-3 sm:grid-cols-3"><Template name="Báo giá PDF" location="Bước báo giá" /><Template name="Bảng chi phí Excel" location="Bước tổng hợp giá" /><Template name="Báo cáo ITY CSV" location="Trang Báo cáo" /></div><p className="mt-4 rounded-xl bg-amber-50 p-3 text-[10px] leading-4 text-amber-800">Mẫu B/L chuẩn và bộ nhận diện PDF cần file chính thức của công ty trước khi cho phép thay thế tại đây.</p></section></div>;
}

function UserEditor({ open, setOpen, draft, setDraft, teams, accounts, busy, submit }: { open: boolean; setOpen: (open: boolean) => void; draft: DraftUser; setDraft: (draft: DraftUser) => void; teams: Team[]; accounts: WebphoneAccount[]; busy: boolean; submit: () => void }) {
  const createPassword = () => { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%"; const bytes = crypto.getRandomValues(new Uint8Array(14)); setDraft({ ...draft, password: Array.from(bytes, (value) => chars[value % chars.length]).join("") }); };
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{draft.id ? "Chỉnh sửa tài khoản" : "Tạo tài khoản nhân viên"}</DialogTitle></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><Field label="Họ và tên"><input className={input} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Nguyễn Văn A" /></Field><Field label="Email đăng nhập"><input className={input} type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} placeholder="sales@company.com" /></Field><Field label="Vai trò"><select className={input} value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })}><option value="SALES">Sales</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option></select></Field><Field label="Team"><select className={input} value={draft.teamId} onChange={(event) => setDraft({ ...draft, teamId: event.target.value })}><option value="">Chưa có team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></Field><Field label="Máy lẻ ITY"><select className={input} value={draft.extension} onChange={(event) => setDraft({ ...draft, extension: event.target.value })}><option value="">Chưa gán máy lẻ</option>{draft.extension && !accounts.some((account) => account.extension === draft.extension) && <option value={draft.extension}>{draft.extension}</option>}{accounts.map((account) => <option key={account.extension} value={account.extension} disabled={Boolean(account.userId && account.userId !== draft.id)}>{account.extension}{account.userId && account.userId !== draft.id ? " · đã gán" : ""}</option>)}</select></Field><Field label={draft.id ? "Mật khẩu mới (không đổi để trống)" : "Mật khẩu khởi tạo"}><div className="flex gap-2"><input className={input} type="text" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} placeholder="Tối thiểu 8 ký tự" /><button type="button" onClick={createPassword} className="shrink-0 rounded-xl border px-3 text-[10px] font-bold text-blue-600">Tạo nhanh</button></div></Field></div><div className="rounded-xl bg-blue-50 p-3 text-[10px] leading-4 text-blue-800">Admin xem toàn hệ thống; Manager xem team của mình; Sales chỉ xem khách, đơn và công việc được giao.</div><button disabled={busy || !draft.name.trim() || !draft.email.trim() || (!draft.id && draft.password.length < 8)} onClick={submit} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white disabled:opacity-50"><Save className="size-4" />{busy ? "Đang lưu…" : draft.id ? "Lưu thay đổi" : "Tạo tài khoản"}</button></DialogContent></Dialog>;
}

const tone: Record<string, string> = { blue: "bg-blue-50 text-blue-600", violet: "bg-violet-50 text-violet-600", emerald: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600" };
function Header({ icon: Icon, title, note }: { icon: typeof Gauge; title: string; note: string }) { return <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon className="size-4" /></span><div><h3 className="text-sm font-bold text-slate-950">{title}</h3><p className="mt-0.5 text-[10px] text-slate-500">{note}</p></div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-1.5"><span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</span>{children}</label>; }
function Health({ label, ok, detail }: { label: string; ok: boolean; detail: string }) { return <div className="flex items-center gap-3 rounded-xl border bg-slate-50/50 p-3"><span className={`grid size-8 place-items-center rounded-full ${ok ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>{ok ? <BadgeCheck className="size-4" /> : <CircleDot className="size-4" />}</span><div><b className="text-xs">{label}</b><p className="mt-0.5 text-[9px] text-slate-500">{detail}</p></div></div>; }
function Permission({ role, text }: { role: string; text: string }) { return <div className="border-t pt-3 first:border-0 first:pt-0"><div className="flex items-center justify-between"><b className="text-xs">{role}</b><LockKeyhole className="size-3.5 text-slate-400" /></div><p className="mt-1 text-[10px] text-slate-500">{text}</p></div>; }
function Template({ name, location }: { name: string; location: string }) { return <article className="rounded-xl border p-3"><span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><FileSpreadsheet className="size-4" /></span><b className="mt-3 block text-xs">{name}</b><p className="mt-1 text-[9px] text-slate-500">{location}</p></article>; }
function InfoRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 border-t pt-3 first:border-0 first:pt-0"><span className="text-[10px] text-slate-500">{label}</span><b className="max-w-[65%] truncate text-right text-xs">{value}</b></div>; }
function Avatar({ name }: { name: string }) { return <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">{name.split(" ").slice(-2).map((part) => part[0]).join("").toUpperCase()}</span>; }
function Role({ role }: { role: string }) { const style = role === "ADMIN" ? "bg-violet-50 text-violet-700" : role === "MANAGER" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"; return <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${style}`}>{roleLabel(role)}</span>; }
function Loading() { return <div className={`${card} grid min-h-72 place-items-center`}><span className="flex items-center gap-2 text-xs text-slate-500"><RefreshCw className="size-4 animate-spin" /> Đang tải thiết lập…</span></div>; }
function toDraft(user: PublicUser): DraftUser { return { id: user.id, name: user.name, email: user.email, role: user.role, teamId: user.teamId || "", extension: user.extension || "", password: "" }; }
function roleLabel(role: string) { return role === "ADMIN" ? "Admin" : role === "MANAGER" ? "Manager" : "Sales"; }
function normalizeSection(section: string, admin: boolean): Section { if (!admin) return "account"; const map: Record<string, Section> = { users: "users", account: "account", overview: "overview" }; return map[section] || "overview"; }
