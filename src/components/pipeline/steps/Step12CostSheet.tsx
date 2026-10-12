import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { FileSpreadsheet, FileDown, Plus } from "lucide-react";
import { exportPdf } from "@/lib/export-pdf";

export default function Step12CostSheet() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start bg-white p-4 rounded-lg border border-gray-200">
        <div>
          <h4 className="font-semibold text-gray-900">Bảng Kê Chi Phí (Debit Note / Cost Sheet)</h4>
          <p className="text-sm text-gray-500 mt-1">Tổng hợp chi phí vận chuyển, local charge, hải quan, xe tải... để gửi khách hàng thanh toán.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><FileSpreadsheet className="w-4 h-4 mr-2" /> Mẫu Bảng Kê Excel</Button>
        </div>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Nội dung (Description)</TableHead>
              <TableHead>ĐVT</TableHead>
              <TableHead>Số lượng</TableHead>
              <TableHead className="text-right">Đơn giá</TableHead>
              <TableHead className="text-right">Thành tiền (VND)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Cước vận chuyển quốc tế (Ocean Freight)</TableCell>
              <TableCell>Cont</TableCell>
              <TableCell>2</TableCell>
              <TableCell className="text-right">7,000,000</TableCell>
              <TableCell className="text-right font-semibold">14,000,000</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Phí xếp dỡ (THC)</TableCell>
              <TableCell>Cont</TableCell>
              <TableCell>2</TableCell>
              <TableCell className="text-right">3,000,000</TableCell>
              <TableCell className="text-right font-semibold">6,000,000</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Phí D/O</TableCell>
              <TableCell>Bill</TableCell>
              <TableCell>1</TableCell>
              <TableCell className="text-right">800,000</TableCell>
              <TableCell className="text-right font-semibold">800,000</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Cước xe kéo từ cảng về kho</TableCell>
              <TableCell>Chuyến</TableCell>
              <TableCell>2</TableCell>
              <TableCell className="text-right">3,500,000</TableCell>
              <TableCell className="text-right font-semibold">7,000,000</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={5} className="bg-gray-50/50 p-2 text-center">
                <Button variant="ghost" size="sm" className="text-blue-600 w-full"><Plus className="w-4 h-4 mr-2" /> Thêm chi phí phát sinh</Button>
              </TableCell>
            </TableRow>
            <TableRow className="bg-gray-100 border-t-2">
              <TableCell colSpan={4} className="text-right font-bold text-gray-700">TỔNG CỘNG:</TableCell>
              <TableCell className="text-right font-bold text-red-600 text-lg">27,800,000 đ</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center bg-gray-50 p-4 border rounded-lg">
        <div className="flex items-center space-x-2">
          <Checkbox id="cost-done" />
          <label htmlFor="cost-done" className="text-sm font-medium cursor-pointer">
            Đã chốt chi phí cuối cùng với khách hàng
          </label>
        </div>
        <Button className="bg-blue-600" onClick={() => exportPdf("BANG KE CHI PHI", ["Ocean Freight: 14,000,000 VND", "THC: 6,000,000 VND", "D/O: 800,000 VND", "Tong cong: 27,800,000 VND"], "bang-ke-chi-phi-demo.pdf")}><FileDown className="w-4 h-4 mr-2" /> Xuất PDF Bảng Kê</Button>
      </div>
    </div>
  );
}
