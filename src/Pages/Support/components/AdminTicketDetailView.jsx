import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  Clock,
  User,
  Mail,
  Building,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  MessageSquare,
  FileText,
  Layers,
  Sparkles,
  ChevronDown,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Textarea } from "@/Components/ui/textarea";
import { Input } from "@/Components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { ticketService } from "@/lib/ticketService";
import { supportService } from "@/lib/supportService";

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

const SEVERITY_CONFIG = {
  low: {
    label: "Low",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  medium: {
    label: "Medium",
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  high: {
    label: "High",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
  critical: {
    label: "Critical",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  },
};

const CANNED_RESPONSES = [
  {
    label: "Investigating",
    text: "Hello, our support engineering team has received your ticket and is actively investigating the issue. We will update you shortly.",
    status: "in_progress",
  },
  {
    label: "Request More Details",
    text: "Hello, could you please provide additional details or specific steps to reproduce the issue, along with any batch number or invoice reference if applicable?",
    status: "waiting_for_user",
  },
  {
    label: "Issue Resolved",
    text: "Hello, we have addressed and resolved the issue reported. Please test again on your end and let us know if everything is functioning as expected.",
    status: "resolved",
  },
];

export function AdminTicketDetailView({ ticketId, onBack, categories = [] }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reply state
  const [replyMessage, setReplyMessage] = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Screenshot modal
  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);

  // Custom activity note state
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityNoteTitle, setActivityNoteTitle] = useState("");
  const [activityNoteDesc, setActivityNoteDesc] = useState("");
  const [addingActivity, setAddingActivity] = useState(false);

  const fetchTicket = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const data = await ticketService.getTicket(ticketId);
        if (data) {
          setTicket(data);
          setReplyStatus(data.status || "open");
        }
      } catch (err) {
        toast.error("Failed to load ticket details");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [ticketId],
  );

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleCopyId = (tId) => {
    if (!tId) return;
    navigator.clipboard.writeText(tId);
    setCopied(true);
    toast.success(`Copied ticket ID ${tId}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = async (newStatus) => {
    if (!ticket || newStatus === ticket.status) return;
    setUpdatingStatus(true);
    try {
      const updated = await supportService.updateStatus(ticket.ticketId || ticket._id, {
        status: newStatus,
        description: `Admin updated status to ${newStatus}`,
      });
      setTicket(updated);
      setReplyStatus(newStatus);
      toast.success(`Ticket status changed to ${newStatus.replace(/_/g, " ")}`);
    } catch (err) {
      toast.error(err.message || "Failed to update ticket status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    setSendingReply(true);
    try {
      const updated = await supportService.replyTicket(ticket.ticketId || ticket._id, {
        message: replyMessage,
        status: replyStatus,
      });
      setTicket(updated);
      setReplyMessage("");
      toast.success("Reply sent to user successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const handleAddActivityNote = async (e) => {
    e.preventDefault();
    if (!activityNoteDesc.trim()) {
      toast.error("Please provide an activity description");
      return;
    }

    setAddingActivity(true);
    try {
      const updated = await supportService.addActivity(ticket.ticketId || ticket._id, {
        title: activityNoteTitle || "Support Investigation Note",
        description: activityNoteDesc,
      });
      setTicket(updated);
      setActivityNoteTitle("");
      setActivityNoteDesc("");
      setShowActivityForm(false);
      toast.success("Activity note added to timeline");
    } catch (err) {
      toast.error(err.message || "Failed to add activity note");
    } finally {
      setAddingActivity(false);
    }
  };

  const formatDateTime = (isoDate) => {
    if (!isoDate) return "—";
    try {
      return new Date(isoDate).toLocaleString("en-US", {
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

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
        Loading ticket details...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-4 text-center py-12">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <div className="text-base font-semibold text-foreground">Ticket Not Found</div>
        <p className="text-xs text-muted-foreground">
          The requested ticket ID could not be retrieved from the server.
        </p>
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Inbox
        </Button>
      </div>
    );
  }

  const stat = STATUS_CONFIG[ticket.status?.toLowerCase()] || STATUS_CONFIG.open;
  const sev = SEVERITY_CONFIG[ticket.severity?.toLowerCase()] || SEVERITY_CONFIG.medium;
  const historyEvents = Array.isArray(ticket.activityTimeline) ? ticket.activityTimeline : [];
  const messages = Array.isArray(ticket.messages) ? ticket.messages : [];

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Tickets Inbox
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTicket(true)}
            disabled={refreshing}
            className="h-8 text-xs gap-1.5 border-border"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`}
            />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopyId(ticket.ticketId)}
            className="h-8 text-xs gap-1.5 border-emerald-200 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="font-mono font-bold">{ticket.ticketId}</span>
          </Button>
        </div>
      </div>

      {/* Ticket Banner: ID, Status, Severity, Dates */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-extrabold text-foreground bg-muted/60 px-2.5 py-0.5 rounded border border-border">
                  {ticket.ticketId}
                </span>
                <Badge variant="outline" className={`text-xs font-semibold ${stat.badgeClass}`}>
                  {stat.label}
                </Badge>
                <Badge variant="outline" className={`text-xs font-semibold ${sev.badgeClass}`}>
                  Priority: {sev.label}
                </Badge>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">{ticket.title}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Layers className="h-3.5 w-3.5 text-emerald-600" />
                  {getCategoryLabel(ticket.issueType)}
                </span>
                <span>Created: {formatDateTime(ticket.createdAt)}</span>
                {ticket.updatedAt && (
                  <span>Last Updated: {formatDateTime(ticket.updatedAt)}</span>
                )}
              </div>
            </div>

            {/* Quick Status Action Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-muted/30 p-2.5 rounded-xl border border-border">
              <span className="text-xs font-semibold text-muted-foreground mr-1">
                Quick Status:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ticket.status !== "in_progress" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange("in_progress")}
                    className="h-7 text-[11px] px-2.5 border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                  >
                    In Progress
                  </Button>
                )}
                {ticket.status !== "waiting_for_user" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange("waiting_for_user")}
                    className="h-7 text-[11px] px-2.5 border-purple-300 text-purple-800 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300"
                  >
                    Waiting for User
                  </Button>
                )}
                {ticket.status !== "resolved" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange("resolved")}
                    className="h-7 text-[11px] px-2.5 border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                    Resolve
                  </Button>
                )}
                {ticket.status !== "closed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange("closed")}
                    className="h-7 text-[11px] px-2.5 border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                  >
                    Close
                  </Button>
                )}
                {["resolved", "closed"].includes(ticket.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange("open")}
                    className="h-7 text-[11px] px-2.5 border-border"
                  >
                    Reopen
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: User Profile & Issue Description */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Information Card (5 cols) */}
        <Card className="lg:col-span-4 border-border bg-card shadow-sm">
          <CardHeader className="p-4 pb-2 border-b border-border/80">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-600" />
              Reporter Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground">Full Name</span>
              <div className="font-semibold text-foreground text-sm">
                {ticket.userName || "PharmaHub User"}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground">Contact Email</span>
              <div className="font-medium text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{ticket.userEmail || "—"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
              <div>
                <span className="text-muted-foreground">User Role</span>
                <div className="font-medium text-foreground">
                  <Badge variant="secondary" className="text-[10px] mt-0.5">
                    {ticket.userRole || "Staff"}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Pharmacy Org</span>
                <div className="font-medium text-foreground truncate mt-0.5">
                  {ticket.orgName || "PharmaHub"}
                </div>
              </div>
            </div>

            {ticket.userId && (
              <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                <span>User ID: </span>
                <span className="font-mono">{ticket.userId}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Issue Description & Attachment (8 cols) */}
        <Card className="lg:col-span-8 border-border bg-card shadow-sm">
          <CardHeader className="p-4 pb-2 border-b border-border/80">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              Original Issue Description
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="rounded-lg bg-muted/30 p-3.5 border border-border whitespace-pre-wrap leading-relaxed text-foreground text-sm font-normal">
              {ticket.description}
            </div>

            {/* Screenshot / Attachment */}
            {ticket.screenshot && (
              <div className="space-y-2 pt-2 border-t border-border">
                <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                  Attached Screenshot
                </span>
                <div className="relative group max-w-sm rounded-lg overflow-hidden border border-border bg-black/5 dark:bg-white/5">
                  <img
                    src={ticket.screenshot}
                    alt="Ticket attachment"
                    className="max-h-48 w-full object-contain cursor-pointer transition-transform group-hover:scale-105"
                    onClick={() => setScreenshotModalOpen(true)}
                  />
                  <div
                    onClick={() => setScreenshotModalOpen(true)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold cursor-pointer"
                  >
                    Click to Enlarge
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reply to User & Messages Discussion Thread */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="p-4 border-b border-border/80">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              Customer Discussion & Support Replies
            </CardTitle>
            <Badge variant="secondary" className="text-xs font-mono">
              {messages.length} {messages.length === 1 ? "Message" : "Messages"}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Replies sent here are saved to the database and will instantly reflect on the user's ticket tracking page.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-5">
          {/* Conversation History */}
          {messages.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs bg-muted/20 rounded-xl border border-dashed border-border">
              No replies sent yet. Send the first response to the user below.
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-2">
              {messages.map((m, idx) => {
                const isAdmin = m.sender === "admin";
                return (
                  <div
                    key={m._id || idx}
                    className={`flex flex-col ${
                      isAdmin ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1 px-1">
                      <span className="font-semibold text-foreground">
                        {m.senderName}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] py-0 px-1.5 ${
                          isAdmin
                            ? "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {isAdmin ? "Admin Support" : "User"}
                      </Badge>
                      <span>• {formatDateTime(m.timestamp)}</span>
                    </div>

                    <div
                      className={`rounded-xl px-4 py-2.5 max-w-[85%] text-xs leading-relaxed ${
                        isAdmin
                          ? "bg-emerald-600 text-white rounded-tr-none shadow-sm"
                          : "bg-muted text-foreground rounded-tl-none border border-border"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.message}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reply Composer Form */}
          <form onSubmit={handleSendReply} className="space-y-3 pt-4 border-t border-border">
            {/* Canned Quick Responses */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Templates:
              </span>
              {CANNED_RESPONSES.map((cr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setReplyMessage(cr.text);
                    if (cr.status) setReplyStatus(cr.status);
                  }}
                  className="text-[11px] bg-muted/60 hover:bg-muted text-foreground px-2 py-1 rounded border border-border transition-colors"
                >
                  {cr.label}
                </button>
              ))}
            </div>

            <Textarea
              rows={3}
              placeholder="Type your official support reply to the user..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              className="text-xs resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Update status after reply:
                </span>
                <Select value={replyStatus} onValueChange={setReplyStatus}>
                  <SelectTrigger className="h-8 text-xs w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Keep Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting_for_user">Waiting for User</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={sendingReply || !replyMessage.trim()}
                className="h-8 text-xs px-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{sendingReply ? "Sending Reply..." : "Send Reply to User"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Full Activity Timeline & Internal Notes */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="p-4 border-b border-border/80 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              Ticket Activity & Audit Log
            </CardTitle>
            <CardDescription className="text-xs">
              Every status change, message, and support activity recorded for this ticket.
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowActivityForm(!showActivityForm)}
            className="h-8 text-xs gap-1"
          >
            <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
            <span>Add Activity Note</span>
          </Button>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Optional Activity Note Composer */}
          {showActivityForm && (
            <form
              onSubmit={handleAddActivityNote}
              className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2.5 mb-4"
            >
              <div className="text-xs font-semibold text-foreground">
                Add Support Activity / Internal Progress Note
              </div>
              <Input
                placeholder="Activity Title (e.g. Server Logs Checked, Contacted Vendor)"
                value={activityNoteTitle}
                onChange={(e) => setActivityNoteTitle(e.target.value)}
                className="h-8 text-xs"
              />
              <Textarea
                rows={2}
                placeholder="Details of the action taken..."
                value={activityNoteDesc}
                onChange={(e) => setActivityNoteDesc(e.target.value)}
                className="text-xs resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActivityForm(false)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={addingActivity || !activityNoteDesc.trim()}
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {addingActivity ? "Saving..." : "Save Activity Note"}
                </Button>
              </div>
            </form>
          )}

          {/* Timeline Events List */}
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200 dark:before:bg-emerald-900/60">
            {historyEvents.map((act, index) => (
              <div key={act._id || index} className="relative group">
                <div className="absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-emerald-100 dark:ring-emerald-900/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>

                <div className="bg-muted/20 border border-border rounded-lg p-3 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {act.title || act.event?.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDateTime(act.timestamp)}
                    </span>
                  </div>
                  <div className="text-xs text-foreground/80 whitespace-pre-wrap">
                    {act.description}
                  </div>
                  <div className="text-[10px] text-muted-foreground pt-0.5">
                    By: <span className="font-medium text-foreground">{act.by || "Support Team"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Screenshot Dialog / Modal */}
      {ticket.screenshot && (
        <Dialog open={screenshotModalOpen} onOpenChange={setScreenshotModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">Attached Screenshot</DialogTitle>
            </DialogHeader>
            <div className="p-2 max-h-[75vh] overflow-auto flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-lg">
              <img
                src={ticket.screenshot}
                alt="Ticket attachment full"
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
