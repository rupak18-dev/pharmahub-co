import { useMemo } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  PackageX,
  Play,
  Send,
  ShieldCheck,
  Activity,
  MapPin,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/pharmacy/KpiCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  accuracyFor,
  auditMetrics,
  auditProgress,
  AUDIT_STATUS_META,
  AUDIT_TYPE_LABEL,
  bucketAudit,
  formatCurrency,
  SEVERITY_META,
  VARIANCE_STATUS_META,
} from "@/lib/audit";
import type { Audit, AuditCount, VarianceItem } from "@/lib/types";

export function AuditOverview({
  audits,
  counts,
  variances,
  currency,
  onNewAudit,
  onOpenCalendar,
  onOpenApprovals,
}: {
  audits: Audit[];
  counts: AuditCount[];
  variances: VarianceItem[];
  currency: string;
  onNewAudit: () => void;
  onOpenCalendar: () => void;
  onOpenApprovals: () => void;
}) {
  const metrics = useMemo(
    () => auditMetrics(audits, counts, variances),
    [audits, counts, variances],
  );
  const today = new Date();

  const completedAudits = useMemo(() => audits.filter((a) => a.status === "completed"), [audits]);
  const activeAudits = useMemo(
    () => audits.filter((a) => a.status === "in_progress" || a.status === "paused"),
    [audits],
  );

  const openVariances = useMemo(
    () => variances.filter((v) => v.status === "pending" || v.status === "recount_requested"),
    [variances],
  );
  const openValue = useMemo(
    () => openVariances.reduce((s, v) => s + v.varianceValue, 0),
    [openVariances],
  );

  const scheduled = useMemo(
    () =>
      audits
        .filter((a) => a.status === "scheduled")
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()),
    [audits],
  );
  const nextAudit = scheduled[0];
  const todayAudits = audits.filter((a) => bucketAudit(a, today) === "today");
  const overdueAudits = audits.filter((a) => bucketAudit(a, today) === "overdue");
  const activeOngoing = activeAudits[0];

  const recentCompleted = useMemo(
    () =>
      audits
        .filter((a) => a.status === "completed")
        .sort(
          (a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime(),
        )
        .slice(0, 5),
    [audits],
  );

  const attention: { label: string; tone: string; onClick: () => void }[] = [];
  if (overdueAudits.length > 0)
    attention.push({
      label: `${overdueAudits.length} Audits Overdue · Reschedule`,
      tone: "text-destructive",
      onClick: onOpenCalendar,
    });
  if (metrics.pendingAudits > 0)
    attention.push({
      label: `${metrics.pendingAudits} Audits Needing Review · Review Now`,
      tone: "text-warning-foreground",
      onClick: onOpenApprovals,
    });
  if (openVariances.length > 0)
    attention.push({
      label: `${openVariances.length} Stock Differences (${formatCurrency(openValue, currency)}) · Resolve`,
      tone: "text-critical",
      onClick: onOpenApprovals,
    });
  if (todayAudits.length > 0)
    attention.push({
      label: `${todayAudits.length} Audits Scheduled Today · Start Audit`,
      tone: "text-info",
      onClick: onOpenCalendar,
    });

  return (
    <div className="space-y-6">
      {/* 1. Operational KPI Cards */}
      <div className="flex overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 gap-3 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:gap-4 no-scrollbar">
        <div className="w-[82vw] max-w-[280px] shrink-0 snap-start sm:w-auto">
          <KpiCard
            label="Stock Differences"
            value={openVariances.length}
            hint="Items with count vs. system differences"
            icon={PackageX}
            tone={openVariances.length > 0 ? "warning" : "success"}
            onClick={onOpenApprovals}
          />
        </div>
        <div className="w-[82vw] max-w-[280px] shrink-0 snap-start sm:w-auto">
          <KpiCard
            label="Inventory Accuracy"
            value={`${metrics.accuracy}%`}
            hint={`${counts.filter((c) => c.physicalQty != null).length} items physically checked`}
            icon={ShieldCheck}
            tone={
              metrics.accuracy >= 90 ? "success" : metrics.accuracy >= 75 ? "warning" : "danger"
            }
          />
        </div>
        <div className="w-[82vw] max-w-[280px] shrink-0 snap-start sm:w-auto">
          <KpiCard
            label="Stock Difference Value"
            value={formatCurrency(openValue, currency)}
            hint="Total value of unreviewed stock differences"
            icon={AlertTriangle}
            tone={openValue >= 2000 ? "danger" : openValue > 0 ? "warning" : "success"}
            onClick={onOpenApprovals}
          />
        </div>
        <div className="w-[82vw] max-w-[280px] shrink-0 snap-start sm:w-auto">
          <KpiCard
            label="Audits Needing Review"
            value={`${metrics.pendingAudits}`}
            hint="Awaiting manager review"
            icon={Send}
            tone="info"
            onClick={onOpenApprovals}
          />
        </div>
        <div className="w-[82vw] max-w-[280px] shrink-0 snap-start sm:w-auto">
          <KpiCard
            label="Active Audits"
            value={activeAudits.length}
            hint={`${activeAudits.length} in progress · ${todayAudits.length} scheduled today`}
            icon={Activity}
            tone={activeAudits.length > 0 ? "info" : "default"}
            onClick={onOpenCalendar}
          />
        </div>
      </div>

      {/* 2. Action-Oriented Alert Chips */}
      {attention.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
            Action Required:
          </span>
          {attention.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-accent",
                a.tone,
              )}
            >
              {a.label}
              <ArrowRight className="h-3 w-3 opacity-50 transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
          <span className="ml-auto text-[11px] text-muted-foreground hidden sm:inline">
            Click item to review
          </span>
        </div>
      )}

      {/* 3 & 4. Next Scheduled Audit & Ongoing Audit */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Next Scheduled Audit */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Next Scheduled Audit</h3>
            <Badge variant="outline" className="text-[11px]">
              Upcoming
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Next audit on your store schedule</p>
          {nextAudit ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-semibold text-sm">{nextAudit.title}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Branch:{" "}
                      <strong className="text-foreground">{nextAudit.branch}</strong>
                    </span>
                    {nextAudit.shelf && (
                      <span className="inline-flex items-center gap-1">
                        <Tag className="h-3 w-3" /> Location:{" "}
                        <strong className="text-foreground">Shelf {nextAudit.shelf}</strong>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Scheduled:{" "}
                    <strong>{format(new Date(nextAudit.scheduledDate), "EEE, d MMM yyyy")}</strong>{" "}
                    · Type: {AUDIT_TYPE_LABEL[nextAudit.type]}
                  </p>
                </div>
                <Badge className={cn("border shrink-0", AUDIT_STATUS_META[nextAudit.status].chip)}>
                  {AUDIT_STATUS_META[nextAudit.status].label}
                </Badge>
              </div>
              <div className="flex items-center justify-between border-t border-border/50 pt-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Scope:{" "}
                  <span className="text-foreground font-semibold">
                    {nextAudit.batchIds.length} batches to count
                  </span>
                </span>
                <Button size="sm" onClick={onOpenCalendar}>
                  <CalendarClock className="mr-1 h-3.5 w-3.5" /> View Schedule
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid h-24 place-items-center text-sm text-muted-foreground">
              No upcoming audits scheduled
            </div>
          )}
        </div>

        {/* Ongoing Audit */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">In-Progress Audit</h3>
            {activeOngoing && (
              <Badge className={cn("border", AUDIT_STATUS_META[activeOngoing.status].chip)}>
                {AUDIT_STATUS_META[activeOngoing.status].label}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Active stock count session</p>
          {activeOngoing ? (
            <div className="mt-3 space-y-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-sm">{activeOngoing.title}</p>
                <p className="text-xs text-muted-foreground">
                  Ref: {activeOngoing.auditNumber} · Branch: <strong>{activeOngoing.branch}</strong>
                </p>
              </div>
              {(() => {
                const p = auditProgress(activeOngoing, counts);
                const remaining = p.total - p.verified;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Progress ({p.pct}%)</span>
                      <span className="text-muted-foreground">
                        Checked: <strong>{p.verified}</strong> of {p.total} items (
                        <strong>{remaining} remaining</strong>)
                      </span>
                    </div>
                    <Progress value={p.pct} />
                    <div className="flex items-center justify-end border-t border-border/50 pt-2">
                      <Button size="sm" onClick={() => onOpenCalendar()}>
                        <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> Continue Count
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="mt-3 grid h-24 place-items-center text-sm text-muted-foreground">
              No audit currently in progress
            </div>
          )}
        </div>
      </div>

      {/* 5 & 6. Stock Differences & Completed Audits */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Stock Differences to Review */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Stock Differences to Review</h3>
              <p className="text-xs text-muted-foreground">
                Counted items that differ from system stock
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={onOpenApprovals}>
              Review All ({openVariances.length})
            </Button>
          </div>
          {openVariances.length === 0 ? (
            <div className="grid h-40 place-items-center text-sm text-muted-foreground">
              No stock differences requiring review 🎉
            </div>
          ) : (
            <div className="space-y-3">
              {openVariances.slice(0, 4).map((v) => (
                <div
                  key={v.id}
                  className="rounded-lg border border-border/60 p-2.5 text-sm bg-background/50 hover:bg-background transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{v.medicineName}</p>
                      <p className="text-xs text-muted-foreground">
                        Batch: {v.batchNumber} · Status:{" "}
                        <span className="font-medium text-foreground">
                          {VARIANCE_STATUS_META[v.status].label}
                        </span>
                      </p>
                    </div>
                    <Badge className={cn("border shrink-0", SEVERITY_META[v.severity].chip)}>
                      {SEVERITY_META[v.severity].label} ·{" "}
                      {formatCurrency(v.varianceValue, currency)}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 rounded bg-muted/40 p-1.5 text-xs text-center">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">System Stock</span>
                      <strong className="text-foreground">{v.expectedQty}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Actual Count</span>
                      <strong className="text-foreground">{v.actualQty}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Difference</span>
                      <strong
                        className={
                          v.difference < 0 ? "text-destructive" : "text-warning-foreground"
                        }
                      >
                        {v.difference > 0 ? "+" : ""}
                        {v.difference} units
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 6: Completed Audits */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Completed Audits</h3>
              <p className="text-xs text-muted-foreground">
                Recent finished counts and updated stock
              </p>
            </div>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          {recentCompleted.length === 0 ? (
            <div className="grid h-40 place-items-center text-sm text-muted-foreground">
              No completed audits yet
            </div>
          ) : (
            <div className="space-y-3">
              {recentCompleted.map((a) => {
                const acc = accuracyFor(a, counts);
                return (
                  <div
                    key={a.id}
                    className="rounded-lg border border-border/60 p-2.5 text-sm bg-background/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {a.auditNumber} — {a.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Branch: {a.branch} · Completed{" "}
                          {format(new Date(a.completedAt ?? a.scheduledDate), "d MMM yyyy")}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={cn(
                            "inline-block font-semibold text-xs px-2 py-0.5 rounded border",
                            acc >= 90
                              ? "bg-success/10 text-success border-success/30"
                              : acc >= 75
                                ? "bg-warning/10 text-warning-foreground border-warning/30"
                                : "bg-destructive/10 text-destructive border-destructive/30",
                          )}
                        >
                          {acc}% Accuracy
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-1.5">
                      <span>Scope: {a.batchIds.length} items</span>
                      <span className="text-success font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Stock Updated
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 7. Action-Oriented Bottom Call To Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Schedule a Stock Audit</h4>
            <p className="text-xs text-muted-foreground">
              Count your full pharmacy inventory, a specific shelf, or high-value medicine
              categories.
            </p>
          </div>
        </div>
        <Button size="default" className="shrink-0 font-medium" onClick={onNewAudit}>
          <Play className="mr-1.5 h-4 w-4" /> Schedule Audit
        </Button>
      </div>
    </div>
  );
}
