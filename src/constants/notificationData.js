// Comprehensive Mock Dataset for Smart Notification & Action Center Module

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'NOTIF-101',
    title: 'Amoxicillin 500mg Batch #AMX-99 Expires in 12 Days',
    description: 'Quarterly stock quarantine alert. 450 units remaining in Central Rack A-4.',
    priority: 'Critical',
    category: 'Expiry',
    module: 'Inventory',
    timestamp: '10 minutes ago',
    status: 'Unread',
    actions: ['View Medicine', 'Create Discount Sale', 'Return to Supplier'],
  },
  {
    id: 'NOTIF-102',
    title: 'Purchase Order #PO-8802 Awaiting Owner Approval',
    description: 'Cipla Direct order worth ₹32,100 submitted by Manager Anil Kumar.',
    priority: 'High',
    category: 'Purchases',
    module: 'Purchases',
    timestamp: '25 minutes ago',
    status: 'Unread',
    actions: ['Approve PO', 'Reject PO', 'View Details'],
  },
  {
    id: 'NOTIF-103',
    title: 'High-Value POS Sale (INV-9021)',
    description: 'Patient Ramesh Sharma completed a ₹2,850 POS transaction via UPI.',
    priority: 'Medium',
    category: 'Billing',
    module: 'Billing',
    timestamp: '1 hour ago',
    status: 'Read',
    actions: ['View Invoice', 'Print Tax Receipt'],
  },
  {
    id: 'NOTIF-104',
    title: 'Dolo 650mg Reached Low Stock Threshold',
    description: 'Stock current: 15 units. Minimum reorder threshold is set to 50 units.',
    priority: 'High',
    category: 'Low Stock',
    module: 'Inventory',
    timestamp: '2 hours ago',
    status: 'Unread',
    actions: ['Create Purchase Requisition', 'Adjust Threshold'],
  },
  {
    id: 'NOTIF-105',
    title: 'AI Smart Insight: Restock Pan 40mg',
    description: 'Predicted demand surge of +35% for gastroenterology drugs over next 7 days.',
    priority: 'Medium',
    category: 'AI Suggestions',
    module: 'AI',
    timestamp: '3 hours ago',
    status: 'Read',
    actions: ['Auto-Draft PO', 'Dismiss Suggestion'],
  },
  {
    id: 'NOTIF-106',
    title: 'Supplier Payment Due: Sun Pharma Distributors',
    description: 'Invoice #INV-SUN-4412 payment of ₹42,500 due in 2 days (Net 30).',
    priority: 'High',
    category: 'Suppliers',
    module: 'Purchases',
    timestamp: '4 hours ago',
    status: 'Unread',
    actions: ['Record Payment', 'View Vendor Ledger'],
  },
];

export const TIMELINE_ACTIVITIES = [
  { id: 'ACT-1', title: 'Invoice INV-9021 Created', type: 'Billing', user: 'Suresh Patel (Cashier)', time: '10 mins ago', detail: 'Completed POS checkout for ₹208.00 via UPI QR.' },
  { id: 'ACT-2', title: 'Purchase PO-8801 Approved', type: 'Purchases', user: 'Dr. Rajesh Sharma (Owner)', time: '45 mins ago', detail: 'Approved inward PO for Sun Pharma worth ₹65,400.00.' },
  { id: 'ACT-3', title: 'Manual Stock Adjustment Recorded', type: 'Inventory', user: 'Vikram Singh (Inventory Mgr)', time: '2 hours ago', detail: 'Adjusted +10 units of Amoxicillin (Physical count discrepancy).' },
  { id: 'ACT-4', title: 'Sales Return RET-301 Processed', type: 'Returns', user: 'Suresh Patel (Cashier)', time: '3 hours ago', detail: 'Restored 1 unit Pan 40mg to stock and refunded ₹135.00 cash.' },
  { id: 'ACT-5', title: 'New Patient Registered', type: 'Customers', user: 'Dr. Rajesh Sharma (Owner)', time: '5 hours ago', detail: 'Created profile for Ramesh Sharma (Gold Member, O+ Blood).' },
];

export const ERP_TASKS = [
  { id: 'TSK-201', title: 'Conduct Monthly Physical Inventory Audit', assignee: 'Vikram Singh', priority: 'High', dueDate: 'Today, 5:00 PM', status: 'Pending' },
  { id: 'TSK-202', title: 'Verify Sun Pharma Credit Note #CN-881', assignee: 'Anil Kumar', priority: 'Medium', dueDate: 'Tomorrow', status: 'Pending' },
  { id: 'TSK-203', title: 'Call Chronic Patients for Refill Confirmation', assignee: 'Priya Pharmacist', priority: 'Medium', dueDate: '2026-07-31', status: 'Completed' },
  { id: 'TSK-204', title: 'Quarantine Expired Batches in Rack C-2', assignee: 'Vikram Singh', priority: 'Critical', dueDate: 'Yesterday (Overdue)', status: 'Overdue' },
];

export const PENDING_APPROVALS = [
  { id: 'APP-301', type: 'Purchase Order Approval', title: 'PO-8802 - Cipla Direct Logistics (₹32,100)', submittedBy: 'Anil Kumar', date: 'Today 09:30 AM', status: 'Pending Approval' },
  { id: 'APP-302', type: 'Stock Adjustment Write-Off', title: 'Write-off 5 Damaged Units of Dolo 650mg', submittedBy: 'Vikram Singh', date: 'Today 11:15 AM', status: 'Pending Approval' },
  { id: 'APP-303', type: 'Customer Credit Limit Extension', title: 'Extend Credit Limit to ₹15,000 for Anil Gupta', submittedBy: 'Suresh Patel', date: 'Yesterday', status: 'Pending Approval' },
];

export const REMINDERS_LIST = [
  { id: 'REM-401', type: 'Expiry Reminder', title: 'Amoxicillin Batch #AMX-99 Expires 15-Aug', date: '2026-08-02', priority: 'Critical' },
  { id: 'REM-402', type: 'Supplier Payment Due', title: 'Sun Pharma Payable ₹42,500 Due 01-Aug', date: '2026-08-01', priority: 'High' },
  { id: 'REM-403', type: 'Customer Refill Alert', title: 'Ramesh Sharma Glycomet Refill Alert', date: '2026-08-02', priority: 'Medium' },
];

export const SMART_ALERTS = [
  { id: 'ALT-501', title: 'Negative Stock Warning', desc: 'Celin 500mg has -2 units recorded at Register #2.', severity: 'Critical' },
  { id: 'ALT-502', title: 'Duplicate SKU/Medicine Record Detected', desc: 'Possible duplicate entries for "Dolo 650" and "Dolo 650mg".', severity: 'High' },
  { id: 'ALT-503', title: 'Unusual Purchase Price Inflation', desc: 'Supplier Sun Pharma cost for Paracetamol increased by +18%.', severity: 'High' },
];
