// Applies the agreed batch document schema to MongoDB Atlas:
//  - ensures the `batches` collection exists
//  - (re)sets the $jsonSchema validator to match src/lib/batch-schema.js
//  - creates the indexes used by the API
// Idempotent — safe to run repeatedly. Usage: npm run schema:apply
import dns from "node:dns";
import { MongoClient } from "mongodb";

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

const batchValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "medicineId",
      "batchNumber",
      "dates",
      "pricing",
      "status",
      "stock",
      "warehouse",
      "audit",
      "version",
    ],
    properties: {
      // The Mongoose backend stores ids as ObjectIds and dates as BSON Date;
      // the legacy direct-Mongo handler stored them as strings. Accept both.
      medicineId: { bsonType: ["objectId", "string"] },
      supplierId: { bsonType: ["objectId", "string", "null"] },
      batchNumber: { bsonType: "string", minLength: 1, maxLength: 40 },
      dates: {
        bsonType: "object",
        required: ["manufacturingDate", "expiryDate"],
        properties: {
          manufacturingDate: { bsonType: ["date", "string"] },
          expiryDate: { bsonType: ["date", "string"] },
          quarantineUntil: { bsonType: ["date", "string", "null"] },
        },
      },
      pricing: {
        bsonType: "object",
        required: ["purchasePrice", "mrp", "sellingPrice"],
        properties: {
          purchasePrice: { bsonType: "number", minimum: 0 },
          mrp: { bsonType: "number", minimum: 0 },
          sellingPrice: { bsonType: "number", minimum: 0 },
          gstRate: { bsonType: "number", minimum: 0 },
        },
      },
      status: {
        bsonType: "object",
        required: ["isRecalled", "state"],
        properties: {
          isRecalled: { bsonType: "bool" },
          state: {
            enum: ["ACTIVE", "QUARANTINED", "RECALLED", "BLOCKED", "RETIRED"],
          },
          quarantineReason: { bsonType: ["string", "null"] },
        },
      },
      stock: {
        bsonType: "object",
        required: ["quantityOnHand"],
        properties: {
          uom: { bsonType: "string" },
          quantityOnHand: { bsonType: "number", minimum: 0 },
          reservedQuantity: { bsonType: "number", minimum: 0 },
          quarantined: { bsonType: "number", minimum: 0 },
        },
      },
      warehouse: {
        bsonType: "object",
        required: ["locationType"],
        properties: {
          locationType: {
            enum: ["Front Shelf", "Backroom", "Cold Storage", "Quarantine"],
          },
          rackCode: { bsonType: "string", maxLength: 20 },
        },
      },
      audit: {
        bsonType: "object",
        required: ["createdAt", "updatedAt"],
        properties: {
          createdAt: { bsonType: ["date", "string"] },
          updatedAt: { bsonType: ["date", "string"] },
        },
      },
      version: { bsonType: "number", minimum: 1 },
    },
  },
};

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000,
  // OS resolver — c-ares fails on this NAT64 network.
  lookup: (hostname, options, callback) => dns.lookup(hostname, options, callback),
});

async function main() {
  await client.connect();
  const db = client.db(dbName);
  const colls = await db.listCollections({ name: "batches" }).toArray();

  if (colls.length === 0) {
    await db.createCollection("batches", { validator: batchValidator });
    console.log(`Created collection "batches" with validator on db "${dbName}".`);
  } else {
    await db.command({ collMod: "batches", validator: batchValidator });
    console.log(`Updated validator on existing "batches" collection (db "${dbName}").`);
  }

  const batches = db.collection("batches");
  // A batch number legitimately recurs (re-stocking the same lot, or the same
  // lot number appearing on a different medicine), so the old GLOBAL unique
  // index on batchNumber is dropped. It rejected every re-add with E11000 and
  // made "Add Batch" silently fail to persist. Replaced with a non-unique
  // compound index that still keeps medicine+batch lookups fast.
  try {
    await batches.dropIndex("batchNumber_1");
    console.log('Dropped old unique index "batchNumber_1".');
  } catch {
    // index already gone — fine
  }
  // On dbs that predate the nested schema (e.g. the legacy "test" db) the
  // compound index below ALREADY exists but UNIQUE — a second batch for the
  // same medicine+batch-number would be rejected with E11000. createIndex with
  // the same name cannot unset uniqueness, so drop it first.
  try {
    await batches.dropIndex("medicineId_1_batchNumber_1");
    console.log('Dropped old unique index "medicineId_1_batchNumber_1".');
  } catch {
    // not present — fine
  }
  // Legacy flat-field indexes that don't match the nested schema (harmless but
  // useless). Dropped to keep the collection clean.
  for (const name of [
    "expiryDate_1",
    "currentStock_1",
    "supplierId_1",
    "status_1",
    "medicineId_1",
  ]) {
    try {
      await batches.dropIndex(name);
      console.log(`Dropped legacy index "${name}".`);
    } catch {
      // not present — fine
    }
  }
  await batches.createIndex({ medicineId: 1, batchNumber: 1 });
  await batches.createIndex({ medicineId: 1, "dates.expiryDate": 1 });
  await batches.createIndex({ "status.state": 1 });
  console.log(
    "Indexes ensured: medicineId+batchNumber (non-unique), medicineId+expiry, status.state.",
  );

  await client.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error("schema:apply failed:", err.message);
  process.exit(1);
});
