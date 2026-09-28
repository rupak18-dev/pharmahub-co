import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Search,
  Filter,
  Eye,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Info,
  Activity,
  Plus,
  PlusCircle,
  Inbox,
  Sliders,
  Shield,
  Layers,
  FileImage,
  ArrowRight,
  Headset,
  Calendar,
  User,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  BookOpen,
  CircleHelp,
  HeartHandshake,
  MoreHorizontal,
  Loader2,
  AlertOctagon,
  Minus,
  TrendingDown,
} from "lucide-react";
import { TbTicket, TbHeadset } from "react-icons/tb";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useDb } from "@/hooks/useDb";
import { PageHeader } from "@/Components/shared/PageHeader";
import { TicketTrackingView } from "./components/TicketTrackingView";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { ticketService } from "@/lib/ticketService";
import { supportService } from "@/lib/supportService";
import { AdminSupportInbox } from "./components/AdminSupportInbox";
import { AdminTicketDetailView } from "./components/AdminTicketDetailView";
import { AdminSupportSettings } from "./components/AdminSupportSettings";
import {
  ISSUE_TYPES,
  SEVERITY_LEVELS,
  STATUS_CONFIG,
  FAQS,
  CategoryIcon,
  getCategoryConfig,
} from "./supportConfig";

export default function SupportPage() {
  const { user } = useAuth();
  const dbTickets = useDb((d) => d.tickets || []);

  // Dedicated Admin Support account check
  const ADMIN_SUPPORT_EMAIL = "pharmahub.team@gmail.com";
  const isAdmin = Boolean(
    user && user.email?.toLowerCase().trim() === ADMIN_SUPPORT_EMAIL
  );

  const [supportConfig, setSupportConfig] = useState(supportService.getDefaultSettings());
  const [activeTab, setActiveTab] = useState(isAdmin ? "inbox" : "home");
  const [adminSelectedTicketId, setAdminSelectedTicketId] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
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

  // Search & filters for tickets list
  const [searchQuery, setSearchQuery] = useState("");
  const [heroSearchQuery, setHeroSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [faqSearchQuery, setFaqSearchQuery] = useState("");

  const fileInputRef = useRef(null);

  // Load global support configuration on mount
  useEffect(() => {
    supportService
      .getSettings()
      .then((data) => {
        if (data) setSupportConfig(data);
      })
      .catch(() => {});
  }, []);

  // Ensure Admin default lands on inbox, while non-admin users cannot access admin tabs
  useEffect(() => {
    if (isAdmin && activeTab === "raise") {
      setActiveTab("inbox");
    } else if (!isAdmin && (activeTab === "inbox" || activeTab === "customize")) {
      setActiveTab("home");
    }
  }, [isAdmin, activeTab]);

  // Sync user info if user session loads late
  useEffect(() => {
    if (user?.name && !reporterName) setReporterName(user.name);
    if (user?.email && !reporterEmail) setReporterEmail(user.email);
  }, [user]);

  // Load latest tickets on mount for regular users
  useEffect(() => {
    if (!isAdmin && user?.email) {
      ticketService.listTickets({ userEmail: user.email }).catch(() => {});
    }
  }, [isAdmin, user?.email]);

  const handleViewScreenshot = async (e, tkt) => {
    e.stopPropagation();
    if (tkt.screenshot) {
      setPreviewImage(tkt.screenshot);
      return;
    }
    try {
      const full = await ticketService.getTicket(tkt.ticketId);
      if (full?.screenshot) {
        setPreviewImage(full.screenshot);
      } else {
        toast.info("No screenshot attached to this ticket.");
      }
    } catch {
      toast.error("Could not load screenshot preview.");
    }
  };

  // Support direct deep-linking or query params: ?ticketId=PH-TKT-2026-XXXXX or ?track=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const targetTicket = params.get("ticketId") || params.get("track");
      if (targetTicket) {
        setSelectedTicketId(targetTicket);
        setActiveTab("tickets");
      }
    } catch {
      // Ignore if URLSearchParams is unavailable
    }
  }, []);

  // Handle clipboard paste of screenshots (Ctrl+V) anywhere on the page
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

  const handleCopyTicketId = (ticketId, e) => {
    if (e) e.stopPropagation();
    if (!ticketId) return;
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    toast.success(`Ticket ID ${ticketId} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOther = issueType === "Other" || String(issueType).toLowerCase() === "other";

  const handleIssueTypeChange = (newType) => {
    setIssueType(newType);
    if (newType !== "Other" && String(newType).toLowerCase() !== "other") {
      setTitle("");
    }
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

    if (!issueType) {
      toast.error("Please select an issue type.");
      return;
    }

    const isOtherType = issueType === "Other" || String(issueType).toLowerCase() === "other";
    if (isOtherType && !title.trim()) {
      toast.error("Please enter an issue title.");
      return;
    }

    if (!description.trim()) {
      toast.error("Please provide a description of the issue.");
      return;
    }
    if (description.trim().length < 5) {
      toast.error("Description must be at least 5 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const categoryConfig = getCategoryConfig(issueType);
      const categoryLabel = categoryConfig?.label || issueType;

      const ticketPayload = {
        issueType: isOtherType ? "Other" : issueType,
        severity,
        description: description.trim(),
        screenshot: screenshot || null,
        userName: reporterName || user?.name || "Staff Member",
        userEmail: reporterEmail || user?.email || "",
        userRole: user?.role || "Staff",
        orgName: user?.orgName || "PharmaHub Pharmacy",
      };

      if (isOtherType) {
        ticketPayload.issueTitle = title.trim();
        ticketPayload.title = title.trim();
      } else {
        ticketPayload.title = categoryLabel;
      }

      const created = await ticketService.raiseTicket(ticketPayload);

      setLatestRaisedTicket(created);
      toast.success(`Ticket raised successfully! Ticket ID: ${created.ticketId}`);
    } catch (err) {
      toast.error(err.message || "Failed to raise support ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Active categories list with 'Other' guaranteed as the last item
  const activeCategories = useMemo(() => {
    const list =
      Array.isArray(supportConfig?.categories) && supportConfig.categories.length > 0
        ? supportConfig.categories
        : ISSUE_TYPES;

    const nonOther = list.filter((c) => (c.id || "").toLowerCase() !== "other");
    const otherItem =
      list.find((c) => (c.id || "").toLowerCase() === "other") ||
      ISSUE_TYPES.find((c) => (c.id || "").toLowerCase() === "other") || {
        id: "Other",
        label: "Other",
        iconName: "MoreHorizontal",
        desc: "",
      };

    return [...nonOther, otherItem];
  }, [supportConfig?.categories]);

  // Compute category count map for the current user's tickets
  const categoryCounts = useMemo(() => {
    const counts = {};
    dbTickets.forEach((t) => {
      const cat = t.issueType || "general_inquiry";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [dbTickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return dbTickets.filter((ticket) => {
      const matchesSearch =
        !searchQuery ||
        ticket.ticketId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.issueType?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || ticket.status?.toLowerCase() === statusFilter.toLowerCase();

      const matchesSeverity =
        severityFilter === "all" || ticket.severity?.toLowerCase() === severityFilter.toLowerCase();

      const matchesCategory =
        categoryFilter === "all" || ticket.issueType === categoryFilter;

      return matchesSearch && matchesStatus && matchesSeverity && matchesCategory;
    });
  }, [dbTickets, searchQuery, statusFilter, severityFilter, categoryFilter]);

  // FAQ filter
  const filteredFaqs = useMemo(() => {
    const query = faqSearchQuery || heroSearchQuery;
    if (!query.trim()) return FAQS;
    const q = query.toLowerCase();
    return FAQS.filter(
      (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q) || f.category?.toLowerCase().includes(q)
    );
  }, [faqSearchQuery, heroSearchQuery]);

  const activeTickets = dbTickets.filter(
    (t) => t.status === "open" || t.status === "in_progress" || t.status === "acknowledged" || t.status === "assigned"
  ).length;

  const selectedTypeInfo = activeCategories.find((t) => t.id === issueType);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 w-full min-w-0">
      {/* Admin Mode Indicator Banner */}
      {isAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50 via-emerald-100/40 to-teal-50 p-3.5 shadow-xs dark:border-emerald-800 dark:from-emerald-950/40 dark:via-emerald-900/20 dark:to-teal-950/30">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold shadow-xs">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <span>Support Administration Mode</span>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-emerald-400 bg-white dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono">
                  {user?.role || "Admin"}
                </Badge>
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Logged in as <span className="font-semibold">{user?.email}</span> • Full access to manage tickets and helpdesk settings.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={activeTab === "inbox" ? "default" : "outline"}
              onClick={() => {
                setAdminSelectedTicketId(null);
                setActiveTab("inbox");
              }}
              className={`h-7 text-xs gap-1 ${
                activeTab === "inbox"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "border-emerald-300 text-emerald-800 dark:text-emerald-200"
              }`}
            >
              <Inbox className="h-3.5 w-3.5" />
              <span>Ticket Inbox</span>
            </Button>
            <Button
              size="sm"
              variant={activeTab === "customize" ? "default" : "outline"}
              onClick={() => setActiveTab("customize")}
              className={`h-7 text-xs gap-1 ${
                activeTab === "customize"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "border-emerald-300 text-emerald-800 dark:text-emerald-200"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Customize Support</span>
            </Button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <PageHeader
        title={supportConfig.title || "Help & Support Desk"}
        description={supportConfig.description || "Submit support tickets, report technical or inventory issues, and monitor active ticket resolution."}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 px-3 text-xs gap-1.5 border-emerald-200 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100/60 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 shrink-0"
              onClick={() => {
                window.location.href = `mailto:${supportConfig.supportEmail || "pharmahub.team@gmail.com"}?subject=Urgent%20PharmaHub%20Assistance`;
              }}
            >
              <Mail className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{supportConfig.supportEmail || "Email Support"}</span>
              <span className="sm:hidden">Email</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 px-3 text-xs gap-1.5 border-border shrink-0"
              onClick={() => {
                window.open(`tel:${supportConfig.supportPhone || "18007427622"}`);
              }}
            >
              <Phone className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{supportConfig.supportPhone || "1800-PHARMA-HELP"}</span>
              <span className="sm:hidden">Call</span>
            </Button>
          </div>
        }
      />

      {/* STATUS CARDS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Priority Support */}
        <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
            <Headset className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Priority Support</div>
            <div className="text-sm font-semibold text-foreground truncate">{supportConfig.slaText || "4h – 24h Turnaround"}</div>
            <div className="text-[11px] text-muted-foreground">Critical issues &lt; 1 hour</div>
          </div>
        </div>

        {/* System Status */}
        <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">System Status</div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-sm font-semibold text-foreground">All Systems Operational</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Billing, Inventory, POS online</div>
          </div>
        </div>

        {/* My Tickets */}
        <div
          className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all duration-200 cursor-pointer group"
          onClick={() => setActiveTab("tickets")}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
            <TbTicket className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">My Tickets</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-foreground leading-none">{dbTickets.length}</span>
              <span className="text-xs text-muted-foreground">total</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{activeTickets}</span> active
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-emerald-600 transition-colors shrink-0" />
        </div>
      </div>

      {/* Main Two-Column Layout */}
      {/* ── MAIN TWO-COLUMN LAYOUT ── */}
      <div className="flex flex-col lg:flex-row gap-5 items-start w-full">

        {/* LEFT SIDEBAR */}
        <aside className="w-full lg:w-[260px] xl:w-72 shrink-0 space-y-3">

          {/* Primary CTA Button */}
          <button
            type="button"
            onClick={() => { setSelectedTicketId(null); resetForm(); setActiveTab("raise"); }}
            className="group w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm shadow-md shadow-emerald-200/60 dark:shadow-emerald-900/40 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-200/70 hover:-translate-y-0.5"
          >
            <PlusCircle className="h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
            <span>Raise a Support Ticket</span>
          </button>

          {/* Navigation Card */}
          <div className="rounded-2xl border border-border/70 bg-card shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Support Navigation</p>
            </div>
            <div className="px-2 pb-2 space-y-0.5">
              {/* Admin-only nav items */}
              {isAdmin && (
                <>
                  <SideNavItem
                    icon={Inbox}
                    label="Support Inbox"
                    active={activeTab === "inbox"}
                    onClick={() => { setAdminSelectedTicketId(null); setActiveTab("inbox"); }}
                  />
                  <SideNavItem
                    icon={Sliders}
                    label="Customize Desk"
                    active={activeTab === "customize"}
                    onClick={() => setActiveTab("customize")}
                  />
                  <div className="my-2 mx-2 border-t border-border/60" />
                </>
              )}

              {/* User nav items */}
              <SideNavItem
                icon={CircleHelp}
                label="Help Center"
                active={activeTab === "home" && !selectedTicketId}
                onClick={() => { setSelectedTicketId(null); setActiveTab("home"); }}
              />
              <SideNavItem
                icon={Inbox}
                label="My Tickets"
                active={activeTab === "tickets" && !selectedTicketId}
                badge={dbTickets.length}
                onClick={() => { setSelectedTicketId(null); setActiveTab("tickets"); }}
              />
              <SideNavItem
                icon={PlusCircle}
                label="Raise a Ticket"
                active={activeTab === "raise"}
                onClick={() => { setSelectedTicketId(null); resetForm(); setActiveTab("raise"); }}
              />
              <SideNavItem
                icon={BookOpen}
                label="Solutions & FAQs"
                active={activeTab === "faq"}
                onClick={() => { setSelectedTicketId(null); setActiveTab("faq"); }}
              />
            </div>
          </div>


          {/* Quick Contact Box */}
          <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 dark:from-emerald-950/30 dark:via-background dark:to-background p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <HeartHandshake className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Need Direct Assistance?</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              If your checkout counter is stalled or you encounter a hardware breakdown, reach out directly.
            </p>
            <div className="space-y-2">
              <a href={`mailto:${supportConfig.supportEmail || "pharmahub.team@gmail.com"}`}
                className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 hover:text-emerald-600 transition-colors group"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 dark:bg-emerald-900/40 group-hover:bg-emerald-100 transition-colors">
                  <Mail className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="truncate font-medium">{supportConfig.supportEmail || "pharmahub.team@gmail.com"}</span>
              </a>
              <a href={`tel:${supportConfig.supportPhone || "18007427622"}`}
                className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 hover:text-emerald-600 transition-colors group"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 dark:bg-emerald-900/40 group-hover:bg-emerald-100 transition-colors">
                  <Phone className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="font-medium">{supportConfig.supportPhone || "1800-PHARMA-HELP"}</span>
              </a>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 w-full space-y-5">
          {/* Admin Tabs Content */}
          {isAdmin && activeTab === "inbox" && (
            <div className="space-y-6">
              {adminSelectedTicketId ? (
                <AdminTicketDetailView
                  ticketId={adminSelectedTicketId}
                  onBack={() => setAdminSelectedTicketId(null)}
                  categories={activeCategories}
                />
              ) : (
                <AdminSupportInbox
                  onSelectTicket={(tId) => setAdminSelectedTicketId(tId)}
                  categories={activeCategories}
                />
              )}
            </div>
          )}

          {isAdmin && activeTab === "customize" && (
            <AdminSupportSettings
              onSettingsUpdated={(updated) => setSupportConfig(updated)}
            />
          )}

          {/* HOME VIEW */}
          {activeTab === "home" && (
            <div className="space-y-5">
              {/* Hero Section */}
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute -top-12 -right-12 h-56 w-56 rounded-full bg-emerald-100/50 dark:bg-emerald-900/20 blur-3xl" />
                  <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-emerald-50/60 dark:bg-emerald-950/20 blur-2xl" />
                </div>
                <div className="relative px-6 py-8 sm:px-10 sm:py-10">
                  <div className="max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 mb-4">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 tracking-wide">Support is online</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight tracking-tight mb-2">
                      How can we help you today?
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      Find answers, raise a support request, or track an existing issue — all in one place.
                    </p>
                    {/* Hero Search */}
                    <div className="relative max-w-lg">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={heroSearchQuery}
                        onChange={(e) => setHeroSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && heroSearchQuery.trim()) { setFaqSearchQuery(heroSearchQuery); setActiveTab("faq"); } }}
                        placeholder="Search for help, issues, or solutions..."
                        className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 shadow-sm transition-all"
                      />
                      {heroSearchQuery && (
                        <button type="button" onClick={() => { setFaqSearchQuery(heroSearchQuery); setActiveTab("faq"); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors">
                          Search
                        </button>
                      )}
                    </div>
                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-3 mt-5">
                      <button type="button" onClick={() => { resetForm(); setActiveTab("raise"); }}
                        className="group flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm shadow-emerald-200/50 dark:shadow-emerald-900/30 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                        <PlusCircle className="h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
                        <span>Raise a Ticket</span>
                      </button>
                      <button type="button" onClick={() => { setSelectedTicketId(null); setActiveTab("tickets"); }}
                        className="group flex items-center gap-2 h-10 px-5 rounded-xl border border-border bg-card hover:bg-muted/50 text-foreground text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                        <Inbox className="h-4 w-4 text-emerald-600" />
                        <span>Track My Tickets</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>


              {/* Popular Solutions Preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                    Popular Solutions
                  </h2>
                  <button type="button" onClick={() => setActiveTab("faq")}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                    <span>View all</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FAQS.slice(0, 4).map((faq, idx) => (
                    <FaqCard key={idx} faq={faq} onRaiseTicket={() => { resetForm(); setActiveTab("raise"); }} />
                  ))}
                </div>
              </div>

              {/* Help Now Banner */}
              <HelpNowBanner supportConfig={supportConfig} onRaiseTicket={() => { resetForm(); setActiveTab("raise"); }} />
            </div>
          )}

          {/* VIEW: My Raised Tickets (tickets tab) */}
          {activeTab === "tickets" && (
            <div className="space-y-4">
              {selectedTicketId ? (
                <TicketTrackingView
                  ticketId={selectedTicketId}
                  onBack={() => setSelectedTicketId(null)}
                  onOpenScreenshot={(img) => setPreviewImage(img)}
                />
              ) : (
                <div className="space-y-4">
                  {/* Search and Filters Toolbar */}
                  <div className="rounded-2xl border border-border/70 bg-card shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1">
                          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                          <Input
                            placeholder="Search by ticket ID, title, or issue details..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 pl-9 text-xs w-full"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Status Filter */}
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-9 w-32 text-xs">
                              <SelectValue placeholder="Status: All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="waiting_for_user">Waiting for User</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Severity Filter */}
                          <Select value={severityFilter} onValueChange={setSeverityFilter}>
                            <SelectTrigger className="h-9 w-32 text-xs">
                              <SelectValue placeholder="Severity: All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Severities</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Category Filter on Mobile / Toolbar */}
                          {categoryFilter !== "all" && (
                            <Badge
                              variant="secondary"
                              className="h-9 px-2.5 text-xs gap-1 font-normal border border-border"
                            >
                              <span>Category: {activeCategories.find((c) => c.id === categoryFilter)?.label || categoryFilter}</span>
                              <button
                                type="button"
                                onClick={() => setCategoryFilter("all")}
                                className="hover:text-rose-600 ml-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 text-xs px-2.5"
                            onClick={() => {
                              if (user?.email) {
                                ticketService.listTickets({ userEmail: user.email }).catch(() => {});
                                toast.success("Refreshed tickets list");
                              }
                            }}
                            title="Refresh ticket list"
                          >
                            <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>
                        </div>
                      </div>
                    </div>

                  {/* Tickets List */}
                  {filteredTickets.length === 0 ? (
                    <div className="rounded-2xl border border-border/70 bg-card shadow-sm p-12 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/60 dark:to-emerald-900/40 text-emerald-600 mb-4">
                        <Inbox className="h-7 w-7" />
                      </div>
                      <div className="text-base font-semibold text-foreground">No Support Tickets Found</div>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        {searchQuery || statusFilter !== "all" || severityFilter !== "all" || categoryFilter !== "all"
                          ? "No tickets match your active filter criteria. Try adjusting or clearing your search filters."
                          : "You have not submitted any support tickets yet. If you encounter any technical glitch or billing issue, raise a ticket."}
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-2">
                        {(searchQuery || statusFilter !== "all" || severityFilter !== "all" || categoryFilter !== "all") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setSearchQuery("");
                              setStatusFilter("all");
                              setSeverityFilter("all");
                              setCategoryFilter("all");
                            }}
                          >
                            Reset Filters
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                          onClick={() => {
                            resetForm();
                            setActiveTab("raise");
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Raise a Ticket</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredTickets.map((ticket) => {
                        const sev = SEVERITY_LEVELS.find((s) => s.id === ticket.severity) || SEVERITY_LEVELS[1];
                        const cat = getCategoryConfig(ticket.issueType);
                        const statusObj = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                        const StatusIcon = statusObj.icon;

                        return (
                          <div
                            key={ticket.ticketId || ticket.id}
                            onClick={() => setSelectedTicketId(ticket.ticketId)}
                            className="group rounded-2xl border border-border/70 hover:border-emerald-300 dark:hover:border-emerald-700 bg-card hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                          >
                            <div className="p-4 space-y-3">
                              {/* Top Meta Header: ID, Category, Severity, Status, Time */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Monospaced Ticket ID */}
                                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 select-all">
                                    <span>{ticket.ticketId}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopyTicketId(ticket.ticketId, e)}
                                      className="hover:text-emerald-950 dark:hover:text-emerald-100 p-0.5"
                                      title="Copy Ticket ID"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>

                                  {/* Category Badge with Vector Icon */}
                                  <Badge
                                    variant="outline"
                                    className="text-[11px] gap-1 font-medium text-foreground/80 bg-muted/30"
                                  >
                                    <CategoryIcon id={ticket.issueType} className="h-3 w-3 text-emerald-600" />
                                    <span>{cat.label}</span>
                                  </Badge>

                                  {/* Severity Badge */}
                                  <Badge
                                    variant="outline"
                                    className={`text-[11px] font-medium capitalize ${sev.badgeClass}`}
                                  >
                                    <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${sev.dotClass}`} />
                                    <span>{sev.label}</span>
                                  </Badge>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Status Badge with Vector Icon */}
                                  <Badge
                                    className={`text-[11px] font-medium gap-1 border ${statusObj.badgeClass}`}
                                  >
                                    <StatusIcon className="h-3 w-3" />
                                    <span>{statusObj.label}</span>
                                  </Badge>

                                  {/* Timestamp */}
                                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-muted-foreground/70" />
                                    <span>
                                      {new Date(ticket.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                                    </span>
                                  </span>
                                </div>
                              </div>

                              {/* Ticket Title & Description */}
                              <div className="space-y-1">
                                <h3 className="text-sm font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                  {ticket.title}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                  {ticket.description}
                                </p>
                              </div>

                              {/* Footer Meta & Actions */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="flex items-center gap-1 font-medium text-foreground/80">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                    <span>{ticket.userName || "Staff Member"}</span>
                                  </span>

                                  {(ticket.hasScreenshot || ticket.screenshot) && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleViewScreenshot(e, ticket)}
                                      className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                                    >
                                      <FileImage className="h-3 w-3" />
                                      <span>Screenshot attached</span>
                                    </button>
                                  )}

                                  {Array.isArray(ticket.messages) && ticket.messages.length > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[11px]">
                                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                      <span>{ticket.messages.length} replies</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2.5 text-xs font-medium border-emerald-300 text-emerald-800 dark:border-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTicketId(ticket.ticketId);
                                    }}
                                  >
                                    <Activity className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Track Status</span>
                                    <ChevronRight className="h-3 w-3 text-emerald-600" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW: Raise a Ticket (raise tab) */}
          {activeTab === "raise" && (
            <div className="space-y-4">
              {latestRaisedTicket ? (
                /* SUCCESS CONFIRMATION VIEW */
                <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50/40 via-background to-background shadow-sm dark:border-emerald-900/50 rounded-xl">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 ring-8 ring-emerald-50 dark:ring-emerald-950/30">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                      Support Ticket Raised Successfully!
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground max-w-md mx-auto">
                      Our technical helpdesk has received your request. A confirmation email has been dispatched.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-5 max-w-xl mx-auto">
                    {/* Ticket Number Highlight */}
                    <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/80 p-4 text-center dark:border-emerald-700 dark:bg-emerald-950/40 space-y-1">
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-emerald-800 dark:text-emerald-400">
                        Generated Ticket Number
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-emerald-900 dark:text-emerald-200 select-all">
                          {latestRaisedTicket.ticketId}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyTicketId(latestRaisedTicket.ticketId)}
                          className="h-8 px-2.5 gap-1 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300 text-xs"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy ID</span>
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Please quote this ticket ID when contacting the phone hotline or checking updates.
                      </p>
                    </div>

                    {/* Ticket Details Summary */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-3 text-xs shadow-xs">
                      <div className="flex items-start justify-between gap-2 border-b border-border pb-2.5">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                            {latestRaisedTicket.issueTitle || String(latestRaisedTicket.issueType).toLowerCase() === "other" ? "Issue Title" : "Issue / Subject"}
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {latestRaisedTicket.issueTitle || latestRaisedTicket.title}
                          </span>
                        </div>
                        <Badge className={`capitalize border text-[11px] ${SEVERITY_LEVELS.find((s) => s.id === latestRaisedTicket.severity)?.badgeClass || ""}`}>
                          {latestRaisedTicket.severity} Severity
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Issue Type</span>
                          <div className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                            <CategoryIcon id={latestRaisedTicket.issueType} className="h-3.5 w-3.5 text-emerald-600" />
                            <span>
                              {getCategoryConfig(latestRaisedTicket.issueType)?.label ||
                                (String(latestRaisedTicket.issueType).toLowerCase() === "other"
                                  ? "Other"
                                  : latestRaisedTicket.issueType)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Status</span>
                          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Open / In Queue
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-0.5">Description</span>
                        <p className="text-foreground/90 whitespace-pre-wrap bg-muted/30 p-2.5 rounded-lg border border-border/50 text-xs">
                          {latestRaisedTicket.description}
                        </p>
                      </div>

                      {latestRaisedTicket.screenshot && (
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                            Attached Screenshot
                          </span>
                          <img
                            src={latestRaisedTicket.screenshot}
                            alt="Screenshot"
                            className="h-24 w-auto rounded-lg border border-border object-cover cursor-pointer"
                            onClick={() => setPreviewImage(latestRaisedTicket.screenshot)}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col sm:flex-row items-center justify-center gap-2.5 border-t border-border pt-4">
                    <Button
                      onClick={() => {
                        setSelectedTicketId(latestRaisedTicket.ticketId);
                        setActiveTab("tickets");
                      }}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-medium text-xs h-9"
                    >
                      <Activity className="h-3.5 w-3.5" />
                      <span>Track Ticket Status</span>
                    </Button>
                    <Button
                      onClick={resetForm}
                      variant="outline"
                      className="w-full sm:w-auto gap-1.5 text-xs h-9"
                    >
                      <Plus className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Raise Another Ticket</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedTicketId(null);
                        setActiveTab("tickets");
                      }}
                      className="w-full sm:w-auto gap-1.5 text-xs h-9"
                    >
                      <Inbox className="h-3.5 w-3.5 text-emerald-600" />
                      <span>View All Tickets</span>
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                /* RAISE TICKET FORM */
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-border/60">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                        <LifeBuoy className="h-4.5 w-4.5 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-foreground">Raise a Support Ticket</h2>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Provide clear details and a screenshot so our team can diagnose your issue quickly.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <form id="raise-ticket-form" onSubmit={handleSubmit} className="space-y-5">
                      {/* Section 1: Classification */}
                      <div className="space-y-4">
                        {/* Issue Type Dropdown */}
                        <div className="space-y-1.5">
                          <label htmlFor="ticket-type" className="text-xs font-semibold text-foreground">
                            Issue Type <span className="text-rose-500">*</span>
                          </label>
                          <Select value={issueType} onValueChange={handleIssueTypeChange}>
                            <SelectTrigger id="ticket-type" className="h-9 text-xs focus:ring-emerald-500">
                              <SelectValue placeholder="Select the type of problem..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                              {activeCategories.map((type) => (
                                <SelectItem key={type.id} value={type.id} className="cursor-pointer py-1.5">
                                  <div className="flex items-center gap-2">
                                    <CategoryIcon id={type.id} className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <span className="text-xs font-medium text-foreground">{type.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedTypeInfo && selectedTypeInfo.desc && !isOther && (
                            <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground flex items-start gap-1.5 border border-border/40">
                              <Info className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                              <span>{selectedTypeInfo.desc}</span>
                            </div>
                          )}
                        </div>

                        {/* Issue Title (ONLY appears when isOther is true) */}
                        {isOther && (
                          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                            <label htmlFor="ticket-title" className="text-xs font-semibold text-foreground">
                              Issue Title <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              id="ticket-title"
                              placeholder="Briefly describe your issue"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              maxLength={120}
                              className="h-9 text-xs focus-visible:ring-emerald-500"
                              autoFocus
                            />
                          </div>
                        )}

                        {/* Level of Severity */}
                        <div className="space-y-2 pt-2 border-t border-border/60">
                          <label className="text-xs font-semibold text-foreground block">
                            Severity <span className="text-rose-500">*</span>
                            <span className="ml-2 text-[11px] text-muted-foreground font-normal">Impact on pharmacy operations</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {SEVERITY_LEVELS.map((level) => {
                              const isSelected = severity === level.id;
                              const severityIconProps = {
                                low: { icon: Minus, color: "text-emerald-600" },
                                medium: { icon: TrendingDown, color: "text-blue-600" },
                                high: { icon: AlertTriangle, color: "text-amber-600" },
                                critical: { icon: AlertOctagon, color: "text-rose-600" },
                              };
                              const { icon: SevIcon, color: sevColor } = severityIconProps[level.id] || { icon: Info, color: "text-muted-foreground" };
                              return (
                                <button
                                  key={level.id}
                                  type="button"
                                  onClick={() => setSeverity(level.id)}
                                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all duration-150 ${
                                    isSelected
                                      ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-sm ring-1 ring-emerald-600/20"
                                      : "border-border bg-card hover:bg-muted/30 hover:border-border"
                                  }`}
                                >
                                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
                                    isSelected
                                      ? "bg-white dark:bg-card border-emerald-200 dark:border-emerald-800"
                                      : "bg-muted/40 border-border/60"
                                  }`}>
                                    <SevIcon className={`h-4 w-4 ${isSelected ? sevColor : "text-muted-foreground"}`} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className={`text-xs font-semibold uppercase tracking-wide ${
                                        isSelected ? "text-foreground" : "text-foreground/70"
                                      }`}>{level.label}</span>
                                      {isSelected && (
                                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                                      {level.desc.split(".")[0]}.
                                    </p>
                                    <p className={`text-[10px] mt-1 font-medium ${
                                      level.id === "critical" ? "text-rose-600 dark:text-rose-400" :
                                      level.id === "high" ? "text-amber-600 dark:text-amber-400" :
                                      level.id === "medium" ? "text-blue-600 dark:text-blue-400" :
                                      "text-emerald-600 dark:text-emerald-400"
                                    }`}>{level.sla}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Description */}
                      <div className="space-y-4 pt-4 border-t border-border/60">
                        <div className="space-y-1.5">
                          <label htmlFor="ticket-desc" className="text-xs font-semibold text-foreground">
                            Description <span className="text-rose-500">*</span>
                            <span className="ml-2 text-[11px] text-muted-foreground font-normal">{description.length} / 1500 chars</span>
                          </label>
                          <Textarea
                            id="ticket-desc"
                            placeholder="Please describe what happened, steps to reproduce the issue, and batch number or invoice number if applicable..."
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={1500}
                            className="text-xs focus-visible:ring-emerald-500 leading-relaxed"
                          />
                        </div>
                      </div>

                      {/* Section 3: Visual Screenshot (Upload + Ctrl+V paste) */}
                      <div className="space-y-1.5 pt-4 border-t border-border/60">
                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span>Screenshot</span>
                          </span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                            Tip: Press Ctrl+V to paste screenshot directly
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
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mb-2">
                              <UploadCloud className="h-5 w-5" />
                            </div>
                            <div className="text-xs font-semibold text-foreground">
                              Click to upload or drag and drop screenshot
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              Supports PNG, JPG, WEBP (up to 6MB) or paste directly from clipboard
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={screenshot}
                                alt="Screenshot Preview"
                                className="h-14 w-14 rounded-lg object-cover border border-border cursor-pointer shadow-xs"
                                onClick={() => setPreviewImage(screenshot)}
                                title="Click to enlarge"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">
                                  {screenshotFileName || "screenshot.png"}
                                </div>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                  <Badge variant="outline" className="text-[9px] py-0 px-1 border-emerald-200 text-emerald-700 bg-emerald-50">
                                    {screenshotFileSize}
                                  </Badge>
                                  <span>Ready to submit</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewImage(screenshot)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={removeScreenshot}
                                className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Section 4: Contact details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-border/60">
                        <div>
                          <label className="text-xs font-semibold text-foreground block mb-1">
                            Reported By
                          </label>
                          <Input
                            value={reporterName}
                            onChange={(e) => setReporterName(e.target.value)}
                            placeholder="Your Name"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                            Contact Email for Updates
                          </label>
                          <Input
                            type="email"
                            value={reporterEmail}
                            onChange={(e) => setReporterEmail(e.target.value)}
                            placeholder="staff@pharmacy.com"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </form>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 px-5 py-4 bg-muted/10">
                    <p className="text-[11px] text-muted-foreground">
                      A unique ticket ID will be generated and emailed to you upon submission.
                    </p>
                    <Button
                      type="submit"
                      form="raise-ticket-form"
                      disabled={submitting}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white gap-2 font-semibold text-sm h-10 px-6 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Submit Support Ticket</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: Solutions & FAQs (faq tab) */}
          {activeTab === "faq" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-5 border-b border-border/60 bg-gradient-to-r from-emerald-50/50 via-background to-background dark:from-emerald-950/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-emerald-600" />
                        Solutions &amp; FAQs
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        Self-service solutions for common hardware, barcode scanner, and billing questions.
                      </p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search support articles..."
                        value={faqSearchQuery}
                        onChange={(e) => setFaqSearchQuery(e.target.value)}
                        className="h-9 pl-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  {filteredFaqs.length === 0 ? (
                    <div className="text-center py-10">
                      <HelpCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-foreground">No articles found</p>
                      <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredFaqs.map((faq, idx) => (
                        <FaqCard key={idx} faq={faq} onRaiseTicket={() => { resetForm(); setActiveTab("raise"); }} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="bg-muted/10 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4">
                  <span className="text-xs text-muted-foreground">Still have an unresolved problem or counter breakdown?</span>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs h-8"
                    onClick={() => { resetForm(); setActiveTab("raise"); }}>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Raise a Support Ticket</span>
                  </Button>
                </div>
              </div>
              <HelpNowBanner supportConfig={supportConfig} onRaiseTicket={() => { resetForm(); setActiveTab("raise"); }} />
            </div>
          )}
        </main>
      </div>

      {/* Screenshot Lightbox / Zoom Dialog */}
      <Dialog open={Boolean(previewImage)} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-4 flex flex-col">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-600" />
              <span>Screenshot Preview</span>
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

/* ================================================================
   HELPER COMPONENTS
   ================================================================ */

/**
 * Sidebar navigation item with icon container, label, badge, and active indicator.
 */
function SideNavItem({ icon: Icon, label, active, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group ${
        active
          ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
          : "text-foreground hover:bg-muted/60 hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
          active
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
            : "bg-muted/60 text-muted-foreground group-hover:bg-emerald-50 group-hover:text-emerald-600 dark:group-hover:bg-emerald-950/40"
        }`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {badge !== undefined && badge > 0 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg min-w-[20px] text-center font-mono ${
            active
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
              : "bg-muted text-muted-foreground"
          }`}>
            {badge}
          </span>
        )}
        {active && <div className="w-1 h-4 rounded-full bg-emerald-600 shrink-0" />}
      </div>
    </button>
  );
}

/**
 * FAQ card with question, answer, category badge, and "View solution" link.
 */
function FaqCard({ faq, onRaiseTicket }) {
  const categoryColors = {
    Hardware: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400",
    SLA: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400",
    Tracking: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400",
    Emergency: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400",
  };
  const colorClass = categoryColors[faq.category] || "bg-muted text-muted-foreground border-border";

  return (
    <div className="group rounded-2xl border border-border/70 bg-card p-4 space-y-2.5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 mt-0.5">
            <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <p className="text-xs font-semibold text-foreground leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            {faq.q}
          </p>
        </div>
        {faq.category && (
          <Badge variant="outline" className={`text-[10px] shrink-0 px-1.5 py-0 ${colorClass}`}>
            {faq.category}
          </Badge>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed pl-9 flex-1">
        {faq.a}
      </p>
      <div className="pl-9">
        <button type="button" onClick={onRaiseTicket}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors group/link"
        >
          <span>View solution</span>
          <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

/**
 * "Need Help Now?" bottom CTA banner.
 */
function HelpNowBanner({ supportConfig, onRaiseTicket }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 dark:from-emerald-950/30 dark:via-background dark:to-teal-950/20 p-6 shadow-sm">
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-100/40 dark:bg-emerald-900/20 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-200/60 dark:shadow-emerald-900/40">
            <TbHeadset className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Need help right now?</h3>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-sm leading-relaxed">
              Our support team is ready to help with billing, inventory, POS, medicine catalog, hardware and technical issues.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button type="button" onClick={onRaiseTicket}
            className="group flex items-center gap-2 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-200/50 dark:shadow-emerald-900/30 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          >
            <PlusCircle className="h-3.5 w-3.5 transition-transform group-hover:rotate-90 duration-200" />
            <span>Raise a Ticket</span>
          </button>
          <a href={`mailto:${supportConfig?.supportEmail || "pharmahub.team@gmail.com"}`}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all duration-200 hover:-translate-y-0.5"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Contact Support</span>
          </a>
        </div>
      </div>
    </div>
  );
}
