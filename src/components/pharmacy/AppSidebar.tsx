import { Link, useRouterState } from "@tanstack/react-router";
import {
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
      { key: "dashboard", title: "Dashboard", url: "/dashboard", icon: LayoutGrid },
      { key: "medicines", title: "Medicines", url: "/dashboard/medicines", icon: Pill },
      { key: "batches", title: "Batches", url: "/dashboard/batches", icon: Boxes },
      { key: "inventory", title: "Inventory", url: "/dashboard/inventory", icon: Warehouse },
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

  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(url);

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
                  {visible.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" strokeWidth={1.5} />
                          <span className="flex-1 truncate">{item.title}</span>
                          {item.phase && !collapsed && (
                            <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              P{item.phase}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
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
