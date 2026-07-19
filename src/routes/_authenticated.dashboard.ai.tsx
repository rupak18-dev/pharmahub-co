import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/ai")({
  head: () => ({ meta: [{ title: "AI Insights · PharmacyOS" }] }),
  component: () => (
    <div className="space-y-6">
      <PageHeader title="AI Insights" description="Demand forecasting, purchase suggestions, and expiry prediction." />
      <EmptyState icon={Sparkles} title="Coming in Phase 4" description="Heuristic models first, ML-backed insights next." />
    </div>
  ),
});
