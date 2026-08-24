import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileBarChart2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;

function SortIcon({ active, dir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
  return dir === "asc" ? (
    <ArrowUp className="h-3 w-3 text-primary" />
  ) : (
    <ArrowDown className="h-3 w-3 text-primary" />
  );
}

export default function ReportPreviewTable({
  columns = [],
  rows = [],
  totals = {},
  currency = "₹",
  moduleTitle = "Report",
  periodLabel = "",
  loading = false,
  error = null,
  onRefresh,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sortKey || !Array.isArray(rows)) return rows || [];
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
    });
  }, [rows, sortKey, sortDir]);

  const totalRecords = sorted?.length || 0;
  const pageCount = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageRows = (sorted || []).slice(start, start + PAGE_SIZE);
  const end = Math.min(start + PAGE_SIZE, totalRecords);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const fmt = (col, value) => {
    if (value === undefined || value === null || value === "") return "—";
    if (col.date) {
      try {
        const d = new Date(value);
        if (!isNaN(d.getTime()))
          return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
      } catch {
        return String(value);
      }
    }
    if (col.money)
      return `${currency}${Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    if (typeof value === "number") return Number(value).toLocaleString("en-IN");
    return String(value);
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Generating report…</p>
          <p className="text-xs text-muted-foreground">
            Querying your pharmacy data. This may take a moment.
          </p>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Unable to generate report</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            {error.message ||
              "An unexpected error occurred. Please check your configuration and try again."}
          </p>
        </div>
        {onRefresh && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 mt-1"
            onClick={onRefresh}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  /* ── Empty state ── */
  if (!rows || rows.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
        <div className="h-14 w-14 rounded-full bg-muted/60 flex items-center justify-center">
          <FileBarChart2 className="h-7 w-7 text-muted-foreground/30" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">No data found</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            There are no records matching the selected filters and date range. Adjust your
            configuration and run the report again.
          </p>
        </div>
        {onRefresh && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 mt-1"
            onClick={onRefresh}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  const hasTotals = totals && Object.keys(totals).length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Table header bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-2.5 shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{moduleTitle}</p>
          {periodLabel && (
            <p className="text-[11px] text-muted-foreground font-mono">{periodLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
            {totalRecords.toLocaleString("en-IN")} record{totalRecords !== 1 ? "s" : ""}
          </span>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Refresh report"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable table */}
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-xs min-w-[540px] border-separate border-spacing-0">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={col.key}
                  className={cn(
                    "sticky top-0 z-10 border-b border-border bg-muted/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                    col.money ? "text-right" : "text-left",
                    i === 0 && "rounded-tl-none",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className={cn(
                      "inline-flex items-center gap-1 hover:text-foreground transition-colors",
                      col.money && "ml-auto",
                    )}
                  >
                    {col.label}
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, ri) => (
              <tr
                key={ri}
                className={cn(
                  "transition-colors hover:bg-muted/20",
                  ri % 2 === 0 ? "bg-card" : "bg-muted/5",
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "border-b border-border/50 px-4 py-2.5",
                      col.money
                        ? "text-right font-mono tabular-nums text-foreground"
                        : "text-foreground",
                    )}
                  >
                    {fmt(col, row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {hasTotals && (
            <tfoot>
              <tr className="border-t-2 border-primary/15 bg-primary/5">
                {columns.map((col, ci) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-2.5 text-xs font-semibold text-foreground",
                      col.money ? "text-right font-mono tabular-nums" : "text-muted-foreground",
                    )}
                  >
                    {col.money ? fmt(col, totals[col.key] ?? 0) : ci === 0 ? "Total" : ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-border bg-muted/20 px-4 py-2.5 shrink-0">
          <p className="text-[11px] text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {(start + 1).toLocaleString("en-IN")}–{end.toLocaleString("en-IN")}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {totalRecords.toLocaleString("en-IN")}
            </span>{" "}
            records
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 text-[11px] font-medium text-muted-foreground tabular-nums">
              {safePage} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
