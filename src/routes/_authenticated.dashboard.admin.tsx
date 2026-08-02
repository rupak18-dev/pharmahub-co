import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/pharmacy/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  head: () => ({ meta: [{ title: "System Admin · PharmacyOS" }] }),
  component: AdminPage,
});

function AdminPage() {
  return <ComingSoon title="System Admin" icon={Settings} />;
}
