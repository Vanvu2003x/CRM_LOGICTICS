"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useCRMTheme } from "./themes";

import { usePathname } from "next/navigation";
import { WebphoneWidget } from "@/components/ity/WebphoneWidget";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useCRMTheme();
  const pathname = usePathname();

  if (pathname === "/login") {
    return (
      <div data-theme={theme} className="crm-shell flex h-dvh w-full overflow-auto bg-slate-50">
        {children}
      </div>
    );
  }

  return (
    <div data-theme={theme} className="crm-shell flex h-dvh w-full overflow-hidden bg-slate-50">
      <div className="hidden h-full shrink-0 lg:block">
        <Sidebar collapsed={collapsed} theme={theme} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header collapsed={collapsed} onToggleSidebar={() => setCollapsed((value) => !value)} theme={theme} onThemeChange={setTheme} />
        <main id="main-content" tabIndex={-1} className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 outline-none sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
      <WebphoneWidget />
    </div>
  );
}
