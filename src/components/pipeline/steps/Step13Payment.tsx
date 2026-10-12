"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Receipt, AlertCircle } from "lucide-react";

export default function Step13Payment() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4 text-green-700 bg-green-50 p-3 rounded border border-green-200">
        <Receipt className="w-5 h-5" />
        <span className="font-medium text-sm">Bước cuối cùng: Phát hành hoá đơn và thu tiền khách hàng.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phần hoá đơn */}
        <div className="space-y-4 bg-white p-5 rounded-lg border">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="font-semibold text-lg">1. Phát hành hoá đơn</h4>
            <Badge variant="secondary">Chưa xuất</Badge>
          </div>
          
          <div className="space-y-2">
            <Label>Số hoá đơn (Invoice No.)</Label>
            <Input placeholder="Nhập số hoá đơn VAT..." />
          </div>
          
          <div className="space-y-2">
            <Label>Ngày phát hành</Label>
            <Input type="date" />
          </div>

          <div className="pt-4 mt-2 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox id="invoice-done" />
              <label htmlFor="invoice-done" className="text-sm font-medium cursor-pointer">
                Đã xuất hoá đơn thành công
              </label>
            </div>
          </div>
        </div>

        {/* Phần thanh toán */}
        <div className="space-y-4 bg-white p-5 rounded-lg border">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="font-semibold text-lg">2. Theo dõi công nợ</h4>
            <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">Chưa thanh toán</Badge>
          </div>
          
          <div className="space-y-2">
            <Label>Tổng tiền cần thu</Label>
            <div className="relative">
              <Input value="27,800,000" readOnly className="pr-12 bg-gray-50 font-semibold" />
              <span className="absolute right-3 top-2.5 text-gray-500 text-sm">VNĐ</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Hạn thanh toán (Due Date)</Label>
            <Input type="date" />
          </div>

          <div className="space-y-2">
            <Label>Mã màu mức độ gấp</Label>
            <div className="flex gap-2">
              <label className="flex items-center gap-1 border p-2 rounded cursor-pointer hover:bg-green-50">
                <input type="radio" name="color" value="green" defaultChecked />
                <div className="w-4 h-4 rounded-full bg-green-500"></div> Xanh (Chưa gấp)
              </label>
              <label className="flex items-center gap-1 border p-2 rounded cursor-pointer hover:bg-amber-50">
                <input type="radio" name="color" value="yellow" />
                <div className="w-4 h-4 rounded-full bg-amber-500"></div> Vàng (TB)
              </label>
              <label className="flex items-center gap-1 border p-2 rounded cursor-pointer hover:bg-rose-50">
                <input type="radio" name="color" value="red" />
                <div className="w-4 h-4 rounded-full bg-rose-500"></div> Đỏ (Gấp)
              </label>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-amber-50 p-2 rounded text-xs text-amber-800 border border-amber-100">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>Hệ thống sẽ tự động gửi nhắc nhở cho KH khi còn 7 ngày tới hạn thanh toán.</p>
          </div>

          <div className="pt-4 mt-2 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox id="payment-done" />
              <label htmlFor="payment-done" className="text-sm font-medium text-green-700 cursor-pointer">
                Khách hàng đã thanh toán đủ
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button className="bg-green-600 hover:bg-green-700" size="lg">
          Hoàn thành đơn hàng
        </Button>
      </div>
    </div>
  );
}
