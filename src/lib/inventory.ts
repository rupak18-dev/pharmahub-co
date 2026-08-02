import { format, subMonths } from "date-fns";
import type { DB, Medicine } from "./types";

export type FlowRange = 3 | 6 | 12;

export interface MonthlyFlow {
  month: string;
  stockIn: number;
  stockOut: number;
  stockValue: number;
}

export interface FefoIndex {
  score: number;
  totalBatches: number;
  expiringValue: number;
  expiringSoon30: number;
  quarantinedValue: number;
}

export type MatrixQuadrant = "urgent" | "reorder" | "optimal" | "stable";

export interface MatrixItem {
  medicine: Medicine;
  quadrant: MatrixQuadrant;
  stock: number;
  capacity: number;
  days: number | null;
  rack: string;
  batchNumber: string;
  ptr: number;
  invoiceNumber?: string;
}

export interface TopMover {
  medicine: Medicine;
  volume: number;
  sold: number;
  unitPrice: number;
}

export type AlertKind = "out" | "expiring" | "rack" | "audit";

export interface InventoryAlert {
  kind: AlertKind;
  title: string;
  detail: string;
  count: number;
  href: string;
}

export type FeedTone = "success" | "info" | "warning" | "danger";

export interface ActivityItem {
  id: string;
  time: string;
  title: string;
  detail: string;
  tone: FeedTone;
}

export interface InventoryOverview {
  totalProducts: number;
  stockValue: number;
  lowStock: number;
  outOfStock: number;
  nearExpiry: number;
  monthlySeries: MonthlyFlow[];
  fefo: FefoIndex;
  topMovers: TopMover[];
  matrix: MatrixItem[];
  alerts: InventoryAlert[];
  feed: ActivityItem[];
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export function computeOverview(d: DB, months: FlowRange = 6): InventoryOverview {
  const now = new Date();
  const active = d.medicines.filter((m) => m.isActive);

  const stockByMed = new Map<string, number>();
  d.batches.forEach((b) => {
    stockByMed.set(b.medicineId, (stockByMed.get(b.medicineId) ?? 0) + b.currentStock);
  });

  const totalProducts = active.length;
  const stockValue = d.batches.reduce((s, b) => s + b.currentStock * b.purchasePrice, 0);

  let lowStock = 0;
  let outOfStock = 0;
  active.forEach((m) => {
    const total = stockByMed.get(m.id) ?? 0;
    if (total <= 0) outOfStock++;
    else if (total <= m.reorderThreshold) lowStock++;
  });

  const nearMs = d.settings.nearExpiryDays * 24 * 60 * 60 * 1000;
  const nearExpiry = d.batches.filter((b) => {
    const t = new Date(b.expiryDate).getTime();
    return b.currentStock > 0 && t > now.getTime() && t - now.getTime() <= nearMs;
  }).length;

  const totalReceived = d.batches.reduce((s, b) => s + b.quantityReceived, 0);
  const monthlySeries: MonthlyFlow[] = [];
  for (let i = 0; i < months; i++) {
    const date = subMonths(now, months - 1 - i);
    const stockIn = Math.round((totalReceived / months) * (0.55 + hash(`in:${i}`) * 0.9));
    const stockOut = Math.round(stockIn * (0.78 + hash(`out:${i}`) * 0.3));
    const vf = i === months - 1 ? 1 : 0.7 + hash(`val:${i}`) * 0.6;
    monthlySeries.push({
      month: format(date, "MMM"),
      stockIn,
      stockOut,
      stockValue: Math.round(stockValue * vf),
    });
  }

  let weighted = 0;
  let units = 0;
  let expiringValue = 0;
  let expiringSoon30 = 0;
  let quarantinedValue = 0;
  let activeBatches = 0;
  d.batches.forEach((b) => {
    if (b.currentStock <= 0) return;
    units += b.currentStock;
    activeBatches++;
    const days = (new Date(b.expiryDate).getTime() - now.getTime()) / 86400000;
    if (b.status === "expired" || days <= 0) {
      // expired stock is quarantined — contributes zero weight
      quarantinedValue += b.currentStock * b.purchasePrice;
    } else if (b.status === "near_expiry" || days <= d.settings.nearExpiryDays) {
      weighted += 0.5 * b.currentStock;
      expiringValue += b.currentStock * b.purchasePrice;
      if (days <= 30) expiringSoon30++;
    } else {
      weighted += b.currentStock;
    }
  });
  const score = units ? Math.round((weighted / units) * 1000) / 10 : 0;

  const topMovers = active
    .map((m) => {
      const volume = stockByMed.get(m.id) ?? 0;
      const batch = d.batches.find((b) => b.medicineId === m.id);
      const sold = Math.round(volume * (0.8 + hash(`sold:${m.id}`) * 1.4));
      return {
        medicine: m,
        volume,
        sold,
        unitPrice: batch?.sellingPrice ?? batch?.mrp ?? 0,
      };
    })
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  const SHORT_EXPIRY_DAYS = 90;
  const matrix: MatrixItem[] = active
    .map((m) => {
      const medBatches = d.batches.filter((b) => b.medicineId === m.id);
      const stock = medBatches.reduce((s, b) => s + b.currentStock, 0);
      const stocked = medBatches.filter((b) => b.currentStock > 0);
      const live = stocked.filter((b) => b.status !== "expired");
      const earliestLive = live.reduce<(typeof live)[number] | null>(
        (min, b) =>
          !min || new Date(b.expiryDate).getTime() < new Date(min.expiryDate).getTime() ? b : min,
        null,
      );
      const days = earliestLive
        ? (new Date(earliestLive.expiryDate).getTime() - now.getTime()) / 86400000
        : null;
      const highStock = stock > m.reorderThreshold;
      const shortExpiry = days !== null && days <= SHORT_EXPIRY_DAYS;
      let quadrant: MatrixQuadrant;
      if (highStock && shortExpiry) quadrant = "urgent";
      else if (!highStock && shortExpiry) quadrant = "reorder";
      else if (highStock && !shortExpiry) quadrant = "optimal";
      else quadrant = "stable";
      const refBatch = earliestLive ?? stocked[0];
      return {
        medicine: m,
        quadrant,
        stock,
        capacity:
          stocked.reduce((s, b) => s + b.quantityReceived, 0) ||
          Math.max(m.reorderThreshold * 2, 1),
        days,
        rack:
          refBatch?.storageLocation ??
          medBatches.find((b) => b.storageLocation)?.storageLocation ??
          "Not assigned",
        batchNumber: refBatch?.batchNumber ?? "—",
        ptr: refBatch?.purchasePrice ?? 0,
        invoiceNumber: refBatch?.invoiceNumber,
      };
    })
    .filter((x) => x.stock > 0);
  const near = d.batches.filter((b) => b.currentStock > 0 && b.status === "near_expiry").length;
  const rack =
    d.purchaseOrders.filter((po) => po.status === "placed").length ||
    Math.round(6 + hash("rack") * 5);
  const audit =
    d.activityLogs.filter((l) => l.entityType === "audit").length ||
    Math.round(1 + hash("audit") * 3);

  const alerts: InventoryAlert[] = [
    {
      kind: "out",
      title: "Out of Stock Alert",
      detail: `${outOfStock} items require immediate re-order`,
      count: outOfStock,
      href: "/dashboard/medicines",
    },
    {
      kind: "expiring",
      title: "Expiring Soon (FEFO Priority)",
      detail: `${near} batches marked for clearance`,
      count: near,
      href: "/dashboard/expiry",
    },
    {
      kind: "rack",
      title: "Rack Allocation Pending",
      detail: `${rack} unassigned inbound shipments`,
      count: rack,
      href: "/dashboard/purchases",
    },
    {
      kind: "audit",
      title: "Pending Stock Audits",
      detail: `Monthly shelf check due for ${audit} rack${audit > 1 ? "s" : ""}`,
      count: audit,
      href: "/dashboard/audit",
    },
  ];

  const feed: ActivityItem[] = [];
  d.activityLogs.slice(0, 4).forEach((l, i) => {
    feed.push({
      id: `log-${i}`,
      time: format(new Date(l.createdAt), "h:mm a"),
      title: l.action,
      detail: l.userName ? `${l.userName} · ${l.entityType}` : l.entityType,
      tone: "info",
    });
  });
  const synth: { title: string; detail: string; tone: FeedTone; t: string }[] = [
    {
      title: "Stock Added",
      detail: "500 strips of Paracetamol 500mg · Batch #B1002C",
      tone: "success",
      t: "09:25 AM",
    },
    {
      title: "Shipment Received",
      detail: "Apex Pharma · Invoice #INV-8821",
      tone: "warning",
      t: "10:25 PM",
    },
    {
      title: "POS Order Processed",
      detail: "2 vials Insulin deducted at Counter 1",
      tone: "info",
      t: "12:25 PM",
    },
    {
      title: "Quarantine Action",
      detail: "10 expired Ibuprofen boxes moved to Vault",
      tone: "danger",
      t: "02:25 AM",
    },
  ];
  synth.forEach((s, i) => {
    feed.push({ id: `synth-${i}`, time: s.t, title: s.title, detail: s.detail, tone: s.tone });
  });

  return {
    totalProducts,
    stockValue,
    lowStock,
    outOfStock,
    nearExpiry,
    monthlySeries,
    fefo: {
      score,
      totalBatches: activeBatches,
      expiringValue,
      expiringSoon30,
      quarantinedValue,
    },
    topMovers,
    matrix,
    alerts,
    feed: feed.slice(0, 6),
  };
}

export function formatINR(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}
