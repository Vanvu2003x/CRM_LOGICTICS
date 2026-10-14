export type LeadStatus = "MỚI" | "ĐANG_CHĂM_SÓC" | "CHUYỂN_ĐƠN" | "FAIL";

export type DemoLead = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  company: string;
  companyFoundedAt?: string | null;
  taxId?: string;
  address?: string;
  industry?: string;
  source: string;
  needs: string;
  isInterested: boolean;
  callDurationSeconds: number;
  callCount: number;
  status: LeadStatus;
  lastCall: string;
  sales: string;
  salesId?: string;
  interestState?: string;
  callOutcome?: string;
  followUpAt?: string | null;
  createdAt?: string;
  history?: unknown[];
};

export type DemoOrder = {
  id: string;
  publicCode?: string | null;
  customer: string;
  step: number;
  type: "EXPORT" | "IMPORT";
  date: string;
  sales: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  exportPort?: string | null;
  importPort?: string | null;
  expectedDate?: string | null;
  quantity?: string | null;
  incoterms?: string | null;
  dbId?: string;
  salesId?: string;
  leadId?: string | null;
  data?: import("./business-rules").SavedSteps;
  completedSteps?: number[];
  history?: unknown[];
  dueDate?: string | null;
  paidAt?: string | null;
  invoiceNumber?: string | null;
  invoiceAmount?: number | null;
  invoiceCurrency?: string;
  invoiceIssuedAt?: string | null;
  failureReason?: string | null;
  files?: { id: string; filename: string; step: number; kind?: string | null }[];
};

export type DemoAgent = {
  id: string;
  name: string;
  country: string;
  city: string;
  rating: number;
  status: "ACTIVE" | "INACTIVE";
  contact: string;
  contactName?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  notes?: string | null;
};

export type PriceLine = { price: number; quantity: number };

export const initialLeads: DemoLead[] = [
  { id: "L001", name: "Nguyễn Văn A", phone: "0901234567", company: "Công ty TNHH VinaX", source: "ITY Tổng đài", needs: "Hàng XK đi Mỹ", isInterested: true, callDurationSeconds: 320, callCount: 4, status: "ĐANG_CHĂM_SÓC", lastCall: "2026-10-04", sales: "Sales Demo" },
  { id: "L002", name: "Trần Thị B", phone: "0912345678", company: "Công ty Cổ phần Alpha", source: "ITY Tổng đài", needs: "Nhập uỷ thác từ TQ", isInterested: true, callDurationSeconds: 540, callCount: 6, status: "CHUYỂN_ĐƠN", lastCall: "2026-10-02", sales: "Sales Demo" },
  { id: "L003", name: "Lê Văn C", phone: "0987654321", company: "Tập đoàn Beta", source: "ITY Tổng đài", needs: "Chưa rõ", isInterested: true, callDurationSeconds: 95, callCount: 1, status: "MỚI", lastCall: "2026-10-05", sales: "Chưa giao" },
  { id: "L004", name: "Phạm Thị D", phone: "0976543210", company: "Delta Logistics", source: "Tự tìm kiếm", needs: "FCL Hải Phòng - Tokyo", isInterested: true, callDurationSeconds: 410, callCount: 3, status: "ĐANG_CHĂM_SÓC", lastCall: "2026-09-28", sales: "Sales Demo" },
  { id: "L005", name: "Hoàng Văn E", phone: "0934567890", company: "Gamma Corp", source: "ITY Tổng đài", needs: "Không có nhu cầu", isInterested: false, callDurationSeconds: 60, callCount: 1, status: "FAIL", lastCall: "2026-10-01", sales: "Sales Demo" },
];

export const initialOrders: DemoOrder[] = [
  { id: "ORD-001", customer: "Công ty TNHH VinaX", step: 1, type: "EXPORT", date: "2026-10-01", sales: "Sales Demo", status: "IN_PROGRESS" },
  { id: "ORD-002", customer: "Công ty Cổ phần Alpha", step: 2, type: "IMPORT", date: "2026-10-02", sales: "Sales Demo", status: "IN_PROGRESS" },
  { id: "ORD-003", customer: "Tập đoàn Beta", step: 4, type: "EXPORT", date: "2026-10-03", sales: "Nguyễn Minh", status: "IN_PROGRESS" },
  { id: "ORD-004", customer: "Công ty Gamma", step: 6, type: "IMPORT", date: "2026-10-04", sales: "Nguyễn Minh", status: "IN_PROGRESS" },
  { id: "ORD-005", customer: "Delta Logistics", step: 10, type: "EXPORT", date: "2026-10-05", sales: "Sales Demo", status: "IN_PROGRESS" },
];

export const initialAgents: DemoAgent[] = [
  { id: "A001", name: "KOREA EXPRESS CO., LTD", country: "Hàn Quốc", city: "Busan", rating: 5, status: "ACTIVE", contact: "Mr. Kim" },
  { id: "A002", name: "SHANGHAI LOGISTICS", country: "Trung Quốc", city: "Shanghai", rating: 4, status: "ACTIVE", contact: "Ms. Wang" },
  { id: "A003", name: "GLOBAL FORWARDING INC", country: "Mỹ", city: "Los Angeles", rating: 4, status: "INACTIVE", contact: "John Doe" },
  { id: "A004", name: "TOKYO MARITIME", country: "Nhật Bản", city: "Tokyo", rating: 5, status: "ACTIVE", contact: "Tanaka" },
];

const seedSales = ["Sales Demo", "Nguyễn Minh", "Trần Lan", "Lê Hoàng", "Phạm Ngọc"];
const seedCompanies = ["VinaX", "Alpha Trading", "Beta Foods", "Delta Logistics", "Gamma Corp", "Hải Nam Import"];
const seedNeeds = ["FCL Hải Phòng - Tokyo", "Hàng XK đi Mỹ", "Nhập uỷ thác từ TQ", "AIR đi Singapore", "LCL Busan - Hải Phòng"];
const seedNames = ["Nguyễn An", "Trần Bình", "Lê Chi", "Phạm Dũng", "Hoàng Hà", "Đỗ Hạnh", "Vũ Khánh", "Bùi Linh", "Đặng Nam", "Mai Oanh"];

for (let index = 0; index < 45; index += 1) {
  const interested = index % 7 !== 0;
  initialLeads.push({
    id: `L${String(index + 6).padStart(3, "0")}`,
    name: `${seedNames[index % seedNames.length]} ${index + 1}`,
    phone: `09${String(10000000 + index * 731).slice(0, 8)}`,
    company: `${seedCompanies[index % seedCompanies.length]} ${index + 1}`,
    source: index % 4 === 0 ? "Tự tìm kiếm" : "ITY Tổng đài",
    needs: interested ? seedNeeds[index % seedNeeds.length] : "Không có nhu cầu",
    isInterested: interested,
    callDurationSeconds: 45 + ((index * 83) % 560),
    callCount: 1 + (index % 8),
    status: interested ? (["MỚI", "ĐANG_CHĂM_SÓC", "CHUYỂN_ĐƠN"] as LeadStatus[])[index % 3] : "FAIL",
    lastCall: `2026-10-${String(1 + (index % 5)).padStart(2, "0")}`,
    sales: seedSales[index % seedSales.length],
  });
}

for (let index = 0; index < 25; index += 1) {
  initialOrders.push({
    id: `ORD-${String(index + 6).padStart(3, "0")}`,
    customer: `${seedCompanies[index % seedCompanies.length]} ${index + 1}`,
    step: 1 + (index % 13),
    type: index % 2 === 0 ? "EXPORT" : "IMPORT",
    date: `2026-10-${String(1 + (index % 5)).padStart(2, "0")}`,
    sales: seedSales[index % seedSales.length],
    status: index % 13 === 12 ? "COMPLETED" : "IN_PROGRESS",
  });
}

for (let index = 0; index < 12; index += 1) {
  initialAgents.push({
    id: `A${String(index + 5).padStart(3, "0")}`,
    name: `GLOBAL PARTNER ${index + 1}`,
    country: ["Trung Quốc", "Hàn Quốc", "Nhật Bản", "Singapore"][index % 4],
    city: ["Shanghai", "Busan", "Tokyo", "Singapore"][index % 4],
    rating: 3 + (index % 3),
    status: index % 5 === 0 ? "INACTIVE" : "ACTIVE",
    contact: `Contact ${index + 1}`,
  });
}

export function calculateTotal(lines: PriceLine[]) {
  return lines.reduce((total, line) => total + line.price * line.quantity, 0);
}

export function filterLeads(leads: DemoLead[], query: string, status: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
  return leads.filter((lead) => {
    const matchesQuery = !normalizedQuery || [lead.name, lead.phone, lead.company].some((value) => value.toLocaleLowerCase("vi-VN").includes(normalizedQuery));
    return matchesQuery && (status === "ALL" || lead.status === status);
  });
}
