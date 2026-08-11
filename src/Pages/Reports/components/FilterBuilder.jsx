import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Input } from "@/Components/ui/input";
import { cn } from "@/lib/utils";

const OPERATORS = [
  { value: "equals", label: "is" },
  { value: "not_equals", label: "is not" },
  { value: "contains", label: "contains" },
  { value: "greater_than", label: ">" },
  { value: "less_than", label: "<" },
  { value: "between", label: "between" },
  { value: "in", label: "is one of" },
];

function getDefaultOperator(field) {
  if (!field) return "equals";
  if (field.date) return "between";
  if (field.money !== undefined) return "greater_than";
  return "equals";
}

export default function FilterBuilder({ filters = [], availableFields = [], onChange }) {
  const [nextId, setNextId] = useState(() => filters.length + 1);

  const addFilter = () => {
    const firstField = availableFields[0];
    const newFilter = {
      id: `f-${nextId}`,
      field: firstField?.key ?? "",
      operator: getDefaultOperator(firstField),
      value: "",
    };
    setNextId((n) => n + 1);
    onChange([...filters, newFilter]);
  };

  const updateFilter = (id, patch) => {
    onChange(
      filters.map((f) => {
        if (f.id !== id) return f;
        const updated = { ...f, ...patch };
        // Reset value when field or operator changes
        if (patch.field !== undefined && patch.field !== f.field) {
          const fieldDef = availableFields.find((af) => af.key === patch.field);
          updated.operator = getDefaultOperator(fieldDef);
          updated.value = "";
        }
        if (patch.operator !== undefined && patch.operator !== f.operator) {
          updated.value = "";
        }
        return updated;
      }),
    );
  };

  const removeFilter = (id) => {
    onChange(filters.filter((f) => f.id !== id));
  };

  if (filters.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground italic">No filter rules applied.</p>
        <button
          type="button"
          onClick={addFilter}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors w-full justify-center"
        >
          <Plus className="h-3.5 w-3.5" />
          Add filter rule
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filters.map((filter, idx) => (
        <div key={filter.id} className="space-y-1">
          {/* AND combinator between rules */}
          {idx > 0 && (
            <div className="flex items-center gap-2 py-0.5">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60 px-1">
                and
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          {/* Filter row */}
          <div className="flex items-start gap-1.5">
            {/* Field */}
            <Select
              value={filter.field}
              onValueChange={(v) => updateFilter(filter.id, { field: v })}
            >
              <SelectTrigger
                className={cn(
                  "h-8 min-w-0 flex-[2] text-xs",
                  !filter.field && "text-muted-foreground",
                )}
              >
                <SelectValue placeholder="Field" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.map((f) => (
                  <SelectItem key={f.key} value={f.key} className="text-xs">
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Operator */}
            <Select
              value={filter.operator}
              onValueChange={(v) => updateFilter(filter.id, { operator: v })}
            >
              <SelectTrigger className="h-8 w-24 shrink-0 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map((op) => (
                  <SelectItem key={op.value} value={op.value} className="text-xs">
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Value */}
            <Input
              className="h-8 flex-[2] min-w-0 text-xs"
              placeholder={
                filter.operator === "between"
                  ? "min, max"
                  : filter.operator === "in"
                    ? "value1, value2…"
                    : "Value"
              }
              value={filter.value}
              onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            />

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeFilter(filter.id)}
              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Remove filter"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      {/* Add filter button */}
      <button
        type="button"
        onClick={addFilter}
        className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors w-full justify-center"
      >
        <Plus className="h-3.5 w-3.5" />
        Add filter rule
      </button>
    </div>
  );
}
