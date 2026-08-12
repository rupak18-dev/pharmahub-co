import { medicineDocSchema } from "../src/lib/batch-schema.js";
import { getDb, toClientDoc } from "./_lib/mongo.js";

export default async function handler(req, res) {
  try {
    const db = await getDb();
    const col = db.collection("medicines");

    if (req.method === "GET") {
      const filter = { isActive: { $ne: false } };
      const { search } = req.query ?? {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { generic: { $regex: search, $options: "i" } },
          { brand: { $regex: search, $options: "i" } },
        ];
      }
      const docs = await col.find(filter).sort({ name: 1 }).toArray();
      return res.status(200).json({ data: docs.map(toClientDoc) });
    }

    if (req.method === "POST") {
      const parsed = medicineDocSchema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: parsed.error.flatten() });
      }
      const result = await col.insertOne(parsed.data);
      const created = await col.findOne({ _id: result.insertedId });
      return res.status(201).json({ data: toClientDoc(created) });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
