import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { ComingSoon } from "@/components/pharmacy/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/sales")({
  head: () => ({ meta: [{ title: "Sales & POS · PharmacyOS" }] }),
  component: SalesPage,
});

function SalesPage() {
  return <ComingSoon title="Sales & POS" icon={Receipt} />;
}
