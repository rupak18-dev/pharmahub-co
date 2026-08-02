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

const STORAGE_KEY = "pharmacyos_db_v3";

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
      strength: "500mg",
      dosage: "Tablet",
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
      strength: "250mg",
      dosage: "Capsule",
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
      strength: "500mg",
      dosage: "Tablet",
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
      strength: "10mg",
      dosage: "Tablet",
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
      strength: "500mg",
      dosage: "Tablet",
      cat: catDiabetic.id,
      mfr: mfr4.id,
      hsn: "3004",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 90,
    },
    {
      name: "Vitamin D3 60K IU",
      generic: "Cholecalciferol",
      brand: "Uprise-D3",
      strength: "60K IU",
      dosage: "Capsule",
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
      strength: "400mg",
      dosage: "Tablet",
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
    createdAt: now,
  }));

  const costs = [18, 22, 34, 20, 12, 28, 10, 20, 55, 18, 30];
  const nearDays = [0, 2, 4, 7, 12, 20, 30, 5, 9, 16, 24];
  const healthyDays = [90, 120, 150, 200, 260, 320, 365, 110, 170, 240, 300];
  const expiredFor = [0, 3, 6, 9];
  const pastDays = [3, 10, 25, 40];
  const shelves = [
    "R-01-A-01",
    "R-01-A-05",
    "R-02-B-03",
    "R-03-C-07",
    "R-04-C-12",
    "R-05-A-02",
    "R-06-B-11",
    "R-07-B-04",
    "R-01-A-08",
    "R-02-C-01",
    "R-03-A-02",
    "R-04-C-14",
  ];
  const suppliers = [sup1.id, sup2.id, sup3.id];
  const branchNames = ["HQ · Main Street", "Downtown Annex", "Sector 15 Branch"];

  const batches = medicines.flatMap((m, i) => {
    const cost = costs[i];
    const mrp = Math.round(cost * 1.8);
    const sell = Math.round(cost * 1.5);
    // Batch A - healthy
    const a = {
      id: uid(),
      medicineId: m.id,
      batchNumber: `B${(1200 + i * 4).toString()}A`,
      mfgDate: daysFromNow(-(healthyDays[i] + 180)),
      expiryDate: daysFromNow(healthyDays[i]),
      mrp,
      purchasePrice: cost,
      sellingPrice: sell,
      supplierId: suppliers[i % 3],
      shelfLocation: shelves[i % shelves.length],
      branch: branchNames[i % branchNames.length],
      quantityReceived: 200,
      currentStock: 200 - ((i * 13) % 90),
      status: "active" as const,
      createdAt: now,
    };
    // Batch B - near expiry (spread across the warning windows)
    const b = {
      id: uid(),
      medicineId: m.id,
      batchNumber: `B${(1200 + i * 4 + 1).toString()}B`,
      mfgDate: daysFromNow(-300),
      expiryDate: daysFromNow(nearDays[i]),
      mrp,
      purchasePrice: cost,
      sellingPrice: sell,
      supplierId: suppliers[(i + 1) % 3],
      shelfLocation: shelves[(i + 3) % shelves.length],
      branch: branchNames[(i + 1) % branchNames.length],
      quantityReceived: 100,
      currentStock: Math.max(4, 70 - ((i * 7) % 55)),
      status: "near_expiry" as const,
      createdAt: now,
    };
    // Batch C - expired (only some)
    const eIdx = expiredFor.indexOf(i);
    const c =
      eIdx !== -1
        ? {
            id: uid(),
            medicineId: m.id,
            batchNumber: `B${(1200 + i * 4 + 2).toString()}C`,
            mfgDate: daysFromNow(-500),
            expiryDate: daysFromNow(-pastDays[eIdx]),
            mrp,
            purchasePrice: cost,
            sellingPrice: sell,
            supplierId: suppliers[(i + 2) % 3],
            shelfLocation: shelves[(i + 6) % shelves.length],
            branch: branchNames[(i + 2) % branchNames.length],
            quantityReceived: 50,
            currentStock: 5 + ((i * 3) % 10),
            status: "expired" as const,
            createdAt: now,
          }
        : null;
    return c ? [a, b, c] : [a, b];
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

  const medById = new Map(medicines.map((m) => [m.id, m]));

  const sev = (value: number): "low" | "medium" | "high" | "critical" => {
    if (value >= 2000) return "critical";
    if (value >= 500) return "high";
    if (value >= 100) return "medium";
    return "low";
  };

  const tl = (
    action: AuditTimelineAction,
    at: string,
    user: { id: string; name: string },
    note?: string,
  ) => ({ id: uid(), action, at, byUserId: user.id, byName: user.name, ...(note ? { note } : {}) });

  const scopeFor = (ids: string[]) =>
    ids.map((id) => batches.find((b) => b.id === id) ?? null).filter(Boolean) as Batch[];

  const batchA = (i: number) => batches[i * 2];
  const batchB = (i: number) => batches[i * 2 + 1];

  // --- Stock audit seed data -----------------------------------------------
  const audits: Audit[] = [];
  const auditCounts: AuditCount[] = [];
  const variances: VarianceItem[] = [];
  const adjustments: StockAdjustment[] = [];

  const mkCount = (
    audit: Audit,
    batch: Batch,
    physical: number,
    extra?: Partial<AuditCount>,
  ): AuditCount => ({
    id: uid(),
    auditId: audit.id,
    batchId: batch.id,
    medicineId: batch.medicineId,
    medicineName: medById.get(batch.medicineId)?.name ?? "—",
    batchNumber: batch.batchNumber,
    shelf: batch.shelfLocation ?? "—",
    expectedQty: batch.currentStock,
    physicalQty: physical,
    countedBy: pharm.id,
    countedByName: pharm.name,
    countedAt: now,
    device: "Scanner USB",
    ...extra,
  });

  const mkVariance = (
    audit: Audit,
    batch: Batch,
    actual: number,
    reason: VarianceReason,
    extra?: Partial<VarianceItem>,
  ): VarianceItem => {
    const expected = batch.currentStock;
    const diff = actual - expected;
    const value = Math.abs(diff) * batch.purchasePrice;
    return {
      id: uid(),
      auditId: audit.id,
      batchId: batch.id,
      medicineId: batch.medicineId,
      medicineName: medById.get(batch.medicineId)?.name ?? "—",
      batchNumber: batch.batchNumber,
      expectedQty: expected,
      actualQty: actual,
      difference: diff,
      unitCost: batch.purchasePrice,
      varianceValue: value,
      severity: sev(value),
      reason,
      verifiedBy: pharm.id,
      verifiedByName: pharm.name,
      status: "pending",
      createdAt: now,
      ...extra,
    };
  };

  const mkAdjustment = (
    audit: Audit,
    batch: Batch,
    variance: VarianceItem,
    action: AdjustmentAction,
    extra?: Partial<StockAdjustment>,
  ): StockAdjustment => ({
    id: uid(),
    auditId: audit.id,
    batchId: batch.id,
    medicineId: batch.medicineId,
    medicineName: medById.get(batch.medicineId)?.name ?? "—",
    batchNumber: batch.batchNumber,
    action,
    quantity: action === "adjust" ? variance.difference : Math.abs(variance.difference),
    unitCost: batch.purchasePrice,
    varianceId: variance.id,
    reason: variance.reason ?? "unknown",
    severity: variance.severity,
    targetBranch: action === "transfer" ? branchNames[1] : undefined,
    submittedBy: pharm.id,
    submittedByName: pharm.name,
    createdAt: now,
    status: "pending_supervisor",
    history: [
      { id: uid(), action: "Submitted by staff", userId: pharm.id, userName: pharm.name, at: now },
    ],
    ...extra,
  });

  // AUD-0001 · Completed Full Store Audit (HQ)
  const a1 = {
    id: uid(),
    auditNumber: "AUD-0001",
    type: "full" as const,
    title: "HQ · Full Store Audit",
    branch: branchNames[0],
    batchIds: [] as string[],
    assignedUserIds: [pharm.id, inv.id],
    scheduledDate: daysFromNow(-6),
    status: "completed" as const,
    createdBy: owner.id,
    createdByName: owner.name,
    createdAt: daysFromNow(-7),
    startedAt: daysFromNow(-5),
    submittedAt: daysFromNow(-3),
    completedAt: daysFromNow(-3),
    timeline: [] as AuditTimelineEvent[],
  };
  a1.batchIds = Array.from({ length: 10 }, (_, i) => batchA(i).id);
  a1.timeline = [
    tl("created", daysFromNow(-7), owner),
    tl("started", daysFromNow(-5), pharm),
    tl("submitted", daysFromNow(-3), pharm),
    tl("approved", daysFromNow(-3), inv),
    tl("completed", daysFromNow(-3), owner),
  ];
  audits.push(a1);

  a1.batchIds.forEach((bid, i) => {
    const b = batches.find((x) => x.id === bid)!;
    const delta = i === 2 ? -12 : i === 5 ? 9 : i === 8 ? -5 : 0;
    auditCounts.push(mkCount(a1, b, b.currentStock + delta));
  });

  const v1 = mkVariance(
    a1,
    batches.find((x) => x.id === a1.batchIds[2])!,
    batches.find((x) => x.id === a1.batchIds[2])!.currentStock - 12,
    "theft",
    {
      status: "approved",
      recommendedAction: "approve",
      managerComment: "Reconciled against CCTV — confirmed missing.",
    },
  );
  const v2 = mkVariance(
    a1,
    batches.find((x) => x.id === a1.batchIds[5])!,
    batches.find((x) => x.id === a1.batchIds[5])!.currentStock + 9,
    "damaged",
    {
      status: "approved",
      recommendedAction: "write_off",
      managerComment: "Bottles cracked in transit.",
    },
  );
  const v3 = mkVariance(
    a1,
    batches.find((x) => x.id === a1.batchIds[8])!,
    batches.find((x) => x.id === a1.batchIds[8])!.currentStock - 5,
    "billing_error",
    {
      status: "rejected",
      recommendedAction: "reject",
      managerComment: "Counter check showed no error — book stock unchanged.",
    },
  );
  variances.push(v1, v2, v3);

  adjustments.push(
    mkAdjustment(
      a1,
      batches.find((x) => x.id === a1.batchIds[2])!,
      v1,
      "adjust",
      {
        status: "applied",
        approverName: owner.name,
        approvedAt: daysFromNow(-3),
        appliedAt: daysFromNow(-3),
        appliedBy: owner.id,
        appliedByName: owner.name,
        history: [
          {
            id: uid(),
            action: "Submitted by staff",
            userId: pharm.id,
            userName: pharm.name,
            at: daysFromNow(-4),
          },
          {
            id: uid(),
            action: "Approved (Supervisor)",
            userId: inv.id,
            userName: inv.name,
            at: daysFromNow(-3),
          },
          {
            id: uid(),
            action: "Approved (Manager)",
            userId: owner.id,
            userName: owner.name,
            at: daysFromNow(-3),
          },
          {
            id: uid(),
            action: "Inventory updated",
            userId: owner.id,
            userName: owner.name,
            at: daysFromNow(-3),
          },
        ],
      },
    ),
    mkAdjustment(
      a1,
      batches.find((x) => x.id === a1.batchIds[5])!,
      v2,
      "write_off",
      {
        status: "applied",
        approverName: owner.name,
        approvedAt: daysFromNow(-3),
        appliedAt: daysFromNow(-3),
        appliedBy: owner.id,
        appliedByName: owner.name,
        history: [
          {
            id: uid(),
            action: "Submitted by staff",
            userId: pharm.id,
            userName: pharm.name,
            at: daysFromNow(-4),
          },
          {
            id: uid(),
            action: "Approved (Supervisor)",
            userId: inv.id,
            userName: inv.name,
            at: daysFromNow(-3),
          },
          {
            id: uid(),
            action: "Approved (Manager)",
            userId: owner.id,
            userName: owner.name,
            at: daysFromNow(-3),
          },
          {
            id: uid(),
            action: "Inventory updated",
            userId: owner.id,
            userName: owner.name,
            at: daysFromNow(-3),
          },
        ],
      },
    ),
  );

  // AUD-0002 · Cycle Count — Paused at 68%
  const a2 = {
    id: uid(),
    auditNumber: "AUD-0002",
    type: "cycle" as const,
    title: "HQ · Cycle Count (A)",
    branch: branchNames[0],
    batchIds: Array.from({ length: 13 }, (_, i) => batchB(i).id),
    assignedUserIds: [pharm.id],
    scheduledDate: daysFromNow(-3),
    status: "paused" as const,
    createdBy: inv.id,
    createdByName: inv.name,
    createdAt: daysFromNow(-4),
    startedAt: daysFromNow(-1),
    pausedAt: now,
    timeline: [
      tl("created", daysFromNow(-4), inv),
      tl("started", daysFromNow(-1), pharm),
      tl("paused", now, pharm, "Shift ended — resuming tomorrow"),
    ] as AuditTimelineEvent[],
  };
  audits.push(a2);

  a2.batchIds.slice(0, 9).forEach((bid, i) => {
    const b = batches.find((x) => x.id === bid)!;
    const delta = i === 4 ? -3 : 0;
    auditCounts.push(
      mkCount(a2, b, b.currentStock + delta, {
        device: i % 2 ? "Android · Web" : "iPhone · Camera",
      }),
    );
  });
  const v4 = mkVariance(
    a2,
    batches.find((x) => x.id === a2.batchIds[4])!,
    batches.find((x) => x.id === a2.batchIds[4])!.currentStock - 3,
    "unknown",
    {
      status: "pending",
    },
  );
  variances.push(v4);

  // AUD-0003 · Shelf Audit — Pending Review (variance + approval demo)
  const a3 = {
    id: uid(),
    auditNumber: "AUD-0003",
    type: "shelf" as const,
    title: "HQ · R-01-A-01 Shelf Audit",
    branch: branchNames[0],
    shelf: "R-01-A-01",
    batchIds: [batchA(0), batchA(1), batchA(2), batchA(3), batchA(4), batchA(5)].map((b) => b.id),
    assignedUserIds: [pharm.id, inv.id],
    scheduledDate: daysFromNow(-2),
    status: "pending_review" as const,
    createdBy: inv.id,
    createdByName: inv.name,
    createdAt: daysFromNow(-3),
    startedAt: daysFromNow(-2),
    submittedAt: daysFromNow(-1),
    timeline: [
      tl("created", daysFromNow(-3), inv),
      tl("started", daysFromNow(-2), pharm),
      tl("submitted", daysFromNow(-1), pharm),
    ] as AuditTimelineEvent[],
  };
  audits.push(a3);

  a3.batchIds.forEach((bid, i) => {
    const b = batches.find((x) => x.id === bid)!;
    const delta = i === 1 ? -16 : i === 3 ? 7 : i === 4 ? -2 : 0;
    auditCounts.push(mkCount(a3, b, b.currentStock + delta));
  });

  const v5 = mkVariance(
    a3,
    batches.find((x) => x.id === a3.batchIds[1])!,
    batches.find((x) => x.id === a3.batchIds[1])!.currentStock - 16,
    "supplier_short_supply",
    {
      status: "pending",
      recommendedAction: "approve",
    },
  );
  const v6 = mkVariance(
    a3,
    batches.find((x) => x.id === a3.batchIds[3])!,
    batches.find((x) => x.id === a3.batchIds[3])!.currentStock + 7,
    "wrong_shelf",
    {
      status: "pending",
      recommendedAction: "transfer",
      managerComment: "Likely counted from neighbouring shelf.",
    },
  );
  const v7 = mkVariance(
    a3,
    batches.find((x) => x.id === a3.batchIds[4])!,
    batches.find((x) => x.id === a3.batchIds[4])!.currentStock - 2,
    "damaged",
    {
      status: "recount_requested",
      recommendedAction: "recount",
    },
  );
  variances.push(v5, v6, v7);

  adjustments.push(
    mkAdjustment(
      a3,
      batches.find((x) => x.id === a3.batchIds[1])!,
      v5,
      "adjust",
    ),
    mkAdjustment(
      a3,
      batches.find((x) => x.id === a3.batchIds[3])!,
      v6,
      "transfer",
      {
        status: "pending_manager",
        approverName: inv.name,
        approvedAt: now,
        history: [
          {
            id: uid(),
            action: "Submitted by staff",
            userId: pharm.id,
            userName: pharm.name,
            at: now,
          },
          {
            id: uid(),
            action: "Approved (Supervisor)",
            userId: inv.id,
            userName: inv.name,
            at: now,
          },
        ],
      },
    ),
  );

  // AUD-0004 · Scheduled today (Full, Annex)
  const a4 = {
    id: uid(),
    auditNumber: "AUD-0004",
    type: "full" as const,
    title: "Annex · Full Store Audit",
    branch: branchNames[1],
    batchIds: [] as string[],
    assignedUserIds: [pharm.id],
    scheduledDate: daysFromNow(0),
    status: "scheduled" as const,
    createdBy: inv.id,
    createdByName: inv.name,
    createdAt: daysFromNow(-1),
    timeline: [tl("created", daysFromNow(-1), inv)] as AuditTimelineEvent[],
  };
  a4.batchIds = Array.from(
    { length: 12 },
    (_, i) => (i % 3 === 0 ? batchB(i) : batchA(i)).id,
  ).slice(0, 12);
  audits.push(a4);

  // AUD-0005 · Overdue (Category, Antibiotics)
  const a5 = {
    id: uid(),
    auditNumber: "AUD-0005",
    type: "category" as const,
    title: "Antibiotics Category Audit",
    branch: branchNames[0],
    categoryId: catAntib.id,
    batchIds: [batchA(1), batchA(2), batchA(8)].map((b) => b.id),
    assignedUserIds: [pharm.id],
    scheduledDate: daysFromNow(-2),
    status: "scheduled" as const,
    createdBy: inv.id,
    createdByName: inv.name,
    createdAt: daysFromNow(-5),
    timeline: [tl("created", daysFromNow(-5), inv)] as AuditTimelineEvent[],
  };
  audits.push(a5);

  // AUD-0006 · Upcoming Shelf Audit
  audits.push({
    id: uid(),
    auditNumber: "AUD-0006",
    type: "shelf" as const,
    title: "Sector 15 · R-02-B-03",
    branch: branchNames[2],
    shelf: "R-02-B-03",
    batchIds: [batchB(0), batchB(1), batchB(2)].map((b) => b.id),
    assignedUserIds: [pharm.id],
    scheduledDate: daysFromNow(3),
    status: "scheduled" as const,
    createdBy: inv.id,
    createdByName: inv.name,
    createdAt: daysFromNow(0),
    timeline: [tl("created", daysFromNow(0), inv)] as AuditTimelineEvent[],
  });

  // AUD-0007 · Upcoming Cycle Count
  audits.push({
    id: uid(),
    auditNumber: "AUD-0007",
    type: "cycle" as const,
    title: "Annex · Cycle Count (B)",
    branch: branchNames[1],
    batchIds: Array.from({ length: 10 }, (_, i) => batchB(i).id),
    assignedUserIds: [pharm.id, inv.id],
    scheduledDate: daysFromNow(7),
    status: "scheduled" as const,
    createdBy: inv.id,
    createdByName: inv.name,
    createdAt: daysFromNow(0),
    timeline: [tl("created", daysFromNow(0), inv)] as AuditTimelineEvent[],
  });

  // AUD-0008 · Upcoming Batch Audit
  audits.push({
    id: uid(),
    auditNumber: "AUD-0008",
    type: "batch" as const,
    title: "Batch audit · Novamox / Augmentin",
    branch: branchNames[2],
    batchIds: [batchA(1).id, batchA(8).id],
    assignedUserIds: [pharm.id],
    scheduledDate: daysFromNow(10),
    status: "scheduled" as const,
    createdBy: inv.id,
    createdByName: inv.name,
    createdAt: daysFromNow(0),
    timeline: [tl("created", daysFromNow(0), inv)] as AuditTimelineEvent[],
  });

  // AUD-0009 · Upcoming Random Audit
  audits.push({
    id: uid(),
    auditNumber: "AUD-0009",
    type: "random" as const,
    title: "Random spot-check",
    branch: branchNames[0],
    batchIds: [batchA(2).id, batchA(6).id, batchA(9).id],
    assignedUserIds: [pharm.id],
    scheduledDate: daysFromNow(14),
    status: "scheduled" as const,
    createdBy: inv.id,
    createdByName: inv.name,
    createdAt: daysFromNow(0),
    timeline: [tl("created", daysFromNow(0), inv)] as AuditTimelineEvent[],
  });

  // AUD-0010 · Upcoming (next cycle)
  audits.push({
    id: uid(),
    auditNumber: "AUD-0010",
    type: "full" as const,
    title: "HQ · Month-end Full Store Audit",
    branch: branchNames[0],
    batchIds: Array.from({ length: 12 }, (_, i) => batchA(i).id),
    assignedUserIds: [pharm.id, inv.id],
    scheduledDate: daysFromNow(21),
    status: "scheduled" as const,
    createdBy: owner.id,
    createdByName: owner.name,
    createdAt: daysFromNow(0),
    timeline: [tl("created", daysFromNow(0), owner)] as AuditTimelineEvent[],
  });

  // AUD-0011 · Cancelled
  audits.push({
    id: uid(),
    auditNumber: "AUD-0011",
    type: "shelf" as const,
    title: "HQ · R-05-A-02 (cancelled)",
    branch: branchNames[0],
    shelf: "R-05-A-02",
    batchIds: [batchA(5).id, batchA(6).id],
    assignedUserIds: [pharm.id],
    scheduledDate: daysFromNow(-5),
    status: "cancelled" as const,
    createdBy: inv.id,
    createdByName: inv.name,
    createdAt: daysFromNow(-6),
    timeline: [
      tl("created", daysFromNow(-6), inv),
      tl("cancelled", daysFromNow(-4), owner, "Deferred — shelf merged into full audit"),
    ] as AuditTimelineEvent[],
  });

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
