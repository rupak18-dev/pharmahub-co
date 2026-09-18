import { randomUUID } from "node:crypto";
import { batchDocSchema } from "../src/lib/batch-schema.js";
import { getDb, toClientDoc } from "./_lib/mongo.js";

export default async function handler(req, res) {
  try {
    const db = await getDb();
    const col = db.collection("batches");

    if (req.method === "GET") {
      const filter = {};
      const { medicineId, state, search } = req.query ?? {};
      if (medicineId) filter.medicineId = medicineId;
      if (state) filter["status.state"] = state;
      if (search) {
        filter.batchNumber = { $regex: search, $options: "i" };
      }
      const docs = await col.find(filter).sort({ "dates.expiryDate": 1 }).toArray();
      return res.status(200).json({ data: docs.map(toClientDoc) });
    }

    if (req.method === "POST") {
      const parsed = batchDocSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: parsed.error.flatten() });
      }
      try {
        const doc = {
          ...parsed.data,
          movements: [
            {
              id: randomUUID(),
              type: "created",
              note: `Batch received · ${parsed.data.stock?.quantityOnHand ?? 0} units`,
              qty: parsed.data.stock?.quantityOnHand ?? 0,
              timestamp: new Date().toISOString(),
            },
          ],
        };
        const result = await col.insertOne(doc);
        const created = await col.findOne({ _id: result.insertedId });
        return res.status(201).json({ data: toClientDoc(created) });
      } catch (err) {
        if (err?.code === 11000) {
          return res.status(409).json({
            error: `A batch with number "${parsed.data.batchNumber}" already exists.`,
          });
        }
        throw err;
      }
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
