import { Link } from "@tanstack/react-router";
import { Boxes, MapPin } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { MatrixItem, MatrixQuadrant } from "@/lib/inventory";
import { InventoryCard } from "./InventoryCard";
import { medIcon } from "./medIcon";

type DirectoryFilter = "all" | "urgent" | "healthy" | "reorder";

const FILTERS: {
  key: DirectoryFilter;
  label: string;
  dot?: string;
  match: (q: MatrixQuadrant) => boolean;
}[] = [
  { key: "all", label: "All Items", match: () => true },
  { key: "urgent", label: "Urgent Clearance", dot: "bg-quad-urgent", match: (q) => q === "urgent" },
  { key: "healthy", label: "Healthy", dot: "bg-quad-optimal", match: (q) => q === "optimal" },
  {
    key: "reorder",
    label: "Reorder Risk",
    dot: "bg-quad-reorder",
    match: (q) => q === "reorder" || q === "stable",
  },
];

const ACTIONS: Record<MatrixQuadrant, { label: string; href?: string; cls: string }> = {
  urgent: {
    label: "Discount / Return",
    cls: "border-quad-urgent/50 text-quad-urgent hover:bg-quad-urgent/10",
  },
  reorder: {
    label: "Create PO",
    href: "/dashboard/purchases",
    cls: "border-quad-reorder/50 text-quad-reorder hover:bg-quad-reorder/10",
  },
  optimal: {
    label: "Healthy",
    cls: "border-quad-optimal/50 text-quad-optimal hover:bg-quad-optimal/10",
  },
  stable: {
    label: "Create PO",
    href: "/dashboard/purchases",
    cls: "border-quad-reorder/50 text-quad-reorder hover:bg-quad-reorder/10",
  },
};

const RANK: Record<MatrixQuadrant, number> = { urgent: 0, reorder: 1, optimal: 2, stable: 3 };

function sortItems(filter: DirectoryFilter, items: MatrixItem[]): MatrixItem[] {
  const sorted = [...items];
  if (filter === "reorder") return sorted.sort((a, b) => a.stock - b.stock);
  return sorted.sort((a, b) => {
    if (filter === "all" && a.quadrant !== b.quadrant) return RANK[a.quadrant] - RANK[b.quadrant];
    const short = a.quadrant === "urgent" || a.quadrant === "reorder";
    return short ? (a.days ?? Infinity) - (b.days ?? Infinity) : b.stock - a.stock;
  });
}

function fefoBadge(days: number | null): { label: string; cls: string } {
  if (days === null) return { label: "No stock", cls: "bg-muted text-muted-foreground" };
  if (days <= 0) return { label: "Expired", cls: "bg-quad-urgent-bg text-quad-urgent" };
  if (days < 30)
    return { label: `${Math.round(days)} Days`, cls: "bg-quad-urgent-bg text-quad-urgent" };
  if (days <= 90)
    return { label: `${Math.round(days)} Days`, cls: "bg-quad-reorder-bg text-quad-reorder" };
  return {
    label: `${Math.round(days / 30.4)} Months`,
    cls: "bg-quad-optimal-bg text-quad-optimal",
  };
}

function stockLevel(stock: number, threshold: number): { label: string; cls: string } | null {
  if (stock <= 0) return { label: "Out", cls: "bg-quad-urgent-bg text-quad-urgent" };
  if (stock <= threshold)
    return { label: "Low Stock", cls: "bg-quad-reorder-bg text-quad-reorder" };
  return null;
}

export function StockDirectory({ items, className }: { items: MatrixItem[]; className?: string }) {
  const [filter, setFilter] = useState<DirectoryFilter>("all");

  const counts = FILTERS.map((f) => ({
    key: f.key,
    count: items.filter((x) => f.match(x.quadrant)).length,
  }));
  const countOf = (key: DirectoryFilter) => counts.find((c) => c.key === key)?.count ?? 0;

  const rows = sortItems(
    filter,
    items.filter((x) => FILTERS.find((f) => f.key === filter)!.match(x.quadrant)),
  );

  return (
    <InventoryCard
      className={className}
      title="Core Stock Directory"
      icon={Boxes}
      action={
        <Link
          to="/dashboard/medicines"
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          View all →
        </Link>
      }
      bodyClassName="flex flex-col p-3"
    >
      <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                active
                  ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {f.dot && <span className={cn("h-1.5 w-1.5 rounded-full", f.dot)} />}
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] tabular-nums",
                  active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {countOf(f.key)}
              </span>
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">No items in this view</div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 md:hidden">
            {rows.map((x) => {
              const unit = x.medicine.unitLabel ?? "units";
              const threshold = x.medicine.reorderThreshold;
              const Icon = medIcon(x.medicine);
              const badge = fefoBadge(x.days);
              const level = stockLevel(x.stock, threshold);
              const action = ACTIONS[x.quadrant];
              const pill = (
                <span
                  className={cn(
                    "inline-flex shrink-0 whitespace-nowrap rounded-full border bg-card px-1.5 py-0.5 text-[9px] font-semibold transition-colors",
                    action.cls,
                  )}
                >
                  {action.label}
                </span>
              );
              return (
                <div
                  key={x.medicine.id}
                  className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-card text-muted-foreground ring-1 ring-border/70">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {x.medicine.brandName ?? x.medicine.name}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {x.medicine.genericName ?? x.medicine.name}
                        </p>
                      </div>
                    </div>
                    {action.href ? <Link to={action.href}>{pill}</Link> : pill}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                      <span className="truncate font-mono">{x.rack}</span>
                    </span>
                    {level && (
                      <span
                        title={`Reorder at ${threshold.toLocaleString("en-IN")} ${unit}`}
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[9px] font-semibold",
                          level.cls,
                        )}
                      >
                        {level.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="whitespace-nowrap font-mono text-xs font-semibold tabular-nums text-foreground">
                      {x.stock.toLocaleString("en-IN")}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        {" "}
                        / {x.capacity.toLocaleString("en-IN")} {unit}
                      </span>
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        badge.cls,
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden md:block">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-8 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide">
                    Product
                  </TableHead>
                  <TableHead className="h-8 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide">
                    Location
                  </TableHead>
                  <TableHead className="h-8 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide">
                    Stock
                  </TableHead>
                  <TableHead className="h-8 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide">
                    Expiry
                  </TableHead>
                  <TableHead className="h-8 w-28 px-2 py-1 text-right text-[11px] font-semibold uppercase tracking-wide">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((x) => {
                  const unit = x.medicine.unitLabel ?? "units";
                  const threshold = x.medicine.reorderThreshold;
                  const Icon = medIcon(x.medicine);
                  const badge = fefoBadge(x.days);
                  const level = stockLevel(x.stock, threshold);
                  const action = ACTIONS[x.quadrant];
                  const pill = (
                    <span
                      className={cn(
                        "inline-flex shrink-0 whitespace-nowrap rounded-full border bg-card px-1.5 py-0.5 text-[9px] font-semibold transition-colors",
                        action.cls,
                      )}
                    >
                      {action.label}
                    </span>
                  );
                  return (
                    <TableRow key={x.medicine.id}>
                      <TableCell className="px-2 py-1.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-card text-muted-foreground ring-1 ring-border/70">
                            <Icon className="h-3 w-3" />
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-32 truncate text-xs font-semibold text-foreground">
                              {x.medicine.brandName ?? x.medicine.name}
                            </p>
                            <p className="max-w-32 truncate text-[10px] text-muted-foreground">
                              {x.medicine.genericName ?? x.medicine.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                          <span className="truncate font-mono">{x.rack}</span>
                        </span>
                      </TableCell>
                      <TableCell className="min-w-28 px-2 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <p className="whitespace-nowrap font-mono text-xs font-semibold tabular-nums text-foreground">
                            {x.stock.toLocaleString("en-IN")}
                          </p>
                          <p className="whitespace-nowrap text-[10px] text-muted-foreground">
                            / {x.capacity.toLocaleString("en-IN")} {unit}
                          </p>
                          {level && (
                            <span
                              title={`Reorder at ${threshold.toLocaleString("en-IN")} ${unit}`}
                              className={cn(
                                "ml-auto inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[9px] font-semibold",
                                level.cls,
                              )}
                            >
                              {level.label}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-2 py-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                            badge.cls,
                          )}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                          {badge.label}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right">
                        {action.href ? <Link to={action.href}>{pill}</Link> : pill}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </InventoryCard>
  );
}
