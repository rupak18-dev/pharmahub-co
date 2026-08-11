import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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
import { INTEGRATIONS, INTEGRATION_CATEGORIES } from "./integrationsCatalog";

const CATEGORY_LABEL = Object.fromEntries(INTEGRATION_CATEGORIES.map((c) => [c.key, c.label]));

export function AddIntegrationDialog({ open, onOpenChange, connectedKeys, onAdd, disabled }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INTEGRATIONS;
    return INTEGRATIONS.filter((item) => {
      const label = CATEGORY_LABEL[item.category] ?? "";
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        label.toLowerCase().includes(q)
      );
    });
  }, [query]);
  const groups = useMemo(
    () =>
      INTEGRATION_CATEGORIES.map((cat) => ({
        ...cat,
        items: filtered.filter((i) => i.category === cat.key),
      })).filter((g) => g.items.length > 0),
    [filtered],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border p-4 pr-12 text-left sm:p-6">
          <DialogTitle>Add integration</DialogTitle>
          <DialogDescription>
            Connect a pharmacy service to PharmaHub. Choose a category to get started.
          </DialogDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search integrations…"
              className="pl-9"
              aria-label="Search integrations"
            />
          </div>
        </DialogHeader>
        <div className="max-h-[55vh] space-y-5 overflow-y-auto p-4 sm:p-6">
          {groups.map((group) => (
            <div key={group.key}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isConnected = connectedKeys.has(item.key);
                  return (
                    <div
                      key={item.key}
                      className="flex flex-col rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/80">
                          <Icon size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {item.name}
                            </p>
                            {isConnected && <Badge variant="success">Connected</Badge>}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={isConnected ? "secondary" : "default"}
                        size="sm"
                        className="mt-3 w-full"
                        disabled={disabled || isConnected}
                        onClick={() => onAdd(item)}
                      >
                        {isConnected ? "Connected" : "Connect"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {groups.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No integrations match “{query}”.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
