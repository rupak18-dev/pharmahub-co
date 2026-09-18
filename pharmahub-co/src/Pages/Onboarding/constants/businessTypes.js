import { Activity, Building2, Cross, Factory, Store } from "lucide-react";

export const BUSINESS_TYPES = [
  {
    id: "retail",
    title: "Retail Pharmacy",
    description: "Perfect for independent pharmacies and medical stores.",
    icon: Store,
    recommended: true,
  },
  {
    id: "dealer",
    title: "Dealer / Distributor",
    description: "Built for wholesale medicine distributors managing suppliers and warehouses.",
    icon: Factory,
  },
  {
    id: "enterprise",
    title: "Medical Enterprise",
    description: "Designed for organizations operating multiple pharmacy branches.",
    icon: Building2,
  },
  {
    id: "hospital",
    title: "Hospital / Clinic",
    description: "Optimized for hospital and clinic pharmacy operations.",
    icon: Cross,
  },
  {
    id: "other",
    title: "Other Healthcare Business",
    description: "Flexible setup for specialized healthcare businesses.",
    icon: Activity,
  },
];
