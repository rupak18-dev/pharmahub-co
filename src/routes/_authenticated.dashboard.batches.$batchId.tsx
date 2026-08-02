import { createFileRoute } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { ComingSoon } from "@/components/pharmacy/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/batches/$batchId")({
  head: () => ({ meta: [{ title: "Batch · PharmacyOS" }] }),
  component: BatchDetailPage,
});

function BatchDetailPage() {
  return <ComingSoon title="Batch Details" icon={Layers} />;
}
