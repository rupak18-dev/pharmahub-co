import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ComingSoon } from "@/components/pharmacy/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/users")({
  head: () => ({ meta: [{ title: "Users & Roles · PharmacyOS" }] }),
  component: UsersPage,
});

function UsersPage() {
  return <ComingSoon title="Users & Roles" icon={Users} />;
}
