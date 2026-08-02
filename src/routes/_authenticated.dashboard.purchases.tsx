import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { ComingSoon } from "@/components/pharmacy/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/purchases")({
  head: () => ({ meta: [{ title: "Purchases · PharmacyOS" }] }),
  component: PurchasesPage,
});

function PurchasesPage() {
  return <ComingSoon title="Purchases" icon={ShoppingCart} />;
}
