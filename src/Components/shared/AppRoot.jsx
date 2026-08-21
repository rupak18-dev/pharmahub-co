import { Suspense, useEffect } from "react";
import { Outlet, isRouteErrorResponse, useMatches, useRouteError } from "react-router";
import { Toaster } from "@/Components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { FullScreenSkeleton } from "@/Components/shared/PageSkeleton";

const DEFAULT_TITLE = "PharmaHub — Modern Pharmacy Management System";

function resolveTitle(matches) {
  for (let i = matches.length - 1; i >= 0; i--) {
    const handle = matches[i]?.handle;
    if (handle?.title) return handle.title;
  }
  return DEFAULT_TITLE;
}

export function AppRoot() {
  const matches = useMatches();
  useEffect(() => {
    document.title = resolveTitle(matches);
  }, [matches]);
  return (
    <AuthProvider>
      <Suspense fallback={<FullScreenSkeleton />}>
        <Outlet />
      </Suspense>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

export function AppRootErrorBoundary(props) {
  const routeError = useRouteError();
  const error = props?.error || routeError;
  console.error("AppRootErrorBoundary caught error:", error);
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-7xl font-bold text-foreground">404</h1>
          <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. If your saved data is from an older version, use "Reset app data"
          below.
        </p>
        {error ? (
          <pre className="mt-4 max-h-48 overflow-auto rounded-md border border-border bg-muted p-3 text-left font-mono text-[11px] text-destructive leading-relaxed whitespace-pre-wrap break-all">
            {String(error?.stack || error?.message || error)}
          </pre>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <button
            onClick={() => {
              try {
                // Auth is cookie-based now; clear legacy localStorage sessions
                // and any older version of the local mock database so a refresh
                // starts clean.
                localStorage.removeItem("PharmaHub_db_v2");
                localStorage.removeItem("PharmaHub_db_v3");
                localStorage.removeItem("PharmaHub_db_v4");
                localStorage.removeItem("PharmaHub_session_v1");
                localStorage.removeItem("PharmaHub_session_v2");
                localStorage.clear();
              } catch {
                // ignore
              }
              window.location.href = "/sales";
            }}
            className="inline-flex items-center justify-center rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
          >
            Reset app data
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
