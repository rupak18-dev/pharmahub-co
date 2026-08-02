import { createFileRoute } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { ComingSoon } from "@/components/pharmacy/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/batches")({
  head: () => ({ meta: [{ title: "Batches · PharmacyOS" }] }),
  component: BatchesPage,
});

function BatchesPage() {
  return <ComingSoon title="Batches" icon={Layers} />;
}
