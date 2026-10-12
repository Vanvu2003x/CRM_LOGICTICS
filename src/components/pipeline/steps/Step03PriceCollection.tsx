import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

export default function Step03PriceCollection() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">So sánh giá từ các nhà cung cấp / đại lý để có mức giá tốt nhất.</p>
        <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Thêm báo giá mới</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Quote 1 */}
        <Card className="border-blue-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  Hãng tàu MAERSK
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded border border-green-200">Đề xuất tốt nhất</span>
                </h4>
                <p className="text-sm text-gray-500 mt-1">Lịch trình: Thứ 3, Thứ 6 hàng tuần | Transit: 5 ngày</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">$250</p>
                <p className="text-xs text-gray-500">/20ft (chưa gồm LSS, THC)</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <p className="text-sm"><strong>Ghi chú:</strong> Chỗ đang khá căng, cần book trước 7 ngày.</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Sửa</Button>
                <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quote 2 */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-lg">Đại lý ABC Forwarding</h4>
                <p className="text-sm text-gray-500 mt-1">Lịch trình: Thứ 5 hàng tuần | Transit: 6 ngày (Via HK)</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">$270</p>
                <p className="text-xs text-gray-500">/20ft (All in cước biển)</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <p className="text-sm"><strong>Ghi chú:</strong> Giá đã gồm LSS, rẻ nếu tính total nhưng thời gian đi chậm hơn.</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Sửa</Button>
                <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Quote 3 */}
        <Card className="border-gray-200 shadow-sm opacity-70">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-lg">Hãng tàu CMA-CGM</h4>
                <p className="text-sm text-gray-500 mt-1">Lịch trình: Thứ 7 hàng tuần</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">$300</p>
                <p className="text-xs text-gray-500">/20ft</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <p className="text-sm"><strong>Ghi chú:</strong> Hết space tuần này.</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Sửa</Button>
                <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
