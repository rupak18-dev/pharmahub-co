import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  Plug,
  Plus,
  Send,
  Settings2,
  Unplug,
} from "lucide-react";
import { SiGmail } from "react-icons/si";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
  disconnectIntegration,
  getIntegrations,
  gmailConnect,
  gmailDisconnect,
  gmailSendTestEmail,
  isConnected,
} from "@/lib/integrationsService";
import { findIntegration, INTEGRATIONS } from "@/Pages/Admin/components/integrationsCatalog";
import { ConnectIntegrationDialog } from "@/Pages/Admin/components/ConnectIntegrationDialog";

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

  // WhatsApp shows the verified business number instead of a primary action.
  const isWhatsApp = integration.key === "whatsapp";
  const whatsappPhone = isWhatsApp ? (integration.config?.phone ?? null) : null;

  // WhatsApp destination comes from real backend configuration only.
  const whatsappDestination = getWhatsAppDestination(integration);
  const dashboardUrl = integration.config?.dashboardUrl ?? integration.config?.url ?? null;

  const handlePrimary = () => {
    if (dashboardUrl) {
      window.open(dashboardUrl, "_blank", "noopener,noreferrer");
    } else {
      toast.info(
        `${catalog?.name ?? "This"} integration is ready — its dashboard link is set by the backend.`,
      );
    }
  };

  const primaryDisabled = !dashboardUrl;

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
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600"
                aria-hidden="true"
              />
              Connected
            </Badge>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {catalog?.description ?? "Connected third-party service."}
      </p>

      {isWhatsApp && (
        <div className="mt-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Business number
          </h4>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <MessageCircle className="h-4 w-4 shrink-0 text-[#25D366]" aria-hidden="true" />
            <span className="truncate text-xs font-semibold text-foreground">
              {whatsappPhone ?? "—"}
            </span>
          </div>
          {integration.serverConfigured === false && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
              <span className="font-semibold">Setup incomplete: </span> Server WhatsApp credentials
              are missing. Delivery will be skipped. Contact your administrator.
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Capabilities
        </h4>
        <div className="mt-2">
          <CapabilityList items={capabilities} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {!isWhatsApp && (
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
        )}
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

/**
 * Organization-level Gmail card. Only rendered when the backend reports a real,
 * valid Gmail integration (OAuth completed) — the "Connected" state is never
 * faked. Shows the connected account email + [Send Test Email] / [Disconnect].
 * When Gmail is not connected it lives in the "Available Integrations" section
 * instead, so this card never shows a "Not connected" state.
 */
function GmailIntegrationCard({ integration, canEdit, testing, onTest, onDisconnect }) {
  const catalog = findIntegration("gmail");
  const accountEmail = integration?.accountEmail ?? null;

  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-muted/40"
          aria-hidden="true"
        >
          <SiGmail className="h-5 w-5" style={{ color: "#EA4335" }} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">Gmail</h3>
          <div className="mt-1">
            <Badge
              variant="secondary"
              className="h-5 gap-1 border-emerald-500/20 bg-emerald-500/10 px-1.5 text-[10px] font-semibold text-emerald-700"
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600"
                aria-hidden="true"
              />
              Connected
            </Badge>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {catalog?.description ??
          "Send invoices, reports and notifications from your organization's Gmail account."}
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <Mail className="h-4 w-4 shrink-0 text-[#EA4335]" aria-hidden="true" />
        <span className="truncate text-xs font-semibold text-foreground">
          {accountEmail ?? "Connected Gmail account"}
        </span>
      </div>

      <div className="mt-4">
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Capabilities
        </h4>
        <div className="mt-2">
          <CapabilityList items={["Send Invoices", "Send Reports", "Email Notifications"]} />
        </div>
      </div>

      {integration?.lastError && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700">
          {integration.lastError}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 rounded-lg text-xs font-medium"
          onClick={onTest}
          disabled={!canEdit || testing}
        >
          {testing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {testing ? "Sending…" : "Send Test Email"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive"
          onClick={onDisconnect}
          disabled={!canEdit}
        >
          <Unplug className="h-3.5 w-3.5" aria-hidden="true" />
          Disconnect
        </Button>
      </div>
    </article>
  );
}

/**
 * Compact row for the "Available Integrations" section. Every integration —
 * including WhatsApp Business and Gmail — renders identically: icon + name +
 * description + a single uniform "+ Connect" action. No connection status
 * badge is shown.
 */
function AvailableIntegrationRow({ item, canEdit, onConnect }) {
  const Icon = item.icon;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/40"
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" style={{ color: item.color }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-foreground">{item.name}</p>
        <p className="truncate text-xs text-muted-foreground">{item.description}</p>
      </div>
      <Button
        size="sm"
        variant="default"
        className="h-8 shrink-0 gap-1.5 rounded-lg text-xs font-medium"
        onClick={onConnect}
        disabled={!canEdit}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Connect
      </Button>
    </div>
  );
}

export default function IntegrationsPage() {
  const has = usePermission();
  const canEdit = has("integrations", "update");
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectItem, setConnectItem] = useState(null);
  const [configureItem, setConfigureItem] = useState(null);
  const [gmailConnecting, setGmailConnecting] = useState(false);
  const [gmailTesting, setGmailTesting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await getIntegrations();
      setIntegrations(data);
    } catch {
      toast.error("Unable to load integrations. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // OAuth popup handshake: the backend redirects the popup back to
  // /integrations?gmail=connected (or ?gmail=error&reason=...). The popup
  // reports the outcome to this window via postMessage and closes itself;
  // when the popup was blocked the whole tab loads the redirect instead.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.has("gmail")) {
      const ok = params.get("gmail") === "connected";
      if (window.opener) {
        window.opener.postMessage(
          {
            type: ok ? "pharmahub:gmail-connected" : "pharmahub:gmail-error",
            reason: params.get("reason") ?? null,
          },
          window.location.origin,
        );
        window.close();
        return;
      }
      if (ok) {
        toast.success("Gmail connected");
        refresh();
      } else {
        toast.error(params.get("reason") ?? "Unable to connect Gmail.");
      }
      window.history.replaceState({}, "", window.location.pathname);
    }

    const onMessage = (event) => {
      if (event.data?.type === "pharmahub:gmail-connected") {
        toast.success("Gmail connected");
        refresh();
      } else if (event.data?.type === "pharmahub:gmail-error") {
        toast.error(event.data.reason ?? "Unable to connect Gmail.");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [refresh]);

  // `connected` = integrations the backend confirms as connected. Gmail is only
  // included here when a real, valid Gmail integration exists for the current
  // organization — a "Not connected" Gmail is never counted. The count badge
  // therefore always reflects the true connected state.
  const connectedAll = useMemo(() => integrations.filter(isConnected), [integrations]);
  const connectedKeys = useMemo(() => new Set(connectedAll.map((i) => i.key)), [connectedAll]);
  const connected = connectedAll;
  const configured = useMemo(
    () => integrations.filter((i) => i.key !== "gmail" && !isConnected(i) && i.configured),
    [integrations],
  );
  // Available = catalog integrations with no real backend connection yet.
  const available = useMemo(
    () => INTEGRATIONS.filter((item) => !connectedKeys.has(item.key)),
    [connectedKeys],
  );

  if (!has("integrations", "view")) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        You don't have access to Integrations.
      </div>
    );
  }

  const handleAvailableConnect = (item) => {
    if (item.key === "gmail") {
      handleConnectGmail();
      return;
    }
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
    } catch (err) {
      toast.error(err?.message ?? "Unable to disconnect. Please try again.");
    }
  };

  const handleConnectGmail = async () => {
    if (!canEdit || gmailConnecting) return;
    setGmailConnecting(true);
    try {
      const authorizationUrl = await gmailConnect();
      if (!authorizationUrl) throw new Error("No authorization URL returned.");
      const popup = window.open(authorizationUrl, "pharmahub-gmail-oauth", "width=520,height=640");
      if (!popup) {
        window.location.href = authorizationUrl;
        return;
      }
      const timer = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(timer);
          setGmailConnecting(false);
          refresh();
        }
      }, 500);
    } catch (err) {
      setGmailConnecting(false);
      toast.error(err?.message ?? "Unable to start the Gmail connection.");
    }
  };

  const handleGmailTest = async () => {
    if (!canEdit || gmailTesting) return;
    setGmailTesting(true);
    try {
      await gmailSendTestEmail();
      toast.success("Test email sent successfully");
    } catch (err) {
      toast.error(err?.message ?? "Failed to send the test email.");
    } finally {
      setGmailTesting(false);
      await refresh();
    }
  };

  const handleGmailDisconnect = async () => {
    try {
      await gmailDisconnect();
      toast.success("Gmail disconnected");
      await refresh();
    } catch (err) {
      toast.error(err?.message ?? "Unable to disconnect Gmail.");
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
          <div className="space-y-8">
            {connected.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Connected Integrations
                  </h2>
                  <Badge variant="secondary">{connected.length}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {connected.map((integration) =>
                    integration.key === "gmail" ? (
                      <GmailIntegrationCard
                        key={integration.id ?? integration.key}
                        integration={integration}
                        canEdit={canEdit}
                        testing={gmailTesting}
                        onTest={handleGmailTest}
                        onDisconnect={handleGmailDisconnect}
                      />
                    ) : (
                      <ConnectedIntegrationCard
                        key={integration.id ?? integration.key}
                        integration={integration}
                        canEdit={canEdit}
                        onConfigure={handleConfigure}
                        onDisconnect={handleDisconnect}
                      />
                    ),
                  )}
                </div>
              </section>
            )}

            {configured.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Configured Integrations
                  </h2>
                  <Badge variant="secondary">{configured.length}</Badge>
                </div>
                <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                  {configured.map((integration) => {
                    const catalog = findIntegration(integration.key);
                    const Icon = catalog?.icon ?? Plug;
                    return (
                      <div
                        key={integration.id ?? integration.key}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/40"
                          aria-hidden="true"
                        >
                          <Icon
                            className="h-4 w-4"
                            style={{ color: catalog?.color ?? "#007a5a" }}
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[13px] font-semibold text-foreground">
                              {catalog?.name ?? integration.name ?? integration.key}
                            </p>
                            <Badge
                              variant="secondary"
                              className="h-5 shrink-0 gap-1 border-amber-500/20 bg-amber-500/10 px-1.5 text-[10px] font-semibold text-amber-700"
                            >
                              Configured
                            </Badge>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {catalog?.description ?? integration.description}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 rounded-lg text-xs font-medium"
                          onClick={() => handleConfigure(integration)}
                          disabled={!canEdit}
                        >
                          <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Configure
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {available.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Available Integrations
                  </h2>
                  <Badge variant="secondary">{available.length}</Badge>
                </div>
                <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                  {available.map((item) => (
                    <AvailableIntegrationRow
                      key={item.key}
                      item={item}
                      canEdit={canEdit}
                      onConnect={() => handleAvailableConnect(item)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

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
