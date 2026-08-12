import { DEFAULT_PERMISSIONS } from "./permissions";
const STORAGE_KEY = "PharmaHub_db_v3";
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
function seed() {
  const now = new Date().toISOString();
  const defaultShortbook = [
    {
      id: uid(),
      date: "31-01 02:23 PM",
      dateIso: "2025-01-31T14:23:00",
      itemName: "Glycomet Trio 2 Tablet",
      itemSubtitle: "1 Strip of 10 Tablet",
      distributorName: "Mahaveer Medi Sales Private Limited",
      distributorCity: "Bangalore",
      manuf: "USV P",
      priority: "high",
      min: 0,
      stock: 3,
      qty: 100,
      hasToggle: false,
      isToggled: false,
      status: "Pending",
      source: "Shortbook",
      reqByBadge: 1,
    },
    {
      id: uid(),
      date: "31-01 11:43 AM",
      dateIso: "2025-01-31T11:43:00",
      itemName: "Doloco Gel (30 Gm)",
      itemSubtitle: "1 Tube of 30 Gm",
      distributorName: "Tata Medical Store",
      distributorCity: "Prayagraj",
      manuf: "AERO-",
      priority: "low",
      min: 1,
      stock: 0,
      qty: 2,
      hasToggle: false,
      isToggled: false,
      status: "Pending",
      source: "Inventory",
      reqByBadge: null,
    },
    {
      id: uid(),
      date: "31-01 11:43 AM",
      dateIso: "2025-01-31T11:43:00",
      itemName: "Milkybar Chocolate",
      itemSubtitle: "1 Packet of 12.5 Gm",
      distributorName: "Dhruvi Pharma Pvt. Ltd.",
      distributorCity: "Ahmedabad",
      manuf: "NESTL",
      priority: "low",
      min: 1,
      stock: 0,
      qty: 2,
      hasToggle: false,
      isToggled: false,
      status: "Pending",
      source: "Inventory",
      reqByBadge: null,
    },
    {
      id: uid(),
      date: "31-01 11:43 AM",
      dateIso: "2025-01-31T11:43:00",
      itemName: "Foracort 0.5mg Respule",
      itemSubtitle: "1 Respules of 2 Ml",
      distributorName: "Mahaveer Medi Sales Private Limited",
      distributorCity: "Bangalore",
      manuf: "CIPLA",
      priority: "low",
      min: 1,
      stock: 0,
      qty: 1,
      hasToggle: true,
      isToggled: true,
      status: "Pending",
      source: "Inventory",
      reqByBadge: null,
    },
    {
      id: uid(),
      date: "31-01 11:43 AM",
      dateIso: "2025-01-31T11:43:00",
      itemName: "Rinifol Capsule",
      itemSubtitle: "1 Strip of 10 Capsules",
      distributorName: "Eastern Agencies Healthcare Private Limited",
      distributorCity: "Mumbai",
      manuf: "ELAN",
      priority: "low",
      min: 1,
      stock: 0,
      qty: 2,
      hasToggle: false,
      isToggled: false,
      status: "Pending",
      source: "Inventory",
      reqByBadge: null,
    },
    {
      id: uid(),
      date: "31-01 11:43 AM",
      dateIso: "2025-01-31T11:43:00",
      itemName: "K2-Pax Tablet",
      itemSubtitle: "1 Strip of 10 Tablet",
      distributorName: "Ovk Lifesciences",
      distributorCity: "Thane",
      manuf: "PAX H",
      priority: "low",
      min: 0,
      stock: 0,
      qty: 1,
      hasToggle: false,
      isToggled: false,
      status: "Pending",
      source: "Inventory",
      reqByBadge: null,
    },
    {
      id: uid(),
      date: "31-01 11:43 AM",
      dateIso: "2025-01-31T11:43:00",
      itemName: "Trazer M Forte Tablet",
      itemSubtitle: "1 Strip of 10 Tablet",
      distributorName: "Mahaveer Medi Sales Private Limited",
      distributorCity: "Bangalore",
      manuf: "CORON",
      priority: "low",
      min: 0,
      stock: 0,
      qty: 1,
      hasToggle: false,
      isToggled: false,
      status: "Pending",
      source: "Inventory",
      reqByBadge: null,
    },
    {
      id: uid(),
      date: "31-01 11:42 AM",
      dateIso: "2025-01-31T11:42:00",
      itemName: "Telmach 40 Tablet (10 Tablet)",
      itemSubtitle: "1 Strip of 10 Tablet",
      distributorName: "Dhruvi Healthcare Private Limited",
      distributorCity: "Ahmedabad",
      manuf: "DY-MA",
      priority: "low",
      min: 0,
      stock: 0,
      qty: 1,
      hasToggle: false,
      isToggled: false,
      status: "Pending",
      source: "Inventory",
      reqByBadge: null,
    },
    {
      id: uid(),
      date: "31-01 11:41 AM",
      dateIso: "2025-01-31T11:41:00",
      itemName: "1st Bites Rice Stage-1 (6 To 24)",
      itemSubtitle: "1 Packet of 300 Gm",
      distributorName: "Dooravani Medicals",
      distributorCity: "Bangalore",
      manuf: "PRIST",
      priority: "low",
      min: 5,
      stock: 0,
      qty: 1,
      hasToggle: false,
      isToggled: false,
      status: "Pending",
      source: "Inventory",
      reqByBadge: null,
    },
    {
      id: uid(),
      date: "31-01 11:41 AM",
      dateIso: "2025-01-31T11:41:00",
      itemName: "Noworm Tablet (1 Tablet)",
      itemSubtitle: "1 Strip of 1 Tablet",
      distributorName: "Dhruvi Healthcare Private Limited",
      distributorCity: "Ahmedabad",
      manuf: "ALKEM",
      priority: "low",
      min: 1,
      stock: 0,
      qty: 1,
      hasToggle: true,
      isToggled: true,
      status: "Pending",
      source: "Inventory",
      reqByBadge: null,
    },
  ];
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
      usageInstructions:
        "Complete full course of antibiotic as prescribed. Can be taken with or without food.",
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
      contraindications:
        "History of cholestatic jaundice/hepatic dysfunction associated with prior azithromycin use.",
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
  const batchCode = (prefix, year, month, seq) =>
    `${prefix}-${String(year).slice(-2)}${String(month).padStart(2, "0")}-${String(seq).padStart(2, "0")}`;
  const nearExpiryDaysPool = [0, 2, 5, 12, 25, 45, 80];
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
      status: "active",
      createdAt: now,
    };
    // Batch B - near expiry (spread across the warning windows)
    const b = {
      id: uid(),
      medicineId: m.id,
      batchNumber: batchCode(m.prefix, 24, ((i * 2 + 4) % 12) + 1, seq),
      mfgDate: daysFromNow(-300),
      expiryDate: daysFromNow(nearExpiryDaysPool[i % nearExpiryDaysPool.length]),
      mrp: 40 + i * 15,
      purchasePrice: 25 + i * 10,
      sellingPrice: 38 + i * 14,
      supplierId: suppliers[(i + 1) % 2],
      currentStock: 0,
      status: "near_expiry",
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
        status: "expired",
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
  ];
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
    movementType: "Purchase Inward",
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
    movementType: "in",
    quantity: b.currentStock,
    reason: "Initial stock received",
    createdBy: "system",
    createdAt: now,
  }));
  const activityLogs = [];
  const profiles = [
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
    shortbook: defaultShortbook,
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
const listeners = new Set();
let cache = null;
function isBrowser() {
  return typeof window !== "undefined";
}
function mergeProfiles(seeded, stored) {
  if (!stored || stored.length === 0) return seeded;
  const existing = new Set(stored.map((p) => p.email.toLowerCase()));
  const missing = seeded.filter((p) => !existing.has(p.email.toLowerCase()));
  return [...stored, ...missing];
}
function asArray(value) {
  return Array.isArray(value) ? value : [];
}
const MOJIBAKE_FIXES = [
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
function fixMojibake(value) {
  if (typeof value === "string") {
    let out = value;
    for (const [from, to] of MOJIBAKE_FIXES) {
      if (out.includes(from)) out = out.split(from).join(to);
    }
    return out;
  }
  if (Array.isArray(value)) return value.map(fixMojibake);
  if (value !== null && typeof value === "object") {
    const next = {};
    for (const key of Object.keys(value)) {
      next[key] = fixMojibake(value[key]);
    }
    return next;
  }
  return value;
}
function mergePermissions(stored) {
  return Object.fromEntries(
    Object.keys(DEFAULT_PERMISSIONS).map((role) => {
      const defaults = DEFAULT_PERMISSIONS[role];
      const saved = stored?.[role] ?? {};
      const merged = {};
      for (const module of Object.keys(defaults)) {
        merged[module] = { ...defaults[module], ...(saved[module] ?? {}) };
      }
      return [role, merged];
    }),
  );
}
function load() {
  if (cache) return cache;
  if (!isBrowser()) {
    cache = seed();
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const loaded = JSON.parse(raw);
      // Strip any legacy dummy profiles ending in @pharmahub.demo or placeholder names
      const cleanProfiles = (loaded.profiles ?? []).filter(
        (p) =>
          !p.email.endsWith("@pharmahub.demo") &&
          !["Alex Morgan", "Priya Shah", "Sam Chen", "Diego Ruiz"].includes(p.name),
      );
      const seeded = seed();
      cache = {
        ...seeded,
        ...loaded,
        permissions: mergePermissions(loaded.permissions),
        profiles: cleanProfiles,
        sales: loaded.sales ?? [],
        purchaseOrders: loaded.purchaseOrders ?? [],
        grns: loaded.grns ?? [],
        shortbook: loaded.shortbook && loaded.shortbook.length > 0 ? loaded.shortbook : seeded.shortbook,
        notificationsRead: loaded.notificationsRead ?? [],
      };
      return cache;
    }
  } catch {
    // ignore
  }
  cache = seed();
  save(cache);
  return cache;
}
function save(db) {
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
  get: () => load(),
  set: (updater) => {
    const current = load();
    const next = JSON.parse(JSON.stringify(current));
    const result = updater(next);
    save(result ?? next);
  },
  subscribe: (l) => {
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
