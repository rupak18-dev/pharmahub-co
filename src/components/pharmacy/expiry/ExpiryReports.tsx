import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarClock,
  Download,
  FileSpreadsheet,
  FileText,
  PackageX,
  RotateCcw,
  TrendingDown,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExpiryRow } from "@/lib/expiry";
import { LOSS_RATIO } from "@/lib/expiry";

export function ExpiryReports({
  rows,
  currency,
  onExport,
  onSaveSchedule,
}: {
  rows: ExpiryRow[];
  currency: string;
  onExport: (kind: string, format: "csv" | "pdf" | "xls") => void;
  onSaveSchedule: (payload: {
    frequency: "daily" | "weekly" | "monthly";
    email: string;
    whatsapp: boolean;
    reports: string[];
  }) => void;
}) {
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [email, setEmail] = useState("owner@pharmacyos.demo");
  const [whatsapp, setWhatsapp] = useState(true);
  const [prefs, setPrefs] = useState({
    near: true,
    expired: true,
    mfr: false,
    loss: true,
    ret: true,
  });

  const summary = useMemo(() => {
    const near = rows.filter((r) => r.days > 0 && r.days <= 30);
    const expired = rows.filter((r) => r.days < 0);
    const returnable = rows.filter((r) => r.days >= -30 && r.days <= 30);
    const byMfr = new Map<string, number>();
    rows.forEach((r) => byMfr.set(r.manufacturer, (byMfr.get(r.manufacturer) ?? 0) + r.stockValue));
    const topMfr = Array.from(byMfr.entries()).sort((a, b) => b[1] - a[1])[0];
    return {
      near: {
        count: near.length,
        value: near.reduce((s, r) => s + r.stockValue, 0),
      },
      expired: {
        count: expired.length,
        value: expired.reduce((s, r) => s + r.stockValue, 0),
      },
      returnable: {
        count: returnable.length,
        value: returnable.reduce((s, r) => s + r.stockValue, 0),
      },
      loss: {
        projection:
          expired.reduce((s, r) => s + r.stockValue, 0) +
          near.reduce((s, r) => s + r.stockValue, 0) * LOSS_RATIO,
      },
      topMfr,
    };
  }, [rows]);

  const cards: {
    key: string;
    icon: typeof FileText;
    title: string;
    desc: string;
    stat: string;
    sub: string;
    tone: string;
  }[] = [
    {
      key: "near",
      icon: CalendarClock,
      title: "Near Expiry",
      desc: "All batches expiring in the next 30 days, with days-left and stock value.",
      stat: `${summary.near.count} batches`,
      sub: `${currency}${Math.round(summary.near.value).toLocaleString()} at risk`,
      tone: "text-warning-foreground",
    },
    {
      key: "expired",
      icon: PackageX,
      title: "Expired Medicines",
      desc: "Batches past expiry with remaining stock — for write-off and GST adjustments.",
      stat: `${summary.expired.count} batches`,
      sub: `${currency}${Math.round(summary.expired.value).toLocaleString()} written off`,
      tone: "text-destructive",
    },
    {
      key: "manufacturer",
      icon: Truck,
      title: "Manufacturer-wise",
      desc: "Expiry loss ranked by manufacturer — evidence for return-policy negotiations.",
      stat: summary.topMfr ? `${summary.topMfr[0]}` : "—",
      sub: summary.topMfr
        ? `${currency}${Math.round(summary.topMfr[1]).toLocaleString()} top exposure`
        : "No data",
      tone: "text-primary",
    },
    {
      key: "loss",
      icon: TrendingDown,
      title: "Financial Loss",
      desc: "Projected loss if nothing is done — the ROI baseline for this module.",
      stat: `${currency}${Math.round(summary.loss.projection).toLocaleString()}`,
      sub: "Projected 30-day loss",
      tone: "text-warning-foreground",
    },
    {
      key: "return",
      icon: RotateCcw,
      title: "Return Report",
      desc: "Returnable batches with supplier, window days left, and expected credit.",
      stat: `${summary.returnable.count} batches`,
      sub: `${currency}${Math.round(summary.returnable.value).toLocaleString()} recoverable`,
      tone: "text-info",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.key}
            className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <c.icon className={`h-4 w-4 ${c.tone}`} />
                <h3 className="text-sm font-semibold">{c.title}</h3>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Export report"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">Export as</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onExport(c.key, "csv")}>
                    <FileText className="h-4 w-4" /> CSV (raw data)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport(c.key, "xls")}>
                    <FileSpreadsheet className="h-4 w-4" /> Excel (.xls)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport(c.key, "pdf")}>
                    <BarChart3 className="h-4 w-4" /> PDF (branded)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums">{c.stat}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
            <p className="mt-3 flex-1 text-sm text-muted-foreground">{c.desc}</p>
          </div>
        ))}

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold">Automated delivery</h3>
          <p className="text-sm text-muted-foreground">
            Email the selected reports on a schedule so expiry never goes unmonitored.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">Frequency</p>
              <Select
                value={frequency}
                onValueChange={(v) => setFrequency(v as "daily" | "weekly" | "monthly")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily (8:00 AM)</SelectItem>
                  <SelectItem value="weekly">Weekly (Mon)</SelectItem>
                  <SelectItem value="monthly">Monthly (1st)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">Send to</p>
              <Select value={email} onValueChange={setEmail}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner@pharmacyos.demo">owner@pharmacyos.demo</SelectItem>
                  <SelectItem value="manager@pharmacyos.demo">manager@pharmacyos.demo</SelectItem>
                  <SelectItem value="inventory@pharmacyos.demo">
                    inventory@pharmacyos.demo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">WhatsApp alerts</p>
              <div className="flex items-center justify-between">
                <Label htmlFor="wa" className="text-sm">
                  On (critical only)
                </Label>
                <Switch id="wa" checked={whatsapp} onCheckedChange={setWhatsapp} />
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-5">
            {(
              [
                ["near", "Near expiry"],
                ["expired", "Expired"],
                ["mfr", "Mfr-wise"],
                ["loss", "Loss"],
                ["ret", "Returns"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                {label}
                <Switch
                  checked={prefs[key]}
                  onCheckedChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))}
                />
              </label>
            ))}
          </div>
          <div className="mt-4">
            <Button
              size="sm"
              onClick={() =>
                onSaveSchedule({
                  frequency,
                  email,
                  whatsapp,
                  reports: Object.entries(prefs)
                    .filter(([, v]) => v)
                    .map(([k]) => k),
                })
              }
            >
              Save delivery schedule
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
