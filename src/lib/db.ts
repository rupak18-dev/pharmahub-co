import type { DB } from "./types";
import { DEFAULT_PERMISSIONS } from "./permissions";

const STORAGE_KEY = "pharmacyos_db_v1";

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

  const batches = medicines.flatMap((m, i) => {
    const suppliers = [sup1.id, sup2.id];
    // Batch A - healthy
    const a = {
      id: uid(),
      medicineId: m.id,
      batchNumber: `B${(1000 + i * 3).toString()}A`,
      mfgDate: daysFromNow(-180),
      expiryDate: daysFromNow(365 + i * 20),
      mrp: 40 + i * 15,
      purchasePrice: 25 + i * 10,
      sellingPrice: 38 + i * 14,
      supplierId: suppliers[i % 2],
      quantityReceived: 200,
      currentStock: 200 - i * 15,
      status: "active" as const,
      createdAt: now,
    };
    // Batch B - near expiry
    const nearExpiryDays = 30 + i * 5;
    const b = {
      id: uid(),
      medicineId: m.id,
      batchNumber: `B${(1000 + i * 3 + 1).toString()}B`,
      mfgDate: daysFromNow(-300),
      expiryDate: daysFromNow(nearExpiryDays),
      mrp: 40 + i * 15,
      purchasePrice: 25 + i * 10,
      sellingPrice: 38 + i * 14,
      supplierId: suppliers[(i + 1) % 2],
      quantityReceived: 100,
      currentStock: Math.max(0, 60 - i * 4),
      status: "near_expiry" as const,
      createdAt: now,
    };
    // Batch C - expired (only some)
    if (i % 3 === 0) {
      const c = {
        id: uid(),
        medicineId: m.id,
        batchNumber: `B${(1000 + i * 3 + 2).toString()}C`,
        mfgDate: daysFromNow(-500),
        expiryDate: daysFromNow(-10 - i),
        mrp: 40 + i * 15,
        purchasePrice: 25 + i * 10,
        sellingPrice: 38 + i * 14,
        supplierId: suppliers[i % 2],
        quantityReceived: 50,
        currentStock: 10,
        status: "expired" as const,
        createdAt: now,
      };
      return [a, b, c];
    }
    return [a, b];
  });

  const stockMovements = batches.map((b) => ({
    id: uid(),
    medicineId: b.medicineId,
    batchId: b.id,
    movementType: "in" as const,
    quantity: b.quantityReceived,
    reason: "Initial stock received",
    createdBy: owner.id,
    createdAt: now,
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

    const pastMonths = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d;
    }).reverse();

    const sales: any[] = [];
    pastMonths.forEach((date, mIndex) => {
      const salesCount = 15 + Math.floor(Math.random() * 20); // 15 to 35 sales per month
      for (let i = 0; i < salesCount; i++) {
        const d = new Date(date);
        d.setDate(Math.floor(Math.random() * 28) + 1); // random day in month
        const b = batches[Math.floor(Math.random() * batches.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const lineTotal = b.sellingPrice * qty;
        sales.push({
          id: uid(),
          invoiceNo: `INV-${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          customerName: `Customer ${Math.floor(Math.random() * 100)}`,
          customerPhone: `98765${Math.floor(Math.random() * 90000) + 10000}`,
          items: [{
            medicineId: b.medicineId,
            batchId: b.id,
            medicineName: medicines.find(m => m.id === b.medicineId)?.name || 'Unknown',
            batchNumber: b.batchNumber,
            quantity: qty,
            unitPrice: b.sellingPrice,
            discountPct: 0,
            gstRate: medicines.find(m => m.id === b.medicineId)?.gstRate || 12,
            lineTotal: lineTotal
          }],
          subtotal: lineTotal,
          discountTotal: 0,
          gstTotal: lineTotal * 0.12,
          roundOff: 0,
          grandTotal: lineTotal * 1.12,
          paymentMode: Math.random() > 0.3 ? "upi" : "cash",
          tender: lineTotal * 1.12,
          change: 0,
          status: "completed",
          createdBy: owner.id,
          createdByName: owner.name,
          createdAt: d.toISOString(),
        });
      }
    });

    const purchaseOrders: any[] = [];
    pastMonths.forEach((date, mIndex) => {
      if (Math.random() > 0.5) {
        const d = new Date(date);
        d.setDate(Math.floor(Math.random() * 28) + 1);
        purchaseOrders.push({
          id: uid(),
          poNumber: `PO-${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`,
          supplierId: sup1.id,
          expectedDate: daysFromNow(7),
          items: [
            {
              medicineId: medicines[0].id,
              medicineName: medicines[0].name,
              quantity: 50,
              expectedPrice: 25,
            }
          ],
          status: mIndex === pastMonths.length - 1 ? "placed" : "received",
          createdBy: owner.id,
          createdAt: d.toISOString(),
        });
      }
    });

  return {
    version: 2,
    profiles: [owner, pharm, cashier, inv],
    categories: [catAnalg, catAntib, catCardio, catVit],
    manufacturers: [mfr1, mfr2, mfr3],
    suppliers: [sup1, sup2],
    medicines,
    batches,
    stockMovements,
    activityLogs,
    sales,
    purchaseOrders,
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
