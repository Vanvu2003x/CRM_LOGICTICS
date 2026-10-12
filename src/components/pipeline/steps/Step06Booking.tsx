import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

export default function Step06Booking() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900">Thông tin Booking / Lấy vỏ / Cấp Space</h4>
        <p className="text-sm text-blue-800 mt-1">
          Lưu lại thông tin booking chính thức với hãng tàu/hãng bay.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg border">
        <div className="space-y-2">
          <Label>Hãng tàu / Hãng bay (LINE) <span className="text-red-500">*</span></Label>
          <Select defaultValue="maersk">
            <SelectTrigger>
              <SelectValue placeholder="Chọn hãng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="maersk">MAERSK</SelectItem>
              <SelectItem value="cmacgm">CMA CGM</SelectItem>
              <SelectItem value="msc">MSC</SelectItem>
              <SelectItem value="cosco">COSCO</SelectItem>
              <SelectItem value="vn">Vietnam Airlines</SelectItem>
              <SelectItem value="cx">Cathay Pacific</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Số Booking / SO <span className="text-red-500">*</span></Label>
          <Input placeholder="Nhập số Booking..." />
        </div>

        <div className="space-y-2">
          <Label>ETD (Dự kiến xuất) <span className="text-red-500">*</span></Label>
          <Input type="date" />
        </div>

        <div className="space-y-2">
          <Label>ETA (Dự kiến đến) <span className="text-red-500">*</span></Label>
          <Input type="date" />
        </div>

        <div className="space-y-2">
          <Label>Giá mua (Buying Rate) <span className="text-red-500">*</span></Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <Input type="number" placeholder="0.00" className="pl-7" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Giá bán (Selling Rate)</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <Input type="number" placeholder="0.00" className="pl-7 bg-gray-50" readOnly value="280.00" />
          </div>
          <p className="text-[10px] text-gray-500 text-right">Lấy từ báo giá bước 4</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline">Huỷ Booking</Button>
        <Button><Save className="w-4 h-4 mr-2" /> Lưu Booking & Hoàn thành</Button>
      </div>
    </div>
  );
}
