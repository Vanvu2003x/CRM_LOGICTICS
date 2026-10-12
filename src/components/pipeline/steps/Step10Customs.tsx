"use client";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Step10Customs() {
  const [lane, setLane] = useState("yellow");

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        <h4 className="font-semibold text-lg border-b pb-4 mb-4">Thông tin khai báo Hải quan</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Số tờ khai <span className="text-red-500">*</span></Label>
            <Input placeholder="Nhập số tờ khai hải quan..." defaultValue="1234567890" />
          </div>

          <div className="space-y-2">
            <Label>Phân luồng</Label>
            <Select value={lane} onValueChange={(value) => setLane(value ?? "yellow")}>
              <SelectTrigger className={`
                ${lane === 'green' ? 'border-green-500 text-green-700 bg-green-50' : ''}
                ${lane === 'yellow' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' : ''}
                ${lane === 'red' ? 'border-red-500 text-red-700 bg-red-50' : ''}
              `}>
                <SelectValue placeholder="Chọn luồng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="green">
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Luồng Xanh (Miễn kiểm tra)</span>
                </SelectItem>
                <SelectItem value="yellow">
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span> Luồng Vàng (Kiểm tra hồ sơ)</span>
                </SelectItem>
                <SelectItem value="red">
                  <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> Luồng Đỏ (Kiểm tra thực tế)</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Trạng thái tờ khai</Label>
            <Select defaultValue="processing">
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="processing">Đang xử lý</SelectItem>
                <SelectItem value="waiting">Đang đợi kiểm</SelectItem>
                <SelectItem value="cleared">Đã thông quan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Ghi chú (Nếu có)</Label>
            <Textarea placeholder="Ghi chú thêm về quá trình khai báo..." defaultValue="Đang chờ hải quan duyệt giá..." />
          </div>
        </div>
      </div>
    </div>
  );
}
