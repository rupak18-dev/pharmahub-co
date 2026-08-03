import { isSameDay, startOfDay } from "date-fns";
import { db } from "./db";
import type {
  ActivityLog,
  AdjustmentAction,
  AdjustmentStatus,
  Audit,
  AuditCount,
  AuditStatus,
  AuditType,
  Batch,
  Medicine,
  RecommendedAction,
  Severity,
  StockAdjustment,
  VarianceItem,
  VarianceReason,
  VarianceStatus,
} from "./types";

export const BRANCHES = ["HQ · Main Street", "Downtown Annex", "Sector 15 Branch"];

export const AUDIT_TYPES: { value: AuditType; label: string; hint: string }[] = [
  { value: "full", label: "Full Store Audit", hint: "Every active batch across the branch" },
  { value: "category", label: "Category Audit", hint: "All stock in a single category" },
  { value: "shelf", label: "Shelf Audit", hint: "All stock on one shelf / rack" },
  { value: "batch", label: "Batch Audit", hint: "Specific batches (usually high value)" },
  { value: "cycle", label: "Cycle Count", hint: "A rotating subset of stock" },
  { value: "random", label: "Random Audit", hint: "Random spot-checks" },
];

export const AUDIT_TYPE_LABEL: Record<AuditType, string> = Object.fromEntries(
  AUDIT_TYPES.map((t) => [t.value, t.label]),
) as Record<AuditType, string>;

export const AUDIT_TYPE_DOT: Record<AuditType, string> = {
  full: "oklch(0.5 0.09 180)",
  category: "oklch(0.6 0.15 240)",
  shelf: "oklch(0.75 0.15 75)",
  batch: "oklch(0.62 0.15 155)",
  cycle: "oklch(0.6 0.15 240)",
  random: "oklch(0.66 0.19 45)",
};

export const AUDIT_STATUS_META: Record<AuditStatus, { label: string; chip: string; dot: string }> =
  {
    scheduled: {
      label: "Scheduled",
      chip: "bg-secondary text-secondary-foreground border-border font-medium",
      dot: "bg-muted-foreground",
    },
    in_progress: {
      label: "In Progress",
      chip: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 font-medium",
      dot: "bg-blue-500",
    },
    paused: {
      label: "Paused",
      chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-medium",
      dot: "bg-amber-500",
    },
    pending_review: {
      label: "Pending Review",
      chip: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-medium",
      dot: "bg-purple-500",
    },
    approved: {
      label: "Approved",
      chip: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30 font-medium",
      dot: "bg-teal-500",
    },
    completed: {
      label: "Completed",
      chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-medium",
      dot: "bg-emerald-500",
    },
    cancelled: {
      label: "Cancelled",
      chip: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 font-medium",
      dot: "bg-zinc-400",
    },
  };

export const VARIANCE_REASONS: { value: VarianceReason; label: string }[] = [
  { value: "billing_error", label: "Billing Error" },
  { value: "damaged", label: "Damaged" },
  { value: "theft", label: "Theft" },
  { value: "wrong_shelf", label: "Wrong Shelf" },
  { value: "supplier_short_supply", label: "Supplier Short Supply" },
  { value: "manual_entry_error", label: "Manual Entry Error" },
  { value: "unknown", label: "Unknown" },
];

export const VARIANCE_REASON_LABEL: Record<VarianceReason, string> = Object.fromEntries(
  VARIANCE_REASONS.map((r) => [r.value, r.label]),
) as Record<VarianceReason, string>;

export const RECOMMENDED_ACTIONS: { value: RecommendedAction; label: string }[] = [
  { value: "approve", label: "Approve Adjustment" },
  { value: "reject", label: "Reject Difference" },
  { value: "recount", label: "Request Recount" },
  { value: "transfer", label: "Move to Branch" },
  { value: "write_off", label: "Mark as Loss" },
];

export const RECOMMENDED_ACTION_LABEL: Record<RecommendedAction, string> = Object.fromEntries(
  RECOMMENDED_ACTIONS.map((r) => [r.value, r.label]),
) as Record<RecommendedAction, string>;

export const SEVERITY_BANDS: { max: number; severity: Severity }[] = [
  { max: 100, severity: "low" },
  { max: 500, severity: "medium" },
  { max: 2000, severity: "high" },
  { max: Infinity, severity: "critical" },
];

export function severityForValue(value: number): Severity {
  return SEVERITY_BANDS.find((b) => value < b.max)?.severity ?? "critical";
}

export const SEVERITY_META: Record<Severity, { label: string; chip: string }> = {
  low: { label: "Low Impact", chip: "bg-muted text-muted-foreground border-border" },
  medium: {
    label: "Medium Impact",
    chip: "bg-warning/20 text-warning-foreground border-warning/40",
  },
  high: { label: "High Impact", chip: "bg-critical/15 text-critical border-critical/30" },
  critical: {
    label: "Critical Impact",
    chip: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

export const VARIANCE_STATUS_META: Record<VarianceStatus, { label: string; chip: string }> = {
  pending: { label: "Pending Review", chip: "bg-muted text-muted-foreground border-border" },
  recount_requested: {
    label: "Recount Requested",
    chip: "bg-warning/20 text-warning-foreground border-warning/40",
  },
  recount_confirmed: {
    label: "Recount Confirmed",
    chip: "bg-info/15 text-info border-info/30",
  },
  approved: { label: "Approved", chip: "bg-success/15 text-success border-success/30" },
  rejected: { label: "Rejected", chip: "bg-muted text-muted-foreground border-border" },
};

export const ADJUSTMENT_STATUS_META: Record<
  AdjustmentStatus,
  { label: string; chip: string; step: number }
> = {
  pending_supervisor: {
    label: "Pending Supervisor",
    chip: "bg-warning/20 text-warning-foreground border-warning/40",
    step: 1,
  },
  pending_manager: {
    label: "Pending Manager",
    chip: "bg-critical/15 text-critical border-critical/30",
    step: 2,
  },
  approved: { label: "Approved", chip: "bg-info/15 text-info border-info/30", step: 3 },
  applied: {
    label: "Inventory Updated",
    chip: "bg-success/15 text-success border-success/30",
    step: 4,
  },
  rejected: { label: "Rejected", chip: "bg-muted text-muted-foreground border-border", step: 4 },
};

export const ADJUSTMENT_ACTION_LABEL: Record<AdjustmentAction, string> = {
  adjust: "Stock Adjustment",
  transfer: "Branch Transfer",
  write_off: "Mark as Loss",
};

export interface AuditProgress {
  verified: number;
  remaining: number;
  total: number;
  pct: number;
}

export function auditProgress(audit: Audit, counts: AuditCount[]): AuditProgress {
  const scope = audit.batchIds ?? [];
  const counted = new Set(
    counts.filter((c) => c.auditId === audit.id && !c.skipped).map((c) => c.batchId),
  );
  const verified = scope.filter((id) => counted.has(id)).length;
  const total = scope.length;
  const remaining = Math.max(0, total - verified);
  const pct = total === 0 ? 0 : Math.round((verified / total) * 100);
  return { verified, remaining, total, pct };
}

export function countsForAudit(auditId: string, counts: AuditCount[]): AuditCount[] {
  return counts
    .filter((c) => c.auditId === auditId)
    .sort((a, b) => new Date(a.countedAt).getTime() - new Date(b.countedAt).getTime());
}

export function countForBatch(
  auditId: string,
  batchId: string,
  counts: AuditCount[],
): AuditCount | undefined {
  return counts.find((c) => c.auditId === auditId && c.batchId === batchId);
}

export function buildAuditScope(opts: {
  type: AuditType;
  batches: Batch[];
  medicines: Medicine[];
  branch: string;
  categoryId?: string;
  shelf?: string;
  batchIds?: string[];
}): string[] {
  const medById = new Map(opts.medicines.map((m) => [m.id, m]));
  let list = opts.batches.filter(
    (b) => (b.branch ?? BRANCHES[0]) === opts.branch && b.currentStock > 0,
  );
  if (opts.categoryId)
    list = list.filter((b) => medById.get(b.medicineId)?.categoryId === opts.categoryId);
  if (opts.shelf) list = list.filter((b) => (b.shelfLocation ?? "") === opts.shelf);
  if (opts.batchIds?.length) list = list.filter((b) => opts.batchIds!.includes(b.id));
  if (opts.type === "cycle" && list.length > 15) list = list.slice(0, 15);
  if (opts.type === "random") list = shuffle(list).slice(0, 5);
  return list.map((b) => b.id);
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function deriveVariances(
  audit: Audit,
  counts: AuditCount[],
  batches: Batch[],
): VarianceItem[] {
  const batchById = new Map(batches.map((b) => [b.id, b]));
  const items: VarianceItem[] = [];
  for (const c of counts) {
    if (c.auditId !== audit.id) continue;
    if (c.skipped || c.physicalQty == null) continue;
    const diff = c.physicalQty - c.expectedQty;
    if (diff === 0) continue;
    const unitCost = batchById.get(c.batchId)?.purchasePrice ?? 0;
    const value = Math.abs(diff) * unitCost;
    items.push({
      id: db.uid(),
      auditId: audit.id,
      batchId: c.batchId,
      medicineId: c.medicineId,
      medicineName: c.medicineName,
      batchNumber: c.batchNumber,
      expectedQty: c.expectedQty,
      actualQty: c.physicalQty,
      difference: diff,
      unitCost,
      varianceValue: value,
      severity: severityForValue(value),
      verifiedBy: c.countedBy,
      verifiedByName: c.countedByName,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  }
  return items.sort((a, b) => b.varianceValue - a.varianceValue);
}

export function accuracyFor(audit: Audit, counts: AuditCount[]): number {
  const lines = counts.filter((c) => c.auditId === audit.id && c.physicalQty != null);
  if (!lines.length) return 0;
  const matched = lines.filter((c) => c.physicalQty === c.expectedQty).length;
  return Math.round((matched / lines.length) * 100);
}

export interface AuditMetrics {
  accuracy: number;
  pendingAudits: number;
  completedAudits: number;
  activeAudits: number;
  varianceValue: number;
  missingItems: number;
  extraItems: number;
  damagedItems: number;
  lastAuditDate: string | null;
}

export function auditMetrics(
  audits: Audit[],
  counts: AuditCount[],
  variances: VarianceItem[],
): AuditMetrics {
  const completed = audits.filter((a) => a.status === "completed");
  const lines = counts.filter((c) => c.physicalQty != null);
  const matched = lines.filter((c) => c.physicalQty === c.expectedQty).length;
  const accuracy = lines.length ? Math.round((matched / lines.length) * 100) : 0;

  const lastAudit = [...completed].sort(
    (a, b) =>
      new Date(b.completedAt ?? b.scheduledDate).getTime() -
      new Date(a.completedAt ?? a.scheduledDate).getTime(),
  )[0];

  return {
    accuracy,
    pendingAudits: audits.filter((a) => a.status === "pending_review").length,
    completedAudits: completed.length,
    activeAudits: audits.filter((a) => a.status === "in_progress" || a.status === "paused").length,
    varianceValue: variances.reduce((s, v) => s + v.varianceValue, 0),
    missingItems: variances.filter((v) => v.difference < 0).length,
    extraItems: variances.filter((v) => v.difference > 0).length,
    damagedItems: variances.filter((v) => v.reason === "damaged").length,
    lastAuditDate: lastAudit ? (lastAudit.completedAt ?? lastAudit.scheduledDate) : null,
  };
}

export interface HealthResult {
  score: number;
  label: string;
  tone: "success" | "info" | "warning" | "danger";
}

export function inventoryHealth(m: AuditMetrics): HealthResult {
  const score = Math.round(
    Math.min(m.accuracy, 100) * 0.5 +
      Math.max(0, 100 - Math.min(m.varianceValue / 6000, 1) * 100) * 0.2 +
      Math.max(0, 100 - Math.min(m.missingItems + m.damagedItems, 12) * (100 / 12)) * 0.15 +
      Math.max(0, 100 - Math.min(m.pendingAudits, 6) * (100 / 6)) * 0.15,
  );
  if (score >= 85) return { score, label: "Excellent", tone: "success" };
  if (score >= 70) return { score, label: "Good", tone: "info" };
  if (score >= 50) return { score, label: "Fair", tone: "warning" };
  return { score, label: "Poor", tone: "danger" };
}

export interface NamedPoint {
  name: string;
  value: number;
  count: number;
}

export function accuracyTrend(audits: Audit[], counts: AuditCount[]): NamedPoint[] {
  return audits
    .filter((a) => a.status === "completed")
    .sort((a, b) => new Date(a.completedAt ?? 0).getTime() - new Date(b.completedAt ?? 0).getTime())
    .slice(-8)
    .map((a) => ({ name: a.auditNumber, value: accuracyFor(a, counts), count: 0 }));
}

export function varianceTrend(
  variances: VarianceItem[],
): { date: string; value: number; count: number }[] {
  const map = new Map<string, { value: number; count: number }>();
  variances.forEach((v) => {
    const key = v.createdAt.slice(0, 10);
    const cur = map.get(key) ?? { value: 0, count: 0 };
    cur.value += v.varianceValue;
    cur.count += 1;
    map.set(key, cur);
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([date, v]) => ({ date, value: Math.round(v.value), count: v.count }));
}

export function varianceByCategory(
  variances: VarianceItem[],
  medicines: Medicine[],
  categories: { id: string; name: string }[],
): NamedPoint[] {
  const medById = new Map(medicines.map((m) => [m.id, m]));
  const catById = new Map(categories.map((c) => [c.id, c.name]));
  const map = new Map<string, { value: number; count: number }>();
  variances.forEach((v) => {
    const key = catById.get(medById.get(v.medicineId)?.categoryId ?? "") ?? "Uncategorized";
    const cur = map.get(key) ?? { value: 0, count: 0 };
    cur.value += v.varianceValue;
    cur.count += 1;
    map.set(key, cur);
  });
  return Array.from(map.entries())
    .map(([name, { value, count }]) => ({ name, value: Math.round(value), count }))
    .sort((a, b) => b.value - a.value);
}

export function branchComparison(
  audits: Audit[],
  counts: AuditCount[],
  variances: VarianceItem[],
): { name: string; accuracy: number; value: number }[] {
  const auditById = new Map(audits.map((a) => [a.id, a]));
  const byBranch = new Map<string, { auditIds: string[]; counts: AuditCount[]; value: number }>();
  audits.forEach((a) => {
    const cur = byBranch.get(a.branch) ?? {
      auditIds: [] as string[],
      counts: [] as AuditCount[],
      value: 0,
    };
    cur.auditIds.push(a.id);
    byBranch.set(a.branch, cur);
  });
  counts.forEach((c) => {
    const entry = byBranch.get(auditById.get(c.auditId)?.branch ?? "");
    if (entry) entry.counts.push(c);
  });
  variances.forEach((v) => {
    const a = audits.find((x) => x.id === v.auditId);
    if (!a) return;
    const entry = byBranch.get(a.branch);
    if (entry) entry.value += v.varianceValue;
  });
  return Array.from(byBranch.entries()).map(([name, e]) => {
    const lines = e.counts.filter((c) => c.physicalQty != null);
    const matched = lines.filter((c) => c.physicalQty === c.expectedQty).length;
    return {
      name,
      accuracy: lines.length ? Math.round((matched / lines.length) * 100) : 0,
      value: Math.round(e.value),
    };
  });
}

export function mostMismatched(
  variances: VarianceItem[],
  medicines: Medicine[],
  limit = 8,
): NamedPoint[] {
  const medById = new Map(medicines.map((m) => [m.id, m.name]));
  const map = new Map<string, { value: number; count: number }>();
  variances.forEach((v) => {
    const key = medById.get(v.medicineId) ?? v.medicineName;
    const cur = map.get(key) ?? { value: 0, count: 0 };
    cur.value += v.varianceValue;
    cur.count += 1;
    map.set(key, cur);
  });
  return Array.from(map.entries())
    .map(([name, { value, count }]) => ({ name, value: Math.round(value), count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function monthlyCompletion(
  audits: Audit[],
): { month: string; scheduled: number; completed: number }[] {
  const months = new Map<string, { scheduled: number; completed: number }>();
  audits.forEach((a) => {
    const d = new Date(a.scheduledDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = months.get(key) ?? { scheduled: 0, completed: 0 };
    cur.scheduled += 1;
    if (a.status === "completed") cur.completed += 1;
    months.set(key, cur);
  });
  return Array.from(months.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([key, v]) => {
      const d = new Date(`${key}-01`);
      return {
        month: d.toLocaleDateString(undefined, { month: "short" }),
        scheduled: v.scheduled,
        completed: v.completed,
      };
    });
}

export function topMissing(variances: VarianceItem[], limit = 6): NamedPoint[] {
  return aggregateByMedicine(
    variances.filter((v) => v.difference < 0),
    (v) => Math.abs(v.difference),
    limit,
  );
}

export function topDamaged(variances: VarianceItem[], limit = 6): NamedPoint[] {
  return aggregateByMedicine(
    variances.filter((v) => v.reason === "damaged"),
    (v) => Math.abs(v.difference),
    limit,
  );
}

function aggregateByMedicine(
  items: VarianceItem[],
  amount: (v: VarianceItem) => number,
  limit: number,
): NamedPoint[] {
  const map = new Map<string, { value: number; count: number }>();
  items.forEach((v) => {
    const cur = map.get(v.medicineName) ?? { value: 0, count: 0 };
    cur.value += amount(v);
    cur.count += 1;
    map.set(v.medicineName, cur);
  });
  return Array.from(map.entries())
    .map(([name, { value, count }]) => ({ name, value, count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function staffPerformance(counts: AuditCount[]): {
  name: string;
  items: number;
  matched: number;
  accuracy: number;
}[] {
  const map = new Map<string, { items: number; matched: number }>();
  counts.forEach((c) => {
    if (c.skipped || c.physicalQty == null) return;
    const cur = map.get(c.countedByName) ?? { items: 0, matched: 0 };
    cur.items += 1;
    if (c.physicalQty === c.expectedQty) cur.matched += 1;
    map.set(c.countedByName, cur);
  });
  return Array.from(map.entries())
    .map(([name, v]) => ({
      name,
      items: v.items,
      matched: v.matched,
      accuracy: v.items ? Math.round((v.matched / v.items) * 100) : 0,
    }))
    .sort((a, b) => b.items - a.items);
}

export function completionTime(audits: Audit[]): { name: string; hours: number }[] {
  return audits
    .filter((a) => a.status === "completed" && a.startedAt && a.completedAt)
    .map((a) => ({
      name: a.auditNumber,
      hours: Math.max(
        0.5,
        Math.round(
          ((new Date(a.completedAt!).getTime() - new Date(a.startedAt!).getTime()) / 3.6e6) * 10,
        ) / 10,
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function shelfAccuracy(counts: AuditCount[]): NamedPoint[] {
  const map = new Map<string, { items: number; matched: number }>();
  counts.forEach((c) => {
    if (c.skipped || c.physicalQty == null) return;
    const cur = map.get(c.shelf) ?? { items: 0, matched: 0 };
    cur.items += 1;
    if (c.physicalQty === c.expectedQty) cur.matched += 1;
    map.set(c.shelf, cur);
  });
  return Array.from(map.entries())
    .map(([name, v]) => ({
      name,
      value: v.items ? Math.round((v.matched / v.items) * 100) : 0,
      count: v.items,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

// ---------------------------------------------------------------------------
// AI Insights (heuristics, presented as "AI · Beta" previews)
// ---------------------------------------------------------------------------

export interface AuditInsightCard {
  id: string;
  title: string;
  detail: string;
  tone: "success" | "info" | "warning" | "danger";
  badge?: string;
}

export function repeatedVariance(variances: VarianceItem[], audits: Audit[]): AuditInsightCard[] {
  const byMed = new Map<string, { audits: Set<string>; value: number }>();
  variances.forEach((v) => {
    const cur = byMed.get(v.medicineName) ?? { audits: new Set<string>(), value: 0 };
    cur.audits.add(v.auditId);
    cur.value += v.varianceValue;
    byMed.set(v.medicineName, cur);
  });
  return Array.from(byMed.entries())
    .filter(([, v]) => v.audits.size >= 2)
    .map(([name, v]) => ({
      id: `repeat-${name}`,
      title: name,
      detail: `Mismatch detected in ${v.audits.size} separate audits · ${formatCurrency(v.value)} in total variance`,
      tone: "warning" as const,
    }))
    .sort((a, b) => a.detail.length - b.detail.length)
    .slice(0, 4);
}

export function highRiskCategories(
  variances: VarianceItem[],
  medicines: Medicine[],
  categories: { id: string; name: string }[],
): AuditInsightCard[] {
  const medById = new Map(medicines.map((m) => [m.id, m]));
  const catById = new Map(categories.map((c) => [c.id, c.name]));
  const map = new Map<string, { value: number; count: number }>();
  variances.forEach((v) => {
    const key = catById.get(medById.get(v.medicineId)?.categoryId ?? "") ?? "Uncategorized";
    const cur = map.get(key) ?? { value: 0, count: 0 };
    cur.value += v.varianceValue;
    cur.count += 1;
    map.set(key, cur);
  });
  return Array.from(map.entries())
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 4)
    .map(([name, v]) => ({
      id: `cat-${name}`,
      title: name,
      detail: `${v.count} variance line(s) · ${formatCurrency(v.value)} — prioritise a category audit`,
      tone: v.value >= 2000 ? ("danger" as const) : ("warning" as const),
    }));
}

export function suspiciousActivity(
  variances: VarianceItem[],
  adjustments: StockAdjustment[],
): AuditInsightCard[] {
  const flags: string[] = [];
  let value = 0;
  variances.forEach((v) => {
    if (v.reason === "theft" || v.reason === "billing_error") {
      flags.push(`${v.medicineName} · ${VARIANCE_REASON_LABEL[v.reason]}`);
      value += v.varianceValue;
    }
  });
  if (!flags.length) return [];
  return [
    {
      id: "suspicious",
      title: "Suspicious inventory activity",
      detail: `${flags.length} high-risk variance line(s): ${flags.slice(0, 3).join(", ")}${flags.length > 3 ? "…" : ""} · ${formatCurrency(value)}`,
      tone: "danger",
    },
  ];
}

export function recommendedReAudit(variances: VarianceItem[]): AuditInsightCard[] {
  const open = variances.filter((v) => v.status === "pending" || v.status === "recount_requested");
  const byMed = aggregateByMedicine(open, (v) => Math.abs(v.difference), 5);
  return byMed.map((m) => ({
    id: `reaudit-${m.name}`,
    title: m.name,
    detail: `${m.count} unresolved variance line(s) worth ${formatCurrency(m.value)} — re-audit recommended`,
    tone: m.value >= 1000 ? ("warning" as const) : ("info" as const),
  }));
}

export function suggestedCycleCount(
  batches: Batch[],
  audits: Audit[],
  medicines: Medicine[],
): AuditInsightCard[] {
  const auditedBatchIds = new Set(
    audits.filter((a) => a.status !== "cancelled").flatMap((a) => a.batchIds),
  );
  const cands = batches
    .filter((b) => b.currentStock > 0 && b.status !== "disposed")
    .filter((b) => !auditedBatchIds.has(b.id))
    .map((b) => ({ batch: b, value: b.currentStock * b.purchasePrice }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  return cands.map(({ batch, value }) => {
    const med = medicines.find((m) => m.id === batch.medicineId);
    return {
      id: `cycle-${batch.id}`,
      title: med?.name ?? "—",
      detail: `${batch.batchNumber} · ${value >= 1000 ? formatCurrency(value) : ""}${value >= 1000 ? " · " : ""}high value, not yet cycle-counted`,
      tone: "info" as const,
    };
  });
}

export interface ParetoItem {
  name: string;
  value: number;
  pct: number;
  cumulativePct: number;
}

export function topMismatchContribution(variances: VarianceItem[], limit = 5): ParetoItem[] {
  const total = variances.reduce((s, v) => s + v.varianceValue, 0);
  if (!total) return [];
  const sorted = mostMismatched(variances, [], 20);
  let running = 0;
  return sorted.slice(0, limit).map((m) => {
    running += m.value;
    return {
      name: m.name,
      value: m.value,
      pct: Math.round((m.value / total) * 1000) / 10,
      cumulativePct: Math.round((running / total) * 1000) / 10,
    };
  });
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

export interface CalendarDay {
  key: string;
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  audits: Audit[];
}

export function calendarGrid(year: number, month: number, audits: Audit[]): CalendarDay[] {
  const first = new Date(year, month, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: CalendarDay[] = [];
  const today = new Date();

  const byDate = new Map<string, Audit[]>();
  audits.forEach((a) => {
    const d = new Date(a.scheduledDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    byDate.set(key, [...(byDate.get(key) ?? []), a]);
  });

  for (let i = 0; i < 42; i++) {
    const offset = i - startDow;
    const d = new Date(year, month, 1 + offset);
    const inMonth = offset >= 0 && offset < daysInMonth;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    cells.push({
      key,
      date: d,
      inMonth,
      isToday: isSameDay(d, today),
      audits: byDate.get(key) ?? [],
    });
  }
  return cells;
}

export function bucketAudit(
  audit: Audit,
  today = new Date(),
): "done" | "today" | "overdue" | "upcoming" {
  if (audit.status === "completed" || audit.status === "cancelled") return "done";
  const s = startOfDay(new Date(audit.scheduledDate));
  const t = startOfDay(today);
  if (isSameDay(s, t)) return "today";
  if (s < t) return "overdue";
  return "upcoming";
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface ReportDef {
  key: string;
  title: string;
  description: string;
  columns: string[];
  rows: Record<string, unknown>[];
}

export function reportAuditSummary(audits: Audit[], counts: AuditCount[]): ReportDef {
  const cols = [
    "Audit",
    "Type",
    "Branch",
    "Scheduled",
    "Status",
    "Verified",
    "Progress",
    "Completed",
  ];
  const rows = audits.map((a) => {
    const p = auditProgress(a, counts);
    return {
      audit: a.auditNumber,
      type: AUDIT_TYPE_LABEL[a.type],
      branch: a.branch,
      scheduled: a.scheduledDate.slice(0, 10),
      status: AUDIT_STATUS_META[a.status].label,
      verified: p.verified,
      progress: `${p.pct}%`,
      completed: a.completedAt ? a.completedAt.slice(0, 10) : "",
    };
  });
  return {
    key: "summary",
    title: "Audit Summary",
    description: "All audits, statuses, and progress",
    columns: cols,
    rows,
  };
}

export function reportVariance(variances: VarianceItem[]): ReportDef {
  const cols = [
    "Medicine",
    "Batch",
    "Expected",
    "Actual",
    "Diff",
    "Unit cost",
    "Value",
    "Severity",
    "Reason",
    "Status",
    "Verified by",
  ];
  const rows = variances.map((v) => ({
    medicine: v.medicineName,
    batch: v.batchNumber,
    expected: v.expectedQty,
    actual: v.actualQty,
    diff: v.difference,
    unit_cost: v.unitCost,
    value: Math.round(v.varianceValue),
    severity: SEVERITY_META[v.severity].label,
    reason: v.reason ? VARIANCE_REASON_LABEL[v.reason] : "",
    status: VARIANCE_STATUS_META[v.status].label,
    verified_by: v.verifiedByName,
  }));
  return {
    key: "variance",
    title: "Variance Report",
    description: "Every mismatched line across audits",
    columns: cols,
    rows,
  };
}

export function reportMissingStock(variances: VarianceItem[]): ReportDef {
  const items = variances.filter((v) => v.difference < 0);
  const cols = ["Medicine", "Batch", "Expected", "Counted", "Short", "Value", "Reason", "Audit"];
  const rows = items.map((v) => ({
    medicine: v.medicineName,
    batch: v.batchNumber,
    expected: v.expectedQty,
    counted: v.actualQty,
    short: Math.abs(v.difference),
    value: Math.round(v.varianceValue),
    reason: v.reason ? VARIANCE_REASON_LABEL[v.reason] : "",
    audit: v.auditId,
  }));
  return {
    key: "missing",
    title: "Missing Stock",
    description: "Items counted below book stock",
    columns: cols,
    rows,
  };
}

export function reportDamagedStock(variances: VarianceItem[]): ReportDef {
  const items = variances.filter((v) => v.reason === "damaged");
  const cols = ["Medicine", "Batch", "Counted", "Book", "Damaged qty", "Value", "Audit"];
  const rows = items.map((v) => ({
    medicine: v.medicineName,
    batch: v.batchNumber,
    counted: v.actualQty,
    book: v.expectedQty,
    damaged_qty: Math.abs(v.difference),
    value: Math.round(v.varianceValue),
    audit: v.auditId,
  }));
  return {
    key: "damaged",
    title: "Damaged Stock",
    description: "Lines flagged as damaged",
    columns: cols,
    rows,
  };
}

export function reportAdjustment(adjustments: StockAdjustment[]): ReportDef {
  const cols = [
    "Audit",
    "Medicine",
    "Batch",
    "Action",
    "Qty",
    "Value",
    "Reason",
    "Severity",
    "Status",
  ];
  const rows = adjustments.map((a) => ({
    audit: a.auditId,
    medicine: a.medicineName,
    batch: a.batchNumber,
    action: ADJUSTMENT_ACTION_LABEL[a.action],
    qty: a.quantity,
    value: Math.round(Math.abs(a.quantity) * a.unitCost),
    reason: VARIANCE_REASON_LABEL[a.reason],
    severity: SEVERITY_META[a.severity].label,
    status: ADJUSTMENT_STATUS_META[a.status].label,
  }));
  return {
    key: "adjustment",
    title: "Adjustment Report",
    description: "Inventory adjustments by audit and action",
    columns: cols,
    rows,
  };
}

export function reportAdjustmentHistory(adjustments: StockAdjustment[]): ReportDef {
  const cols = ["When", "User", "Action", "Medicine", "Batch", "Step", "Comment"];
  const rows: Record<string, unknown>[] = [];
  adjustments.forEach((a) => {
    a.history.forEach((h) => {
      rows.push({
        when: h.at.slice(0, 10),
        user: h.userName,
        action: h.action,
        medicine: a.medicineName,
        batch: a.batchNumber,
        step: ADJUSTMENT_STATUS_META[a.status].label,
        comment: h.comment ?? "",
      });
    });
  });
  return {
    key: "adjustment-history",
    title: "Inventory Adjustment History",
    description: "Full audit trail of every adjustment decision",
    columns: cols,
    rows,
  };
}

export function reportStaffPerformance(counts: AuditCount[]): ReportDef {
  const cols = ["Staff", "Items counted", "Matched", "Accuracy %"];
  const rows = staffPerformance(counts).map((s) => ({
    staff: s.name,
    items: s.items,
    matched: s.matched,
    accuracy: s.accuracy,
  }));
  return {
    key: "staff",
    title: "Staff Performance",
    description: "Counting accuracy per staff member",
    columns: cols,
    rows,
  };
}

export function reportMonthlyAudit(audits: Audit[]): ReportDef {
  const cols = ["Month", "Scheduled", "Completed", "Completion %"];
  const rows = monthlyCompletion(audits).map((m) => ({
    month: m.month,
    scheduled: m.scheduled,
    completed: m.completed,
    completion: m.scheduled ? Math.round((m.completed / m.scheduled) * 100) : 0,
  }));
  return {
    key: "monthly",
    title: "Monthly Audit Report",
    description: "Audit completion by month",
    columns: cols,
    rows,
  };
}

export function ALL_REPORTS(data: {
  audits: Audit[];
  counts: AuditCount[];
  variances: VarianceItem[];
  adjustments: StockAdjustment[];
}): ReportDef[] {
  return [
    reportAuditSummary(data.audits, data.counts),
    reportVariance(data.variances),
    reportMissingStock(data.variances),
    reportDamagedStock(data.variances),
    reportAdjustment(data.adjustments),
    reportAdjustmentHistory(data.adjustments),
    reportStaffPerformance(data.counts),
    reportMonthlyAudit(data.audits),
  ];
}

// ---------------------------------------------------------------------------
// Activity log filtering
// ---------------------------------------------------------------------------

export interface ActivityFilters {
  q: string;
  userId: string;
  entity: string;
  action: string;
  auditId: string;
  from: string;
  to: string;
  medicine: string;
}

export const DEFAULT_ACTIVITY_FILTERS: ActivityFilters = {
  q: "",
  userId: "all",
  entity: "all",
  action: "all",
  auditId: "all",
  from: "",
  to: "",
  medicine: "",
};

export function filterActivityLogs(logs: ActivityLog[], f: ActivityFilters): ActivityLog[] {
  const fromT = f.from ? new Date(`${f.from}T00:00:00`).getTime() : null;
  const toT = f.to ? new Date(`${f.to}T23:59:59.999`).getTime() : null;
  const query = f.q.trim().toLowerCase();
  const medQuery = f.medicine.trim().toLowerCase();
  return logs.filter((l) => {
    if (f.userId !== "all" && l.userId !== f.userId) return false;
    if (f.entity !== "all" && l.entityType !== f.entity) return false;
    if (f.action !== "all" && !l.action.toLowerCase().includes(f.action.toLowerCase()))
      return false;
    if (f.auditId !== "all" && l.auditId !== f.auditId) return false;
    if (medQuery) {
      const hay = `${l.action} ${l.details ? JSON.stringify(l.details) : ""}`.toLowerCase();
      if (!hay.includes(medQuery)) return false;
    }
    if (fromT && new Date(l.createdAt).getTime() < fromT) return false;
    if (toT && new Date(l.createdAt).getTime() > toT) return false;
    if (query) {
      const hay = `${l.action} ${l.userName} ${l.entityType} ${l.reason ?? ""} ${
        l.details ? JSON.stringify(l.details) : ""
      }`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

export function formatCurrency(value: number, currency = "₹"): string {
  return `${currency}${Math.round(value).toLocaleString()}`;
}

export interface ScopeItem {
  batchId: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  shelf: string;
  barcode?: string;
  expectedQty: number;
  count?: AuditCount;
}

export function auditScopeItems(
  audit: Audit,
  batches: Batch[],
  medicines: Medicine[],
  counts: AuditCount[],
): ScopeItem[] {
  const medById = new Map(medicines.map((m) => [m.id, m]));
  const bById = new Map(batches.map((b) => [b.id, b]));
  const countByBatch = new Map<string, AuditCount>();
  counts.forEach((c) => {
    if (c.auditId === audit.id) countByBatch.set(c.batchId, c);
  });
  const out: ScopeItem[] = [];
  (audit.batchIds ?? []).forEach((id) => {
    const b = bById.get(id);
    if (!b) return;
    const m = medById.get(b.medicineId);
    const count = countByBatch.get(id);
    out.push({
      batchId: id,
      medicineId: b.medicineId,
      medicineName: m?.name ?? "—",
      batchNumber: b.batchNumber,
      shelf: b.shelfLocation ?? "—",
      barcode: m?.barcode,
      expectedQty: count?.expectedQty ?? b.currentStock,
      count,
    });
  });
  return out;
}

export function nextAuditNumber(audits: Audit[]): string {
  let max = 0;
  audits.forEach((a) => {
    const n = parseInt(a.auditNumber.replace(/\D/g, ""), 10);
    if (!Number.isNaN(n) && n > max) max = n;
  });
  return `AUD-${String(max + 1).padStart(4, "0")}`;
}
