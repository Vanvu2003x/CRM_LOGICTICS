"use client";

import { useState, type ReactNode } from "react";
import type { OperationReports } from "@/lib/operation-reports";
import { useListPagination } from "@/hooks/use-list-pagination";
import { safeUrl } from "@/lib/business-rules";

const datetime = (value: string | null) => value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const hours = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}p`;
const steps: Record<string, string> = { SCRIPT_DRAFT: "Nộp kịch bản", SCRIPT_APPROVED: "Duyệt kịch bản", PRODUCT_DRAFT: "Nộp sản phẩm nháp", PRODUCT_APPROVED: "Duyệt sản phẩm", DONE: "Hoàn thành" };
const timings: Record<string, string> = { ON_TIME: "Đúng hạn", LATE: "Hoàn thành trễ", OVERDUE: "Quá hạn", ACTIVE: "Trong hạn", UNKNOWN: "Thiếu ngày hoàn thành" };
function EvidenceLink({ link, children }: { link: string | null; children: ReactNode }) { return link && safeUrl(link) ? <a href={link} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 underline underline-offset-2">{children}</a> : <span className="text-slate-400">Chưa có link</span>; }
function Badge({ children, warning = false }: { children: ReactNode; warning?: boolean }) { return <span className={`inline-block rounded-md px-2 py-1 text-xs ${warning ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>{children}</span>; }
function Summary({ stats }: { stats: [string, string | number][] }) { return <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">{stats.map(([label, value]) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-xl font-bold tabular-nums text-slate-900">{value}</p></article>)}</div>; }

type Column<T> = { label: string; render: (row: T) => ReactNode };
function DetailTable<T extends { id: string; employee: string }>({ title, note, rows, columns }: { title: string; note: string; rows: T[]; columns: Column<T>[] }) {
  const [search, setSearch] = useState("");
  const filtered = rows.filter(row => JSON.stringify(row).toLocaleLowerCase("vi-VN").includes(search.toLocaleLowerCase("vi-VN")));
  const paging = useListPagination(filtered, search, 10);
  return <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{note}</p></div><input aria-label={`Tìm trong ${title}`} value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm nhân viên, nội dung..." className="h-10 w-full rounded-lg border px-3 text-sm sm:w-64" /></div>
    <div className="hidden overflow-x-auto md:block"><table className="w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{columns.map(column => <th key={column.label} className="px-3 py-3 font-semibold">{column.label}</th>)}</tr></thead><tbody>{paging.items.map(row => <tr key={row.id} className="border-t align-top hover:bg-slate-50">{columns.map(column => <td key={column.label} className="max-w-56 break-words px-3 py-3 leading-5">{column.render(row)}</td>)}</tr>)}</tbody></table></div>
    <div className="divide-y md:hidden">{paging.items.map(row => <article key={row.id} className="space-y-2 p-4">{columns.map(column => <div key={column.label} className="grid grid-cols-[100px_minmax(0,1fr)] gap-3 text-xs"><span className="text-slate-500">{column.label}</span><div className="min-w-0 break-words leading-5">{column.render(row)}</div></div>)}</article>)}</div>
    {!filtered.length && <p role="status" className="p-8 text-center text-sm text-slate-500">Không có dữ liệu phù hợp với kỳ và bộ lọc đã chọn.</p>}
    {paging.controls}
  </section>;
}

export function AttendanceReport({ data }: { data: OperationReports }) {
  const s = data.attendanceSummary;
  return <div className="space-y-4"><Summary stats={[["Số ca", s.sessions], ["Giờ làm", hours(s.minutes)], ["Ca đi muộn", s.late], ["Ca về sớm", s.early], ["Ca tự đóng", s.automatic], ["Ca đang mở", data.attendance.filter(row => !row.checkOut).length]]} />
    <DetailTable title="Đối chiếu ca chấm công" note="Giờ Việt Nam. Theo quy định hiện tại: vào sau 08:05 là muộn, ra trước 17:00 là sớm. Ca đang mở tính giờ đến lúc tải báo cáo." rows={data.attendance} columns={[
      { label: "Nhân viên", render: row => <b>{row.employee}</b> }, { label: "Giờ vào", render: row => datetime(row.checkIn) }, { label: "Giờ ra", render: row => datetime(row.checkOut) }, { label: "Giờ làm", render: row => hours(row.minutes) },
      { label: "Đánh giá", render: row => <div className="flex flex-wrap gap-1">{row.late && <Badge warning>Đi muộn</Badge>}{row.early && <Badge warning>Về sớm</Badge>}{!row.late && !row.early && <Badge>{row.checkOut ? "Đúng giờ" : "Đang làm"}</Badge>}</div> },
      { label: "Đóng ca", render: row => row.automatic ? "Tự đóng cuối ngày" : !row.checkOut ? "Đang mở" : row.closeType === "ADMIN" ? "Admin đóng" : "Nhân viên đóng" },
    ]} /></div>;
}
export function CampaignReport({ data }: { data: OperationReports }) {
  const s = data.campaignSummary;
  return <div className="space-y-4"><Summary stats={[["Nhiệm vụ được giao", s.assigned], ["Đã hoàn thành", s.completed], ["Hoàn thành đúng hạn", s.onTime], ["Trễ / quá hạn", s.late], ["Bài phạt phát sinh", s.penalties], ["Bài phạt còn thiếu", s.missing]]} />
    <DetailTable title="Đối chiếu nhiệm vụ & bài phạt" note="Gồm việc được tạo, đến hạn hoặc hoàn thành trong kỳ. Bài phạt hiển thị riêng, không cộng vào số nhiệm vụ gốc. Chỉ ghi nhận nộp đủ khi hoàn thành quy trình duyệt." rows={data.campaigns} columns={[
      { label: "Nhân viên", render: row => <b>{row.employee}</b> }, { label: "Chiến dịch / nhiệm vụ", render: row => <><b>{row.title}</b><p className="text-slate-500">{row.campaign}</p></> },
      { label: "Loại", render: row => <Badge warning={row.penalty}>{row.penalty ? "Bài phạt" : "Nhiệm vụ"}</Badge> }, { label: "Deadline", render: row => datetime(row.deadline) }, { label: "Hoàn thành", render: row => datetime(row.completedAt) },
      { label: "Tiến độ", render: row => steps[row.step] || "Chưa xác định" }, { label: "Đúng / trễ hạn", render: row => <Badge warning={["LATE", "OVERDUE", "UNKNOWN"].includes(row.timing)}>{timings[row.timing]}</Badge> }, { label: "Minh chứng", render: row => <EvidenceLink link={row.link}>Xem sản phẩm</EvidenceLink> },
    ]} /></div>;
}
export function FairReport({ data }: { data: OperationReports }) {
  const s = data.fairSummary;
  return <div className="space-y-4"><Summary stats={[["Buổi tham gia", s.sessions], ["Kết quả đã nộp", s.submitted], ["Khách thu được", s.customers], ["Khách có nhu cầu", s.interested], ["Đơn tạo", s.orders], ["Đơn thắng", s.wins]]} />
    <DetailTable title="Đối chiếu kết quả hội chợ" note="Chọn buổi tham gia trong kỳ; BOTH tính 2 buổi. Kết quả và đơn là trạng thái hiện tại của các buổi đó. Tổng khách và đơn loại bỏ trùng ID, nên có thể nhỏ hơn tổng các dòng." rows={data.fairs} columns={[
      { label: "Nhân viên", render: row => <b>{row.employee}</b> }, { label: "Hội chợ / ngày", render: row => <><b>{row.fair}</b><p>{datetime(row.day)}</p></> }, { label: "Buổi", render: row => row.session === "BOTH" ? "Sáng + chiều" : row.session === "MORNING" ? "Sáng" : "Chiều" },
      { label: "Kết quả", render: row => <><Badge warning={!row.resultAt}>{row.resultAt ? "Đã nộp" : "Chưa nộp"}</Badge><p className="mt-1 text-slate-500">{datetime(row.resultAt)}</p>{row.resultNote && <details><summary className="cursor-pointer text-blue-600">Xem ghi chú</summary><p>{row.resultNote}</p></details>}</> },
      { label: "Khách / nhu cầu", render: row => <>{row.customers} / {row.interested}{row.customerNames && <details><summary className="cursor-pointer text-blue-600">Xem khách</summary><p>{row.customerNames}</p></details>}</> },
      { label: "Đơn / thắng", render: row => <>{row.orders} / <b className="text-emerald-700">{row.wins}</b><p className="text-slate-500">{row.orderCodes || "Chưa có đơn"}</p></> }, { label: "Truyền thông", render: row => <EvidenceLink link={row.marketingLink}>Xem bài đăng</EvidenceLink> },
    ]} /></div>;
}
export function SocialReport({ data }: { data: OperationReports }) {
  const s = data.socialSummary;
  return <div className="space-y-4"><Summary stats={[["Bài đăng", s.posts], ["Bình luận", s.comments], ["Ca có khách từ MXH", `${s.met} / ${s.sessions}`], ["Tỷ lệ đạt", `${s.rate}%`], ["Khách từ MXH", s.customers], ["Đơn thắng", s.wins]]} />
    {s.unlinked > 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Có {s.unlinked} hoạt động trong kỳ chưa gắn ca làm; không tính vào KPI theo ca.</p>}
    <DetailTable title="Đối chiếu KPI mạng xã hội theo ca" note="Chọn ca bắt đầu trong kỳ và toàn bộ minh chứng gắn ca. KPI đạt khi ca có ít nhất 1 khách hàng từ MXH; bài đăng và bình luận được bổ sung không giới hạn. Kết quả đơn là trạng thái hiện tại." rows={data.social} columns={[
      { label: "Nhân viên", render: row => <b>{row.employee}</b> }, { label: "Ca làm", render: row => <>{datetime(row.checkIn)}<p className="text-slate-500">Ra: {datetime(row.checkOut)}</p></> },
      { label: "Bài đăng", render: row => <b>{row.posts}</b> }, { label: "Bình luận", render: row => <b>{row.comments}</b> }, { label: "KPI", render: row => <Badge warning={!row.done}>{row.done ? "Đạt" : "Chưa đạt"}</Badge> },
      { label: "Khách / nhu cầu", render: row => <>{row.customers} / {row.interested}{row.customerNames && <details><summary className="cursor-pointer text-blue-600">Xem khách</summary><p>{row.customerNames}</p></details>}</> },
      { label: "Đơn / thắng", render: row => <>{row.orders} / <b className="text-emerald-700">{row.wins}</b><p className="text-slate-500">{row.orderCodes || "Chưa có đơn"}</p></> },
      { label: "Minh chứng", render: row => row.links.length ? <details><summary className="cursor-pointer text-blue-600">{row.links.length} link</summary><div className="mt-2 space-y-2">{row.links.map((link, index) => <p key={link.id}><EvidenceLink link={link.link}>{link.type === "POST" ? "Bài" : "Bình luận"} {index + 1}</EvidenceLink></p>)}</div></details> : "Chưa có minh chứng" },
    ]} /></div>;
}
