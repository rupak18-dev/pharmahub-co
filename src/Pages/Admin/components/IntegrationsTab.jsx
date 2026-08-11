import { useState } from "react";
import { Check, Plug, Plus, Settings2, Unplug } from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import { INTEGRATIONS } from "./integrationsCatalog";
import { AddIntegrationDialog } from "./AddIntegrationDialog";
import { ProfileSectionCard } from "./ProfileSectionCard";

const DEFAULT_STATE = { connected: false, configured: false, lastSync: null };

function defaultMap() {
  return Object.fromEntries(INTEGRATIONS.map((i) => [i.key, { ...DEFAULT_STATE }]));
}

function formatSync(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Capabilities({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {items.map((cap) => (
        <li
          key={cap}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
        >
          <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
          {cap}
        </li>
      ))}
    </ul>
  );
}

function IconTile({ Icon }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-foreground/80">
      <Icon size={20} />
    </span>
  );
}

function IntegrationCard({ item, lastSync, canEdit, onPrimary, onConfigure, onDisconnect }) {
  const Icon = item.icon;
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <IconTile Icon={Icon} />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-foreground">{item.name}</h4>
          <div className="mt-1">
            <Badge variant="success">
              <span
                className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-white"
                aria-hidden="true"
              />
              Connected
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {item.description}
        </p>
        <Capabilities items={item.capabilities} />
        {lastSync && (
          <p className="mt-3 text-[11px] text-muted-foreground">Last synced: {lastSync}</p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap content-start items-center gap-2 min-h-20">
        <Button
          size="sm"
          className="h-9 text-xs font-semibold"
          onClick={onPrimary}
          disabled={!canEdit}
        >
          <item.primaryAction.icon className="mr-1.5 h-3.5 w-3.5" />
          {item.primaryAction.label}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 text-xs"
          onClick={onConfigure}
          disabled={!canEdit}
        >
          <Settings2 className="mr-1.5 h-3.5 w-3.5" />
          Configure
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
          onClick={onDisconnect}
          disabled={!canEdit}
          aria-label={`Disconnect ${item.name}`}
          title="Disconnect"
        >
          <Unplug className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}

export function IntegrationsTab() {
  const { user } = useAuth();
  const has = usePermission();
  const integrations = useDb((d) => d.settings.integrations);
  const canEdit = has("admin", "update");
  const [addOpen, setAddOpen] = useState(false);
  const stateOf = (key) => ({ ...DEFAULT_STATE, ...(integrations?.[key] ?? {}) });
  const connected = INTEGRATIONS.filter((item) => stateOf(item.key).connected);

  const persist = (key, patch, action) => {
    db.set((d) => {
      d.settings.integrations = { ...defaultMap(), ...(d.settings.integrations ?? {}) };
      d.settings.integrations[key] = { ...d.settings.integrations[key], ...patch };
      d.activityLogs.unshift({
        id: db.uid(),
        userId: user?.id ?? "",
        userName: user?.name ?? "",
        action,
        entityType: "integrations",
        details: { integration: key },
        createdAt: new Date().toISOString(),
      });
    });
  };

  const connect = (item) => {
    persist(item.key, { connected: true }, "Enabled integration");
    toast.success(`${item.name} connected`);
  };

  const disconnect = (item) => {
    persist(item.key, { connected: false }, "Disabled integration");
    toast.success(`${item.name} disconnected`);
  };

  const openAction = (item) => {
    toast.info(
      `${item.primaryAction.label} will be available once the ${item.name} connection is fully set up.`,
    );
  };

  const configure = (item) => {
    toast.info(`${item.name} settings are not yet configurable in this demo.`);
  };

  return (
    <ProfileSectionCard
      id="integrations"
      icon={Plug}
      title="Integrations"
      description="Connect pharmacy services to extend PharmaHub. Changes apply immediately."
      className="w-full [--profile-section-min-h:auto]"
    >
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Connected Integrations
        </h3>
        <Badge variant="secondary">{connected.length}</Badge>
      </div>
      {connected.length === 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          No integrations connected yet. Add one with the + button.
        </p>
      )}
      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(260px,auto)]">
        {connected.map((item) => (
          <IntegrationCard
            key={item.key}
            item={item}
            lastSync={formatSync(stateOf(item.key).lastSync)}
            canEdit={canEdit}
            onPrimary={() => openAction(item)}
            onConfigure={() => configure(item)}
            onDisconnect={() => disconnect(item)}
          />
        ))}
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-[#007A87]/40 hover:bg-[#007A87]/5 hover:text-[#007A87]"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-[#007A87] shadow-sm">
            <Plus className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium">Add integration</span>
        </button>
      </div>

      <AddIntegrationDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        connectedKeys={new Set(connected.map((i) => i.key))}
        onAdd={connect}
        disabled={!canEdit}
      />
    </ProfileSectionCard>
  );
}
