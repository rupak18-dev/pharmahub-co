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

function getFieldKey(f) {
  if (!f) return "";
  if (typeof f === "string") return f;
  return f.key || f.id || f.value || "";
}

function getFieldLabel(f) {
  if (!f) return "";
  if (typeof f === "string") return f;
  return f.label || f.name || getFieldKey(f);
}

function getFieldType(fieldDef, key = "") {
  if (fieldDef?.date || key.toLowerCase().includes("date")) return "date";
  if (
    fieldDef?.money !== undefined ||
    fieldDef?.type === "number" ||
    key.toLowerCase().includes("qty") ||
    key.toLowerCase().includes("amount") ||
    key.toLowerCase().includes("count") ||
    key.toLowerCase().includes("price") ||
    key.toLowerCase().includes("cost") ||
    key.toLowerCase().includes("profit") ||
    key.toLowerCase().includes("discount") ||
    key.toLowerCase().includes("gst")
  ) {
    return "number";
  }
  return "text";
}

function getOperatorsForField(fieldDef, key = "") {
  const type = getFieldType(fieldDef, key);
  if (type === "date") {
    return [
      { value: "between", label: "between" },
      { value: "equals", label: "is on" },
      { value: "greater_than", label: "after" },
      { value: "less_than", label: "before" },
    ];
  }
  if (type === "number") {
    return [
      { value: "greater_than", label: ">" },
      { value: "less_than", label: "<" },
      { value: "equals", label: "=" },
      { value: "between", label: "between" },
    ];
  }
  return [
    { value: "equals", label: "is" },
    { value: "not_equals", label: "is not" },
    { value: "contains", label: "contains" },
    { value: "in", label: "is one of" },
  ];
}

function getDefaultOperator(fieldDef, key = "") {
  const ops = getOperatorsForField(fieldDef, key);
  return ops[0].value;
}

export default function FilterBuilder({ filters = [], availableFields = [], onChange }) {
  const [nextId, setNextId] = useState(() => filters.length + 1);

  const getFieldDef = (key) =>
    availableFields.find((af) => getFieldKey(af) === key);

  const addFilter = () => {
    const firstField = availableFields[0];
    const firstKey = getFieldKey(firstField);
    const newFilter = {
      id: `f-${Date.now()}-${nextId}`,
      field: firstKey,
      operator: getDefaultOperator(firstField, firstKey),
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

        if (patch.field !== undefined && patch.field !== f.field) {
          const fieldDef = getFieldDef(patch.field);
          const validOps = getOperatorsForField(fieldDef, patch.field);
          if (!validOps.some((op) => op.value === updated.operator)) {
            updated.operator = getDefaultOperator(fieldDef, patch.field);
          }
          updated.value = "";
        }

        if (patch.operator !== undefined && patch.operator !== f.operator) {
          updated.value = "";
        }

        return updated;
      })
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
      {filters.map((filter, idx) => {
        const currentFieldDef = getFieldDef(filter.field);
        const fieldType = getFieldType(currentFieldDef, filter.field);
        const availableOperators = getOperatorsForField(currentFieldDef, filter.field);

        return (
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
              {/* Field Dropdown */}
              <Select
                value={filter.field || ""}
                onValueChange={(v) => updateFilter(filter.id, { field: v })}
              >
                <SelectTrigger
                  className={cn(
                    "h-8 min-w-0 flex-[2] text-xs",
                    !filter.field && "text-muted-foreground"
                  )}
                >
                  <SelectValue placeholder="Field" />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map((f) => {
                    const key = getFieldKey(f);
                    const label = getFieldLabel(f);
                    return (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Operator Dropdown */}
              <Select
                value={filter.operator || availableOperators[0]?.value}
                onValueChange={(v) => updateFilter(filter.id, { operator: v })}
              >
                <SelectTrigger className="h-8 w-24 shrink-0 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableOperators.map((op) => (
                    <SelectItem key={op.value} value={op.value} className="text-xs">
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Value Input */}
              {fieldType === "date" ? (
                filter.operator === "between" ? (
                  <div className="flex items-center gap-1 flex-[2] min-w-0">
                    <Input
                      type="date"
                      className="h-8 flex-1 min-w-0 text-[11px] px-1.5"
                      value={(filter.value || "").split(",")[0] || ""}
                      onChange={(e) => {
                        const parts = (filter.value || "").split(",");
                        updateFilter(filter.id, { value: `${e.target.value},${parts[1] || ""}` });
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground shrink-0">to</span>
                    <Input
                      type="date"
                      className="h-8 flex-1 min-w-0 text-[11px] px-1.5"
                      value={(filter.value || "").split(",")[1] || ""}
                      onChange={(e) => {
                        const parts = (filter.value || "").split(",");
                        updateFilter(filter.id, { value: `${parts[0] || ""},${e.target.value}` });
                      }}
                    />
                  </div>
                ) : (
                  <Input
                    type="date"
                    className="h-8 flex-[2] min-w-0 text-xs"
                    value={filter.value || ""}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                  />
                )
              ) : fieldType === "number" ? (
                filter.operator === "between" ? (
                  <div className="flex items-center gap-1 flex-[2] min-w-0">
                    <Input
                      type="number"
                      placeholder="Min"
                      className="h-8 flex-1 min-w-0 text-xs px-2"
                      value={(filter.value || "").split(",")[0] || ""}
                      onChange={(e) => {
                        const parts = (filter.value || "").split(",");
                        updateFilter(filter.id, { value: `${e.target.value},${parts[1] || ""}` });
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground shrink-0">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      className="h-8 flex-1 min-w-0 text-xs px-2"
                      value={(filter.value || "").split(",")[1] || ""}
                      onChange={(e) => {
                        const parts = (filter.value || "").split(",");
                        updateFilter(filter.id, { value: `${parts[0] || ""},${e.target.value}` });
                      }}
                    />
                  </div>
                ) : (
                  <Input
                    type="number"
                    placeholder="Value"
                    className="h-8 flex-[2] min-w-0 text-xs"
                    value={filter.value || ""}
                    onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                  />
                )
              ) : (
                <Input
                  type="text"
                  className="h-8 flex-[2] min-w-0 text-xs"
                  placeholder={
                    filter.operator === "in"
                      ? "val1, val2…"
                      : "Value"
                  }
                  value={filter.value || ""}
                  onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                />
              )}

              {/* Remove Trash Icon Button */}
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
        );
      })}

      {/* Add filter rule button */}
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
