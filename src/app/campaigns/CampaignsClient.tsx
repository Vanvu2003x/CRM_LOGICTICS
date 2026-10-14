"use client";
import type { PublicUser } from "@/lib/auth";

import { useRouter } from "next/navigation";
import { campaignPeople } from "@/lib/campaign-list";
import AssignmentForm from "./AssignmentForm";
import CampaignPlanBoard from "./CampaignPlanBoard";
import { useEffect, useState } from "react";
import { Campaign, CampaignProduct } from "@prisma/client";
import { format } from "date-fns";
import { campaignPeriodStatus } from "@/lib/campaign-deadline";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createCampaign, updateCampaignStatus, updateProductStep } from "./actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowLeft, ShieldAlert } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";

type ProductWithUserAndCampaign = CampaignProduct & { user: PublicUser; campaign: Campaign };

interface CampaignsClientProps {
  users: PublicUser[];
  campaigns: Campaign[];
  products: ProductWithUserAndCampaign[];
  nowIso: string;
}

const STEPS = [
  { id: "SCRIPT_DRAFT", label: "Nộp Kịch Bản" },
  { id: "SCRIPT_APPROVED", label: "Duyệt Kịch Bản" },
  { id: "PRODUCT_DRAFT", label: "Nộp Nháp Sản Phẩm" },
  { id: "PRODUCT_APPROVED", label: "Duyệt Sản Phẩm" },
  { id: "DONE", label: "Hoàn Thành" }
];

import { useUserContext } from "@/components/auth/UserContext";

export default function CampaignsClient({ users, campaigns, products, nowIso }: CampaignsClientProps) {
  const router=useRouter();
  useEffect(()=>{const timer=setInterval(()=>router.refresh(),60000);return()=>clearInterval(timer);},[router]);
  const [query,setQuery]=useState("");
  const [owner,setOwner]=useState("ALL");
  const [period,setPeriod]=useState("ALL");
  const { toast } = useToast();
  const { currentUser, isAdmin } = useUserContext();
  const [loading, setLoading] = useState(false);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [tab, setTab] = useState("campaigns");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");

  const permittedProducts = products.filter(p => isAdmin || p.userId === currentUser?.id);

  const filteredCampaigns=campaigns.filter(c=>{
    const items=permittedProducts.filter(p=>p.campaignId===c.id);
    const normal=items.filter(p=>p.type!=="PENALTY");
    const done=normal.length>0&&normal.every(p=>p.step==="DONE");
    const state=c.status==="CANCELLED"?"CANCELLED":done?"DONE":campaignPeriodStatus(c.endDate||c.deadline,new Date(nowIso)).state;
    return (!query||`${c.name} ${c.description||""}`.toLocaleLowerCase("vi-VN").includes(query.toLocaleLowerCase("vi-VN")))&&(owner==="ALL"||items.some(p=>p.userId===owner))&&(period==="ALL"||state===period);
  });
  const campaignPage={items:filteredCampaigns,page:1,pages:1,total:filteredCampaigns.length};
  const campaignOverview={
    active: filteredCampaigns.filter(c=>c.status!=="CANCELLED").length,
    submit: permittedProducts.filter(p=>p.step==="SCRIPT_DRAFT"||p.step==="PRODUCT_DRAFT").length,
    review: permittedProducts.filter(p=>p.step==="SCRIPT_APPROVED"||p.step==="PRODUCT_APPROVED").length,
    overdue: permittedProducts.filter(p=>campaignPeriodStatus(p.deadline||p.campaign.deadline,new Date(nowIso)).state==="OVERDUE"&&p.step!=="DONE").length,
  };

  // Form states
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [reqs, setReqs] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleCreateCampaign = async () => {
    if (!name || !startDate || !endDate || selectedUsers.length === 0) {
      toast({ title: "Lỗi", description: "Vui lòng nhập tên, thời gian và chọn ít nhất 1 nhân viên", variant: "destructive" });
      return;
    }
    setLoading(true);
    const result = await createCampaign({
      name,
      description: desc,
      requirements: reqs,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      userIds: selectedUsers
    });
    setLoading(false);
    if (result.success) {
      toast({ title: "Thành công", description: "Đã tạo chiến dịch truyền thông." });
      setOpenNewDialog(false);
      setName(""); setDesc(""); setReqs(""); setStartDate(""); setEndDate(""); setSelectedUsers([]);
    } else {
      toast({ title: "Lỗi", description: result.error, variant: "destructive" });
    }
  };

  const handleAction = async (productId: string, actionType: "FORWARD" | "REJECT", currentStep: string) => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    let newStep = currentStep;
    
    if (actionType === "FORWARD" && currentIndex < STEPS.length - 1) {
      newStep = STEPS[currentIndex + 1].id;
    } else if (actionType === "REJECT") {
      // Reject quay lại 1 bước
      if (currentStep === "SCRIPT_APPROVED") newStep = "SCRIPT_DRAFT";
      else if (currentStep === "PRODUCT_APPROVED") newStep = "PRODUCT_DRAFT";
      else newStep = STEPS[currentIndex - 1].id;
    }

    const rejectionReason = actionType === "REJECT" ? window.prompt("Lý do chưa duyệt để nhân viên sửa lại:")?.trim() : "";
    if (actionType === "REJECT" && !rejectionReason) return;

    setLoading(true);
    const result = await updateProductStep(productId, newStep, undefined, rejectionReason);
    setLoading(false);

    if (result.success) {
      toast({ title: "Thành công", description: "Đã cập nhật trạng thái." });
    } else {
      toast({ title: "Lỗi", description: result.error, variant: "destructive" });
    }
  };

  const handleCampaignStatus = async (id:string,status:"IN_PROGRESS"|"COMPLETED"|"CANCELLED") => {
    setLoading(true); const result=await updateCampaignStatus(id,status); setLoading(false);
    toast({title:result.success?"Đã cập nhật chiến dịch":"Không thể cập nhật",description:result.success?"Trạng thái đã được lưu.":result.error,variant:result.success?"default":"destructive"});
    if(result.success)router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Chiến Dịch Truyền Thông</h1>
          <p className="text-muted-foreground mt-1">{isAdmin ? "Quản lý giao việc, kịch bản, ấn phẩm media và tính phạt." : "Theo dõi công việc, nộp kịch bản và sản phẩm được giao."}</p>
        </div>

        {isAdmin && tab !== "plan" && (
          <Dialog open={openNewDialog} onOpenChange={setOpenNewDialog}>
            <DialogTrigger>
              <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                <MegaphoneIcon className="w-4 h-4 mr-2"/> Tạo Chiến Dịch
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Tạo Chiến Dịch Truyền Thông Mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tên chiến dịch</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="VD: SỰ THẬT VỀ LOGISTICS" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bắt đầu chiến dịch (ngày và giờ)</Label>
                  <Input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Kết thúc chiến dịch (ngày và giờ)</Label>
                  <Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2"><Label>Yêu cầu chung</Label><Input value={reqs} onChange={e => setReqs(e.target.value)} placeholder="VD: 1 Video, 1 Bài viết, 5 Ảnh" /></div>
              <div className="space-y-2">
                <Label>Nội dung chi tiết</Label>
                <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Nhân viên tham gia</Label>
                <div className="grid grid-cols-2 gap-2 border p-3 rounded-md max-h-40 overflow-y-auto">
                  {users.map(u => (
                    <label key={u.id} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedUsers([...selectedUsers, u.id]);
                          else setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                        }}
                      />
                      <span>{u.name} ({u.role})</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateCampaign} disabled={loading} className="w-full">
                {loading ? "Đang tạo..." : "Lưu Chiến Dịch"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {tab!=="plan"&&<div className="mb-4 flex flex-col gap-2 rounded-xl border bg-white p-3 sm:flex-row sm:flex-wrap lg:justify-end">
          <Input aria-label="Tìm chiến dịch hoặc nhiệm vụ" placeholder="Tìm chiến dịch, nội dung..." value={query} onChange={e=>{setQuery(e.target.value);}} className="min-w-0 sm:max-w-xs"/>
          {isAdmin&&<select aria-label="Lọc nhân viên" className="h-10 rounded-lg border px-3 text-sm" value={owner} onChange={e=>{setOwner(e.target.value);}}><option value="ALL">Tất cả nhân viên</option>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>}
          <select aria-label="Lọc trạng thái chiến dịch" className="h-10 rounded-lg border px-3 text-sm" value={period} onChange={e=>{setPeriod(e.target.value);}}><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang thực hiện</option><option value="DUE_SOON">Sắp đến hạn</option><option value="OVERDUE">Quá hạn</option><option value="DONE">Hoàn thành</option><option value="CANCELLED">Đã hủy</option></select>
        </div>}

      <section aria-label="Tổng quan công việc truyền thông" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[{label:"Chiến dịch đang theo dõi",value:campaignOverview.active,tab:"campaigns",tone:"border-blue-200 bg-blue-50 text-blue-800"},{label:"Nội dung cần nộp",value:campaignOverview.submit,tab:"plan",tone:"border-amber-200 bg-amber-50 text-amber-800"},{label:"Đang chờ duyệt",value:campaignOverview.review,tab:"plan",tone:"border-violet-200 bg-violet-50 text-violet-800"},{label:"Đã quá hạn",value:campaignOverview.overdue,tab:"plan",tone:"border-rose-200 bg-rose-50 text-rose-800"}].map(card=><button key={card.label} type="button" onClick={()=>{setTab(card.tab);}} className={`rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${card.tone}`}><p className="text-xs font-medium opacity-80">{card.label}</p><p className="mt-1 text-2xl font-bold">{card.value}</p><p className="mt-1 text-[11px] opacity-70">Bấm để xem chi tiết →</p></button>)}
      </section>

      <Tabs value={tab} onValueChange={value=>{setTab(value);}} className="w-full">
        <TabsList className="mb-4 max-w-full justify-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsTrigger value="campaigns">Chiến dịch <span className="ml-1 rounded-full bg-slate-100 px-1.5 text-[10px]">{filteredCampaigns.length}</span></TabsTrigger>
          <TabsTrigger value="plan">Chi tiết & phân công <span className="ml-1 rounded-full bg-slate-100 px-1.5 text-[10px]">{permittedProducts.length}</span></TabsTrigger>
        </TabsList>
        <TabsContent value="plan">
          <div className="mb-4 rounded-xl border bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><Button type="button" variant="outline" size="sm" onClick={()=>{setSelectedCampaignId("");setTab("campaigns");}} className="shrink-0"><ArrowLeft className="mr-1 size-4" />Về danh sách</Button><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{campaigns.find(c=>c.id===selectedCampaignId)?.name||"Chi tiết và phân công"}</p><p className="mt-1 text-sm text-slate-500">{isAdmin ? "Tạo phân công ngay tại đây; khi đã mở một chiến dịch, biểu mẫu sẽ tự gắn đúng chiến dịch đó." : "Theo dõi deadline và trạng thái các nhiệm vụ của bạn."}</p></div></div>{isAdmin&&<AssignmentForm key={selectedCampaignId||"all"} campaigns={campaigns} users={users} selectedCampaignId={selectedCampaignId}/>}</div></div>
          <CampaignPlanBoard key={selectedCampaignId||"all"} products={permittedProducts} campaigns={campaigns} users={users} isAdmin={isAdmin} nowIso={nowIso} loading={loading} onAction={handleAction} selectedCampaignId={selectedCampaignId} />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {filteredCampaigns.length===0&&<p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">Không có chiến dịch phù hợp bộ lọc.</p>}
          <div className="grid gap-4 xl:grid-cols-2">
          {campaignPage.items.map(camp => {
            const campaignEnd = new Date(camp.endDate || camp.deadline);
            const campaignStart = new Date(camp.startDate || camp.createdAt);
            const timing = campaignPeriodStatus(campaignEnd, new Date(nowIso));
            const campaignProducts=permittedProducts.filter(p=>p.campaignId===camp.id);
            const normal=campaignProducts.filter(p=>p.type!=="PENALTY");
            const people=campaignPeople(campaignProducts);
            const doneCount=normal.filter(p=>p.step==="DONE").length;
            const pendingPenalties=people.reduce((total,person)=>total+person.pendingPenalties,0);
            const complete=normal.length>0&&normal.every(p=>p.step==="DONE");
            const cancelled=camp.status==="CANCELLED";
            const isNearDeadline = !cancelled&&!complete&&timing.state === "DUE_SOON";
            const isOverdue = !cancelled&&!complete&&timing.state === "OVERDUE";
            const statusLabel=cancelled?"Đã hủy":complete?"Hoàn thành":isOverdue?"Quá hạn":isNearDeadline?"Sắp đến hạn":"Đang thực hiện";
            const statusClass=cancelled?"border-slate-200 bg-slate-100 text-slate-600":complete?"border-emerald-200 bg-emerald-50 text-emerald-700":isOverdue?"border-rose-200 bg-rose-50 text-rose-700":isNearDeadline?"border-amber-200 bg-amber-50 text-amber-700":"border-blue-200 bg-blue-50 text-blue-700";

            return (
              <Card key={camp.id} className={`overflow-hidden border-t-4 ${isOverdue?"border-t-rose-500":isNearDeadline?"border-t-amber-500":complete?"border-t-emerald-500":cancelled?"border-t-slate-400":"border-t-blue-500"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><CardTitle className="truncate text-lg">{camp.name}</CardTitle><CardDescription className="mt-1 line-clamp-2">{camp.description||"Chưa có mô tả chiến dịch."}</CardDescription></div>
                    <Badge className={`shrink-0 border ${statusClass}`}>{statusLabel}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-slate-500"><span>{format(campaignStart,"dd/MM/yyyy")} – {format(campaignEnd,"dd/MM/yyyy")}</span><span>{people.length} nhân sự</span><span>{doneCount}/{normal.length||0} nhiệm vụ xong</span></div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isNearDeadline && (
                    <Alert className="border-amber-500 bg-amber-50 py-2 text-amber-900">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-xs">Sắp đến hạn · {timing.label}</AlertTitle>
                    </Alert>
                  )}
                  {isOverdue && (
                    <Alert variant="destructive" className="py-2">
                      <ShieldAlert className="h-4 w-4" />
                      <AlertTitle className="text-xs">Quá hạn · {pendingPenalties} bài phạt chưa xong</AlertTitle>
                    </Alert>
                  )}
                  <div className="rounded-xl bg-slate-50 p-3 text-sm"><p className="font-semibold text-slate-700">Yêu cầu chính</p><p className="mt-1 line-clamp-2 text-slate-600">{camp.requirements||"Chưa có yêu cầu."}</p></div>
                  <div className="flex flex-wrap gap-2"><Button onClick={()=>{setSelectedCampaignId(camp.id);setTab("plan");}} className="bg-blue-600 hover:bg-blue-700">{cancelled?"Xem kế hoạch →":isAdmin?"Mở kế hoạch & phân công →":"Mở nhiệm vụ của tôi →"}</Button>{isAdmin&&cancelled&&<Button variant="outline" onClick={()=>void handleCampaignStatus(camp.id,"IN_PROGRESS")}>Mở lại</Button>}{isAdmin&&!cancelled&&<Button variant="outline" onClick={()=>void handleCampaignStatus(camp.id,"CANCELLED")}>Hủy chiến dịch</Button>}</div>
                </CardContent>
              </Card>
            );
          })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MegaphoneIcon(props: import("react").SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 14v-3z"/>
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
    </svg>
  );
}
