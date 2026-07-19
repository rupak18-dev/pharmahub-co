import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/reports")({
  head: () => ({ meta: [{ title: "Reports · PharmacyOS" }] }),
  component: () => (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Sales, purchase, stock, batch, expiry, profit, GST and supplier reports." />
      <EmptyState icon={Sparkles} title="Coming in Phase 3" description="Every report gets date-range filters, charts, and CSV/PDF export." />
    </div>
  ),
});
