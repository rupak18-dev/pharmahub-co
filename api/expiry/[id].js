import { ObjectId } from "mongodb";
import { getDb, toClientDoc } from "../_lib/mongo.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const RETURN_WINDOW_DAYS = 30;

export default async function handler(req, res) {
  const { id } = req.query ?? {};
  console.log(`[Expiry API] ${req.method} /api/expiry/${id}`);

  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, error: "Invalid batch id" });
  }

  try {
    const db = await getDb();
    console.log("[Expiry API] Connected to MongoDB ✓");

    const batchCol = db.collection("batches");
    const creditNotesCol = db.collection("creditNotes");
    const writeOffsCol = db.collection("writeOffs");
    const movementsCol = db.collection("stockMovements");

    const batch = await batchCol.findOne({ _id: new ObjectId(id) });
    if (!batch) {
      console.warn(`[Expiry API] Batch not found: ${id}`);
      return res.status(404).json({ success: false, error: "Batch not found" });
    }

    console.log(`[Expiry API] Loaded batch: ${batch.batchNumber} | Expiry: ${batch.expiryDate ?? batch.dates?.expiryDate}`);

    if (req.method === "GET") {
      return res.status(200).json({ success: true, data: toClientDoc(batch) });
    }

    if (req.method === "PATCH") {
      const { action, qty, reason, creditNoteNo, discountPct, targetBranch, targetBatchId, notes } = req.body ?? {};
      const now = new Date().toISOString();
      const nowMs = Date.now();

      const expiryDate = batch.expiryDate ?? batch.dates?.expiryDate ?? null;
      const currentStock = batch.currentStock ?? batch.stock?.quantityOnHand ?? 0;
      const purchasePrice = batch.purchasePrice ?? batch.pricing?.purchasePrice ?? 0;
      const daysLeft = expiryDate
        ? Math.round((new Date(expiryDate).getTime() - nowMs) / DAY_MS)
        : null;

      console.log(`[Expiry API] Action: "${action}" | Stock: ${currentStock} | Days left: ${daysLeft}`);

      // ── ACTION: dispose (write-off) ───────────────────────────────────────────
      if (action === "dispose") {
        const disposeQty = qty ?? currentStock;
        const lossValue = disposeQty * purchasePrice;

        console.log(`[Expiry API] Disposing ${disposeQty} units | Loss value: ${lossValue}`);

        const writeOff = {
          batchId: id,
          medicineId: String(batch.medicineId),
          quantity: disposeQty,
          valueWrittenOff: lossValue,
          reason: reason ?? "Expired — disposed",
          disposedAt: now,
          disposedBy: req.body?.userId ?? null,
        };
        const woResult = await writeOffsCol.insertOne(writeOff);
        console.log(`[Expiry API] Write-off recorded: ${woResult.insertedId}`);

        // Update batch: mark disposed, zero stock
        const update = {
          status: "disposed",
          currentStock: 0,
          "stock.quantityOnHand": 0,
          disposedAt: now,
          disposedQty: disposeQty,
        };
        await batchCol.updateOne({ _id: new ObjectId(id) }, { $set: update });

        // Log stock movement
        const movement = {
          batchId: id,
          medicineId: String(batch.medicineId),
          movementType: "out",
          quantity: disposeQty,
          reason: reason ?? "Disposed — expiry management",
          createdAt: now,
        };
        await movementsCol.insertOne(movement);
        console.log("[Expiry API] Stock movement logged ✓");

        const updated = await batchCol.findOne({ _id: new ObjectId(id) });
        return res.status(200).json({ success: true, data: toClientDoc(updated), writeOffId: String(woResult.insertedId) });
      }

      // ── ACTION: return (to supplier) ─────────────────────────────────────────
      if (action === "return") {
        if (daysLeft !== null && daysLeft < -RETURN_WINDOW_DAYS) {
          return res.status(400).json({ success: false, error: "Return window has closed (>30 days past expiry)" });
        }
        const retQty = qty ?? currentStock;
        const netValue = retQty * purchasePrice;

        console.log(`[Expiry API] Return: ${retQty} units | Net value: ₹${netValue} | Credit note: ${creditNoteNo}`);

        const creditNote = {
          batchId: id,
          medicineId: String(batch.medicineId),
          supplierId: batch.supplierId ? String(batch.supplierId) : null,
          quantity: retQty,
          netValue,
          creditNoteNo: creditNoteNo ?? null,
          returnedAt: now,
          returnedBy: req.body?.userId ?? null,
          reason: reason ?? "Returned to supplier — expiry management",
        };
        const cnResult = await creditNotesCol.insertOne(creditNote);
        console.log(`[Expiry API] Credit note recorded: ${cnResult.insertedId}`);

        const newStock = Math.max(0, currentStock - retQty);
        const stockUpdate = {
          currentStock: newStock,
          "stock.quantityOnHand": newStock,
          ...(newStock === 0 ? { status: "returned" } : {}),
        };
        await batchCol.updateOne({ _id: new ObjectId(id) }, { $set: stockUpdate });

        await movementsCol.insertOne({
          batchId: id,
          medicineId: String(batch.medicineId),
          movementType: "out",
          quantity: retQty,
          reason: `Returned to supplier | Credit note: ${creditNoteNo ?? "N/A"}`,
          createdAt: now,
        });
        console.log("[Expiry API] Stock movement for return logged ✓");

        const updated = await batchCol.findOne({ _id: new ObjectId(id) });
        return res.status(200).json({ success: true, data: toClientDoc(updated), creditNoteId: String(cnResult.insertedId) });
      }

      // ── ACTION: discount ─────────────────────────────────────────────────────
      if (action === "discount") {
        const pct = discountPct ?? 0;
        const discountedPrice = purchasePrice * (1 - pct / 100);
        console.log(`[Expiry API] Discount: ${pct}% | New price: ₹${discountedPrice.toFixed(2)}`);

        await batchCol.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              "pricing.discountPct": pct,
              "pricing.discountedPrice": parseFloat(discountedPrice.toFixed(2)),
              discountAppliedAt: now,
              discountNotes: notes ?? null,
            },
          }
        );
        await movementsCol.insertOne({
          batchId: id,
          medicineId: String(batch.medicineId),
          movementType: "adjustment",
          quantity: 0,
          reason: `Discount applied: ${pct}% off`,
          createdAt: now,
        });
        console.log(`[Expiry API] Discount of ${pct}% applied ✓`);

        const updated = await batchCol.findOne({ _id: new ObjectId(id) });
        return res.status(200).json({ success: true, data: toClientDoc(updated) });
      }

      // ── ACTION: transfer ─────────────────────────────────────────────────────
      if (action === "transfer") {
        const transferQty = qty ?? currentStock;
        console.log(`[Expiry API] Transfer: ${transferQty} units to branch "${targetBranch}" | Target batch: ${targetBatchId ?? "new"}`);

        const newStock = Math.max(0, currentStock - transferQty);
        await batchCol.updateOne(
          { _id: new ObjectId(id) },
          { $set: { currentStock: newStock, "stock.quantityOnHand": newStock } }
        );
        await movementsCol.insertOne({
          batchId: id,
          medicineId: String(batch.medicineId),
          movementType: "transfer-out",
          quantity: transferQty,
          reason: `Transferred to ${targetBranch ?? "another branch"}`,
          createdAt: now,
        });

        if (targetBatchId && ObjectId.isValid(targetBatchId)) {
          const targetBatch = await batchCol.findOne({ _id: new ObjectId(targetBatchId) });
          if (targetBatch) {
            const targetStock = (targetBatch.currentStock ?? targetBatch.stock?.quantityOnHand ?? 0) + transferQty;
            await batchCol.updateOne(
              { _id: new ObjectId(targetBatchId) },
              { $set: { currentStock: targetStock, "stock.quantityOnHand": targetStock } }
            );
            await movementsCol.insertOne({
              batchId: targetBatchId,
              medicineId: String(batch.medicineId),
              movementType: "transfer-in",
              quantity: transferQty,
              reason: `Received transfer from batch ${batch.batchNumber}`,
              createdAt: now,
            });
            console.log(`[Expiry API] Transfer-in logged to target batch ${targetBatchId} ✓`);
          }
        }

        const updated = await batchCol.findOne({ _id: new ObjectId(id) });
        return res.status(200).json({ success: true, data: toClientDoc(updated) });
      }

      console.warn(`[Expiry API] Unknown action: "${action}"`);
      return res.status(400).json({ success: false, error: `Unknown action "${action}"` });
    }

    res.setHeader("Allow", "GET, PATCH");
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error("[Expiry API] ❌ Error:", err.message, err.stack);
    return res.status(500).json({ success: false, error: err.message });
  }
}
