import { db } from "./db";
import type { Batch, BatchStatus, LocationType, InventoryLedgerMovementType, InventoryStock } from "./types";

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

export function applyStockMovement(input: ApplyMovement) {
  const now = new Date().toISOString();
  db.set((d) => {
    let stock = d.inventoryStock.find(s => s.batchId === input.batchId && s.locationType === input.locationType);
    
    if (input.quantityChange < 0) {
      const needed = Math.abs(input.quantityChange);
      if (!stock || stock.quantityOnHand < needed) {
        // Fallback to any location that has enough stock
        const alt = d.inventoryStock.find(s => s.batchId === input.batchId && s.quantityOnHand >= needed);
        if (alt) {
          stock = alt;
          input.locationType = alt.locationType; // update input so ledger reflects true location
        } else if (!stock) {
          throw new Error("Insufficient stock in any location");
        }
      }
    }

    if (!stock) {
      if (input.quantityChange < 0) throw new Error("Insufficient stock in location");
      stock = {
        id: db.uid(),
        batchId: input.batchId,
        locationType: input.locationType,
        rackCode: input.rackCode,
        quantityOnHand: 0,
        reservedQuantity: 0,
        createdAt: now,
      };
      d.inventoryStock.push(stock);
    }
    
    const nextQty = stock.quantityOnHand + input.quantityChange;
    if (nextQty < 0) throw new Error("Insufficient stock");
    stock.quantityOnHand = nextQty;

    d.inventoryLedger.unshift({
      id: db.uid(),
      batchId: input.batchId,
      movementType: input.movementType,
      quantityChange: input.quantityChange,
      referenceDocId: input.referenceDocId,
      userId: input.userId,
      timestamp: now,
    });
    
    d.activityLogs.unshift({
      id: db.uid(),
      userId: input.userId,
      userName: input.userName,
      action: `Stock ${input.movementType} · ${Math.abs(input.quantityChange)} units`,
      entityType: "inventory_stock",
      entityId: stock.id,
      details: { location: stock.locationType, delta: input.quantityChange },
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

// FEFO: earliest-expiry-first batch picker. Returns picks that sum up to <= qty available.
export function pickBatchesFEFO(
  batches: Batch[],
  inventory: InventoryStock[],
  medicineId: string,
  qty: number,
): { batchId: string; stockId: string; locationType: LocationType; rackCode: string; quantity: number }[] {
  const now = Date.now();

  const candidates = batches
    .filter(
      (b) =>
        b.medicineId === medicineId &&
        new Date(b.expiryDate).getTime() > now,
    )
    .sort(
      (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
    );
    
  const picks: { batchId: string; stockId: string; locationType: LocationType; rackCode: string; quantity: number }[] = [];
  let remaining = qty;
  for (const b of candidates) {
    if (remaining <= 0) break;
    const stocks = inventory.filter(s => s.batchId === b.id && s.quantityOnHand > 0);
    for (const s of stocks) {
      if (remaining <= 0) break;
      const take = Math.min(s.quantityOnHand, remaining);
      picks.push({ batchId: b.id, stockId: s.id, locationType: s.locationType, rackCode: s.rackCode, quantity: take });
      remaining -= take;
    }
  }
  return picks;
}
