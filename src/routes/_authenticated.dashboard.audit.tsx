import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/audit")({
  head: () => ({ meta: [{ title: "Stock Audit · PharmacyOS" }] }),
  component: () => (
    <div className="space-y-6">
      <PageHeader title="Stock Audit" description="Physical verification, count sheets, and discrepancy resolution." />
      <EmptyState icon={Sparkles} title="Coming in Phase 3" description="Full audit lifecycle with reason codes and auto-generated adjustments." />
    </div>
  ),
});
