// Mock Datasets for Enterprise User, Role & Permission Management Module

export const INITIAL_ENTERPRISE_USERS = [
  {
    id: 'EMP-001',
    name: 'Dr. Rajesh Sharma',
    email: 'owner@pharmahub.com',
    phone: '+91 98201 11111',
    role: 'OWNER',
    branch: 'Kothrud Central Pharmacy',
    department: 'Management',
    designation: 'Manager',
    status: 'Active',
    lastLogin: '10 mins ago',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=80&fit=crop&q=60',
  },
  {
    id: 'EMP-002',
    name: 'Anil Kumar',
    email: 'manager@pharmahub.com',
    phone: '+91 98201 22222',
    role: 'BRANCH_MANAGER',
    branch: 'Kothrud Central Pharmacy',
    department: 'Sales',
    designation: 'Manager',
    status: 'Active',
    lastLogin: '25 mins ago',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&fit=crop&q=60',
  },
  {
    id: 'EMP-003',
    name: 'Priya Deshmukh',
    email: 'pharmacist@pharmahub.com',
    phone: '+91 98201 33333',
    role: 'PHARMACIST',
    branch: 'Viman Nagar Outlet',
    department: 'Store',
    designation: 'Pharmacist',
    status: 'Active',
    lastLogin: '2 hours ago',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&fit=crop&q=60',
  },
  {
    id: 'EMP-004',
    name: 'Suresh Patel',
    email: 'cashier@pharmahub.com',
    phone: '+91 98201 44444',
    role: 'CASHIER',
    branch: 'Kothrud Central Pharmacy',
    department: 'Sales',
    designation: 'Cashier',
    status: 'Active',
    lastLogin: 'Today, 09:30 AM',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&fit=crop&q=60',
  },
];

export const INITIAL_ROLES = [
  { id: 'ROLE-OWNER', name: 'OWNER', description: 'Administrative Owner with full override parameters', userCount: 1 },
  { id: 'ROLE-MANAGER', name: 'BRANCH_MANAGER', description: 'Branch Operations Supervisor', userCount: 1 },
  { id: 'ROLE-PHARMACIST', name: 'PHARMACIST', description: 'Dispenses drug orders and confirms prescriptions', userCount: 1 },
  { id: 'ROLE-CASHIER', name: 'CASHIER', description: 'Tenders cash billing checkout', userCount: 1 },
];

export const INITIAL_DEPARTMENTS = [
  { id: 'DEP-1', name: 'Store', code: 'DEP-STO', userCount: 1 },
  { id: 'DEP-2', name: 'Accounts', code: 'DEP-ACC', userCount: 0 },
  { id: 'DEP-3', name: 'Purchase', code: 'DEP-PUR', userCount: 0 },
  { id: 'DEP-4', name: 'Sales', code: 'DEP-SAL', userCount: 2 },
  { id: 'DEP-5', name: 'Warehouse', code: 'DEP-WH', userCount: 0 },
  { id: 'DEP-6', name: 'Management', code: 'DEP-MGT', userCount: 1 },
];

export const INITIAL_DESIGNATIONS = [
  { id: 'DES-1', name: 'Manager', code: 'DES-MGR', userCount: 2 },
  { id: 'DES-2', name: 'Cashier', code: 'DES-CSH', userCount: 1 },
  { id: 'DES-3', name: 'Pharmacist', code: 'DES-PHR', userCount: 1 },
  { id: 'DES-4', name: 'Store Keeper', code: 'DES-SKP', userCount: 0 },
  { id: 'DES-5', name: 'Warehouse Staff', code: 'DES-WHS', userCount: 0 },
  { id: 'DES-6', name: 'Accountant', code: 'DES-ACC', userCount: 0 },
  { id: 'DES-7', name: 'Sales Executive', code: 'DES-SEC', userCount: 0 },
];

export const INITIAL_ACTIVITY_LOGS = [
  { id: 'LOG-001', user: 'Anil Kumar', action: 'Create', details: 'Added new patient customer record: Ramesh Sharma', time: '10 mins ago' },
  { id: 'LOG-002', user: 'Dr. Rajesh Sharma', action: 'Approve', details: 'Approved stock write-off request #APP-302', time: '45 mins ago' },
  { id: 'LOG-003', user: 'Suresh Patel', action: 'Login', details: 'Session started on terminal COUNTER-01', time: '1 hour ago' },
  { id: 'LOG-004', user: 'Priya Deshmukh', action: 'Update', details: 'Updated stock count for Amoxicillin 500mg', time: '2 hours ago' },
];

export const INITIAL_SESSIONS = [
  { id: 'SES-001', user: 'Dr. Rajesh Sharma', device: 'Apple MacBook Pro', browser: 'Safari 17.4', ip: '192.168.1.15', loginTime: 'Today 09:30 AM', logoutTime: 'Active Session', current: true },
  { id: 'SES-002', user: 'Anil Kumar', device: 'Dell Latitude 5420', browser: 'Chrome 122.0', ip: '192.168.1.22', loginTime: 'Today 09:15 AM', logoutTime: 'Active Session', current: true },
  { id: 'SES-003', user: 'Suresh Patel', device: 'Lenovo ThinkCentre POS', browser: 'Edge 121.0', ip: '192.168.1.50', loginTime: 'Yesterday 09:00 AM', logoutTime: 'Yesterday 06:30 PM', current: false },
];

export const MODULES_LIST = [
  'Dashboard',
  'Billing',
  'Inventory',
  'Purchase',
  'Customers',
  'Suppliers',
  'Reports',
  'Notifications',
  'AI',
  'Branches',
  'Users',
  'Settings',
];

export const PERMISSIONS_LIST = [
  'View',
  'Create',
  'Edit',
  'Delete',
  'Approve',
  'Export',
  'Print',
];
