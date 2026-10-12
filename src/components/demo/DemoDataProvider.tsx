"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import type { DemoAgent, DemoLead, DemoOrder } from "@/lib/demo-crm";
import type { PublicUser } from "@/lib/auth";
export type DemoActivity = { id: string; at: string; text: string; href: string };
export type CrmCall = { id: string; startedAt: string; phone: string; salesId: string; billsec: number; duration: number; status: string; recordingUrl?: string | null; orderCode?: string | null; leadId?: string | null };
export type LeadDataRequest={id:string;userId:string;userName:string;status:string;note:string|null;requestedAt:string;resolvedAt:string|null};
export type LeadImportBatch={id:string;filename:string;source:string;totalRows:number;importedRows:number;duplicateRows:number;createdById:string;createdAt:string};
type Data = { activities: DemoActivity[]; leads: DemoLead[]; orders: DemoOrder[]; agents: DemoAgent[]; calls: CrmCall[]; users: PublicUser[];reminders:{id:string;kind:string;title:string;href:string;dueAt:string}[];dataRequests:LeadDataRequest[];importBatches:LeadImportBatch[];leadPoolCount:number };
type Context = Data & {
 loading: boolean; refresh: () => Promise<void>;
 mutate: (action: string, id?: string, data?: object) => Promise<Record<string, unknown>>;
 addLead: (data: Omit<DemoLead,"id"|"lastCall">) => Promise<void>;
 updateLead: (id: string, data: Partial<DemoLead>) => Promise<void>;
 createOrderFromLead: (id: string) => Promise<void>;
 moveOrder: (id: string, step: number) => Promise<void>;
 addAgent: (data: Omit<DemoAgent,"id"|"status">) => Promise<void>;
 updateAgent: (id: string, data: Partial<DemoAgent>) => Promise<void>;
 resetDemo: () => void;
};
const empty: Data = { activities: [], leads: [], orders: [], agents: [], calls: [], users: [],reminders:[],dataRequests:[],importBatches:[],leadPoolCount:0 };
const CrmContext = createContext<Context | null>(null);
export function DemoDataProvider({ children }: { children: React.ReactNode }) {
 const [data,setData] = useState<Data>(empty);
 const [loading,setLoading] = useState(true);
 const [notice,setNotice] = useState("");
 const pathname = usePathname();
 const refresh = useCallback(async () => {
  const response = await fetch("/api/crm", { cache: "no-store" });
  if (response.ok) setData(await response.json());
  setLoading(false);
 }, []);
 useEffect(() => {
  if(pathname==="/login")return;
  const timer = setTimeout(() => { void refresh(); }, 0);
  return () => clearTimeout(timer);
 }, [pathname,refresh]);
 useEffect(() => {
  if(pathname==="/login")return;
  const timer=setInterval(()=>{if(document.visibilityState==="visible")void refresh();},60000);
  return()=>clearInterval(timer);
 },[pathname,refresh]);
 useEffect(()=>{const listener=(event:Event)=>setNotice((event as CustomEvent<string>).detail);window.addEventListener("crm-toast",listener);return()=>window.removeEventListener("crm-toast",listener);},[]);
 const mutate = async (action: string,id?: string,values?: object) => {
  try {
   const response = await fetch("/api/crm", { method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,id,data:values}) });
   const result = await response.json();
   if (!response.ok) { setNotice(result.error || "Không lưu được dữ liệu"); return { error: result.error }; }
   await refresh(); setNotice("Đã lưu thay đổi");
   return result;
  } catch { setNotice("Mất kết nối. Thay đổi chưa được lưu."); return { error:"Mất kết nối" }; }
 };
 return <CrmContext.Provider value={{...data,loading,refresh,mutate,
  addLead:async values=>{ await mutate("lead.create",undefined,values); },
  updateLead:async(id,values)=>{ await mutate("lead.update",id,values); },
  createOrderFromLead:async id=>{ await mutate("order.create",id); },
  moveOrder:async(id,step)=>{ await mutate("order.move",id,{step}); },
  addAgent:async values=>{ await mutate("agent.create",undefined,values); },
  updateAgent:async(id,values)=>{ await mutate("agent.update",id,values); },
  resetDemo:()=>setNotice("Dữ liệu được lưu trên máy chủ. Không xóa dữ liệu bằng nút reset.")
 }}>{children}{notice && <div role="status" className="fixed bottom-5 right-5 z-[100] max-w-sm rounded-xl border bg-slate-900 px-4 py-3 text-sm text-white shadow-xl flex gap-4">{notice}<button aria-label="Đóng thông báo" onClick={()=>setNotice("")}>×</button></div>}</CrmContext.Provider>;
}
export function useDemoData() {
 const context = useContext(CrmContext);
 if (!context) throw new Error("Thiếu CrmProvider");
 return context;
}
