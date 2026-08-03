import { useMemo } from "react";
import { format, formatDistanceToNow, isToday } from "date-fns";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  ListChecks,
  MapPin,
  PauseCircle,
  Play,
  Plus,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { auditProgress, AUDIT_STATUS_META, AUDIT_TYPE_LABEL } from "@/lib/audit";
import type { Audit, AuditCount, Profile } from "@/lib/types";

export function LiveAuditHome({
  audits,
  counts,
  profiles = [],
  onStart,
  onResume,
  onLive,
  onNewAudit,
  onOpenAudits,
}: {
  audits: Audit[];
  counts: AuditCount[];
  profiles?: Profile[];
  onStart: (id: string) => void;
  onResume: (id: string) => void;
  onLive: (id: string) => void;
  onNewAudit: () => void;
  onOpenAudits: () => void;
}) {
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const active = useMemo(
    () =>
      audits
        .filter((a) => a.status === "in_progress" || a.status === "paused")
        .sort(
          (a, b) =>
            new Date(b.startedAt ?? b.scheduledDate).getTime() -
            new Date(a.startedAt ?? a.scheduledDate).getTime(),
        ),
    [audits],
  );

  const ready = useMemo(
    () =>
      audits
        .filter((a) => a.status === "scheduled" && isToday(new Date(a.scheduledDate)))
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()),
    [audits],
  );

  const upcoming = useMemo(
    () =>
      audits
        .filter(
          (a) =>
            a.status === "scheduled" && new Date(a.scheduledDate).getTime() > new Date().getTime(),
        )
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
        .slice(0, 4),
    [audits],
  );

  const activeAudit = active[0];

  const getAssignees = (a: Audit) => {
    if (!a.assignedUserIds || a.assignedUserIds.length === 0) {
      return a.createdByName ? `By ${a.createdByName}` : "Unassigned";
    }
    const names = a.assignedUserIds
      .map((id) => profileMap.get(id)?.name)
      .filter((name): name is string => Boolean(name));

    if (names.length === 0) return a.createdByName ? `By ${a.createdByName}` : "Unassigned";
    if (names.length === 1) return names[0];
    return `${names[0]} +${names.length - 1}`;
  };

  const getLastCountTime = (auditId: string) => {
    const auditCounts = counts.filter((c) => c.auditId === auditId && c.countedAt);
    if (auditCounts.length === 0) return null;
    const sorted = [...auditCounts].sort(
      (a, b) => new Date(b.countedAt).getTime() - new Date(a.countedAt).getTime(),
    );
    return sorted[0].countedAt;
  };

  // Enterprise Empty State when no active, paused or due audits exist
  if (!activeAudit && ready.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-2xs">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h3 className="mt-3 text-base font-semibold text-foreground">
            All Inventory Counts Up to Date
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
            There are no active, paused, or scheduled stock audits requiring physical counting right
            now. Start a new audit or browse all scheduled audits.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <Button size="sm" onClick={onNewAudit}>
              <Plus className="mr-1.5 h-4 w-4" /> Schedule New Audit
            </Button>
            <Button size="sm" variant="outline" onClick={onOpenAudits}>
              Browse All Audits <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Upcoming Schedule</h3>
            <Badge variant="outline" className="text-[10px]">
              Future Counts
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upcoming audits scheduled for future dates
          </p>
          <div className="mt-4 space-y-2.5">
            {upcoming.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No upcoming audits scheduled ahead.
              </div>
            ) : (
              upcoming.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3 text-xs bg-background/50 hover:bg-accent/40 transition-colors"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate font-semibold text-foreground">{a.auditNumber}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {a.branch} · {AUDIT_TYPE_LABEL[a.type]} ·{" "}
                      {format(new Date(a.scheduledDate), "EEE, d MMM")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => onOpenAudits()}
                  >
                    View
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Primary Active Audit Session Card */}
      {activeAudit && (
        <div className="rounded-xl border border-primary/40 bg-card p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-primary text-primary-foreground font-semibold text-[11px]">
                  Active Count Session
                </Badge>
                <Badge className={cn("border", AUDIT_STATUS_META[activeAudit.status].chip)}>
                  <span
                    className={cn(
                      "mr-1.5 h-1.5 w-1.5 rounded-full shrink-0",
                      AUDIT_STATUS_META[activeAudit.status].dot,
                    )}
                  />
                  {AUDIT_STATUS_META[activeAudit.status].label}
                </Badge>
              </div>

              <h2 className="text-lg font-bold text-foreground tracking-tight">
                {activeAudit.auditNumber} — {activeAudit.title}
              </h2>

              {/* Enhanced Timestamps & Metadata */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5">
                <span className="inline-flex items-center gap-1 font-medium text-foreground/90">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Branch:{" "}
                  <strong>{activeAudit.branch}</strong>
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-foreground/90">
                  <UserCheck className="h-3.5 w-3.5 text-muted-foreground" /> Assigned:{" "}
                  <strong>{getAssignees(activeAudit)}</strong>
                </span>
                {activeAudit.startedAt && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Started:{" "}
                    <strong>{format(new Date(activeAudit.startedAt), "MMM d, HH:mm")}</strong>
                  </span>
                )}
                {(() => {
                  const lastTime = getLastCountTime(activeAudit.id);
                  return lastTime ? (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <Clock className="h-3.5 w-3.5" /> Last count:{" "}
                      <strong>
                        {formatDistanceToNow(new Date(lastTime), { addSuffix: true })}
                      </strong>
                    </span>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Clear Primary Resume Action Button */}
            <div className="shrink-0">
              {activeAudit.status === "paused" ? (
                <Button
                  size="default"
                  className="font-medium"
                  onClick={() => {
                    onResume(activeAudit.id);
                    onLive(activeAudit.id);
                  }}
                >
                  <Play className="mr-1.5 h-4 w-4" /> Resume & Continue Count
                </Button>
              ) : (
                <Button
                  size="default"
                  className="font-medium"
                  onClick={() => onLive(activeAudit.id)}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Continue Live Count
                </Button>
              )}
            </div>
          </div>

          {/* Progress Indicator with Explicit Remaining Work Wording */}
          {(() => {
            const p = auditProgress(activeAudit, counts);
            return (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Count Progress ({p.pct}%)</span>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{p.verified}</strong> of {p.total} batches
                    verified —{" "}
                    <strong className={p.remaining > 0 ? "text-primary" : "text-emerald-600"}>
                      {p.remaining} batch{p.remaining === 1 ? "" : "es"} remaining
                    </strong>
                  </span>
                </div>
                <Progress value={p.pct} className="h-2 [&>div]:bg-primary" />
              </div>
            );
          })()}
        </div>
      )}

      {/* 2. Scheduled Today Section */}
      {ready.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Scheduled Today — Ready to Count
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ready.map((a) => {
              const p = auditProgress(a, counts);
              return (
                <div
                  key={a.id}
                  className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-sm text-foreground block">
                        {a.auditNumber}
                      </span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {AUDIT_TYPE_LABEL[a.type]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{a.branch}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Assigned: <strong className="text-foreground/90">{getAssignees(a)}</strong>
                    </p>
                  </div>

                  <div className="border-t border-border/50 pt-2.5 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {p.verified}/{p.total} counted
                    </span>
                    <Button
                      size="sm"
                      onClick={() => {
                        onStart(a.id);
                        onLive(a.id);
                      }}
                    >
                      <Play className="mr-1.5 h-3.5 w-3.5" /> Start & Count
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Paused Audits with Priority Indicators */}
      {active.filter((a) => a.id !== activeAudit?.id).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <PauseCircle className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">
              Paused Audits — Ready to Resume
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {active
              .filter((a) => a.id !== activeAudit?.id)
              .map((a) => {
                const p = auditProgress(a, counts);
                const isHighProgress = p.pct >= 70;
                return (
                  <div
                    key={a.id}
                    className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-2xs flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {a.auditNumber}
                        </span>
                        {isHighProgress && (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-semibold">
                            Almost Finished ({p.pct}%)
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{a.branch}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Assigned: <strong className="text-foreground/90">{getAssignees(a)}</strong>
                      </p>
                      {a.pausedAt && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Paused{" "}
                          {formatDistanceToNow(new Date(a.pausedAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-border/50 pt-2.5 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {p.remaining} remaining
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onResume(a.id);
                          onLive(a.id);
                        }}
                      >
                        <Play className="mr-1.5 h-3.5 w-3.5" /> Resume Audit
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Footer Quick Link to Audits List */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ListChecks className="h-4 w-4 text-primary shrink-0" />
          <span>
            Need to manage scheduled dates or review submitted audits? Go to the main Audits list.
          </span>
        </div>
        <Button size="sm" variant="outline" className="text-xs shrink-0" onClick={onOpenAudits}>
          Open All Audits <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
