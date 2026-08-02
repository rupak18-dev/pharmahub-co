import { db } from "./db";
import type {
  Batch,
  BatchStatus,
  LocationType,
  InventoryLedgerMovementType,
  InventoryStock,
  MovementType,
  StockMovement,
} from "./types";

export function computeBatchStatus(batch: Batch, totalStock: number, nearExpiryDays: number): BatchStatus {
  const now = Date.now();
  const exp = new Date(batch.expiryDate).getTime();
  if (totalStock <= 0 && exp >= now) return "sold_out";
  if (exp < now) return "expired";
  const daysLeft = (exp - now) / (1000 * 60 * 60 * 24);
  if (daysLeft <= nearExpiryDays) return "near_expiry";
  return "active";
}

interface ApplyMovement {
  batchId: string;
  locationType: LocationType;
  rackCode: string;
  movementType: InventoryLedgerMovementType;
  quantityChange: number;
  referenceDocId?: string;
  userId: string;
  userName: string;
}

interface ApplyMovementSimple {
  medicineId: string;
  batchId: string;
  movementType: MovementType;
  quantity: number; // absolute magnitude (sign ignored; direction from movementType)
  reason: string;
  referenceId?: string;
  userId: string;
  userName: string;
}

const DEFAULT_LOCATION: LocationType = "Front Shelf";
const DEFAULT_RACK = "General";

function movementToLedger(t: MovementType): InventoryLedgerMovementType {
  return t === "in" ? "Purchase Inward" : t === "out" ? "Vendor Return" : "Adjustment";
}

function ledgerToMovement(t: InventoryLedgerMovementType): MovementType {
  switch (t) {
    case "Purchase Inward":
      return "in";
    case "Sales Outward":
    case "Vendor Return":
    case "Customer Return":
      return "out";
    default:
      return "adjustment";
  }
}

export function applyStockMovement(input: ApplyMovement): void;
export function applyStockMovement(input: ApplyMovementSimple): void;
export function applyStockMovement(input: ApplyMovement | ApplyMovementSimple) {
  const now = new Date().toISOString();
  db.set((d) => {
    const batch = d.batches.find((b) => b.id === input.batchId);
    if (!batch) throw new Error("Batch not found");

    const isSimple = "quantity" in input;
    const ledgerType: InventoryLedgerMovementType = isSimple
      ? movementToLedger(input.movementType)
      : input.movementType;
    const signed = isSimple
      ? input.movementType === "in"
        ? Math.abs(input.quantity)
        : -Math.abs(input.quantity)
      : input.quantityChange;
    const locationType = isSimple
      ? d.inventoryStock.find((s) => s.batchId === input.batchId)?.locationType ?? DEFAULT_LOCATION
      : input.locationType;
    const rackCode = isSimple
      ? d.inventoryStock.find((s) => s.batchId === input.batchId)?.rackCode ?? DEFAULT_RACK
      : input.rackCode;

    let stock = d.inventoryStock.find(
      (s) => s.batchId === input.batchId && s.locationType === locationType,
    );

    if (signed < 0) {
      const needed = Math.abs(signed);
      if (!stock || stock.quantityOnHand < needed) {
        // Fallback to any location that has enough stock
        const alt = d.inventoryStock.find(
          (s) => s.batchId === input.batchId && s.quantityOnHand >= needed,
        );
        if (alt) {
          stock = alt;
        } else if (!stock) {
          throw new Error("Insufficient stock in any location");
        }
      }
    }

    if (!stock) {
      if (signed < 0) throw new Error("Insufficient stock in location");
      stock = {
        id: db.uid(),
        batchId: input.batchId,
        locationType,
        rackCode,
        quantityOnHand: 0,
        reservedQuantity: 0,
        createdAt: now,
      };
      d.inventoryStock.push(stock);
    }

    const nextQty = stock.quantityOnHand + signed;
    if (nextQty < 0) throw new Error("Insufficient stock");
    stock.quantityOnHand = nextQty;

    const referenceId = isSimple ? input.referenceId : input.referenceDocId;

    d.inventoryLedger.unshift({
      id: db.uid(),
      batchId: input.batchId,
      movementType: ledgerType,
      quantityChange: signed,
      referenceDocId: referenceId,
      userId: input.userId,
      timestamp: now,
    });

    d.stockMovements.unshift({
      id: db.uid(),
      medicineId: batch.medicineId,
      batchId: input.batchId,
      movementType: ledgerToMovement(ledgerType),
      quantity: signed,
      reason: isSimple ? input.reason : `Stock ${ledgerType}`,
      referenceId,
      createdBy: input.userId,
      createdAt: now,
    } as StockMovement);

    batch.currentStock = d.inventoryStock
      .filter((s) => s.batchId === input.batchId)
      .reduce((sum, s) => sum + s.quantityOnHand, 0);

    d.activityLogs.unshift({
      id: db.uid(),
      userId: input.userId,
      userName: input.userName,
      action: `Stock ${ledgerType} · ${Math.abs(signed)} units`,
      entityType: "inventory_stock",
      entityId: stock.id,
      details: { location: stock.locationType, delta: signed },
      createdAt: now,
    });
  });
}

export function logActivity(input: {
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  db.set((d) => {
    d.activityLogs.unshift({
      id: db.uid(),
      ...input,
      createdAt: new Date().toISOString(),
    });
    if (d.activityLogs.length > 500) d.activityLogs.length = 500;
  });
}

export type FeFoPick = {
  batchId: string;
  stockId: string;
  locationType: LocationType;
  rackCode: string;
  quantity: number;
};

// FEFO: earliest-expiry-first batch picker. Returns picks that sum up to <= qty available.
// Batches flagged with `fefo: true` (Expiry Management) jump ahead of the expiry sort.
export function pickBatchesFEFO(
  batches: Batch[],
  inventory: InventoryStock[],
  medicineId: string,
  qty: number,
): FeFoPick[];
export function pickBatchesFEFO(batches: Batch[], medicineId: string, qty: number): FeFoPick[];
export function pickBatchesFEFO(
  batches: Batch[],
  inventoryOrMedicineId: InventoryStock[] | string,
  medicineIdOrQty: string | number,
  qty?: number,
): FeFoPick[] {
  const hasInventory = Array.isArray(inventoryOrMedicineId);
  const medicineId = hasInventory
    ? (medicineIdOrQty as string)
    : (inventoryOrMedicineId as string);
  const wanted = hasInventory ? (qty as number) : (medicineIdOrQty as number);
  const inventory = hasInventory
    ? (inventoryOrMedicineId as InventoryStock[])
    : batches
        .filter((b) => b.medicineId === medicineId && b.currentStock > 0)
        .map((b, i) => ({
          id: `stock-${i}`,
          batchId: b.id,
          locationType: DEFAULT_LOCATION,
          rackCode: DEFAULT_RACK,
          quantityOnHand: b.currentStock,
          reservedQuantity: 0,
          createdAt: b.createdAt,
        }));

  const now = Date.now();

  const candidates = batches
    .filter(
      (b) =>
        b.medicineId === medicineId &&
        new Date(b.expiryDate).getTime() > now,
    )
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const picks: FeFoPick[] = [];
  let remaining = wanted;
  for (const b of candidates) {
    if (remaining <= 0) break;
    const stocks = inventory.filter((s) => s.batchId === b.id && s.quantityOnHand > 0);
    for (const s of stocks) {
      if (remaining <= 0) break;
      const take = Math.min(s.quantityOnHand, remaining);
      picks.push({
        batchId: b.id,
        stockId: s.id,
        locationType: s.locationType,
        rackCode: s.rackCode,
        quantity: take,
      });
      remaining -= take;
    }
  }
  return picks;
}
