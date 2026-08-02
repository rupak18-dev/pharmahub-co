import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck } from "lucide-react";
import { ComingSoon } from "@/components/pharmacy/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/audit")({
  head: () => ({ meta: [{ title: "Stock Audit · PharmacyOS" }] }),
  component: AuditPage,
});

function AuditPage() {
  return <ComingSoon title="Stock Audit" icon={ClipboardCheck} />;
}
