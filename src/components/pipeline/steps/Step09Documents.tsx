"use client";
import { ChangeEvent, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FileText, FileDown, Upload } from "lucide-react";
import { exportPdf } from "@/lib/export-pdf";

export default function Step09Documents({ type = "EXPORT" }: { type?: "EXPORT" | "IMPORT" }) {
  const [docs, setDocs] = useState({
    mbl: false, hbl: false, inv: false, pl: false, co: false, dn: false,
    do: false, an: false
  });
  const [uploadedFile, setUploadedFile] = useState("");
  const [importSummary, setImportSummary] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleCheck = (key: keyof typeof docs) => {
    setDocs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isBaseDocsComplete = docs.mbl && docs.hbl && docs.inv && docs.pl && docs.co && docs.dn;

  async function importExcel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }).length;
    setUploadedFile(file.name);
    setImportSummary(`Đã nạp sheet ${workbook.SheetNames[0]} với ${Math.max(0, rows - 1)} dòng dữ liệu.`);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border">
        {type === "EXPORT" ? (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg border-b pb-2">Làm Vận Đơn (Bill of Lading)</h4>
            <p className="text-sm text-gray-500 mb-4">Sử dụng mẫu Excel chuẩn của công ty để tạo vận đơn và xuất PDF.</p>
            
            <input ref={uploadRef} className="sr-only" type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} />
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" className="bg-gray-50">
                <FileText className="w-4 h-4 mr-2 text-blue-600" /> Tải mẫu Bill Excel
              </Button>
              <Button variant="outline" onClick={() => uploadRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2 text-gray-600" /> Upload file đã điền
              </Button>
              <Button className="bg-blue-600" onClick={() => exportPdf("BILL OF LADING", [uploadedFile ? `Nguồn Excel: ${uploadedFile}` : "Bản demo chưa nạp file Excel", "Trạng thái: Draft Bill"], "van-don-demo.pdf")}>
                <FileDown className="w-4 h-4 mr-2" /> Xuất PDF Vận đơn
              </Button>
            </div>
            {(uploadedFile || importSummary) && <p role="status" className="text-sm text-green-700">{uploadedFile} {importSummary}</p>}
            
            <div className="mt-6 pt-4 border-t flex items-center space-x-2">
              <Checkbox id="bill-done" />
              <label htmlFor="bill-done" className="text-sm font-medium cursor-pointer">
                Đã gửi Draft Bill cho khách hàng xác nhận
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg border-b pb-2">Checklist Nhận Chứng Từ Nhập Khẩu</h4>
            <p className="text-sm text-gray-500 mb-4">Đánh dấu các chứng từ đã nhận từ đại lý.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                <Checkbox id="mbl" checked={docs.mbl} onCheckedChange={() => handleCheck("mbl")} />
                <label htmlFor="mbl" className="text-sm font-medium cursor-pointer">MBL (Master Bill)</label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                <Checkbox id="hbl" checked={docs.hbl} onCheckedChange={() => handleCheck("hbl")} />
                <label htmlFor="hbl" className="text-sm font-medium cursor-pointer">HBL (House Bill)</label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                <Checkbox id="inv" checked={docs.inv} onCheckedChange={() => handleCheck("inv")} />
                <label htmlFor="inv" className="text-sm font-medium cursor-pointer">INV (Invoice)</label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                <Checkbox id="pl" checked={docs.pl} onCheckedChange={() => handleCheck("pl")} />
                <label htmlFor="pl" className="text-sm font-medium cursor-pointer">PL (Packing List)</label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                <Checkbox id="co" checked={docs.co} onCheckedChange={() => handleCheck("co")} />
                <label htmlFor="co" className="text-sm font-medium cursor-pointer">C.O (Certificate of Origin)</label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                <Checkbox id="dn" checked={docs.dn} onCheckedChange={() => handleCheck("dn")} />
                <label htmlFor="dn" className="text-sm font-medium cursor-pointer">DN (Debit Note)</label>
              </div>
            </div>

            <div className={`mt-6 p-4 rounded-lg border ${isBaseDocsComplete ? 'bg-green-50 border-green-200' : 'bg-gray-50 opacity-60'}`}>
              <h5 className="font-medium text-sm mb-3">Chứng từ sau khi tàu cập (Yêu cầu đủ 6 chứng từ trên)</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="do" disabled={!isBaseDocsComplete} checked={docs.do} onCheckedChange={() => handleCheck("do")} />
                  <label htmlFor="do" className={`text-sm font-medium ${!isBaseDocsComplete ? 'text-gray-400' : 'cursor-pointer'}`}>D.O (Delivery Order)</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="an" disabled={!isBaseDocsComplete} checked={docs.an} onCheckedChange={() => handleCheck("an")} />
                  <label htmlFor="an" className={`text-sm font-medium ${!isBaseDocsComplete ? 'text-gray-400' : 'cursor-pointer'}`}>A.N (Arrival Notice)</label>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Label>Lịch khai MNF (Manifest)</Label>
              <Input type="date" className="max-w-xs mt-2" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
