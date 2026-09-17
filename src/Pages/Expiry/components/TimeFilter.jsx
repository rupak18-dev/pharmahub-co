import { useState } from "react";
import { addDays, format } from "date-fns";
import { CalendarClock, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { PRESET_WINDOWS, windowLabel } from "@/lib/expiry";
export function TimeFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(() =>
    value.kind === "custom" ? value.from : format(new Date(), "yyyy-MM-dd"),
  );
  const [to, setTo] = useState(() =>
    value.kind === "custom" ? value.to : format(addDays(new Date(), 30), "yyyy-MM-dd"),
  );
  const pick = (w) => {
    onChange(w);
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <span className="hidden sm:inline">{windowLabel(value)}</span>
          <span className="sm:hidden">Window</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Time window
        </p>
        <div className="flex flex-col gap-0.5">
          {PRESET_WINDOWS.map((w) => {
            const active = value.kind === "preset" && value.preset === w.value;
            return (
              <button
                key={w.value}
                type="button"
                onClick={() => pick({ kind: "preset", preset: w.value })}
                className={cn(
                  "flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                  active && "bg-accent font-medium text-accent-foreground",
                )}
              >
                {w.label}
                {active && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
        <div className="my-2 h-px bg-border" />
        <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Custom range
        </p>
        <div className="grid grid-cols-2 gap-2 px-1">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">From</span>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">To</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        <Button
          size="sm"
          className="mt-2 w-full"
          onClick={() => {
            if (from && to && from <= to) pick({ kind: "custom", from, to });
          }}
        >
          Apply range
        </Button>
      </PopoverContent>
    </Popover>
  );
}
