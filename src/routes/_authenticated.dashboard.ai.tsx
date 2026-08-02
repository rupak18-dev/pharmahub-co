import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { ComingSoon } from "@/components/pharmacy/ComingSoon";

export const Route = createFileRoute("/_authenticated/dashboard/ai")({
  head: () => ({ meta: [{ title: "AI Insights · PharmacyOS" }] }),
  component: AiPage,
});

function AiPage() {
  return <ComingSoon title="AI Insights" icon={Sparkles} />;
}
