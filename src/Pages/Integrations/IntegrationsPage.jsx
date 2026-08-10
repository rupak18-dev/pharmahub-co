import { PlugZap } from "lucide-react";

export const handle = { title: "Integrations · PharmaHub" };

export default function IntegrationsPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <PlugZap className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Coming soon. Connect WhatsApp, SMS, payment gateways, and more to your pharmacy — right here
        shortly.
      </p>
    </div>
  );
}
