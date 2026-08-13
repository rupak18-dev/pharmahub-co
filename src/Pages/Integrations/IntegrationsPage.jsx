import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ExternalLink,
  Plug,
  Plus,
  Settings2,
  Unplug,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
  getIntegrations,
  getWhatsAppDestination,
  isConnected,
  disconnectIntegration,
} from "@/lib/integrationsService";
import { findIntegration } from "@/Pages/Admin/components/integrationsCatalog";
import { AddIntegrationDialog } from "@/Pages/Admin/components/AddIntegrationDialog";
import { ConnectIntegrationDialog } from "@/Pages/Admin/components/ConnectIntegrationDialog";

function EmptyState({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center transition-colors hover:border-[#007a5a]/40 hover:bg-[#007a5a]/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60 sm:py-20"
    >
      <span className="grid h-16 w-16 place-items-center rounded-full border border-border bg-background text-[#007a5a] shadow-sm transition-colors group-hover:border-[#007a5a]/30 group-hover:bg-[#007a5a]/5">
        <Plus className="h-7 w-7" aria-hidden="true" />
      </span>
      <span className="text-base font-semibold text-foreground">Add Integration</span>
      <span className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Connect third-party services like WhatsApp, Google, Stripe, and more to extend
        PharmaHub.
      </span>
    </button>
  );
}

function CapabilityList({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2">
      {items.map((cap) => (
        <li key={cap} className="flex items-center gap-2 text-xs text-foreground">
          <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#007a5a]/10 text-[#007a5a]">
            <Check className="h-3 w-3" aria-hidden="true" />
          </span>
          {cap}
        </li>
      ))}
    </ul>
  );
}

function ConnectedIntegrationCard({ integration, canEdit, onConfigure, onDisconnect }) {
  const catalog = findIntegration(integration.key);
  const Icon = catalog?.icon ?? Plug;
  const color = catalog?.color ?? "#007a5a";
  const capabilities = catalog?.capabilities ?? [];
  const primary = catalog?.primaryAction?.label ?? "Open";
  const PrimaryIcon = catalog?.primaryAction?.icon ?? ExternalLink;

  // WhatsApp destination comes from real backend configuration only.
  const whatsappDestination = getWhatsAppDestination(integration);
  const dashboardUrl = integration.config?.dashboardUrl ?? integration.config?.url ?? null;

  const handlePrimary = () => {
    if (integration.key === "whatsapp") {
      if (whatsappDestination) {
        window.open(whatsappDestination, "_blank", "noopener,noreferrer");
      } else {
        toast.info("No WhatsApp destination configured by the backend yet.");
      }
      return;
    }
    if (dashboardUrl) {
      window.open(dashboardUrl, "_blank", "noopener,noreferrer");
    } else {
      toast.info(`${catalog?.name ?? "This"} integration is ready — its dashboard link is set by the backend.`);
    }
  };

  const primaryDisabled = integration.key === "whatsapp" ? !whatsappDestination : !dashboardUrl;

  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-muted/40"
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {catalog?.name ?? integration.name ?? integration.key}
          </h3>
          <div className="mt-1">
            <Badge
              variant="secondary"
              className="h-5 gap-1 border-emerald-500/20 bg-emerald-500/10 px-1.5 text-[10px] font-semibold text-emerald-700"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
              Connected
            </Badge>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {catalog?.description ?? "Connected third-party service."}
      </p>

      <div className="mt-4">
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Capabilities
        </h4>
        <div className="mt-2">
          <CapabilityList items={capabilities} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 rounded-lg text-xs font-medium"
          onClick={handlePrimary}
          disabled={!canEdit || primaryDisabled}
          title={primaryDisabled ? "The destination URL is set by the backend." : undefined}
        >
          <PrimaryIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {primary}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 rounded-lg text-xs font-medium"
          onClick={() => onConfigure(integration)}
          disabled={!canEdit}
        >
          <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
          Configure
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDisconnect(integration)}
          disabled={!canEdit}
          title={`Disconnect ${catalog?.name ?? integration.key}`}
          aria-label={`Disconnect ${catalog?.name ?? integration.key}`}
        >
          <Unplug className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}

export default function IntegrationsPage() {
  const has = usePermission();
  const canEdit = has("admin", "update");
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [connectItem, setConnectItem] = useState(null);
  const [configureItem, setConfigureItem] = useState(null);

  const refresh = useCallback(async () => {
    const data = await getIntegrations();
    setIntegrations(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connected = useMemo(() => integrations.filter(isConnected), [integrations]);
  const connectedKeys = useMemo(() => new Set(connected.map((i) => i.key)), [connected]);

  if (!has("admin", "view")) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        You don't have access to Integrations.
      </div>
    );
  }

  const handleConnectRequest = (item) => {
    setAddOpen(false);
    setConnectItem(item);
  };

  const handleConfigure = (integration) => {
    setConfigureItem(integration);
  };

  const handleDisconnect = async (integration) => {
    try {
      await disconnectIntegration(integration.id ?? integration.key);
      toast.success(`${findIntegration(integration.key)?.name ?? "Integration"} disconnected`);
      await refresh();
    } catch {
      toast.error("Unable to disconnect. The integrations backend is not available yet.");
    }
  };

  return (
    <div className="w-full pb-16 pt-2">
      <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 sm:px-6">
        {/* Page Header */}
        <div className="border-b border-border/60 pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Integrations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect third-party services to extend PharmaHub. Changes apply immediately.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : connected.length === 0 ? (
          <EmptyState onClick={() => setAddOpen(true)} disabled={!canEdit} />
        ) : (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Connected Integrations
              </h2>
              <Badge variant="secondary">{connected.length}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {connected.map((integration) => (
                <ConnectedIntegrationCard
                  key={integration.id ?? integration.key}
                  integration={integration}
                  canEdit={canEdit}
                  onConfigure={handleConfigure}
                  onDisconnect={handleDisconnect}
                />
              ))}
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                disabled={!canEdit}
                className="flex min-h-[280px] flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border bg-card text-muted-foreground transition-colors hover:border-[#007a5a]/40 hover:bg-[#007a5a]/[0.03] hover:text-[#007a5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full border border-border bg-background text-[#007a5a] shadow-sm">
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium">Add Integration</span>
              </button>
            </div>
          </section>
        )}
      </div>

      <AddIntegrationDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        connectedKeys={connectedKeys}
        onConnect={handleConnectRequest}
        disabled={!canEdit}
      />

      <ConnectIntegrationDialog
        key={`connect-${connectItem?.key ?? "none"}`}
        open={Boolean(connectItem)}
        onOpenChange={(open) => !open && setConnectItem(null)}
        item={connectItem}
        mode="connect"
        disabled={!canEdit}
        onDone={refresh}
      />

      <ConnectIntegrationDialog
        key={`configure-${configureItem?.key ?? "none"}`}
        open={Boolean(configureItem)}
        onOpenChange={(open) => !open && setConfigureItem(null)}
        item={configureItem ? findIntegration(configureItem.key) : null}
        existingConfig={configureItem?.config ?? {}}
        mode="configure"
        disabled={!canEdit}
        onDone={refresh}
      />
    </div>
  );
}
