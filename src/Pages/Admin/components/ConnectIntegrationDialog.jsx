import { useState } from "react";
import { Loader2, PlugZap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { connectIntegration, configureIntegration } from "@/lib/integrationsService";

/**
 * Compact connect / configure modal used by the Integrations page.
 * Drives the REAL connection flow: config -> backend connect -> success.
 * Never marks an integration as connected unless the backend confirms it.
 */
export function ConnectIntegrationDialog({
  open,
  onOpenChange,
  item,
  existingConfig = {},
  mode = "connect", // "connect" | "configure"
  onDone,
  disabled = false,
}) {
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!item) return null;

  const isConfigure = mode === "configure";
  const fields = item.configFields ?? [];
  const initial = isConfigure ? existingConfig : {};

  const effectiveValue = (field) => values[field.key] ?? initial[field.key] ?? "";

  const validate = () => {
    for (const field of fields) {
      if (field.required && !String(effectiveValue(field)).trim()) {
        toast.error(`${field.label} is required`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (disabled) return;
    if (!validate()) return;

    const config = {};
    fields.forEach((field) => {
      const val = effectiveValue(field);
      if (val !== undefined && val !== "") config[field.key] = val;
    });

    setSubmitting(true);
    try {
      const record = isConfigure
        ? await configureIntegration(item.key, config)
        : await connectIntegration(item.key, config);
      toast.success(
        isConfigure
          ? `${item.name} configuration saved`
          : `${item.name} connected successfully`,
      );
      onOpenChange(false);
      onDone?.(record);
    } catch {
      toast.error(
        `Unable to ${isConfigure ? "update" : "connect"} ${item.name}. The integrations backend is not available yet.`,
      );
      setSubmitting(false);
    }
  };

  const Icon = item.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-base font-semibold">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-muted/40"
              aria-hidden="true"
            >
              <Icon className="h-5 w-5" style={{ color: item.color }} />
            </span>
            {isConfigure ? `Configure ${item.name}` : `Connect ${item.name}`}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isConfigure
              ? "Update the connection details for this integration. Values are sent to the backend."
              : "Enter the connection details required to link this service to your pharmacy."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {fields.length > 0 ? (
            fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`${item.key}-${field.key}`} className="text-xs font-semibold">
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                </Label>
                <Input
                  id={`${item.key}-${field.key}`}
                  value={effectiveValue(field)}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder}
                  className="h-9 rounded-lg text-xs"
                  autoFocus
                />
                {field.hint && (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{field.hint}</p>
                )}
              </div>
            ))
          ) : (
            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
              <PlugZap className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {isConfigure
                  ? `Configuration is managed on the ${item.name} side.`
                  : `You'll be redirected to authorize ${item.name} securely. After authorization the backend records the connection.`}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9 gap-1.5 text-xs font-semibold"
            onClick={handleSubmit}
            disabled={disabled || submitting}
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PlugZap className="h-3.5 w-3.5" />
            )}
            {submitting
              ? isConfigure
                ? "Saving…"
                : "Connecting…"
              : isConfigure
                ? "Save Configuration"
                : fields.length > 0
                  ? `Connect ${item.name}`
                  : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
