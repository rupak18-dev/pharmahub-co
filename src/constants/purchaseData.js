// Comprehensive Mock Dataset for PharmaHub Purchase & Supplier Management Module

export const INITIAL_SUPPLIERS = [
  {
    id: 'SUP-101',
    name: 'Sun Pharma Distributors Pvt Ltd',
    gstin: '27AABCS9901R1Z5',
    licenseNo: 'DL-20B-77412 / 21B-77413',
    phone: '+91 22 4324 4324',
    email: 'orders@sunpharma-dist.com',
    address: 'Plot 14, MIDC Industrial Area, Andheri East, Mumbai, MH - 400093',
    outstandingAmount: 42500.0,
    paymentTerms: 'Net 30 Days',
    status: 'Active',
    contactPerson: 'Rakesh Verma (Sales Head)',
    rating: 4.9,
    leadTime: '2 Days',
  },
  {
    id: 'SUP-102',
    name: 'Cipla Direct Logistics Agency',
    gstin: '27AACCC1020K1ZM',
    licenseNo: 'DL-20B-88120 / 21B-88121',
    phone: '+91 22 2482 6000',
    email: 'supply@cipladirect.com',
    address: 'Cipla House, Peninsula Business Park, Lower Parel, Mumbai, MH - 400013',
    outstandingAmount: 18200.0,
    paymentTerms: 'Net 15 Days',
    status: 'Active',
    contactPerson: 'Sanjay Kulkarni (Account Manager)',
    rating: 4.8,
    leadTime: '1 Day',
  },
  {
    id: 'SUP-103',
    name: 'Micro Labs Wholesale Supply',
    gstin: '29AABCM4410J1Z9',
    licenseNo: 'DL-20B-55201 / 21B-55202',
    phone: '+91 80 2333 1111',
    email: 'orders@microlabs.in',
    address: 'Kudlu Gate, Hosur Road, Bengaluru, KA - 560068',
    outstandingAmount: 0.0,
    paymentTerms: 'Net 45 Days',
    status: 'Active',
    contactPerson: 'Meenakshi Sundaram',
    rating: 4.7,
    leadTime: '3 Days',
  },
  {
    id: 'SUP-104',
    name: 'Alkem Regional Pharma Depot',
    gstin: '27AABCA3321L1Z8',
    licenseNo: 'DL-20B-66301 / 21B-66302',
    phone: '+91 22 3982 9999',
    email: 'depot@alkemlabs.com',
    address: 'Alkem House, Senapati Bapat Marg, Lower Parel, Mumbai, MH - 400013',
    outstandingAmount: 12400.0,
    paymentTerms: 'Immediate / COD',
    status: 'Active',
    contactPerson: 'Amitabh Sen',
    rating: 4.6,
    leadTime: '2 Days',
  },
];

export const PURCHASE_ORDERS = [
  {
    poNumber: 'PO-8801',
    supplierName: 'Sun Pharma Distributors Pvt Ltd',
    invoiceNumber: 'INV-SUN-4412',
    purchaseDate: '2026-07-28',
    total: 65400.0,
    status: 'Approved',
    createdBy: 'Dr. Rajesh Sharma (Owner)',
    itemsCount: 4,
  },
  {
    poNumber: 'PO-8802',
    supplierName: 'Cipla Direct Logistics Agency',
    invoiceNumber: 'INV-CIP-9920',
    purchaseDate: '2026-07-29',
    total: 32100.0,
    status: 'Pending Approval',
    createdBy: 'Anil Kumar (Branch Manager)',
    itemsCount: 2,
  },
  {
    poNumber: 'PO-8803',
    supplierName: 'Micro Labs Wholesale Supply',
    invoiceNumber: 'INV-MIC-1102',
    purchaseDate: '2026-07-30',
    total: 18500.0,
    status: 'Completed / Received',
    createdBy: 'Dr. Rajesh Sharma (Owner)',
    itemsCount: 3,
  },
];

export const GRN_RECORDS = [
  {
    grnNumber: 'GRN-401',
    poNumber: 'PO-8803',
    supplierName: 'Micro Labs Wholesale Supply',
    receivedDate: '2026-07-30',
    totalReceivedQty: 850,
    damagedQty: 5,
    shortQty: 0,
    verifiedBy: 'Vikram Singh (Inventory Mgr)',
    status: 'Verified & Verified to Inventory',
  },
];

export const PRICE_COMPARISONS = [
  {
    medicineName: 'Amoxicillin 500mg',
    suppliers: [
      { name: 'Sun Pharma Distributors', purchasePrice: 65.0, gst: 12, discount: 5, leadTime: '2 Days', rating: 4.9 },
      { name: 'Cipla Direct Logistics', purchasePrice: 68.0, gst: 12, discount: 8, leadTime: '1 Day', rating: 4.8 },
      { name: 'Micro Labs Wholesale', purchasePrice: 64.5, gst: 12, discount: 2, leadTime: '3 Days', rating: 4.7 },
    ],
  },
  {
    medicineName: 'Dolo 650mg Tablet',
    suppliers: [
      { name: 'Micro Labs Wholesale', purchasePrice: 20.0, gst: 12, discount: 10, leadTime: '3 Days', rating: 4.7 },
      { name: 'Sun Pharma Distributors', purchasePrice: 22.0, gst: 12, discount: 5, leadTime: '2 Days', rating: 4.9 },
    ],
  },
];

export const PURCHASE_RETURNS = [
  {
    returnId: 'PRET-901',
    poNumber: 'PO-8801',
    supplierName: 'Sun Pharma Distributors Pvt Ltd',
    date: '2026-07-29',
    returnQty: 25,
    refundAmount: 1625.0,
    reason: 'Damaged Packaging on Delivery',
    status: 'Credit Note Received',
  },
];
