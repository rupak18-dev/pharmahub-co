export const BUSINESS_CONFIG = {
  retail: {
    placeholders: {
      businessName: "e.g. ABC Medical Store",
      branchName: "e.g. Main Street Branch",
    },
    jobTitles: [
      { label: "Owner", icon: "User" },
      { label: "Pharmacist", icon: "Pill" },
      { label: "Store Manager", icon: "Store" },
      { label: "Cashier", icon: "Receipt" },
      { label: "Inventory Manager", icon: "Package" },
    ],
    quickActions: [
      {
        id: "import_inventory",
        title: "Import Inventory",
        description: "Upload medicines from Excel or existing software.",
      },
      {
        id: "setup_billing",
        title: "Setup Billing",
        description: "Configure POS and start billing customers.",
      },
      {
        id: "add_suppliers",
        title: "Add Suppliers",
        description: "Manage vendors and purchase orders.",
      },
      {
        id: "invite_team",
        title: "Invite Team",
        description: "Add pharmacists, cashiers and staff.",
      },
      {
        id: "explore_dashboard",
        title: "Explore Dashboard",
        description: "Take a quick tour of PharmaHub.",
      },
    ],
    features: [
      "Batch Tracking",
      "Expiry Alerts",
      "Barcode Scanning",
      "GST",
      "Notifications",
      "Purchase Management",
      "Stock Audit",
    ],
  },
  dealer: {
    placeholders: {
      businessName: "e.g. ABC Pharma Distribution",
      branchName: "e.g. Central Warehouse",
    },
    jobTitles: [
      { label: "Owner", icon: "User" },
      { label: "Warehouse Manager", icon: "Warehouse" },
      { label: "Purchase Manager", icon: "ShoppingCart" },
      { label: "Sales Executive", icon: "TrendingUp" },
      { label: "Operations Manager", icon: "Settings" },
    ],
    quickActions: [
      {
        id: "import_inventory",
        title: "Import Bulk Inventory",
        description: "Upload wholesale lots and batches.",
      },
      {
        id: "add_suppliers",
        title: "Add Manufacturers",
        description: "Configure your primary manufacturing partners.",
      },
      {
        id: "setup_b2b_billing",
        title: "Setup B2B Billing",
        description: "Configure invoicing and tax defaults.",
      },
      {
        id: "invite_team",
        title: "Invite Team",
        description: "Add warehouse staff and executives.",
      },
      {
        id: "explore_dashboard",
        title: "Explore Dashboard",
        description: "Take a quick tour of PharmaHub.",
      },
    ],
    features: [
      "Batch Tracking",
      "Expiry Alerts",
      "Barcode Scanning",
      "GST",
      "Bulk Operations",
      "Purchase Management",
      "Logistics",
    ],
  },
  enterprise: {
    placeholders: {
      businessName: "e.g. HealthCare Group",
      branchName: "e.g. Regional HQ",
    },
    jobTitles: [
      { label: "Administrator", icon: "Shield" },
      { label: "Operations Head", icon: "Settings" },
      { label: "Branch Manager", icon: "Store" },
      { label: "Procurement Manager", icon: "ShoppingCart" },
      { label: "IT Administrator", icon: "Monitor" },
    ],
    quickActions: [
      {
        id: "setup_branches",
        title: "Configure Branches",
        description: "Setup regions and branch hierarchies.",
      },
      {
        id: "invite_team",
        title: "Invite Managers",
        description: "Add branch managers and regional heads.",
      },
      {
        id: "explore_dashboard",
        title: "Explore Dashboard",
        description: "Take a quick tour of PharmaHub.",
      },
    ],
    features: [
      "Centralized Inventory",
      "Branch Transfers",
      "Aggregated Reporting",
      "Custom Roles",
      "Notifications",
      "Stock Audit",
    ],
  },
  hospital: {
    placeholders: {
      businessName: "e.g. Apollo Hospital",
      branchName: "e.g. Inpatient Pharmacy",
    },
    jobTitles: [
      { label: "Hospital Administrator", icon: "Building" },
      { label: "Chief Pharmacist", icon: "Pill" },
      { label: "Department Manager", icon: "Users" },
      { label: "Inventory Officer", icon: "Package" },
      { label: "Procurement Officer", icon: "ShoppingCart" },
    ],
    quickActions: [
      {
        id: "import_inventory",
        title: "Import Formulary",
        description: "Upload your approved medication list.",
      },
      {
        id: "setup_departments",
        title: "Setup Departments",
        description: "Configure wards and clinical units.",
      },
      {
        id: "invite_team",
        title: "Invite Clinical Staff",
        description: "Add pharmacists and administrators.",
      },
      {
        id: "explore_dashboard",
        title: "Explore Dashboard",
        description: "Take a quick tour of PharmaHub.",
      },
    ],
    features: [
      "Clinical Formulary",
      "Unit Dose Dispensing",
      "Expiry Alerts",
      "Department Transfers",
      "Audit Trails",
    ],
  },
  other: {
    placeholders: {
      businessName: "e.g. Acme Health",
      branchName: "e.g. Headquarters",
    },
    jobTitles: [
      { label: "Administrator", icon: "Shield" },
      { label: "Manager", icon: "Briefcase" },
      { label: "Staff", icon: "User" },
    ],
    quickActions: [
      {
        id: "import_inventory",
        title: "Import Data",
        description: "Upload existing records.",
      },
      {
        id: "invite_team",
        title: "Invite Team",
        description: "Add your staff members.",
      },
      {
        id: "explore_dashboard",
        title: "Explore Dashboard",
        description: "Take a quick tour of PharmaHub.",
      },
    ],
    features: ["Basic Inventory", "Basic Billing", "Notifications"],
  },
};
