import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/Components/ui/dialog";
import { REPORT_MODULES, REPORT_CATEGORIES } from "../reportModules";
import { Badge } from "@/Components/ui/badge";
import { useState } from "react";

const CATEGORY_COLORS = {
  Sales: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    border: "border-blue-200/60",
    hover: "hover:border-blue-300 hover:bg-blue-50/80",
  },
  Purchases: {
    bg: "bg-purple-50",
    icon: "text-purple-600",
    border: "border-purple-200/60",
    hover: "hover:border-purple-300 hover:bg-purple-50/80",
  },
  Inventory: {
    bg: "bg-teal-50",
    icon: "text-teal-600",
    border: "border-teal-200/60",
    hover: "hover:border-teal-300 hover:bg-teal-50/80",
  },
  Medicines: {
    bg: "bg-sky-50",
    icon: "text-sky-600",
    border: "border-sky-200/60",
    hover: "hover:border-sky-300 hover:bg-sky-50/80",
  },
  Customers: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    border: "border-emerald-200/60",
    hover: "hover:border-emerald-300 hover:bg-emerald-50/80",
  },
  Suppliers: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    border: "border-amber-200/60",
    hover: "hover:border-amber-300 hover:bg-amber-50/80",
  },
  Expiry: {
    bg: "bg-orange-50",
    icon: "text-orange-600",
    border: "border-orange-200/60",
    hover: "hover:border-orange-300 hover:bg-orange-50/80",
  },
  GST: {
    bg: "bg-green-50",
    icon: "text-green-600",
    border: "border-green-200/60",
    hover: "hover:border-green-300 hover:bg-green-50/80",
  },
  Payments: {
    bg: "bg-cyan-50",
    icon: "text-cyan-600",
    border: "border-cyan-200/60",
    hover: "hover:border-cyan-300 hover:bg-cyan-50/80",
  },
  Audit: {
    bg: "bg-rose-50",
    icon: "text-rose-600",
    border: "border-rose-200/60",
    hover: "hover:border-rose-300 hover:bg-rose-50/80",
  },
};

export default function ModulePickerModal({ open, onOpenChange, onSelect }) {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? REPORT_MODULES
      : REPORT_MODULES.filter((m) => m.category === activeCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Choose a Report Module</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select the pharmacy module you want to build a report from.
            </DialogDescription>
          </DialogHeader>

          {/* Category chip filter */}
          <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {[{ id: "All", label: "All" }, ...REPORT_CATEGORIES].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap transition-colors border shrink-0",
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-accent",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Module Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {filtered.map((module) => {
              const Icon = module.icon;
              const colors = CATEGORY_COLORS[module.category] ?? {
                bg: "bg-muted",
                icon: "text-muted-foreground",
                border: "border-border",
                hover: "hover:border-border",
              };
              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => onSelect(module.id)}
                  className={cn(
                    "group flex items-start gap-3 rounded-lg border p-3.5 text-left transition-all cursor-pointer",
                    "border-border bg-card",
                    colors.hover,
                    "hover:shadow-sm",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border mt-0.5",
                      colors.bg,
                      colors.border,
                    )}
                  >
                    <Icon className={cn("h-4 w-4", colors.icon)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-foreground">{module.title}</span>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-medium px-1 py-0 h-3.5 border-border text-muted-foreground shrink-0"
                      >
                        {module.category}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {module.description}
                    </p>
                    <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                      {module.fields.length} dimensions · {module.measures.length} metrics
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/30 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>{REPORT_MODULES.length} modules available</span>
          <button
            type="button"
            className="hover:text-foreground transition-colors"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
