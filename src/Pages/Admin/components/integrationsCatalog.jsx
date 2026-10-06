import {
  SiGmail,
  SiGoogledrive,
  SiQuickbooks,
  SiRazorpay,
  SiStripe,
  SiWhatsapp,
  SiZoho,
} from "react-icons/si";
import {
  Bike,
  Cloud,
  ExternalLink,
  FileSignature,
  HeartPulse,
  Landmark,
  LayoutDashboard,
  Send,
  UserPlus,
} from "lucide-react";

/**
 * Integration catalog for PharmaHub.
 * Uses each service's original brand icon where one exists (react-icons/si)
 * and falls back to a semantic Lucide icon otherwise.
 */
export const INTEGRATION_CATEGORIES = [
  { key: "communication", label: "Communication" },
  { key: "payments", label: "Payments" },
  { key: "accounting", label: "Accounting & Tax" },
  { key: "healthcare", label: "Healthcare" },
  { key: "delivery", label: "Delivery" },
  { key: "cloud", label: "Cloud & Storage" },
];

export const INTEGRATIONS = [
  {
    key: "whatsapp",
    name: "WhatsApp Business",
    category: "communication",
    description: "Customer communication and pharmacy notifications via WhatsApp Business.",
    capabilities: ["Order Updates", "Invoice Messages", "Delivery Notifications", "Expiry Alerts"],
    icon: SiWhatsapp,
    color: "#25D366",
    configFields: [
      {
        key: "phone",
        label: "WhatsApp Business phone number",
        placeholder: "+91 98765 43210",
        required: true,
        hint: "Used to route customer messages. Must match the number registered with WhatsApp Business.",
      },
    ],
    primaryAction: { label: "Open WhatsApp", icon: ExternalLink },
  },
  {
    key: "gmail",
    name: "Gmail",
    category: "communication",
    description: "Send invoices, reports, and notifications from your pharmacy email.",
    capabilities: ["Send Invoices", "Send Reports", "Email Notifications"],
    icon: SiGmail,
    color: "#EA4335",
    configFields: [],
    primaryAction: { label: "Send Email", icon: Send },
  },
  {
    key: "stripe",
    name: "Stripe",
    category: "payments",
    description: "Accept card payments for pharmacy transactions.",
    capabilities: ["Card Payments", "Payment Links", "Refund Processing"],
    icon: SiStripe,
    color: "#635BFF",
    configFields: [
      {
        key: "apiKey",
        label: "Stripe secret key",
        placeholder: "sk_live_xxxxxxxxxxxx",
        required: true,
      },
    ],
    primaryAction: { label: "Open Dashboard", icon: LayoutDashboard },
  },
  {
    key: "razorpay",
    name: "Razorpay",
    category: "payments",
    description: "UPI and online payments for Indian pharmacy sales.",
    capabilities: ["UPI Payments", "Payment Links", "Settlement Reports"],
    icon: SiRazorpay,
    color: "#0C2451",
    configFields: [
      {
        key: "keyId",
        label: "Razorpay Key ID",
        placeholder: "rzp_live_xxxxxxxxxxxx",
        required: true,
      },
    ],
    primaryAction: { label: "Open Dashboard", icon: LayoutDashboard },
  },
  {
    key: "zohoBooks",
    name: "Zoho Books",
    category: "accounting",
    description: "Online accounting for pharmacy financial records.",
    capabilities: ["Invoice Sync", "Expense Tracking", "Financial Reports"],
    icon: SiZoho,
    color: "#E42527",
    configFields: [
      {
        key: "orgId",
        label: "Zoho organization ID",
        placeholder: "org_6001234567",
        required: true,
      },
    ],
    primaryAction: { label: "Open Dashboard", icon: LayoutDashboard },
  },
  {
    key: "quickbooks",
    name: "QuickBooks",
    category: "accounting",
    description: "Accounting and invoicing for pharmacy bookkeeping.",
    capabilities: ["Invoice Sync", "Expense Tracking", "Tax Reports"],
    icon: SiQuickbooks,
    color: "#2CA01C",
    configFields: [
      {
        key: "realmId",
        label: "QuickBooks Company ID",
        placeholder: "123145678901234",
        required: true,
      },
    ],
    primaryAction: { label: "Open Dashboard", icon: LayoutDashboard },
  },
  {
    key: "gstFiling",
    name: "GST Filing",
    category: "accounting",
    description: "Prepare and file pharmacy GST returns from your sales and purchase data.",
    capabilities: ["GSTR-1", "GSTR-3B", "Tax Reports"],
    icon: Landmark,
    color: "#8B5CF6",
    configFields: [
      {
        key: "gstin",
        label: "GSTIN of the pharmacy",
        placeholder: "27ABCDE1234F1Z5",
        required: true,
      },
    ],
    primaryAction: { label: "Open Portal", icon: LayoutDashboard },
  },
  {
    key: "abdmHealthId",
    name: "ABDM Health ID",
    category: "healthcare",
    description: "Connect with the healthcare ecosystem to manage patient Health IDs.",
    capabilities: ["Create Health ID", "Link Patient Records", "Share Health Data"],
    icon: HeartPulse,
    color: "#0E9F6E",
    configFields: [
      {
        key: "clientId",
        label: "ABDM gateway client ID",
        placeholder: "pharma_demo@abdm",
        required: true,
      },
    ],
    primaryAction: { label: "Create Health ID", icon: UserPlus },
  },
  {
    key: "ePrescription",
    name: "E-Prescription Service",
    category: "healthcare",
    description: "Issue and manage digital prescriptions for pharmacy patients.",
    capabilities: ["Send Prescriptions", "Electronic Signing", "Prescription Records"],
    icon: FileSignature,
    color: "#0EA5E9",
    configFields: [],
    primaryAction: { label: "Send Prescription", icon: FileSignature },
  },
  {
    key: "medicineDelivery",
    name: "Delivery / Dispatch",
    category: "delivery",
    description: "Local delivery partners for doorstep medicine orders.",
    capabilities: ["Schedule Pickups", "Track Deliveries", "Delivery Updates"],
    icon: Bike,
    color: "#F97316",
    configFields: [
      {
        key: "apiKey",
        label: "Delivery partner API key",
        placeholder: "partner_api_key_xxx",
        required: true,
      },
    ],
    primaryAction: { label: "Book Delivery", icon: Bike },
  },
  {
    key: "googleDrive",
    name: "Google Drive",
    category: "cloud",
    description: "Back up invoices, reports, and pharmacy documents to cloud storage.",
    capabilities: ["Backup Documents", "Share Reports", "Store Invoices"],
    icon: SiGoogledrive,
    color: "#34A853",
    configFields: [],
    primaryAction: { label: "Open Drive", icon: Cloud },
  },
];

export const INTEGRATION_GROUPS = INTEGRATION_CATEGORIES.map((cat) => ({
  ...cat,
  items: INTEGRATIONS.filter((i) => i.category === cat.key),
})).filter((group) => group.items.length > 0);

const INDEX = new Map(INTEGRATIONS.map((i) => [i.key, i]));

export function findIntegration(key) {
  return INDEX.get(key) ?? null;
}

export function getIntegrationGroupLabel(categoryKey) {
  return INTEGRATION_CATEGORIES.find((c) => c.key === categoryKey)?.label ?? categoryKey;
}
