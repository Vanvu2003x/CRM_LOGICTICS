"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/app/login/actions";
import { useState } from "react";
import { Bell, Check, ChevronRight, Database, Menu, Palette, PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDemoData } from "@/components/demo/DemoDataProvider";
import { useUserContext } from "@/components/auth/UserContext";
import { Sidebar } from "./Sidebar";
import { navigationForPath } from "./navigation";
import { themes, type ThemeId } from "./themes";

const focusStyle = "outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

export function Header({ collapsed, onToggleSidebar, theme, onThemeChange }: { collapsed: boolean; onToggleSidebar: () => void; theme: ThemeId; onThemeChange: (theme: ThemeId) => void }) {
  const pathname = usePathname();
  const active = navigationForPath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [themeOpen, setThemeOpen] = useState(false);
  
  const { leads, orders, dataRequests } = useDemoData();
  const { currentUser, setCurrentUser, isAdmin } = useUserContext();
  const router = useRouter();

  const term = query.trim().toLocaleLowerCase("vi-VN");
  const matchingLeads = leads.filter((lead) => [lead.name, lead.phone, lead.company].some((value) => value.toLocaleLowerCase("vi-VN").includes(term))).slice(0, 5);
  const matchingOrders = orders.filter((order) => [order.id, order.customer].some((value) => value.toLocaleLowerCase("vi-VN").includes(term))).slice(0, 5);
  const openDataRequests = dataRequests.filter((item) => item.status === "OPEN");

  return (
    <header data-theme={theme} className="crm-header relative z-20 flex h-20 shrink-0 items-center justify-between gap-3 border-b px-4 shadow-[0_4px_16px_rgba(15,23,42,0.08)] sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-blue-500/20 via-cyan-300/70 to-blue-500/20" />
      <div className="relative flex min-w-0 items-center gap-3">
        <button type="button" onClick={onToggleSidebar} aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"} aria-expanded={!collapsed} aria-controls="desktop-sidebar" title={collapsed ? "Mở rộng menu" : "Thu gọn menu"} className={`hidden size-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-blue-100 transition-colors hover:border-blue-300/60 hover:bg-white/20 hover:text-white lg:flex ${focusStyle}`}>
          {collapsed ? <PanelLeftOpen className="size-5" aria-hidden="true" /> : <PanelLeftClose className="size-5" aria-hidden="true" />}
        </button>
        <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
          <DialogTrigger aria-label="Mở menu điều hướng" className={`flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-blue-100 hover:bg-white/20 lg:hidden ${focusStyle}`}><Menu className="size-5" /></DialogTrigger>
          <DialogContent showCloseButton={false} className="left-0 top-0 flex h-dvh w-72 max-w-[calc(100%-2rem)] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none bg-slate-950 p-0 sm:max-w-72">
            <DialogTitle className="sr-only">Điều hướng CRM</DialogTitle>
            <DialogDescription className="sr-only">Chọn khu vực làm việc.</DialogDescription>
            <DialogClose aria-label="Đóng menu" className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-blue-400"><X className="size-4" /></DialogClose>
            <Sidebar theme={theme} onNavigate={() => setMenuOpen(false)} />
          </DialogContent>
        </Dialog>
        <div className="min-w-0">
          <nav aria-label="Vị trí hiện tại" className="mb-1 hidden min-w-0 items-center gap-1.5 whitespace-nowrap text-[10px] text-blue-200 sm:flex"><Link href="/dashboard" className="hidden rounded hover:text-white focus-visible:ring-2 focus-visible:ring-blue-300 2xl:inline">Không gian làm việc</Link><ChevronRight className="hidden size-3 shrink-0 text-blue-300/70 2xl:block" aria-hidden="true" /><span className="truncate text-blue-100">{active?.name ?? "CRM"}</span></nav>
          <p className="truncate text-[13px] font-semibold tracking-tight text-white sm:text-[16px]">{pathname.startsWith("/pipeline/") ? "Chi tiết đơn hàng" : active?.name ?? "Logistics CRM"}</p>
        </div>
      </div>
      <div className="relative flex shrink-0 items-center gap-2 sm:gap-3">
        {isAdmin && <Dialog>
          <DialogTrigger aria-label={`${openDataRequests.length} yêu cầu cấp data`} title="Yêu cầu cấp data" className={`relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 ${focusStyle}`}><Bell className="size-5" />{openDataRequests.length > 0 && <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-5 text-white">{openDataRequests.length > 99 ? "99+" : openDataRequests.length}</span>}</DialogTrigger>
          <DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-md"><DialogTitle>Yêu cầu cấp data</DialogTitle><DialogDescription>Nhân viên báo hết hoặc sắp hết danh sách khách cần xử lý.</DialogDescription>{openDataRequests.length ? <div className="space-y-2">{openDataRequests.map((item) => <Link key={item.id} href="/leads" className="flex items-start gap-3 rounded-xl border p-3 transition hover:border-blue-300 hover:bg-blue-50"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><Database className="size-4" /></span><span className="min-w-0"><span className="block font-medium text-slate-900">{item.userName}</span><span className="mt-0.5 block text-xs text-slate-500">{item.note}</span><span className="mt-1 block text-[11px] text-blue-600">{new Date(item.requestedAt).toLocaleString("vi-VN")} · Mở kho data →</span></span></Link>)}</div> : <p className="rounded-xl bg-emerald-50 p-5 text-center text-sm text-emerald-700">Không có yêu cầu cấp data đang chờ.</p>}</DialogContent>
        </Dialog>}
        <Dialog open={themeOpen} onOpenChange={setThemeOpen}>
          <DialogTrigger aria-label="Đổi giao diện" title="Đổi giao diện" className={`flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 ${focusStyle}`}><Palette className="size-5" /></DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogTitle>Giao diện CRM</DialogTitle>
            <DialogDescription>Chọn màu bạn thích. Lựa chọn được lưu trên trình duyệt này.</DialogDescription>
            <div className="grid grid-cols-2 gap-3">{themes.map((item) => <button key={item.id} type="button" aria-pressed={theme === item.id} onClick={() => { onThemeChange(item.id); setThemeOpen(false); }} className={`rounded-xl border p-2.5 text-left text-slate-900 transition hover:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${theme === item.id ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}>
              <span className="mb-3 flex h-16 items-end rounded-lg p-2" style={{ background: item.color }}><span className="h-7 w-3 rounded bg-white/40" /><span className="ml-1 h-7 flex-1 rounded bg-white/80" /></span>
              <span className="flex items-center justify-between text-xs font-medium">{item.name}{theme === item.id && <Check className="size-3.5 text-blue-600" />}</span>
            </button>)}</div>
          </DialogContent>
        </Dialog>
        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogTrigger aria-label="Tìm kiếm khách hàng và đơn hàng" className={`flex size-11 items-center justify-center gap-2.5 rounded-xl border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 sm:w-64 sm:justify-start sm:border-white sm:bg-white sm:px-4 sm:text-slate-500 sm:shadow-[0_4px_16px_rgba(0,0,0,0.12)] sm:hover:bg-blue-50 xl:w-96 ${focusStyle}`}><Search className="size-[18px] shrink-0 sm:text-blue-600" /><span className="hidden text-xs sm:block">Tìm khách hàng, đơn hàng...</span></DialogTrigger>
          <DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-lg">
            <DialogTitle>Tìm kiếm nhanh</DialogTitle><DialogDescription>Tìm theo tên khách hàng, công ty, số điện thoại hoặc mã đơn.</DialogDescription>
            <Input autoFocus aria-label="Nhập từ khoá tìm kiếm" placeholder="Nhập từ khoá..." value={query} onChange={(event) => setQuery(event.target.value)} className="h-11" />
            {!term ? <p className="py-6 text-center text-sm text-slate-500">Nhập từ khoá để tìm trong dữ liệu CRM.</p> : <div className="space-y-4">
              {matchingLeads.length > 0 && <section><h2 className="mb-2 text-xs font-semibold text-slate-500">KHÁCH HÀNG</h2>{matchingLeads.map((lead) => <Link key={lead.id} href={`/leads?lead=${lead.id}`} onClick={() => setSearchOpen(false)} className="block rounded-lg p-3 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500"><span className="block text-sm font-medium">{lead.name}</span><span className="text-xs text-slate-500">{lead.company} • {lead.phone}</span></Link>)}</section>}
              {matchingOrders.length > 0 && <section><h2 className="mb-2 text-xs font-semibold text-slate-500">ĐƠN HÀNG</h2>{matchingOrders.map((order) => <Link key={order.id} href={`/pipeline/${order.id}`} onClick={() => setSearchOpen(false)} className="block rounded-lg p-3 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-500"><span className="block text-sm font-medium">{order.id}</span><span className="text-xs text-slate-500">{order.customer}</span></Link>)}</section>}
              {matchingLeads.length === 0 && matchingOrders.length === 0 && <p role="status" className="py-6 text-center text-sm text-slate-500">Không tìm thấy kết quả phù hợp.</p>}
            </div>}
          </DialogContent>
        </Dialog>
        <span className="hidden h-8 w-px bg-white/20 sm:block" />
        <div className="hidden xl:flex items-center gap-2 mr-2 border border-white/20 p-1.5 rounded-lg bg-white/10">
          <div className="flex flex-col text-right">
            <span className="text-xs font-semibold text-white">{currentUser?.name || "No User"}</span>
            <span className="text-[10px] text-blue-200">{currentUser?.role || ""}</span>
          </div>
          <span className="flex size-8 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white relative group cursor-pointer">
            {currentUser?.name?.charAt(0) || "U"}
            <button type="button" aria-label="Đăng xuất" title="Đăng xuất" className="absolute inset-0 rounded-full focus-visible:ring-2 focus-visible:ring-white" onClick={async () => { await logout(); setCurrentUser(null); router.push("/login"); router.refresh(); }} />
          </span>
        </div>
      </div>
    </header>
  );
}
