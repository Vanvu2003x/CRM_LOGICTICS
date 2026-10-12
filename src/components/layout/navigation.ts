import { 
  LayoutDashboard, 
  UsersRound, 
  SquareKanban, 
  Building2, 
  Wallet, 
  ChartNoAxesCombined, 
  Settings2, 
  Package,
  Clock,
  Megaphone,
  Tent,
  ThumbsUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavigationItem = { 
  name: string; 
  href: string; 
  icon: LucideIcon; 
  section?: string; 
  badge?: string;
  children?: NavigationItem[];
};

export const sections = [
  { id: "sales", name: "KINH DOANH & ĐƠN HÀNG" }, 
  { id: "tasks", name: "ĐẦU MỤC CÔNG VIỆC" },
  { id: "operations", name: "VẬN HÀNH & THANH TOÁN" }, 
  { id: "system", name: "BÁO CÁO & HỆ THỐNG" }
];

export const navigation: NavigationItem[] = [
  // 1. Nhóm Kinh Doanh & Đơn Hàng (Core Sales Pipeline)
  { 
    name: "Tổng quan", 
    href: "/dashboard", 
    icon: LayoutDashboard, 
    section: "sales" 
  },
  { 
    name: "Khách hàng", 
    href: "/leads", 
    icon: UsersRound, 
    section: "sales" 
  },

  { 
    name: "Đơn hàng", 
    href: "/orders", 
    icon: Package, 
    section: "sales", children:[{name:"Quy trình đơn hàng",href:"/pipeline",icon:SquareKanban},{name:"Danh sách đơn",href:"/orders",icon:Package}] 
  },

  // 2. Nhóm Đầu Mục Công Việc
  { 
    name: "Chấm Công", 
    href: "/attendance", 
    icon: Clock, 
    section: "tasks" 
  },
  { 
    name: "Chiến dịch truyền thông", 
    href: "/campaigns", 
    icon: Megaphone, 
    section: "tasks" 
  },
  { 
    name: "Hội chợ", 
    href: "/trade-fairs", 
    icon: Tent, 
    section: "tasks" 
  },
  { 
    name: "KPI MXH", 
    href: "/social-kpi", 
    icon: ThumbsUp, 
    section: "tasks" 
  },

  // 3. Nhóm Vận Hành & Thanh Toán
  { 
    name: "Đại lý & Đối tác", 
    href: "/agents", 
    icon: Building2, 
    section: "operations" 
  },
  { 
    name: "Công nợ & Thanh toán", 
    href: "/payments", 
    icon: Wallet, 
    section: "operations" 
  },

  // 3. Nhóm Báo Cáo & Cấu Hình ITY
  { 
    name: "Báo cáo", 
    href: "/reports", 
    icon: ChartNoAxesCombined, 
    section: "system" 
  },
  { 
    name: "Quản trị hệ thống", 
    href: "/settings", 
    icon: Settings2, 
    section: "system",
  },
];

export function isActiveRoute(pathname: string, href: string) { 
  if (href === "/orders" && pathname.startsWith("/pipeline")) return false;
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)); 
}

export function navigationForPath(pathname: string) {
  return navigation.flatMap(item=>item.children || [item]).sort((a,b)=>b.href.length-a.href.length).find((item) => isActiveRoute(pathname, item.href));
}
