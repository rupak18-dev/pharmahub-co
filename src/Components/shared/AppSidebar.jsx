import { Link, useLocation } from "react-router";
import { useEffect } from "react";
import {
  TbLayoutDashboard,
  TbPill,
  TbShoppingBag,
  TbReceipt2,
  TbAlertTriangle,
  TbClipboardCheck,
  TbUsers,
  TbChartBar,
  TbSettings,
  TbStack2,
  TbListDetails,
  TbPlugConnected,
} from "react-icons/tb";
import { ChevronRight } from "lucide-react";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/Components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/Components/ui/collapsible";
import { BrandMark } from "./BrandMark";
import { SidebarProfile } from "./SidebarProfile";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
const groups = [
  {
    label: "Home",
    items: [
      { key: "dashboard", title: "Dashboard", url: "/dashboard", icon: TbLayoutDashboard },
      { key: "medicines", title: "Medicines", url: "/medicines", icon: TbPill },
    ],
  },
  {
    label: "Stock Management",
    items: [
      { key: "batches", title: "Batches", url: "/batches", icon: TbStack2 },
      { key: "expiry", title: "Expiry", url: "/expiry", icon: TbAlertTriangle },
      { key: "audit", title: "Stock Monitor", url: "/audit", icon: TbClipboardCheck },
    ],
  },
  {
    label: "Purchase & Trades",
    items: [
      { key: "purchases", title: "Orders", url: "/purchases", icon: TbShoppingBag },
      { key: "sales", title: "Sales & POS", url: "/sales", icon: TbReceipt2 },
      { key: "shortbook", title: "Shortbook", url: "/shortbook", icon: TbListDetails },
    ],
  },
  {
    label: "Analytics",
    items: [{ key: "reports", title: "Reports", url: "/reports", icon: TbChartBar }],
  },
  {
    label: "Access Management",
    items: [
      { key: "users", title: "Users & Roles", url: "/users", icon: TbUsers },
      {
        key: "admin",
        title: "Profile",
        url: "/admin",
        icon: TbSettings,
        children: [
          {
            key: "integrations",
            title: "Integrations",
            url: "/integrations",
            icon: TbPlugConnected,
          },
        ],
      },
    ],
  },
];
export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const has = usePermission();
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);
  const isActive = (url) =>
    url === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(url);
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 border-b border-sidebar-border p-0 justify-center overflow-hidden">
        <div className="relative flex h-full w-full items-center">
          {/* Expanded logo — fades out when collapsed */}
          <div
            className={cn(
              "absolute inset-0 flex items-center px-4 transition-opacity duration-200",
              collapsed ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
          >
            <Link to="/" className="flex items-center">
              <img
                src="/PharmaHub__logo_cropped.webp"
                alt="PharmaHub Logo"
                className="h-6 w-auto object-contain mix-blend-multiply"
              />
            </Link>
          </div>
          {/* Collapsed icon — fades in when collapsed */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
              collapsed ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <Link to="/" title="PharmaHub Home">
              <img
                src="/favicon.webp"
                alt="PharmaHub Icon"
                className="h-12 w-12 object-contain drop-shadow-sm"
              />
            </Link>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => {
          const visible = group.items.filter((i) => has(i.key, "view"));
          if (!visible.length) return null;
          return (
            <SidebarGroup key={group.label} className="px-2 py-1">
              <SidebarGroupLabel className="h-5 px-2 text-[11px] font-medium tracking-wide text-sidebar-foreground/60 group-data-[collapsible=icon]:h-8">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visible.map((item) => {
                    if (item.children?.length) {
                      const visibleChildren = item.children.filter((c) => has(c.key, "view"));
                      if (!visibleChildren.length) return null;
                      return (
                        <SidebarMenuItem key={item.key}>
                          <Collapsible className="group/collapsible">
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                asChild
                                size="sm"
                                isActive={isActive(item.url)}
                                tooltip={item.title}
                                className={
                                  isActive(item.url)
                                    ? "data-[active=true]:bg-emerald-600 data-[active=true]:text-white data-[active=true]:hover:bg-emerald-700 data-[active=true]:hover:text-white active:bg-emerald-800 active:text-white transition-all duration-200"
                                    : "hover:bg-emerald-600/10 hover:text-emerald-700 active:bg-emerald-600/15 active:text-emerald-800 transition-all duration-200"
                                }
                              >
                                <Link to={item.url}>
                                  <item.icon className="!size-3.5" />
                                  <span className="flex-1 truncate text-[13px]">{item.title}</span>
                                  <ChevronRight className="ml-auto !size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                </Link>
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {visibleChildren.map((child) => {
                                  return (
                                    <SidebarMenuSubItem key={child.key}>
                                      <SidebarMenuSubButton
                                        asChild
                                        size="sm"
                                        isActive={isActive(child.url)}
                                        className={
                                          isActive(child.url)
                                            ? "data-[active=true]:bg-emerald-600 data-[active=true]:text-white data-[active=true]:hover:bg-emerald-700 data-[active=true]:hover:text-white active:bg-emerald-800 active:text-white transition-all duration-200"
                                            : "hover:bg-emerald-600/10 hover:text-emerald-700 active:bg-emerald-600/15 active:text-emerald-800 transition-all duration-200"
                                        }
                                      >
                                        <Link to={child.url}>
                                          <child.icon className="!size-3.5" />
                                          <span className="flex-1 truncate text-[13px]">
                                            {child.title}
                                          </span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                        </SidebarMenuItem>
                      );
                    }
                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          asChild
                          size="sm"
                          isActive={isActive(item.url)}
                          tooltip={item.title}
                          className={
                            isActive(item.url)
                              ? "data-[active=true]:bg-emerald-600 data-[active=true]:text-white data-[active=true]:hover:bg-emerald-700 data-[active=true]:hover:text-white active:bg-emerald-800 active:text-white transition-all duration-200"
                              : "hover:bg-emerald-600/10 hover:text-emerald-700 active:bg-emerald-600/15 active:text-emerald-800 transition-all duration-200"
                          }
                        >
                          <Link to={item.url} prefetch="viewport">
                            <item.icon className="!size-3.5" />
                            <span className="flex-1 truncate text-[13px]">{item.title}</span>
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

      <SidebarFooter className="relative z-10 flex flex-col border-t border-sidebar-border bg-sidebar p-2 gap-2">
        <SidebarProfile />
      </SidebarFooter>
    </Sidebar>
  );
}
