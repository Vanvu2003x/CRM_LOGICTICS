"use client";

import { useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { addAssignments } from "./actions";
import { useToast } from "@/hooks/use-toast";

type Row = { campaignId: string; userId: string; title: string; deadline: string; contentType: string; durationSpec: string; requirements: string; contentPillar: string };
const row = (campaignId = ""): Row => ({ campaignId, userId: "", title: "", deadline: "", contentType: "VIDEO", durationSpec: "", requirements: "", contentPillar: "INSIGHT" });
const field = "h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function AssignmentForm({ campaigns, users, selectedCampaignId = "" }: { campaigns: { id: string; name: string }[]; users: { id: string; name: string; extension?: string | null }[]; selectedCampaignId?: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([row(selectedCampaignId)]);
  const { toast } = useToast();

  function update(index: number, key: keyof Row, value: string) { setRows(current => current.map((item, rowIndex) => rowIndex === index ? { ...item, [key]: value } : item)); }
  async function save() {
    const preparedRows = rows.map(item => ({ ...item, campaignId: item.campaignId || selectedCampaignId }));
    setBusy(true); const result = await addAssignments(preparedRows); setBusy(false);
    toast({ title: result.success ? "Đã lưu kế hoạch" : "Không thể giao việc", description: result.success ? `${rows.length} nội dung đã được phân công.` : result.error, variant: result.success ? "default" : "destructive" });
    if (result.success) { setRows([row(selectedCampaignId)]); setOpen(false); }
  }

  return <div>
    <button className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700" onClick={() => setOpen(!open)}><Plus className="size-4" />Phân công nội dung</button>
    {open && <section className="mt-3 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b bg-blue-50/60 px-4 py-3"><div><h3 className="font-semibold text-slate-900">Bảng phân công nội dung</h3><p className="text-sm text-slate-500">Nhập nhiều dòng rồi lưu một lần, giống bảng kế hoạch đang sử dụng.</p></div><button aria-label="Đóng" onClick={() => setOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-white"><X className="size-4" /></button></header>
      <div className="overflow-x-auto"><table className={`w-full text-left text-sm ${selectedCampaignId ? "min-w-[980px]" : "min-w-[1160px]"}`}><thead className="bg-slate-900 text-white"><tr>{!selectedCampaignId && <th className="px-2 py-3 font-medium">Chiến dịch</th>}{["Nhân viên","Nội dung","Deadline","Loại","Thời lượng","Yêu cầu nội dung","Mục",""].map(label => <th key={label} className="px-2 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{rows.map((item,index)=><tr key={index} className="border-t align-top">
        {!selectedCampaignId && <td className="p-2"><select aria-label={`Chiến dịch dòng ${index+1}`} className={field} value={item.campaignId} onChange={e=>update(index,"campaignId",e.target.value)}><option value="">Chọn chiến dịch</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></td>}
        <td className="p-2"><select aria-label={`Nhân viên dòng ${index+1}`} className={field} value={item.userId} onChange={e=>update(index,"userId",e.target.value)}><option value="">Chọn nhân viên</option>{users.map(u=><option key={u.id} value={u.id}>{u.name}{u.extension?` · máy lẻ ${u.extension}`:""}</option>)}</select></td>
        <td className="p-2"><input aria-label={`Nội dung dòng ${index+1}`} className={`${field} w-40`} placeholder="MSC, TREND..." value={item.title} onChange={e=>update(index,"title",e.target.value)}/></td>
        <td className="p-2"><input aria-label={`Deadline dòng ${index+1}`} type="datetime-local" className={field} value={item.deadline} onChange={e=>update(index,"deadline",e.target.value)}/></td>
        <td className="p-2"><select aria-label={`Loại dòng ${index+1}`} className={field} value={item.contentType} onChange={e=>update(index,"contentType",e.target.value)}><option value="VIDEO">Video</option><option value="POST">Bài viết</option><option value="VIDEO_POST">Video + bài</option><option value="PHOTOS">Bộ ảnh</option></select></td>
        <td className="p-2"><input aria-label={`Thời lượng dòng ${index+1}`} className={`${field} w-28`} placeholder="1p20–1p30s" value={item.durationSpec} onChange={e=>update(index,"durationSpec",e.target.value)}/></td>
        <td className="p-2"><input aria-label={`Yêu cầu dòng ${index+1}`} className={`${field} w-56`} placeholder="Logo, thông điệp, điểm nổi bật..." value={item.requirements} onChange={e=>update(index,"requirements",e.target.value)}/></td>
        <td className="p-2"><select aria-label={`Mục dòng ${index+1}`} className={field} value={item.contentPillar} onChange={e=>update(index,"contentPillar",e.target.value)}><option value="INSIGHT">Insight</option><option value="TREND">Trend</option><option value="NEWS">News</option><option value="BRAND">Brand</option><option value="OTHER">Khác</option></select></td>
        <td className="p-2"><button aria-label={`Xóa dòng ${index+1}`} disabled={rows.length===1} onClick={()=>setRows(current=>current.filter((_,rowIndex)=>rowIndex!==index))} className="grid size-10 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"><Trash2 className="size-4"/></button></td>
      </tr>)}</tbody></table></div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t p-4"><button onClick={()=>setRows(current=>[...current,row(selectedCampaignId)])} className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Plus className="size-4"/>Thêm dòng</button><button disabled={busy} onClick={()=>void save()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><Save className="size-4"/>{busy?"Đang lưu...":`Lưu ${rows.length} nội dung`}</button></footer>
    </section>}
  </div>;
}
