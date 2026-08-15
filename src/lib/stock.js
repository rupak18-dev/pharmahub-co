import { db } from "./db";
export function computeBatchStatus(batch, totalStock, nearExpiryDays) {
  const now = Date.now();
  // New Mongo schema nests these; legacy shape is flat.
  const expiry = batch.dates?.expiryDate ?? batch.expiryDate;
  const exp = new Date(expiry).getTime();
  const quarantined = batch.stock?.quarantined ?? batch.quarantined ?? 0;
  const state = batch.status?.state ?? batch.statusState;
  // Recall / retired-disposed statuses are merged into existing statuses for
  // now (they'll be reintroduced later): RECALLED -> quarantined, RETIRED -> sold_out.
  if (state === "RECALLED") return "quarantined";
  if (state === "RETIRED") return "sold_out";
  if (state === "QUARANTINED" || quarantined > 0) return "quarantined";
  if (totalStock <= 0 && exp >= now) return "sold_out";
  if (exp < now) return "expired";
  const daysLeft = (exp - now) / (1000 * 60 * 60 * 24);
  if (daysLeft <= nearExpiryDays) return "near_expiry";
  return "active";
}
const DEFAULT_LOCATION = "Front Shelf";
const DEFAULT_RACK = "General";
function movementToLedger(t) {
  return t === "in" ? "Purchase Inward" : t === "out" ? "Vendor Return" : "Adjustment";
}
function ledgerToMovement(t) {
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
export function applyStockMovement(input) {
  const now = new Date().toISOString();
  db.set((d) => {
    const batch = d.batches.find((b) => b.id === input.batchId);
    if (!batch) throw new Error("Batch not found");
    const isSimple = "quantity" in input;
    const ledgerType = isSimple ? movementToLedger(input.movementType) : input.movementType;
    const signed = isSimple
      ? input.movementType === "in"
        ? Math.abs(input.quantity)
        : -Math.abs(input.quantity)
      : input.quantityChange;
    const locationType = isSimple
      ? (d.inventoryStock.find((s) => s.batchId === input.batchId)?.locationType ??
        DEFAULT_LOCATION)
      : input.locationType;
    const rackCode = isSimple
      ? (d.inventoryStock.find((s) => s.batchId === input.batchId)?.rackCode ?? DEFAULT_RACK)
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
    });
    batch.currentStock = d.inventoryStock
      .filter((s) => s.batchId === input.batchId)
      .reduce((sum, s) => sum + s.quantityOnHand, 0);
    d.activityLogs.unshift({
      id: db.uid(),
      userId: input.userId,
      userName: input.userName,
      action: `Stock ${input.movementType} · ${Math.abs(signed)} units`,
      entityType: "batch",
      entityId: input.batchId,
      details: { reason: isSimple ? input.reason : `Stock ${ledgerType}`, delta: signed },
      createdAt: now,
    });
  });
}
export function logActivity(input) {
  db.set((d) => {
    d.activityLogs.unshift({
      id: db.uid(),
      ...input,
      createdAt: new Date().toISOString(),
    });
    if (d.activityLogs.length > 500) d.activityLogs.length = 500;
  });
}
export function pickBatchesFEFO(batches, inventoryOrMedicineId, medicineIdOrQty, qty) {
  if (!Array.isArray(batches)) return [];
  const hasInventory = Array.isArray(inventoryOrMedicineId);
  const medicineId = hasInventory ? medicineIdOrQty : inventoryOrMedicineId;
  const wanted = hasInventory ? qty : medicineIdOrQty;
  const inventory = hasInventory
    ? inventoryOrMedicineId
    : batches
        .filter((b) => b && b.medicineId === medicineId && (b.currentStock || 0) > 0)
        .map((b, i) => ({
          id: `stock-${i}`,
          batchId: b.id,
          locationType: DEFAULT_LOCATION,
          rackCode: DEFAULT_RACK,
          quantityOnHand: b.currentStock || 0,
          reservedQuantity: 0,
          createdAt: b.createdAt || new Date().toISOString(),
        }));
  const now = Date.now();
  const candidates = batches
    .filter((b) => {
      if (!b || b.medicineId !== medicineId) return false;
      try {
        return b.expiryDate ? new Date(b.expiryDate).getTime() > now : true;
      } catch {
        return true;
      }
    })
    .sort((a, b) => {
      try {
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      } catch {
        return 0;
      }
    });
  const picks = [];
  let remaining = wanted;
  for (const b of candidates) {
    if (remaining <= 0) break;
    const stocks = inventory.filter((s) => s && s.batchId === b.id && s.quantityOnHand > 0);
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
