import { createFileRoute } from "@tanstack/react-router";
import { Pill } from "lucide-react";
import { ComingSoon } from "@/components/pharmacy/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/medicines/categories")({
  head: () => ({ meta: [{ title: "Categories · PharmacyOS" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  return <ComingSoon title="Medicine Categories" icon={Pill} />;
}
