import type { DB } from "./types";
import { DEFAULT_PERMISSIONS } from "./permissions";

const STORAGE_KEY = "pharmacyos_db_v2";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function seed(): DB {
  const now = new Date().toISOString();

  const owner = {
    id: uid(),
    name: "Alex Morgan",
    email: "owner@pharmacyos.demo",
    role: "Owner" as const,
    active: true,
    orgName: "PharmacyOS Demo",
    createdAt: now,
  };
  const pharm = {
    id: uid(),
    name: "Priya Shah",
    email: "pharmacist@pharmacyos.demo",
    role: "Pharmacist" as const,
    active: true,
    createdAt: now,
  };
  const cashier = {
    id: uid(),
    name: "Sam Chen",
    email: "cashier@pharmacyos.demo",
    role: "Cashier" as const,
    active: true,
    createdAt: now,
  };
  const inv = {
    id: uid(),
    name: "Diego Ruiz",
    email: "inventory@pharmacyos.demo",
    role: "Inventory Manager" as const,
    active: true,
    createdAt: now,
  };

  const catAnalg = { id: uid(), name: "Analgesics" };
  const catAntib = { id: uid(), name: "Antibiotics" };
  const catCardio = { id: uid(), name: "Cardiovascular" };
  const catVit = { id: uid(), name: "Vitamins & Supplements" };

  const mfr1 = { id: uid(), name: "Cipla", contactInfo: "sales@cipla.example" };
  const mfr2 = { id: uid(), name: "Sun Pharma", contactInfo: "sales@sunpharma.example" };
  const mfr3 = { id: uid(), name: "GSK", contactInfo: "sales@gsk.example" };

  const sup1 = {
    id: uid(),
    name: "MedSupply Co.",
    contactInfo: "orders@medsupply.example",
    gstNumber: "27ABCDE1234F1Z5",
    paymentTerms: "Net 30",
  };
  const sup2 = {
    id: uid(),
    name: "HealthDist Ltd.",
    contactInfo: "orders@healthdist.example",
    gstNumber: "29PQRST9876G2Z9",
    paymentTerms: "Net 15",
  };

  const meds = [
    {
      name: "Paracetamol 500mg",
      generic: "Paracetamol",
      brand: "Crocin",
      prefix: "CR",
      cat: catAnalg.id,
      mfr: mfr1.id,
      hsn: "3004",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 100,
    },
    {
      name: "Amoxicillin 250mg",
      generic: "Amoxicillin",
      brand: "Novamox",
      prefix: "NV",
      cat: catAntib.id,
      mfr: mfr1.id,
      hsn: "3004",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 80,
    },
    {
      name: "Azithromycin 500mg",
      generic: "Azithromycin",
      brand: "Azithral",
      prefix: "AZ",
      cat: catAntib.id,
      mfr: mfr2.id,
      hsn: "3004",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 50,
    },
    {
      name: "Atorvastatin 10mg",
      generic: "Atorvastatin",
      brand: "Atorlip",
      prefix: "AT",
      cat: catCardio.id,
      mfr: mfr2.id,
      hsn: "3004",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 60,
    },
    {
      name: "Metformin 500mg",
      generic: "Metformin",
      brand: "Glycomet",
      prefix: "GL",
      cat: catCardio.id,
      mfr: mfr1.id,
      hsn: "3004",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 90,
    },
    {
      name: "Vitamin D3 60K IU",
      generic: "Cholecalciferol",
      brand: "Uprise-D3",
      prefix: "VD",
      cat: catVit.id,
      mfr: mfr3.id,
      hsn: "3004",
      gst: 12,
      storage: "Store in a cool, dry place",
      reorder: 40,
    },
    {
      name: "Ibuprofen 400mg",
      generic: "Ibuprofen",
      brand: "Brufen",
      prefix: "BR",
      cat: catAnalg.id,
      mfr: mfr3.id,
      hsn: "3004",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 75,
    },
  ];

  const medicines = meds.map((m) => ({
    id: uid(),
    name: m.name,
    genericName: m.generic,
    brandName: m.brand,
    categoryId: m.cat,
    manufacturerId: m.mfr,
    hsnCode: m.hsn,
    gstRate: m.gst,
    storageRequirements: m.storage,
    barcode: `PH-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    reorderThreshold: m.reorder,
    isActive: true,
    prefix: m.prefix,
    createdAt: now,
  }));

  const batchCode = (prefix: string, year: number, month: number, seq: number) =>
    `${prefix}-${String(year).slice(-2)}${String(month).padStart(2, "0")}-${String(seq).padStart(2, "0")}`;

  const batches = medicines.flatMap((m, i) => {
    const suppliers = [sup1.id, sup2.id];
    const seq = i + 1;
    // Batch A - healthy
    const a = {
      id: uid(),
      medicineId: m.id,
      batchNumber: batchCode(m.prefix, 24, ((i * 2) % 12) + 1, seq),
      mfgDate: daysFromNow(-180),
      expiryDate: daysFromNow(365 + i * 20),
      mrp: 40 + i * 15,
      purchasePrice: 25 + i * 10,
      sellingPrice: 38 + i * 14,
      supplierId: suppliers[i % 2],
      createdAt: now,
    };
    // Batch B - near expiry
    const nearExpiryDays = 30 + i * 5;
    const b = {
      id: uid(),
      medicineId: m.id,
      batchNumber: batchCode(m.prefix, 24, ((i * 2 + 4) % 12) + 1, seq),
      mfgDate: daysFromNow(-300),
      expiryDate: daysFromNow(nearExpiryDays),
      mrp: 40 + i * 15,
      purchasePrice: 25 + i * 10,
      sellingPrice: 38 + i * 14,
      supplierId: suppliers[(i + 1) % 2],
      createdAt: now,
    };
    // Batch C - expired (only some)
    if (i % 3 === 0) {
      const c = {
        id: uid(),
        medicineId: m.id,
        batchNumber: batchCode(m.prefix, 23, ((i * 3 + 9) % 12) + 1, seq),
        mfgDate: daysFromNow(-500),
        expiryDate: daysFromNow(-10 - i),
        mrp: 40 + i * 15,
        purchasePrice: 25 + i * 10,
        sellingPrice: 38 + i * 14,
        supplierId: suppliers[i % 2],
        createdAt: now,
      };
      return [a, b, c];
    }
    return [a, b];
  });

  const stockQty = [180, 96, 42, 210, 75, 160, 110];
  const locPool = [
    "Front Shelf",
    "Front Shelf",
    "Backroom",
    "Cold Storage",
    "Front Shelf",
    "Backroom",
  ] as const;
  const rackPool = [
    "Aisle A, Shelf 1",
    "Aisle A, Shelf 2",
    "Backroom Rack 1",
    "Cold Room 1",
    "Aisle B, Shelf 1",
    "Backroom Rack 2",
  ];

  const inventoryStock = batches.map((b, i) => {
    let q = stockQty[i % stockQty.length];
    if (b.batchNumber.endsWith("-02")) q = Math.max(0, Math.round(q / 3));
    if (b.batchNumber.endsWith("-03")) q = 10;

    return {
      id: uid(),
      batchId: b.id,
      locationType: locPool[i % locPool.length],
      rackCode: rackPool[i % rackPool.length],
      quantityOnHand: q,
      reservedQuantity: 0,
      createdAt: now,
    };
  });

  const inventoryLedger = inventoryStock.map((s) => ({
    id: uid(),
    batchId: s.batchId,
    movementType: "Purchase Inward" as const,
    quantityChange: s.quantityOnHand,
    userId: owner.id,
    timestamp: now,
  }));

  const activityLogs = [
    {
      id: uid(),
      userId: owner.id,
      userName: owner.name,
      action: "Seeded demo data",
      entityType: "system",
      createdAt: now,
    },
  ];

  return {
    version: 2,
    profiles: [owner, pharm, cashier, inv],
    categories: [catAnalg, catAntib, catCardio, catVit],
    manufacturers: [mfr1, mfr2, mfr3],
    suppliers: [sup1, sup2],
    medicines,
    batches,
    inventoryStock,
    inventoryLedger,
    activityLogs,
    sales: [],
    purchaseOrders: [],
    grns: [],
    notificationsRead: [],
    settings: {
      currency: "₹",
      gstDefault: 12,
      nearExpiryDays: 90,
      deadStockDays: 90,
      lowStockDefault: 20,
    },
    permissions: DEFAULT_PERMISSIONS,
  };
}

type Listener = () => void;
const listeners = new Set<Listener>();

let cache: DB | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function load(): DB {
  if (cache) return cache;
  if (!isBrowser()) {
    cache = seed();
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const loaded = JSON.parse(raw) as Partial<DB>;
      // Migrate missing fields from older versions
      cache = {
        ...seed(),
        ...loaded,
        inventoryStock: loaded.inventoryStock ?? [],
        inventoryLedger: loaded.inventoryLedger ?? [],
        sales: loaded.sales ?? [],
        purchaseOrders: loaded.purchaseOrders ?? [],
        grns: loaded.grns ?? [],
        notificationsRead: loaded.notificationsRead ?? [],
      } as DB;
      return cache;
    }
  } catch {
    // ignore
  }
  cache = seed();
  save(cache);
  return cache;
}

function save(db: DB) {
  cache = db;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // ignore quota errors
    }
  }
  listeners.forEach((l) => l());
}

export const db = {
  get: (): DB => load(),
  set: (updater: (draft: DB) => DB | void) => {
    const current = load();
    const next = JSON.parse(JSON.stringify(current)) as DB;
    const result = updater(next);
    save(result ?? next);
  },
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  reset: () => {
    cache = seed();
    save(cache);
  },
  uid,
};

export function useDbUid() {
  return uid();
}
