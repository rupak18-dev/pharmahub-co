import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Search,
  X,
  Plus,
  Clock,
  BarChart3,
  Save,
  Bell,
  Trash2,
  ChevronRight,
  FileBarChart2,
  Database,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router";
import { useDb } from "@/hooks/useDb";
import { reportService } from "@/lib/reportService";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import { PageHeader } from "@/Components/shared/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/Components/ui/dialog";
import { cn } from "@/lib/utils";
import ReportBuilder from "./ReportBuilder";
import ModulePickerModal from "./components/ModulePickerModal";
import { REPORT_CATEGORIES, REPORT_MODULES, getModule } from "./reportModules";
import {
  REPORT_CATEGORIES,
  REPORT_MODULES,
  getModule,
} from "./reportModules";

export const handle = { title: "Reports · PharmaHub" };

const CATEGORY_COLORS = {
  Sales: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-200/60" },
  Purchases: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-200/60" },
  Inventory: { bg: "bg-teal-50", icon: "text-teal-600", border: "border-teal-200/60" },
  Medicines: { bg: "bg-sky-50", icon: "text-sky-600", border: "border-sky-200/60" },
  Customers: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-200/60" },
  Suppliers: { bg: "bg-amber-50", icon: "text-amber-600", border: "border-amber-200/60" },
  Expiry: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-200/60" },
  GST: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-200/60" },
  Payments: { bg: "bg-cyan-50", icon: "text-cyan-600", border: "border-cyan-200/60" },
  Audit: { bg: "bg-rose-50", icon: "text-rose-600", border: "border-rose-200/60" },
};

const CATEGORY_ACCENT_BARS = {
  Sales: "bg-blue-400",
  Purchases: "bg-purple-400",
  Inventory: "bg-teal-400",
  Medicines: "bg-sky-400",
  Customers: "bg-emerald-400",
  Suppliers: "bg-amber-400",
  Expiry: "bg-orange-400",
  GST: "bg-green-400",
  Payments: "bg-cyan-400",
  Audit: "bg-rose-400",
};

export default function ReportsPage() {
  const dbData = useDb((d) => d);
  const currency = dbData.settings?.currency ?? "₹";
  const navigate = useNavigate();

  const [view, setView] = useState("list");
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [editingConfig, setEditingConfig] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isModulePickerOpen, setIsModulePickerOpen] = useState(false);

  const [savedReports, setSavedReports] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [exportLogs, setExportLogs] = useState([]);

  const loadSavedData = useCallback(async () => {
    const [saved, sched] = await Promise.all([
      reportService.getSavedReports(),
      reportService.getScheduledReports(),
    ]);
    setSavedReports(saved || []);
    setScheduledReports(sched || []);
  }, []);

  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return REPORT_MODULES.filter((m) => {
      if (selectedCategory !== "All" && m.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    }).sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
  }, [searchQuery, selectedCategory]);

  const logActivity = (title, action, fmt) => {
    setExportLogs((prev) => [
      {
        id: `act-${Date.now()}`,
        reportTitle: title,
        action,
        format: fmt,
        timestamp: new Date(),
      },
      ...prev,
    ]);
  };

  const handleSave = (cfg) => {
    setSavedReports((prev) => [cfg, ...prev.filter((x) => x.id !== cfg.id)]);
  };

  const handleDeleteSaved = async (id, e) => {
    e.stopPropagation();
    await reportService.deleteSavedReport(id);
    setSavedReports((prev) => prev.filter((r) => r.id !== id));
    toast.success("Saved report deleted.");
  };

  const handleDeleteSchedule = async (id, e) => {
    e.stopPropagation();
    await reportService.deleteSchedule(id);
    setScheduledReports((prev) => prev.filter((s) => s.id !== id));
    toast.success("Scheduled alert deleted.");
  };

  const openModuleBuilder = (moduleId) => {
    setActiveModuleId(moduleId);
    setEditingConfig(null);
    setIsModulePickerOpen(false);
    setView("builder");
  };

  const openSaved = (cfg) => {
    setActiveModuleId(cfg.module || cfg.moduleId);
    setEditingConfig(cfg);
    setView("builder");
  };

  if (view === "builder") {
    const module = getModule(activeModuleId);
    if (!module) return null;
    return (
      <ReportBuilder
        key={editingConfig?.id ?? activeModuleId}
        module={module}
        initialConfig={editingConfig}
        currency={currency}
        onExit={() => {
          setView("list");
          loadSavedData();
        }}
        onSave={handleSave}
        onActivity={logActivity}
      />
    );
  }

  const allCategories = [{ id: "All", label: "All" }, ...REPORT_CATEGORIES];

  return (
    <div className="space-y-6 w-full max-w-full pb-12">
      {/* Page Header */}
      <PageHeader
        title="Reports"
        description="Build, analyze, save, export and schedule pharmacy reports."
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs font-medium gap-1.5"
              onClick={() => setIsHistoryOpen(true)}
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Export History
              {exportLogs.length > 0 && (
                <Badge className="h-4 min-w-4 px-1 text-[10px] font-bold bg-primary/15 text-primary hover:bg-primary/15 border-0">
                  {exportLogs.length}
                </Badge>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs font-medium gap-1.5"
              onClick={() => setIsSavedOpen(true)}
            >
              <Save className="h-3.5 w-3.5 text-muted-foreground" />
              Saved Reports
              {savedReports.length > 0 && (
                <Badge className="h-4 min-w-4 px-1 text-[10px] font-bold bg-primary/15 text-primary hover:bg-primary/15 border-0">
                  {savedReports.length}
                </Badge>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs font-medium gap-1.5"
              onClick={() => navigate("/reports/data")}
            >
              <Database className="h-3.5 w-3.5 text-muted-foreground" />
              Report Data
            </Button>
            <Button
              size="sm"
              className="h-9 text-xs font-semibold gap-1.5"
              onClick={() => setIsModulePickerOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              New Report
            </Button>
          </>
        }
      />

      {/* Search + Category Filter Row */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 pr-8 h-9 text-sm w-full"
              placeholder="Search reports by name, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search report modules"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Chip Tabs — horizontal scrollable */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors border shrink-0",
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {cat.label}
            </button>
          ))}
          {selectedCategory !== "All" && (
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className="ml-1 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Clear category filter"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Scheduled Alerts — compact pinned section */}
      {scheduledReports.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Scheduled Alerts</h2>
              <span className="text-[11px] text-muted-foreground">({scheduledReports.length})</span>
              <span className="text-[11px] text-muted-foreground">
                ({scheduledReports.length})
              </span>
            </div>
            <button
              type="button"
              className="text-[11px] text-primary hover:underline"
              onClick={() => setIsSavedOpen(true)}
            >
              Manage
            </button>
          </div>
          <ul className="divide-y divide-border">
            {scheduledReports.slice(0, 3).map((sched) => (
              <li
                key={sched.id}
                className="flex items-center justify-between px-4 py-2.5 text-xs hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{sched.reportName}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {sched.frequency} at {sched.time}
                    {sched.recipients?.length > 0 &&
                      ` · ${sched.recipients.length} recipient${sched.recipients.length > 1 ? "s" : ""}`}
                    {sched.recipients?.length > 0 && ` · ${sched.recipients.length} recipient${sched.recipients.length > 1 ? "s" : ""}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      sched.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {sched.status === "active" ? (
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    ) : (
                      <AlertCircle className="h-2.5 w-2.5" />
                    )}
                    {sched.status ?? "active"}
                  </span>
                  <button
                    type="button"
                    className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                    onClick={(e) => handleDeleteSchedule(sched.id, e)}
                    aria-label="Delete schedule"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Report Module Directory */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Report Library</h2>
            {filteredModules.length > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {filteredModules.length} module{filteredModules.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {(searchQuery || selectedCategory !== "All") && (
            <button
              type="button"
              className="text-[11px] text-primary hover:underline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredModules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-3">
            <FileBarChart2 className="h-10 w-10 text-muted-foreground/25" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">No reports found</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                No report module matches your current search or category filter. Try adjusting your
                criteria.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
            >
              Browse all modules
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filteredModules.map((module) => {
              const Icon = module.icon;
              const colors = CATEGORY_COLORS[module.category] ?? {
                bg: "bg-muted",
                icon: "text-muted-foreground",
                border: "border-border",
              };
              const accentBar = CATEGORY_ACCENT_BARS[module.category] ?? "bg-primary";
              return (
                <li
                  key={module.id}
                  className="group flex items-center gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer relative"
                  onClick={() => openModuleBuilder(module.id)}
                >
                  {/* Left accent bar */}
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity",
                      accentBar,
                    )}
                  />

                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                      colors.bg,
                      colors.border,
                    )}
                  >
                    <Icon className={cn("h-4 w-4", colors.icon)} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground">{module.title}</h3>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium px-1.5 py-0 h-4 border-border text-muted-foreground"
                      >
                        {module.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {module.description}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModuleBuilder(module.id);
                      }}
                    >
                      Build Report
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Module Picker Modal */}
      <ModulePickerModal
        open={isModulePickerOpen}
        onOpenChange={setIsModulePickerOpen}
        onSelect={openModuleBuilder}
      />

      {/* Saved Reports Dialog */}
      <Dialog open={isSavedOpen} onOpenChange={setIsSavedOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Save className="h-4 w-4 text-primary" />
              Saved Reports
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Your saved custom report configurations. Click any to re-open in the builder.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {savedReports.length === 0 && scheduledReports.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <FileBarChart2 className="mx-auto h-9 w-9 text-muted-foreground/25" />
                <p className="text-sm font-medium text-foreground">No saved reports</p>
                <p className="text-xs text-muted-foreground">
                  Build and save a custom report to see it here.
                </p>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {savedReports.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Custom Reports ({savedReports.length})
                    </p>
                    <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                      {savedReports.map((cfg) => {
                        const mod = getModule(cfg.module || cfg.moduleId);
                        return (
                          <li
                            key={cfg.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
                            onClick={() => {
                              setIsSavedOpen(false);
                              openSaved(cfg);
                            }}
                          >
                            <div className="h-8 w-8 shrink-0 rounded-md border border-border bg-muted/50 flex items-center justify-center">
                              <BarChart3 className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {cfg.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {mod?.title ?? cfg.module}
                                {cfg.fields?.length > 0 &&
                                  ` · ${cfg.fields.length} field${cfg.fields.length > 1 ? "s" : ""}`}
                                {cfg.fields?.length > 0 && ` · ${cfg.fields.length} field${cfg.fields.length > 1 ? "s" : ""}`}
                                {(cfg.summarizeBy?.length > 0 || cfg.measures?.length > 0) &&
                                  ` · ${cfg.summarizeBy?.length ?? cfg.measures?.length} metric${(cfg.summarizeBy?.length ?? cfg.measures?.length) > 1 ? "s" : ""}`}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={(e) => handleDeleteSaved(cfg.id, e)}
                              aria-label="Delete saved report"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {scheduledReports.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      Scheduled Alerts ({scheduledReports.length})
                    </p>
                    <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                      {scheduledReports.map((sched) => (
                        <li
                          key={sched.id}
                          className="flex items-center justify-between px-4 py-3 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground truncate">
                              {sched.reportName}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {sched.frequency} at {sched.time}
                              {sched.recipients?.length > 0 &&
                                ` · ${sched.recipients.length} recipient${sched.recipients.length > 1 ? "s" : ""}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                                sched.status === "active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {sched.status ?? "active"}
                            </span>
                            <button
                              type="button"
                              className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                              onClick={(e) => handleDeleteSchedule(sched.id, e)}
                              aria-label="Delete schedule"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setIsSavedOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Export History
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Audit trail of report generations and exports in this session.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] overflow-y-auto -mx-6 px-6">
            {exportLogs.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Clock className="mx-auto h-8 w-8 text-muted-foreground/25" />
                <p className="text-sm text-muted-foreground italic">
                  No exports logged in this session.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden my-2">
                {exportLogs.map((act) => (
                  <li key={act.id} className="p-3 text-xs flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{act.reportTitle}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {act.action} · {format(new Date(act.timestamp), "HH:mm:ss")}
                      </p>
                    </div>
                    {act.format && (
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                        {act.format}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter className="border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setIsHistoryOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
