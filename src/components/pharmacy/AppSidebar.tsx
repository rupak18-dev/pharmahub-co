import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  LayoutGrid,
  Pill,
  Boxes,
  Warehouse,
  ShoppingBag,
  Receipt,
  AlertTriangle,
  ClipboardCheck,
  Users,
  BarChart3,
  Bell,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  Compass,
  FileText,
  Image as ImageIcon,
  Globe,
  Layers,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandMark } from "./BrandMark";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/lib/auth";
import type { ModuleKey } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  key: ModuleKey;
  title: string;
  url: string;
  icon: LucideIcon;
  phase?: number;
};

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Operations",
    items: [
      { key: "dashboard", title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { key: "medicines", title: "Medicines", url: "/dashboard/medicines/catalog", icon: Pill },
      { key: "batches", title: "Batches", url: "/dashboard/batches", icon: Layers },
      { key: "inventory", title: "Inventory", url: "/dashboard/inventory", icon: Boxes },
    ],
  },
  {
    label: "Commerce",
    items: [
      { key: "purchases", title: "Purchases", url: "/dashboard/purchases", icon: ShoppingBag },
      { key: "sales", title: "Sales & POS", url: "/dashboard/sales", icon: Receipt },
    ],
  },
  {
    label: "Compliance",
    items: [
      {
        key: "expiry",
        title: "Expiry Alert Center",
        url: "/dashboard/expiry",
        icon: AlertTriangle,
      },
      { key: "audit", title: "Stock Audit", url: "/dashboard/audit", icon: ClipboardCheck },
      { key: "reports", title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { key: "users", title: "Users & Roles", url: "/dashboard/users", icon: Users },
      { key: "notifications", title: "Notifications", url: "/dashboard/notifications", icon: Bell },
      { key: "ai", title: "AI Insights", url: "/dashboard/ai", icon: Sparkles },
      { key: "admin", title: "System Admin", url: "/dashboard/admin", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const has = usePermission();
  const { user } = useAuth();
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "U";
  const [medsOpen, setMedsOpen] = useState(true);

  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(url);

  const subItems = [
    { title: "Medicine Search", url: "/dashboard/medicines/catalog", search: "?focusSearch=true", icon: Search },
    { title: "Master Catalog", url: "/dashboard/medicines/catalog", search: "", icon: Pill },
    { title: "Add New Medicine", url: "/dashboard/medicines/catalog", search: "?addNew=true", icon: Plus },
    { title: "Medicine Categories", url: "/dashboard/medicines/categories", search: "", icon: Layers },
    { title: "Generic Medicines", url: "/dashboard/medicines/catalog", search: "?filter=generic", icon: Compass },
    { title: "Branded Medicines", url: "/dashboard/medicines/catalog", search: "?filter=branded", icon: Compass },
    { title: "OTC & FMCG", url: "/dashboard/medicines/catalog", search: "?filter=otc", icon: Compass },
    { title: "Alternative Medicines", url: "/dashboard/medicines/catalog", search: "?tab=alternatives", icon: Sparkles },
    { title: "Salt / Composition Search", url: "/dashboard/medicines/catalog", search: "?tab=salt", icon: Search },
    { title: "Drug Information", url: "/dashboard/medicines/catalog", search: "?tab=info", icon: FileText },
    { title: "Medicine Images", url: "/dashboard/medicines/catalog", search: "?tab=images", icon: ImageIcon },
    { title: "API Content Info", url: "/dashboard/medicines/catalog", search: "?tab=api", icon: Globe },
    { title: "Medicine Availability APIs", url: "/dashboard/medicines/catalog", search: "?tab=api", icon: Globe },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-12 items-center px-2">
          {collapsed ? <BrandMark showText={false} size="sm" /> : <BrandMark size="sm" />}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => {
          const visible = group.items.filter((i) => has(i.key, "view"));
          if (!visible.length) return null;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visible.map((item) => {
                    const isMeds = item.key === "medicines";
                    
                    if (isMeds && !collapsed) {
                      return (
                        <SidebarMenuItem key={item.key}>
                          <button
                            onClick={() => setMedsOpen(!medsOpen)}
                            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                              isActive(item.url) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"
                            }`}
                          >
                            <item.icon className="h-4 w-4 shrink-0 text-primary" />
                            <span className="flex-1 text-left truncate">{item.title}</span>
                            {medsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          
                          {medsOpen && (
                            <ul className="mt-1 ml-4 pl-2 border-l border-sidebar-border space-y-1">
                              {subItems.map((sub, idx) => (
                                <li key={idx}>
                                  <Link
                                    to={sub.url}
                                    search={() => {
                                      if (sub.search.startsWith("?")) {
                                        const params = new URLSearchParams(sub.search);
                                        return Object.fromEntries(params.entries());
                                      }
                                      return {};
                                    }}
                                    className={`block rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                                      pathname === sub.url ? "font-semibold text-primary" : "text-muted-foreground"
                                    }`}
                                  >
                                    {sub.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.url)}
                          tooltip={item.title}
                        >
                          <Link to={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span className="flex-1 truncate">{item.title}</span>
                            {item.phase && !collapsed && (
                              <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                P{item.phase}
                              </span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          <div className="relative shrink-0">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#22C55E] ring-2 ring-background" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.name ?? "User"}
              </div>
              <div className="truncate text-xs text-sidebar-foreground/60">{user?.role ?? ""}</div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
