import { Link, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Pill,
  Boxes,
  ShoppingBag,
  Receipt,
  AlertTriangle,
  ClipboardCheck,
  Users,
  BarChart3,
  Bell,
  Sparkles,
  Settings,
  ChevronRight,
  Layers,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/Components/ui/sidebar";
import { BrandMark } from "./BrandMark";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import { PROFILE_SECTIONS } from "@/lib/profileSections";
const groups = [
  {
    label: "Operations",
    items: [
      { key: "dashboard", title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { key: "medicines", title: "Medicines", url: "/medicines", icon: Pill },
      { key: "batches", title: "Batches", url: "/batches", icon: Layers },
      { key: "inventory", title: "Inventory", url: "/inventory", icon: Boxes },
    ],
  },
  {
    label: "Commerce",
    items: [
      { key: "purchases", title: "Purchases", url: "/purchases", icon: ShoppingBag },
      { key: "sales", title: "Sales & POS", url: "/sales", icon: Receipt },
    ],
  },
  {
    label: "Compliance",
    items: [
      {
        key: "expiry",
        title: "Expiry Alert Center",
        url: "/expiry",
        icon: AlertTriangle,
      },
      { key: "audit", title: "Stock Audit", url: "/audit", icon: ClipboardCheck },
      { key: "reports", title: "Reports", url: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [
      { key: "users", title: "Users & Roles", url: "/users", icon: Users },
      { key: "notifications", title: "Notifications", url: "/notifications", icon: Bell },
      { key: "ai", title: "AI Insights", url: "/ai", icon: Sparkles },
    ],
  },
];
export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const has = usePermission();
  const isActive = (url) =>
    url === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(url);

  const profileEnabled = has("admin", "view");
  const onProfilePage =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/integrations") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/organizations") ||
    pathname.startsWith("/security") ||
    pathname.startsWith("/admin");

  const goToProfileUrl = (url) => {
    navigate(url);
    setOpenMobile(false);
  };

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
                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.url)}
                          tooltip={item.title}
                          className={
                            isActive(item.url)
                              ? "bg-[#007A87] text-white hover:bg-[#007A87] hover:text-white! [&_svg]:text-white"
                              : "hover:bg-[#007A87]/10 hover:text-[#007A87] [&_svg]:hover:text-[#007A87]"
                          }
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

                  {group.label === "System" && profileEnabled && (
                    <ProfileSidebarItem
                      collapsed={collapsed}
                      onProfilePage={onProfilePage}
                      currentPath={pathname}
                      onNavigate={goToProfileUrl}
                    />
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* Decorative foliage outline illustration at the bottom-left corner */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 w-full h-32 overflow-hidden pointer-events-none opacity-25 z-0 select-none">
          <svg
            className="absolute bottom-0 left-0 w-36 h-36 text-emerald-600/30"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path d="M-10,110 C20,90 30,50 40,20" />
            <path d="M40,20 C42,18 45,15 48,15 C45,22 41,25 40,20" fill="currentColor" />
            <path d="M10,80 C15,70 25,72 20,83 C15,83 12,82 10,80" fill="currentColor" />
            <path d="M22,65 C25,52 35,55 30,68 C25,68 23,67 22,65" fill="currentColor" />
            <path d="M30,45 C35,32 45,35 40,48 C35,48 32,47 30,45" fill="currentColor" />
            <path d="M15,77 Q5,65 -5,68" />
            <path d="M26,60 Q18,48 10,50" />
          </svg>
        </div>
      )}
    </Sidebar>
  );
}

function ProfileSidebarItem({ collapsed, onProfilePage, currentPath, onNavigate }) {
  const { hash } = useLocation();
  const [hoverCapable] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  const [clickOpen, setClickOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const open = hoverCapable ? hovered : clickOpen;

  const handleProfileClick = () => {
    if (collapsed) {
      onNavigate("/profile");
      return;
    }
    if (hoverCapable) {
      onNavigate("/profile");
      return;
    }
    setClickOpen((prev) => !prev);
  };

  return (
    <SidebarMenuItem onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <SidebarMenuButton
        onClick={handleProfileClick}
        isActive={onProfilePage}
        tooltip="Profile"
        className={
          onProfilePage
            ? "bg-[#007A87] text-white hover:bg-[#007A87] hover:text-white! [&_svg]:text-white"
            : "hover:bg-[#007A87]/10 hover:text-[#007A87] [&_svg]:hover:text-[#007A87]"
        }
      >
        <Settings className="h-4 w-4" />
        <span className="flex-1 truncate">Profile</span>
      </SidebarMenuButton>
      <SidebarMenuAction
        onClick={handleProfileClick}
        aria-label={open ? "Collapse Profile menu" : "Expand Profile menu"}
      >
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
      </SidebarMenuAction>
      {open && (
        <SidebarMenuSub>
          {PROFILE_SECTIONS.map(({ id, label, icon: Icon, path }) => {
            const targetPath = path || `/integrations`;
            const isCurrent = currentPath === targetPath || currentPath.startsWith(targetPath);
            return (
              <SidebarMenuSubItem key={id}>
                <SidebarMenuSubButton
                  isActive={isCurrent}
                  onClick={() => onNavigate(targetPath)}
                  className={
                    isCurrent ? "bg-[#007A87]/10 text-[#007A87] [&_svg]:text-[#007A87]" : undefined
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}
