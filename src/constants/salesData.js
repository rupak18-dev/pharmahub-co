// Comprehensive Mock Dataset for PharmaHub POS Billing & Sales Module

export const INITIAL_INVOICES = [
  {
    id: 'INV-9021',
    date: '2026-07-30 10:45 AM',
    customerName: 'Ramesh Sharma',
    customerPhone: '+91 98201 12345',
    doctorName: 'Dr. A. K. Verma',
    prescriptionNo: 'RX-88412',
    cashier: 'Suresh Patel (Cashier)',
    paymentMode: 'UPI / QR',
    status: 'Paid',
    items: [
      { medicineId: 'MED-1002', name: 'Dolo 650mg Tablet', batch: 'DOL-9901', qty: 2, price: 30.0, discount: 5, gst: 12, amount: 57.0 },
      { medicineId: 'MED-1006', name: 'Pan 40mg Tablet', batch: 'PAN-8812', qty: 1, price: 135.0, discount: 5, gst: 12, amount: 128.25 },
    ],
    subtotal: 195.0,
    discountAmount: 9.75,
    gstAmount: 22.23,
    roundOff: 0.52,
    grandTotal: 208.0,
    paidAmount: 208.0,
    balance: 0.0,
  },
  {
    id: 'INV-9020',
    date: '2026-07-30 09:30 AM',
    customerName: 'Priya Nair',
    customerPhone: '+91 98450 67890',
    doctorName: 'Dr. S. Mehta',
    prescriptionNo: 'RX-99120',
    cashier: 'Suresh Patel (Cashier)',
    paymentMode: 'Credit Card',
    status: 'Paid',
    items: [
      { medicineId: 'MED-1001', name: 'Amoxicillin 500mg', batch: 'AMX-2026-88', qty: 3, price: 95.0, discount: 10, gst: 12, amount: 256.5 },
    ],
    subtotal: 285.0,
    discountAmount: 28.5,
    gstAmount: 30.78,
    roundOff: -0.78,
    grandTotal: 304.0,
    paidAmount: 304.0,
    balance: 0.0,
  },
  {
    id: 'INV-9019',
    date: '2026-07-29 06:15 PM',
    customerName: 'Walk-in Customer',
    customerPhone: 'N/A',
    doctorName: 'Self / OTC',
    prescriptionNo: 'N/A',
    cashier: 'Dr. Rajesh Sharma (Owner)',
    paymentMode: 'Cash',
    status: 'Paid',
    items: [
      { medicineId: 'MED-1008', name: 'Celin 500mg Chewable', batch: 'CEL-5509', qty: 2, price: 38.0, discount: 0, gst: 18, amount: 76.0 },
    ],
    subtotal: 76.0,
    discountAmount: 0.0,
    gstAmount: 13.68,
    roundOff: 0.32,
    grandTotal: 90.0,
    paidAmount: 100.0,
    balance: 10.0,
  },
  {
    id: 'INV-9018',
    date: '2026-07-29 02:20 PM',
    customerName: 'Anil Gupta',
    customerPhone: '+91 97110 54321',
    doctorName: 'Dr. R. K. Bhatia',
    prescriptionNo: 'RX-77201',
    cashier: 'Suresh Patel (Cashier)',
    paymentMode: 'Store Credit',
    status: 'Pending Credit',
    items: [
      { medicineId: 'MED-1003', name: 'Glycomet 500mg', batch: 'GLY-7734', qty: 5, price: 58.0, discount: 5, gst: 12, amount: 275.5 },
    ],
    subtotal: 290.0,
    discountAmount: 14.5,
    gstAmount: 33.06,
    roundOff: 0.44,
    grandTotal: 309.0,
    paidAmount: 0.0,
    balance: 309.0,
  },
];

export const HOLD_BILLS = [
  {
    id: 'HOLD-101',
    date: '2026-07-30 11:15 AM',
    customerName: 'Karan Malhotra',
    doctorName: 'Dr. V. Kapoor',
    itemCount: 3,
    total: 450.0,
    reason: 'Waiting for Doctor prescription confirmation',
    items: [
      { medicineId: 'MED-1001', name: 'Amoxicillin 500mg', batch: 'AMX-2026-88', qty: 2, price: 95.0 },
      { medicineId: 'MED-1006', name: 'Pan 40mg Tablet', batch: 'PAN-8812', qty: 2, price: 135.0 },
    ],
  },
  {
    id: 'HOLD-102',
    date: '2026-07-30 10:50 AM',
    customerName: 'Sunita Reddy',
    doctorName: 'Self / OTC',
    itemCount: 1,
    total: 76.0,
    reason: 'Customer went to bring wallet from car',
    items: [
      { medicineId: 'MED-1008', name: 'Celin 500mg Chewable', batch: 'CEL-5509', qty: 2, price: 38.0 },
    ],
  },
];

export const DRAFT_BILLS = [
  {
    id: 'DRAFT-501',
    date: '2026-07-30 08:30 AM',
    customerName: 'Institutional Purchase - Care Hospital',
    doctorName: 'Dr. Hospital PO',
    itemCount: 12,
    total: 12450.0,
    lastSaved: '2026-07-30 08:45 AM',
  },
];

export const SALES_RETURNS = [
  {
    id: 'RET-301',
    originalInvoiceId: 'INV-9015',
    date: '2026-07-29 04:00 PM',
    customerName: 'Vikram Joshi',
    refundAmount: 135.0,
    reason: 'Wrong Medicine Dispensed',
    refundMode: 'Cash Refund',
    status: 'Completed & Stock Restored',
  },
];

export const PAYMENT_LOGS = [
  { id: 'PAY-8801', invoiceId: 'INV-9021', mode: 'UPI / QR', ref: 'UPI/664192/GPay', amount: 208.0, status: 'Success', timestamp: '10:45 AM' },
  { id: 'PAY-8802', invoiceId: 'INV-9020', mode: 'Credit Card', ref: 'TXN-99812-HDFC', amount: 304.0, status: 'Success', timestamp: '09:30 AM' },
  { id: 'PAY-8803', invoiceId: 'INV-9019', mode: 'Cash', ref: 'CASH-POS-1', amount: 90.0, status: 'Success', timestamp: '06:15 PM' },
  { id: 'PAY-8804', invoiceId: 'INV-9018', mode: 'Store Credit', ref: 'CRED-PATIENT-81', amount: 309.0, status: 'Pending', timestamp: '02:20 PM' },
];
