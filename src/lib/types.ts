export type RoleName =
  | "Owner"
  | "Admin"
  | "Pharmacist"
  | "Cashier"
  | "Store Keeper"
  | "Inventory Manager";

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

export type PermissionMatrix = Record<RoleName, Record<ModuleKey, Record<PermissionAction, boolean>>>;

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
  medicineId: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  mrp: number;
  purchasePrice: number;
  sellingPrice: number;
  supplierId?: string;
  quantityReceived: number;
  currentStock: number;
  status: BatchStatus;
  createdAt: string;
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

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface Settings {
  currency: string;
  gstDefault: number;
  nearExpiryDays: number;
  deadStockDays: number;
  lowStockDefault: number;
}

export interface DB {
  version: number;
  profiles: Profile[];
  categories: Category[];
  manufacturers: Manufacturer[];
  suppliers: Supplier[];
  medicines: Medicine[];
  batches: Batch[];
  stockMovements: StockMovement[];
  activityLogs: ActivityLog[];
  settings: Settings;
  permissions: PermissionMatrix;
}
