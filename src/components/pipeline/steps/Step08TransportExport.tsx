import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Truck, Camera } from "lucide-react";

export default function Step08TransportExport() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4 text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
        <Truck className="w-5 h-5" />
        <span className="font-medium text-sm">Bước này chỉ áp dụng cho Hàng Xuất Khẩu (Điều xe ra cảng/sân bay)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 bg-white p-5 rounded-lg border">
          <h4 className="font-semibold border-b pb-2">Thông tin điều xe</h4>
          
          <div className="space-y-2">
            <Label>Công ty vận tải <span className="text-red-500">*</span></Label>
            <Input placeholder="Nhập tên nhà xe..." defaultValue="Nhà xe Anh Tuấn" />
          </div>
          
          <div className="space-y-2">
            <Label>Biển số xe / Tên tài xế <span className="text-red-500">*</span></Label>
            <Input placeholder="VD: 15C-123.45 - Nguyễn Văn A" defaultValue="15C-678.90 - Trần Bình" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Thời gian lấy hàng <span className="text-red-500">*</span></Label>
              <Input type="datetime-local" defaultValue="2023-10-14T08:00" />
            </div>
            <div className="space-y-2">
              <Label>Giá cước xe <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input type="number" placeholder="0" className="pr-12" defaultValue="3500000" />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">VNĐ</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-white p-5 rounded-lg border">
          <h4 className="font-semibold border-b pb-2">Hình ảnh & Trạng thái</h4>
          
          <div className="space-y-2">
            <Label>Hình ảnh đóng hàng / lấy hàng</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
              <Camera className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 font-medium">Click để tải ảnh lên</p>
              <p className="text-xs text-gray-400 mt-1">Hỗ trợ JPG, PNG (Max 5MB)</p>
            </div>
          </div>
          
          <div className="pt-4 mt-2 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox id="transport-done" />
              <label
                htmlFor="transport-done"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Đã hoàn thành giao hàng ra cảng / sân bay
              </label>
            </div>
            <p className="text-xs text-gray-500 ml-6 mt-1">Tick chọn để xác nhận xe đã hoàn tất chuyến đi.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
