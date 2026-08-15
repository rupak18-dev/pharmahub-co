// Seeds a curated demo catalogue of medicines into MongoDB so the Batches flow
// has realistic data to join against. Idempotent — skips names already present.
// Usage: npm run seed:medicines
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

const manufacturers = {
  Cipla: "mfr-cipla",
  "Sun Pharma": "mfr-sun-pharma",
  GSK: "mfr-gsk",
  USV: "mfr-usv",
  Zydus: "mfr-zydus",
  Alkem: "mfr-alkem",
};

const categories = {
  Analgesics: "cat-analgesics",
  Antibiotics: "cat-antibiotics",
  Cardiovascular: "cat-cardiovascular",
  "Vitamins & Supplements": "cat-vitamins",
  Gastro: "cat-gastro",
  Respiratory: "cat-respiratory",
  Diabetic: "cat-diabetic",
};

const seedMeds = [
  {
    name: "Paracetamol 500mg",
    generic: "Paracetamol",
    brand: "Crocin",
    manufacturer: "GSK",
    category: "Analgesics",
    hsn: "3004",
    gst: 12,
    storage: "Store below 25°C",
    reorder: 100,
    packSize: "10 Tablets",
    strength: "500 mg",
    dosageForm: "Tablet",
  },
  {
    name: "Amoxicillin 250mg",
    generic: "Amoxicillin",
    brand: "Novamox",
    manufacturer: "Cipla",
    category: "Antibiotics",
    hsn: "3004",
    gst: 12,
    storage: "Store below 25°C",
    reorder: 80,
    packSize: "15 Capsules",
    strength: "250 mg",
    dosageForm: "Capsule",
  },
  {
    name: "Azithromycin 500mg",
    generic: "Azithromycin",
    brand: "Azithral",
    manufacturer: "Alkem",
    category: "Antibiotics",
    hsn: "3004",
    gst: 12,
    storage: "Store below 25°C",
    reorder: 60,
    packSize: "5 Tablets",
    strength: "500 mg",
    dosageForm: "Tablet",
  },
  {
    name: "Metformin 500mg",
    generic: "Metformin",
    brand: "Glyciphage",
    manufacturer: "USV",
    category: "Diabetic",
    hsn: "3004",
    gst: 12,
    storage: "Store below 25°C",
    reorder: 150,
    packSize: "10 Tablets",
    strength: "500 mg",
    dosageForm: "Tablet",
  },
  {
    name: "Amoxiclav 625mg",
    generic: "Amoxicillin + Clavulanic Acid",
    brand: "Augmentin Duo",
    manufacturer: "GSK",
    category: "Antibiotics",
    hsn: "3004",
    gst: 12,
    storage: "Store in a dry place below 25°C",
    reorder: 60,
    packSize: "6 Tablets",
    strength: "625 mg",
    dosageForm: "Tablet",
  },
  {
    name: "Cetirizine 10mg",
    generic: "Cetirizine Hydrochloride",
    brand: "Cetzine",
    manufacturer: "USV",
    category: "Respiratory",
    hsn: "3004",
    gst: 12,
    storage: "Store below 25°C",
    reorder: 100,
    packSize: "10 Tablets",
    strength: "10 mg",
    dosageForm: "Tablet",
  },
  {
    name: "Atorvastatin 20mg",
    generic: "Atorvastatin",
    brand: "Atorva",
    manufacturer: "Zydus",
    category: "Cardiovascular",
    hsn: "3004",
    gst: 12,
    storage: "Store below 25°C",
    reorder: 90,
    packSize: "10 Tablets",
    strength: "20 mg",
    dosageForm: "Tablet",
  },
  {
    name: "Vitamin D3 60000IU",
    generic: "Cholecalciferol",
    brand: "Uprise-D3",
    manufacturer: "Alkem",
    category: "Vitamins & Supplements",
    hsn: "3004",
    gst: 12,
    storage: "Store below 25°C",
    reorder: 50,
    packSize: "4 Capsules",
    strength: "60000 IU",
    dosageForm: "Capsule",
  },
  {
    name: "Pantoprazole 40mg",
    generic: "Pantoprazole",
    brand: "Pantocid",
    manufacturer: "Sun Pharma",
    category: "Gastro",
    hsn: "3004",
    gst: 12,
    storage: "Store below 25°C",
    reorder: 90,
    packSize: "10 Tablets",
    strength: "40 mg",
    dosageForm: "Tablet",
  },
  {
    name: "Ibuprofen 400mg",
    generic: "Ibuprofen",
    brand: "Brufen",
    manufacturer: "Zydus",
    category: "Analgesics",
    hsn: "3004",
    gst: 12,
    storage: "Store below 25°C",
    reorder: 100,
    packSize: "10 Tablets",
    strength: "400 mg",
    dosageForm: "Tablet",
  },
];

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000,
  // OS resolver — c-ares fails on this NAT64 network.
  lookup: (hostname, options, callback) => dns.lookup(hostname, options, callback),
});

async function main() {
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection("medicines");

  let inserted = 0;
  let skipped = 0;

  for (const m of seedMeds) {
    const existing = await col.findOne({ name: m.name });
    if (existing) {
      skipped += 1;
      continue;
    }
    await col.insertOne({
      name: m.name,
      generic: m.generic,
      brand: m.brand,
      manufacturerId: manufacturers[m.manufacturer] ?? null,
      manufacturerName: m.manufacturer ?? null,
      categoryId: categories[m.category] ?? null,
      categoryName: m.category ?? null,
      hsn: m.hsn,
      gst: m.gst,
      storage: m.storage,
      reorder: m.reorder,
      packSize: m.packSize,
      strength: m.strength,
      dosageForm: m.dosageForm,
      isActive: true,
    });
    inserted += 1;
  }

  const total = await col.countDocuments();
  console.log(`Medicines seeded: inserted=${inserted}, skipped=${skipped}, total=${total}`);
  await client.close();
}

main().catch((err) => {
  console.error("seed:medicines failed:", err.message);
  process.exit(1);
});
