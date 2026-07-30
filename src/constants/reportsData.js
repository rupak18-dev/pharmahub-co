// Comprehensive Mock Analytics & Reporting Dataset for PharmaHub

export const MONTHLY_SALES_PURCHASE_DATA = [
  { month: 'Jan', sales: 420000, purchases: 280000, profit: 140000 },
  { month: 'Feb', sales: 480000, purchases: 310000, profit: 170000 },
  { month: 'Mar', sales: 550000, purchases: 360000, profit: 190000 },
  { month: 'Apr', sales: 510000, purchases: 340000, profit: 170000 },
  { month: 'May', sales: 620000, purchases: 390000, profit: 230000 },
  { month: 'Jun', sales: 690000, purchases: 420000, profit: 270000 },
  { month: 'Jul', sales: 745000, purchases: 450000, profit: 295000 },
];

export const CATEGORY_BREAKDOWN_DATA = [
  { name: 'Antibiotics', value: 35, amount: 260750, color: '#3b82f6' },
  { name: 'Analgesics', value: 25, amount: 186250, color: '#10b981' },
  { name: 'Antidiabetic', value: 20, amount: 149000, color: '#f59e0b' },
  { name: 'Cardiovascular', value: 12, amount: 89400, color: '#ef4444' },
  { name: 'Vitamins & Supplements', value: 8, amount: 59600, color: '#8b5cf6' },
];

export const TOP_SELLING_MEDICINES = [
  { rank: 1, name: 'Amoxicillin 500mg Capsule', salesCount: 1420, revenue: 134900, category: 'Antibiotics' },
  { rank: 2, name: 'Dolo 650mg Tablet', salesCount: 3850, revenue: 115500, category: 'Analgesics' },
  { rank: 3, name: 'Pan 40mg Tablet', salesCount: 820, revenue: 110700, category: 'Gastroenterology' },
  { rank: 4, name: 'Glycomet 500mg Tablet', salesCount: 1650, revenue: 95700, category: 'Antidiabetic' },
  { rank: 5, name: 'Celin 500mg Chewable', salesCount: 2100, revenue: 79800, category: 'Vitamins' },
];

export const GST_TAX_SUMMARY = {
  collectedGst: 89400.0,
  paidGst: 54000.0,
  netTaxLiability: 35400.0,
  hsnSummary: [
    { hsnCode: '3004', description: 'Medicaments for therapeutic use', taxable: 620000, gstRate: '12%', gstAmount: 74400 },
    { hsnCode: '3005', description: 'Wadding, gauze, bandages', taxable: 83333, gstRate: '18%', gstAmount: 15000 },
  ],
};

export const PROFIT_LOSS_BREAKDOWN = {
  revenue: 745000.0,
  cogs: 450000.0,
  grossProfit: 295000.0,
  operatingExpenses: {
    rent: 40000.0,
    salaries: 85000.0,
    utilities: 12000.0,
    softwareSaas: 8000.0,
    misc: 5000.0,
  },
  totalExpenses: 145000.0,
  netProfit: 150000.0,
};

export const TOP_CUSTOMERS_DATA = [
  { name: 'Anil Gupta', totalSpent: 45200, orderCount: 18, tier: 'Platinum Member' },
  { name: 'Ramesh Sharma', totalSpent: 38400, orderCount: 14, tier: 'Gold Member' },
  { name: 'Priya Nair', totalSpent: 18200, orderCount: 8, tier: 'Silver Member' },
];

export const TOP_SUPPLIERS_DATA = [
  { name: 'Sun Pharma Distributors', totalPurchase: 245000, ordersCount: 12, rating: 4.9 },
  { name: 'Cipla Direct Logistics', totalPurchase: 182000, ordersCount: 8, rating: 4.8 },
  { name: 'Micro Labs Wholesale', totalPurchase: 115000, ordersCount: 5, rating: 4.7 },
];
