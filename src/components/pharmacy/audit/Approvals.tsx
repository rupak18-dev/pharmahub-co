import { useMemo, useState } from "react";
import { format, isToday } from "date-fns";
import { PackageCheck, Search, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, SEVERITY_META, VARIANCE_REASON_LABEL } from "@/lib/audit";
import type { AdjustmentStatus, Audit, StockAdjustment, VarianceItem } from "@/lib/types";
import { usePermission } from "@/hooks/usePermission";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending_supervisor", label: "Waiting for Supervisor" },
  { value: "pending_manager", label: "Waiting for Manager" },
  { value: "approved", label: "Approved" },
  { value: "applied", label: "Inventory Updated" },
  { value: "rejected", label: "Rejected" },
] as const;

export function Approvals({
  adjustments,
  audits,
  variances = [],
  currency,
  has,
  onApprove,
  onReject,
}: {
  adjustments: StockAdjustment[];
  audits: Audit[];
  variances?: VarianceItem[];
  currency: string;
  has: ReturnType<typeof usePermission>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");

  const canApprove = has("audit", "approve");

  const auditById = useMemo(() => {
    const map = new Map<string, Audit>();
    audits.forEach((a) => map.set(a.id, a));
    return map;
  }, [audits]);

  const varianceMap = useMemo(() => {
    const map = new Map<string, VarianceItem>();
    variances.forEach((v) => map.set(v.id, v));
    return map;
  }, [variances]);

  // Business-focused KPIs (Objective 1)
  const pendingApprovalsCount = useMemo(
    () =>
      adjustments.filter((a) => a.status === "pending_supervisor" || a.status === "pending_manager")
        .length,
    [adjustments],
  );

  const waitingSupervisorCount = useMemo(
    () => adjustments.filter((a) => a.status === "pending_supervisor").length,
    [adjustments],
  );

  const waitingManagerCount = useMemo(
    () => adjustments.filter((a) => a.status === "pending_manager").length,
    [adjustments],
  );

  const totalAdjustmentValue = useMemo(
    () =>
      adjustments
        .filter((a) => a.status === "pending_supervisor" || a.status === "pending_manager")
        .reduce((sum, a) => sum + Math.abs(a.quantity) * a.unitCost, 0),
    [adjustments],
  );

  const approvedTodayCount = useMemo(
    () =>
      adjustments.filter(
        (a) =>
          (a.status === "approved" || a.status === "applied") &&
          isToday(new Date(a.approvedAt ?? a.appliedAt ?? a.createdAt)),
      ).length,
    [adjustments],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return adjustments
      .filter((a) => status === "all" || a.status === status)
      .filter(
        (a) =>
          !query ||
          `${a.medicineName} ${a.batchNumber} ${a.submittedByName}`.toLowerCase().includes(query),
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [adjustments, status, q]);

  const getStatusBadge = (s: AdjustmentStatus) => {
    switch (s) {
      case "pending_supervisor":
        return {
          label: "Waiting for Supervisor",
          chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
          dot: "bg-amber-500",
        };
      case "pending_manager":
        return {
          label: "Waiting for Manager",
          chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
          dot: "bg-amber-500",
        };
      case "approved":
        return {
          label: "Approved",
          chip: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30",
          dot: "bg-teal-500",
        };
      case "applied":
        return {
          label: "Inventory Updated",
          chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          dot: "bg-emerald-500",
        };
      case "rejected":
        return {
          label: "Rejected",
          chip: "bg-destructive/10 text-destructive border-destructive/30",
          dot: "bg-destructive",
        };
      default:
        return {
          label: s,
          chip: "bg-muted text-muted-foreground border-border",
          dot: "bg-muted-foreground",
        };
    }
  };

  const formatDiffText = (diff: number) => {
    if (diff < 0) return `▼ ${Math.abs(diff)} Units Missing`;
    if (diff > 0) return `▲ ${diff} Units Extra`;
    return `0 Units`;
  };

  return (
    <div className="space-y-4">
      {/* 1. Business-Focused KPI Cards */}
      <div className="flex overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 gap-3 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:gap-3 no-scrollbar">
        <div className="w-[80vw] max-w-[260px] shrink-0 snap-start sm:w-auto rounded-xl border border-border bg-card p-4 shadow-2xs">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Pending Approvals
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-foreground">
            {pendingApprovalsCount}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Requests waiting for action</p>
        </div>

        <div className="w-[80vw] max-w-[260px] shrink-0 snap-start sm:w-auto rounded-xl border border-border bg-card p-4 shadow-2xs">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Waiting for Supervisor
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {waitingSupervisorCount}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Stage 1 sign-off</p>
        </div>

        <div className="w-[80vw] max-w-[260px] shrink-0 snap-start sm:w-auto rounded-xl border border-border bg-card p-4 shadow-2xs">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Waiting for Manager
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {waitingManagerCount}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Stage 2 sign-off</p>
        </div>

        <div className="w-[80vw] max-w-[260px] shrink-0 snap-start sm:w-auto rounded-xl border border-border bg-card p-4 shadow-2xs">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Adjustment Value
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-foreground">
            {formatCurrency(totalAdjustmentValue, currency)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Awaiting approval</p>
        </div>

        <div className="w-[80vw] max-w-[260px] shrink-0 snap-start sm:w-auto rounded-xl border border-border bg-card p-4 shadow-2xs">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Approved Today
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {approvedTodayCount}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Completed today</p>
        </div>
      </div>

      {/* Toolbar Search & Status Filter */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-auto sm:min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search medicine, audit or batch..."
            className="w-full pl-9 text-sm min-h-[44px] sm:min-h-[36px]"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-56 text-sm min-h-[44px] sm:min-h-[36px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs font-medium text-muted-foreground w-full sm:w-auto text-right">
          Showing <strong className="text-foreground">{filtered.length}</strong> adjustment
          request(s)
        </span>
      </div>

      {/* Approval Cards */}
      {filtered.length === 0 ? (
        <div className="grid h-48 place-items-center rounded-xl border border-border bg-card text-center text-sm text-muted-foreground p-6 shadow-2xs">
          <div>
            <p className="font-semibold text-foreground text-base">No adjustment requests found</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              No approval requests match your search or filter selection.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((a) => {
            const audit = auditById.get(a.auditId);
            const variance = varianceMap.get(a.varianceId);
            const statusBadge = getStatusBadge(a.status);
            const adjustmentVal = Math.round(Math.abs(a.quantity) * a.unitCost);

            return (
              <div
                key={a.id}
                className="rounded-xl border border-border bg-card p-4.5 space-y-6 shadow-2xs hover:border-border/80 transition-all"
              >
                {/* 2. Top Row & Second Row Metadata */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    {/* Top Row: Medicine Name, Status Badge, Priority Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold text-foreground tracking-tight">
                        {a.medicineName}
                      </h4>
                      <Badge
                        className={cn(
                          "border text-xs font-medium px-2.5 py-0.5 inline-flex items-center gap-1.5",
                          statusBadge.chip,
                        )}
                      >
                        <span
                          className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusBadge.dot)}
                        />
                        {statusBadge.label}
                      </Badge>
                      <Badge
                        className={cn(
                          "border text-[11px] font-medium px-2 py-0.5",
                          SEVERITY_META[a.severity].chip,
                        )}
                      >
                        {SEVERITY_META[a.severity].label}
                      </Badge>
                    </div>

                    {/* Second Row: Clear Metadata Line */}
                    <p className="text-xs text-muted-foreground">
                      Batch:{" "}
                      <strong className="font-mono text-foreground/90">{a.batchNumber}</strong> •
                      Audit:{" "}
                      <strong className="font-mono text-foreground/90">
                        {audit?.auditNumber ?? a.auditId}
                      </strong>{" "}
                      • <strong className="text-foreground/90">{audit?.branch ?? "HQ"}</strong> •
                      Submitted by{" "}
                      <strong className="text-foreground/90">{a.submittedByName}</strong> •{" "}
                      {format(new Date(a.createdAt), "d MMM, h:mm a")}
                    </p>
                  </div>

                  {/* 4 & 11. Right Side Summary (Utilizing Unused Card Space) */}
                  <div className="shrink-0 text-right space-y-0.5 bg-muted/30 p-2.5 rounded-lg border border-border/50 min-w-[170px]">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Estimated Adjustment Value
                    </span>
                    <p className="text-lg font-bold text-foreground tabular-nums">
                      {formatCurrency(adjustmentVal, currency)}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                      <span>Diff:</span>
                      <strong
                        className={cn(
                          "font-mono font-semibold",
                          a.quantity < 0
                            ? "text-destructive"
                            : "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {formatDiffText(a.quantity)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 3. Show WHY Approval is Needed (5-Metric Difference Grid) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 rounded-lg bg-muted/30 p-3 text-xs border border-border/40">
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      System Stock
                    </span>
                    <strong className="font-mono text-sm text-foreground mt-0.5 block">
                      {variance?.expectedQty ?? (a.quantity < 0 ? Math.abs(a.quantity) : 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Counted Stock
                    </span>
                    <strong className="font-mono text-sm text-foreground mt-0.5 block">
                      {variance?.actualQty ?? (a.quantity < 0 ? 0 : a.quantity)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Difference
                    </span>
                    <strong
                      className={cn(
                        "font-mono text-sm font-bold tracking-tight block mt-0.5",
                        a.quantity < 0
                          ? "text-destructive"
                          : "text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {formatDiffText(a.quantity)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Estimated Loss
                    </span>
                    <strong className="font-mono text-sm text-foreground mt-0.5 block">
                      {formatCurrency(adjustmentVal, currency)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Reason
                    </span>
                    <span className="inline-block rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-semibold text-foreground/90 mt-0.5 border border-border/40">
                      {VARIANCE_REASON_LABEL[a.reason]}
                    </span>
                  </div>
                </div>

                {/* 7. Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 border-t border-border/40 pt-3">
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    {(a.status === "pending_supervisor" || a.status === "pending_manager") && (
                      <>
                        <Button
                          size="sm"
                          className="w-full sm:w-auto min-h-[48px] sm:min-h-[36px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => onApprove(a.id)}
                        >
                          <ShieldCheck className="mr-1.5 h-4 w-4" /> Approve Request
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto min-h-[48px] sm:min-h-[36px] text-destructive border-destructive/30 hover:text-destructive font-medium"
                          onClick={() => onReject(a.id)}
                        >
                          <X className="mr-1.5 h-3.5 w-3.5" /> Reject
                        </Button>
                      </>
                    )}

                    {a.status === "approved" && (
                      <Button
                        size="sm"
                        className="w-full sm:w-auto min-h-[48px] sm:min-h-[36px] font-medium"
                        onClick={() => onApprove(a.id)}
                      >
                        <PackageCheck className="mr-1.5 h-4 w-4" /> Apply to Inventory
                      </Button>
                    )}

                    {!canApprove && a.status !== "applied" && a.status !== "rejected" && (
                      <span className="text-xs text-muted-foreground font-medium">
                        Approval permission required to sign off.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
