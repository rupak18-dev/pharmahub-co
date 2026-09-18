import { useMemo, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  ClipboardCheck,
  Filter,
  FilterX,
  ListChecks,
  PackageCheck,
  Pause,
  Play,
  RotateCcw,
  Search,
  Smartphone,
  UserCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { DEFAULT_ACTIVITY_FILTERS, filterActivityLogs } from "@/lib/audit";
const ENTITY_META = {
  audit: {
    label: "Audit Session",
    icon: ClipboardCheck,
    tone: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  audit_count: {
    label: "Stock Count",
    icon: ListChecks,
    tone: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  variance: {
    label: "Stock Difference",
    icon: AlertTriangle,
    tone: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  adjustment: {
    label: "Inventory Adjustment",
    icon: PackageCheck,
    tone: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
};
function getActionIcon(action, entityType) {
  const lower = action.toLowerCase();
  if (lower.includes("approved"))
    return {
      Icon: CheckCircle2,
      tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    };
  if (lower.includes("rejected"))
    return { Icon: XCircle, tone: "text-destructive bg-destructive/10 border-destructive/30" };
  if (lower.includes("started") || lower.includes("resumed"))
    return {
      Icon: Play,
      tone: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30",
    };
  if (lower.includes("paused"))
    return {
      Icon: Pause,
      tone: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
    };
  if (lower.includes("recount"))
    return {
      Icon: RotateCcw,
      tone: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
    };
  if (lower.includes("cancelled"))
    return { Icon: XCircle, tone: "text-zinc-500 bg-zinc-500/10 border-zinc-500/30" };
  if (lower.includes("updated") || lower.includes("applied"))
    return {
      Icon: PackageCheck,
      tone: "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/30",
    };
  const meta = ENTITY_META[entityType];
  return {
    Icon: meta?.icon ?? ClipboardCheck,
    tone: `${meta?.tone ?? "text-primary"} ${meta?.bg ?? "bg-muted"}`,
  };
}
function formatStatusValue(val) {
  if (val == null) return "";
  const s = String(val);
  if (s === "pending_supervisor") return "Waiting for Supervisor";
  if (s === "pending_manager") return "Waiting for Manager";
  if (s === "in_progress") return "In Progress";
  if (s === "pending_review") return "Pending Review";
  if (s === "approved") return "Approved";
  if (s === "applied") return "Inventory Updated";
  if (s === "rejected") return "Rejected";
  if (s === "scheduled") return "Scheduled";
  if (s === "paused") return "Paused";
  if (s === "completed") return "Completed";
  if (s === "cancelled") return "Cancelled";
  return s.replace(/_/g, " ");
}
export function ActivityLogView({ logs, audits, profiles, onExportAudit }) {
  const [f, setF] = useState(DEFAULT_ACTIVITY_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [limit, setLimit] = useState(100);
  const set = (patch) => setF((prev) => ({ ...prev, ...patch }));
  const entities = useMemo(() => Array.from(new Set(logs.map((l) => l.entityType))), [logs]);
  const filtered = useMemo(() => filterActivityLogs(logs, f), [logs, f]);
  const shown = filtered.slice(0, limit);
  const hasFilters =
    f.q ||
    f.userId !== "all" ||
    f.entity !== "all" ||
    f.action !== "all" ||
    f.auditId !== "all" ||
    f.from ||
    f.to ||
    f.medicine;
  // Group activities by Date (Today, Yesterday, Older Dates)
  const groupedLogs = useMemo(() => {
    const groups = [];
    const map = new Map();
    shown.forEach((log) => {
      const d = new Date(log.createdAt);
      let key = format(d, "yyyy-MM-dd");
      let title = format(d, "EEEE, d MMM yyyy");
      if (isToday(d)) {
        key = "today";
        title = "Today";
      } else if (isYesterday(d)) {
        key = "yesterday";
        title = "Yesterday";
      }
      if (!map.has(key)) {
        map.set(key, []);
        groups.push({ title, items: map.get(key) });
      }
      map.get(key).push(log);
    });
    return groups;
  }, [shown]);
  const parseLogSubject = (log) => {
    if (log.details && (log.details.medicineName || log.details.medicine)) {
      return String(log.details.medicineName ?? log.details.medicine);
    }
    if (log.action.includes("·")) {
      const parts = log.action.split("·").map((s) => s.trim());
      if (parts.length >= 2 && !parts[0].toLowerCase().includes("audit")) {
        return parts[1];
      }
    }
    return null;
  };
  return (
    <div className="space-y-4">
      {/* Grouped Log Filters Toolbar */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative w-full sm:w-auto sm:min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={f.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Search activity, user, medicine, audit #..."
              className="w-full pl-9 text-sm min-h-[44px] sm:min-h-[36px]"
            />
          </div>

          {/* Mobile Filter Button (<640px) */}
          <Button
            variant="outline"
            className="sm:hidden w-full min-h-[44px] justify-center text-sm font-semibold"
            onClick={() => setFilterSheetOpen(true)}
          >
            <Filter className="mr-2 h-4 w-4" /> Filter Logs
            {hasFilters && (
              <span className="ml-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground font-bold">
                Active
              </span>
            )}
          </Button>

          {/* Desktop/Tablet Inline Filters (≥640px) */}
          <div className="hidden sm:flex flex-wrap items-center gap-2.5">
            <Select value={f.userId} onValueChange={(v) => set({ userId: v })}>
              <SelectTrigger className="w-[150px] text-sm">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={f.entity} onValueChange={(v) => set({ entity: v })}>
              <SelectTrigger className="w-[160px] text-sm">
                <SelectValue placeholder="All Activity Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity Types</SelectItem>
                {entities.map((e) => (
                  <SelectItem key={e} value={e}>
                    {ENTITY_META[e]?.label ?? e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={f.auditId} onValueChange={(v) => set({ auditId: v })}>
              <SelectTrigger className="w-[140px] text-sm">
                <SelectValue placeholder="All Audits" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Audits</SelectItem>
                {audits.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.auditNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={f.from}
              onChange={(e) => set({ from: e.target.value })}
              className="w-[130px] text-xs"
              aria-label="From date"
            />
            <Input
              type="date"
              value={f.to}
              onChange={(e) => set({ to: e.target.value })}
              className="w-[130px] text-xs"
              aria-label="To date"
            />

            {hasFilters && (
              <Button
                size="sm"
                variant="ghost"
                className="h-9 px-2 text-xs"
                onClick={() => setF(DEFAULT_ACTIVITY_FILTERS)}
              >
                <FilterX className="mr-1 h-3.5 w-3.5" /> Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet Filters (<640px) */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4"
        >
          <SheetHeader className="pb-2 border-b border-border">
            <SheetTitle className="text-left text-base font-bold">Filter Activity Logs</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">User</label>
              <Select value={f.userId} onValueChange={(v) => set({ userId: v })}>
                <SelectTrigger className="w-full text-sm min-h-[44px]">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Activity Type</label>
              <Select value={f.entity} onValueChange={(v) => set({ entity: v })}>
                <SelectTrigger className="w-full text-sm min-h-[44px]">
                  <SelectValue placeholder="All Activity Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activity Types</SelectItem>
                  {entities.map((e) => (
                    <SelectItem key={e} value={e}>
                      {ENTITY_META[e]?.label ?? e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Audit Session</label>
              <Select value={f.auditId} onValueChange={(v) => set({ auditId: v })}>
                <SelectTrigger className="w-full text-sm min-h-[44px]">
                  <SelectValue placeholder="All Audits" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audits</SelectItem>
                  {audits.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.auditNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">From Date</label>
                <Input
                  type="date"
                  value={f.from}
                  onChange={(e) => set({ from: e.target.value })}
                  className="w-full text-xs min-h-[44px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">To Date</label>
                <Input
                  type="date"
                  value={f.to}
                  onChange={(e) => set({ to: e.target.value })}
                  className="w-full text-xs min-h-[44px]"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex gap-2">
            {hasFilters && (
              <Button
                variant="outline"
                className="flex-1 min-h-[48px]"
                onClick={() => setF(DEFAULT_ACTIVITY_FILTERS)}
              >
                Clear All
              </Button>
            )}
            <Button
              className="flex-1 min-h-[48px] font-bold"
              onClick={() => setFilterSheetOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Activity Timeline Container */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-2xs">
        {/* Header & Export Button */}
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} Activity Event{filtered.length === 1 ? "" : "s"} Found
            </p>
          </div>
          <Button size="sm" variant="outline" className="font-medium" onClick={onExportAudit}>
            <ArrowDownToLine className="mr-1.5 h-3.5 w-3.5" /> Export Activity Log
          </Button>
        </div>

        {/* Empty State */}
        {shown.length === 0 ? (
          <div className="grid h-44 place-items-center text-center text-sm text-muted-foreground p-6">
            <div>
              <p className="font-semibold text-foreground">
                No activity log events match your filters
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try clearing your search query or date range filters.
              </p>
            </div>
          </div>
        ) : (
          /* Date-Grouped Activity Feed */
          <div className="space-y-6">
            {groupedLogs.map((group) => (
              <div key={group.title} className="space-y-3">
                {/* Date Group Header */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider bg-muted/60 px-2.5 py-1 rounded-md border border-border/40">
                    {group.title}
                  </span>
                  <div className="h-px flex-1 bg-border/40" />
                </div>

                {/* Cards for this Date */}
                <div className="space-y-2.5 pl-1">
                  {group.items.map((l) => {
                    const meta = ENTITY_META[l.entityType] ?? {
                      label: l.entityType,
                      icon: ClipboardCheck,
                      tone: "text-muted-foreground",
                      bg: "bg-muted",
                    };
                    const { Icon, tone } = getActionIcon(l.action, l.entityType);
                    const subject = parseLogSubject(l);
                    return (
                      <div
                        key={l.id}
                        className="rounded-xl border border-border/80 bg-background/60 p-3.5 shadow-2xs hover:bg-background hover:border-border transition-all flex items-start gap-3.5"
                      >
                        {/* Status Icon */}
                        <div
                          className={cn(
                            "grid h-9 w-9 shrink-0 place-items-center rounded-xl border mt-0.5",
                            tone,
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Card Content */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              {/* Primary Subject (Medicine Name or Main Header) */}
                              {subject ? (
                                <h4 className="text-sm font-semibold text-foreground tracking-tight">
                                  {subject}
                                </h4>
                              ) : null}
                              {/* Activity Title */}
                              <p
                                className={cn(
                                  "text-xs",
                                  subject
                                    ? "text-muted-foreground font-medium"
                                    : "text-sm font-semibold text-foreground",
                                )}
                              >
                                {l.action}
                              </p>
                            </div>

                            {/* Entity Badge */}
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] font-medium shrink-0 border", meta.bg)}
                            >
                              {meta.label}
                            </Badge>
                          </div>

                          {/* Friendly Status Transition (Objective 3) */}
                          {(l.oldValue !== undefined || l.newValue !== undefined) && (
                            <div className="rounded-lg bg-muted/30 px-2.5 py-1 border border-border/40 text-xs inline-flex items-center gap-1.5 font-medium text-foreground">
                              <span className="text-muted-foreground text-[11px]">
                                Status Changed:
                              </span>
                              {l.oldValue !== undefined && (
                                <span className="text-muted-foreground line-through">
                                  {formatStatusValue(l.oldValue)}
                                </span>
                              )}
                              {l.oldValue !== undefined && l.newValue !== undefined && (
                                <span className="text-muted-foreground">→</span>
                              )}
                              {l.newValue !== undefined && (
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  {formatStatusValue(l.newValue)}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Reason */}
                          {l.reason && (
                            <p className="text-xs text-muted-foreground font-medium">
                              Reason: <span className="text-foreground/90">{l.reason}</span>
                            </p>
                          )}

                          {/* Subdued Metadata Row */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground pt-0.5">
                            <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                              <UserCheck className="h-3 w-3 text-muted-foreground" /> {l.userName}
                            </span>
                            <span>•</span>
                            <span>{format(new Date(l.createdAt), "h:mm a")}</span>
                            {l.branch && (
                              <>
                                <span>•</span>
                                <span>{l.branch}</span>
                              </>
                            )}
                            {l.device && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                                  <Smartphone className="h-3 w-3" /> {l.device}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More Pagination */}
      {filtered.length > limit && (
        <div className="text-center pt-1">
          <Button size="sm" variant="outline" onClick={() => setLimit((x) => x + 100)}>
            Load {Math.min(100, filtered.length - limit)} more activity events
          </Button>
        </div>
      )}
    </div>
  );
}
