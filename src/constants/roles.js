export const ROLES = {
  OWNER: 'OWNER',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  PHARMACIST: 'PHARMACIST',
  CASHIER: 'CASHIER',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  PURCHASE_MANAGER: 'PURCHASE_MANAGER',
  ACCOUNTS_MANAGER: 'ACCOUNTS_MANAGER',
  DELIVERY_STAFF: 'DELIVERY_STAFF',
  SUPPLIER: 'SUPPLIER',
};

export const ROLE_DEFAULT_ROUTES = {
  [ROLES.OWNER]: '/dashboard/owner',
  [ROLES.BRANCH_MANAGER]: '/dashboard/manager',
  [ROLES.PHARMACIST]: '/dashboard/pharmacist',
  [ROLES.CASHIER]: '/dashboard/cashier',
  [ROLES.INVENTORY_MANAGER]: '/dashboard/owner',
  [ROLES.PURCHASE_MANAGER]: '/dashboard/owner',
  [ROLES.ACCOUNTS_MANAGER]: '/dashboard/owner',
  [ROLES.DELIVERY_STAFF]: '/dashboard/owner',
  [ROLES.SUPPLIER]: '/dashboard/owner',
};

// Fake users for demonstration & development
export const DEMO_USERS = [
  {
    email: 'owner@pharmahub.com',
    role: ROLES.OWNER,
    name: 'Dr. Rajesh Sharma',
    title: 'PharmaHub Owner',
  },
  {
    email: 'manager@pharmahub.com',
    role: ROLES.BRANCH_MANAGER,
    name: 'Anil Kumar',
    title: 'Branch Manager (Central)',
  },
  {
    email: 'pharmacist@pharmahub.com',
    role: ROLES.PHARMACIST,
    name: 'Priya Nair',
    title: 'Registered Pharmacist',
  },
  {
    email: 'cashier@pharmahub.com',
    role: ROLES.CASHIER,
    name: 'Suresh Patel',
    title: 'POS Cashier',
  },
  {
    email: 'inventory@pharmahub.com',
    role: ROLES.INVENTORY_MANAGER,
    name: 'Vikram Singh',
    title: 'Inventory Manager',
  },
  {
    email: 'accounts@pharmahub.com',
    role: ROLES.ACCOUNTS_MANAGER,
    name: 'Meena Iyer',
    title: 'Accounts & Billing Manager',
  },
];
