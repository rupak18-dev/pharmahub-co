import type { Batch, DB, StockMovement } from "./types";
import { DEFAULT_PERMISSIONS } from "./permissions";
import { RACK_LOCATIONS } from "./racks";

const STORAGE_KEY = "pharmacyos_db_v1";
const DB_VERSION = 5;

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
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
  const catGI = { id: uid(), name: "Gastrointestinal" };
  const catResp = { id: uid(), name: "Respiratory & Allergy" };
  const catEndo = { id: uid(), name: "Endocrine & Diabetes" };
  const catDerm = { id: uid(), name: "Antiseptics & Wound Care" };

  const cats: Record<string, { id: string; name: string }> = {
    analgesics: catAnalg,
    antibiotics: catAntib,
    cardio: catCardio,
    vitamins: catVit,
    gi: catGI,
    resp: catResp,
    endo: catEndo,
    derm: catDerm,
  };

  const mfrCipla = { id: uid(), name: "Cipla", contactInfo: "sales@cipla.example" };
  const mfrSun = { id: uid(), name: "Sun Pharma", contactInfo: "sales@sunpharma.example" };
  const mfrGsk = { id: uid(), name: "GSK", contactInfo: "sales@gsk.example" };
  const mfrMankind = { id: uid(), name: "Mankind Pharma", contactInfo: "sales@mankind.example" };
  const mfrAbbott = { id: uid(), name: "Abbott", contactInfo: "sales@abbott.example" };
  const mfrZydus = { id: uid(), name: "Zydus", contactInfo: "sales@zydus.example" };

  const mfrs: Record<string, { id: string; name: string; contactInfo: string }> = {
    cipla: mfrCipla,
    sun: mfrSun,
    gsk: mfrGsk,
    mankind: mfrMankind,
    abbott: mfrAbbott,
    zydus: mfrZydus,
  };

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
    name: "Apex Pharma Distributors",
    contactInfo: "orders@apexpharma.example",
    gstNumber: "24APXPH1234H1Z8",
    paymentTerms: "Net 45",
  };

  interface CatalogEntry {
    n: string;
    g: string;
    b: string;
    cat: string;
    mfr: string;
    gst: number;
    storage: string;
    reorder: number;
    mrp: number;
    pts: number;
    sell: number;
    unit: string;
    fridge?: boolean;
  }

  const catalog: CatalogEntry[] = [
    // Analgesics
    {
      n: "Paracetamol 650mg",
      g: "Paracetamol",
      b: "Dolo 650",
      cat: "analgesics",
      mfr: "sun",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 100,
      mrp: 36,
      pts: 22,
      sell: 34,
      unit: "strips",
    },
    {
      n: "Ibuprofen 400mg",
      g: "Ibuprofen",
      b: "Brufen",
      cat: "analgesics",
      mfr: "gsk",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 75,
      mrp: 24,
      pts: 14,
      sell: 22,
      unit: "strips",
    },
    // Antibiotics
    {
      n: "Amoxicillin 250mg",
      g: "Amoxicillin",
      b: "Novamox",
      cat: "antibiotics",
      mfr: "cipla",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 80,
      mrp: 38,
      pts: 22,
      sell: 35,
      unit: "strips",
    },
    {
      n: "Amoxicillin + Clavulanate 625mg",
      g: "Amoxicillin + Clavulanate",
      b: "Augmentin",
      cat: "antibiotics",
      mfr: "gsk",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 60,
      mrp: 250,
      pts: 185,
      sell: 238,
      unit: "strips",
    },
    {
      n: "Azithromycin 500mg",
      g: "Azithromycin",
      b: "Azithral",
      cat: "antibiotics",
      mfr: "sun",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 50,
      mrp: 150,
      pts: 108,
      sell: 142,
      unit: "strips",
    },
    {
      n: "Doxycycline 100mg",
      g: "Doxycycline",
      b: "Doxy-1",
      cat: "antibiotics",
      mfr: "sun",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 55,
      mrp: 45,
      pts: 28,
      sell: 42,
      unit: "strips",
    },
    // Cardiovascular
    {
      n: "Atorvastatin 10mg",
      g: "Atorvastatin",
      b: "Atorlip",
      cat: "cardio",
      mfr: "cipla",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 60,
      mrp: 90,
      pts: 60,
      sell: 85,
      unit: "strips",
    },
    {
      n: "Metformin 500mg",
      g: "Metformin",
      b: "Glycomet",
      cat: "cardio",
      mfr: "sun",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 90,
      mrp: 30,
      pts: 18,
      sell: 28,
      unit: "strips",
    },
    {
      n: "Telmisartan 40mg",
      g: "Telmisartan",
      b: "Telma",
      cat: "cardio",
      mfr: "zydus",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 50,
      mrp: 100,
      pts: 68,
      sell: 95,
      unit: "strips",
    },
    {
      n: "Clopidogrel 75mg",
      g: "Clopidogrel",
      b: "Deplatt",
      cat: "cardio",
      mfr: "cipla",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 40,
      mrp: 55,
      pts: 34,
      sell: 52,
      unit: "strips",
    },
    // Vitamins & Supplements
    {
      n: "Vitamin D3 60K IU",
      g: "Cholecalciferol",
      b: "Uprise-D3",
      cat: "vitamins",
      mfr: "gsk",
      gst: 12,
      storage: "Cool, dry place",
      reorder: 40,
      mrp: 65,
      pts: 42,
      sell: 62,
      unit: "strips",
    },
    {
      n: "Multivitamin Tablets",
      g: "Multivitamin",
      b: "Becadexamin",
      cat: "vitamins",
      mfr: "gsk",
      gst: 12,
      storage: "Cool, dry place",
      reorder: 30,
      mrp: 90,
      pts: 58,
      sell: 85,
      unit: "boxes",
    },
    {
      n: "Calcium + Vitamin D3",
      g: "Calcium Carbonate + D3",
      b: "Shelcal",
      cat: "vitamins",
      mfr: "abbott",
      gst: 12,
      storage: "Cool, dry place",
      reorder: 45,
      mrp: 120,
      pts: 80,
      sell: 115,
      unit: "strips",
    },
    {
      n: "Zinc + Vitamin C",
      g: "Zinc + Ascorbic Acid",
      b: "Zincovit",
      cat: "vitamins",
      mfr: "mankind",
      gst: 12,
      storage: "Cool, dry place",
      reorder: 40,
      mrp: 75,
      pts: 48,
      sell: 71,
      unit: "strips",
    },
    // Gastrointestinal
    {
      n: "Omeprazole 20mg",
      g: "Omeprazole",
      b: "Omez",
      cat: "gi",
      mfr: "cipla",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 60,
      mrp: 22,
      pts: 12,
      sell: 20,
      unit: "strips",
    },
    {
      n: "Pantoprazole 40mg",
      g: "Pantoprazole",
      b: "Pan",
      cat: "gi",
      mfr: "zydus",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 55,
      mrp: 40,
      pts: 24,
      sell: 38,
      unit: "strips",
    },
    // Respiratory & Allergy
    {
      n: "Cetirizine 10mg",
      g: "Cetirizine",
      b: "Zyrtec",
      cat: "resp",
      mfr: "gsk",
      gst: 12,
      storage: "Store below 25°C",
      reorder: 50,
      mrp: 15,
      pts: 8,
      sell: 14,
      unit: "strips",
    },
    {
      n: "Cough Syrup 100ml",
      g: "Dextromethorphan + Guaifenesin",
      b: "Benadryl",
      cat: "resp",
      mfr: "gsk",
      gst: 18,
      storage: "Store below 25°C",
      reorder: 25,
      mrp: 118,
      pts: 82,
      sell: 112,
      unit: "bottles",
    },
    // Endocrine & Diabetes
    {
      n: "Insulin Glargine 100IU/ml",
      g: "Insulin Glargine",
      b: "Lantus",
      cat: "endo",
      mfr: "abbott",
      gst: 12,
      storage: "Refrigerate 2-8°C",
      reorder: 20,
      mrp: 850,
      pts: 700,
      sell: 830,
      unit: "vials",
      fridge: true,
    },
    // Antiseptics & Wound Care
    {
      n: "Betadine Solution 5%",
      g: "Povidone Iodine",
      b: "Betadine",
      cat: "derm",
      mfr: "abbott",
      gst: 18,
      storage: "Store below 25°C",
      reorder: 30,
      mrp: 55,
      pts: 36,
      sell: 52,
      unit: "bottles",
    },
  ];

  const medicines = catalog.map((m) => ({
    id: uid(),
    name: m.n,
    genericName: m.g,
    brandName: m.b,
    categoryId: cats[m.cat].id,
    manufacturerId: mfrs[m.mfr].id,
    hsnCode: "3004",
    gstRate: m.gst,
    storageRequirements: m.storage,
    barcode: `PH-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    reorderThreshold: m.reorder,
    unitLabel: m.unit,
    isActive: true,
    createdAt: now,
  }));

  const baseQty = (unit: string): number => {
    switch (unit) {
      case "strips":
        return 600 + Math.round(Math.random() * 1000);
      case "sachets":
        return 800 + Math.round(Math.random() * 1200);
      case "boxes":
        return 120 + Math.round(Math.random() * 300);
      case "bottles":
        return 60 + Math.round(Math.random() * 160);
      case "vials":
        return 40 + Math.round(Math.random() * 80);
      case "inhalers":
        return 40 + Math.round(Math.random() * 60);
      default:
        return 200 + Math.round(Math.random() * 400);
    }
  };

  const batches: Batch[] = medicines.flatMap((m, i) => {
    const med = catalog[i];
    const supId = [sup1, sup2, sup3][i % 3].id;
    const qty = baseQty(m.unitLabel ?? "strips");
    const invoice = (n: number) => `INV-${8800 + i * 4 + n}`;

    if (i % 5 === 3) {
      // Low-stock cohort: keeps total stock at or below the reorder threshold.
      // i % 10 === 3  => short expiry  (Reorder Fresh quadrant)
      // otherwise      => long expiry   (Low Stock / Stable quadrant)
      const isReorder = i % 10 === 3;
      const residual = Math.max(
        4,
        Math.min(m.reorderThreshold, Math.round(qty * (0.02 + (i % 3) * 0.02))),
      );
      const cohortStatus = isReorder ? ("near_expiry" as const) : ("active" as const);
      return [
        {
          id: uid(),
          medicineId: m.id,
          batchNumber: `B${(4100 + i * 4).toString()}A`,
          mfgDate: isReorder ? daysFromNow(-300) : daysFromNow(-210),
          expiryDate: daysFromNow(isReorder ? 30 + (i % 3) * 20 : 280 + ((i * 7) % 260)),
          mrp: med.mrp,
          purchasePrice: med.pts,
          sellingPrice: med.sell,
          supplierId: supId,
          storageLocation: med.fridge ? RACK_LOCATIONS[8 + (i % 2)] : RACK_LOCATIONS[i % 8],
          invoiceNumber: invoice(0),
          quantityReceived: qty,
          currentStock: residual,
          status: cohortStatus,
          createdAt: now,
        },
      ];
    }

    const safe: Batch = {
      id: uid(),
      medicineId: m.id,
      batchNumber: `B${(4100 + i * 4).toString()}A`,
      mfgDate: daysFromNow(-210),
      expiryDate: daysFromNow(280 + Math.floor(Math.random() * 260)),
      mrp: med.mrp,
      purchasePrice: med.pts,
      sellingPrice: med.sell,
      supplierId: supId,
      storageLocation: med.fridge ? RACK_LOCATIONS[8 + (i % 2)] : RACK_LOCATIONS[i % 8],
      invoiceNumber: invoice(0),
      quantityReceived: qty,
      currentStock: Math.round(qty * (0.6 + Math.random() * 0.3)),
      status: "active" as const,
      createdAt: now,
    };
    const nearDays = 12 + (i % 5) * 18;
    // i % 4 === 1 (non-cohort) medicines have cleared their short-dated batch,
    // so their earliest live stock is the long-dated one (Optimal & Healthy).
    const nearSoldOut = i % 4 === 1;
    const nearStatus = nearSoldOut ? ("sold_out" as const) : ("near_expiry" as const);
    const near: Batch = {
      id: uid(),
      medicineId: m.id,
      batchNumber: `B${(4100 + i * 4 + 1).toString()}B`,
      mfgDate: daysFromNow(-330),
      expiryDate: daysFromNow(nearDays),
      mrp: med.mrp,
      purchasePrice: med.pts,
      sellingPrice: med.sell,
      supplierId: [sup1, sup2, sup3][(i + 1) % 3].id,
      storageLocation: med.fridge ? RACK_LOCATIONS[8 + ((i + 1) % 2)] : RACK_LOCATIONS[(i + 2) % 8],
      invoiceNumber: invoice(1),
      quantityReceived: Math.round(qty * 0.45),
      currentStock: nearSoldOut ? 0 : Math.round(qty * 0.45 * (0.3 + Math.random() * 0.35)),
      status: nearStatus,
      createdAt: now,
    };
    const out: Batch[] = [];
    if (i % 3 === 1) {
      out.push({
        id: uid(),
        medicineId: m.id,
        batchNumber: `B${(4100 + i * 4 + 2).toString()}C`,
        mfgDate: daysFromNow(-520),
        expiryDate: daysFromNow(-6 - (i % 9)),
        mrp: med.mrp,
        purchasePrice: med.pts,
        sellingPrice: med.sell,
        supplierId: [sup1, sup2, sup3][(i + 2) % 3].id,
        storageLocation: med.fridge ? RACK_LOCATIONS[9] : RACK_LOCATIONS[(i + 4) % 8],
        invoiceNumber: invoice(2),
        quantityReceived: 40,
        currentStock: 8 + (i % 7),
        status: "expired" as const,
        createdAt: now,
      });
    }
    return [safe, near, ...out];
  });

  const stockMovements: StockMovement[] = batches.flatMap((b, i) => {
    const moves: StockMovement[] = [
      {
        id: uid(),
        medicineId: b.medicineId,
        batchId: b.id,
        movementType: "in" as const,
        quantity: b.quantityReceived,
        reason: "Initial stock received",
        createdBy: owner.id,
        createdAt: hoursAgo((i % 24) + 1),
      },
    ];
    if (i % 4 === 0) {
      moves.push({
        id: uid(),
        medicineId: b.medicineId,
        batchId: b.id,
        movementType: "out" as const,
        quantity: -Math.round(b.currentStock * 0.08),
        reason: "Dispensed at counter",
        createdBy: cashier.id,
        createdAt: hoursAgo((i % 12) + 1),
      });
    }
    return moves;
  });

  const activityLogs = [
    {
      id: uid(),
      userId: owner.id,
      userName: owner.name,
      action: "Seeded demo data",
      entityType: "system",
      createdAt: daysAgo(1),
    },
    {
      id: uid(),
      userId: inv.id,
      userName: inv.name,
      action: "Stock Added",
      entityType: "batch",
      entityId: batches[0]?.id,
      details: { batch: batches[0]?.batchNumber },
      createdAt: hoursAgo(5),
    },
    {
      id: uid(),
      userId: pharm.id,
      userName: pharm.name,
      action: "Shipment Received",
      entityType: "grn",
      createdAt: hoursAgo(8),
    },
    {
      id: uid(),
      userId: cashier.id,
      userName: cashier.name,
      action: "POS Order Processed",
      entityType: "sale",
      createdAt: hoursAgo(12),
    },
    {
      id: uid(),
      userId: inv.id,
      userName: inv.name,
      action: "Quarantine Action",
      entityType: "batch",
      createdAt: hoursAgo(26),
    },
  ];

  const purchaseOrders = [
    {
      id: uid(),
      poNumber: "PO-1001",
      supplierId: sup3.id,
      expectedDate: daysFromNow(4),
      items: [
        {
          medicineId: medicines[0].id,
          medicineName: medicines[0].brandName ?? medicines[0].name,
          quantity: 1200,
          expectedPrice: catalog[0].pts,
        },
        {
          medicineId: medicines[4].id,
          medicineName: medicines[4].brandName ?? medicines[4].name,
          quantity: 300,
          expectedPrice: catalog[4].pts,
        },
      ],
      status: "placed" as const,
      createdBy: owner.id,
      createdAt: daysAgo(2),
    },
    {
      id: uid(),
      poNumber: "PO-1002",
      supplierId: sup1.id,
      expectedDate: daysFromNow(6),
      items: [
        {
          medicineId: medicines[13].id,
          medicineName: medicines[13].brandName ?? medicines[13].name,
          quantity: 500,
          expectedPrice: catalog[13].pts,
        },
      ],
      status: "placed" as const,
      createdBy: owner.id,
      createdAt: daysAgo(1),
    },
    {
      id: uid(),
      poNumber: "PO-0999",
      supplierId: sup2.id,
      expectedDate: daysFromNow(-3),
      items: [
        {
          medicineId: medicines[17].id,
          medicineName: medicines[17].brandName ?? medicines[17].name,
          quantity: 800,
          expectedPrice: catalog[17].pts,
        },
      ],
      status: "received" as const,
      createdBy: owner.id,
      createdAt: daysAgo(9),
    },
  ];

  const grns = [
    {
      id: uid(),
      grnNumber: "GRN-2001",
      supplierId: sup2.id,
      invoiceNumber: "INV-8821",
      invoiceDate: daysAgo(3),
      poId: purchaseOrders[2].id,
      items: [
        {
          medicineId: medicines[17].id,
          batchId: batches[17 * 2]?.id ?? "",
          medicineName: medicines[17].brandName ?? medicines[17].name,
          batchNumber: batches[17 * 2]?.batchNumber ?? "",
          mfgDate: daysFromNow(-210),
          expiryDate: daysFromNow(340),
          mrp: catalog[17].mrp,
          purchasePrice: catalog[17].pts,
          sellingPrice: catalog[17].sell,
          quantity: 800,
        },
      ],
      totalValue: 800 * catalog[17].pts,
      createdBy: inv.id,
      createdByName: inv.name,
      createdAt: daysAgo(3),
    },
  ];

  const saleTemplates: { qty: number; customer: string; phone: string }[] = [
    { qty: 4, customer: "Rahul Mehta", phone: "98200 12345" },
    { qty: 2, customer: "Sneha Iyer", phone: "98111 23456" },
    { qty: 6, customer: "Walk-in customer", phone: "" },
  ];
  const sales = saleTemplates.map((t, i) => {
    const med = medicines[i % medicines.length];
    const entry = catalog[i % catalog.length];
    const batch = batches.find((b) => b.medicineId === med.id && b.status === "active");
    const unit = t.qty;
    const unitPrice = entry.sell;
    const gstRate = med.gstRate;
    const lineTotal = Math.round(unit * unitPrice * (1 + gstRate / 100));
    return {
      id: uid(),
      invoiceNo: `INV-${(9000 + i).toString()}`,
      customerName: t.customer,
      customerPhone: t.phone,
      items: [
        {
          medicineId: med.id,
          batchId: batch?.id ?? "",
          medicineName: med.brandName ?? med.name,
          batchNumber: batch?.batchNumber ?? "",
          quantity: unit,
          unitPrice,
          discountPct: 0,
          gstRate,
          lineTotal,
        },
      ],
      subtotal: unit * unitPrice,
      discountTotal: 0,
      gstTotal: Math.round(unit * unitPrice * (gstRate / 100)),
      roundOff: 0,
      grandTotal: lineTotal,
      paymentMode: "upi" as const,
      tender: lineTotal,
      change: 0,
      status: "completed" as const,
      createdBy: cashier.id,
      createdByName: cashier.name,
      createdAt: daysAgo(i + 1),
    };
  });

  return {
    version: DB_VERSION,
    profiles: [owner, pharm, cashier, inv],
    categories: [catAnalg, catAntib, catCardio, catVit, catGI, catResp, catEndo, catDerm],
    manufacturers: [mfrCipla, mfrSun, mfrGsk, mfrMankind, mfrAbbott, mfrZydus],
    suppliers: [sup1, sup2, sup3],
    medicines,
    batches,
    stockMovements,
    activityLogs,
    sales,
    purchaseOrders,
    grns,
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
      if ((loaded.version ?? 0) < DB_VERSION) {
        cache = seed();
        save(cache);
        return cache;
      }
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
