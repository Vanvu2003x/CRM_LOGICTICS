"use client";

import type { Campaign, CampaignProduct } from "@prisma/client";
import type { PublicUser } from "@/lib/auth";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, Pencil, Search, TimerReset } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { campaignDeadlineState, campaignDeadlineText, type CampaignDeadlineState } from "@/lib/campaign-deadline";
import { campaignArtifacts } from "@/lib/campaign-artifacts";
import { matchesCampaignProduct } from "@/lib/campaign-list";
import { saveProductLink, updateAssignmentDetails } from "./actions";

type Product = CampaignProduct & { user: PublicUser; campaign: Campaign };
type EditValues = { id: string; campaignId: string; userId: string; title: string; deadline: string; contentType: string; durationSpec: string; requirements: string; contentPillar: string; link: string };
type Props = {
  products: Product[];
  campaigns: Campaign[];
  users: PublicUser[];
  isAdmin: boolean;
  nowIso: string;
  loading: boolean;
  onAction: (productId: string, action: "FORWARD" | "REJECT", currentStep: string) => Promise<void>;
  selectedCampaignId?: string;
};

const stepLabels: Record<string, string> = { SCRIPT_DRAFT: "Nộp demo kịch bản", SCRIPT_APPROVED: "Chờ duyệt kịch bản", PRODUCT_DRAFT: "Nộp sản phẩm nháp", PRODUCT_APPROVED: "Chờ duyệt sản phẩm", DONE: "Hoàn thành" };
const typeLabels: Record<string, string> = { VIDEO: "Video", POST: "Bài viết", VIDEO_POST: "Video + bài", PHOTOS: "Bộ ảnh" };
const statusMeta: Record<CampaignDeadlineState, { label: string; className: string }> = {
  ACTIVE: { label: "Đang thực hiện", className: "bg-blue-50 text-blue-700" },
  DUE_SOON: { label: "Sắp đến hạn", className: "bg-amber-50 text-amber-700" },
  OVERDUE: { label: "Quá hạn", className: "bg-rose-50 text-rose-700" },
  DONE_ON_TIME: { label: "Đúng hạn", className: "bg-emerald-50 text-emerald-700" },
  DONE_LATE: { label: "Hoàn thành trễ", className: "bg-orange-50 text-orange-700" },
};
const pillarStyles: Record<string, string> = { INSIGHT: "bg-sky-100 text-sky-700", TREND: "bg-emerald-100 text-emerald-700", NEWS: "bg-violet-100 text-violet-700", BRAND: "bg-orange-100 text-orange-700", OTHER: "bg-slate-100 text-slate-600" };
const input = "h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const viDate = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });

function deadlineOf(product: Product) { return product.deadline || product.campaign.deadline; }
function localInput(value: Date | string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
function safeLink(value: string | null) { return value && /^https?:\/\//i.test(value) ? value : null; }
function forwardLabel(product: Product) {
  if (product.type === "PENALTY" && product.step === "PRODUCT_DRAFT") return "Nộp bài phạt";
  if (product.step === "SCRIPT_DRAFT") return "Nộp kịch bản";
  if (product.step === "SCRIPT_APPROVED") return "Duyệt kịch bản";
  if (product.step === "PRODUCT_DRAFT") return "Nộp sản phẩm";
  if (product.step === "PRODUCT_APPROVED") return "Tick hoàn thành";
  return "Tiếp tục";
}

export default function CampaignPlanBoard({ products, campaigns, users, isAdmin, nowIso, loading, onAction, selectedCampaignId }: Props) {
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [campaignId, setCampaignId] = useState(selectedCampaignId || "ALL");
  const [ownerId, setOwnerId] = useState("ALL");
  const [kind,setKind]=useState("ALL");
  const [step,setStep]=useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [edit, setEdit] = useState<EditValues | null>(null);
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const rows = useMemo(() => products.map(product => ({ product, deadline: deadlineOf(product), state: campaignDeadlineState({ deadline: deadlineOf(product), step: product.step, completedAt: product.completedAt }, now) })).filter(({ product, state }) => {
    const text = `${product.title || ""} ${product.campaign.name} ${product.user.name} ${product.requirements || ""}`.toLocaleLowerCase("vi-VN");
    return matchesCampaignProduct(product,{owner:ownerId,type:kind,step}) && (!query || text.includes(query.toLocaleLowerCase("vi-VN"))) && (campaignId === "ALL" || product.campaignId === campaignId) && (ownerId === "ALL" || product.userId === ownerId) && (status === "ALL" || state === status);
  }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()), [products, query, campaignId, ownerId, status, kind, step, now]);

  const paging={items:rows};
  const counts = products.reduce((acc, product) => { const state = campaignDeadlineState({ deadline: deadlineOf(product), step: product.step, completedAt: product.completedAt }, now); acc.total++; if (state === "OVERDUE") acc.overdue++; if (state === "DUE_SOON") acc.soon++; if (state.startsWith("DONE")) acc.done++; return acc; }, { total: 0, overdue: 0, soon: 0, done: 0 });

  function openEdit(product: Product) {
    setEdit({ id: product.id, campaignId: product.campaignId, userId: product.userId, title: product.title || product.campaign.name, deadline: localInput(deadlineOf(product)), contentType: product.contentType, durationSpec: product.durationSpec || "", requirements: product.requirements || "", contentPillar: product.contentPillar || "OTHER", link: product.link || "" });
  }
  async function saveEdit() {
    if (!edit) return;
    setSaving(true); const result = await updateAssignmentDetails(edit); setSaving(false);
    toast({ title: result.success ? "Đã lưu kế hoạch" : "Không thể lưu", description: result.success ? "Deadline và yêu cầu nội dung đã được cập nhật." : result.error, variant: result.success ? "default" : "destructive" });
    if (result.success) { setEdit(null); router.refresh(); }
  }
  async function saveLink(product: Product) {
    const value = linkDrafts[product.id] ?? product.link ?? "";
    setSaving(true); const result = await saveProductLink(product.id, value); setSaving(false);
    toast({ title: result.success ? "Đã lưu link" : "Không thể lưu link", description: result.success ? "Link đã được lưu để gửi duyệt." : result.error, variant: result.success ? "default" : "destructive" });
    if (result.success) router.refresh();
  }

  const cards = [
    { label: "Tổng nội dung", value: counts.total, icon: Clock3, color: "text-blue-600 bg-blue-50" },
    { label: "Sắp đến hạn", value: counts.soon, icon: TimerReset, color: "text-amber-600 bg-amber-50" },
    { label: "Quá hạn", value: counts.overdue, icon: AlertTriangle, color: "text-rose-600 bg-rose-50" },
    { label: "Đã hoàn thành", value: counts.done, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  ];

  return <div className="space-y-4">
    <div className="flex flex-col gap-2 rounded-xl border bg-white p-3 lg:flex-row lg:flex-wrap">
      <label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input aria-label="Tìm nội dung" value={query} onChange={e => {setQuery(e.target.value);}} placeholder="Tìm nội dung, chiến dịch, nhân viên..." className={`${input} w-full pl-9`} /></label>
      <select aria-label="Lọc chiến dịch" className={input} value={campaignId} onChange={e => {setCampaignId(e.target.value);}}><option value="ALL">Tất cả chiến dịch</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select aria-label="Lọc nhân viên" className={input} value={ownerId} onChange={e => {setOwnerId(e.target.value);}}><option value="ALL">Tất cả nhân viên</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}{u.extension?` · máy lẻ ${u.extension}`:""}</option>)}</select>
      <select aria-label="Lọc deadline" className={input} value={status} onChange={e => {setStatus(e.target.value);}}><option value="ALL">Tất cả tiến độ</option><option value="ACTIVE">Đang thực hiện</option><option value="DUE_SOON">Sắp đến hạn</option><option value="OVERDUE">Quá hạn</option><option value="DONE_ON_TIME">Đúng hạn</option><option value="DONE_LATE">Hoàn thành trễ</option></select>
    </div>

    <div className="flex flex-wrap gap-2">
      <select aria-label="Lọc loại nhiệm vụ kế hoạch" className={input} value={kind} onChange={e=>{setKind(e.target.value);}}><option value="ALL">Nhiệm vụ & bài phạt</option><option value="NORMAL">Nhiệm vụ chính</option><option value="PENALTY">Bài phạt</option></select>
      <select aria-label="Lọc bước kế hoạch" className={input} value={step} onChange={e=>{setStep(e.target.value);}}><option value="ALL">Tất cả bước duyệt</option>{Object.entries(stepLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
    </div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(card => <article key={card.label} className="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm"><span className={`grid size-10 place-items-center rounded-lg ${card.color}`}><card.icon className="size-5" /></span><div><p className="text-xs text-slate-500">{card.label}</p><p className="text-xl font-bold text-slate-950">{card.value}</p></div></article>)}</div>

    <div className="hidden overflow-hidden rounded-xl border bg-white shadow-sm xl:block"><div className="overflow-x-auto"><table className="crm-campaign-table w-full table-fixed text-left"><thead className="bg-slate-900 text-slate-100"><tr>{[["Deadline","w-28"],["Nhân viên","w-28"],["Nội dung","w-28"],["Loại","w-24"],["YC thời lượng","w-24"],["Bằng chứng","w-32"],["Yêu cầu nội dung","w-48"],["Mục","w-20"],["Tiến độ","w-32"],["Thao tác","w-24"]].map(([label,width]) => <th key={label} className={`px-3 py-3 font-semibold ${width}`}>{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{paging.items.map(({ product, deadline, state }) => {
      const meta = statusMeta[state], link = safeLink(product.link), needsLink = product.step.includes("DRAFT") && !link, artifacts = campaignArtifacts(product.history);
      return <tr key={product.id} className={`${state === "OVERDUE" ? "bg-rose-50/50" : "hover:bg-slate-50"}`}><td className="px-3 py-3"><p className="font-semibold text-slate-800">{viDate.format(new Date(deadline))}</p><p className={state === "OVERDUE" ? "text-rose-600" : state === "DUE_SOON" ? "text-amber-600" : "text-slate-500"}>{campaignDeadlineText({ deadline, step: product.step, completedAt: product.completedAt }, now)}</p></td><td className="px-3 py-3"><p title={product.user.name} className="line-clamp-2 font-semibold text-slate-800">{product.user.name}</p><p title={product.campaign.name} className="truncate text-slate-400">{product.campaign.name}</p></td><td title={product.title || product.campaign.name} className="px-3 py-3 font-semibold text-slate-900">{product.type === "PENALTY" && <span className="mr-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-700">PHẠT</span>}{product.title || product.campaign.name}</td><td className="px-3 py-3"><span className="rounded-full bg-orange-50 px-2 py-1 font-medium text-orange-700">{typeLabels[product.contentType] || product.contentType}</span></td><td className="px-3 py-3 text-slate-600">{product.durationSpec || "—"}</td><td className="px-3 py-3"><div className="space-y-1">{artifacts.scriptLink && <a href={artifacts.scriptLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-semibold text-blue-600 hover:underline">Kịch bản <ExternalLink className="size-3" /></a>}{artifacts.productLink && <a href={artifacts.productLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-semibold text-emerald-700 hover:underline">Sản phẩm <ExternalLink className="size-3" /></a>}{!artifacts.scriptLink && !artifacts.productLink && (link ? <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline">Link hiện tại <ExternalLink className="size-3" /></a> : <span className="text-slate-400">Chưa có</span>)}{product.step.includes("DRAFT") && <div className="mt-2 flex gap-1"><input aria-label={`Link nộp ${product.title || product.campaign.name}`} className={`${input} w-full`} placeholder="https://..." value={linkDrafts[product.id] ?? product.link ?? ""} onChange={e => setLinkDrafts({ ...linkDrafts, [product.id]: e.target.value })} /><button disabled={saving} onClick={() => void saveLink(product)} className="rounded-md bg-blue-600 px-2 text-xs font-semibold text-white disabled:opacity-50">Lưu</button></div>}</div></td><td className="px-3 py-3 leading-5 text-slate-600"><p title={product.requirements || undefined} className="line-clamp-2">{product.requirements || "—"}</p>{product.notes && <p title={product.notes} className="mt-1 line-clamp-2 rounded-md bg-rose-50 px-2 py-1 font-medium text-rose-700">Phản hồi: {product.notes}</p>}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 font-semibold ${pillarStyles[product.contentPillar || "OTHER"] || pillarStyles.OTHER}`}>{product.contentPillar || "OTHER"}</span></td><td className="px-3 py-3"><span className={`inline-flex rounded-full px-2 py-1 font-semibold ${meta.className}`}>{meta.label}</span><p className="mt-1 text-[11px] text-slate-500">{stepLabels[product.step] || product.step}</p></td><td className="px-3 py-3"><div className="flex items-center gap-1">{isAdmin && <button aria-label={`Sửa ${product.title}`} onClick={() => openEdit(product)} className="rounded-md border p-2 text-slate-600 hover:bg-slate-100"><Pencil className="size-3.5" /></button>}{product.step !== "DONE" && <button disabled={loading || needsLink || (!product.step.includes("DRAFT") && !isAdmin)} onClick={() => void onAction(product.id, "FORWARD", product.step)} className="rounded-md bg-blue-600 px-2.5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-40">{forwardLabel(product)}</button>}</div></td></tr>;
    })}</tbody></table></div>{rows.length === 0 && <p className="p-10 text-center text-sm text-slate-500">Không có nội dung phù hợp bộ lọc.</p>}</div>

    <div className="grid gap-3 xl:hidden">{paging.items.map(({ product, deadline, state }) => { const meta = statusMeta[state], link = safeLink(product.link), artifacts = campaignArtifacts(product.history); return <article key={product.id} className={`rounded-xl border bg-white p-4 shadow-sm ${state === "OVERDUE" ? "border-rose-200" : ""}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-950">{product.type === "PENALTY" && <span className="mr-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] text-rose-700">PHẠT</span>}{product.title || product.campaign.name}</p><p className="mt-1 text-xs text-slate-500">{product.user.name} · {product.campaign.name}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${meta.className}`}>{meta.label}</span></div><div className="mt-3 grid grid-cols-2 gap-3 text-xs"><div><p className="text-slate-400">Deadline</p><p className="font-semibold text-slate-700">{viDate.format(new Date(deadline))}</p><p className="text-slate-500">{campaignDeadlineText({ deadline, step: product.step, completedAt: product.completedAt }, now)}</p></div><div><p className="text-slate-400">Loại / Mục</p><p className="font-medium text-slate-700">{typeLabels[product.contentType] || product.contentType} · {product.contentPillar || "OTHER"}</p><p className="text-slate-500">{product.durationSpec || "Chưa có thời lượng"}</p></div></div><p className="mt-3 border-t pt-3 text-xs leading-5 text-slate-600">{product.requirements || "Chưa có yêu cầu nội dung."}</p>{product.notes && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700">Phản hồi cần sửa: {product.notes}</p>}<div className="mt-3 flex flex-wrap items-center gap-2">{artifacts.scriptLink && <a href={artifacts.scriptLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs font-semibold text-blue-600">Kịch bản <ExternalLink className="size-3" /></a>}{artifacts.productLink && <a href={artifacts.productLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs font-semibold text-emerald-700">Sản phẩm <ExternalLink className="size-3" /></a>}{!artifacts.scriptLink && !artifacts.productLink && link && <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs font-semibold text-blue-600">Link hiện tại <ExternalLink className="size-3" /></a>}{isAdmin && <button onClick={() => openEdit(product)} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs font-semibold text-slate-700"><Pencil className="size-3" />Sửa</button>}{product.step !== "DONE" && <button disabled={loading || (product.step.includes("DRAFT") && !link) || (!product.step.includes("DRAFT") && !isAdmin)} onClick={() => void onAction(product.id, "FORWARD", product.step)} className="ml-auto rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">{forwardLabel(product)}</button>}</div></article>; })}{rows.length === 0 && <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">Không có nội dung phù hợp bộ lọc.</p>}</div>

    <Dialog open={Boolean(edit)} onOpenChange={open => !open && setEdit(null)}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Sửa kế hoạch nội dung</DialogTitle></DialogHeader>{edit && <div className="grid gap-3 py-2 md:grid-cols-2">
      <label className="grid gap-1 text-xs font-medium text-slate-600">Chiến dịch<select className={input} value={edit.campaignId} onChange={e => setEdit({ ...edit, campaignId: e.target.value })}>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-medium text-slate-600">Người phụ trách<select className={input} value={edit.userId} onChange={e => setEdit({ ...edit, userId: e.target.value })}>{users.map(u => <option key={u.id} value={u.id}>{u.name}{u.extension?` · máy lẻ ${u.extension}`:""}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-medium text-slate-600 md:col-span-2">Nội dung<input className={input} value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} /></label>
      <label className="grid gap-1 text-xs font-medium text-slate-600">Deadline<input type="datetime-local" className={input} value={edit.deadline} onChange={e => setEdit({ ...edit, deadline: e.target.value })} /></label>
      <label className="grid gap-1 text-xs font-medium text-slate-600">Loại<select className={input} value={edit.contentType} onChange={e => setEdit({ ...edit, contentType: e.target.value })}><option value="VIDEO">Video</option><option value="POST">Bài viết</option><option value="VIDEO_POST">Video + bài</option><option value="PHOTOS">Bộ ảnh</option></select></label>
      <label className="grid gap-1 text-xs font-medium text-slate-600">Yêu cầu thời lượng<input className={input} value={edit.durationSpec} onChange={e => setEdit({ ...edit, durationSpec: e.target.value })} /></label>
      <label className="grid gap-1 text-xs font-medium text-slate-600">Mục nội dung<select className={input} value={edit.contentPillar} onChange={e => setEdit({ ...edit, contentPillar: e.target.value })}><option value="INSIGHT">Insight</option><option value="TREND">Trend</option><option value="NEWS">News</option><option value="BRAND">Brand</option><option value="OTHER">Khác</option></select></label>
      <label className="grid gap-1 text-xs font-medium text-slate-600 md:col-span-2">Yêu cầu nội dung<textarea className="min-h-20 rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500" value={edit.requirements} onChange={e => setEdit({ ...edit, requirements: e.target.value })} /></label>
      <label className="grid gap-1 text-xs font-medium text-slate-600 md:col-span-2">Link hiện tại<input className={input} placeholder="https://..." value={edit.link} onChange={e => setEdit({ ...edit, link: e.target.value })} /></label>
      <button disabled={saving} onClick={() => void saveEdit()} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 md:col-start-2">{saving ? "Đang lưu..." : "Lưu thay đổi"}</button>
    </div>}</DialogContent></Dialog>
  </div>;
}
