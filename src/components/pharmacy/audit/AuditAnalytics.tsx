import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { PackageX, TrendingUp, PackagePlus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/pharmacy/KpiCard";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  accuracyTrend,
  auditMetrics,
  branchComparison,
  completionTime,
  formatCurrency,
  monthlyCompletion,
  mostMismatched,
  shelfAccuracy,
  staffPerformance,
  topDamaged,
  topMissing,
  varianceByCategory,
  varianceTrend,
} from "@/lib/audit";
import type { Audit, AuditCount, Category, Medicine, VarianceItem } from "@/lib/types";

const CAT_COLORS = [
  "oklch(0.5 0.09 180)",
  "oklch(0.6 0.15 240)",
  "oklch(0.75 0.15 75)",
  "oklch(0.62 0.15 155)",
  "oklch(0.8 0.12 90)",
  "oklch(0.58 0.22 25)",
];

const compact = (v: number) =>
  Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `${Math.round(v)}`;

export function AuditAnalytics({
  audits,
  counts,
  variances,
  medicines,
  categories,
  currency,
}: {
  audits: Audit[];
  counts: AuditCount[];
  variances: VarianceItem[];
  medicines: Medicine[];
  categories: Category[];
  currency: string;
}) {
  const metrics = useMemo(
    () => auditMetrics(audits, counts, variances),
    [audits, counts, variances],
  );
  const accTrend = useMemo(() => accuracyTrend(audits, counts), [audits, counts]);
  const vTrend = useMemo(() => varianceTrend(variances), [variances]);
  const byCat = useMemo(
    () => varianceByCategory(variances, medicines, categories),
    [variances, medicines, categories],
  );
  const byBranch = useMemo(
    () => branchComparison(audits, counts, variances),
    [audits, counts, variances],
  );
  const mismatched = useMemo(() => mostMismatched(variances, medicines, 8), [variances, medicines]);
  const monthly = useMemo(() => monthlyCompletion(audits), [audits]);
  const missing = useMemo(() => topMissing(variances, 6), [variances]);
  const damaged = useMemo(() => topDamaged(variances, 6), [variances]);
  const staff = useMemo(() => staffPerformance(counts), [counts]);
  const completion = useMemo(() => completionTime(audits), [audits]);
  const shelves = useMemo(() => shelfAccuracy(counts), [counts]);

  const money = (v: unknown) => [`${formatCurrency(Number(v), currency)}`, "Variance value"];
  const moneyBar = (v: unknown) => [`${formatCurrency(Number(v), currency)}`, "Stock value"];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Overall accuracy"
          value={`${metrics.accuracy}%`}
          hint="Across all verified lines"
          icon={TrendingUp}
          tone={metrics.accuracy >= 90 ? "success" : metrics.accuracy >= 75 ? "warning" : "danger"}
        />
        <KpiCard
          label="Total variance"
          value={formatCurrency(metrics.varianceValue, currency)}
          hint="Financial impact of all lines"
          icon={AlertTriangle}
          tone={metrics.varianceValue >= 2000 ? "danger" : "warning"}
        />
        <KpiCard
          label="Missing items"
          value={`${metrics.missingItems}`}
          hint="Counted below book"
          icon={PackageX}
          tone="danger"
        />
        <KpiCard
          label="Extra items"
          value={`${metrics.extraItems}`}
          hint="Counted above book"
          icon={PackagePlus}
          tone="info"
        />
        <KpiCard
          label="Damaged lines"
          value={`${metrics.damagedItems}`}
          hint="Flagged as damaged"
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Accuracy trend</h3>
          <p className="text-xs text-muted-foreground">Count accuracy by completed audit</p>
          <ChartContainer config={{ value: { label: "Accuracy %" } }} className="mt-3 h-56 w-full">
            <ComposedChart data={accTrend} margin={{ left: 0, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(v) => [`${v}%`, "Accuracy"]} />}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ChartContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Variance trend</h3>
          <p className="text-xs text-muted-foreground">Variance value detected per day</p>
          <ChartContainer
            config={{ value: { label: "Variance value" } }}
            className="mt-3 h-56 w-full"
          >
            <AreaChart data={vTrend} margin={{ left: 0, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="varFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-critical)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-critical)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(v: number) => compact(v)}
                tickLine={false}
                axisLine={false}
                width={38}
              />
              <ChartTooltip content={<ChartTooltipContent formatter={money} />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-critical)"
                strokeWidth={2}
                fill="url(#varFill)"
              />
            </AreaChart>
          </ChartContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Variance by category</h3>
          <p className="text-xs text-muted-foreground">Where the financial impact concentrates</p>
          <ChartContainer
            config={{ value: { label: "Variance value" } }}
            className="mt-3 h-64 w-full"
          >
            <BarChart data={byCat} margin={{ left: 0, right: 8, top: 4 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v: number) => compact(v)}
                tickLine={false}
                axisLine={false}
              />
              <YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent formatter={money} />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                {byCat.map((d, i) => (
                  <Cell key={d.name} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Branch comparison</h3>
          <p className="text-xs text-muted-foreground">Accuracy % and variance value per branch</p>
          <ChartContainer
            config={{
              accuracy: { label: "Accuracy %", color: "var(--color-success)" },
              value: { label: "Variance value", color: "var(--color-critical)" },
            }}
            className="mt-3 h-64 w-full"
          >
            <ComposedChart data={byBranch} margin={{ left: 0, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} />
              <YAxis yAxisId="acc" domain={[0, 100]} tickLine={false} axisLine={false} width={32} />
              <YAxis
                yAxisId="val"
                orientation="right"
                tickFormatter={(v: number) => compact(v)}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(v, n) => [
                      `${n === "accuracy" ? `${v}%` : formatCurrency(Number(v), currency)}`,
                      n === "accuracy" ? "Accuracy" : "Variance value",
                    ]}
                  />
                }
              />
              <Bar yAxisId="acc" dataKey="accuracy" radius={[4, 4, 0, 0]} barSize={18} />
              <Line
                yAxisId="val"
                type="monotone"
                dataKey="value"
                stroke="var(--color-critical)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ChartContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">Most mismatched medicines</h3>
        <p className="text-xs text-muted-foreground">By total variance value (80/20 view)</p>
        <ChartContainer
          config={{ value: { label: "Variance value" } }}
          className="mt-3 h-72 w-full"
        >
          <BarChart data={mismatched} margin={{ left: 0, right: 8, top: 4 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v: number) => compact(v)}
              tickLine={false}
              axisLine={false}
            />
            <YAxis type="category" dataKey="name" width={150} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent formatter={money} />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
              {mismatched.map((d, i) => (
                <Cell key={d.name} fill={CAT_COLORS[i % CAT_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Monthly audit completion</h3>
          <p className="text-xs text-muted-foreground">Scheduled vs completed audits per month</p>
          <ChartContainer
            config={{
              scheduled: { label: "Scheduled", color: "var(--color-muted-foreground)" },
              completed: { label: "Completed", color: "var(--color-primary)" },
            }}
            className="mt-3 h-56 w-full"
          >
            <BarChart data={monthly} margin={{ left: 0, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} interval={0} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="scheduled" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="completed" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Completion time</h3>
          <p className="text-xs text-muted-foreground">Hours to complete each finished audit</p>
          <ChartContainer config={{ hours: { label: "Hours" } }} className="mt-3 h-56 w-full">
            <BarChart data={completion} margin={{ left: 0, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} />
              <YAxis tickLine={false} axisLine={false} width={28} />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(v) => [`${v} h`, "Duration"]} />}
              />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]} barSize={18} fill="var(--color-info)" />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Staff performance</h3>
          <p className="text-xs text-muted-foreground">Counting accuracy by staff member</p>
          <ChartContainer
            config={{ accuracy: { label: "Accuracy %" } }}
            className="mt-3 h-64 w-full"
          >
            <BarChart data={staff} margin={{ left: 0, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent formatter={(v, n) => [`${v}%`, n]} />} />
              <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} barSize={18}>
                {staff.map((d, i) => (
                  <Cell
                    key={d.name}
                    fill={
                      d.accuracy >= 90
                        ? "var(--color-success)"
                        : d.accuracy >= 75
                          ? "var(--color-warning)"
                          : "var(--color-destructive)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Shelf accuracy</h3>
          <p className="text-xs text-muted-foreground">% matched by shelf location</p>
          <ChartContainer config={{ value: { label: "Accuracy %" } }} className="mt-3 h-64 w-full">
            <BarChart data={shelves} margin={{ left: 0, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(v) => [`${v}%`, "Accuracy"]} />}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={18} fill="var(--color-success)" />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Top missing stock</h3>
          <p className="text-xs text-muted-foreground">Medicines most often counted short</p>
          <ChartContainer config={{ value: { label: "Units short" } }} className="mt-3 h-56 w-full">
            <BarChart data={missing} margin={{ left: 0, right: 8, top: 4 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={false} />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(v) => [`${v} units`, "Short"]} />}
              />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                barSize={14}
                fill="var(--color-destructive)"
              />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Top damaged stock</h3>
          <p className="text-xs text-muted-foreground">Medicines most often flagged damaged</p>
          <ChartContainer
            config={{ value: { label: "Units damaged" } }}
            className="mt-3 h-56 w-full"
          >
            <BarChart data={damaged} margin={{ left: 0, right: 8, top: 4 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={false} />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(v) => [`${v} units`, "Damaged"]} />}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14} fill="var(--color-warning)" />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
