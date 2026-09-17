import { z } from "zod";

export const BATCH_LOCATIONS = ["Front Shelf", "Backroom", "Cold Storage", "Quarantine"];

export const BATCH_STATES = ["ACTIVE", "QUARANTINED", "RECALLED", "BLOCKED", "RETIRED"];

// Batch number structure: [Prefix] + [Year] + [Batch Type] + [Sequential Identifier]
// Format: LL-YY-T-NNN
export const BATCH_TYPE_LETTERS = { Commercial: "C", Clinical: "L", Validation: "V" };
export const BATCH_TYPES = [
  { value: "C", label: "Commercial" },
  { value: "L", label: "Clinical" },
  { value: "V", label: "Validation" },
];
export const LOCATION_PREFIXES = {
  "Front Shelf": "FS",
  Backroom: "BR",
  "Cold Storage": "CS",
  Quarantine: "QT",
};
export const BATCH_NUMBER_REGEX = /^[A-Z]{2}-\d{2}-[CLV]-\d{3}$/;

// What the Add Batch form collects.
export const batchSchema = z
  .object({
    medicineId: z.string().min(1, "Select a medicine"),
    batchNumber: z
      .string()
      .trim()
      .min(1, "Batch number required")
      .max(40)
      .regex(BATCH_NUMBER_REGEX, "Format must be LL-YY-T-NNN (e.g. FS-26-C-001)"),
    mfgDate: z.string().min(1, "Required"),
    expiryDate: z.string().min(1, "Required"),
    supplierId: z.string().optional().or(z.literal("")),
    quantityReceived: z.coerce.number().int().min(1, "At least 1"),
    locationType: z.enum(BATCH_LOCATIONS),
    rackCode: z.string().trim().min(1, "Required").max(20),
    unit: z.string().optional().default("Units"),
    batchType: z.enum(["C", "L", "V"]).default("C"),
  })
  .refine((v) => new Date(v.expiryDate) > new Date(v.mfgDate), {
    message: "Expiry must be after manufacture date",
    path: ["expiryDate"],
  });

// A single lifecycle entry recorded on a batch (created, quarantined, moved…).
export const movementSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  note: z.string().default(""),
  qty: z.number().int().nonnegative().default(0),
  timestamp: z.string(),
});

// The document shape stored in MongoDB (the agreed schema).
export const batchDocSchema = z.object({
  _id: z.string().optional(),
  medicineId: z.string().min(1),
  supplierId: z.string().nullable().optional().default(null),
  batchNumber: z.string().trim().min(1).max(40),
  batchType: z.enum(["C", "L", "V"]).optional().default("C"),
  dates: z.object({
    manufacturingDate: z.string(),
    expiryDate: z.string(),
    quarantineUntil: z.string().nullable().optional().default(null),
  }),
  pricing: z.object({
    purchasePrice: z.number().nonnegative().default(0),
    mrp: z.number().nonnegative().default(0),
    sellingPrice: z.number().nonnegative().default(0),
    gstRate: z.number().nonnegative().optional().default(0),
  }),
  status: z.object({
    isRecalled: z.boolean().default(false),
    state: z.enum(BATCH_STATES).default("ACTIVE"),
    quarantineReason: z.string().nullable().optional().default(null),
  }),
  stock: z.object({
    uom: z.string().optional().default("Units"),
    quantityOnHand: z.number().int().nonnegative().default(0),
    reservedQuantity: z.number().int().nonnegative().default(0),
    quarantined: z.number().int().nonnegative().default(0),
  }),
  warehouse: z.object({
    locationType: z.enum(BATCH_LOCATIONS),
    rackCode: z.string().default(""),
  }),
  audit: z.object({
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  version: z.number().int().positive().default(1),
  movements: z.array(movementSchema).optional().default([]),
});

// Partial document updates for PATCH /api/batches/:id. Either an `action`
// (one-line status transition used by the UI buttons) or raw field updates.
export const BATCH_ACTIONS = ["quarantine", "activate", "recall", "block", "retire"];

export const batchPatchSchema = z
  .object({
    action: z.enum(BATCH_ACTIONS).optional(),
    reason: z.string().trim().max(200).optional(),
    medicineId: z.string().min(1).optional(),
    supplierId: z.string().nullable().optional(),
    batchNumber: z.string().trim().min(1).max(40).optional(),
    batchType: z.enum(["C", "L", "V"]).optional(),
    dates: z
      .object({
        manufacturingDate: z.string().optional(),
        expiryDate: z.string().optional(),
        quarantineUntil: z.string().nullable().optional(),
      })
      .optional(),
    pricing: z
      .object({
        purchasePrice: z.number().nonnegative().optional(),
        mrp: z.number().nonnegative().optional(),
        sellingPrice: z.number().nonnegative().optional(),
        gstRate: z.number().nonnegative().optional(),
      })
      .optional(),
    status: z
      .object({
        isRecalled: z.boolean().optional(),
        state: z.enum(BATCH_STATES).optional(),
        quarantineReason: z.string().nullable().optional(),
      })
      .optional(),
    stock: z
      .object({
        uom: z.string().optional(),
        quantityOnHand: z.number().int().nonnegative().optional(),
        reservedQuantity: z.number().int().nonnegative().optional(),
        quarantined: z.number().int().nonnegative().optional(),
      })
      .optional(),
    warehouse: z
      .object({
        locationType: z.enum(BATCH_LOCATIONS).optional(),
        rackCode: z.string().max(20).optional(),
      })
      .optional(),
  })
  .refine((v) => !(v.action && (v.stock || v.dates || v.pricing || v.warehouse)), {
    message: "Use either an action or field updates, not both",
    path: ["action"],
  });

export const medicineDocSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, "Name required"),
  generic: z.string().default(""),
  brand: z.string().default(""),
  manufacturerId: z.string().nullable().optional().default(null),
  manufacturerName: z.string().nullable().optional().default(null),
  categoryId: z.string().nullable().optional().default(null),
  categoryName: z.string().nullable().optional().default(null),
  hsn: z.string().default("3004"),
  gst: z.number().nonnegative().default(0),
  storage: z.string().default(""),
  reorder: z.number().nonnegative().default(0),
  packSize: z.string().default(""),
  strength: z.string().default(""),
  dosageForm: z.string().default(""),
  isActive: z.boolean().default(true),
});

// Turns a MongoDB batch document into the flat shape the UI helpers expect
// (legacy compatibility for stock.js / StatusBadge consumers).
export function batchDocToView(doc) {
  return {
    id: doc._id?.toString() ?? doc._id ?? doc.id,
    ...doc,
    mfgDate: doc.dates?.manufacturingDate,
    expiryDate: doc.dates?.expiryDate,
    purchasePrice: doc.pricing?.purchasePrice ?? 0,
    mrp: doc.pricing?.mrp ?? 0,
    sellingPrice: doc.pricing?.sellingPrice ?? 0,
    gst: doc.pricing?.gstRate ?? 0,
    currentStock: doc.stock?.quantityOnHand ?? 0,
    reservedQuantity: doc.stock?.reservedQuantity ?? 0,
    quarantined: doc.stock?.quarantined ?? 0,
    locationType: doc.warehouse?.locationType,
    rackCode: doc.warehouse?.rackCode,
    statusState: doc.status?.state,
  };
}
