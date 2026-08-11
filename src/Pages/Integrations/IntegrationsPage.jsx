import { usePermission } from "@/hooks/usePermission";
import { IntegrationsTab } from "@/Pages/Admin/components/IntegrationsTab";

export const handle = { title: "Integrations · PharmaHub" };

export default function IntegrationsPage() {
  const has = usePermission();

  if (!has("admin", "view")) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        You don't have access to Integrations.
      </div>
    );
  }

  return (
    <div className="w-full pb-16 pt-2">
      <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 sm:px-6">
        <IntegrationsTab />
      </div>
    </div>
  );
}
