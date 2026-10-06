import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Copy,
  Check,
  Eye,
  MessageSquare,
  AlertCircle,
  Clock,
  User,
  Mail,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Layers,
  Inbox,
  ArrowUpDown,
} from "lucide-react";
import { TbTicket } from "react-icons/tb";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { ticketService } from "@/lib/ticketService";
import { CategoryIcon } from "../supportConfig";

const SEVERITY_CONFIG = {
  low: {
    label: "Low",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  medium: {
    label: "Medium",
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    dotClass: "bg-blue-500",
  },
  high: {
    label: "High",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  critical: {
    label: "Critical",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    dotClass: "bg-rose-600 animate-pulse",
  },
};

const STATUS_CONFIG = {
  open: {
    label: "Open",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  acknowledged: {
    label: "Acknowledged",
    badgeClass:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  },
  assigned: {
    label: "Assigned",
    badgeClass:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  },
  in_progress: {
    label: "In Progress",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  waiting_for_user: {
    label: "Waiting for User",
    badgeClass:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  },
  resolved: {
    label: "Resolved",
    badgeClass:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700",
  },
  closed: {
    label: "Closed",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
};

export function AdminSupportInbox({ onSelectTicket, categories = [] }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  const fetchTickets = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Backend automatically serves all tickets to authenticated Admin role
      const data = await ticketService.listTickets({});
      if (Array.isArray(data)) {
        setTickets(data);
      }
    } catch (err) {
      toast.error("Failed to load tickets from server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCopyId = (ticketId, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(ticketId);
    setCopiedId(ticketId);
    toast.success(`Copied ${ticketId}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "open").length;
    const inProgress = tickets.filter(
      (t) => t.status === "in_progress" || t.status === "assigned" || t.status === "acknowledged",
    ).length;
    const waiting = tickets.filter((t) => t.status === "waiting_for_user").length;
    const resolvedClosed = tickets.filter(
      (t) => t.status === "resolved" || t.status === "closed",
    ).length;
    const critical = tickets.filter((t) => t.severity === "critical" && t.status !== "closed")
      .length;

    return { total, open, inProgress, waiting, resolvedClosed, critical };
  }, [tickets]);

  // Filtering
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.ticketId?.toLowerCase().includes(q) ||
        t.title?.toLowerCase().includes(q) ||
        t.userName?.toLowerCase().includes(q) ||
        t.userEmail?.toLowerCase().includes(q) ||
        t.issueType?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        t.status?.toLowerCase() === statusFilter.toLowerCase();

      const matchesSeverity =
        severityFilter === "all" ||
        t.severity?.toLowerCase() === severityFilter.toLowerCase();

      const matchesCategory =
        categoryFilter === "all" ||
        t.issueType?.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesSeverity && matchesCategory;
    });
  }, [tickets, searchQuery, statusFilter, severityFilter, categoryFilter]);

  const formatDateTime = (isoDate) => {
    if (!isoDate) return "—";
    try {
      const date = new Date(isoDate);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return String(isoDate);
    }
  };

  const getCategoryLabel = (catId) => {
    const found = categories.find((c) => c.id === catId);
    if (found) return found.label;
    return catId ? catId.replace(/_/g, " ") : "General Inquiry";
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground">Total Tickets</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {metrics.total}
              </span>
              <span className="text-[10px] text-muted-foreground">All time</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20 shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Open / New
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                {metrics.open}
              </span>
              <span className="text-[10px] text-emerald-700/80">Pending review</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20 shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              In Progress
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-300">
                {metrics.inProgress}
              </span>
              <span className="text-[10px] text-amber-700/80">Active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200/80 bg-purple-50/40 dark:border-purple-900/60 dark:bg-purple-950/20 shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-purple-800 dark:text-purple-300">
              Waiting for User
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-purple-700 dark:text-purple-300">
                {metrics.waiting}
              </span>
              <span className="text-[10px] text-purple-700/80">User action</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground">Resolved / Closed</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {metrics.resolvedClosed}
              </span>
              <span className="text-[10px] text-muted-foreground">Completed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200/80 bg-rose-50/40 dark:border-rose-900/60 dark:bg-rose-950/20 shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
              Critical Open
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-300">
                {metrics.critical}
              </span>
              <span className="text-[10px] text-rose-700/80">Immediate attention</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Search, Filters & Refresh */}
      <Card className="border-border shadow-sm bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ticket ID, reporter name, email, issue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs w-[130px]">
                  <SelectValue placeholder="Status: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting_for_user">Waiting for User</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              {/* Severity Filter */}
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="h-9 text-xs w-[120px]">
                  <SelectValue placeholder="Severity: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              {categories.length > 0 && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-9 text-xs w-[150px]">
                    <SelectValue placeholder="Category: All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTickets(true)}
                disabled={refreshing}
                className="h-9 px-3 text-xs gap-1.5 shrink-0"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List / Table */}
      <Card className="border-border shadow-sm overflow-hidden bg-card">
        <CardHeader className="p-4 border-b border-border/80 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Inbox className="h-4 w-4 text-emerald-600" />
              All User Support Tickets
            </CardTitle>
            <CardDescription className="text-xs">
              Showing {filteredTickets.length} of {tickets.length} tickets across all users.
            </CardDescription>
          </div>
        </CardHeader>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
            Loading all support tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground space-y-2">
            <Inbox className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <div className="font-medium text-foreground">No support tickets found</div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all" || severityFilter !== "all"
                ? "No tickets match your active search and filter criteria."
                : "No users have submitted tickets yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredTickets.map((t) => {
              const sev = SEVERITY_CONFIG[t.severity?.toLowerCase()] || SEVERITY_CONFIG.medium;
              const stat = STATUS_CONFIG[t.status?.toLowerCase()] || STATUS_CONFIG.open;
              const hasReplies = Array.isArray(t.messages) && t.messages.length > 0;

              return (
                <div
                  key={t._id || t.ticketId}
                  onClick={() => onSelectTicket(t.ticketId || t._id)}
                  className="p-4 sm:p-5 hover:bg-muted/30 transition-colors cursor-pointer group flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left Column: ID, User, Title, Category */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border">
                        {t.ticketId}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyId(t.ticketId, e)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
                        title="Copy Ticket ID"
                      >
                        {copiedId === t.ticketId ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <Badge variant="outline" className={`text-[11px] font-medium ${sev.badgeClass}`}>
                        <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${sev.dotClass}`} />
                        {sev.label}
                      </Badge>

                      <Badge variant="outline" className={`text-[11px] font-medium ${stat.badgeClass}`}>
                        {stat.label}
                      </Badge>

                      {hasReplies && (
                        <Badge variant="secondary" className="text-[10px] gap-1 text-muted-foreground font-mono">
                          <MessageSquare className="h-2.5 w-2.5" />
                          {t.messages.length}
                        </Badge>
                      )}
                    </div>

                    {/* Issue Title */}
                    <div className="text-sm font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
                      {t.title}
                    </div>

                    {/* Reporter Info & Category */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-medium text-foreground/80">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {t.userName || "PharmaHub User"}
                      </span>

                      {t.userEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground/70" />
                          {t.userEmail}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1.5 rounded bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground border border-border/50">
                        <CategoryIcon id={t.issueType} className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{getCategoryLabel(t.issueType)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Timestamps & Action Button */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-border/50">
                    <div className="text-right space-y-0.5">
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground/70" />
                        <span>Created: {formatDateTime(t.createdAt)}</span>
                      </div>
                      {t.updatedAt && t.updatedAt !== t.createdAt && (
                        <div className="text-[10px] text-muted-foreground/70">
                          Updated: {formatDateTime(t.updatedAt)}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1 text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40"
                    >
                      <span>Manage Ticket</span>
                      <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
