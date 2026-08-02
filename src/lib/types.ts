export type RoleName =
  "Owner" | "Admin" | "Pharmacist" | "Cashier" | "Store Keeper" | "Inventory Manager";

export type PermissionAction = "view" | "create" | "update" | "delete" | "approve" | "export";

export type ModuleKey =
  | "dashboard"
  | "medicines"
  | "batches"
  | "inventory"
  | "purchases"
  | "sales"
  | "expiry"
  | "audit"
  | "users"
  | "reports"
  | "notifications"
  | "ai"
  | "admin";

export type PermissionMatrix = Record<
  RoleName,
  Record<ModuleKey, Record<PermissionAction, boolean>>
>;

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  active: boolean;
  orgName?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string | null;
}

export interface Manufacturer {
  id: string;
  name: string;
  contactInfo?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactInfo?: string;
  gstNumber?: string;
  paymentTerms?: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  brandName?: string;
  /** Concentration/strength, e.g. "500mg", "1g SR", "60K IU". */
  strength?: string;
  /** Dosage form, e.g. "Tablet", "Capsule", "Suspension". */
  dosageForm?: string;
  categoryId?: string;
  manufacturerId?: string;
  hsnCode?: string;
  gstRate: number;
  storageRequirements?: string;
  barcode?: string;
  imageUrl?: string;
  reorderThreshold: number;
  isActive: boolean;
  createdAt: string;
}

export type BatchStatus = "active" | "near_expiry" | "expired" | "disposed" | "sold_out";

export interface Batch {
  id: string;
  medicineId: string; // Acts as product_id
  supplierId?: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  mrp: number;
  purchasePrice: number;
  sellingPrice: number;
  createdAt: string;
  /** Total on-hand units across all stock locations (kept in sync with inventoryStock). */
  currentStock: number;
  /** Initial units received with this batch. */
  quantityReceived?: number;
  status?: BatchStatus;
  /** Branch this stock currently sits in. */
  branch?: string;
  /** Physical shelf/rack label. */
  shelfLocation?: string;
  /** Quick-sale discount % flagged from Expiry Management; auto-applied at POS. */
  discountPct?: number;
  /** FEFO billing priority — forces this batch to the front of the POS picker. */
  fefo?: boolean;
  /** Suggest this alternate automatically at the counter when the primary is expired. */
  suggestAtPos?: boolean;
}

export type MovementType = "in" | "out" | "adjustment";

export interface StockMovement {
  id: string;
  medicineId: string;
  batchId: string;
  movementType: MovementType;
  quantity: number; // signed: positive for in, negative for out
  reason: string;
  referenceId?: string;
  createdBy: string;
  createdAt: string;
}

export type LocationType = "Front Shelf" | "Backroom" | "Cold Storage" | "Quarantine";

export interface InventoryStock {
  id: string;
  batchId: string;
  locationType: LocationType;
  rackCode: string;
  quantityOnHand: number;
  reservedQuantity: number;
  createdAt: string;
}

export type InventoryLedgerMovementType = "Purchase Inward" | "Sales Outward" | "Customer Return" | "Vendor Return" | "Damaged/Broken" | "Adjustment";

export interface InventoryLedger {
  id: string;
  batchId: string;
  movementType: InventoryLedgerMovementType;
  quantityChange: number;
  referenceDocId?: string;
  userId: string;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
  /** Value before a state change (enriched audit trail). */
  oldValue?: string | number | null;
  /** Value after a state change (enriched audit trail). */
  newValue?: string | number | null;
  /** Human-readable reason attached to the change. */
  reason?: string;
  /** Device/terminal that produced the entry. */
  device?: string;
  /** Branch the activity occurred in. */
  branch?: string;
  /** Stock audit this entry belongs to, when relevant. */
  auditId?: string;
}

export type AuditType =
  | "full" // Full Store Audit
  | "category" // Category Audit
  | "shelf" // Shelf Audit
  | "batch" // Batch Audit
  | "cycle" // Cycle Count
  | "random"; // Random Audit

export type AuditStatus =
  | "scheduled"
  | "in_progress"
  | "paused"
  | "pending_review"
  | "approved"
  | "completed"
  | "cancelled";

export type AuditTimelineAction =
  | "created"
  | "started"
  | "paused"
  | "resumed"
  | "submitted"
  | "recount_requested"
  | "recount_confirmed"
  | "approved"
  | "completed"
  | "cancelled"
  | "adjustment_applied";

export interface AuditTimelineEvent {
  id: string;
  action: AuditTimelineAction;
  at: string;
  byUserId: string;
  byName: string;
  note?: string;
}

export interface Audit {
  id: string;
  auditNumber: string;
  type: AuditType;
  title: string;
  branch: string;
  categoryId?: string;
  shelf?: string;
  /** Pre-resolved count scope (the exact batches this audit must verify). */
  batchIds: string[];
  assignedUserIds: string[];
  scheduledDate: string;
  startedAt?: string;
  pausedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  status: AuditStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  notes?: string;
  timeline: AuditTimelineEvent[];
}

export interface AuditCount {
  id: string;
  auditId: string;
  batchId: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  shelf: string;
  expectedQty: number;
  physicalQty?: number;
  countedBy: string;
  countedByName: string;
  countedAt: string;
  device?: string;
  skipped?: boolean;
  flagged?: boolean;
  note?: string;
  /** Compressed thumbnail data-URL captured by staff (damage evidence). */
  photo?: string;
  /** Short audio data-URL captured by staff (voice note). */
  voiceNote?: string;
}

export type VarianceReason =
  | "billing_error"
  | "damaged"
  | "theft"
  | "wrong_shelf"
  | "supplier_short_supply"
  | "manual_entry_error"
  | "unknown";

export type Severity = "low" | "medium" | "high" | "critical";

export type RecommendedAction = "approve" | "reject" | "recount" | "transfer" | "write_off";

export type VarianceStatus =
  "pending" | "recount_requested" | "recount_confirmed" | "approved" | "rejected";

export interface VarianceItem {
  id: string;
  auditId: string;
  batchId: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  expectedQty: number;
  actualQty: number;
  /** actual - expected (negative = missing). */
  difference: number;
  unitCost: number;
  /** |difference| × unitCost — drives severity (financial impact). */
  varianceValue: number;
  severity: Severity;
  reason?: VarianceReason;
  recommendedAction?: RecommendedAction;
  managerComment?: string;
  verifiedBy: string;
  verifiedByName: string;
  status: VarianceStatus;
  createdAt: string;
}

export type AdjustmentAction = "adjust" | "transfer" | "write_off";

export type AdjustmentStatus =
  "pending_supervisor" | "pending_manager" | "approved" | "applied" | "rejected";

export interface AdjustmentHistoryEntry {
  id: string;
  action: string;
  userId: string;
  userName: string;
  comment?: string;
  at: string;
}

export interface StockAdjustment {
  id: string;
  auditId: string;
  batchId: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  action: AdjustmentAction;
  /** Signed delta for "adjust"; absolute units for "transfer"/"write_off". */
  quantity: number;
  unitCost: number;
  varianceId: string;
  reason: VarianceReason;
  severity: Severity;
  targetBranch?: string;
  submittedBy: string;
  submittedByName: string;
  createdAt: string;
  status: AdjustmentStatus;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  appliedAt?: string;
  appliedBy?: string;
  appliedByName?: string;
  comments?: string;
  history: AdjustmentHistoryEntry[];
}

export interface Settings {
  currency: string;
  gstDefault: number;
  nearExpiryDays: number;
  deadStockDays: number;
  lowStockDefault: number;
  /** When on, POS auto-suggests same-salt alternatives for expired stock. */
  autoSwap?: boolean;
}

export type PaymentMode = "cash" | "card" | "upi";

export interface SaleItem {
  medicineId: string;
  batchId: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number; // pre-tax
  discountPct: number;
  gstRate: number;
  lineTotal: number; // post-discount, post-tax
}

export type SaleStatus = "completed" | "voided";

export interface Sale {
  id: string;
  invoiceNo: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  gstTotal: number;
  roundOff: number;
  grandTotal: number;
  paymentMode: PaymentMode;
  tender: number;
  change: number;
  status: SaleStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  voidedAt?: string;
  voidedBy?: string;
}

export type POStatus = "draft" | "placed" | "received" | "cancelled";

export interface POItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  expectedPrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  expectedDate?: string;
  items: POItem[];
  status: POStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface GRNItem {
  medicineId: string;
  batchId: string; // created batch id
  medicineName: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  mrp: number;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
}

export interface GRN {
  id: string;
  grnNumber: string;
  supplierId: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  poId?: string;
  items: GRNItem[];
  totalValue: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface WriteOffEntry {
  id: string;
  batchId: string;
  batchNumber: string;
  medicineId: string;
  medicineName: string;
  units: number;
  unitCost: number;
  costValue: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  reason: string;
  doneByUserId: string;
  doneByName: string;
  createdAt: string;
}

export type CreditNoteStatus = "expected" | "received" | "reconciled";

export interface CreditNoteEntry {
  id: string;
  batchId: string;
  batchNumber: string;
  medicineId: string;
  medicineName: string;
  supplierId: string;
  supplierName: string;
  units: number;
  value: number;
  expectedBy: string;
  status: CreditNoteStatus;
  creditNoteNo?: string;
  receivedOn?: string;
  reconciledOn?: string;
  createdAt: string;
}

export interface TransferEntry {
  id: string;
  batchId: string;
  batchNumber: string;
  medicineId: string;
  medicineName: string;
  fromBranch: string;
  toBranch: string;
  units: number;
  unitCost: number;
  doneByUserId: string;
  doneByName: string;
  createdAt: string;
}

export interface ReportSchedule {
  id: string;
  frequency: "daily" | "weekly" | "monthly";
  email: string;
  whatsapp: boolean;
  reports: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface DB {
  version: number;
  profiles: Profile[];
  categories: Category[];
  manufacturers: Manufacturer[];
  suppliers: Supplier[];
  medicines: Medicine[];
  batches: Batch[];
  inventoryStock: InventoryStock[];
  inventoryLedger: InventoryLedger[];
  stockMovements: StockMovement[];
  activityLogs: ActivityLog[];
  sales: Sale[];
  purchaseOrders: PurchaseOrder[];
  grns: GRN[];
  writeOffs: WriteOffEntry[];
  creditNotes: CreditNoteEntry[];
  transfers: TransferEntry[];
  reportSchedules: ReportSchedule[];
  audits: Audit[];
  auditCounts: AuditCount[];
  variances: VarianceItem[];
  adjustments: StockAdjustment[];
  notificationsRead: string[];
  settings: Settings;
  permissions: PermissionMatrix;
}
