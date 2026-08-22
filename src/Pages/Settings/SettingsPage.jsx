import { useState } from "react";
import {
  Banknote,
  CalendarClock,
  Clock,
  MapPin,
  Percent,
  Receipt,
  Save,
  Settings,
  Settings2,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Switch } from "@/Components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";

export const handle = { title: "Manage Settings · PharmaHub" };

const CURRENCIES = [
  { symbol: "₹", label: "Indian Rupee (INR)" },
  { symbol: "$", label: "US Dollar (USD)" },
  { symbol: "€", label: "Euro (EUR)" },
  { symbol: "£", label: "Pound Sterling (GBP)" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const settings = useDb((d) => d.settings || {});

  const [currency, setCurrency] = useState(settings.currency || "₹");
  const [gstDefault, setGstDefault] = useState(settings.gstDefault || 12);
  const [openTime, setOpenTime] = useState(settings.operatingHours?.open || "09:00");
  const [closeTime, setCloseTime] = useState(settings.operatingHours?.close || "21:00");
  const [showGst, setShowGst] = useState(settings.invoicePreferences?.showGst ?? true);
  const [showPharmacyDetails, setShowPharmacyDetails] = useState(
    settings.invoicePreferences?.showPharmacyDetails ?? true,
  );
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    db.set((d) => {
      if (!d.settings) d.settings = {};
      d.settings.currency = currency;
      d.settings.gstDefault = Number(gstDefault);
      d.settings.operatingHours = { open: openTime, close: closeTime };
      d.settings.invoicePreferences = { showGst, showPharmacyDetails };
      d.activityLogs.unshift({
        id: db.uid(),
        userId: user?.id ?? "",
        userName: user?.name ?? "",
        action: "Updated application settings",
        entityType: "settings",
        createdAt: new Date().toISOString(),
      });
    });

    setTimeout(() => {
      setSaving(false);
      toast.success("Application settings updated successfully!");
    }, 300);
  };

  return (
    <div className="w-full pb-16 pt-2">
      <div className="mx-auto w-full max-w-[1000px] space-y-8 px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Manage Settings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure system defaults, invoice formatting, tax rules, and operating hours.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="self-start sm:self-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2 rounded-xl shadow-sm px-5 py-2.5"
          >
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Currency & Tax Defaults Card */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-6">
            <div className="border-b border-border/60 pb-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Banknote className="h-4 w-4 text-primary" /> Financial & Tax Defaults
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set active currency symbol and default tax rates for billing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="currency" className="text-xs font-semibold">
                  Active Currency
                </Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency" className="rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.symbol} value={c.symbol}>
                        {c.label} ({c.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gstDefault" className="text-xs font-semibold">
                  Default GST Rate (%)
                </Label>
                <Input
                  id="gstDefault"
                  type="number"
                  value={gstDefault}
                  onChange={(e) => setGstDefault(e.target.value)}
                  placeholder="12"
                  className="rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-6">
            <div className="border-b border-border/60 pb-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Operating Hours
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daily pharmacy opening and closing schedules.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="openTime" className="text-xs font-semibold">
                  Opening Time
                </Label>
                <Input
                  id="openTime"
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="closeTime" className="text-xs font-semibold">
                  Closing Time
                </Label>
                <Input
                  id="closeTime"
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Invoice & Receipt Formatting */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-6">
            <div className="border-b border-border/60 pb-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" /> Invoice & Receipt Preferences
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Controls what details appear on customer bills and receipts.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20">
                <div>
                  <Label htmlFor="showGstSwitch" className="text-xs font-semibold block">
                    Display GST Breakdown on Invoices
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Shows CGST/SGST line items on printed receipts
                  </span>
                </div>
                <Switch id="showGstSwitch" checked={showGst} onCheckedChange={setShowGst} />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20">
                <div>
                  <Label
                    htmlFor="showPharmacyDetailsSwitch"
                    className="text-xs font-semibold block"
                  >
                    Print Pharmacy Address & License
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Includes pharmacy license number and full address on header
                  </span>
                </div>
                <Switch
                  id="showPharmacyDetailsSwitch"
                  checked={showPharmacyDetails}
                  onCheckedChange={setShowPharmacyDetails}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
