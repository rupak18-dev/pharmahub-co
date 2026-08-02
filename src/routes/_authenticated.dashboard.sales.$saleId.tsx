import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { ComingSoon } from "@/components/pharmacy/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/sales/$saleId")({
  head: () => ({ meta: [{ title: "Sale · PharmacyOS" }] }),
  component: SaleDetailPage,
});

function SaleDetailPage() {
  return <ComingSoon title="Sale Details" icon={Receipt} />;
}
