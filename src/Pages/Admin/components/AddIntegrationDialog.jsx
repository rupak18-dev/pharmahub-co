import { useMemo, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { INTEGRATION_GROUPS, INTEGRATIONS } from "./integrationsCatalog";

/**
 * Integration selector for the Integrations page.
 * Presents a compact, grouped catalogue of pharmacy services — not an
 * app-store marketplace. Rows are intentionally short: icon, name,
 * one-line description and a compact action button.
 */
export function AddIntegrationDialog({ open, onOpenChange, connectedKeys, onConnect, disabled }) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? INTEGRATIONS.filter(
          (item) =>
            item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
        )
      : INTEGRATIONS;
    return INTEGRATION_GROUPS.map((group) => ({
      ...group,
      items: filtered.filter((i) => i.category === group.key),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border p-4 pr-12 text-left sm:p-5">
          <DialogTitle className="text-base font-semibold">Add Integration</DialogTitle>
          <DialogDescription className="text-xs">
            Connect a pharmacy service to PharmaHub. Choose an integration to get started.
          </DialogDescription>
          <div className="relative mt-3">
            <Search
              className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search integrations…"
              className="h-9 pl-8 rounded-lg text-xs"
              aria-label="Search integrations"
            />
          </div>
        </DialogHeader>

        <div className="max-h-[58vh] space-y-5 overflow-y-auto p-4 sm:p-5">
          {groups.map((group) => (
            <div key={group.key}>
              <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.label}
              </h4>
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isConnected = connectedKeys.has(item.key);
                  return (
                    <li key={item.key} className="flex items-center gap-3 px-3 py-2.5">
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/40"
                        aria-hidden="true"
                      >
                        <Icon className="h-4 w-4" style={{ color: item.color }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[13px] font-semibold text-foreground">
                            {item.name}
                          </p>
                          {isConnected && (
                            <Badge
                              variant="secondary"
                              className="h-5 shrink-0 gap-1 border-emerald-500/20 bg-emerald-500/10 px-1.5 text-[10px] font-semibold text-emerald-700"
                            >
                              <Check className="h-3 w-3" aria-hidden="true" />
                              Connected
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={isConnected ? "outline" : "default"}
                        className="h-8 shrink-0 rounded-lg text-xs font-medium"
                        disabled={disabled || isConnected}
                        onClick={() => onConnect(item)}
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        {isConnected ? "Connected" : "Connect"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {groups.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No integrations match "{query}".
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
