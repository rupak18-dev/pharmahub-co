import { Link } from "@tanstack/react-router";
import { ArrowLeft, Construction } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  title,
  icon: Icon,
  description,
}: {
  title: string;
  icon: LucideIcon;
  description?: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-10">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary/5 text-primary ring-1 ring-primary/10">
          <Icon className="h-7 w-7" />
          <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-warning/15 text-warning-foreground">
            <Construction className="h-3.5 w-3.5" />
          </span>
        </div>
        <span className="mb-2 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
          Coming soon
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {description ?? "This module is under development and will be available soon."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            to="/dashboard"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <Link
            to="/dashboard/inventory"
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:border-primary/40 hover:text-foreground"
          >
            Go to Inventory
          </Link>
        </div>
      </div>
    </div>
  );
}
