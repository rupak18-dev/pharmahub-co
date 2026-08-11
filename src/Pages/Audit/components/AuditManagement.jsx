import { useMemo, useState } from "react";
import { format, isSameDay, isTomorrow, startOfDay } from "date-fns";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileSearch,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  UserCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Input } from "@/Components/ui/input";
import { Progress } from "@/Components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
  AUDIT_TYPES,
  AUDIT_STATUS_META,
  AUDIT_TYPE_DOT,
  AUDIT_TYPE_LABEL,
  auditProgress,
} from "@/lib/audit";
const STATUS_FILTERS = [
  { value: "all", label: "All Audits" },
  { value: "overdue", label: "Overdue" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "paused", label: "Paused" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];
export function AuditManagement({
  audits,
  counts,
  profiles = [],
  has,
  onOpenCreate,
  onSelect,
  onStart,
  onPause,
  onResume,
  onCancel,
  onSubmit,
  onLive,
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [branch, setBranch] = useState("all");
  const [auditType, setAuditType] = useState("all");
  const [sortBy, setSortBy] = useState("date_asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const profileMap = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);
  const branches = useMemo(() => Array.from(new Set(audits.map((a) => a.branch))), [audits]);
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const todayStart = startOfDay(new Date());
    const list = audits
      .filter((a) => {
        if (status === "all") return true;
        if (status === "overdue") {
          const sched = new Date(a.scheduledDate);
          return sched < todayStart && a.status === "scheduled";
        }
        return a.status === status;
      })
      .filter((a) => branch === "all" || a.branch === branch)
      .filter((a) => auditType === "all" || a.type === auditType)
      .filter((a) => {
        if (!query) return true;
        const assigneesStr = (a.assignedUserIds || [])
          .map((id) => profileMap.get(id)?.name ?? "")
          .join(" ");
        return `${a.auditNumber} ${a.title} ${AUDIT_TYPE_LABEL[a.type]} ${a.branch} ${a.notes ?? ""} ${assigneesStr}`
          .toLowerCase()
          .includes(query);
      });
    return list.sort((a, b) => {
      if (sortBy === "date_asc") {
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      }
      if (sortBy === "date_desc") {
        return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
      }
      if (sortBy === "ref_asc") {
        return a.auditNumber.localeCompare(b.auditNumber);
      }
      if (sortBy === "progress_desc") {
        return auditProgress(b, counts).pct - auditProgress(a, counts).pct;
      }
      if (sortBy === "progress_asc") {
        return auditProgress(a, counts).pct - auditProgress(b, counts).pct;
      }
      return 0;
    });
  }, [audits, status, branch, auditType, q, sortBy, counts, profileMap]);
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);
  const resetFilters = () => {
    setQ("");
    setStatus("all");
    setBranch("all");
    setAuditType("all");
    setSortBy("date_asc");
    setPage(1);
  };
  const isFiltered =
    q.trim() !== "" ||
    status !== "all" ||
    branch !== "all" ||
    auditType !== "all" ||
    sortBy !== "date_asc";
  const getScopeDescription = (a) => {
    if (a.shelf) return `Shelf Location: ${a.shelf}`;
    if (a.notes && !a.notes.toLowerCase().includes("batches in scope")) return a.notes;
    if (a.title && !a.title.includes("·") && !a.title.includes(a.branch)) return a.title;
    const batchCount = a.batchIds?.length ?? 0;
    return `${batchCount} batch${batchCount === 1 ? "" : "es"} in audit scope`;
  };
  const getAssignees = (a) => {
    if (!a.assignedUserIds || a.assignedUserIds.length === 0) {
      return a.createdByName ? `By ${a.createdByName}` : "Unassigned";
    }
    const names = a.assignedUserIds
      .map((id) => profileMap.get(id)?.name)
      .filter((name) => Boolean(name));
    if (names.length === 0) return a.createdByName ? `By ${a.createdByName}` : "Unassigned";
    if (names.length === 1) return names[0];
    return `${names[0]} +${names.length - 1}`;
  };
  return (
    <div className="space-y-4">
      {/* Search, Dropdown Filters, Sort & Status Pills */}
      <div className="sticky top-0 z-10 space-y-3 rounded-xl border border-border bg-card/95 backdrop-blur-xs p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative w-full sm:w-auto sm:min-w-[240px] sm:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by audit #, title, branch, or assigned staff…"
              className="pl-9 text-sm min-h-[44px] sm:min-h-[36px]"
            />
          </div>

          {/* Branch Filter */}
          <Select
            value={branch}
            onValueChange={(val) => {
              setBranch(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[150px] text-sm min-h-[44px] sm:min-h-[36px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Audit Type Filter */}
          <Select
            value={auditType}
            onValueChange={(val) => {
              setAuditType(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[150px] text-sm min-h-[44px] sm:min-h-[36px]">
              <SelectValue placeholder="All Audit Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Audit Types</SelectItem>
              {AUDIT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By Dropdown */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[160px] text-sm min-h-[44px] sm:min-h-[36px]">
              <div className="flex items-center gap-1.5 truncate">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Sort order" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_asc">Scheduled Date (Soonest)</SelectItem>
              <SelectItem value="date_desc">Scheduled Date (Latest)</SelectItem>
              <SelectItem value="ref_asc">Audit Ref Number</SelectItem>
              <SelectItem value="progress_desc">Progress (High to Low)</SelectItem>
              <SelectItem value="progress_asc">Progress (Low to High)</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters */}
          {isFiltered && (
            <Button
              size="sm"
              variant="ghost"
              className="h-9 px-2 text-xs min-h-[44px] sm:min-h-[36px]"
              onClick={resetFilters}
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Clear Filters
            </Button>
          )}

          <Button
            size="sm"
            className="w-full sm:w-auto sm:ml-auto font-medium min-h-[44px] sm:min-h-[36px]"
            onClick={onOpenCreate}
          >
            <Plus className="mr-1.5 h-4 w-4" /> New Audit
          </Button>
        </div>

        {/* Quick Status Pill Bar */}
        <div className="flex overflow-x-auto no-scrollbar items-center gap-1.5 border-t border-border/50 pt-2.5 whitespace-nowrap">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1 shrink-0">
            Status:
          </span>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                setStatus(s.value);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors shrink-0 min-h-[32px]",
                status === s.value
                  ? s.value === "overdue"
                    ? "border-destructive bg-destructive/10 text-destructive font-semibold"
                    : "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border/60 bg-background/60 text-muted-foreground hover:border-border hover:bg-accent",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Audit Data Table (Visible on Tablet sm:block and Desktop lg:block) */}
      <div className="hidden sm:block rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[240px]">Audit Reference & Scope</TableHead>
              <TableHead>Audit Type</TableHead>
              <TableHead className="hidden lg:table-cell">Branch</TableHead>
              <TableHead className="hidden lg:table-cell">Assigned Staff</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-36 lg:w-44">Progress</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-56 text-center py-10">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="rounded-full bg-muted p-3 text-muted-foreground">
                      <FileSearch className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">No stock audits found</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {isFiltered
                          ? "No audits match your active search query or filter options. Try clearing your filters."
                          : "No stock audits have been scheduled yet."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {isFiltered && (
                        <Button size="sm" variant="outline" onClick={resetFilters}>
                          Clear Filters
                        </Button>
                      )}
                      <Button size="sm" onClick={onOpenCreate}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Schedule New Audit
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((a) => {
                const p = auditProgress(a, counts);
                const meta = AUDIT_STATUS_META[a.status];
                const schedDate = new Date(a.scheduledDate);
                const isToday = isSameDay(schedDate, new Date());
                const isTomorrowDate = isTomorrow(schedDate);
                const isOverdue = schedDate < startOfDay(new Date()) && a.status === "scheduled";
                return (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                    onClick={() => onSelect(a.id)}
                  >
                    {/* 1. Audit Reference & Scope (Clean, non-repeated) */}
                    <TableCell className="py-3">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-sm text-foreground block tracking-tight">
                          {a.auditNumber}
                        </span>
                        <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                          {getScopeDescription(a)}
                        </p>
                      </div>
                    </TableCell>

                    {/* 2. Audit Type Badge */}
                    <TableCell className="py-3">
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: AUDIT_TYPE_DOT[a.type] }}
                        />
                        {AUDIT_TYPE_LABEL[a.type]}
                      </div>
                    </TableCell>

                    {/* 3. Branch */}
                    <TableCell className="hidden lg:table-cell py-3 text-sm text-muted-foreground font-medium">
                      {a.branch}
                    </TableCell>

                    {/* 4. Assigned Staff */}
                    <TableCell className="hidden lg:table-cell py-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground/90">
                        <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {getAssignees(a)}
                      </span>
                    </TableCell>

                    {/* 5. Scheduled Date with Relative Callouts */}
                    <TableCell className="py-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-medium text-foreground block">
                          {format(schedDate, "MMM d, yyyy")}
                        </span>
                        {isToday && (
                          <span className="inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Today
                          </span>
                        )}
                        {isTomorrowDate && (
                          <span className="inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Tomorrow
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded bg-destructive/10 text-destructive border border-destructive/20">
                            Overdue
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* 6. Status Badge with Indicator Dot */}
                    <TableCell className="py-3">
                      <Badge
                        className={cn(
                          "border inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs rounded-md shadow-2xs font-medium",
                          isOverdue
                            ? "bg-destructive/10 text-destructive border-destructive/30"
                            : meta.chip,
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            isOverdue ? "bg-destructive" : meta.dot,
                          )}
                        />
                        {isOverdue ? "Overdue" : meta.label}
                      </Badge>
                    </TableCell>

                    {/* 7. Clear Completion Progress Column */}
                    <TableCell className="py-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground tabular-nums">
                            {p.pct}%
                          </span>
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            {p.verified}/{p.total} batches
                          </span>
                        </div>
                        <Progress
                          value={p.pct}
                          className={cn(
                            "h-1.5",
                            p.pct === 100
                              ? "[&>div]:bg-emerald-500"
                              : p.pct > 0
                                ? "[&>div]:bg-blue-500"
                                : "",
                          )}
                        />
                      </div>
                    </TableCell>

                    {/* 8. Action Column (Single primary CTA per status) */}
                    <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {has("audit", "update") ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {a.status === "scheduled" && (
                            <>
                              <Button size="sm" onClick={() => onStart(a.id)}>
                                <Play className="mr-1.5 h-3.5 w-3.5" /> Start Audit
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => onSelect(a.id)}>
                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => onCancel(a.id)}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" /> Cancel Audit
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}

                          {a.status === "in_progress" && (
                            <>
                              <Button size="sm" onClick={() => onLive(a.id)}>
                                <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> Continue Count
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => onPause(a.id)}>
                                    <Pause className="mr-2 h-4 w-4" /> Pause Audit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onSubmit(a.id)}>
                                    <Send className="mr-2 h-4 w-4" /> Submit for Review
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => onSelect(a.id)}>
                                    <Eye className="mr-2 h-4 w-4" /> Audit Overview
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}

                          {a.status === "paused" && (
                            <>
                              <Button size="sm" onClick={() => onResume(a.id)}>
                                <Play className="mr-1.5 h-3.5 w-3.5" /> Resume Audit
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => onSubmit(a.id)}>
                                    <Send className="mr-2 h-4 w-4" /> Submit for Review
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onSelect(a.id)}>
                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </>
                          )}

                          {a.status === "pending_review" && (
                            <Button size="sm" variant="outline" onClick={() => onSelect(a.id)}>
                              <Eye className="mr-1.5 h-3.5 w-3.5" /> Review Audit
                            </Button>
                          )}

                          {(a.status === "approved" ||
                            a.status === "completed" ||
                            a.status === "cancelled") && (
                            <Button size="sm" variant="outline" onClick={() => onSelect(a.id)}>
                              View Details
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end">
                          <Button size="sm" variant="outline" onClick={() => onSelect(a.id)}>
                            View Details
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Enterprise Pagination Bar (Comfortably supports 500+ audits scale) */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-card text-xs text-muted-foreground">
            <div>
              Showing{" "}
              <span className="font-semibold text-foreground">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * pageSize, filtered.length)}
              </span>{" "}
              of <span className="font-semibold text-foreground">{filtered.length}</span> audits
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </Button>
              <span className="text-xs font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Audit Cards List (<640px) */}
      <div className="sm:hidden space-y-3">
        {paginated.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No stock audits found
          </div>
        ) : (
          paginated.map((a) => {
            const p = auditProgress(a, counts);
            const meta = AUDIT_STATUS_META[a.status];
            const schedDate = new Date(a.scheduledDate);
            const isOverdue = schedDate < startOfDay(new Date()) && a.status === "scheduled";
            return (
              <div
                key={a.id}
                onClick={() => onSelect(a.id)}
                className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-2xs active:bg-muted/40 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-sm text-foreground tracking-tight block">
                      {a.auditNumber}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">{getScopeDescription(a)}</p>
                  </div>
                  <Badge
                    className={cn(
                      "border shrink-0 px-2.5 py-1 text-xs font-medium",
                      isOverdue
                        ? "bg-destructive/10 text-destructive border-destructive/30"
                        : meta.chip,
                    )}
                  >
                    {isOverdue ? "Overdue" : meta.label}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
                  <div className="inline-flex items-center gap-1 font-medium text-foreground">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: AUDIT_TYPE_DOT[a.type] }}
                    />
                    {AUDIT_TYPE_LABEL[a.type]}
                  </div>
                  <div>
                    Branch: <strong className="text-foreground font-medium">{a.branch}</strong>
                  </div>
                  <div>
                    Date:{" "}
                    <strong className="text-foreground font-medium">
                      {format(schedDate, "MMM d, yyyy")}
                    </strong>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground tabular-nums">
                      {p.pct}% complete
                    </span>
                    <span className="text-muted-foreground text-[11px] tabular-nums">
                      {p.verified}/{p.total} batches
                    </span>
                  </div>
                  <Progress value={p.pct} className="h-2" />
                </div>

                {/* Primary Button (100% width on phone) */}
                <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                  {a.status === "scheduled" && (
                    <Button className="w-full min-h-[44px]" onClick={() => onStart(a.id)}>
                      <Play className="mr-2 h-4 w-4" /> Start Audit
                    </Button>
                  )}
                  {a.status === "in_progress" && (
                    <Button className="w-full min-h-[44px]" onClick={() => onLive(a.id)}>
                      <ClipboardCheck className="mr-2 h-4 w-4" /> Continue Count
                    </Button>
                  )}
                  {a.status === "paused" && (
                    <Button className="w-full min-h-[44px]" onClick={() => onResume(a.id)}>
                      <Play className="mr-2 h-4 w-4" /> Resume Audit
                    </Button>
                  )}
                  {(a.status === "pending_review" ||
                    a.status === "approved" ||
                    a.status === "completed" ||
                    a.status === "cancelled") && (
                    <Button
                      variant="outline"
                      className="w-full min-h-[44px]"
                      onClick={() => onSelect(a.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Mobile Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-3 py-2.5 text-xs text-muted-foreground pt-3">
            <span>
              Page {currentPage} of {totalPages} ({filtered.length} total)
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-[40px] px-3"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[40px] px-3"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
