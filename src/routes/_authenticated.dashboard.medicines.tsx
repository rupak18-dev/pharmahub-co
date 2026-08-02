import { createFileRoute } from "@tanstack/react-router";
import { Pill } from "lucide-react";
import { ComingSoon } from "@/components/pharmacy/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/medicines")({
  head: () => ({ meta: [{ title: "Medicines · PharmacyOS" }] }),
  component: MedicinesPage,
});

function MedicinesPage() {
  return <ComingSoon title="Medicines" icon={Pill} />;
}
