import { format } from "date-fns";
import type { Batch, Medicine } from "./types";

export const DAY_MS = 24 * 60 * 60 * 1000;

export const RETURN_WINDOW_DAYS = 30;
export const LOSS_RATIO = 0.35;

/** Receiving guard: lots expiring inside this window are flagged at receiving. */
export const PURCHASE_GUARD_DAYS = 90;

export type PurchaseGuardLevel = "ok" | "warning" | "block";

export function purchaseGuard(
  expiryIso: string,
  guardDays: number = PURCHASE_GUARD_DAYS,
  now = Date.now(),
): { level: PurchaseGuardLevel; daysLeft: number } {
  const daysLeft = daysUntil(expiryIso, now);
  if (daysLeft < 0) return { level: "block", daysLeft };
  if (daysLeft <= 7) return { level: "block", daysLeft };
  if (daysLeft <= guardDays) return { level: "warning", daysLeft };
  return { level: "ok", daysLeft };
}

export interface SchemeOption {
  value: string;
  label: string;
  hint: string;
  pct: number;
}

export const SCHEME_OPTIONS: SchemeOption[] = [
  { value: "100", label: "Standard return", hint: "Full value credited", pct: 100 },
  { value: "90", label: "Buy 10 get 1", hint: "Scheme units recovered at 90%", pct: 90 },
  { value: "88", label: "12% scheme", hint: "Scheme units recovered at 88%", pct: 88 },
  { value: "0", label: "Replacement only", hint: "No credit — exchange stock instead", pct: 0 },
];

export const PRESET_WINDOWS = [
  { value: "today", label: "Today", days: 0 },
  { value: "3", label: "Next 3 days", days: 3 },
  { value: "7", label: "Next 7 days", days: 7 },
  { value: "15", label: "Next 15 days", days: 15 },
  { value: "30", label: "Next 30 days", days: 30 },
  { value: "60", label: "Next 60 days", days: 60 },
  { value: "90", label: "Next 90 days", days: 90 },
] as const;

export type WindowPreset = (typeof PRESET_WINDOWS)[number]["value"];

export type WindowState =
  { kind: "preset"; preset: WindowPreset } | { kind: "custom"; from: string; to: string };

export const DEFAULT_WINDOW: WindowState = { kind: "preset", preset: "30" };

export function windowLabel(window: WindowState): string {
  if (window.kind === "preset") {
    return PRESET_WINDOWS.find((w) => w.value === window.preset)?.label ?? "Next 30 days";
  }
  return `${format(new Date(window.from), "d MMM")} – ${format(new Date(window.to), "d MMM")}`;
}

export function effectiveDays(window: WindowState): number | null {
  return window.kind === "preset"
    ? (PRESET_WINDOWS.find((w) => w.value === window.preset)?.days ?? 30)
    : null;
}

/** Width of the window in days (preset days, or custom from→to span). */
export function windowSpanDays(window: WindowState, now = Date.now()): number {
  if (window.kind === "preset") return effectiveDays(window) ?? 30;
  const from = new Date(window.from).getTime();
  const to = new Date(window.to).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return 30;
  return Math.max(0, Math.round((to - from) / DAY_MS));
}

/** Rows whose expiry falls inside the selected time window (future expiry for presets). */
export function rowsInWindow(rows: ExpiryRow[], window: WindowState): ExpiryRow[] {
  if (window.kind === "custom") {
    const from = new Date(window.from).getTime();
    const to = new Date(window.to).getTime() + DAY_MS;
    return rows.filter((r) => {
      const t = new Date(r.expiryDate).getTime();
      return t >= from && t <= to;
    });
  }
  if (window.preset === "today") return rows.filter((r) => r.days === 0);
  const days = effectiveDays(window) ?? 30;
  return rows.filter((r) => r.days >= 0 && r.days <= days);
}

export function daysUntil(dateIso: string, now = Date.now()): number {
  const t = new Date(dateIso).getTime();
  return Math.round((t - now) / DAY_MS);
}

export function inWindow(batch: Batch, window: WindowState, now = Date.now()): boolean {
  if (batch.status === "disposed" || batch.currentStock <= 0) return false;
  const d = daysUntil(batch.expiryDate, now);
  if (window.kind === "custom") {
    const t = new Date(batch.expiryDate).getTime();
    return t >= new Date(window.from).getTime() && t <= new Date(window.to).getTime() + DAY_MS;
  }
  if (window.preset === "today") return d === 0;
  const days = effectiveDays(window) ?? 30;
  return d > 0 && d <= days;
}

export function batchValue(batch: Batch): number {
  return batch.currentStock * batch.purchasePrice;
}

export type ExpiryBucket = "expired" | "today" | "critical" | "warning" | "healthy";

export function expiryBucket(days: number): ExpiryBucket {
  if (days < 0) return "expired";
  if (days === 0) return "today";
  if (days <= 3) return "critical";
  if (days <= 30) return "warning";
  return "healthy";
}

export const BUCKET_META: Record<
  ExpiryBucket,
  { label: string; chip: string; dot: string; bar: string }
> = {
  expired: {
    label: "Expired",
    chip: "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
    bar: "oklch(0.58 0.22 25)",
  },
  today: {
    label: "Expires today",
    chip: "border-destructive/40 bg-destructive/15 text-destructive",
    dot: "bg-destructive",
    bar: "oklch(0.58 0.22 25)",
  },
  critical: {
    label: "Critical",
    chip: "border-critical/40 bg-critical/15 text-critical",
    dot: "bg-critical",
    bar: "oklch(0.66 0.19 45)",
  },
  warning: {
    label: "Warning",
    chip: "border-warning/30 bg-warning/10 text-warning-foreground",
    dot: "bg-warning/70",
    bar: "oklch(0.8 0.12 90)",
  },
  healthy: {
    label: "Healthy",
    chip: "border-success/30 bg-success/10 text-success",
    dot: "bg-success",
    bar: "oklch(0.62 0.15 155)",
  },
};

export function suggestedDiscountPct(days: number): number {
  if (days <= 3) return 30;
  if (days <= 7) return 25;
  if (days <= 15) return 20;
  if (days <= 30) return 15;
  return 10;
}

export const BRANCHES = ["HQ · Main Street", "Downtown Annex", "Sector 15 Branch"];

export type StatusFilterValue = "all" | "today" | "critical" | "warning" | "return" | "expired";

export type SortKey =
  | "medicineName"
  | "batchNumber"
  | "expiryDate"
  | "days"
  | "quantity"
  | "stockValue"
  | "manufacturer";

export function matchesStatusFilter(row: ExpiryRow, filter: StatusFilterValue): boolean {
  switch (filter) {
    case "all":
      return true;
    case "today":
      return row.days === 0;
    case "critical":
      return row.days > 0 && row.days <= 3;
    case "warning":
      return row.days > 3 && row.days <= 30;
    case "return":
      return row.days >= -RETURN_WINDOW_DAYS && row.days <= RETURN_WINDOW_DAYS;
    case "expired":
      return row.days < 0;
  }
}

export function isReturnable(row: ExpiryRow): boolean {
  return row.days >= -RETURN_WINDOW_DAYS && row.days <= RETURN_WINDOW_DAYS;
}

export interface ExpiryMetrics {
  expiredCount: number;
  expiredValue: number;
  todayCount: number;
  todayValue: number;
  d3Count: number;
  d3Value: number;
  d7Count: number;
  d7Value: number;
  d30Count: number;
  d30Value: number;
  nearCount: number;
  nearValue: number;
  returnEligibleCount: number;
  returnEligibleValue: number;
  lossProjection: number;
  riskScore: number;
}

export function computeMetrics(
  batches: Batch[],
  window: WindowState,
  now = Date.now(),
): ExpiryMetrics {
  const relevant = batches.filter(
    (b) =>
      b.status !== "disposed" &&
      b.currentStock > 0 &&
      new Date(b.expiryDate).getTime() > now - 90 * DAY_MS,
  );

  let expiredCount = 0;
  let expiredValue = 0;
  let todayCount = 0;
  let todayValue = 0;
  let d3Count = 0;
  let d3Value = 0;
  let d7Count = 0;
  let d7Value = 0;
  let d30Count = 0;
  let d30Value = 0;
  let returnEligibleCount = 0;
  let returnEligibleValue = 0;

  for (const b of relevant) {
    const d = daysUntil(b.expiryDate, now);
    const v = batchValue(b);
    if (d < 0) {
      expiredCount++;
      expiredValue += v;
      if (d >= -RETURN_WINDOW_DAYS) {
        returnEligibleCount++;
        returnEligibleValue += v;
      }
      continue;
    }
    if (d === 0) {
      todayCount++;
      todayValue += v;
      returnEligibleCount++;
      returnEligibleValue += v;
      continue;
    }
    if (d <= 3) {
      d3Count++;
      d3Value += v;
    }
    if (d <= 7) {
      d7Count++;
      d7Value += v;
    }
    if (d <= 30) {
      d30Count++;
      d30Value += v;
      if (d <= RETURN_WINDOW_DAYS) {
        returnEligibleCount++;
        returnEligibleValue += v;
      }
    }
  }

  const nearBatches = batches.filter((b) => inWindow(b, window, now));
  const nearCount = nearBatches.length;
  const nearValue = nearBatches.reduce((s, b) => s + batchValue(b), 0);

  const lossProjection = Math.round(expiredValue + d30Value * LOSS_RATIO);

  // Risk score 0–100: how much value sits in the selected horizon.
  const score =
    (expiredValue / 800) * 15 +
    (nearValue / 8000) * 30 +
    expiredCount * 1.5 +
    todayCount * 2 +
    Math.min(d30Count, 8) * 1;
  const riskScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    expiredCount,
    expiredValue,
    todayCount,
    todayValue,
    d3Count,
    d3Value,
    d7Count,
    d7Value,
    d30Count,
    d30Value,
    nearCount,
    nearValue,
    returnEligibleCount,
    returnEligibleValue,
    lossProjection,
    riskScore,
  };
}

export function riskTone(score: number): "success" | "warning" | "danger" {
  if (score <= 30) return "success";
  if (score <= 60) return "warning";
  return "danger";
}

export interface TrendPoint {
  day: number;
  label: string;
  cumulative: number;
  daily: number;
}

export function computeTrend(batches: Batch[], now = Date.now(), horizonDays = 60): TrendPoint[] {
  const daily = new Map<number, number>();
  for (const b of batches) {
    if (b.status === "disposed" || b.currentStock <= 0) continue;
    const d = daysUntil(b.expiryDate, now);
    if (d < 0 || d > horizonDays) continue;
    daily.set(d, (daily.get(d) ?? 0) + batchValue(b));
  }
  let running = 0;
  const points: TrendPoint[] = [];
  for (let d = 0; d <= horizonDays; d++) {
    const v = daily.get(d) ?? 0;
    running += v;
    points.push({
      day: d,
      label: format(new Date(now + d * DAY_MS), "d MMM"),
      daily: Math.round(v),
      cumulative: Math.round(running),
    });
  }
  return points;
}

export function computeByGroup(
  batches: Batch[],
  window: WindowState,
  getGroup: (b: Batch) => string,
  now = Date.now(),
): { name: string; value: number; count: number }[] {
  const map = new Map<string, { value: number; count: number }>();
  for (const b of batches) {
    if (!inWindow(b, window, now)) continue;
    const key = getGroup(b);
    const cur = map.get(key) ?? { value: 0, count: 0 };
    cur.value += batchValue(b);
    cur.count += 1;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .map(([name, { value, count }]) => ({ name, value: Math.round(value), count }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Projected financial loss per group: expired stock at full value plus
 * at-risk stock (within the 30-day window) discounted by LOSS_RATIO.
 */
export function computeLossByGroup(
  batches: Batch[],
  getGroup: (b: Batch) => string,
  now = Date.now(),
  horizonDays = 30,
): { name: string; value: number; count: number }[] {
  const map = new Map<string, { value: number; count: number }>();
  for (const b of batches) {
    if (b.status === "disposed" || b.currentStock <= 0) continue;
    const d = daysUntil(b.expiryDate, now);
    let loss = 0;
    if (d < 0) loss = batchValue(b);
    else if (d <= horizonDays) loss = batchValue(b) * LOSS_RATIO;
    if (loss <= 0) continue;
    const key = getGroup(b);
    const cur = map.get(key) ?? { value: 0, count: 0 };
    cur.value += loss;
    cur.count += 1;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .map(([name, { value, count }]) => ({ name, value: Math.round(value), count }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Value expiring per calendar month — past months carry wasted/expired value,
 * current and future months carry at-risk value. Rolling window starting the
 * month before `now`.
 */
export function computeMonthlyExpiry(
  batches: Batch[],
  now = Date.now(),
  months = 6,
): { key: string; month: string; value: number; isPast: boolean; isCurrent: boolean }[] {
  const start = new Date(now);
  start.setDate(1);
  start.setMonth(start.getMonth() - 1);

  const buckets: {
    key: string;
    month: string;
    value: number;
    isPast: boolean;
    isCurrent: boolean;
  }[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const sameYear = d.getFullYear() === new Date(now).getFullYear();
    buckets.push({
      key,
      month: sameYear ? format(d, "MMM") : format(d, "MMM yy"),
      value: 0,
      isPast:
        d.getFullYear() < new Date(now).getFullYear() ||
        (d.getFullYear() === new Date(now).getFullYear() &&
          d.getMonth() < new Date(now).getMonth()),
      isCurrent:
        d.getFullYear() === new Date(now).getFullYear() &&
        d.getMonth() === new Date(now).getMonth(),
    });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));

  for (const b of batches) {
    if (b.status === "disposed" || b.currentStock <= 0) continue;
    const exp = new Date(b.expiryDate);
    const key = `${exp.getFullYear()}-${String(exp.getMonth() + 1).padStart(2, "0")}`;
    const bucket = byKey.get(key);
    if (bucket) bucket.value += batchValue(b);
  }

  return buckets.map((b) => ({ ...b, value: Math.round(b.value) }));
}

export function computePeriodData(
  batches: Batch[],
  now = Date.now(),
): { period: string; value: number; tone: "danger" | "warning" | "success" }[] {
  const buckets: {
    name: string;
    tone: "danger" | "warning" | "success";
    test: (d: number) => boolean;
  }[] = [
    { name: "Already expired", tone: "danger", test: (d) => d < 0 },
    { name: "Next 30 days", tone: "warning", test: (d) => d >= 0 && d <= 30 },
    { name: "31 – 60 days", tone: "warning", test: (d) => d > 30 && d <= 60 },
    { name: "61 – 90 days", tone: "success", test: (d) => d > 60 && d <= 90 },
    { name: "Beyond 90 days", tone: "success", test: (d) => d > 90 },
  ];
  const values = buckets.map(() => 0);
  for (const b of batches) {
    if (b.status === "disposed" || b.currentStock <= 0) continue;
    const d = daysUntil(b.expiryDate, now);
    const idx = buckets.findIndex((bk) => bk.test(d));
    if (idx !== -1) values[idx] += batchValue(b);
  }
  return buckets.map((bk, i) => ({ period: bk.name, value: Math.round(values[i]), tone: bk.tone }));
}

export function computeReturnableBySupplier(
  batches: Batch[],
  supplierName: (id?: string) => string,
  now = Date.now(),
): { name: string; value: number; count: number }[] {
  const map = new Map<string, { value: number; count: number }>();
  for (const b of batches) {
    if (b.status === "disposed" || b.currentStock <= 0) continue;
    const d = daysUntil(b.expiryDate, now);
    if (d < -RETURN_WINDOW_DAYS || d > RETURN_WINDOW_DAYS) continue;
    const key = supplierName(b.supplierId);
    const cur = map.get(key) ?? { value: 0, count: 0 };
    cur.value += batchValue(b);
    cur.count += 1;
    map.set(key, cur);
  }
  return Array.from(map.entries())
    .map(([name, { value, count }]) => ({ name, value: Math.round(value), count }))
    .sort((a, b) => b.value - a.value);
}

export interface Alternative {
  batch: Batch;
  medicine: Medicine | undefined;
  days: number;
  bucket: ExpiryBucket;
  sameStrength: boolean;
}

export function getAlternatives(
  batch: Batch,
  batches: Batch[],
  medicines: Medicine[],
  now = Date.now(),
  opts?: { sameStrength?: boolean },
): Alternative[] {
  const current = medicines.find((m) => m.id === batch.medicineId);
  if (!current?.genericName) return [];
  const medById = new Map(medicines.map((m) => [m.id, m]));
  const list = batches
    .filter((b) => {
      if (b.id === batch.id || b.status === "disposed" || b.currentStock <= 0) return false;
      const om = medById.get(b.medicineId);
      if (!om || om.genericName !== current.genericName) return false;
      if (opts?.sameStrength && om.strength !== current.strength) return false;
      return true;
    })
    .map((b) => {
      const om = medById.get(b.medicineId);
      const d = daysUntil(b.expiryDate, now);
      return {
        batch: b,
        medicine: om,
        days: d,
        bucket: expiryBucket(d),
        sameStrength: !!om?.strength && om.strength === current.strength,
      };
    })
    .sort((a, b) => {
      if (a.sameStrength !== b.sameStrength) return a.sameStrength ? -1 : 1;
      return a.days - b.days;
    });
  return list;
}

export type NotificationTone = "danger" | "warning" | "info";

export interface ExpiryNotification {
  id: string;
  group: string;
  title: string;
  detail: string;
  tone: NotificationTone;
  batchId: string;
}

export function buildNotifications(
  batches: Batch[],
  medicines: Medicine[],
  supplierName: (id?: string) => string,
  now = Date.now(),
): ExpiryNotification[] {
  const medById = new Map(medicines.map((m) => [m.id, m]));
  const items: ExpiryNotification[] = [];
  const push = (n: Omit<ExpiryNotification, "id">, batch: Batch) => {
    items.push({ ...n, id: `${batch.id}:${n.group.toLowerCase().replace(/\s+/g, "-")}` });
  };

  for (const b of batches) {
    if (b.status === "disposed" || b.currentStock <= 0) continue;
    const d = daysUntil(b.expiryDate, now);
    const name = medById.get(b.medicineId)?.name ?? "Medicine";
    const v = batchValue(b);
    const supplier = supplierName(b.supplierId);

    if (d === 0) {
      push(
        {
          group: "Expiring today",
          title: `${name} expires today`,
          detail: `${b.batchNumber} · ${v.toLocaleString()} worth of stock`,
          tone: "danger",
          batchId: b.id,
        },
        b,
      );
    } else if (d > 0 && d <= 3) {
      push(
        {
          group: "Expiring soon",
          title: `${name} expires in ${d} day${d > 1 ? "s" : ""}`,
          detail: `${b.batchNumber} · ${supplier} · ₹${v.toLocaleString()}`,
          tone: "warning",
          batchId: b.id,
        },
        b,
      );
    } else if (d > 3 && d <= 7) {
      push(
        {
          group: "Expiring soon",
          title: `${name} expires in ${d} days`,
          detail: `${b.batchNumber} · ${supplier}`,
          tone: "warning",
          batchId: b.id,
        },
        b,
      );
    } else if (d > 7 && d <= 30) {
      push(
        {
          group: "Expiring in 30 days",
          title: `${name} expires in ${d} days`,
          detail: `${b.batchNumber} · ${supplier} · ₹${v.toLocaleString()}`,
          tone: "warning",
          batchId: b.id,
        },
        b,
      );
    } else if (d > 0 && d <= 15) {
      push(
        {
          group: "Return window",
          title: `Return window open for ${name}`,
          detail: `${b.batchNumber} · ${supplier} accepts returns up to expiry`,
          tone: "info",
          batchId: b.id,
        },
        b,
      );
    } else if (d < 0 && d >= -RETURN_WINDOW_DAYS) {
      const closing = d >= -7;
      push(
        {
          group: closing ? "Return deadline" : "Return window",
          title: closing
            ? `Return window closing · ${name}`
            : `Expired ${Math.abs(d)}d ago — still returnable`,
          detail: `${b.batchNumber} · ${supplier}${closing ? ` · ${Math.abs(d)}d to act` : ""}`,
          tone: closing ? "warning" : "info",
          batchId: b.id,
        },
        b,
      );
    }
    if (v >= 3000 && d >= 0 && d <= 30) {
      push(
        {
          group: "High value",
          title: `₹${v.toLocaleString()} at risk · ${name}`,
          detail: `${b.batchNumber} expires in ${d} days`,
          tone: "danger",
          batchId: b.id,
        },
        b,
      );
    }
  }

  const order: Record<NotificationTone, number> = { danger: 0, warning: 1, info: 2 };
  return items.sort((a, b) => order[a.tone] - order[b.tone]).slice(0, 10);
}

export interface ExpiryRow {
  batch: Batch;
  medicine: Medicine | undefined;
  medicineName: string;
  salt: string;
  batchNumber: string;
  manufacturer: string;
  category: string;
  supplier: string;
  expiryDate: string;
  days: number;
  bucket: ExpiryBucket;
  quantity: number;
  stockValue: number;
  shelf: string;
}

export function reportRows(
  batches: Batch[],
  medicines: Medicine[],
  categories: { id: string; name: string }[],
  manufacturers: { id: string; name: string }[],
  suppliers: { id: string; name: string }[],
  window: WindowState,
  now = Date.now(),
) {
  const medById = new Map(medicines.map((m) => [m.id, m]));
  const catById = new Map(categories.map((c) => [c.id, c.name]));
  const mfrById = new Map(manufacturers.map((m) => [m.id, m.name]));
  const supById = new Map(suppliers.map((s) => [s.id, s.name]));

  const visible = batches.filter((b) => {
    if (b.status === "disposed" || b.currentStock <= 0) return false;
    return true;
  });

  return visible.map((b) => {
    const m = medById.get(b.medicineId);
    const d = daysUntil(b.expiryDate, now);
    return {
      batch: b,
      medicine: m,
      medicineName: m?.name ?? "—",
      salt: m?.genericName ?? "—",
      batchNumber: b.batchNumber,
      manufacturer: mfrById.get(m?.manufacturerId ?? "") ?? "—",
      category: catById.get(m?.categoryId ?? "") ?? "—",
      supplier: supById.get(b.supplierId ?? "") ?? "—",
      expiryDate: b.expiryDate.slice(0, 10),
      days: d,
      bucket: expiryBucket(d),
      quantity: b.currentStock,
      stockValue: batchValue(b),
      shelf: b.shelfLocation ?? "—",
    };
  });
}
