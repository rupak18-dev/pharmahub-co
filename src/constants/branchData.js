// Comprehensive Mock Dataset for PharmaHub Multi-Branch & Warehouse Management Module

export const INITIAL_BRANCHES = [
  {
    id: 'BR-101',
    name: 'Kothrud Central Pharmacy',
    code: 'PH-KOT-01',
    manager: 'Anil Kumar (Branch Manager)',
    phone: '+91 98201 12345',
    address: 'Shop 12-14, Pinnacle Pride, Kothrud, Pune, MH - 411038',
    status: 'Active',
    todaysSales: 45200.0,
    currentStockValue: 850000.0,
  },
  {
    id: 'BR-102',
    name: 'Viman Nagar Outlet',
    code: 'PH-VIM-02',
    manager: 'Sunita Reddy',
    phone: '+91 98450 67890',
    address: 'C-3, Phoenix Road, Viman Nagar, Pune, MH - 411014',
    status: 'Active',
    todaysSales: 28400.0,
    currentStockValue: 560000.0,
  },
  {
    id: 'BR-103',
    name: 'Aundh Specialty Drug Store',
    code: 'PH-AUN-03',
    manager: 'Karan Malhotra',
    phone: '+91 97110 54321',
    address: 'House 88, Green Park Society, Aundh, Pune, MH - 411007',
    status: 'Active',
    todaysSales: 31200.0,
    currentStockValue: 420000.0,
  },
];

export const INITIAL_WAREHOUSES = [
  {
    id: 'WH-201',
    name: 'Central Inventory Distribution Warehouse',
    code: 'WH-CEN-01',
    manager: 'Vikram Singh (Warehouse Mgr)',
    currentStock: 42500,
    capacity: 78, // 78% capacity
    zones: [
      { name: 'Cold Storage (2°C - 8°C)', code: 'ZONE-COLD', capacity: 65, itemsCount: 4500 },
      { name: 'General Racks', code: 'ZONE-GEN', capacity: 85, itemsCount: 35000 },
      { name: 'Quarantine & Returns', code: 'ZONE-QUAR', capacity: 30, itemsCount: 3000 },
    ],
  },
  {
    id: 'WH-202',
    name: 'Hadapsar Bulk Storage Facility',
    code: 'WH-HAD-02',
    manager: 'Rajesh Kulkarni',
    currentStock: 18500,
    capacity: 45, // 45% capacity
    zones: [
      { name: 'General Racks', code: 'ZONE-GEN', capacity: 45, itemsCount: 18500 },
    ],
  },
];

export const INITIAL_TRANSFERS = [
  {
    id: 'TR-5501',
    fromBranch: 'Central Inventory Distribution Warehouse',
    toBranch: 'Kothrud Central Pharmacy',
    medicineCount: 5,
    status: 'Delivered & Restocked',
    date: '2026-07-29',
    approvedBy: 'Vikram Singh (Warehouse Mgr)',
  },
  {
    id: 'TR-5502',
    fromBranch: 'Viman Nagar Outlet',
    toBranch: 'Aundh Specialty Drug Store',
    medicineCount: 2,
    status: 'In Transit',
    date: '2026-07-30',
    approvedBy: 'Sunita Reddy',
  },
];

export const CONSOLIDATED_STOCK = [
  {
    medicineId: 'MED-1001',
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin Trihydrate IP',
    category: 'Antibiotics',
    branches: [
      { name: 'Kothrud Central Pharmacy', stock: 150 },
      { name: 'Viman Nagar Outlet', stock: 85 },
      { name: 'Aundh Specialty Drug Store', stock: 40 },
      { name: 'Central Inventory Distribution Warehouse', stock: 1200 },
    ],
  },
  {
    medicineId: 'MED-1002',
    name: 'Dolo 650mg Tablet',
    genericName: 'Paracetamol IP 650mg',
    category: 'Analgesics',
    branches: [
      { name: 'Kothrud Central Pharmacy', stock: 450 },
      { name: 'Viman Nagar Outlet', stock: 320 },
      { name: 'Aundh Specialty Drug Store', stock: 15 },
      { name: 'Central Inventory Distribution Warehouse', stock: 3500 },
    ],
  },
  {
    medicineId: 'MED-1003',
    name: 'Glycomet 500mg',
    genericName: 'Metformin Hydrochloride IP',
    category: 'Antidiabetic',
    branches: [
      { name: 'Kothrud Central Pharmacy', stock: 200 },
      { name: 'Viman Nagar Outlet', stock: 120 },
      { name: 'Aundh Specialty Drug Store', stock: 95 },
      { name: 'Central Inventory Distribution Warehouse', stock: 1800 },
    ],
  },
];
