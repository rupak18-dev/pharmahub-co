import { useMemo, useState, useCallback } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Download,
  FileText,
  Save,
  Bell,
  Play,
  Plus,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { reportService } from "@/lib/reportService";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Badge } from "@/Components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
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
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/Components/ui/dialog";
import { cn } from "@/lib/utils";
import { downloadCsv } from "@/lib/csv";
import { downloadXls } from "@/lib/xls";
import { printHtml } from "@/lib/print";
import FilterBuilder from "./components/FilterBuilder";
import ScheduleReportModal from "./components/ScheduleReportModal";
import ReportPreviewTable from "./ReportPreviewTable";
import {
  DATE_PRESETS,
  resolveDateRange,
  generateReportTitle,
  getFieldDef,
  getMeasureDef,
} from "./reportModules";

const AGGREGATIONS = ["SUM", "COUNT", "AVG", "MIN", "MAX"];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ─── Tiny helpers ─── */
function SectionHeading({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </span>
      {action}
    </div>
  );
}

function FieldTag({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full hover:bg-primary/20 transition-colors p-0.5"
        aria-label={`Remove ${label}`}
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

function MeasureRow({ fieldKey, aggregation, def, onChangeAgg, onRemove }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">{def?.label ?? fieldKey}</p>
      </div>
      <Select
        value={aggregation}
        onValueChange={onChangeAgg}
      >
        <SelectTrigger className="h-7 w-24 text-[11px] px-2 bg-background border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AGGREGATIONS.map((a) => (
            <SelectItem key={a} value={a} className="text-xs">
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        aria-label="Remove metric"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function ReportBuilder({
  module,
  initialConfig,
  currency = "₹",
  onExit,
  onSave,
  onActivity,
}) {
  const [selectedFields, setSelectedFields] = useState(
    () => initialConfig?.fields ?? (module.fields[0] ? [module.fields[0].key] : []),
  );
  const [measures, setMeasures] = useState(() => {
    if (initialConfig?.measures) return initialConfig.measures;
    if (initialConfig?.summarizeBy) return initialConfig.summarizeBy;
    return module.measures[0] ? [{ field: module.measures[0].key, aggregation: "SUM" }] : [];
  });
  const [filters, setFilters] = useState(() => initialConfig?.filters ?? []);
  const [datePreset, setDatePreset] = useState(
    () =>
      initialConfig?.datePreset ??
      initialConfig?.dateConfig?.presetId ??
      module.defaultDatePreset ??
      "month",
  );
  const [customFrom, setCustomFrom] = useState(() => initialConfig?.dateConfig?.from || "");
  const [customTo, setCustomTo] = useState(() => initialConfig?.dateConfig?.to || "");
  const [reportName, setReportName] = useState(() => initialConfig?.name ?? "");

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const range = useMemo(() => {
    if (datePreset === "custom" && customFrom && customTo) {
      return { from: new Date(customFrom), to: new Date(customTo), presetId: "custom" };
    }
    return resolveDateRange(datePreset);
  }, [datePreset, customFrom, customTo]);

  const periodLabel =
    range.from && range.to
      ? `${format(range.from, "dd MMM yyyy")} – ${format(range.to, "dd MMM yyyy")}`
      : "Select Range";

  const activePresetLabel =
    datePreset === "custom"
      ? "Custom Range"
      : (DATE_PRESETS[datePreset]?.label ?? "This Month");

  const title = useMemo(
    () =>
      generateReportTitle(
        module,
        selectedFields,
        measures.map((m) => (typeof m === "string" ? m : m.field)),
      ),
    [module, selectedFields, measures],
  );

  const effectiveName = reportName.trim() || title;
  const canPreview = selectedFields.length > 0 && measures.length > 0;

  const tableColumns = useMemo(() => {
    const groupCols = selectedFields.map((key) => {
      const def = getFieldDef(module, key);
      return { key, label: def?.label || key, date: !!def?.date };
    });
    const metricCols = measures.map((m) => {
      const fieldKey = typeof m === "string" ? m : m.field;
      const agg = typeof m === "string" ? "SUM" : m.aggregation || "SUM";
      const def = getMeasureDef(module, fieldKey);
      return {
        key: fieldKey,
        label: agg !== "SUM" ? `${def?.label || fieldKey} (${agg})` : def?.label || fieldKey,
        money: !!def?.money && agg !== "COUNT",
      };
    });
    return [...groupCols, ...metricCols];
  }, [module, selectedFields, measures]);

  const fetchReportData = useCallback(async () => {
    if (!canPreview) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        module: module.id,
        selectedFields,
        groupBy: selectedFields,
        summarizeBy: measures,
        filters,
        dateFrom: range.from ? range.from.toISOString() : null,
        dateTo: range.to ? range.to.toISOString() : null,
      };
      const result = await reportService.generateCustomReport(payload);
      setReportData(result);
    } catch (err) {
      setError(err);
      toast.error("Failed to generate report. Please check your criteria.");
    } finally {
      setLoading(false);
    }
  }, [module.id, selectedFields, measures, filters, range, canPreview]);

  /* ── Group By helpers ── */
  const remainingFields = module.fields.filter((f) => !selectedFields.includes(f.key));

  const addField = (key) => {
    setSelectedFields((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const removeField = (key) => {
    setSelectedFields((prev) => prev.filter((f) => f !== key));
  };

  /* ── Measure helpers ── */
  const remainingMeasures = module.measures.filter(
    (m) => !measures.some((sel) => (typeof sel === "string" ? sel : sel.field) === m.key),
  );

  const addMeasure = (key) => {
    if (measures.some((m) => (typeof m === "string" ? m : m.field) === key)) return;
    setMeasures((prev) => [...prev, { field: key, aggregation: "SUM" }]);
  };

  const removeMeasure = (key) => {
    setMeasures((prev) => prev.filter((m) => (typeof m === "string" ? m : m.field) !== key));
  };

  const updateMeasureAgg = (key, newAgg) => {
    setMeasures((prev) =>
      prev.map((m) => {
        const fk = typeof m === "string" ? m : m.field;
        return fk === key ? { field: key, aggregation: newAgg } : m;
      }),
    );
  };

  /* ── Save ── */
  const handleSaveConfirm = async () => {
    const nameToSave = saveNameInput.trim() || effectiveName;
    if (!canPreview) {
      toast.error("Select at least one Group By field and one metric before saving.");
      return;
    }
    setIsSaving(true);
    try {
      const configToSave = {
        id: initialConfig?.id || `saved-${Date.now()}`,
        name: nameToSave,
        module: module.id,
        fields: selectedFields,
        groupBy: selectedFields,
        summarizeBy: measures,
        filters,
        dateConfig: { presetId: datePreset, from: customFrom, to: customTo },
        createdAt: new Date().toISOString(),
      };
      await reportService.saveReport(configToSave);
      onSave?.(configToSave);
      toast.success(`Saved "${nameToSave}"`);
      setIsSaveOpen(false);
      setSaveNameInput("");
    } catch {
      toast.error("Failed to save report. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Export ── */
  const handleExport = (fmt) => {
    if (!reportData || !reportData.rows || reportData.rows.length === 0) {
      toast.error("No report data to export. Run the report first.");
      return;
    }
    const filename = `${slugify(effectiveName)}_${format(range.from || new Date(), "yyyy-MM-dd")}`;
    if (fmt === "CSV") {
      downloadCsv(`${filename}.csv`, reportData.rows, tableColumns.map((c) => c.label));
    } else if (fmt === "Excel") {
      downloadXls(`${filename}.xlsx`, reportData.rows, effectiveName);
    } else if (fmt === "Print") {
      const head = tableColumns.map((c) => `<th style="padding:8px 12px;text-align:${c.money ? "right" : "left"}">${c.label}</th>`).join("");
      const body = reportData.rows
        .map(
          (r) =>
            `<tr>${tableColumns
              .map((c) =>
                c.money
                  ? `<td style="text-align:right;padding:6px 12px;font-family:monospace">${currency}${Number(r[c.key] ?? 0).toLocaleString("en-IN")}</td>`
                  : `<td style="padding:6px 12px">${r[c.key] ?? ""}</td>`,
              )
              .join("")}</tr>`,
        )
        .join("");
      printHtml(
        `<div style="font-family:Inter,system-ui,sans-serif;padding:32px;max-width:1100px;margin:0 auto">
          <h2 style="margin:0 0 4px;font-size:18px;font-weight:600">${effectiveName}</h2>
          <p style="margin:0 0 20px;color:#64748b;font-size:13px">${periodLabel} · ${module.title}</p>
          <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
            <thead style="background:#f8fafc">
              <tr style="border-bottom:2px solid #e2e8f0">${head}</tr>
            </thead>
            <tbody>${body}</tbody>
          </table>
          <p style="margin-top:16px;font-size:11px;color:#94a3b8">Generated by PharmaHub · ${format(new Date(), "dd MMM yyyy, HH:mm")}</p>
        </div>`,
      );
    }
    toast.success(`Exporting as ${fmt}…`);
    onActivity?.(effectiveName, "Exported", fmt);
  };

  const customDateInvalid =
    datePreset === "custom" && customFrom && customTo && new Date(customFrom) > new Date(customTo);

  return (
    <div className="flex flex-col gap-0 min-h-[calc(100dvh-4.5rem)]">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <button
          type="button"
          onClick={onExit}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Reports
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{module.title}</span>
        {canPreview && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary font-medium truncate max-w-[200px]">{title}</span>
          </>
        )}
      </div>

      {/* ── Title + Action Toolbar ── */}
      <div className="rounded-lg border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-4">
        {/* Title row */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-primary/8 text-primary"
          >
            <module.icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <Input
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              aria-label="Report name"
              placeholder={title}
              className="h-8 border-0 bg-transparent px-0 text-base font-semibold text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
            />
          </div>
          {/* Period badge */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors shrink-0",
                  "bg-muted/50 border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <CalendarDays className="h-3 w-3 text-primary" />
                <span className="hidden sm:inline">{activePresetLabel}</span>
                <span className="font-mono text-[10px] text-muted-foreground/70 hidden sm:inline">
                  ({periodLabel})
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3 p-4">
              <div>
                <p className="text-xs font-semibold text-foreground mb-0.5">Date Range</p>
                <p className="text-[11px] text-muted-foreground">
                  Filters records by{" "}
                  <span className="font-medium text-foreground">{module.dateField}</span>.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Preset</Label>
                <Select value={datePreset} onValueChange={setDatePreset}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DATE_PRESETS).map(([key, preset]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {preset.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom" className="text-xs">
                      Custom Range
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {datePreset === "custom" && (
                <div className="space-y-2 border-t border-border pt-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Start Date</Label>
                    <Input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">End Date</Label>
                    <Input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  {customDateInvalid && (
                    <p className="text-[10px] text-destructive font-medium">
                      Start date must be before or equal to end date.
                    </p>
                  )}
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Action toolbar row */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
          <Button
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5"
            onClick={fetchReportData}
            disabled={!canPreview || loading}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {loading ? "Running…" : "Run Report"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-medium gap-1.5"
            onClick={() => {
              setSaveNameInput(effectiveName);
              setIsSaveOpen(true);
            }}
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-medium gap-1.5"
            onClick={() => setIsScheduleOpen(true)}
          >
            <Bell className="h-3.5 w-3.5 text-primary" />
            Schedule
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40 text-xs">
              <DropdownMenuItem className="text-xs" onClick={() => handleExport("CSV")}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs" onClick={() => handleExport("Excel")}>
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs" onClick={() => handleExport("Print")}>
                Print / PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Main two-panel layout ── */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* LEFT — Configuration Panel */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-3">
          {/* GROUP BY section */}
          <div className="rounded-lg border border-border bg-card p-4">
            <SectionHeading
              action={
                remainingFields.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 text-xs max-h-52 overflow-y-auto">
                      {remainingFields.map((f) => (
                        <DropdownMenuItem
                          key={f.key}
                          className="text-xs"
                          onClick={() => addField(f.key)}
                        >
                          {f.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }
            >
              Group By
            </SectionHeading>

            {selectedFields.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-1">
                No fields selected. Click Add to choose a dimension.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {selectedFields.map((key) => {
                  const def = getFieldDef(module, key);
                  return (
                    <FieldTag
                      key={key}
                      label={def?.label ?? key}
                      onRemove={() => removeField(key)}
                    />
                  );
                })}
              </div>
            )}

            {selectedFields.length === 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors w-full justify-center"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add grouping field
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 text-xs max-h-52 overflow-y-auto">
                  {module.fields.map((f) => (
                    <DropdownMenuItem
                      key={f.key}
                      className="text-xs"
                      onClick={() => addField(f.key)}
                    >
                      {f.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* SUMMARIZE BY section */}
          <div className="rounded-lg border border-border bg-card p-4">
            <SectionHeading
              action={
                remainingMeasures.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 text-xs max-h-52 overflow-y-auto">
                      {remainingMeasures.map((m) => (
                        <DropdownMenuItem
                          key={m.key}
                          className="text-xs"
                          onClick={() => addMeasure(m.key)}
                        >
                          {m.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }
            >
              Summarize
            </SectionHeading>

            {measures.length === 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors w-full justify-center"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add metric
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52 text-xs max-h-52 overflow-y-auto">
                  {module.measures.map((m) => (
                    <DropdownMenuItem
                      key={m.key}
                      className="text-xs"
                      onClick={() => addMeasure(m.key)}
                    >
                      {m.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="space-y-1.5">
                {measures.map((mObj) => {
                  const fieldKey = typeof mObj === "string" ? mObj : mObj.field;
                  const agg = typeof mObj === "string" ? "SUM" : mObj.aggregation ?? "SUM";
                  const def = getMeasureDef(module, fieldKey);
                  return (
                    <MeasureRow
                      key={fieldKey}
                      fieldKey={fieldKey}
                      aggregation={agg}
                      def={def}
                      onChangeAgg={(newAgg) => updateMeasureAgg(fieldKey, newAgg)}
                      onRemove={() => removeMeasure(fieldKey)}
                    />
                  );
                })}
                {remainingMeasures.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors w-full justify-center"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add another metric
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-52 text-xs max-h-52 overflow-y-auto">
                      {remainingMeasures.map((m) => (
                        <DropdownMenuItem
                          key={m.key}
                          className="text-xs"
                          onClick={() => addMeasure(m.key)}
                        >
                          {m.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>

          {/* FILTER RULES section */}
          <div className="rounded-lg border border-border bg-card p-4">
            <SectionHeading>Filters</SectionHeading>
            <FilterBuilder
              filters={filters}
              availableFields={module.fields}
              onChange={setFilters}
            />
          </div>
        </div>

        {/* RIGHT — Preview Panel */}
        <div className="flex-1 min-w-0 flex flex-col rounded-lg border border-border bg-card overflow-hidden min-h-[400px] lg:min-h-0">
          {!canPreview ? (
            <div className="flex flex-1 items-center justify-center p-10">
              <div className="max-w-xs text-center space-y-3">
                <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Configure your report</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Select at least one{" "}
                    <span className="font-medium text-foreground">Group By</span> field and one{" "}
                    <span className="font-medium text-foreground">Summarize</span> metric, then
                    click <span className="font-medium text-foreground">Run Report</span>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <ReportPreviewTable
              columns={tableColumns}
              rows={reportData?.rows || []}
              totals={reportData?.totals || {}}
              currency={currency}
              moduleTitle={effectiveName}
              periodLabel={periodLabel}
              loading={loading}
              error={error}
              onRefresh={fetchReportData}
            />
          )}
        </div>
      </div>

      {/* Save Report Modal */}
      <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Save className="h-4 w-4 text-primary" />
              Save Report
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Save this report configuration so you can re-open and re-run it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="save-report-name" className="text-xs font-medium">
                Report Name
              </Label>
              <Input
                id="save-report-name"
                value={saveNameInput}
                onChange={(e) => setSaveNameInput(e.target.value)}
                placeholder={effectiveName}
                className="h-9 text-sm"
              />
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground space-y-1">
              <p>
                <span className="font-medium text-foreground">Module:</span> {module.title}
              </p>
              <p>
                <span className="font-medium text-foreground">Group By:</span>{" "}
                {selectedFields
                  .map((k) => getFieldDef(module, k)?.label ?? k)
                  .join(", ") || "—"}
              </p>
              <p>
                <span className="font-medium text-foreground">Metrics:</span>{" "}
                {measures
                  .map((m) => {
                    const k = typeof m === "string" ? m : m.field;
                    return getMeasureDef(module, k)?.label ?? k;
                  })
                  .join(", ") || "—"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 text-xs"
              onClick={() => setIsSaveOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 text-xs font-semibold gap-1.5"
              disabled={isSaving}
              onClick={handleSaveConfirm}
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {isSaving ? "Saving…" : "Save Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Modal */}
      <ScheduleReportModal
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        reportConfig={{
          name: effectiveName,
          module: module.id,
          fields: selectedFields,
          measures,
          filters,
          datePreset,
        }}
      />
    </div>
  );
}
