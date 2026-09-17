import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/Components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { FILTER_DEFS, getFilterDef } from "../reportCatalog";

/* ---------------------------------------------------------------------
   FILTER BY
   Filters are added as chips, then each one is configured through a
   value selector. Because the backend is not connected, value lists are
   intentionally empty — the selector shows a clean "no data" state
   instead of fabricated staff/medicine names.
   --------------------------------------------------------------------- */

export default function FilterSelect({ value = [], onChange }) {
  const [open, setOpen] = useState(false);

  const activeKeys = new Set(value.map((f) => f.key));
  const available = FILTER_DEFS.filter((f) => !activeKeys.has(f.key));

  const add = (key) => onChange([...value, { key, value: null }]);

  const remove = (key) => onChange(value.filter((f) => f.key !== key));

  const setValue = (key, next) =>
    onChange(value.map((f) => (f.key === key ? { key, value: next } : f)));

  const labelFor = (key) => getFilterDef(key)?.label ?? key;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map((f) => (
        <div
          key={f.key}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-1 py-1"
        >
          <span className="pl-1.5 text-xs font-medium text-foreground">{labelFor(f.key)}</span>
          <Select value={f.value ?? ""} onValueChange={(v) => setValue(f.key, v)}>
            <SelectTrigger className="h-7 w-[150px] rounded-md border border-input bg-background px-2 text-xs shadow-sm">
              <SelectValue placeholder={`Select ${labelFor(f.key)}`} />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-3 text-center">
                <p className="text-xs font-medium text-foreground">No values available</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Connect pharmacy data to list {labelFor(f.key).toLowerCase()} options.
                </p>
              </div>
              <SelectItem value="__none__" className="hidden">
                none
              </SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => remove(f.key)}
            aria-label={`Remove ${labelFor(f.key)} filter`}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={available.length === 0}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add Filter
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" side="bottom" className="w-64 p-0" sideOffset={6}>
          <Command>
            <CommandInput placeholder="Search filters..." />
            <CommandList>
              <CommandEmpty>No matching filter</CommandEmpty>
              <CommandGroup>
                {available.map((f) => (
                  <CommandItem
                    key={f.key}
                    value={f.label}
                    onSelect={() => add(f.key)}
                    className="text-xs"
                  >
                    <span className="flex-1">{f.label}</span>
                    {activeKeys.has(f.key) && <Check className="h-3.5 w-3.5 text-primary" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
