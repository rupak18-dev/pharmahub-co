import { createFileRoute } from "@tanstack/react-router";
import IntegrationsPage from "@/Pages/Integrations/IntegrationsPage";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({
    meta: [{ title: "Integrations · PharmaHub" }],
  }),
  component: IntegrationsPage,
});
