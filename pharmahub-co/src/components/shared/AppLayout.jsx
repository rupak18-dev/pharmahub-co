import { Outlet, useLocation, useNavigate } from "react-router";
import { useEffect, useRef, Suspense, useMemo } from "react";
import { ShieldAlert } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/Components/ui/sidebar";
import { AppSidebar } from "@/Components/shared/AppSidebar";
import { AppShellSkeleton, RouteSkeleton } from "@/Components/shared/PageSkeleton";
import { useAuth } from "@/lib/auth";
import { useDb } from "@/hooks/useDb";
import { usePermission } from "@/hooks/usePermission";
import { buildNotifications } from "@/lib/expiry";
import { Bell } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";

// Map each authenticated route to the module permission that gates it. Direct
// URL access to a restricted module is blocked here in addition to the sidebar
// hiding the entry point — the backend independently rejects the APIs.
const ROUTE_MODULES = [
  { prefix: "/dashboard", module: "dashboard" },
  { prefix: "/medicines", module: "medicines" },
  { prefix: "/batches", module: "batches" },
  { prefix: "/sales", module: "sales" },
  { prefix: "/purchases", module: "purchases" },
  { prefix: "/shortbook", module: "shortbook" },
  { prefix: "/inventory", module: "inventory" },
  { prefix: "/expiry", module: "expiry" },
  { prefix: "/audit", module: "audit" },
  { prefix: "/reports", module: "reports" },
  { prefix: "/users", module: "users" },
  { prefix: "/ai", module: "ai" },
  { prefix: "/admin", module: "admin" },
  { prefix: "/integrations", module: "integrations" },
];

// Personal / infrastructure pages every signed-in user can reach.
const ALWAYS_ALLOWED = ["/profile", "/notifications"];

function moduleForPath(pathname) {
  if (ALWAYS_ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  const match = ROUTE_MODULES.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );
  return match?.module ?? null;
}

function AccessDenied() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-foreground">Access Denied</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        You don't have permission to view this page. If you believe this is a mistake, contact your
        workspace owner.
      </p>
    </div>
  );
}
export default function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const scrollRef = useRef(null);
  const has = usePermission();
  const batches = useDb((d) => d.batches);
  const medicines = useDb((d) => d.medicines);
  const suppliers = useDb((d) => d.suppliers);
  const readIds = useDb((d) => d.notificationsRead);
  const now = useMemo(() => Date.now(), []);
  const routeModule = moduleForPath(pathname);
  const accessDenied = Boolean(routeModule && !has(routeModule, "view"));
  const unread = useMemo(() => {
    const supById = new Map(suppliers.map((s) => [s.id, s.name]));
    const supplierName = (id) => (id ? (supById.get(id) ?? "Unknown") : "—");
    const notifications = buildNotifications(batches, medicines, supplierName, now);
    return notifications.filter((n) => !readIds.includes(n.id)).length;
  }, [batches, medicines, suppliers, readIds, now]);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, [pathname]);
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);
  if (loading) {
    return <AppShellSkeleton pathname={pathname} />;
  }
  if (!user) return null;
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <div className="flex h-svh w-full bg-background overflow-hidden">
        <AppSidebar />
        <div
          ref={scrollRef}
          className="flex min-w-0 flex-1 flex-col h-svh overflow-y-auto overflow-x-hidden"
        >
          <header className="sticky top-0 z-30 shrink-0 flex h-16 items-center gap-4 border-b border-border bg-background px-4 sm:px-6 shadow-sm">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full h-9 w-9 text-muted-foreground hover:bg-muted/50"
                onClick={() => navigate("/notifications")}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 hover:bg-red-600 border-2 border-background">
                    {unread > 9 ? "9+" : unread}
                  </Badge>
                )}
              </Button>
            </div>
          </header>
          <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8">
            {accessDenied ? (
              <AccessDenied />
            ) : (
              <Suspense fallback={<RouteSkeleton pathname={pathname} />}>
                <Outlet />
              </Suspense>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
