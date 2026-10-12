"use client";

import { useMemo, useState } from "react";
import { FileDown, FileSpreadsheet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateTotal } from "@/lib/demo-crm";
import { exportPdf } from "@/lib/export-pdf";

type Line = { name: string; unit: string; price: number; quantity: number };
const initialLines: Line[] = [{ name: "Ocean Freight", unit: "20'DC", price: 280, quantity: 2 }, { name: "Terminal Handling Charge", unit: "20'DC", price: 120, quantity: 2 }];

export default function Step04Quotation() {
  const [lines, setLines] = useState(initialLines);
  const total = useMemo(() => calculateTotal(lines), [lines]);
  const update = (index: number, key: "price" | "quantity", value: number) => setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, [key]: value } : line));
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row"><div><h4 className="font-medium text-amber-900">Báo giá demo</h4><p className="text-sm text-amber-800">Chỉnh đơn giá hoặc số lượng để cập nhật tổng tiền ngay.</p></div><Button variant="outline" onClick={() => setLines((current) => [...current, { name: "Phụ phí khác", unit: "Lô", price: 0, quantity: 1 }])}><Plus className="mr-2 size-4" />Thêm phí</Button></div><div className="overflow-auto rounded-lg border"><Table><TableHeader className="bg-gray-50"><TableRow><TableHead>Khoản phí</TableHead><TableHead>ĐVT</TableHead><TableHead>Đơn giá USD</TableHead><TableHead>Số lượng</TableHead><TableHead className="text-right">Thành tiền</TableHead></TableRow></TableHeader><TableBody>{lines.map((line, index) => <TableRow key={`${line.name}-${index}`}><TableCell className="font-medium">{line.name}</TableCell><TableCell>{line.unit}</TableCell><TableCell><Input aria-label={`Đơn giá ${line.name}`} type="number" min="0" value={line.price} onChange={(event) => update(index, "price", Number(event.target.value))} /></TableCell><TableCell><Input aria-label={`Số lượng ${line.name}`} type="number" min="0" value={line.quantity} onChange={(event) => update(index, "quantity", Number(event.target.value))} /></TableCell><TableCell className="text-right">${(line.price * line.quantity).toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell></TableRow>)}<TableRow className="bg-gray-50"><TableCell colSpan={4} className="text-right font-bold">TỔNG BÁO GIÁ</TableCell><TableCell className="text-right text-lg font-bold text-blue-700">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell></TableRow></TableBody></Table></div><div className="flex justify-end gap-2"><Button variant="outline"><FileSpreadsheet className="mr-2 size-4" />Tải form Excel mẫu</Button><Button onClick={() => exportPdf("QUOTATION", [...lines.map((line) => `${line.name}: ${line.quantity} x $${line.price} = $${line.quantity * line.price}`), `Total: $${total}`], "bao-gia-demo.pdf")}><FileDown className="mr-2 size-4" />Xuất PDF báo giá</Button></div></div>;
}
