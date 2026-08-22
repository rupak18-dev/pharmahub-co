import { Outlet, useLocation, useNavigate } from "react-router";
import { useEffect, Suspense, useMemo } from "react";
import { SidebarProvider, SidebarTrigger } from "@/Components/ui/sidebar";
import { AppSidebar } from "@/Components/shared/AppSidebar";
import { AppShellSkeleton, RouteSkeleton } from "@/Components/shared/PageSkeleton";
import { useAuth } from "@/lib/auth";
import { useDb } from "@/hooks/useDb";
import { buildNotifications } from "@/lib/expiry";
import { prefetch } from "@/lib/api";
import { Bell } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";

const ROUTE_PERMISSIONS = {
  "/dashboard": ["dashboard", "view"],
  "/medicines": ["medicines", "view"],
  "/batches": ["batches", "view"],
  "/expiry": ["expiry", "view"],
  "/audit": ["audit", "view"],
  "/purchases": ["purchases", "view"],
  "/sales": ["sales", "view"],
  "/shortbook": ["shortbook", "view"],
  "/reports": ["reports", "view"],
  "/users": ["users", "view"],
  "/ai": ["ai", "view"],
  "/notifications": ["notifications", "view"],
  "/integrations": ["integrations", "view"],
  "/profile": ["admin", "view"],
};

export default function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const batches = useDb((d) => d.batches);
  const medicines = useDb((d) => d.medicines);
  const suppliers = useDb((d) => d.suppliers);
  const readIds = useDb((d) => d.notificationsRead);
  const now = useMemo(() => Date.now(), []);
  const unread = useMemo(() => {
    const supById = new Map(suppliers.map((s) => [s.id, s.name]));
    const supplierName = (id) => (id ? (supById.get(id) ?? "Unknown") : "—");
    const notifications = buildNotifications(batches, medicines, supplierName, now);
    return notifications.filter((n) => !readIds.includes(n.id)).length;
  }, [batches, medicines, suppliers, readIds, now]);
  useEffect(() => {
    // The document (window) is the scroll container for the app content, so
    // route changes reset the window scroll. The content wrappers below must
    // NOT create their own scroll containers (overflow-y-auto / overflow-hidden)
    // — a scroll-container ancestor traps position:sticky and breaks sticky
    // sidebars such as the Profile page's Profile box.
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login");
    else if (!user.onboarded) navigate("/onboarding");
  }, [user, loading, navigate]);
  const prefetchedRef = useRef(false);
  useEffect(() => {
    if (loading || !user || prefetchedRef.current) return;
    prefetchedRef.current = true;
    prefetch(["/batches", "/medicines", "/suppliers"]);
  }, [loading, user]);
  if (loading) {
    return <AppShellSkeleton pathname={pathname} />;
  }
  if (!user) return null;
  return (
    <SidebarProvider>
      <div className="flex flex-1 h-full w-full bg-background [overflow-x:clip]">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
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
                    {unread > 0 ? "9+" : unread}
                  </Badge>
                )}
              </Button>
            </div>
          </header>
          <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8">
            <Suspense fallback={<RouteSkeleton pathname={pathname} />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
