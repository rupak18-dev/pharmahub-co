import { format } from "date-fns";
import type { ReactNode } from "react";
import {
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  ClipboardCheck,
  PackageCheck,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ADJUSTMENT_ACTION_LABEL,
  AUDIT_STATUS_META,
  AUDIT_TYPE_LABEL,
  auditProgress,
  SEVERITY_META,
  VARIANCE_STATUS_META,
} from "@/lib/audit";
import type {
  Audit,
  AuditCount,
  AuditTimelineAction,
  Profile,
  StockAdjustment,
  VarianceItem,
} from "@/lib/types";

const TL_META: Record<AuditTimelineAction, { label: string; icon: typeof Play }> = {
  created: { label: "Created", icon: Plus },
  started: { label: "Started", icon: Play },
  paused: { label: "Paused", icon: Pause },
  resumed: { label: "Resumed", icon: Play },
  submitted: { label: "Submitted for review", icon: Send },
  recount_requested: { label: "Recount requested", icon: RotateCcw },
  recount_confirmed: { label: "Recount confirmed", icon: RotateCcw },
  approved: { label: "Approved", icon: CheckCheck },
  completed: { label: "Completed", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", icon: XCircle },
  adjustment_applied: { label: "Inventory adjusted", icon: PackageCheck },
};

export function AuditDrawer({
  audit,
  counts,
  variances,
  adjustments,
  profiles,
  currency,
  open,
  onOpenChange,
  onStart,
  onPause,
  onResume,
  onSubmit,
  onCancel,
  onLive,
}: {
  audit: Audit | null;
  counts: AuditCount[];
  variances: VarianceItem[];
  adjustments: StockAdjustment[];
  profiles: Profile[];
  currency: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onSubmit: (id: string) => void;
  onCancel: (id: string) => void;
  onLive: (id: string) => void;
}) {
  if (!audit) return null;
  const progress = auditProgress(audit, counts);
  const status = AUDIT_STATUS_META[audit.status];
  const auditVariances = variances.filter((v) => v.auditId === audit.id);
  const auditAdjustments = adjustments.filter((a) => a.auditId === audit.id);
  const assignedNames = profiles
    .filter((p) => audit.assignedUserIds.includes(p.id))
    .map((p) => p.name)
    .join(", ");

  const actions: ReactNode[] = [];
  if (audit.status === "scheduled") {
    actions.push(
      <Button
        key="start"
        className="w-full sm:w-auto min-h-[48px] sm:min-h-[36px] font-bold"
        onClick={() => onStart(audit.id)}
      >
        <Play className="mr-1.5 h-4 w-4" /> Start audit
      </Button>,
      <Button
        key="cancel"
        variant="outline"
        className="w-full sm:w-auto min-h-[48px] sm:min-h-[36px]"
        onClick={() => onCancel(audit.id)}
      >
        Cancel
      </Button>,
    );
  } else if (audit.status === "in_progress") {
    actions.push(
      <Button
        key="live"
        className="w-full sm:w-auto min-h-[48px] sm:min-h-[36px] font-bold"
        onClick={() => onLive(audit.id)}
      >
        <ClipboardCheck className="mr-1.5 h-4 w-4" /> Continue count
      </Button>,
      <Button
        key="pause"
        variant="outline"
        className="w-full sm:w-auto min-h-[48px] sm:min-h-[36px]"
        onClick={() => onPause(audit.id)}
      >
        Pause
      </Button>,
      <Button
        key="submit"
        variant="outline"
        className="w-full sm:w-auto min-h-[48px] sm:min-h-[36px]"
        onClick={() => onSubmit(audit.id)}
      >
        Submit review
      </Button>,
    );
  } else if (audit.status === "paused") {
    actions.push(
      <Button
        key="resume"
        className="w-full sm:w-auto min-h-[48px] sm:min-h-[36px] font-bold"
        onClick={() => onResume(audit.id)}
      >
        <Play className="mr-1.5 h-4 w-4" /> Resume audit
      </Button>,
      <Button
        key="submit"
        variant="outline"
        className="w-full sm:w-auto min-h-[48px] sm:min-h-[36px]"
        onClick={() => onSubmit(audit.id)}
      >
        Submit review
      </Button>,
    );
  }

  const Meta = ({ label, value }: { label: string; value: string }) => (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium">{value || "—"}</p>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <SheetContent className="w-full max-w-full sm:max-w-xl overflow-y-auto p-4 sm:p-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            {audit.auditNumber}
            <Badge className={`border ${status.chip}`}>{status.label}</Badge>
          </SheetTitle>
          <p className="text-sm font-medium text-foreground">{audit.title}</p>
          <p className="text-xs text-muted-foreground">
            {AUDIT_TYPE_LABEL[audit.type]} · {audit.branch}
          </p>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {actions.length > 0 && <div className="flex flex-wrap items-center gap-2">{actions}</div>}

          <div className="rounded-lg border border-border bg-card p-3">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">Audit progress</span>
              <span className="font-mono text-xs text-muted-foreground">
                {progress.verified}/{progress.total} · {progress.pct}%
              </span>
            </div>
            <Progress value={progress.pct} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {progress.remaining} remaining · {audit.batchIds.length} in scope
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-card p-3">
            <Meta label="Branch" value={audit.branch} />
            <Meta label="Assigned" value={assignedNames} />
            <Meta label="Scheduled" value={format(new Date(audit.scheduledDate), "d MMM yyyy")} />
            <Meta label="Created by" value={audit.createdByName} />
            <Meta label="Created" value={format(new Date(audit.createdAt), "d MMM · HH:mm")} />
            <Meta
              label="Started"
              value={audit.startedAt ? format(new Date(audit.startedAt), "d MMM · HH:mm") : "—"}
            />
            <Meta
              label="Submitted"
              value={audit.submittedAt ? format(new Date(audit.submittedAt), "d MMM · HH:mm") : "—"}
            />
            <Meta
              label="Completed"
              value={audit.completedAt ? format(new Date(audit.completedAt), "d MMM · HH:mm") : "—"}
            />
            {audit.categoryId && <Meta label="Category" value="Selected category" />}
            {audit.shelf && <Meta label="Shelf" value={audit.shelf} />}
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Timeline
            </h4>
            <ol className="relative space-y-3 border-l border-border pl-4">
              {audit.timeline.map((e) => {
                const meta = TL_META[e.action];
                const Icon = meta.icon;
                return (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[21px] grid h-4 w-4 place-items-center rounded-full border border-border bg-card">
                      <Icon className="h-2.5 w-2.5 text-primary" />
                    </span>
                    <p className="text-sm font-medium">{meta.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.byName} · {format(new Date(e.at), "d MMM · HH:mm")}
                    </p>
                    {e.note && <p className="mt-0.5 text-xs text-muted-foreground">{e.note}</p>}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Variances ({auditVariances.length})
            </h4>
            {auditVariances.length === 0 ? (
              <p className="text-sm text-muted-foreground">No mismatched lines.</p>
            ) : (
              <div className="space-y-2">
                {auditVariances.slice(0, 6).map((v) => (
                  <div key={v.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{v.medicineName}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.batchNumber} · {v.difference > 0 ? "+" : ""}
                        {v.difference} units
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge className={`border ${SEVERITY_META[v.severity].chip}`}>
                        {SEVERITY_META[v.severity].label} · {currency}
                        {Math.round(v.varianceValue).toLocaleString()}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {VARIANCE_STATUS_META[v.status].label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {auditAdjustments.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Adjustments ({auditAdjustments.length})
              </h4>
              <div className="space-y-1 text-sm">
                {auditAdjustments.map((a: StockAdjustment) => (
                  <p key={a.id} className="flex items-center justify-between">
                    <span className="min-w-0 truncate">{a.medicineName}</span>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {ADJUSTMENT_ACTION_LABEL[a.action]} · {a.quantity > 0 ? "+" : ""}
                      {a.quantity}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
