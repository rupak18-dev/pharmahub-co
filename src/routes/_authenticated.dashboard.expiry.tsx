import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/expiry")({
  head: () => ({ meta: [{ title: "Expiry · PharmacyOS" }] }),
  component: () => (
    <div className="space-y-6">
      <PageHeader title="Expiry Management" description="Near-expiry, expired, disposal and loss calculation." />
      <EmptyState icon={Sparkles} title="Coming in Phase 3" description="Configurable thresholds, expiry calendar, disposal records, and loss reporting." />
    </div>
  ),
});
