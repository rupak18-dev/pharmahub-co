import type {
  Audit,
  AuditCount,
  AdjustmentAction,
  AuditTimelineAction,
  AuditTimelineEvent,
  Batch,
  DB,
  Profile,
  StockAdjustment,
  VarianceItem,
  VarianceReason,
} from "./types";
import { DEFAULT_PERMISSIONS } from "./permissions";

const STORAGE_KEY = "PharmaHub_db_v2";

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

  const catAnalg = { id: uid(), name: "Analgesics" };
  const catAntib = { id: uid(), name: "Antibiotics" };
  const catCardio = { id: uid(), name: "Cardiovascular" };
  const catVit = { id: uid(), name: "Vitamins & Supplements" };
  const catGastro = { id: uid(), name: "Gastro" };
  const catResp = { id: uid(), name: "Respiratory" };
  const catDiabetic = { id: uid(), name: "Diabetic" };

  const mfr1 = { id: uid(), name: "Cipla", contactInfo: "sales@cipla.example" };
  const mfr2 = { id: uid(), name: "Sun Pharma", contactInfo: "sales@sunpharma.example" };
  const mfr3 = { id: uid(), name: "GSK", contactInfo: "sales@gsk.example" };
  const mfr4 = { id: uid(), name: "USV", contactInfo: "sales@usv.example" };
  const mfr5 = { id: uid(), name: "Micro Labs", contactInfo: "sales@microlabs.example" };
  const mfr6 = { id: uid(), name: "Zydus", contactInfo: "sales@zydus.example" };
  const mfr7 = { id: uid(), name: "Alkem", contactInfo: "sales@alkem.example" };

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
  const sup3 = {
    id: uid(),
    name: "CureWell Distributors",
    contactInfo: "orders@curewell.example",
    gstNumber: "24GHIJK5678H3X4",
    paymentTerms: "Net 30",
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
      salt: "Paracetamol IP 500mg",
      strength: "500 mg",
      dosageForm: "Tablet",
      packSize: "10 Tablets",
      gtin: "08901234567890",
      drugSchedule: "Schedule H",
      dosageInfo: "1 tablet every 4-6 hours as needed, max 4g daily.",
      usageInstructions: "Take with food to prevent gastric irritation. Swallow whole with water.",
      contraindications: "Severe hepatic impairment, active alcoholism.",
      sideEffects: "Nausea, skin rash, hepatotoxicity (in case of overdose).",
      maxStock: 1000,
      ptr: 15.5,
      rack: "A-12",
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
      salt: "Amoxicillin Trihydrate IP 250mg",
      strength: "250 mg",
      dosageForm: "Capsule",
      packSize: "15 Capsules",
      gtin: "08901234567891",
      drugSchedule: "Schedule H1",
      dosageInfo: "1 capsule three times daily for 5-7 days.",
      usageInstructions: "Complete full course of antibiotic as prescribed. Can be taken with or without food.",
      contraindications: "Hypersensitivity to penicillin class.",
      sideEffects: "Diarrhea, rash, oral thrush (long-term use).",
      maxStock: 500,
      ptr: 45.0,
      rack: "B-03",
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
      salt: "Azithromycin Dihydrate IP 500mg",
      strength: "500 mg",
      dosageForm: "Tablet",
      packSize: "5 Tablets",
      gtin: "08901234567892",
      drugSchedule: "Schedule H1",
      dosageInfo: "1 tablet once daily for 3-5 days.",
      usageInstructions: "Take 1 hour before or 2 hours after meals.",
      contraindications: "History of cholestatic jaundice/hepatic dysfunction associated with prior azithromycin use.",
      sideEffects: "Abdominal pain, loose stools, temporary hearing loss (very rare).",
      maxStock: 300,
      ptr: 82.0,
      rack: "B-05",
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
      salt: "Atorvastatin Calcium IP 10mg",
      strength: "10 mg",
      dosageForm: "Tablet",
      packSize: "15 Tablets",
      gtin: "08901234567893",
      drugSchedule: "Schedule H",
      dosageInfo: "1 tablet daily, preferably in the evening.",
      usageInstructions: "Avoid excessive grapefruit juice intake. Monitor for muscle pain.",
      contraindications: "Active liver disease, pregnancy, lactation.",
      sideEffects: "Headache, muscle ache (myalgia), mild liver enzyme elevation.",
      maxStock: 600,
      ptr: 32.5,
      rack: "C-01",
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
      salt: "Metformin Hydrochloride IP 500mg",
      strength: "500 mg",
      dosageForm: "Tablet (SR)",
      packSize: "15 Tablets",
      gtin: "08901234567894",
      drugSchedule: "Schedule H",
      dosageInfo: "1 tablet twice daily with morning and evening meals.",
      usageInstructions: "Do not crush or chew sustained-release tablets. Take with meals.",
      contraindications: "Renal impairment (eGFR < 30), metabolic acidosis.",
      sideEffects: "Gastrointestinal upset, metallic taste, lactic acidosis (rare).",
      maxStock: 800,
      ptr: 18.0,
      rack: "C-04",
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
      salt: "Cholecalciferol 60,000 IU",
      strength: "60000 IU",
      dosageForm: "Softgel Capsule",
      packSize: "4 Capsules",
      gtin: "08901234567895",
      drugSchedule: "OTC / General Sales List",
      dosageInfo: "1 capsule weekly for 8 weeks or as directed by physician.",
      usageInstructions: "Preferably take with a fat-containing meal for optimal absorption.",
      contraindications: "Hypercalcemia, hypervitaminosis D.",
      sideEffects: "Constipation, dry mouth, headache (only in hypercalcemia).",
      maxStock: 200,
      ptr: 78.0,
      rack: "V-02",
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
      salt: "Ibuprofen IP 400mg",
      strength: "400 mg",
      dosageForm: "Tablet",
      packSize: "15 Tablets",
      gtin: "08901234567896",
      drugSchedule: "Schedule H",
      dosageInfo: "1 tablet three times daily after food as needed.",
      usageInstructions: "Strictly avoid on empty stomach. Drink plenty of water.",
      contraindications: "Active peptic ulcer disease, coronary artery bypass surgery pain.",
      sideEffects: "Dyspepsia, heartburn, risk of gastrointestinal bleed.",
      maxStock: 400,
      ptr: 12.0,
      rack: "A-15",
    },
  ];

  for (let i = 0; i < 43; i++) {
    meds.push({
      name: `Test Medicine ${i + 1} 500mg`,
      generic: `Generic Alpha ${i + 1}`,
      brand: `PharmaBrand ${i % 5}`,
      prefix: "TM",
      cat: [catAnalg.id, catAntib.id, catCardio.id, catVit.id][i % 4],
      mfr: [mfr1.id, mfr2.id, mfr3.id][i % 3],
      hsn: "3004",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 50,
      salt: `Active Ingredient ${i + 1}`,
      strength: "500 mg",
      dosageForm: i % 3 === 0 ? "Syrup" : "Tablet",
      packSize: "10 units",
      gtin: `08901234567${100 + i}`,
      drugSchedule: "Schedule H",
      dosageInfo: "Standard adult dosage",
      usageInstructions: "Take with water after meals",
      contraindications: "None reported",
      sideEffects: "Mild nausea",
      maxStock: 500,
      ptr: 15.0 + (i % 30),
      rack: `R-${i % 10}`,
    });
  }

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

    // Enterprise fields mapped
    saltComposition: m.salt,
    strength: m.strength,
    dosageForm: m.dosageForm,
    packSize: m.packSize,
    gtin: m.gtin,
    drugSchedule: m.drugSchedule,
    dosageInfo: m.dosageInfo,
    usageInstructions: m.usageInstructions,
    contraindications: m.contraindications,
    sideEffects: m.sideEffects,
    maxStockLevel: m.maxStock,
    ptr: m.ptr,
    rackLocation: m.rack,
    reservedQuantity: Math.floor(Math.random() * 5),
  }));

  const batchCode = (prefix: string, year: number, month: number, seq: number) =>
    `${prefix}-${String(year).slice(-2)}${String(month).padStart(2, "0")}-${String(seq).padStart(2, "0")}`;

  const nearExpiryDays = 90;

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
      currentStock: 0,
      status: "active" as const,
      createdAt: now,
    };
    // Batch B - near expiry (spread across the warning windows)
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
      currentStock: 0,
      status: "near_expiry" as const,
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
        currentStock: 0,
        status: "expired" as const,
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
    userId: "system",
    timestamp: now,
  }));

  const branchNames = ["HQ · Main Street", "Downtown Annex", "Sector 15 Branch"];

  inventoryStock.forEach((s) => {
    const batch = batches.find((x) => x.id === s.batchId);
    if (batch) batch.currentStock = s.quantityOnHand;
  });

  const stockMovements = batches.map((b) => ({
    id: uid(),
    medicineId: b.medicineId,
    batchId: b.id,
    movementType: "in" as const,
    quantity: b.currentStock,
    reason: "Initial stock received",
    createdBy: "system",
    createdAt: now,
  }));

  const activityLogs: DB["activityLogs"] = [];

  const profiles: Profile[] = [
    {
      id: uid(),
      name: "Store Owner",
      email: "owner@PharmaHub.demo",
      role: "Owner",
      active: true,
      orgName: "PharmaHub",
      createdAt: now,
    },
    {
      id: uid(),
      name: "Demo Pharmacist",
      email: "pharmacist@PharmaHub.demo",
      role: "Pharmacist",
      active: true,
      orgName: "PharmaHub",
      createdAt: now,
    },
    {
      id: uid(),
      name: "Demo Cashier",
      email: "cashier@PharmaHub.demo",
      role: "Cashier",
      active: true,
      orgName: "PharmaHub",
      createdAt: now,
    },
    {
      id: uid(),
      name: "Inventory Manager",
      email: "inventory@PharmaHub.demo",
      role: "Inventory Manager",
      active: true,
      orgName: "PharmaHub",
      createdAt: now,
    },
  ];

  return {
    version: 2,
    profiles,
    categories: [catAnalg, catAntib, catCardio, catVit],
    manufacturers: [mfr1, mfr2, mfr3],
    suppliers: [sup1, sup2],
    medicines,
    batches,
    inventoryStock,
    inventoryLedger,
    stockMovements,
    activityLogs,
    sales: [],
    purchaseOrders: [],
    grns: [],
    writeOffs: [],
    creditNotes: [],
    transfers: [],
    reportSchedules: [],
    audits: [],
    auditCounts: [],
    variances: [],
    adjustments: [],
    notificationsRead: [],
    settings: {
      currency: "₹",
      gstDefault: 12,
      nearExpiryDays: 90,
      deadStockDays: 90,
      lowStockDefault: 20,
      autoSwap: false,
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

function mergeProfiles(
  seeded: Profile[],
  stored: Profile[] | undefined,
): Profile[] {
  if (!stored || stored.length === 0) return seeded;
  const existing = new Set(stored.map((p) => p.email.toLowerCase()));
  const missing = seeded.filter((p) => !existing.has(p.email.toLowerCase()));
  return [...stored, ...missing];
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

const MOJIBAKE_FIXES: ReadonlyArray<[string, string]> = [
  ["\u00E2\u20AC\u00A2", "\u2022"],
  ["\u00E2\u2020\u0090", "\u2190"],
  ["\u00E2\u0153\u201C", "\u2713"],
  ["\u00E2\u20AC\u201D", "\u2014"],
  ["\u00E2\u201A\u00B9", "\u20B9"],
  ["\u00C2\u00B7", "\u00B7"],
  ["\u00E2\u2020\u2019", "\u2192"],
  ["\u00E2\u20AC\u00A6", "\u2026"],
  ["\u00C2\u00B0", "\u00B0"],
  ["\u00C3\u2014", "\u00D7"],
  ["\u00C2\u00A9", "\u00A9"],
];

function fixMojibake(value: unknown): unknown {
  if (typeof value === "string") {
    let out = value;
    for (const [from, to] of MOJIBAKE_FIXES) {
      if (out.includes(from)) out = out.split(from).join(to);
    }
    return out;
  }
  if (Array.isArray(value)) return value.map(fixMojibake);
  if (value !== null && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      next[key] = fixMojibake((value as Record<string, unknown>)[key]);
    }
    return next;
  }
  return value;
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
      // Strip any legacy dummy profiles ending in @pharmacyos.demo or placeholder names
      const cleanProfiles = (loaded.profiles ?? []).filter(
        (p) =>
          !p.email.endsWith("@pharmacyos.demo") &&
          !["Alex Morgan", "Priya Shah", "Sam Chen", "Diego Ruiz"].includes(p.name),
      );

      cache = {
        ...seed(),
        ...loaded,
        profiles: cleanProfiles,
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
