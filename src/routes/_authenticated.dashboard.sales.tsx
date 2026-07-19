import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/sales")({
  head: () => ({ meta: [{ title: "Sales & POS · PharmacyOS" }] }),
  component: () => (
    <div className="space-y-6">
      <PageHeader title="Sales & POS" description="Fast counter billing with FEFO batch selection." />
      <EmptyState
        icon={Sparkles}
        title="Coming in Phase 2"
        description="Barcode-driven POS, FEFO/FIFO batch pick, GST breakdown, multi-tender, printable invoices."
      />
    </div>
  ),
});
