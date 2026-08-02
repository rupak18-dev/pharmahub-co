import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { ComingSoon } from "@/components/pharmacy/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/expiry")({
  head: () => ({ meta: [{ title: "Expiry · PharmacyOS" }] }),
  component: ExpiryPage,
});

function ExpiryPage() {
  return <ComingSoon title="Expiry" icon={CalendarClock} />;
}
