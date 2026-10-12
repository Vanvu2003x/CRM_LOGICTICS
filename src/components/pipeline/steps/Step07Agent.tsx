import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, CheckCircle2, Plus } from "lucide-react";

export default function Step07Agent() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-medium text-gray-900">Lựa chọn Đại lý (Agent)</h4>
          <p className="text-sm text-gray-500 mt-1">Chọn đại lý từ danh sách đối tác để handle lô hàng tại cảng đích.</p>
        </div>
        <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Thêm đại lý mới</Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Tên Đại lý</TableHead>
              <TableHead>Quốc gia</TableHead>
              <TableHead>Đánh giá</TableHead>
              <TableHead>Trạng thái hợp tác</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-blue-50/50">
              <TableCell>
                <div className="font-medium text-blue-700 flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  KOREA EXPRESS CO., LTD
                </div>
                <div className="text-xs text-gray-500">Busan, South Korea</div>
              </TableCell>
              <TableCell>Hàn Quốc</TableCell>
              <TableCell>⭐⭐⭐⭐⭐ (24 lô)</TableCell>
              <TableCell>
                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">Đối tác chiến lược</span>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Đã chọn
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <div className="font-medium">SEOUL LOGISTICS</div>
                <div className="text-xs text-gray-500">Incheon, South Korea</div>
              </TableCell>
              <TableCell>Hàn Quốc</TableCell>
              <TableCell>⭐⭐⭐⭐ (12 lô)</TableCell>
              <TableCell>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Đang hợp tác</span>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline">Chọn đại lý</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="pt-4 border-t">
        <Label className="mb-2 block">Ghi chú gửi Đại lý</Label>
        <Input placeholder="Yêu cầu gửi pre-alert sớm..." />
      </div>
    </div>
  );
}
