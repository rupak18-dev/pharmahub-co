import { db } from "./db";
import type { Batch, BatchStatus, MovementType } from "./types";

export function computeBatchStatus(batch: Batch, nearExpiryDays: number): BatchStatus {
  if (batch.status === "disposed") return "disposed";
  const now = Date.now();
  const exp = new Date(batch.expiryDate).getTime();
  if (batch.currentStock <= 0 && batch.status !== "expired") return "sold_out";
  if (exp < now) return "expired";
  const daysLeft = (exp - now) / (1000 * 60 * 60 * 24);
  if (daysLeft <= nearExpiryDays) return "near_expiry";
  return "active";
}

export function refreshBatchStatuses() {
  db.set((d) => {
    const near = d.settings.nearExpiryDays;
    d.batches.forEach((b) => {
      b.status = computeBatchStatus(b, near);
    });
  });
}

interface ApplyMovement {
  medicineId: string;
  batchId: string;
  movementType: MovementType;
  quantity: number; // absolute magnitude
  reason: string;
  userId: string;
  userName: string;
  referenceId?: string;
}

export function applyStockMovement(input: ApplyMovement) {
  const now = new Date().toISOString();
  db.set((d) => {
    const batch = d.batches.find((b) => b.id === input.batchId);
    if (!batch) throw new Error("Batch not found");
    let delta = 0;
    if (input.movementType === "in") delta = Math.abs(input.quantity);
    else if (input.movementType === "out") delta = -Math.abs(input.quantity);
    else delta = input.quantity; // adjustment signed
    const nextStock = batch.currentStock + delta;
    if (nextStock < 0) throw new Error("Insufficient stock");
    batch.currentStock = nextStock;
    batch.status = computeBatchStatus(batch, d.settings.nearExpiryDays);

    d.stockMovements.unshift({
      id: db.uid(),
      medicineId: input.medicineId,
      batchId: input.batchId,
      movementType: input.movementType,
      quantity: delta,
      reason: input.reason,
      referenceId: input.referenceId,
      createdBy: input.userId,
      createdAt: now,
    });
    d.activityLogs.unshift({
      id: db.uid(),
      userId: input.userId,
      userName: input.userName,
      action: `Stock ${input.movementType} · ${Math.abs(delta)} units`,
      entityType: "batch",
      entityId: input.batchId,
      details: { reason: input.reason, delta },
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
