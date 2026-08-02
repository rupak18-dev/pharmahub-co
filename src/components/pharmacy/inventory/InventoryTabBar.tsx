import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Inventory Overview" },
  { key: "ledger", label: "Stock Ledger" },
  { key: "rack", label: "Rack Placement" },
  { key: "audit", label: "Audit Logs" },
  { key: "reports", label: "Reports" },
] as const;

export type InventoryTab = (typeof TABS)[number]["key"];

export function InventoryTabBar({
  active,
  onChange,
}: {
  active: InventoryTab;
  onChange: (tab: InventoryTab) => void;
}) {
  return (
    <div className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-full border border-border bg-card p-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            active === t.key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
