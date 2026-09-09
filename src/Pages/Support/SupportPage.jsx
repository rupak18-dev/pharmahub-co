import { useState, useEffect, useRef, useCallback } from "react";
import {
  LifeBuoy,
  Send,
  UploadCloud,
  X,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  HelpCircle,
  FileText,
  Phone,
  Mail,
  ExternalLink,
  Search,
  Filter,
  Eye,
  Sparkles,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  Flame,
  AlertCircle,
  Info,
} from "lucide-react";
import { TbTicket, TbHeadset } from "react-icons/tb";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useDb } from "@/hooks/useDb";
import { PageHeader } from "@/Components/shared/PageHeader";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Badge } from "@/Components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { ticketService } from "@/lib/ticketService";

// Common issues pharmacy staff frequently face in PharmaHub
const ISSUE_TYPES = [
  {
    id: "billing_pos",
    label: "Billing, POS & Invoicing Issue",
    icon: "💳",
    desc: "Cash register errors, discount discrepancies, tax calculation, thermal bill printing",
  },
  {
    id: "inventory_stock",
    label: "Inventory & Stock Discrepancy",
    icon: "📦",
    desc: "Physical stock vs system count mismatch, negative balance, rack placement",
  },
  {
    id: "medicines_batches",
    label: "Medicine Catalog & Batch Tracking",
    icon: "💊",
    desc: "Barcode/QR scan failure, batch number collision, missing HSN or salt details",
  },
  {
    id: "expiry_returns",
    label: "Expiry & Returns Management",
    icon: "⏳",
    desc: "Near-expiry alerts, quarantine batch issue, credit note or vendor return error",
  },
  {
    id: "purchases_suppliers",
    label: "Purchase Orders & Supplier Sync",
    icon: "🚚",
    desc: "GRN creation failure, supplier ledger mismatch, purchase invoice upload issue",
  },
  {
    id: "user_access",
    label: "User Access, Roles & Permissions",
    icon: "🔐",
    desc: "Login failure, role capability restrictions, invitation link expired",
  },
  {
    id: "reports_export",
    label: "Reports & PDF/Excel Export",
    icon: "📊",
    desc: "GST report generation error, Excel export broken, sales analytics discrepancies",
  },
  {
    id: "hardware_integrations",
    label: "Integrations & Hardware Setup",
    icon: "🖨️",
    desc: "Thermal receipt printer, barcode reader, WhatsApp notification gateway",
  },
  {
    id: "system_bug",
    label: "System Bug / Technical Error",
    icon: "⚠️",
    desc: "Unexpected UI glitch, freeze, 500 error code, or performance lag",
  },
  {
    id: "general_inquiry",
    label: "General Inquiry / Feature Feedback",
    icon: "💬",
    desc: "How-to guidance, new pharmacy feature request, or process questions",
  },
];

const SEVERITY_LEVELS = [
  {
    id: "low",
    label: "Low",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
    desc: "Minor question or cosmetic issue. Pharmacy daily checkout and dispensing continue normally.",
    sla: "Resolution within 24-48 hours",
  },
  {
    id: "medium",
    label: "Medium",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    dotClass: "bg-blue-500",
    desc: "Feature partially impaired, but manual workaround is available. Regular sales still proceed.",
    sla: "Resolution within 12-24 hours",
  },
  {
    id: "high",
    label: "High",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500",
    desc: "Major workflow bottleneck or report failure. Multiple staff members impacted.",
    sla: "Priority response within 4-8 hours",
  },
  {
    id: "critical",
    label: "Critical",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    dotClass: "bg-rose-600 animate-pulse",
    desc: "System down, point-of-sale completely stopped, or severe billing halt at the pharmacy counter.",
    sla: "Urgent emergency response < 1 hour",
  },
];

const FAQS = [
  {
    q: "Barcode scanner not reading newly printed labels?",
    a: "Ensure the scanner is set to HID keyboard emulation mode and the label surface has no high-glare reflection. You can test scanning in any standard text field.",
  },
  {
    q: "How soon will a support specialist review my ticket?",
    a: "Critical issues receive an immediate response within 1 hour. High severity tickets are answered in 4 hours, and standard inquiries within 12-24 hours.",
  },
  {
    q: "Where do I track the progress of my raised ticket?",
    a: "Click on the 'My Tickets' tab right above. All tickets raised from your account appear with live status and your unique ticket ID.",
  },
  {
    q: "Need urgent phone assistance for live pharmacy counter down?",
    a: "You can dial our priority pharmacy support hotline at +91 (800) 742-7622 available 24x7 for critical point-of-sale failures.",
  },
];

export default function SupportPage() {
  const { user } = useAuth();
  const dbTickets = useDb((d) => d.tickets || []);

  const [activeTab, setActiveTab] = useState("raise");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [latestRaisedTicket, setLatestRaisedTicket] = useState(null);

  // Form states
  const [title, setTitle] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [reporterName, setReporterName] = useState(user?.name || "");
  const [reporterEmail, setReporterEmail] = useState(user?.email || "");

  // Screenshot state
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotFileName, setScreenshotFileName] = useState("");
  const [screenshotFileSize, setScreenshotFileSize] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Search & filter for tickets list
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fileInputRef = useRef(null);

  // Sync user info if user loads late
  useEffect(() => {
    if (user?.name && !reporterName) setReporterName(user.name);
    if (user?.email && !reporterEmail) setReporterEmail(user.email);
  }, [user]);

  // Load latest tickets on mount
  useEffect(() => {
    ticketService.listTickets().catch(() => {});
  }, []);

  // Handle clipboard paste of screenshots (Ctrl+V) anywhere on form
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            toast.success("Screenshot pasted from clipboard!");
          }
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const processImageFile = (file) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }
    // Limit to 6MB
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Screenshot size exceeds 6MB limit. Please compress or crop.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshot(event.target.result);
      setScreenshotFileName(file.name || `screenshot_${Date.now()}.png`);
      const sizeKb = (file.size / 1024).toFixed(1);
      setScreenshotFileSize(sizeKb > 1000 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotFileName("");
    setScreenshotFileSize("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopyTicketId = (ticketId) => {
    if (!ticketId) return;
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    toast.success(`Ticket ID ${ticketId} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setTitle("");
    setIssueType("");
    setDescription("");
    setSeverity("medium");
    removeScreenshot();
    setLatestRaisedTicket(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a short issue title.");
      return;
    }
    if (!issueType) {
      toast.error("Please select an issue category from the dropdown.");
      return;
    }
    if (!screenshot) {
      toast.error("Please attach a screenshot of the issue to proceed.");
      return;
    }
    if (!description.trim()) {
      toast.error("Please provide a description of the issue.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await ticketService.raiseTicket({
        title,
        issueType,
        description,
        severity,
        screenshot,
        userName: reporterName || user?.name || "Staff Member",
        userEmail: reporterEmail || user?.email || "",
        userRole: user?.role || "Staff",
        orgName: user?.orgName || "PharmaHub Pharmacy",
      });

      setLatestRaisedTicket(created);
      toast.success(`Ticket raised successfully! Ticket ID: ${created.ticketId}`);
    } catch (err) {
      toast.error(err.message || "Failed to raise support ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered tickets
  const filteredTickets = dbTickets.filter((ticket) => {
    const matchesSearch =
      !searchQuery ||
      ticket.ticketId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.issueType?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || ticket.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const selectedTypeInfo = ISSUE_TYPES.find((t) => t.id === issueType);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Help & Support Desk"
        description="Submit support tickets, report technical or inventory issues, and monitor active ticket resolution."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-emerald-200 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
              onClick={() => {
                window.location.href = "mailto:support@pharmahub.co?subject=Urgent%20PharmaHub%20Assistance";
              }}
            >
              <Mail className="h-4 w-4 text-emerald-600" />
              Email Desk
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-border"
              onClick={() => {
                window.open("tel:18007427622");
              }}
            >
              <Phone className="h-4 w-4 text-muted-foreground" />
              1800-PHARMA-HELP
            </Button>
          </div>
        }
      />

      {/* Support Overview Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/20 p-4 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-background dark:to-emerald-950/10">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <TbHeadset className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-emerald-800 dark:text-emerald-400">
              PharmaHub Support SLA
            </div>
            <div className="text-sm font-semibold text-foreground">Priority Live Helpdesk</div>
            <div className="text-xs text-muted-foreground">Standard 4h-24h turnaround</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">System Health</div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              All Systems Operational
            </div>
            <div className="text-xs text-muted-foreground">Database, POS, Billing API</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
            <TbTicket className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">Your Tickets</div>
            <div className="text-sm font-semibold text-foreground">
              {dbTickets.length} Total Raised
            </div>
            <div className="text-xs text-muted-foreground">
              {dbTickets.filter((t) => t.status === "open").length} currently open
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/80 p-1 border border-border">
          <TabsTrigger value="raise" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-emerald-700 font-medium">
            <LifeBuoy className="h-4 w-4" />
            Raise a Ticket
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-emerald-700 font-medium">
            <TbTicket className="h-4 w-4" />
            My Tickets ({dbTickets.length})
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-emerald-700 font-medium">
            <HelpCircle className="h-4 w-4" />
            Common Solutions & FAQ
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Raise a Ticket Form or Success State */}
        <TabsContent value="raise" className="space-y-6">
          {latestRaisedTicket ? (
            /* ==============================================================
               SUCCESS CONFIRMATION VIEW
               ============================================================== */
            <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/40 via-background to-background shadow-md dark:border-emerald-900/50">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 ring-8 ring-emerald-50 dark:ring-emerald-950/30">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Your ticket has been raised!
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Our dedicated pharmacy technical team has received your report and is investigating.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 max-w-2xl mx-auto">
                {/* Highlighted Ticket ID Banner */}
                <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/80 p-5 text-center dark:border-emerald-700 dark:bg-emerald-950/40">
                  <div className="text-xs uppercase tracking-wider font-semibold text-emerald-800 dark:text-emerald-400">
                    Generated Ticket Number
                  </div>
                  <div className="mt-1.5 flex items-center justify-center gap-3">
                    <span className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-emerald-900 dark:text-emerald-200 select-all">
                      {latestRaisedTicket.ticketId}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyTicketId(latestRaisedTicket.ticketId)}
                      className="h-9 px-3 gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-emerald-700/90 dark:text-emerald-400/90">
                    Please quote this ticket ID if contacting phone support or following up.
                  </p>
                </div>

                {/* Ticket Details Summary Card */}
                <div className="rounded-xl border border-border bg-card p-5 space-y-3.5 shadow-sm">
                  <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground">Issue Title</div>
                      <div className="text-base font-semibold text-foreground">
                        {latestRaisedTicket.title}
                      </div>
                    </div>
                    <Badge
                      className={`capitalize border text-xs px-2.5 py-0.5 font-medium ${
                        SEVERITY_LEVELS.find((s) => s.id === latestRaisedTicket.severity)?.badgeClass || ""
                      }`}
                    >
                      {latestRaisedTicket.severity} Severity
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block">Issue Category</span>
                      <span className="font-medium text-foreground">
                        {ISSUE_TYPES.find((t) => t.id === latestRaisedTicket.issueType)?.label || latestRaisedTicket.issueType}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Current Status</span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        Open / Under Review
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block">Description</span>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap mt-0.5 bg-muted/40 p-2.5 rounded-lg border border-border/50 text-xs">
                      {latestRaisedTicket.description}
                    </p>
                  </div>

                  {latestRaisedTicket.screenshot && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1.5">
                        Attached Screenshot of the Issue
                      </span>
                      <div className="relative inline-block group">
                        <img
                          src={latestRaisedTicket.screenshot}
                          alt="Issue Screenshot"
                          className="h-28 w-auto rounded-lg border border-border object-cover cursor-pointer shadow-sm group-hover:opacity-90 transition-opacity"
                          onClick={() => setPreviewImage(latestRaisedTicket.screenshot)}
                        />
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg cursor-pointer transition-opacity text-white text-xs gap-1"
                          onClick={() => setPreviewImage(latestRaisedTicket.screenshot)}
                        >
                          <Eye className="h-3.5 w-3.5" /> View Full
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 text-xs text-muted-foreground flex items-center justify-between border-t border-border">
                    <span>Raised by: {latestRaisedTicket.userName} ({latestRaisedTicket.userEmail || "No email"})</span>
                    <span>{new Date(latestRaisedTicket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-border pt-6">
                <Button
                  onClick={resetForm}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
                >
                  <LifeBuoy className="h-4 w-4" />
                  Raise Another Ticket
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("tickets")}
                  className="w-full sm:w-auto gap-2"
                >
                  <TbTicket className="h-4 w-4 text-emerald-600" />
                  View All Raised Tickets
                </Button>
              </CardFooter>
            </Card>
          ) : (
            /* ==============================================================
               RAISE TICKET FORM
               ============================================================== */
            <div className="max-w-3xl mx-auto">
              <Card className="border-border shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-emerald-600">
                      <LifeBuoy className="h-5 w-5" />
                      <CardTitle className="text-xl">Raise a Support Ticket</CardTitle>
                    </div>
                    <CardDescription>
                      Fill in the details below. Providing a screenshot helps our engineers resolve your pharmacy issue rapidly.
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <form id="raise-ticket-form" onSubmit={handleSubmit} className="space-y-5">
                      {/* Issue Title */}
                      <div className="space-y-1.5">
                        <label htmlFor="ticket-title" className="text-sm font-semibold text-foreground flex items-center justify-between">
                          <span>
                            Issue Title <span className="text-rose-500">*</span>
                          </span>
                          <span className="text-xs text-muted-foreground font-normal">
                            Brief 1-line summary
                          </span>
                        </label>
                        <Input
                          id="ticket-title"
                          placeholder="e.g. Barcode scanner not detecting Paracetamol batch expiry QR"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          maxLength={120}
                          className="h-10 text-sm focus-visible:ring-emerald-500"
                          required
                        />
                      </div>

                      {/* Issue Type Dropdown */}
                      <div className="space-y-1.5">
                        <label htmlFor="ticket-type" className="text-sm font-semibold text-foreground flex items-center justify-between">
                          <span>
                            Issue Type <span className="text-rose-500">*</span>
                          </span>
                          <span className="text-xs text-muted-foreground font-normal">
                            Select category
                          </span>
                        </label>
                        <Select value={issueType} onValueChange={setIssueType}>
                          <SelectTrigger id="ticket-type" className="h-10 text-sm focus:ring-emerald-500">
                            <SelectValue placeholder="Choose the category that best describes your problem..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-80">
                            {ISSUE_TYPES.map((type) => (
                              <SelectItem key={type.id} value={type.id} className="cursor-pointer py-2">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-base">{type.icon}</span>
                                  <span className="font-medium text-foreground">{type.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedTypeInfo && (
                          <div className="rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground flex items-start gap-2 border border-border/40">
                            <Info className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                            <span>{selectedTypeInfo.desc}</span>
                          </div>
                        )}
                      </div>

                      {/* Level of Severity - Simple buttons only without text/matter */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                          <span>
                            Level of Severity <span className="text-rose-500">*</span>
                          </span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {SEVERITY_LEVELS.map((level) => {
                            const isSelected = severity === level.id;
                            return (
                              <button
                                key={level.id}
                                type="button"
                                onClick={() => setSeverity(level.id)}
                                className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 px-3 text-sm font-medium transition-all ${
                                  isSelected
                                    ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 ring-2 ring-emerald-600/30 font-semibold shadow-xs"
                                    : "border-border bg-card text-foreground hover:bg-muted/40"
                                }`}
                              >
                                <span className={`h-2.5 w-2.5 rounded-full ${level.dotClass}`} />
                                <span>{level.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Screenshot of the Issue (Required upload + paste) */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span>Screenshot of the Issue</span>
                            <span className="text-rose-500">*</span>
                          </span>
                          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                            Tip: Press Ctrl+V to paste image directly
                          </span>
                        </label>

                        {!screenshot ? (
                          <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                              isDragging
                                ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40"
                                : "border-border hover:border-emerald-400/80 hover:bg-muted/30 bg-muted/10"
                            }`}
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={(e) => {
                                if (e.target.files?.[0]) processImageFile(e.target.files[0]);
                              }}
                              accept="image/png, image/jpeg, image/webp"
                              className="hidden"
                            />
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mb-2">
                              <UploadCloud className="h-6 w-6" />
                            </div>
                            <div className="text-sm font-medium text-foreground">
                              Click to upload or drag & drop screenshot
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Supports PNG, JPG, WEBP (up to 6MB) or paste directly from clipboard
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-3.5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={screenshot}
                                alt="Screenshot Preview"
                                className="h-16 w-16 rounded-lg object-cover border border-border cursor-pointer shadow-xs"
                                onClick={() => setPreviewImage(screenshot)}
                                title="Click to expand image"
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">
                                  {screenshotFileName || "screenshot.png"}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-[10px] py-0 px-1 border-emerald-200 text-emerald-700 bg-emerald-50">
                                    {screenshotFileSize}
                                  </Badge>
                                  <span>Ready to attach</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewImage(screenshot)}
                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeScreenshot}
                                className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="space-y-1.5">
                        <label htmlFor="ticket-desc" className="text-sm font-semibold text-foreground flex items-center justify-between">
                          <span>
                            Detailed Description <span className="text-rose-500">*</span>
                          </span>
                          <span className="text-xs text-muted-foreground font-normal">
                            {description.length} / 1500 chars
                          </span>
                        </label>
                        <Textarea
                          id="ticket-desc"
                          placeholder="Please describe what occurred, the steps to reproduce the issue, and what you expected to happen..."
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          maxLength={1500}
                          className="text-sm focus-visible:ring-emerald-500 leading-relaxed"
                          required
                        />
                      </div>

                      {/* Reporter Details (Pre-filled) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">
                            Reported By
                          </label>
                          <Input
                            value={reporterName}
                            onChange={(e) => setReporterName(e.target.value)}
                            placeholder="Your Name"
                            className="h-9 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">
                            Contact Email for Updates
                          </label>
                          <Input
                            type="email"
                            value={reporterEmail}
                            onChange={(e) => setReporterEmail(e.target.value)}
                            placeholder="staff@pharmacy.com"
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                    </form>
                  </CardContent>

                  <CardFooter className="flex items-center justify-between border-t border-border pt-4 bg-muted/10">
                    <p className="text-xs text-muted-foreground">
                      A unique ticket ID will be generated upon submission.
                    </p>
                    <Button
                      type="submit"
                      form="raise-ticket-form"
                      disabled={submitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium px-5 shadow-sm"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Raising Ticket...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Raise Ticket</span>
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
          )}
        </TabsContent>

        {/* Tab 2: My Raised Tickets */}
        <TabsContent value="tickets" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Raised Ticket History</CardTitle>
                  <CardDescription>
                    All support requests submitted from your pharmacy store.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Search ticket ID or title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 pl-8 w-44 sm:w-60 text-xs"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 w-32 text-xs">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TbTicket className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                  <div className="text-base font-medium text-foreground">No tickets found</div>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {searchQuery || statusFilter !== "all"
                      ? "No support tickets match your filter criteria."
                      : "You haven't raised any support tickets yet. Click 'Raise a Ticket' if you face any problem."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => {
                      resetForm();
                      setActiveTab("raise");
                    }}
                  >
                    <LifeBuoy className="h-4 w-4 text-emerald-600" />
                    Raise Your First Ticket
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredTickets.map((ticket) => {
                    const sev = SEVERITY_LEVELS.find((s) => s.id === ticket.severity);
                    const type = ISSUE_TYPES.find((t) => t.id === ticket.issueType);
                    return (
                      <div
                        key={ticket.ticketId || ticket.id}
                        className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 px-2 rounded-lg transition-colors"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 select-all">
                              {ticket.ticketId}
                            </span>
                            <Badge className={`text-[10px] capitalize border py-0 ${sev?.badgeClass || ""}`}>
                              {ticket.severity}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] capitalize text-muted-foreground">
                              {type?.label || ticket.issueType}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(ticket.createdAt).toLocaleDateString()} at{" "}
                              {new Date(ticket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-foreground">
                            {ticket.title}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {ticket.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                          {ticket.screenshot && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => setPreviewImage(ticket.screenshot)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Screenshot</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => handleCopyTicketId(ticket.ticketId)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy ID</span>
                          </Button>
                          <Badge
                            className={
                              ticket.status === "resolved"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : ticket.status === "in_progress"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }
                          >
                            {ticket.status === "in_progress" ? "In Progress" : ticket.status || "Open"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: FAQ & Troubleshooting */}
        <TabsContent value="faq" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Frequently Asked Questions & Quick Solutions</CardTitle>
              <CardDescription>
                Quick answers to common questions about PharmaHub store operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FAQS.map((faq, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-card p-4 space-y-2">
                    <div className="text-sm font-semibold text-foreground flex items-start gap-2">
                      <HelpCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{faq.q}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Still have unanswered questions or complex integrations?
              </span>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                onClick={() => {
                  resetForm();
                  setActiveTab("raise");
                }}
              >
                <LifeBuoy className="h-4 w-4" />
                Raise a Ticket Now
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Screenshot Lightbox / Zoom Dialog */}
      <Dialog open={Boolean(previewImage)} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-4 flex flex-col">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-600" />
              Screenshot Preview
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto flex items-center justify-center bg-black/5 rounded-lg p-2">
            {previewImage && (
              <img
                src={previewImage}
                alt="Enlarged Screenshot"
                className="max-h-[75vh] w-auto rounded-md object-contain shadow-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
