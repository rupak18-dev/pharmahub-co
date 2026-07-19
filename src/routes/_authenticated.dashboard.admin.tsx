import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  head: () => ({ meta: [{ title: "System Admin · PharmacyOS" }] }),
  component: () => (
    <div className="space-y-6">
      <PageHeader title="System Administration" description="Audit logs, backup/restore, import/export, and system settings." />
      <EmptyState icon={Sparkles} title="Coming in Phase 4" description="Complete admin surface with settings and data tooling." />
    </div>
  ),
});
