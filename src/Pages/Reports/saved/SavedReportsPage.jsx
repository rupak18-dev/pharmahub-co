import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  Save,
  Plus,
  Search,
  Trash2,
  Download,
  Loader2,
  FileSpreadsheet,
  FileText,
  BarChart3,
  X,
  FileBarChart2,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router";
import { useDb } from "@/hooks/useDb";
import { reportService } from "@/lib/reportService";
import { downloadCsv } from "@/lib/csv";
import { downloadXls } from "@/lib/xls";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import { PageHeader } from "@/Components/shared/PageHeader";
import { EmptyState } from "@/Components/shared/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/Components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/Components/ui/alert-dialog";
import ReportBuilder from "../ReportBuilder";
import ModulePickerModal from "../components/ModulePickerModal";
import { getModule, getFieldDef, getMeasureDef } from "../reportModules";
import { cn } from "@/lib/utils";

export const handle = { title: "Saved Reports · PharmaHub" };

const CATEGORY_COLORS = {
  Sales: { bg: "bg-blue-50 text-blue-700 border-blue-200" },
  Purchases: { bg: "bg-purple-50 text-purple-700 border-purple-200" },
  Inventory: { bg: "bg-teal-50 text-teal-700 border-teal-200" },
  Medicines: { bg: "bg-sky-50 text-sky-700 border-sky-200" },
  Customers: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Suppliers: { bg: "bg-amber-50 text-amber-700 border-amber-200" },
  Expiry: { bg: "bg-orange-50 text-orange-700 border-orange-200" },
  GST: { bg: "bg-green-50 text-green-700 border-green-200" },
  Payments: { bg: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  Audit: { bg: "bg-rose-50 text-rose-700 border-rose-200" },
};

function formatDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd MMM yyyy");
}

export default function SavedReportsPage() {
  const dbData = useDb((d) => d);
  const currency = dbData.settings?.currency ?? "₹";
  const navigate = useNavigate();

  const [savedReports, setSavedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list");
  const [activeConfig, setActiveConfig] = useState(null);
  const [isModulePickerOpen, setIsModulePickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportService.getSavedReports();
      setSavedReports(data || []);
    } catch {
      toast.error("Failed to load saved reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return savedReports;
    return savedReports.filter((r) => {
      const mod = getModule(r.module || r.moduleId);
      return (
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.module && r.module.toLowerCase().includes(q)) ||
        (mod?.title && mod.title.toLowerCase().includes(q)) ||
        (mod?.category && mod.category.toLowerCase().includes(q))
      );
    });
  }, [savedReports, search]);

  const handleOpenBuilder = (cfg) => {
    setActiveConfig(cfg);
    setView("builder");
  };

  const handleNewReport = (moduleId) => {
    const mod = getModule(moduleId);
    if (!mod) return;
    setIsModulePickerOpen(false);
    setActiveConfig({ module: moduleId, moduleId });
    setView("builder");
  };

  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadReport = async (e, cfg, formatType = "csv") => {
    e.stopPropagation();
    setDownloadingId(cfg.id);
    try {
      const modId = cfg.module || cfg.moduleId;
      const dateConfig = cfg.dateConfig || { presetId: "thisMonth" };
      const payload = {
        module: modId,
        dateRange: {
          from: dateConfig.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          to: dateConfig.to || new Date().toISOString(),
        },
        groupBy: cfg.fields ?? cfg.groupBy ?? [],
        fields: cfg.fields ?? cfg.groupBy ?? [],
        measures: (cfg.summarizeBy ?? cfg.measures ?? []).map((m) =>
          typeof m === "string" ? { field: m, aggregation: "SUM" } : m
        ),
        filters: cfg.filters ?? [],
        sort: cfg.sort ?? [],
      };
      const res = await reportService.generateCustomReport(payload);
      const rows = res?.rows || [];
      if (rows.length === 0) {
        toast.info("No records found for this report to download.");
        return;
      }
      const cleanName = (cfg.name || "report").toLowerCase().replace(/[^a-z0-9]+/g, "_");
      const filename = `${cleanName}_${format(new Date(), "yyyy-MM-dd")}`;
      if (formatType === "xlsx") {
        downloadXls(`${filename}.xlsx`, rows, cfg.name);
        toast.success(`Downloaded "${cfg.name}" (.xlsx)`);
      } else {
        downloadCsv(`${filename}.csv`, rows);
        toast.success(`Downloaded "${cfg.name}" (.csv)`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to download report.");
    } finally {
      setDownloadingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await reportService.deleteSavedReport(deleteTarget.id);
      setSavedReports((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success(`Saved report "${deleteTarget.name}" deleted.`);
    } catch {
      toast.error("Failed to delete saved report.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (view === "builder") {
    const modId = activeConfig?.module || activeConfig?.moduleId;
    const mod = getModule(modId);
    if (!mod) return null;
    return (
      <ReportBuilder
        key={activeConfig?.id ?? modId}
        module={mod}
        initialConfig={activeConfig}
        currency={currency}
        onExit={() => {
          setView("list");
          loadData();
        }}
        onSave={(updated) => {
          setSavedReports((prev) => [updated, ...prev.filter((x) => x.id !== updated.id)]);
        }}
      />
    );
  }

  const distinctModules = new Set(savedReports.map((r) => r.module || r.moduleId).filter(Boolean)).size;

  return (
    <div className="space-y-6 pb-12 bg-white min-h-screen p-6 rounded-2xl shadow-sm border border-border/40">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => navigate("/reports")}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Reports
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">Saved Reports</span>
      </div>

      {/* Page Header */}
      <PageHeader
        title="Saved Reports"
        description="View, run, edit, and export your saved custom report configurations."
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs font-medium gap-1.5"
              onClick={() => navigate("/reports")}
            >
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              Report Library
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

      {/* KPI stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white border border-border/80 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
            <Save className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">
              Total Saved
            </span>
            <span className="text-lg font-bold text-foreground block">
              {savedReports.length}
            </span>
          </div>
        </div>

        <div className="bg-white border border-border/80 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-teal-50 text-teal-600">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">
              Modules Covered
            </span>
            <span className="text-lg font-bold text-foreground block">
              {distinctModules}
            </span>
          </div>
        </div>

        <div className="bg-white border border-border/80 rounded-xl p-3 shadow-sm flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">
              Active Reports
            </span>
            <span className="text-lg font-bold text-foreground block">
              {filteredReports.length}
            </span>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 pr-8 h-9 text-xs"
          placeholder="Search saved reports by name or module..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-border/80 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">All Saved Reports</h2>
            <Badge variant="secondary" className="text-[10px] font-semibold">
              {filteredReports.length}
            </Badge>
          </div>
        </div>

        {savedReports.length === 0 && !loading ? (
          <div className="p-8">
            <EmptyState
              icon={FileBarChart2}
              title="No saved reports yet"
              description="Build a custom report from the library and click Save to access it here anytime."
              action={
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setIsModulePickerOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Build New Report
                </Button>
              }
            />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">No matching saved reports</p>
            <p className="text-xs text-muted-foreground">Try clearing your search query.</p>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setSearch("")}>
              Clear search
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 text-[11px] uppercase tracking-wide">Report Name</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide">Module</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide">Group By / Fields</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide">Metrics</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide">Date Preset</TableHead>
                <TableHead className="h-9 text-[11px] uppercase tracking-wide">Saved Date</TableHead>
                <TableHead className="h-9 text-right text-[11px] uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((cfg) => {
                const modId = cfg.module || cfg.moduleId;
                const mod = getModule(modId);
                const colors = CATEGORY_COLORS[mod?.category] ?? { bg: "bg-muted text-muted-foreground border-border" };
                const fieldsList = cfg.fields ?? cfg.groupBy ?? [];
                const measuresList = cfg.summarizeBy ?? cfg.measures ?? [];
                const datePresetLabel = cfg.dateConfig?.presetId || "Default";

                return (
                  <TableRow
                    key={cfg.id}
                    className="hover:bg-muted/30 cursor-pointer transition-colors group"
                    onClick={() => handleOpenBuilder(cfg)}
                  >
                    <TableCell className="py-2.5 font-semibold text-foreground text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <BarChart3 className="h-3.5 w-3.5" />
                        </div>
                        <span className="truncate max-w-[220px]">{cfg.name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
                          colors.bg,
                        )}
                      >
                        {mod?.title || modId}
                      </span>
                    </TableCell>

                    <TableCell className="py-2.5 text-xs text-muted-foreground">
                      {fieldsList.length > 0 ? (
                        <span className="truncate max-w-[200px] inline-block font-medium text-foreground">
                          {fieldsList
                            .map((f) => getFieldDef(mod, f)?.label || f)
                            .slice(0, 3)
                            .join(", ")}
                          {fieldsList.length > 3 ? ` +${fieldsList.length - 3}` : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell className="py-2.5 text-xs text-muted-foreground">
                      {measuresList.length > 0 ? (
                        <span className="truncate max-w-[180px] inline-block">
                          {measuresList
                            .map((m) => {
                              const k = typeof m === "string" ? m : m.field;
                              const agg = typeof m === "string" ? "SUM" : m.aggregation || "SUM";
                              const def = getMeasureDef(mod, k);
                              return agg !== "SUM" ? `${def?.label || k} (${agg})` : def?.label || k;
                            })
                            .slice(0, 2)
                            .join(", ")}
                          {measuresList.length > 2 ? ` +${measuresList.length - 2}` : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground/60" />
                        <span className="capitalize">{datePresetLabel}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(cfg.updatedAt || cfg.createdAt)}
                    </TableCell>

                    <TableCell className="py-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={downloadingId === cfg.id}
                              className="h-7 w-7 p-0 text-primary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              onClick={(e) => e.stopPropagation()}
                              title="Download report"
                              aria-label={`Download report ${cfg.name}`}
                            >
                              {downloadingId === cfg.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              onClick={(e) => handleDownloadReport(e, cfg, "csv")}
                              className="gap-2 text-xs cursor-pointer"
                            >
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              Download CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDownloadReport(e, cfg, "xlsx")}
                              className="gap-2 text-xs cursor-pointer"
                            >
                              <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
                              Download Excel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(cfg);
                          }}
                          aria-label={`Delete saved report ${cfg.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Module picker for "+ New Report" */}
      <ModulePickerModal
        open={isModulePickerOpen}
        onOpenChange={setIsModulePickerOpen}
        onSelect={handleNewReport}
      />

      {/* Delete confirmation alert dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete saved report "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this report configuration. Any scheduled alerts using this
              report may also be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
