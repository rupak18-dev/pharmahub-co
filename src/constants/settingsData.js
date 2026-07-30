// Mock Config Datasets for Company Settings & System Configuration Module

export const INITIAL_COMPANY_PROFILE = {
  logo: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=80&fit=crop&q=60',
  name: 'PharmaHub Healthcare Solutions Pvt Ltd',
  businessType: 'Retail & Wholesale Pharmacy Chain',
  gstin: '27AAAAA1111A1Z1',
  drugLicense20B: 'MH-PUN-20B-112233',
  drugLicense21B: 'MH-PUN-21B-445566',
  pan: 'ABCDE1234F',
  email: 'corporate@pharmahub.com',
  phone: '+91 20 2543 8888',
  website: 'https://www.pharmahub.com',
  address: 'Corporate Suites 401-403, Pinnacle Tower, Kothrud, Pune, MH - 411038',
  timezone: 'UTC+05:30 (Kolkata)',
  currency: 'INR (₹)',
  language: 'English (IN)',
};

export const INITIAL_TAX_SETTINGS = {
  gstPercentages: [
    { label: 'GST 0% (Exempt)', rate: 0, active: true },
    { label: 'GST 5% (Life Saving)', rate: 5, active: true },
    { label: 'GST 12% (Standard Formulation)', rate: 12, active: true },
    { label: 'GST 18% (Devices & Cosmetics)', rate: 18, active: true },
    { label: 'GST 28% (Luxury items)', rate: 28, active: true },
  ],
  hsnDefaults: [
    { category: 'Formulations / Tablets', code: '3004', cgst: 6, sgst: 6 },
    { category: 'Surgical Dressings', code: '3005', cgst: 2.5, sgst: 2.5 },
  ],
  stateCode: '27 (Maharashtra)',
};

export const INITIAL_FY_SETTINGS = {
  currentFy: 'FY 2026-27 (01-Apr-2026 to 31-Mar-2027)',
  previousFy: 'FY 2025-26',
  lockStatus: 'Unlocked',
};

export const INITIAL_NUMBER_SERIES = {
  invoicePrefix: 'INV-',
  invoiceSuffix: '-2026',
  invoiceStartNumber: 1001,
  poPrefix: 'PO-',
  poStartNumber: 5001,
  grnPrefix: 'GRN-',
  grnStartNumber: 8001,
};
