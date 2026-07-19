import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/pharmacy/PageHeader";
import { EmptyState } from "@/components/pharmacy/EmptyState";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/notifications")({
  head: () => ({ meta: [{ title: "Notifications · PharmacyOS" }] }),
  component: () => (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Low stock, near-expiry, approvals and audit alerts." />
      <EmptyState icon={Sparkles} title="Coming in Phase 4" description="Bell icon center with unread counts across all modules." />
    </div>
  ),
});
