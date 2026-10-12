import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export default function Step05Feedback({ onDecision }: { onDecision?: (accept: boolean) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h3 className="text-2xl font-semibold mb-2">Phản hồi từ khách hàng</h3>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Sau khi gửi báo giá, khách hàng đã phản hồi như thế nào? Quyết định ở bước này sẽ chuyển hướng quy trình.</p>
        
        <div className="flex flex-col md:flex-row justify-center gap-6 max-w-2xl mx-auto">
          {/* Option 1: Accept */}
          <div className="flex-1 border-2 border-green-200 rounded-xl p-6 hover:bg-green-50 transition-colors flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h4 className="text-lg font-bold text-green-700 mb-2">Khách hàng ĐỒNG Ý</h4>
            <p className="text-sm text-gray-500 mb-6 text-center">Khách chốt giá và đồng ý tiến hành vận chuyển. Đơn hàng sẽ chuyển sang bước Booking.</p>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 mt-auto"
              onClick={() => onDecision && onDecision(true)}
            >
              Chuyển sang Bước 6
            </Button>
          </div>

          {/* Option 2: Negotiate */}
          <div className="flex-1 border-2 border-amber-200 rounded-xl p-6 hover:bg-amber-50 transition-colors flex flex-col items-center">
            <RefreshCw className="w-16 h-16 text-amber-500 mb-4" />
            <h4 className="text-lg font-bold text-amber-700 mb-2">Cần ĐÀM PHÁN THÊM</h4>
            <p className="text-sm text-gray-500 mb-6 text-center">Khách yêu cầu giảm giá hoặc thay đổi điều kiện. Đơn hàng sẽ quay lại bước lấy thông tin.</p>
            <Button 
              variant="outline" 
              className="w-full border-amber-500 text-amber-700 hover:bg-amber-100 mt-auto"
              onClick={() => onDecision && onDecision(false)}
            >
              Quay lại Bước 2
            </Button>
          </div>

          {/* Option 3: Fail */}
          <div className="flex-1 border-2 border-red-200 rounded-xl p-6 hover:bg-red-50 transition-colors flex flex-col items-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h4 className="text-lg font-bold text-red-700 mb-2">Đơn hàng THẤT BẠI</h4>
            <p className="text-sm text-gray-500 mb-6 text-center">Khách huỷ hoặc chọn bên khác. Ghi nhận lý do fail để báo cáo.</p>
            <Button 
              variant="destructive" 
              className="w-full mt-auto"
            >
              Đánh dấu Fail
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
