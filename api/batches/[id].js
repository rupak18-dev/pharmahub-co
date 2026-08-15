import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import { batchPatchSchema } from "../../src/lib/batch-schema.js";
import { getDb, toClientDoc } from "../_lib/mongo.js";

const QUARANTINE_DAYS = 14;

function movement(type, note, qty) {
  return {
    id: randomUUID(),
    type,
    note,
    qty: qty ?? 0,
    timestamp: new Date().toISOString(),
  };
}

async function loadBatch(col, id) {
  return col.findOne({ _id: new ObjectId(id) });
}

export default async function handler(req, res) {
  try {
    const db = await getDb();
    const col = db.collection("batches");
    const { id } = req.query ?? {};

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid batch id" });
    }

    if (req.method === "GET") {
      const doc = await loadBatch(col, id);
      if (!doc) return res.status(404).json({ error: "Batch not found" });
      return res.status(200).json({ data: toClientDoc(doc) });
    }

    if (req.method === "PATCH") {
      const parsed = batchPatchSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: parsed.error.flatten() });
      }
      const now = new Date().toISOString();
      const existing = await loadBatch(col, id);
      if (!existing) return res.status(404).json({ error: "Batch not found" });

      const patch = parsed.data;
      const next = {
        ...existing,
        dates: { ...(existing.dates ?? {}) },
        pricing: { ...(existing.pricing ?? {}) },
        status: { ...(existing.status ?? {}) },
        stock: { ...(existing.stock ?? {}) },
        warehouse: { ...(existing.warehouse ?? {}) },
        movements: [...(existing.movements ?? [])],
      };
      const onHand = next.stock.quantityOnHand ?? 0;
      const quarantined = next.stock.quarantined ?? 0;

      if (patch.action) {
        switch (patch.action) {
          case "quarantine":
            next.status.state = "QUARANTINED";
            next.status.quarantineReason = patch.reason || "Awaiting QC";
            next.dates.quarantineUntil = new Date(
              Date.now() + QUARANTINE_DAYS * 86400000,
            ).toISOString();
            next.stock.quarantined = quarantined + onHand;
            next.stock.quantityOnHand = 0;
            next.movements.push(movement("quarantined", "Quarantined · awaiting QC", onHand));
            break;
          case "activate":
            next.status.state = "ACTIVE";
            next.status.isRecalled = false;
            next.status.quarantineReason = null;
            next.dates.quarantineUntil = null;
            next.stock.quantityOnHand = quarantined;
            next.stock.quarantined = 0;
            next.movements.push(movement("activated", "Released from quarantine", quarantined));
            break;
          case "recall":
            next.status.state = "RECALLED";
            next.status.isRecalled = true;
            next.status.quarantineReason = patch.reason || "Batch recalled";
            next.movements.push(movement("recalled", patch.reason || "Batch recalled", 0));
            break;
          case "block":
            next.status.state = "BLOCKED";
            next.status.quarantineReason = patch.reason || "Blocked by administrator";
            next.movements.push(movement("blocked", patch.reason || "Batch blocked", 0));
            break;
          case "retire":
            next.status.state = "RETIRED";
            next.stock.quantityOnHand = 0;
            next.stock.quarantined = 0;
            next.movements.push(movement("retired", "Batch retired", 0));
            break;
        }
      } else {
        if (patch.medicineId !== undefined) next.medicineId = patch.medicineId;
        if (patch.supplierId !== undefined) next.supplierId = patch.supplierId;
        if (patch.batchNumber !== undefined) next.batchNumber = patch.batchNumber;
        if (patch.batchType !== undefined) next.batchType = patch.batchType;
        if (patch.dates) Object.assign(next.dates, patch.dates);
        if (patch.pricing) Object.assign(next.pricing, patch.pricing);
        if (patch.status) Object.assign(next.status, patch.status);
        if (patch.stock) {
          const before = next.stock.quantityOnHand ?? 0;
          Object.assign(next.stock, patch.stock);
          const after = next.stock.quantityOnHand ?? 0;
          if (after !== before) {
            next.movements.push(
              movement(
                "stock",
                `Stock adjusted · ${after - before >= 0 ? "+" : ""}${after - before}`,
                after - before,
              ),
            );
          }
        }
        if (patch.warehouse) {
          const movedTo = patch.warehouse.locationType ?? next.warehouse.locationType;
          const rack = patch.warehouse.rackCode ?? next.warehouse.rackCode;
          Object.assign(next.warehouse, patch.warehouse);
          next.movements.push(movement("moved", `Moved to ${movedTo} / ${rack}`, 0));
        }
        if (next.movements.length === (existing.movements ?? []).length) {
          next.movements.push(movement("updated", "Batch details updated", 0));
        }
      }

      next.version = (next.version ?? 1) + 1;
      next.audit = { ...(next.audit ?? {}), updatedAt: now };

      await col.updateOne({ _id: new ObjectId(id) }, { $set: next });
      const updated = await loadBatch(col, id);
      return res.status(200).json({ data: toClientDoc(updated) });
    }

    res.setHeader("Allow", "GET, PATCH");
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
