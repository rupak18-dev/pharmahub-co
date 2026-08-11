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
  Timer,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useDb } from "@/hooks/useDb";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/Components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
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
import { ProfileSectionCard } from "./ProfileSectionCard";

const CURRENCIES = [
  { symbol: "₹", label: "Indian Rupee" },
  { symbol: "$", label: "US Dollar" },
  { symbol: "€", label: "Euro" },
  { symbol: "£", label: "Pound Sterling" },
];
const CUSTOM = "custom";
const DEFAULT_HOURS = { open: "09:00", close: "21:00" };

function SettingRow({ icon: Icon, label, value, muted }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <dt className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd className="min-w-0 text-right text-sm font-medium text-foreground">
        {value || <span className="font-normal text-muted-foreground">Not configured</span>}
      </dd>
    </div>
  );
}

function BusinessSettingsDialog({ open, onOpenChange }) {
  const { user } = useAuth();
  const has = usePermission();
  const settings = useDb((d) => d.settings);
  const canEdit = has("admin", "update");

  const hours = { ...DEFAULT_HOURS, ...(settings.operatingHours ?? {}) };
  const invoicePrefs = {
    showGst: true,
    showPharmacyDetails: true,
    ...(settings.invoicePreferences ?? {}),
  };

  const [currency, setCurrency] = useState(settings.currency ?? "₹");
  const [gstDefault, setGstDefault] = useState(settings.gstDefault ?? 0);
  const [openTime, setOpenTime] = useState(hours.open);
  const [closeTime, setCloseTime] = useState(hours.close);
  const [defaultLocation, setDefaultLocation] = useState(settings.defaultLocation ?? "");
  const [showGst, setShowGst] = useState(invoicePrefs.showGst);
  const [showPharmacyDetails, setShowPharmacyDetails] = useState(invoicePrefs.showPharmacyDetails);

  const preset = CURRENCIES.find((c) => c.symbol === currency);
  const currencySelectValue = preset ? preset.symbol : CUSTOM;

  const save = () => {
    db.set((d) => {
      d.settings.currency = currency;
      d.settings.gstDefault = gstDefault;
      d.settings.operatingHours = { open: openTime, close: closeTime };
      d.settings.defaultLocation = defaultLocation;
      d.settings.invoicePreferences = {
        showGst,
        showPharmacyDetails,
      };
      d.activityLogs.unshift({
        id: db.uid(),
        userId: user?.id ?? "",
        userName: user?.name ?? "",
        action: "Updated business settings",
        entityType: "settings",
        createdAt: new Date().toISOString(),
      });
    });
    onOpenChange(false);
    toast.success("Business settings saved");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Manage Business Settings</DialogTitle>
          <DialogDescription>
            Business defaults used across your workspace. Applies to new invoices and records.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="business-currency">Currency</Label>
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
                <SelectTrigger id="business-currency" className="w-full pl-8">
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
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                maxLength={4}
                placeholder="e.g. ₨"
                disabled={!canEdit}
              />
            )}
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
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Invoice Preferences</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label
                className={`flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 ${canEdit ? "cursor-pointer" : ""}`}
              >
                <span className="flex items-center gap-2.5 text-sm">
                  <Receipt className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  Show GST on invoices
                </span>
                <Switch
                  checked={showGst}
                  onCheckedChange={setShowGst}
                  disabled={!canEdit}
                  aria-label="Show GST on invoices"
                />
              </label>
              <label
                className={`flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 ${canEdit ? "cursor-pointer" : ""}`}
              >
                <span className="flex items-center gap-2.5 text-sm">
                  <Receipt className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  Show pharmacy details on receipts
                </span>
                <Switch
                  checked={showPharmacyDetails}
                  onCheckedChange={setShowPharmacyDetails}
                  disabled={!canEdit}
                  aria-label="Show pharmacy details on receipts"
                />
              </label>
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Operating Hours</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Clock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="time"
                  className="pl-8"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  disabled={!canEdit}
                  aria-label="Opens at"
                />
              </div>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="time"
                  className="pl-8"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  disabled={!canEdit}
                  aria-label="Closes at"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="default-location">Default Business Location</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="default-location"
                className="pl-8"
                value={defaultLocation}
                onChange={(e) => setDefaultLocation(e.target.value)}
                disabled={!canEdit}
                placeholder="e.g. Main Branch, New Delhi"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-9 text-xs font-semibold"
            onClick={save}
            disabled={!canEdit}
          >
            <Save className="mr-1.5 h-4 w-4" /> Save settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BusinessSettingsSection() {
  const settings = useDb((d) => d.settings);
  const [open, setOpen] = useState(false);
  const currency = CURRENCIES.find((c) => c.symbol === settings.currency);
  const invoicePrefs = {
    showGst: true,
    showPharmacyDetails: true,
    ...(settings.invoicePreferences ?? {}),
  };
  const hours = { ...DEFAULT_HOURS, ...(settings.operatingHours ?? {}) };

  const invoiceValue = [
    invoicePrefs.showGst && "GST on invoices",
    invoicePrefs.showPharmacyDetails && "Pharmacy details on receipts",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ProfileSectionCard
      id="business-settings"
      icon={Settings}
      title="Business Settings"
      description="Operational defaults for your pharmacy."
      className="w-full"
      footer={
        <span className="text-xs text-muted-foreground">
          Applies to new invoices and records.
        </span>
      }
    >
      <dl className="divide-y-0">
        <SettingRow icon={Receipt} label="Invoice" value={invoiceValue} />
        <SettingRow
          icon={Percent}
          label="Tax / GST"
          value={settings.gstDefault ? `${settings.gstDefault}% default GST` : null}
        />
        <SettingRow
          icon={Banknote}
          label="Currency"
          value={currency ? `${currency.symbol} ${currency.label}` : settings.currency}
        />
        <SettingRow icon={Wallet} label="Payment" value={null} muted />
        <SettingRow
          icon={Timer}
          label="Stock Preferences"
          value={settings.lowStockDefault ? `Low stock at ${settings.lowStockDefault} units` : null}
        />
        <SettingRow
          icon={CalendarClock}
          label="Expiry Preferences"
          value={
            settings.nearExpiryDays ? `Near-expiry window ${settings.nearExpiryDays} days` : null
          }
        />
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        Opens at {hours.open || "—"} · Closes at {hours.close || "—"}.
      </p>

      <BusinessSettingsDialog open={open} onOpenChange={setOpen} />
    </ProfileSectionCard>
  );
}
