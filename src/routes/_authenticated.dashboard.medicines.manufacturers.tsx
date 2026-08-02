import { createFileRoute } from "@tanstack/react-router";
import { Pill } from "lucide-react";
import { ComingSoon } from "@/components/pharmacy/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/medicines/manufacturers")({
  head: () => ({ meta: [{ title: "Manufacturers · PharmacyOS" }] }),
  component: ManufacturersPage,
});

function ManufacturersPage() {
  return <ComingSoon title="Medicine Manufacturers" icon={Pill} />;
}
