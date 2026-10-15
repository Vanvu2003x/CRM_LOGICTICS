"use client";

import { Suspense, use, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, PhoneOutgoing, Building2, FileText, Package, Clock, ArrowRight, CheckCircle2, AlertCircle, PhoneCall, Truck, ShieldCheck, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useDemoData } from "@/components/demo/DemoDataProvider";
import OrderStepEditor from "@/components/pipeline/OrderStepEditor";

const pipelineSteps = [
  { step: 1, name: "1. Đang chăm sóc", stage: "Báo giá & Khách", icon: Clock },
  { step: 2, name: "2. Thông tin đơn hàng", stage: "Báo giá & Khách", icon: Package },
  { step: 3, name: "3. Tổng hợp giá", stage: "Báo giá & Khách", icon: FileText },
  { step: 4, name: "4. Báo giá (PDF)", stage: "Báo giá & Khách", icon: FileText },
  { step: 5, name: "5. Feedback KH", stage: "Báo giá & Khách", icon: CheckCircle2 },
  { step: 6, name: "6. Booking", stage: "Booking & Đại lý", icon: Package },
  { step: 7, name: "7. Lựa chọn đại lý", stage: "Booking & Đại lý", icon: Building2 },
  { step: 8, name: "8. Điều xe (XK)", stage: "Vận chuyển & Hải quan", icon: Truck },
  { step: 9, name: "9. Gửi chứng từ (B/L)", stage: "Vận chuyển & Hải quan", icon: FileText },
  { step: 10, name: "10. Khai báo Hải Quan", stage: "Vận chuyển & Hải quan", icon: ShieldCheck },
  { step: 11, name: "11. Điều xe (NK)", stage: "Vận chuyển & Hải quan", icon: Truck },
  { step: 12, name: "12. Bảng kê chi phí", stage: "Thanh toán & Hóa đơn", icon: Receipt },
  { step: 13, name: "13. Thanh toán (VAT)", stage: "Thanh toán & Hóa đơn", icon: Receipt }
];

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium">Đang tải chi tiết đơn hàng...</div>}>
      <OrderDetailContent params={params} />
    </Suspense>
  );
}

function OrderDetailContent({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const searchParams = useSearchParams();
  const { orders, leads, calls, refresh } = useDemoData();

  const order = orders.find((item) => item.id === orderId);
  const requestedStep = Number(searchParams.get("step"));
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const currentStep = selectedStep ?? (requestedStep >= 1 && requestedStep <= 13 ? requestedStep : order?.step ?? 2);

  // ITY Call Center Integration State for this Order (userfield = orderId)
  const [callingToast, setCallingToast] = useState<string | null>(null);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  const orderCallLogs = calls.filter(call=>call.orderCode===orderId).map(call=>({id:call.id,timestamp:new Date(call.startedAt).toLocaleString("vi-VN"),phone:leads.find(lead=>lead.id===call.leadId)?.phone||"",extension:"",salesName:order?.sales||"",duration:call.duration,billsec:call.billsec,status:call.status,userfield:orderId,recordingUrl:call.recordingUrl||""}));

  if (!order) {
    return (
      <div className="rounded-2xl border bg-white p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
        <AlertCircle className="size-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Không tìm thấy đơn hàng {orderId}</h2>
        <p className="text-sm text-slate-500">Đơn hàng có thể đã bị xóa hoặc không tồn tại trong hệ thống.</p>
        <Link href="/pipeline">
          <Button className="bg-blue-600 hover:bg-blue-500">Quay lại Pipeline 13 Bước</Button>
        </Link>
      </div>
    );
  }

  const handleTriggerITYCall = async () => {
 const lead=leads.find(item=>item.id===order.leadId);if(!lead){setSavedNotification("Đơn chưa gắn khách có số điện thoại.");return;}
 setCallingToast("Đang gửi yêu cầu gọi...");
 try {const response=await fetch("/api/ity/click2call",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone:lead.phone,userfield:order.id})});const result=await response.json();setSavedNotification(result.message||result.error);await refresh();}catch{setSavedNotification("Không kết nối được ITY.");}finally{setCallingToast(null);}
 };

  const handleStepChange = (newStep: number) => {
    const validStep = Math.max(1, Math.min(13, newStep));
    setSelectedStep(validStep);
  };

  const renderStepComponent = () => {
    return <OrderStepEditor key={orderId+"-"+currentStep} order={order} step={currentStep} onAdvance={setSelectedStep} />;

  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 font-sans">
      
      {/* Toast Notification for Calling */}
      {callingToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-500/40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="size-3 rounded-full bg-emerald-400 animate-ping" />
          <PhoneOutgoing className="size-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{callingToast}</span>
        </div>
      )}

      {/* Toast Notification for Saved Call */}
      {savedNotification && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-emerald-400/40 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="size-5 text-emerald-300 shrink-0" />
          <span className="text-sm font-medium">{savedNotification}</span>
        </div>
      )}

      {/* Top Banner & Order Summary */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-start gap-4">
            <Link href="/pipeline">
              <Button variant="outline" size="icon" className="h-10 w-10 bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl shrink-0">
                <ArrowLeft className="size-5" />
              </Button>
            </Link>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xl font-black text-blue-400 tracking-wider">
                  {order.id}
                </span>
                <Badge className={order.type === "EXPORT" ? "bg-blue-500/30 text-blue-200 border-blue-400/40 font-bold" : "bg-purple-500/30 text-purple-200 border-purple-400/40 font-bold"}>
                  {order.type === "EXPORT" ? "HÀNG XUẤT KHẨU (XK)" : "HÀNG NHẬP KHẨU (NK)"}
                </Badge>
                <Badge className={order.status === "COMPLETED" ? "bg-emerald-500/30 text-emerald-200 border-emerald-400/40 font-bold" : "bg-amber-500/30 text-amber-200 border-amber-400/40 font-bold"}>
                  {order.status === "COMPLETED" ? "Đã Hoàn Thành (Thu Tiền)" : "Đang Vận Hành (In-Progress)"}
                </Badge>
              </div>

              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white mt-1">
                {order.customer}
              </h1>

              <p className="text-xs text-slate-300 flex items-center gap-3 mt-1">
                <span>Sales: <strong className="text-white">{order.sales}</strong> (Máy lẻ: 101)</span>
                <span>• Ngày tạo: {order.date}</span>
                <span>• Bước hiện tại: <strong className="text-blue-300">{pipelineSteps[currentStep - 1].name}</strong></span>
              </p>
            </div>
          </div>

          {/* ITY Call Integration Button & Step Controllers */}
          <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center">
            
            {/* Direct ITY Call with userfield = orderId */}
            <Button 
              onClick={handleTriggerITYCall}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 text-xs font-bold h-9.5 px-3.5 rounded-xl transition-all"
            >
              <PhoneOutgoing className="size-4 mr-1.5" />
              Gọi ITY Trao Đổi Lô Này
            </Button>

            <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl backdrop-blur-md border border-white/20">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleStepChange(currentStep - 1)} 
                disabled={currentStep === 1}
                className="text-white hover:bg-white/20 text-xs h-8 px-3 rounded-lg"
              >
                Quay lại
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleStepChange(currentStep + 1)} 
                disabled={currentStep === 13}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold h-8 px-3.5 rounded-lg shadow-md"
              >
                Tiếp bước {Math.min(13, currentStep + 1)} <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </div>

          </div>

        </div>
      </div>

      {/* Main Grid: Left Stepper (4 Cols) & Right Step Workspace (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Vertical Stepper & ITY Order Call History (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Stepper Card */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 max-h-[calc(100vh-100px)] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Tiến Độ Quy Trình 13 Bước</h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Bước {currentStep}/13
              </span>
            </div>

            <div className="space-y-1 pt-3">
              {pipelineSteps.map((stepItem) => {
                const stepNum = stepItem.step;
                const isDone = order.completedSteps?.includes(stepNum);
                const isCurrent = stepNum === currentStep;

                return (
                  <button
                    key={stepNum}
                    onClick={() => handleStepChange(stepNum)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                      isCurrent 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold" 
                        : isDone 
                          ? "bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium" 
                          : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`size-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCurrent 
                        ? "bg-white text-blue-600" 
                        : isDone 
                          ? "bg-emerald-500 text-white" 
                          : "bg-slate-200 text-slate-600"
                    }`}>
                      {isDone ? <Check className="size-3.5 stroke-[3]" /> : stepNum}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs truncate">{stepItem.name}</p>
                    </div>

                    {isCurrent && (
                      <span className="size-1.5 rounded-full bg-white animate-ping shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ITY Call Logs Box for this Specific Order (using userfield) */}
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PhoneCall className="size-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-xs">Ghi Âm ITY Gắn Với Lô Này</h4>
              </div>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                userfield: {orderId}
              </Badge>
            </div>

            <div className="space-y-2.5">
              {orderCallLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{log.phone}</span>
                    <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span>Sales: <strong>{log.salesName}</strong> (Ext {log.extension})</span>
                    <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                      {log.billsec}s
                    </span>
                  </div>

                  {log.recordingUrl && <audio controls src={`/api/calls/${log.id}/recording`} className="block h-8 max-w-full min-w-0 w-full"/>}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Step Dynamic Form Content (8 Cols) */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200/80 overflow-hidden">
            
            {/* Step Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  {pipelineSteps[currentStep - 1].stage}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {pipelineSteps[currentStep - 1].name}
                </h2>
              </div>


            </div>

            {/* Step Dynamic Workspace Component */}
            <div className="p-6">
              {renderStepComponent()}
 {order.history?.length ? <details className="mt-4 rounded-lg border p-3 text-xs"><summary className="cursor-pointer font-medium">Lịch sử xử lý đơn</summary>{order.history.map((entry,i)=>{const h=entry as {at:string;by:string;action:string;from:number;to:number;reason:string};return <p key={i} className="border-t py-2 mt-2">{h.at?.slice(0,16)} · {h.by} · Bước {h.from} → {h.to} · {h.reason}</p>;})}</details> : null}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
