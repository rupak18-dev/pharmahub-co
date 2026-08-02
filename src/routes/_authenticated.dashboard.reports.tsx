import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/pharmacy/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/reports")({
  head: () => ({ meta: [{ title: "Reports · PharmacyOS" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  return <ComingSoon title="Reports" icon={BarChart3} />;
}
