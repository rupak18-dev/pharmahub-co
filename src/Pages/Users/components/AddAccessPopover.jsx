import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { ACCESS_MODULES } from "./accessModules";

/* Compact multi-select panel for choosing PharmaHub module access.
   Already-selected modules appear checked and disabled so duplicates can
   never be added; only the draft selection is committed via [Add Access]. */
export function AddAccessPopover({ selectedIds = [], onAdd }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState([]);

  const toggleOpen = (next) => {
    setOpen(next);
    if (next) setDraft([]);
  };

  const toggleDraft = (id) => {
    setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  };

  const commit = () => {
    if (draft.length === 0) return;
    onAdd(draft);
    setDraft([]);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={toggleOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Add Access
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="flex max-h-(--radix-popover-content-available-height) w-80 flex-col p-0"
      >
        <div className="shrink-0 border-b border-border px-4 pb-2 pt-3">
          <p className="text-sm font-semibold text-foreground">Add Access</p>
          <p className="text-xs text-muted-foreground">
            Select the areas this staff member can use.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {ACCESS_MODULES.map((m) => {
            const already = selectedIds.includes(m.id);
            const checked = already || draft.includes(m.id);
            const Icon = m.icon;
            return (
              <label
                key={m.id}
                className={`flex items-start gap-3 rounded-md px-2 py-2 ${
                  already ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  checked={checked}
                  disabled={already}
                  onCheckedChange={() => !already && toggleDraft(m.id)}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{m.name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{m.description}</p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => toggleOpen(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs font-semibold"
            disabled={draft.length === 0}
            onClick={commit}
          >
            Add Access
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
