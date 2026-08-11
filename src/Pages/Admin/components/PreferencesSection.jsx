import { useState } from "react";
import { Banknote, Percent, Save } from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/Components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";

const CURRENCIES = [
  { symbol: "₹", label: "Indian Rupee" },
  { symbol: "$", label: "US Dollar" },
  { symbol: "€", label: "Euro" },
  { symbol: "£", label: "Pound Sterling" },
];
const CUSTOM = "custom";

export function PreferencesSection() {
  const { user } = useAuth();
  const has = usePermission();
  const settings = useDb((d) => d.settings);
  const canEdit = has("admin", "update");
  const [currency, setCurrency] = useState(settings.currency);
  const [gstDefault, setGstDefault] = useState(settings.gstDefault);
  const preset = CURRENCIES.find((c) => c.symbol === currency);
  const currencySelectValue = preset ? preset.symbol : CUSTOM;
  const log = (action, details) => ({
    id: db.uid(),
    userId: user?.id ?? "",
    userName: user?.name ?? "",
    action,
    entityType: "settings",
    details,
    createdAt: new Date().toISOString(),
  });
  const savePreferences = () => {
    db.set((d) => {
      d.settings.currency = currency;
      d.settings.gstDefault = gstDefault;
      d.activityLogs.unshift(log("Updated application preferences", { currency, gstDefault }));
    });
    toast.success("Preferences saved");
  };
  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Application Preferences</CardTitle>
          <CardDescription>Business defaults used across your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="business-currency">Business currency</Label>
            <div className="relative">
              <Banknote className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Select
                value={currencySelectValue}
                onValueChange={(value) => {
                  if (value === CUSTOM) return;
                  setCurrency(value);
                }}
                disabled={!canEdit}
              >
                <SelectTrigger className="w-full pl-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.symbol} value={c.symbol}>
                      <span className="flex items-center gap-2">
                        {c.symbol} {c.label}
                      </span>
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM}>Custom symbol…</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {currencySelectValue === CUSTOM && (
              <Input
                id="custom-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                maxLength={4}
                placeholder="e.g. ₨"
                disabled={!canEdit}
              />
            )}
            <p className="text-xs text-muted-foreground">Shown on prices across the workspace.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="default-gst">Default GST %</Label>
            <div className="relative">
              <Percent className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="default-gst"
                className="pl-8"
                type="number"
                value={gstDefault}
                onChange={(e) => setGstDefault(Number(e.target.value) || 0)}
                disabled={!canEdit}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Applied by default when you add a new medicine.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={savePreferences} disabled={!canEdit}>
            <Save className="mr-1.5 h-4 w-4" /> Save preferences
          </Button>
        </CardFooter>
      </Card>
      <p className="text-xs text-muted-foreground">
        Dates, numbers, and stock alert windows follow system defaults automatically.
      </p>
    </div>
  );
}
