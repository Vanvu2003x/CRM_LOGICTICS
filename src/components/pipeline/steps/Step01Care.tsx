"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Save, BellRing, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Step01Care() {
  const [lastContactDate, setLastContactDate] = useState("2026-10-04");
  const [routeNeed, setRouteNeed] = useState("Hải Phòng (VNHPH) ➔ Busan (KRPUS)");
  const [itemNeed, setItemNeed] = useState("Hàng may mặc đóng thùng Carton");
  const [volumeNeed, setVolumeNeed] = useState("2-3 container 20'DC / tháng");
  const [notes, setNotes] = useState("Khách đang so sánh giá cước với 2 bên khác, cần ưu đãi giá cước tốt cho lô đầu.");
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      
      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>Đã lưu cập nhật ngày liên lạc và nhu cầu khách hàng thành công!</span>
        </div>
      )}

      {/* Box Nhắc Nhở Tự Động Từ Hệ Thống Cho Sales */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-2">
        <div className="flex items-center gap-2">
          <BellRing className="size-4.5 text-amber-600 animate-bounce" />
          <h4 className="font-bold text-amber-900 text-sm">Hệ Thống Tự Động Nhắc Nhở Sales</h4>
          <Badge className="bg-amber-200/60 text-amber-800 border-amber-300 text-[10px] ml-auto">
            Tự động kích hoạt
          </Badge>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed pl-6">
          • <strong>Nhắc gửi khuyến mãi:</strong> Đề xuất Sales gửi bảng giá ưu đãi tuyến <em>Hải Phòng - Busan</em> cho khách hàng này trong đợt giảm giá cước tàu tháng này.<br />
          • <strong>Nhắc chăm sóc định kỳ:</strong> Đã quá 3 ngày kể từ lần gọi gần nhất. Sales vui lòng liên hệ lại để theo dõi phản hồi của khách.
        </p>
      </div>

      {/* Form Nhập Liệu Chăm Sóc Của Sales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        
        {/* Cột 1: Ngày Liên Lạc & Ghi Chú */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm">1. Nhật Ký Liên Lạc (Nhập Thủ Công)</h4>
            <span className="text-[11px] text-slate-400">Sales cập nhật</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Ngày Đã Liên Lạc Với Khách <span className="text-rose-500">*</span></Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input 
                type="date" 
                value={lastContactDate} 
                onChange={(e) => setLastContactDate(e.target.value)}
                className="pl-9 h-9.5 text-xs rounded-xl" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Ghi Chú Trao Đổi Chi Tiết</Label>
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập nội dung đã trao đổi với khách, yêu cầu đặc biệt..." 
              className="min-h-[120px] text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Cột 2: Nhu Cầu Cơ Bản Của Khách */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm">2. Nhu Cầu Cơ Bản Của Khách</h4>
            <span className="text-[11px] text-slate-400">Tuyến & Hàng hóa</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Tuyến Quan Tâm (POL ➔ POD)</Label>
            <Input 
              value={routeNeed} 
              onChange={(e) => setRouteNeed(e.target.value)}
              placeholder="VD: Hải Phòng ➔ Busan" 
              className="h-9.5 text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Tên Hàng Hóa & Đóng Gói</Label>
            <Input 
              value={itemNeed} 
              onChange={(e) => setItemNeed(e.target.value)}
              placeholder="VD: Hàng may mặc / Thép / Nông sản" 
              className="h-9.5 text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Sản Lượng Dự Kiến</Label>
            <Input 
              value={volumeNeed} 
              onChange={(e) => setVolumeNeed(e.target.value)}
              placeholder="VD: 2-3 container 20ft / tháng hoặc 500kg AIR" 
              className="h-9.5 text-xs rounded-xl"
            />
          </div>
        </div>

      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button 
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-9.5 px-5 rounded-xl shadow-sm"
        >
          <Save className="size-3.5 mr-1.5" /> Lưu Lịch Sử Chăm Sóc (Bước 1)
        </Button>
      </div>

    </div>
  );
}
