import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowRight,
  CheckCheck,
  RotateCcw,
  Search,
  ShieldAlert,
  Tag,
  ThumbsDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AUDIT_STATUS_META,
  formatCurrency,
  SEVERITY_META,
  VARIANCE_REASON_LABEL,
  VARIANCE_REASONS,
  VARIANCE_STATUS_META,
} from "@/lib/audit";
import type { Audit, VarianceItem, VarianceReason } from "@/lib/types";
import { usePermission } from "@/hooks/usePermission";

const STATUS_OPTIONS = [
  { value: "all", label: "All Differences" },
  { value: "pending", label: "Pending Review" },
  { value: "recount_requested", label: "Recount Requested" },
  { value: "recount_confirmed", label: "Recount Confirmed" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

export function VarianceReview({
  variances,
  audits,
  currency,
  has,
  onReason,
  onManagerComment,
  onAction,
  onRecount,
  onConfirmRecount,
}: {
  variances: VarianceItem[];
  audits: Audit[];
  currency: string;
  has: ReturnType<typeof usePermission>;
  onReason: (id: string, reason: VarianceReason) => void;
  onManagerComment: (id: string, comment: string) => void;
  onAction: (
    id: string,
    action: "approve" | "reject" | "recount" | "transfer" | "write_off",
    targetBranch?: string,
  ) => void;
  onRecount: (id: string) => void;
  onConfirmRecount: (id: string, newQty: number) => void;
}) {
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [recountQty, setRecountQty] = useState("");
  const [branch, setBranch] = useState("");

  const canReview = has("audit", "approve");
  const canUpdate = has("audit", "update");

  const auditByVar = useMemo(() => {
    const map = new Map<string, Audit>();
    audits.forEach((a) => map.set(a.id, a));
    return map;
  }, [audits]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return variances
      .filter((v) => status === "all" || v.status === status)
      .filter(
        (v) =>
          !query ||
          `${v.medicineName} ${v.batchNumber} ${v.verifiedByName}`.toLowerCase().includes(query),
      )
      .sort((a, b) => b.varianceValue - a.varianceValue);
  }, [variances, status, q]);

  const totalValue = useMemo(() => filtered.reduce((s, v) => s + v.varianceValue, 0), [filtered]);

  const selected = variances.find((v) => v.id === selectedId) ?? filtered[0] ?? null;

  const formatDifferenceText = (diff: number) => {
    if (diff < 0) return `▼ ${Math.abs(diff)} Units Missing`;
    if (diff > 0) return `▲ ${diff} Units Extra`;
    return `0 Units`;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar & Status Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative w-full sm:w-auto sm:min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search medicine, batch or audit..."
            className="w-full pl-9 text-sm min-h-[44px] sm:min-h-[36px]"
          />
        </div>
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 w-full sm:w-auto pb-1 sm:pb-0">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors shrink-0 min-h-[36px]",
                status === s.value
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border bg-card text-muted-foreground hover:bg-accent",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground font-medium w-full sm:w-auto text-right">
          {filtered.length} item(s) · Total Estimated Loss:{" "}
          <strong className="text-foreground font-bold">
            {formatCurrency(totalValue, currency)}
          </strong>
        </span>
      </div>

      {/* Main Content View */}
      {filtered.length === 0 ? (
        <div className="grid h-52 place-items-center rounded-xl border border-border bg-card text-center text-sm text-muted-foreground p-6 shadow-2xs">
          <div>
            <p className="font-semibold text-foreground text-base">No stock differences found</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              No items match your active search or filter selection. Counted stock matches system
              stock!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_380px] lg:grid-cols-[minmax(0,1fr)_440px]">
          {/* Left Column: Medicine Difference Cards */}
          <div className="space-y-2.5">
            {filtered.map((v) => {
              const audit = auditByVar.get(v.auditId);
              const isSelected = selected?.id === v.id;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(v.id);
                    setRecountQty("");
                    setBranch("");
                    setMobileOpen(true);
                  }}
                  className={cn(
                    "w-full rounded-xl border bg-card p-4 text-left transition-all space-y-3",
                    isSelected
                      ? "border-primary/70 bg-primary/[0.03] dark:bg-primary/[0.06] shadow-sm ring-1 ring-primary/40"
                      : "border-border/80 hover:border-border hover:bg-accent/30",
                  )}
                >
                  {/* Row 1: Heading & Combined Status + Severity Badges + Emphasized Estimated Loss */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h4 className="truncate text-base font-semibold text-foreground tracking-tight">
                        {v.medicineName}
                      </h4>
                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Batch:{" "}
                          <strong className="text-foreground/90 font-mono">{v.batchNumber}</strong>
                        </span>
                        <span className="text-muted-foreground/40">•</span>
                        <span>
                          Audit:{" "}
                          <strong className="text-foreground/90 font-mono">
                            {audit?.auditNumber ?? v.auditId}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* All Status & Severity Metadata Together Top Right + Emphasized Estimated Loss */}
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <Badge
                          className={cn(
                            "border text-[11px] font-medium px-2 py-0.5",
                            SEVERITY_META[v.severity].chip,
                          )}
                        >
                          {SEVERITY_META[v.severity].label}
                        </Badge>
                        <Badge
                          className={cn(
                            "border text-[11px] font-medium px-2 py-0.5",
                            VARIANCE_STATUS_META[v.status].chip,
                          )}
                        >
                          {VARIANCE_STATUS_META[v.status].label}
                        </Badge>
                      </div>

                      {/* Emphasized Money / Loss Impact */}
                      <div className="text-right pt-0.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Estimated Loss
                        </span>
                        <strong className="text-sm font-bold text-foreground">
                          {formatCurrency(v.varianceValue, currency)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Stock Information with Directional Difference (▼ Missing / ▲ Extra) */}
                  <div className="grid grid-cols-3 gap-3 rounded-lg bg-muted/30 p-3 text-xs border border-border/40">
                    <div>
                      <span className="text-[11px] text-muted-foreground block font-medium">
                        System Stock
                      </span>
                      <strong className="font-mono text-sm text-foreground mt-0.5 block">
                        {v.expectedQty}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block font-medium">
                        Counted Stock
                      </span>
                      <strong className="font-mono text-sm text-foreground mt-0.5 block">
                        {v.actualQty}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground block font-medium">
                        Difference
                      </span>
                      <strong
                        className={cn(
                          "font-mono text-sm font-extrabold tracking-tight block mt-0.5",
                          v.difference < 0
                            ? "text-destructive"
                            : "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {formatDifferenceText(v.difference)}
                      </strong>
                    </div>
                  </div>

                  {/* Row 3: Obvious Reason Tag */}
                  {v.reason && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
                      <Tag className="h-3 w-3 text-muted-foreground/70" />
                      <span>
                        Reason:{" "}
                        <strong className="text-foreground/90 font-medium">
                          {VARIANCE_REASON_LABEL[v.reason]}
                        </strong>
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Column: Selected Item Detail & Review Panel (Desktop) */}
          {selected && (
            <div className="hidden lg:block space-y-4 rounded-xl border border-border bg-card p-4 shadow-2xs">
              {/* Header Info with Combined Status/Severity Badges */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h3 className="truncate text-base font-semibold text-foreground">
                    {selected.medicineName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Batch:{" "}
                      <strong className="font-mono text-foreground/90">
                        {selected.batchNumber}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Branch:{" "}
                      <strong className="text-foreground/90">
                        {auditByVar.get(selected.auditId)?.branch}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>Counted by {selected.verifiedByName}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge
                    className={cn(
                      "border text-xs font-medium px-2.5 py-0.5",
                      VARIANCE_STATUS_META[selected.status].chip,
                    )}
                  >
                    {VARIANCE_STATUS_META[selected.status].label}
                  </Badge>
                  <Badge
                    className={cn(
                      "border text-[11px] font-medium px-2 py-0.5",
                      SEVERITY_META[selected.severity].chip,
                    )}
                  >
                    {SEVERITY_META[selected.severity].label}
                  </Badge>
                </div>
              </div>

              {/* 4 Summary Metric Cards with Counted Stock & Directional Difference */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 rounded-xl bg-muted/30 p-3 text-center border border-border/60">
                <div className="space-y-1 self-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    System Stock
                  </p>
                  <p className="font-mono text-base font-semibold text-foreground">
                    {selected.expectedQty}
                  </p>
                </div>

                <div className="space-y-1 self-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Counted Stock
                  </p>
                  <p className="font-mono text-base font-semibold text-foreground">
                    {selected.actualQty}
                  </p>
                </div>

                <div className="space-y-1 rounded-lg bg-background p-2 border border-border/70 shadow-2xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Difference
                  </p>
                  <p
                    className={cn(
                      "font-mono text-sm font-extrabold tracking-tight",
                      selected.difference < 0
                        ? "text-destructive"
                        : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {formatDifferenceText(selected.difference)}
                  </p>
                </div>

                <div className="space-y-1 self-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Estimated Loss
                  </p>
                  <p className="font-mono text-base font-bold text-foreground">
                    {formatCurrency(selected.varianceValue, currency)}
                  </p>
                </div>
              </div>

              {/* Unit Cost & Impact Level */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-border/70 p-2.5 text-center bg-background/50">
                  <p className="text-[11px] font-medium text-muted-foreground">Unit Cost</p>
                  <p className="font-mono text-sm font-semibold text-foreground mt-0.5">
                    {formatCurrency(selected.unitCost, currency)}
                  </p>
                </div>
                <div className="rounded-lg border border-border/70 p-2.5 text-center bg-background/50 flex flex-col items-center justify-center">
                  <p className="text-[11px] font-medium text-muted-foreground mb-1">Impact Level</p>
                  <Badge
                    className={cn(
                      "border text-xs font-medium px-2.5 py-0.5",
                      SEVERITY_META[selected.severity].chip,
                    )}
                  >
                    {SEVERITY_META[selected.severity].label}
                  </Badge>
                </div>
              </div>

              {/* Reason for Difference */}
              {canUpdate && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Reason for Difference
                  </label>
                  <Select
                    value={selected.reason ?? "unknown"}
                    onValueChange={(v) => onReason(selected.id, v as VarianceReason)}
                  >
                    <SelectTrigger className="text-xs min-h-[44px] sm:min-h-[36px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VARIANCE_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value} className="text-xs">
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Recount Prompt Box */}
              {selected.status === "recount_requested" && canUpdate && (
                <div className="space-y-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    Recount this item batch and confirm the counted stock
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <Input
                      type="number"
                      value={recountQty}
                      onChange={(e) => setRecountQty(e.target.value)}
                      placeholder="Enter counted stock"
                      className="text-xs min-h-[44px] sm:min-h-[36px]"
                    />
                    <Button
                      size="sm"
                      className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
                      onClick={() => {
                        const n = parseInt(recountQty, 10);
                        if (Number.isNaN(n) || n < 0) return;
                        onConfirmRecount(selected.id, n);
                        setRecountQty("");
                      }}
                    >
                      <CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Confirm Recount
                    </Button>
                  </div>
                </div>
              )}

              {/* Review Notes */}
              {canUpdate && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Review Notes</label>
                  <Textarea
                    rows={2}
                    value={selected.managerComment ?? ""}
                    onChange={(e) => onManagerComment(selected.id, e.target.value)}
                    placeholder="Add notes for store staff or inventory audit records…"
                    className="text-xs min-h-[60px]"
                  />
                </div>
              )}

              {/* Choose Action */}
              {canReview &&
                (selected.status === "pending" || selected.status === "recount_confirmed") && (
                  <div className="space-y-3 border-t border-border/50 pt-3.5">
                    <label className="text-xs font-semibold text-foreground block">
                      Choose Action
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-medium min-h-[44px]"
                        onClick={() => onAction(selected.id, "approve")}
                      >
                        Approve Adjustment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive border-destructive/30 text-xs font-medium min-h-[44px]"
                        onClick={() => onAction(selected.id, "reject")}
                      >
                        <ThumbsDown className="mr-1 h-3.5 w-3.5" /> Keep System Stock
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-medium min-h-[44px]"
                        onClick={() => onRecount(selected.id)}
                      >
                        <RotateCcw className="mr-1 h-3.5 w-3.5" /> Request Recount
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs font-medium min-h-[44px]"
                        onClick={() => onAction(selected.id, "transfer")}
                      >
                        Move to Branch
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-amber-600 dark:text-amber-400 border-amber-500/30 col-span-2 text-xs font-medium min-h-[44px]"
                        onClick={() => onAction(selected.id, "write_off")}
                      >
                        <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> Mark as Loss
                      </Button>
                    </div>

                    <div className="space-y-2 rounded-xl bg-muted/40 p-3 border border-border/50 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                          ✔
                        </span>
                        <div>
                          <strong className="text-foreground font-semibold">
                            Approve Adjustment
                          </strong>
                          <p className="text-[11px]">
                            Updates system stock to match the counted stock.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-destructive font-bold shrink-0">✖</span>
                        <div>
                          <strong className="text-foreground font-semibold">
                            Keep System Stock
                          </strong>
                          <p className="text-[11px]">
                            Ignore the counted value and keep current inventory.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              <p className="text-[11px] text-muted-foreground border-t border-border/40 pt-2.5">
                Recorded {format(new Date(selected.createdAt), "MMM d · HH:mm")} · Audit Status:{" "}
                <strong className="text-foreground/90">
                  {AUDIT_STATUS_META[auditByVar.get(selected.auditId)?.status ?? "completed"].label}
                </strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mobile/Tablet Slide-over Detail Sheet (<1024px) */}
      {selected && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent className="w-full max-w-full sm:max-w-xl overflow-y-auto p-4 sm:p-6 space-y-4">
            <SheetHeader className="pb-2 border-b border-border">
              <SheetTitle className="text-left text-base font-semibold">
                {selected.medicineName}
              </SheetTitle>
              <p className="text-xs text-muted-foreground text-left">
                Batch: <strong className="font-mono text-foreground">{selected.batchNumber}</strong>{" "}
                · Branch: {auditByVar.get(selected.auditId)?.branch}
              </p>
            </SheetHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/30 p-3 text-center border border-border/60">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    System Stock
                  </p>
                  <p className="font-mono text-base font-semibold">{selected.expectedQty}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Counted Stock
                  </p>
                  <p className="font-mono text-base font-semibold">{selected.actualQty}</p>
                </div>
                <div className="space-y-1 rounded-lg bg-background p-2 border border-border/70 col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Difference
                  </p>
                  <p
                    className={cn(
                      "font-mono text-sm font-extrabold",
                      selected.difference < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {formatDifferenceText(selected.difference)}
                  </p>
                </div>
              </div>

              {canUpdate && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Reason for Difference
                  </label>
                  <Select
                    value={selected.reason ?? "unknown"}
                    onValueChange={(v) => onReason(selected.id, v as VarianceReason)}
                  >
                    <SelectTrigger className="text-xs min-h-[44px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VARIANCE_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value} className="text-xs">
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {canReview &&
                (selected.status === "pending" || selected.status === "recount_confirmed") && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <label className="text-xs font-semibold text-foreground block">
                      Choose Action
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        onClick={() => {
                          onAction(selected.id, "approve");
                          setMobileOpen(false);
                        }}
                      >
                        Approve Adjustment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full min-h-[48px] text-destructive border-destructive/30"
                        onClick={() => {
                          onAction(selected.id, "reject");
                          setMobileOpen(false);
                        }}
                      >
                        <ThumbsDown className="mr-1.5 h-4 w-4" /> Keep System Stock
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full min-h-[48px]"
                        onClick={() => {
                          onRecount(selected.id);
                          setMobileOpen(false);
                        }}
                      >
                        <RotateCcw className="mr-1.5 h-4 w-4" /> Request Recount
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full min-h-[48px] text-amber-600 border-amber-500/30"
                        onClick={() => {
                          onAction(selected.id, "write_off");
                          setMobileOpen(false);
                        }}
                      >
                        <ShieldAlert className="mr-1.5 h-4 w-4" /> Mark as Loss
                      </Button>
                    </div>
                  </div>
                )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
