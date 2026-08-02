import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { ComingSoon } from "@/components/pharmacy/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/notifications")({
  head: () => ({ meta: [{ title: "Notifications · PharmacyOS" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return <ComingSoon title="Notifications" icon={Bell} />;
}
