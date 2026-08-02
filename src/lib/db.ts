import type {
  Audit,
  AuditCount,
  AdjustmentAction,
  AuditTimelineAction,
  AuditTimelineEvent,
  Batch,
  DB,
  StockAdjustment,
  VarianceItem,
  VarianceReason,
} from "./types";
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
    {
      name: "Paracetamol 650mg",
      generic: "Paracetamol",
      brand: "Dolo 650",
      prefix: "DL",
      strength: "650mg",
      dosage: "Tablet",
      cat: catAnalg.id,
      mfr: mfr5.id,
      hsn: "3004",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 60,
    },
    {
      name: "Amoxicillin + Clavulanate 625mg",
      generic: "Amoxicillin + Clavulanic Acid",
      brand: "Augmentin",
      prefix: "AG",
      strength: "625mg",
      dosage: "Tablet",
      cat: catAntib.id,
      mfr: mfr3.id,
      hsn: "3004",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 40,
    },
    {
      name: "Metformin 1g SR",
      generic: "Metformin",
      brand: "Glycomet SR",
      prefix: "GS",
      strength: "1g",
      dosage: "SR Tablet",
      cat: catDiabetic.id,
      mfr: mfr4.id,
      hsn: "3004",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 50,
    },
    {
      name: "Telmisartan 40mg",
      generic: "Telmisartan",
      brand: "Telma",
      prefix: "TL",
      strength: "40mg",
      dosage: "Tablet",
      cat: catCardio.id,
      mfr: mfr6.id,
      hsn: "3004",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 45,
    },
  ];

  const medicines = meds.map((m) => ({
    id: uid(),
    name: m.name,
    genericName: m.generic,
    brandName: m.brand,
    strength: m.strength,
    dosageForm: m.dosage,
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
    reason: "Purchase Inward (seed)",
    createdBy: owner.id,
    createdAt: b.createdAt,
  }));

  const batchA = (i: number) => batches[i * 2];

  const audits: Audit[] = [];
  const auditCounts: AuditCount[] = [];
  const variances: VarianceItem[] = [];
  const adjustments: StockAdjustment[] = [];

  const medNameOf = (batchId: string) =>
    medicines.find((m) => m.id === batches.find((x) => x.id === batchId)?.medicineId)?.name ?? "—";

  const a1: Audit = {
    id: uid(),
    auditNumber: "AUD-0001",
    type: "full",
    title: "HQ · Full Store Audit",
    branch: branchNames[0],
    batchIds: batches.slice(0, 10).map((x) => x.id),
    assignedUserIds: [pharm.id, inv.id],
    scheduledDate: daysFromNow(-6),
    status: "completed",
    createdBy: owner.id,
    createdByName: owner.name,
    createdAt: daysFromNow(-7),
    startedAt: daysFromNow(-5),
    submittedAt: daysFromNow(-3),
    completedAt: daysFromNow(-3),
    timeline: [
      { id: uid(), action: "created", at: daysFromNow(-7), byUserId: owner.id, byName: owner.name },
      { id: uid(), action: "started", at: daysFromNow(-5), byUserId: pharm.id, byName: pharm.name },
      { id: uid(), action: "submitted", at: daysFromNow(-3), byUserId: pharm.id, byName: pharm.name },
      { id: uid(), action: "approved", at: daysFromNow(-3), byUserId: inv.id, byName: inv.name },
      { id: uid(), action: "completed", at: daysFromNow(-3), byUserId: owner.id, byName: owner.name },
    ],
  };
  audits.push(a1);

  a1.batchIds.forEach((bid, i) => {
    const b = batches.find((x) => x.id === bid);
    if (!b) return;
    const delta = i === 2 ? -12 : i === 5 ? 9 : i === 8 ? -5 : 0;
    auditCounts.push({
      id: uid(),
      auditId: a1.id,
      batchId: b.id,
      medicineId: b.medicineId,
      medicineName: medNameOf(b.id),
      batchNumber: b.batchNumber,
      shelf: "—",
      expectedQty: b.currentStock,
      physicalQty: b.currentStock + delta,
      countedBy: pharm.id,
      countedByName: pharm.name,
      countedAt: daysFromNow(-4),
      device: "Scanner USB",
    });
  });

  const varianceOf = (
    batch: Batch,
    audit: Audit,
    delta: number,
    reason: VarianceReason,
    extra?: Partial<VarianceItem>,
  ): VarianceItem => ({
    id: uid(),
    auditId: audit.id,
    batchId: batch.id,
    medicineId: batch.medicineId,
    medicineName: medNameOf(batch.id),
    batchNumber: batch.batchNumber,
    expectedQty: batch.currentStock,
    actualQty: batch.currentStock + delta,
    difference: delta,
    unitCost: batch.purchasePrice,
    varianceValue: Math.abs(delta) * batch.purchasePrice,
    severity: Math.abs(delta) >= 10 ? "high" : "medium",
    reason,
    recommendedAction: reason === "theft" ? "approve" : reason === "billing_error" ? "reject" : "write_off",
    managerComment:
      reason === "theft"
        ? "Reconciled against CCTV — confirmed missing."
        : reason === "billing_error"
          ? "Counter check showed no error — book stock unchanged."
          : "Bottles cracked in transit.",
    verifiedBy: pharm.id,
    verifiedByName: pharm.name,
    status: "approved",
    createdAt: daysFromNow(-4),
    ...extra,
  });

  const v1 = varianceOf(batches[2], a1, -12, "theft");
  const v2 = varianceOf(batches[5], a1, 9, "damaged");
  const v3 = varianceOf(batches[8], a1, -5, "billing_error", { status: "rejected" });
  variances.push(v1, v2, v3);

  adjustments.push({
    id: uid(),
    auditId: a1.id,
    batchId: batches[2].id,
    medicineId: batches[2].medicineId,
    medicineName: medNameOf(batches[2].id),
    batchNumber: batches[2].batchNumber,
    action: "adjust",
    quantity: 12,
    unitCost: batches[2].purchasePrice,
    varianceId: v1.id,
    reason: "theft",
    severity: "high",
    submittedBy: pharm.id,
    submittedByName: pharm.name,
    createdAt: daysFromNow(-4),
    status: "applied",
    approverName: owner.name,
    approvedAt: daysFromNow(-3),
    appliedAt: daysFromNow(-3),
    appliedBy: owner.id,
    appliedByName: owner.name,
    history: [
      { id: uid(), action: "Submitted by staff", userId: pharm.id, userName: pharm.name, at: daysFromNow(-4) },
      { id: uid(), action: "Approved (Manager)", userId: owner.id, userName: owner.name, at: daysFromNow(-3) },
    ],
  });

  const a2: Audit = {
    id: uid(),
    auditNumber: "AUD-0002",
    type: "category",
    title: "HQ · Antibiotics Category Audit",
    branch: branchNames[0],
    categoryId: catAntib.id,
    batchIds: batches.slice(1, 7).map((x) => x.id),
    assignedUserIds: [pharm.id],
    scheduledDate: daysFromNow(-1),
    status: "paused",
    createdBy: owner.id,
    createdByName: owner.name,
    createdAt: daysFromNow(-3),
    startedAt: daysFromNow(-2),
    pausedAt: now,
    timeline: [
      { id: uid(), action: "created", at: daysFromNow(-3), byUserId: owner.id, byName: owner.name },
      { id: uid(), action: "started", at: daysFromNow(-2), byUserId: pharm.id, byName: pharm.name },
      { id: uid(), action: "paused", at: now, byUserId: pharm.id, byName: pharm.name, note: "Shift ended — resuming tomorrow" },
    ],
  };
  audits.push(a2);

  const a3: Audit = {
    id: uid(),
    auditNumber: "AUD-0003",
    type: "batch",
    title: "Downtown Annex · Batch Audit",
    branch: branchNames[1],
    batchIds: batches.slice(2, 8).map((x) => x.id),
    assignedUserIds: [pharm.id],
    scheduledDate: daysFromNow(-1),
    status: "pending_review",
    createdBy: owner.id,
    createdByName: owner.name,
    createdAt: daysFromNow(-2),
    startedAt: daysFromNow(-1),
    submittedAt: now,
    timeline: [
      { id: uid(), action: "created", at: daysFromNow(-2), byUserId: owner.id, byName: owner.name },
      { id: uid(), action: "started", at: daysFromNow(-1), byUserId: pharm.id, byName: pharm.name },
      { id: uid(), action: "submitted", at: now, byUserId: pharm.id, byName: pharm.name },
    ],
  };
  audits.push(a3);

  const activityLogs = [
    {
      id: uid(),
      userId: owner.id,
      userName: owner.name,
      action: "Seeded demo data",
      entityType: "system",
      createdAt: now,
    },
    {
      id: uid(),
      userId: inv.id,
      userName: inv.name,
      action: "Audit created · AUD-0001",
      entityType: "audit",
      entityId: a1.id,
      auditId: a1.id,
      details: { type: "full", branch: branchNames[0] },
      branch: branchNames[0],
      device: "Web · Chrome",
      createdAt: daysFromNow(-7),
    },
    {
      id: uid(),
      userId: pharm.id,
      userName: pharm.name,
      action: "Audit started · AUD-0001",
      entityType: "audit",
      entityId: a1.id,
      auditId: a1.id,
      oldValue: "scheduled",
      newValue: "in_progress",
      branch: branchNames[0],
      device: "iPhone · Scanner",
      createdAt: daysFromNow(-5),
    },
    {
      id: uid(),
      userId: pharm.id,
      userName: pharm.name,
      action: "Count recorded · Paracetamol 500mg · 168",
      entityType: "audit_count",
      auditId: a1.id,
      details: { batch: batchA(0).batchNumber, expected: batchA(0).currentStock, physical: 168 },
      reason: "Cycle count",
      branch: branchNames[0],
      device: "Scanner USB",
      createdAt: daysFromNow(-4),
    },
    {
      id: uid(),
      userId: pharm.id,
      userName: pharm.name,
      action: "Audit paused · AUD-0002",
      entityType: "audit",
      entityId: a2.id,
      auditId: a2.id,
      oldValue: "in_progress",
      newValue: "paused",
      reason: "Shift ended — resuming tomorrow",
      branch: branchNames[0],
      device: "Android · Web",
      createdAt: now,
    },
    {
      id: uid(),
      userId: pharm.id,
      userName: pharm.name,
      action: "Audit submitted for review · AUD-0003",
      entityType: "audit",
      entityId: a3.id,
      auditId: a3.id,
      oldValue: "in_progress",
      newValue: "pending_review",
      branch: branchNames[0],
      device: "iPhone · Camera",
      createdAt: daysFromNow(-1),
    },
    {
      id: uid(),
      userId: pharm.id,
      userName: pharm.name,
      action: "Adjustment submitted · Azithromycin 500mg",
      entityType: "adjustment",
      auditId: a3.id,
      details: { reason: "supplier_short_supply", qty: -16 },
      reason: "Supplier short supply",
      branch: branchNames[0],
      device: "Web · Chrome",
      createdAt: now,
    },
    {
      id: uid(),
      userId: inv.id,
      userName: inv.name,
      action: "Adjustment approved (Supervisor) · Amoxicillin + Clavulanate 625mg",
      entityType: "adjustment",
      auditId: a3.id,
      oldValue: "pending_supervisor",
      newValue: "pending_manager",
      branch: branchNames[0],
      device: "Web · Chrome",
      createdAt: now,
    },
    {
      id: uid(),
      userId: owner.id,
      userName: owner.name,
      action: "Inventory updated · AUD-0001",
      entityType: "audit",
      entityId: a1.id,
      auditId: a1.id,
      oldValue: "approved",
      newValue: "applied",
      reason: "Theft write-down posted",
      branch: branchNames[0],
      device: "Web · Chrome",
      createdAt: daysFromNow(-3),
    },
  ];

  return {
    version: 2,
    profiles: [owner, pharm, cashier, inv],
    categories: [catAnalg, catAntib, catCardio, catVit, catGastro, catResp, catDiabetic],
    manufacturers: [mfr1, mfr2, mfr3, mfr4, mfr5, mfr6, mfr7],
    suppliers: [sup1, sup2, sup3],
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
    audits,
    auditCounts,
    variances,
    adjustments,
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
        stockMovements: loaded.stockMovements ?? [],
        sales: loaded.sales ?? [],
        purchaseOrders: loaded.purchaseOrders ?? [],
        grns: loaded.grns ?? [],
        writeOffs: loaded.writeOffs ?? [],
        creditNotes: loaded.creditNotes ?? [],
        transfers: loaded.transfers ?? [],
        reportSchedules: loaded.reportSchedules ?? [],
        audits: loaded.audits ?? seed().audits,
        auditCounts: loaded.auditCounts ?? seed().auditCounts,
        variances: loaded.variances ?? seed().variances,
        adjustments: loaded.adjustments ?? seed().adjustments,
        notificationsRead: loaded.notificationsRead ?? [],
        settings: {
          ...seed().settings,
          ...(loaded.settings ?? {}),
        },
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
