import { Skeleton } from "@/Components/ui/skeleton";
import { cn } from "@/lib/utils";

function KpiCard() {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

function TitleBar() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-6 w-40 sm:w-48" />
        <Skeleton className="h-3 w-56 sm:w-72" />
      </div>
      <div className="hidden gap-2 sm:flex">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

function TableBody({ rows = 6 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <TitleBar />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard />
        <KpiCard />
        <KpiCard />
        <KpiCard />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-4 w-32" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-5/6" />
            <Skeleton className="h-8 w-4/6" />
          </div>
        </div>
        <div className="h-64 rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-4 w-32" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-5/6" />
            <Skeleton className="h-8 w-4/6" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="space-y-6">
      <TitleBar />
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-full sm:w-64" />
        <Skeleton className="h-9 w-full sm:w-28" />
        <Skeleton className="h-9 w-full sm:w-28" />
        <div className="ml-auto w-full sm:w-auto">
          <Skeleton className="h-9 w-full sm:w-32" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <TableBody rows={rows} />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <TitleBar />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard />
        <KpiCard />
        <KpiCard />
        <KpiCard />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-64 rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-4 w-32" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-4/6" />
          </div>
        </div>
        <div className="h-64 rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-4 w-32" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-4/6" />
          </div>
        </div>
        <div className="h-64 rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-4 w-32" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-4/6" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SimpleSkeleton() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-6 w-48 max-w-full" />
      <Skeleton className="h-3 w-64 max-w-full" />
    </div>
  );
}

export function FullScreenSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-10 w-40 max-w-full" />
        <Skeleton className="h-4 w-56 max-w-full" />
      </div>
    </div>
  );
}

export function RouteSkeleton({ pathname = "", className }) {
  const path = pathname || "/";
  let content;
  if (path === "/dashboard") {
    content = <DashboardSkeleton />;
  } else if (/^\/(medicines|batches|sales)\/(?!catalog|categories|manufacturers)[^/]+/.test(path)) {
    content = <DetailSkeleton />;
  } else if (path === "/shortbook") {
    content = <SimpleSkeleton />;
  } else {
    content = <TableSkeleton />;
  }
  return <div className={cn(className)}>{content}</div>;
}

const SHELL_MENU_GROUPS = [6, 3, 2];

export function AppShellSkeleton({ pathname = "", className }) {
  return (
    <div className={cn("flex h-screen w-full overflow-hidden bg-background", className)}>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-11 items-center gap-2 border-b border-sidebar-border px-3">
          <Skeleton className="h-7 w-7 shrink-0 rounded-md" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex-1 space-y-5 overflow-hidden px-3 py-4">
          {SHELL_MENU_GROUPS.map((count, gi) => (
            <div key={gi} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-md" />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-sidebar-border p-2">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-3.5 w-3.5 shrink-0" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background px-4 shadow-sm sm:px-6">
          <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <RouteSkeleton pathname={pathname} />
        </main>
      </div>
    </div>
  );
}
