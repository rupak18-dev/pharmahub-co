import { Suspense, useEffect } from "react";
import { Outlet, isRouteErrorResponse, useMatches } from "react-router";
import { Toaster } from "@/Components/ui/sonner";
import { AuthProvider } from "@/lib/auth";

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
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

export function AppRootErrorBoundary({ error }) {
  console.error(error);
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
        {error instanceof Error && error.message ? (
          <pre className="mt-4 max-h-40 overflow-auto rounded-md border border-border bg-muted p-3 text-left font-mono text-xs text-destructive">
            {error.message}
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
                localStorage.removeItem("PharmaHub_db_v2");
                localStorage.removeItem("PharmaHub_session_v1");
              } catch {
                // ignore
              }
              window.location.href = "/login";
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
