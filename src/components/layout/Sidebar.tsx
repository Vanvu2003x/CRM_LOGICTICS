"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserContext } from "@/components/auth/UserContext";
import { useState } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { useDemoData } from "@/components/demo/DemoDataProvider";
import { isActiveRoute, navigation, sections, navigationForPath } from "./navigation";
import type { ThemeId } from "./themes";

export function Sidebar({ onNavigate, collapsed = false, theme = "navy" }: { onNavigate?: () => void; collapsed?: boolean; theme?: ThemeId }) {
  const pathname = usePathname();
 const {currentUser}=useUserContext();
  const {reminders,dataRequests}=useDemoData();
  const followUpCount=reminders.filter(r=>r.kind==="FOLLOW_UP").length;
  const openDataCount=dataRequests.filter(r=>r.status==="OPEN").length;
  const counts:Record<string,number>={"/leads":followUpCount+openDataCount,"/campaigns":reminders.filter(r=>r.kind==="CAMPAIGN").length,"/trade-fairs":reminders.filter(r=>r.kind==="TRADE_FAIR").length,"/social-kpi":reminders.filter(r=>r.kind==="SOCIAL_KPI").length};
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const current = navigationForPath(pathname);
  return (
    <div className="relative h-full min-h-0 shrink-0">
    <aside data-theme={theme} id={onNavigate ? undefined : "desktop-sidebar"} className={`crm-sidebar flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-slate-700 bg-slate-950 text-slate-300 transition-[width] duration-200 motion-reduce:transition-none ${collapsed ? "lg:w-20" : "lg:w-64"}`}>
      <div className={`flex h-20 shrink-0 items-center gap-1 border-b border-slate-700 bg-slate-900/60 ${collapsed ? "justify-center px-2" : "px-4"}`}>
        <Link href="/dashboard" aria-label="Logistics CRM - Tổng quan" title={collapsed ? "Logistics CRM" : undefined} onClick={onNavigate} className="flex min-w-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
          <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-400/40 bg-blue-600 shadow-lg shadow-blue-900/30"><img src="/logo-mark.svg" alt="" className="size-full" /></span>
          {!collapsed && <span><span className="block whitespace-nowrap text-xl font-semibold tracking-tight text-white">Logistics CRM</span><span className="text-xs tracking-[0.08em] text-blue-100">KẾT NỐI HÀNH TRÌNH</span></span>}
        </Link>
      </div>
      <nav aria-label="Điều hướng chính" className="crm-sidebar-scroll min-h-44 flex-1 overflow-y-auto px-2 pt-3">
        {sections.map((section, index) => <div key={section.id} className={`mb-4 ${index ? "border-t border-slate-800 pt-4" : ""}`}>
          {!collapsed && <p className="mb-2 px-2 text-xs font-semibold tracking-[0.1em] text-blue-100">{section.name}</p>}
          <div className="space-y-1">{navigation.filter((item) => item.section === section.id && (item.href!=="/settings" || currentUser?.role==="ADMIN")).map((item) => {
            const Icon = item.icon;
            const active = item.children ? item.children.some((child) => isActiveRoute(pathname, child.href)) : isActiveRoute(pathname, item.href);
            const open = expanded[item.href] ?? active;
            const style = `group flex w-full min-h-11 items-center gap-2 rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-200 ${collapsed ? "justify-center px-2" : "px-2.5"} ${active ? "bg-blue-600 text-white shadow-sm" : "text-blue-50 hover:bg-white/10 hover:text-white"}`;
            if (item.children) return <div key={item.href}>
              <button type="button" aria-label={item.name} title={collapsed ? item.name : undefined} aria-expanded={open} aria-controls={`${onNavigate ? "mobile" : "desktop"}-${item.section}-submenu`} onClick={() => setExpanded((state) => ({ ...state, [item.href]: !open }))} className={style}>
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {!collapsed && <><span className="flex-1 text-left">{item.name}</span><ChevronRight className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`} aria-hidden="true" /></>}
              </button>
              {open && <div id={`${onNavigate ? "mobile" : "desktop"}-${item.section}-submenu`} className={collapsed ? "mt-1 space-y-1" : "ml-4 mt-1 space-y-1 border-l border-slate-700 pl-2"}>
                {item.children.map((child) => <Link key={child.href} href={child.href} onClick={onNavigate} aria-label={child.name} title={collapsed ? child.name : undefined} aria-current={current?.href === child.href ? "page" : undefined} className={`flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-200 ${collapsed ? "justify-center" : ""} ${current?.href === child.href ? "bg-blue-600 text-white" : "text-blue-50 hover:bg-white/10 hover:text-white"}`}>
                  <child.icon className="size-3.5 shrink-0" aria-hidden="true" />{!collapsed && child.name}
                </Link>)}
              </div>}
            </div>;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-label={item.name}
                title={item.href==="/leads"&&counts[item.href]>0?`${followUpCount} khách cần chăm sóc, ${openDataCount} yêu cầu cấp data`:collapsed?item.name:undefined}
                aria-current={active ? "page" : undefined}
                className={style}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {!collapsed && <span className="flex-1">{item.name}</span>}
                {!collapsed && (counts[item.href] > 0 ? <span aria-label={item.href==="/leads"?`${counts[item.href]} cần xử lý`:undefined} className={`rounded-md px-1.5 py-0.5 text-[9px] tabular-nums ${active ? "bg-white/15 text-white" : "bg-slate-800 text-slate-300"}`}>{item.href==="/leads"?`${counts[item.href]} cần xử lý`:counts[item.href]}</span> : active && <ChevronRight className="size-3.5" aria-hidden="true" />)}
              </Link>
            );
          })}</div>
        </div>)}
      </nav>
      {!collapsed && <div className="m-3 hidden shrink-0 rounded-xl border border-slate-800 bg-slate-900 p-3 [@media(min-height:820px)]:block">
        <div className="mb-2 flex items-center gap-2"><span className="size-1.5 rounded-full bg-blue-400" /><span className="text-xs font-medium text-blue-200">Không gian demo</span></div>
        <p className="mb-3 text-xs leading-5 text-slate-400">Theo dõi khách hàng và tiến độ đơn hàng trong một nơi.</p>
        <Link href="/reports" onClick={onNavigate} className="flex items-center justify-between rounded-md text-xs font-medium text-white outline-none hover:text-blue-300 focus-visible:ring-2 focus-visible:ring-blue-400">Xem báo cáo<ArrowUpRight className="size-4" aria-hidden="true" /></Link>
      </div>}
      <Link href="/settings/account" aria-label="Tài khoản của bạn" title={collapsed ? currentUser?.name : undefined} onClick={onNavigate} className={`flex min-h-14 shrink-0 items-center gap-2 border-t border-slate-800 outline-none hover:bg-slate-900 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 ${collapsed ? "justify-center px-2" : "px-4"}`}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-[11px] font-semibold text-white">{currentUser?.name?.charAt(0)||"S"}</span>
        {!collapsed && <><span className="flex-1"><span className="block text-xs font-medium text-white">{currentUser?.name}</span><span className="text-[10px] text-slate-400">{currentUser?.email}</span></span><ChevronRight className="size-3 text-slate-500" aria-hidden="true" /></>}
      </Link>
    </aside>
    </div>
  );
}
