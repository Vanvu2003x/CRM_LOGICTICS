import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Step02OrderInfo() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        
        <div className="space-y-2">
          <Label>Loại hình <span className="text-red-500">*</span></Label>
          <Select defaultValue="export">
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại hình" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="export">Xuất Khẩu (Export)</SelectItem>
              <SelectItem value="import">Nhập Khẩu (Import)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Phương thức vận chuyển <span className="text-red-500">*</span></Label>
          <Select defaultValue="fcl">
            <SelectTrigger>
              <SelectValue placeholder="Chọn phương thức" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fcl">FCL (Nguyên cont)</SelectItem>
              <SelectItem value="lcl">LCL (Hàng lẻ)</SelectItem>
              <SelectItem value="air">AIR (Hàng không)</SelectItem>
              <SelectItem value="cpn">CPN (Chuyển phát nhanh)</SelectItem>
              <SelectItem value="bo-tn">BỘ TN (Đường bộ trong nước)</SelectItem>
              <SelectItem value="bo-cn">BỘ CN (Đường bộ chuyên ngành)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cảng/Sân bay xuất (POL) <span className="text-red-500">*</span></Label>
          <Input placeholder="VD: VNHPH (Hải Phòng)" defaultValue="VNHPH" />
        </div>

        <div className="space-y-2">
          <Label>Cảng/Sân bay nhập (POD) <span className="text-red-500">*</span></Label>
          <Input placeholder="VD: KRPUS (Busan)" defaultValue="KRPUS" />
        </div>

        <div className="space-y-2">
          <Label>Tên hàng <span className="text-red-500">*</span></Label>
          <Input placeholder="VD: Quần áo, linh kiện..." defaultValue="Quần áo mùa đông" />
        </div>

        <div className="space-y-2">
          <Label>Số lượng (Volume/Weight) <span className="text-red-500">*</span></Label>
          <Input placeholder="VD: 2x20'DC, 15 CBM..." defaultValue="2x20'DC" />
        </div>
        
        <div className="space-y-2">
          <Label>Ngày dự kiến xuất hàng (ETD) <span className="text-red-500">*</span></Label>
          <Input type="date" defaultValue="2023-10-15" />
        </div>

        <div className="space-y-2">
          <Label>Điều kiện vận chuyển (Incoterms) <span className="text-red-500">*</span></Label>
          <Select defaultValue="fob">
            <SelectTrigger>
              <SelectValue placeholder="Chọn Incoterms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exw">EXW</SelectItem>
              <SelectItem value="fca">FCA</SelectItem>
              <SelectItem value="fob">FOB</SelectItem>
              <SelectItem value="cif">CIF</SelectItem>
              <SelectItem value="cip">CIP</SelectItem>
              <SelectItem value="cfr">CFR</SelectItem>
              <SelectItem value="dap">DAP</SelectItem>
              <SelectItem value="ddp">DDP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2 border-t pt-4 mt-2">
          <h4 className="font-medium mb-2 text-gray-700">Dịch vụ cộng thêm (Door to Door)</h4>
        </div>

        <div className="space-y-2">
          <Label>Địa điểm lấy hàng (Pick-up)</Label>
          <Input placeholder="Nhập địa chỉ nhà máy/kho lấy hàng" />
        </div>

        <div className="space-y-2">
          <Label>Địa điểm trả hàng (Delivery)</Label>
          <Input placeholder="Nhập địa chỉ kho đích" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Lưu ý / Ghi chú khác</Label>
          <Textarea placeholder="Các yêu cầu đặc biệt của khách hàng..." />
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 transition-colors">
          Lưu thông tin đơn hàng
        </button>
      </div>
    </div>
  );
}
