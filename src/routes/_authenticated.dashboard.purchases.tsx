import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { Sparkles } from "lucide-react";

function makePhasePlaceholder(module: string, phase: number, description: string) {
  return function PhasePlaceholder() {
    return (
      <div className="space-y-6">
        <PageHeader title={module} description={description} />
        <EmptyState
          icon={Sparkles}
          title={`Coming in Phase ${phase}`}
          description={`${module} will ship in Phase ${phase}. Sidebar and permissions are already wired.`}
        />
      </div>
    );
  };
}

export const Route = createFileRoute("/_authenticated/dashboard/purchases")({
  head: () => ({ meta: [{ title: "Purchases · PharmacyOS" }] }),
  component: makePhasePlaceholder(
    "Purchases",
    2,
    "Suppliers, purchase orders, GRN, invoices and supplier returns.",
  ),
});
