import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  RefreshCw,
  Eye,
  FileText,
  Calendar,
  Layers,
  User,
  ShieldCheck,
  HelpCircle,
  Activity,
  Image as ImageIcon,
} from "lucide-react";
import { TbTicket } from "react-icons/tb";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { ticketService } from "@/lib/ticketService";

const ISSUE_TYPES_MAP = {
  billing_pos: { label: "Billing, POS & Invoicing Issue", icon: "💳" },
  inventory_stock: { label: "Inventory & Stock Discrepancy", icon: "📦" },
  medicines_batches: { label: "Medicine Catalog & Batch Tracking", icon: "💊" },
  expiry_returns: { label: "Expiry & Returns Management", icon: "⏳" },
  purchases_suppliers: { label: "Purchase Orders & Supplier Sync", icon: "🚚" },
  user_access: { label: "User Access, Roles & Permissions", icon: "🔐" },
  reports_export: { label: "Reports & PDF/Excel Export", icon: "📊" },
  hardware_integrations: { label: "Integrations & Hardware Setup", icon: "🖨️" },
  system_bug: { label: "System Bug / Technical Error", icon: "⚠️" },
  general_inquiry: { label: "General Inquiry / Feature Feedback", icon: "💬" },
};

const SEVERITY_MAP = {
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
    label: "Ticket Raised",
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

export function TicketTrackingView({ ticketId, onBack, onOpenScreenshot }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchTicket = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const data = await ticketService.getTicket(ticketId);
        if (data) {
          setTicket(data);
        } else {
          toast.error("Ticket not found.");
        }
      } catch (err) {
        toast.error(err.message || "Failed to load ticket details.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [ticketId],
  );

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId, fetchTicket]);

  const handleCopyId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast.success("Ticket ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    const datePart = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timePart = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} • ${timePart}`;
  };

  if (loading) {
    return (
      <Card className="border-border shadow-sm p-12 text-center">
        <div className="flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
          <div className="text-sm font-medium text-foreground">Loading ticket tracking information...</div>
          <div className="text-xs text-muted-foreground">Retrieving real-time status and activity timeline</div>
        </div>
      </Card>
    );
  }

  if (!ticket) {
    return (
      <Card className="border-border shadow-sm p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Ticket Not Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Could not find details for ticket {ticketId}.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to My Tickets
        </Button>
      </Card>
    );
  }

  const category = ISSUE_TYPES_MAP[ticket.issueType] || {
    label: ticket.issueType || "General Inquiry",
    icon: "📋",
  };
  const sev = SEVERITY_MAP[ticket.severity] || SEVERITY_MAP.medium;
  const statusInfo = STATUS_CONFIG[ticket.status] || {
    label: ticket.status?.replace("_", " ") || "Open",
    badgeClass: "bg-muted text-foreground border-border",
  };

  // Determine tracker stages based on actual ticket history/status
  const historyEvents = Array.isArray(ticket.activityTimeline) ? ticket.activityTimeline : [];
  const hasWaitingForUser =
    ticket.status === "waiting_for_user" ||
    historyEvents.some((e) => e.event === "waiting_for_user" || e.status === "waiting_for_user");

  const stageKeys = hasWaitingForUser
    ? ["open", "assigned", "in_progress", "waiting_for_user", "resolved", "closed"]
    : ["open", "assigned", "in_progress", "resolved", "closed"];

  const stageLabels = {
    open: "Ticket Raised",
    assigned: "Assigned",
    in_progress: "In Progress",
    waiting_for_user: "Waiting for User",
    resolved: "Resolved",
    closed: "Closed",
  };

  // Map normalized status
  let currentStatusNormalized = ticket.status === "ticket_raised" ? "open" : ticket.status || "open";
  if (currentStatusNormalized === "acknowledged") {
    currentStatusNormalized = "open";
  }
  let currentIndex = stageKeys.indexOf(currentStatusNormalized);
  if (currentIndex === -1) {
    if (currentStatusNormalized === "open") currentIndex = 0;
    else currentIndex = 0;
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Tickets
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTicket(true)}
            disabled={refreshing}
            className="h-8 text-xs gap-1.5 border-border hover:bg-muted/40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`} />
            <span>Refresh Status</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopyId(ticket.ticketId)}
            className="h-8 text-xs gap-1.5 border-emerald-200 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-50"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copy ID</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Ticket Summary Card (White Card with Green Accents) */}
      <Card className="border-border shadow-sm overflow-hidden bg-card">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 select-all tracking-wide">
                  {ticket.ticketId}
                </span>
                <Badge className={`text-xs px-2.5 py-0.5 border font-semibold ${statusInfo.badgeClass}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
                  {statusInfo.label}
                </Badge>
                <Badge className={`text-xs px-2.5 py-0.5 border font-medium ${sev.badgeClass}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${sev.dotClass} mr-1.5`} />
                  {sev.label} Severity
                </Badge>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
                {ticket.title}
              </h1>
            </div>

            <div className="text-right shrink-0 md:pl-4 md:border-l md:border-border text-xs text-muted-foreground space-y-1">
              <div>
                <span className="text-muted-foreground/70">Created: </span>
                <span className="font-medium text-foreground">{formatDateTime(ticket.createdAt)}</span>
              </div>
              <div>
                <span className="text-muted-foreground/70">Last Updated: </span>
                <span className="font-medium text-foreground">{formatDateTime(ticket.updatedAt)}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* 7 Key Metadata Fields Grid */}
        <CardContent className="pt-0 pb-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-3.5 rounded-xl bg-muted/20 border border-border text-xs">
            <div>
              <div className="text-muted-foreground/80 font-medium flex items-center gap-1">
                <TbTicket className="h-3.5 w-3.5 text-emerald-600" />
                <span>Ticket ID</span>
              </div>
              <div className="font-mono font-semibold text-foreground mt-0.5 truncate">{ticket.ticketId}</div>
            </div>

            <div>
              <div className="text-muted-foreground/80 font-medium flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-emerald-600" />
                <span>Category</span>
              </div>
              <div className="font-semibold text-foreground mt-0.5 truncate flex items-center gap-1">
                <span>{category.icon}</span>
                <span className="truncate">{category.label}</span>
              </div>
            </div>

            <div>
              <div className="text-muted-foreground/80 font-medium flex items-center gap-1">
                <Activity className="h-3.5 w-3.5 text-emerald-600" />
                <span>Severity</span>
              </div>
              <div className="font-semibold text-foreground mt-0.5 capitalize">{sev.label}</div>
            </div>

            <div>
              <div className="text-muted-foreground/80 font-medium flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                <span>Current Status</span>
              </div>
              <div className="font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 capitalize">
                {statusInfo.label}
              </div>
            </div>

            <div>
              <div className="text-muted-foreground/80 font-medium flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                <span>Created Date</span>
              </div>
              <div className="font-semibold text-foreground mt-0.5">{formatDate(ticket.createdAt)}</div>
            </div>

            <div>
              <div className="text-muted-foreground/80 font-medium flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                <span>Last Updated</span>
              </div>
              <div className="font-semibold text-foreground mt-0.5">{formatDate(ticket.updatedAt)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Status Tracker Card */}
      <Card className="border-border shadow-sm bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                Status Tracking
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time visual progress of your support request through pharmacy engineering stages.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs capitalize font-medium text-muted-foreground border-border">
              {stageKeys.length} Stages
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-2 pb-6">
          <div className="relative">
            {/* Horizontal Tracker for desktop / tablet */}
            <div className="hidden sm:grid sm:grid-flow-col sm:auto-cols-fr items-start gap-2 relative">
              {stageKeys.map((stageKey, idx) => {
                const isCompleted = idx < currentIndex;
                const isCurrent = idx === currentIndex;
                const isUpcoming = idx > currentIndex;
                const isLast = idx === stageKeys.length - 1;

                return (
                  <div key={stageKey} className="relative flex flex-col items-center text-center group">
                    {/* Connecting Bar */}
                    {!isLast && (
                      <div
                        className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 transition-colors duration-300 ${
                          idx < currentIndex ? "bg-emerald-600" : "bg-border"
                        }`}
                      />
                    )}

                    {/* Step Circle */}
                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                        isCompleted
                          ? "bg-emerald-600 text-white shadow-xs"
                          : isCurrent
                          ? "bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-600 text-emerald-700 dark:text-emerald-300 ring-4 ring-emerald-100 dark:ring-emerald-900/50 shadow-xs"
                          : "bg-muted text-muted-foreground/60 border border-border"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4 stroke-[3]" />
                      ) : isCurrent ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
                      ) : (
                        <span className="text-[11px] font-bold">{idx + 1}</span>
                      )}
                    </div>

                    {/* Stage Label */}
                    <div className="mt-2.5 px-1 space-y-0.5">
                      <div
                        className={`text-xs font-semibold leading-tight ${
                          isCompleted
                            ? "text-foreground"
                            : isCurrent
                            ? "text-emerald-700 dark:text-emerald-300 font-bold"
                            : "text-muted-foreground/70"
                        }`}
                      >
                        {stageLabels[stageKey]}
                      </div>
                      <div className="text-[10px]">
                        {isCompleted && <span className="text-emerald-600 font-medium">Completed</span>}
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                            Current Stage
                          </span>
                        )}
                        {isUpcoming && <span className="text-muted-foreground/60">Upcoming</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vertical Tracker for mobile screens */}
            <div className="sm:hidden space-y-3 pl-2">
              {stageKeys.map((stageKey, idx) => {
                const isCompleted = idx < currentIndex;
                const isCurrent = idx === currentIndex;
                const isUpcoming = idx > currentIndex;
                const isLast = idx === stageKeys.length - 1;

                return (
                  <div key={stageKey} className="flex items-start gap-3 relative">
                    {!isLast && (
                      <div
                        className={`absolute left-3.5 top-7 bottom-0 w-0.5 -z-0 ${
                          idx < currentIndex ? "bg-emerald-600" : "bg-border"
                        }`}
                      />
                    )}
                    <div
                      className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isCompleted
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                          ? "border-2 border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      ) : isCurrent ? (
                        <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div className="pt-0.5 pb-2">
                      <div
                        className={`text-xs font-semibold ${
                          isCompleted
                            ? "text-foreground"
                            : isCurrent
                            ? "text-emerald-700 font-bold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {stageLabels[stageKey]}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {isCompleted && "Completed"}
                        {isCurrent && "Current stage under investigation"}
                        {isUpcoming && "Pending prior stage completion"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Activity Timeline + Original Issue Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Activity Timeline (Dynamic History from Backend) */}
        <Card className="lg:col-span-7 border-border shadow-sm bg-card">
          <CardHeader className="pb-3 border-b border-border/70">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-600" />
                  Activity Timeline
                </CardTitle>
                <CardDescription className="text-xs">
                  Full recorded audit history and status updates for this ticket.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs font-mono">
                {historyEvents.length} {historyEvents.length === 1 ? "Event" : "Events"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-5 pb-6">
            {historyEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                No activity history recorded yet.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-emerald-200 dark:before:bg-emerald-900/60">
                {historyEvents.map((act, index) => {
                  const isLatest = index === historyEvents.length - 1;
                  const isFirst = index === 0;

                  return (
                    <div key={act._id || index} className="relative group">
                      {/* Timeline Dot/Icon */}
                      <div
                        className={`absolute -left-6 top-0 flex h-5 w-5 items-center justify-center rounded-full transition-transform ${
                          isLatest
                            ? "bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-900/50"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                        }`}
                      >
                        {isLatest ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                        ) : (
                          <Check className="h-3 w-3 stroke-[3]" />
                        )}
                      </div>

                      {/* Event Content Box */}
                      <div className="bg-muted/20 border border-border/80 rounded-xl p-3.5 space-y-1.5 transition-colors hover:bg-muted/30">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                              {act.title || act.event?.replace("_", " ")}
                            </span>
                            {isLatest && (
                              <Badge className="text-[10px] bg-emerald-600 text-white py-0 px-1.5">
                                Current
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {formatDateTime(act.timestamp)}
                          </span>
                        </div>

                        <p className="text-xs text-foreground/90 leading-relaxed">
                          {act.description}
                        </p>

                        {act.by && (
                          <div className="text-[10px] text-muted-foreground/80 flex items-center gap-1 pt-1 border-t border-border/40">
                            <User className="h-3 w-3 text-emerald-600" />
                            <span>Updated by: {act.by}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Original Issue Details (User Submitted Payload) */}
        <Card className="lg:col-span-5 border-border shadow-sm bg-card">
          <CardHeader className="pb-3 border-b border-border/70">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Original Issue Details
            </CardTitle>
            <CardDescription className="text-xs">
              The original problem and context submitted with this ticket.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Issue Title */}
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Issue Title
              </span>
              <div className="text-sm font-bold text-foreground mt-0.5">
                {ticket.title}
              </div>
            </div>

            {/* Category & Severity Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Issue Type</span>
                <div className="font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                  <span className="text-base">{category.icon}</span>
                  <span className="truncate">{category.label}</span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Severity Level</span>
                <div className="mt-0.5">
                  <Badge className={`text-xs capitalize border ${sev.badgeClass}`}>
                    {sev.label} Severity
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description Box */}
            <div className="pt-2 border-t border-border/60">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Description
              </span>
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed font-normal">
                {ticket.description}
              </div>
            </div>

            {/* Attached Screenshot if available */}
            {ticket.screenshot && (
              <div className="pt-2 border-t border-border/60">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
                  Attached Screenshot
                </span>
                <div className="relative group inline-block">
                  <img
                    src={ticket.screenshot}
                    alt="Ticket attachment preview"
                    className="max-h-44 w-auto rounded-xl border border-border object-cover cursor-pointer shadow-xs group-hover:opacity-90 transition-opacity"
                    onClick={() => onOpenScreenshot?.(ticket.screenshot)}
                  />
                  <button
                    type="button"
                    onClick={() => onOpenScreenshot?.(ticket.screenshot)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl cursor-pointer transition-opacity text-white text-xs font-medium gap-1.5"
                  >
                    <Eye className="h-4 w-4" />
                    Click to Enlarge
                  </button>
                </div>
              </div>
            )}

            {/* Submitter info */}
            <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span>Submitted by:</span>
                <span className="font-medium text-foreground">{ticket.userName || "Pharmacy Staff"}</span>
              </div>
              {ticket.userEmail && (
                <div className="flex items-center justify-between">
                  <span>Contact email:</span>
                  <span className="font-medium text-foreground">{ticket.userEmail}</span>
                </div>
              )}
              {ticket.orgName && (
                <div className="flex items-center justify-between">
                  <span>Store/Organization:</span>
                  <span className="font-medium text-foreground">{ticket.orgName}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
