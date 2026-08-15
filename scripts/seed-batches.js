// Seeds exactly 10 demo batches into MongoDB covering every lifecycle status the
// UI shows (active, near expiry, expired, quarantined, sold out, recalled, disposed).
// Idempotent — skips batch numbers that already exist.
// Usage: npm run seed:batches
import dns from "node:dns";
import { MongoClient } from "mongodb";
import { LOCATION_PREFIXES } from "../src/lib/batch-schema.js";

try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(".env.local");
  }
} catch {
  // ignore — env comes from the shell
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Add it to .env.local or the shell env.");
  process.exit(1);
}
const dbName = process.env.MONGODB_DB || "pharmahub";

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000,
  // OS resolver — c-ares fails on this NAT64 network.
  lookup: (hostname, options, callback) => dns.lookup(hostname, options, callback),
});

const daysFrom = (days, base = Date.now()) => new Date(base + days * 86400000).toISOString();

function makeMovement(type, note, qty) {
  return {
    id: `seed-${Math.random().toString(36).slice(2, 10)}`,
    type,
    note,
    qty,
    timestamp: daysFrom(0),
  };
}

// One plan per batch. `state` drives the UI status badge:
//   ACTIVE + far expiry  -> active
//   ACTIVE + soon expiry -> near_expiry
//   ACTIVE + past expiry -> expired
//   ACTIVE + 0 stock     -> sold_out
//   QUARANTINED          -> quarantined
//   RECALLED             -> recalled
//   RETIRED              -> disposed
const plans = [
  {
    locationType: "Front Shelf",
    rackCode: "Aisle A, Shelf 1",
    mfgDate: daysFrom(-180),
    expiryDate: daysFrom(400),
    qty: 180,
    state: "ACTIVE",
    quarantined: 0,
  },
  {
    locationType: "Backroom",
    rackCode: "Backroom Rack 1",
    mfgDate: daysFrom(-150),
    expiryDate: daysFrom(320),
    qty: 96,
    state: "ACTIVE",
    quarantined: 0,
  },
  {
    locationType: "Front Shelf",
    rackCode: "Aisle B, Shelf 1",
    mfgDate: daysFrom(-300),
    expiryDate: daysFrom(45),
    qty: 42,
    state: "ACTIVE",
    quarantined: 0,
  },
  {
    locationType: "Front Shelf",
    rackCode: "Aisle B, Shelf 2",
    mfgDate: daysFrom(-330),
    expiryDate: daysFrom(7),
    qty: 210,
    state: "ACTIVE",
    quarantined: 0,
  },
  {
    locationType: "Backroom",
    rackCode: "Backroom Rack 2",
    mfgDate: daysFrom(-500),
    expiryDate: daysFrom(-20),
    qty: 30,
    state: "ACTIVE",
    quarantined: 0,
  },
  {
    locationType: "Backroom",
    rackCode: "Backroom Rack 3",
    mfgDate: daysFrom(-460),
    expiryDate: daysFrom(-8),
    qty: 75,
    state: "ACTIVE",
    quarantined: 0,
  },
  {
    locationType: "Quarantine",
    rackCode: "QC Hold 1",
    mfgDate: daysFrom(-120),
    expiryDate: daysFrom(200),
    qty: 0,
    state: "QUARANTINED",
    quarantineReason: "Awaiting QC",
    quarantined: 60,
    quarantineUntil: daysFrom(14),
  },
  {
    locationType: "Front Shelf",
    rackCode: "Aisle C, Shelf 1",
    mfgDate: daysFrom(-240),
    expiryDate: daysFrom(180),
    qty: 0,
    state: "ACTIVE",
    quarantined: 0,
  },
  {
    locationType: "Backroom",
    rackCode: "Recall Bay 1",
    mfgDate: daysFrom(-300),
    expiryDate: daysFrom(260),
    qty: 0,
    state: "RECALLED",
    quarantined: 0,
  },
  {
    locationType: "Backroom",
    rackCode: "Disposal Bay 1",
    mfgDate: daysFrom(-400),
    expiryDate: daysFrom(-60),
    qty: 0,
    state: "RETIRED",
    quarantined: 0,
  },
];

async function main() {
  await client.connect();
  const db = client.db(dbName);
  const medCol = db.collection("medicines");
  const batchCol = db.collection("batches");

  const meds = await medCol
    .find({ isActive: { $ne: false } })
    .sort({ name: 1 })
    .toArray();
  if (meds.length === 0) {
    console.error(
      "No medicines found. Run `npm run seed:medicines` first so batches have something to join against.",
    );
    process.exit(1);
  }

  // Sequence counter per location prefix + year + batch type, so batch numbers
  // follow the LL-YY-T-NNN format without colliding.
  const seq = new Map();
  const nextNumber = (locationType, mfgDate, batchType) => {
    const prefix = LOCATION_PREFIXES[locationType] ?? "PH";
    const year = String(new Date(mfgDate).getFullYear() % 100).padStart(2, "0");
    const key = `${prefix}-${year}-${batchType}`;
    const n = (seq.get(key) ?? 0) + 1;
    seq.set(key, n);
    return `${prefix}-${year}-${batchType}-${String(n).padStart(3, "0")}`;
  };

  const exists = async (batchNumber) => {
    const found = await batchCol.findOne({ batchNumber }, { projection: { _id: 1 } });
    return Boolean(found);
  };

  let inserted = 0;
  let skipped = 0;

  for (const [i, p] of plans.entries()) {
    const m = meds[i % meds.length];
    const batchNumber = nextNumber(p.locationType, p.mfgDate, "C");
    if (await exists(batchNumber)) {
      skipped += 1;
      continue;
    }
    const purchasePrice = 18 + ((i * 7) % 42);
    const mrp = Math.round(purchasePrice * 2.4 * 100) / 100;
    await batchCol.insertOne({
      medicineId: String(m._id),
      supplierId: null,
      batchNumber,
      batchType: "C",
      dates: {
        manufacturingDate: p.mfgDate,
        expiryDate: p.expiryDate,
        quarantineUntil: p.quarantineUntil ?? null,
      },
      pricing: { purchasePrice, mrp, sellingPrice: mrp, gstRate: 12 },
      status: {
        isRecalled: p.state === "RECALLED",
        state: p.state,
        quarantineReason: p.quarantineReason ?? null,
      },
      stock: {
        uom: "Strips",
        quantityOnHand: p.qty,
        reservedQuantity: 0,
        quarantined: p.quarantined ?? 0,
      },
      warehouse: {
        locationType: p.locationType,
        rackCode: p.rackCode,
      },
      audit: { createdAt: daysFrom(0), updatedAt: daysFrom(0) },
      version: 1,
      movements: [
        makeMovement("created", `Batch received · ${p.qty} strips`, p.qty),
        ...(p.state === "QUARANTINED"
          ? [makeMovement("quarantined", "Quarantined · awaiting QC", p.quarantined)]
          : []),
      ],
    });
    inserted += 1;
  }

  const total = await batchCol.countDocuments();
  console.log(`Batches seeded: inserted=${inserted}, skipped=${skipped}, total=${total}`);
  await client.close();
}

main().catch((err) => {
  console.error("seed:batches failed:", err.message);
  process.exit(1);
});
