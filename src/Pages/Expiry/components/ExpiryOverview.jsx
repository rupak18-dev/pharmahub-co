import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Sector,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  Eye,
  PackageX,
  Percent,
  Printer,
  RotateCcw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  X,
  Layers,
  ShieldAlert,
  Clock,
  Building2,
  FileCheck2,
  Flame,
  Funnel,
  RefreshCw,
  Check,
  SearchX,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
} from "@/Components/ui/chart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/Components/ui/tooltip";
import { downloadCsv } from "@/lib/csv";
import { printHtml } from "@/lib/print";
import { useDb } from "@/hooks/useDb";
import {
  computeMetrics,
  computeMonthlyExpiry,
  computeTrend,
  daysUntil,
  expiryBucket,
  getAlternatives,
  isReturnable,
  reportRows,
  rowsInWindow,
  windowLabel,
  windowSpanDays,
} from "@/lib/expiry";
const compact = (v) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `${v}`);
function RowIconAction({ label, icon: Icon, tint, onClick }) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-transparent text-muted-foreground transition-all duration-150 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 cursor-pointer",
            tint,
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="rounded-md bg-[#111827] text-white shadow-lg max-w-[220px] duration-150"
      >
        {label}
        <TooltipArrow className="fill-[#111827]" />
      </TooltipContent>
    </Tooltip>
  );
}
function rowHasAlternatives(row, batches, medicines, now) {
  const sameGeneric = getAlternatives(row.batch, batches, medicines, now);
  if (sameGeneric.length >= 4) return true;
  const currentMed = medicines.find((m) => m.id === row.batch.medicineId);
  if (!currentMed?.categoryId) return sameGeneric.length > 0;
  const existingBatchIds = new Set(sameGeneric.map((a) => a.batch.id));
  existingBatchIds.add(row.batch.id);
  const categoryMedIds = new Set(
    medicines.filter((m) => m.categoryId === currentMed.categoryId).map((m) => m.id),
  );
  const hasCatAlt = batches.some(
    (b) =>
      !existingBatchIds.has(b.id) &&
      b.status !== "disposed" &&
      b.currentStock > 0 &&
      categoryMedIds.has(b.medicineId),
  );
  return sameGeneric.length > 0 || hasCatAlt;
}
/* ============================================================================ */
/* ANALYTICS DASHBOARD — PALETTE, HELPERS & PRESENTATION COMPONENTS             */
/* ============================================================================ */
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const PALETTE = {
  recovery: "oklch(0.62 0.15 155)",
  inventory: "oklch(0.62 0.2 240)",
  warning: "oklch(0.8 0.12 90)",
  expired: "oklch(0.58 0.22 25)",
  critical: "oklch(0.66 0.19 45)",
  historical: "oklch(0.55 0.03 250)",
};
const PILL_LABELS = {
  all: "All",
  attention: "Needs Attention",
  critical: "Critical (≤3d)",
  returnable: "Return Eligible",
  today: "Today",
  week: "This Week",
  expired: "Expired (All Time)",
  safe: "Safe (>30d)",
};
const FILTER_OPTIONS = [
  { id: "attention", label: PILL_LABELS.attention },
  { id: "critical", label: PILL_LABELS.critical },
  { id: "returnable", label: PILL_LABELS.returnable },
  { id: "today", label: PILL_LABELS.today },
  { id: "week", label: PILL_LABELS.week },
  { id: "expired", label: PILL_LABELS.expired },
];
function FilterMenu({ active, counts, onApply }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(active);
  useEffect(() => {
    if (open) setDraft(active);
  }, [open, active]);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-8 shrink-0 cursor-pointer text-xs font-semibold gap-1.5 border-border/80 rounded-lg px-3"
          aria-label="Filter medicines by expiry status"
        >
          <Funnel className="h-3.5 w-3.5" />
          <span>Filter</span>
          {active.length > 0 && (
            <span className="text-primary font-bold tabular-nums">({active.length})</span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 p-1.5 text-xs" sideOffset={6}>
        <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Status Filters
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={draft.length === 0}
          onSelect={(e) => e.preventDefault()}
          onCheckedChange={(c) => {
            if (c) setDraft([]);
          }}
          className="py-2"
        >
          <span className="flex-1">All</span>
          <span className="ml-auto text-[10px] font-semibold text-muted-foreground tabular-nums">
            {counts.all}
          </span>
        </DropdownMenuCheckboxItem>
        {FILTER_OPTIONS.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.id}
            checked={draft.includes(o.id)}
            disabled={counts[o.id] === 0}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(c) =>
              setDraft((prev) => (c ? [...prev, o.id] : prev.filter((p) => p !== o.id)))
            }
            className="py-2"
          >
            <span className="flex-1">{o.label}</span>
            <span className="ml-auto text-[10px] font-semibold text-muted-foreground tabular-nums">
              {counts[o.id]}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between gap-2 p-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDraft([])}
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer rounded-md"
          >
            Clear Filters
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
            className="h-7 px-3 text-[11px] font-semibold cursor-pointer rounded-md"
          >
            Apply
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
const monthKeyOf = (iso) => iso.slice(0, 7);
const monthLabel = (key) => format(new Date(`${key}-01`), "MMM yyyy");
function ChartCard({
  title,
  subtitle,
  icon: Icon,
  tone = "bg-primary/10 text-primary",
  badge,
  active,
  children,
  footer,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card p-4 shadow-xs transition-colors",
        active ? "border-primary/60 ring-1 ring-primary/30" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", tone)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground leading-tight truncate">{title}</h3>
            <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
          </div>
        </div>
        {badge}
      </div>
      <div className="mt-3 flex-1">{children}</div>
      {footer}
    </motion.div>
  );
}
function ChartEmpty({ message }) {
  return (
    <div className="grid h-44 w-full place-items-center">
      <div className="text-center space-y-1.5">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/70" />
        <p className="text-sm font-semibold text-foreground">
          {message ?? "No expiry data available"}
        </p>
        <p className="text-xs text-muted-foreground">Try selecting another window.</p>
      </div>
    </div>
  );
}
function DeltaBadge({ value, suffix = "%", goodWhenUp }) {
  const up = value >= 0;
  const good = goodWhenUp ? up : !up;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border",
        good
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      )}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value)}
      {suffix} {up ? "this week" : "vs last week"}
    </span>
  );
}
/* ----------------------------- Rich tooltips ----------------------------- */
function RecoverableTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const change = p.change ?? 0;
  return (
    <div className="rounded-lg border border-border/60 bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-xl">
      <div className="font-bold text-foreground">{p.label}</div>
      <div className="mt-1.5 space-y-1 text-muted-foreground">
        <div className="flex items-center justify-between gap-5">
          <span>Recoverable Value</span>
          <strong className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {currency}
            {p.cumulative.toLocaleString()}
          </strong>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span>Returnable Batches</span>
          <strong className="font-mono text-foreground tabular-nums">{p.count}</strong>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span>Change from previous point</span>
          <strong
            className={cn(
              "font-mono tabular-nums",
              change >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400",
            )}
          >
            {change >= 0 ? "+" : "−"}
            {currency}
            {Math.abs(change).toLocaleString()}
          </strong>
        </div>
      </div>
    </div>
  );
}
function LossTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const status = p.isPast ? "Actual" : p.isCurrent ? "Current month" : "Forecast";
  return (
    <div className="rounded-lg border border-border/60 bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-xl min-w-[200px]">
      <div className="flex items-center justify-between gap-4">
        <span className="font-bold text-foreground">{p.month}</span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
          {status}
        </span>
      </div>
      <div className="mt-2 space-y-1.5 text-muted-foreground">
        <div className="flex items-center justify-between gap-5">
          <span className="flex items-center gap-1.5 text-foreground font-medium">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PALETTE.warning }} />
            Projected Loss
          </span>
          <strong className="font-mono text-foreground tabular-nums">
            {currency}
            {p.value.toLocaleString()}
          </strong>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span className="flex items-center gap-1.5 text-foreground font-medium">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PALETTE.recovery }} />
            Recoverable
          </span>
          <strong className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {currency}
            {p.recoverable.toLocaleString()}
          </strong>
        </div>
        <div className="flex items-center justify-between gap-5 mt-2 pt-2 border-t border-border/50">
          <span>Affected batches</span>
          <strong className="font-mono text-foreground tabular-nums">{p.count ?? 0}</strong>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span>Affected medicines</span>
          <strong className="font-mono text-foreground tabular-nums">{p.medCount ?? 0}</strong>
        </div>
      </div>
    </div>
  );
}
function priorityForPill(pill) {
  switch (pill) {
    case "expired":
      return "Critical";
    case "critical":
      return "High";
    case "attention":
      return "Medium";
    default:
      return "Low";
  }
}
function DonutTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/60 bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-xl">
      <div className="font-bold text-foreground">{s.label}</div>
      <div className="mt-1.5 space-y-1 text-muted-foreground">
        <div className="flex items-center justify-between gap-5">
          <span>Stock Value</span>
          <strong className="font-mono text-foreground tabular-nums">
            {currency}
            {s.value.toLocaleString()}
          </strong>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span>Share</span>
          <strong className="font-mono text-foreground tabular-nums">{s.pct}%</strong>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span>Medicines</span>
          <strong className="font-mono text-foreground tabular-nums">{s.count}</strong>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span>Recovery Priority</span>
          <strong
            className={cn(
              "font-semibold",
              s.pill === "expired" || s.pill === "critical"
                ? "text-rose-600 dark:text-rose-400"
                : s.pill === "attention"
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400",
            )}
          >
            {priorityForPill(s.pill)}
          </strong>
        </div>
      </div>
    </div>
  );
}
/* ------------------------- Hero chart cards ------------------------------- */
function RecoverableTrendCard({
  data,
  currency,
  headline,
  deltaPct,
  windowLabelText,
  activeMonth,
  onSelectMonth,
}) {
  const peak = useMemo(() => data.reduce((m, p) => Math.max(m, p.cumulative), 0), [data]);
  const average = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.round(data.reduce((s, p) => s + p.cumulative, 0) / data.length);
  }, [data]);
  const isEmpty = data.length === 0 || data.every((p) => p.cumulative <= 0 && p.daily <= 0);
  return (
    <ChartCard
      title="Recoverable Stock Value Over Time"
      subtitle={`Return-eligible value · ${windowLabelText}`}
      icon={RotateCcw}
      tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      active={!!activeMonth}
      badge={<DeltaBadge value={deltaPct} goodWhenUp />}
      footer={
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/50 pt-2 text-[11px]">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Current Value
            </div>
            <div className="mt-0.5 font-mono font-bold text-foreground tabular-nums">
              {currency}
              {headline.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Peak Value
            </div>
            <div className="mt-0.5 font-mono font-bold text-foreground tabular-nums">
              {currency}
              {peak.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Average Value
            </div>
            <div className="mt-0.5 font-mono font-bold text-foreground tabular-nums">
              {currency}
              {average.toLocaleString()}
            </div>
          </div>
        </div>
      }
    >
      {isEmpty ? (
        <ChartEmpty />
      ) : (
        <div className="h-48 w-full sm:h-56 lg:h-64">
          <ChartContainer
            config={{ cumulative: { label: "Recoverable", color: PALETTE.recovery } }}
            className="h-full w-full"
          >
            <AreaChart data={data} margin={{ left: 0, right: 4, top: 6 }}>
              <defs>
                <linearGradient id="recoverFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PALETTE.recovery} stopOpacity={0.28} />
                  <stop offset="55%" stopColor={PALETTE.recovery} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={PALETTE.recovery} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--color-border)"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                tickFormatter={(v) => compact(v)}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <ChartTooltip
                animationDuration={150}
                cursor={{
                  stroke: "var(--color-border)",
                  strokeDasharray: "4 4",
                  strokeWidth: 1,
                  strokeOpacity: 0.8,
                }}
                content={<RecoverableTooltip currency={currency} />}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke={PALETTE.recovery}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="url(#recoverFill)"
                animationDuration={700}
                animationEasing="ease-out"
                activeDot={(props) => {
                  const p = props.payload;
                  return (
                    <circle
                      r={5}
                      cx={props.cx}
                      cy={props.cy}
                      fill={PALETTE.recovery}
                      stroke="var(--color-card)"
                      strokeWidth={2}
                      className="cursor-pointer"
                      onClick={() => {
                        if (p?.month) onSelectMonth(p.month);
                      }}
                    />
                  );
                }}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}
    </ChartCard>
  );
}
function LossProjectionCard({ data, currency, activeMonth, onSelectMonth, topLossName }) {
  const isEmpty = data.length === 0 || data.every((m) => m.value <= 0 && m.recoverable <= 0);
  const highestRiskMonth =
    data.length > 0
      ? data.reduce((prev, current) => (prev.value > current.value ? prev : current), data[0])
      : null;
  return (
    <ChartCard
      title="Monthly projected financial loss"
      subtitle="Projected expiry loss by month"
      icon={Flame}
      tone="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      active={!!activeMonth}
      footer={
        highestRiskMonth ? (
          <div className="mt-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span>Highest risk month:</span>
              <strong className="text-foreground">{highestRiskMonth.month}</strong>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Projected loss:</span>
              <strong className="font-mono text-foreground">
                {currency}
                {highestRiskMonth.value.toLocaleString()}
              </strong>
            </div>
            {highestRiskMonth.topName || topLossName ? (
              <div className="flex items-center justify-between gap-2">
                <span>Largest affected medicine:</span>
                <strong className="truncate text-foreground max-w-[150px] text-right">
                  {highestRiskMonth.topName || topLossName}
                </strong>
              </div>
            ) : null}
          </div>
        ) : null
      }
    >
      {isEmpty ? (
        <ChartEmpty message="No financial loss projected in this period." />
      ) : (
        <div className="h-48 w-full sm:h-56 lg:h-64">
          <ChartContainer
            config={{
              value: { label: "Projected Loss", color: PALETTE.warning },
              recoverable: { label: "Recoverable", color: PALETTE.recovery },
            }}
            className="h-full w-full"
          >
            <BarChart data={data} margin={{ left: 0, right: 4, top: 10 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--color-border)"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                tickFormatter={(v) => compact(v)}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <ChartTooltip
                animationDuration={150}
                cursor={{ fill: "var(--color-muted)", fillOpacity: 0.35 }}
                content={<LossTooltip currency={currency} />}
              />
              <ChartLegend content={<ChartLegendContent />} className="pt-2" />
              <Bar
                dataKey="recoverable"
                name="Recoverable"
                fill={PALETTE.recovery}
                fillOpacity={0.9}
                radius={[4, 4, 0, 0]}
                barSize={12}
                animationDuration={700}
                animationEasing="ease-out"
                onClick={(d) => {
                  const p = d;
                  if (p?.key) onSelectMonth(p.key);
                }}
                className="cursor-pointer"
              >
                {data.map((m) => (
                  <Cell
                    key={m.key}
                    fill={PALETTE.recovery}
                    fillOpacity={
                      m.isForecast ? 0.4 : activeMonth && m.key !== activeMonth ? 0.55 : 0.9
                    }
                  />
                ))}
              </Bar>
              <Bar
                dataKey="value"
                name="Projected Loss"
                fill={PALETTE.warning}
                fillOpacity={0.9}
                radius={[4, 4, 0, 0]}
                barSize={12}
                animationDuration={700}
                animationEasing="ease-out"
                onClick={(d) => {
                  const p = d;
                  if (p?.key) onSelectMonth(p.key);
                }}
                className="cursor-pointer"
              >
                {data.map((m) => (
                  <Cell
                    key={m.key}
                    fill={PALETTE.warning}
                    fillOpacity={
                      m.isForecast ? 0.4 : activeMonth && m.key !== activeMonth ? 0.55 : 0.9
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </ChartCard>
  );
}
function DonutActiveShape({
  cx = 0,
  cy = 0,
  innerRadius = 0,
  outerRadius = 0,
  startAngle = 0,
  endAngle = 0,
  fill = "",
}) {
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={Math.max(0, innerRadius - 4)}
      outerRadius={outerRadius + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
}
function StatusDonutCard({ data, total, currency, activePill, onDrill, windowLabelText }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const isEmpty = data.length === 0 || total <= 0;
  const top = data.length ? data.reduce((a, b) => (b.value > a.value ? b : a), data[0]) : null;
  const totalCount = data.reduce((s, x) => s + x.count, 0);
  return (
    <ChartCard
      title="Expiry Status Distribution"
      subtitle={`Share of stock value · ${windowLabelText}`}
      icon={Activity}
      tone="bg-sky-500/10 text-sky-600 dark:text-sky-400"
      active={!!activePill}
      footer={
        <div className="mt-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between gap-2">
          <span className="truncate">
            {top ? `${top.label} holds the largest share (${top.pct}%)` : "No stock to distribute"}
          </span>
          <strong className="font-mono shrink-0">
            {currency}
            {total.toLocaleString()}
          </strong>
        </div>
      }
    >
      {isEmpty ? (
        <ChartEmpty message="No inventory available for the selected window." />
      ) : (
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto]">
          <div className="relative h-48 w-full sm:h-56 lg:h-64">
            <ChartContainer config={{}} className="h-full w-full">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={82}
                  paddingAngle={3}
                  strokeWidth={0}
                  animationDuration={700}
                  animationEasing="ease-out"
                  activeIndex={hoverIdx ?? undefined}
                  activeShape={DonutActiveShape}
                  onMouseEnter={(_, index) => setHoverIdx(index)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onClick={(d) => {
                    const s = d;
                    if (s?.pill) onDrill(s.pill);
                  }}
                  className="cursor-pointer outline-none"
                >
                  {data.map((s, i) => (
                    <Cell
                      key={s.key}
                      fill={s.color}
                      fillOpacity={
                        activePill
                          ? s.pill === activePill
                            ? 1
                            : 0.25
                          : hoverIdx !== null && hoverIdx !== i
                            ? 0.25
                            : 1
                      }
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  animationDuration={150}
                  content={<DonutTooltip currency={currency} />}
                />
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Stock
                </div>
                <div className="text-sm font-black font-mono text-foreground tracking-tight">
                  {currency}
                  {total.toLocaleString()}
                </div>
                <div className="mt-0.5 text-[10px] font-semibold text-muted-foreground">
                  {totalCount} medicine{totalCount === 1 ? "" : "s"}
                </div>
              </div>
            </div>
          </div>
          <div className="mx-auto w-full max-w-xs space-y-2.5 sm:mx-0 sm:w-36 sm:max-w-none">
            {data.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onDrill(s.pill)}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                onFocus={() => setHoverIdx(i)}
                onBlur={() => setHoverIdx(null)}
                aria-label={`${s.label}: ${currency}${s.value.toLocaleString()}, ${s.pct}% of stock value, ${s.count} medicines`}
                aria-pressed={activePill === s.pill}
                className={cn(
                  "flex w-full flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-center transition-colors cursor-pointer sm:items-start sm:text-left",
                  hoverIdx === i || activePill === s.pill
                    ? "bg-muted ring-1 ring-border/60"
                    : "hover:bg-muted/50",
                )}
              >
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.label}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {currency}
                  {s.value.toLocaleString()} · {s.pct}%
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  {s.count} medicine{s.count === 1 ? "" : "s"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
function RiskScoreCard({
  score,
  category,
  delta,
  counts,
  values,
  currency,
  active,
  onDrill,
  windowLabelText,
}) {
  const shouldReduceMotion = useReducedMotion();
  const [hoverKey, setHoverKey] = useState(null);
  const color = score <= 30 ? PALETTE.recovery : score <= 60 ? PALETTE.warning : PALETTE.expired;
  const circumference = 2 * Math.PI * 42;
  const severity = [
    {
      key: "critical",
      label: "Critical (≤3d)",
      color: PALETTE.critical,
      count: counts.critical,
      value: values?.critical,
    },
    {
      key: "warning",
      label: "Warning (≤7d)",
      color: PALETTE.warning,
      count: counts.warning,
      value: values?.warning,
    },
    {
      key: "notice",
      label: "Notice (≤30d)",
      color: PALETTE.inventory,
      count: counts.notice,
      value: values?.notice,
    },
  ];
  return (
    <ChartCard
      title="Inventory Risk Score"
      subtitle={`Composite risk index · ${windowLabelText}`}
      icon={ShieldAlert}
      tone="bg-rose-500/10 text-rose-600 dark:text-rose-400"
      active={active}
      badge={
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border",
            delta > 0
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          )}
        >
          {delta > 0 ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {Math.abs(delta)} pts this week
        </span>
      }
      footer={
        <button
          type="button"
          onClick={() => onDrill("attention")}
          className="mt-3 pt-2 border-t border-border/50 w-full flex items-center justify-between text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <span>Click to review needs-attention stock</span>
          <strong
            className={cn(
              "font-mono",
              color === PALETTE.expired
                ? "text-rose-600"
                : color === PALETTE.warning
                  ? "text-amber-600"
                  : "text-emerald-600",
            )}
          >
            {category}
          </strong>
        </button>
      }
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative mx-auto h-40 w-40 shrink-0 place-items-center sm:mx-0">
          <svg viewBox="0 0 100 100" className="h-40 w-40 -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--color-muted)"
              strokeOpacity="0.5"
              strokeWidth="9"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={color}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - (score / 100) * circumference }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.9, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-4xl font-black font-mono text-foreground tracking-tight">
                {score}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                / 100
              </div>
              <div
                className={cn(
                  "mt-1 text-[9px] font-bold uppercase tracking-wider",
                  color === PALETTE.expired
                    ? "text-rose-600 dark:text-rose-400"
                    : color === PALETTE.warning
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {category}
              </div>
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5 text-[11px] text-muted-foreground">
          {severity.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onDrill("attention")}
              onMouseEnter={() => setHoverKey(s.key)}
              onMouseLeave={() => setHoverKey(null)}
              onFocus={() => setHoverKey(s.key)}
              onBlur={() => setHoverKey(null)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors cursor-pointer",
                hoverKey === s.key ? "bg-muted ring-1 ring-border/60" : "hover:bg-muted/50",
              )}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </span>
              <span className="flex items-center gap-2">
                {s.value != null && (
                  <span className="font-mono tabular-nums">
                    {currency}
                    {compact(s.value)}
                  </span>
                )}
                <strong className="font-mono text-foreground tabular-nums">{s.count}</strong>
              </span>
            </button>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
/* -------------------- New BI chart cards -------------------------------- */
function CategoryTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/60 bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-xl">
      <div className="font-bold text-foreground">{p.name}</div>
      <div className="mt-1.5 space-y-1 text-muted-foreground">
        <div className="flex items-center justify-between gap-5">
          <span>Exposure</span>
          <strong className="font-mono text-foreground tabular-nums">
            {currency}
            {p.value.toLocaleString()}
          </strong>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span>Critical Batches</span>
          <strong className="font-mono text-foreground tabular-nums">{p.critical}</strong>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span>Expired Batches</span>
          <strong className="font-mono text-rose-600 dark:text-rose-400 tabular-nums">
            {p.expired}
          </strong>
        </div>
      </div>
    </div>
  );
}
function CategoryRiskCard({ data, currency, windowLabelText, onDrill }) {
  const maxBars = 8;
  const rows = useMemo(() => {
    const list = data
      .map((c) => ({
        name: c.category,
        value: c.totalValue,
        critical: c.critical,
        expired: c.expired,
        level: c.critical > 2 || c.expired > 0 ? "high" : c.critical > 0 ? "med" : "low",
      }))
      .sort((a, b) => b.value - a.value);
    return list.slice(0, maxBars);
  }, [data]);
  const hidden = data.length - rows.length;
  const top = rows[0] ?? null;
  const isEmpty = data.length === 0;
  return (
    <ChartCard
      title="Category Risk Analysis"
      subtitle={`Exposure by therapeutic category · ${windowLabelText}`}
      icon={Layers}
      tone="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      footer={
        <div className="mt-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between gap-2">
          <span className="truncate">
            {top
              ? `Highest exposure: ${top.name} (${currency}${top.value.toLocaleString()})`
              : "No category exposure to report."}
          </span>
          {hidden > 0 && <strong className="shrink-0">{hidden} more categories</strong>}
        </div>
      }
    >
      {isEmpty ? (
        <ChartEmpty message="No at-risk categories in this window." />
      ) : (
        <div className="h-48 w-full sm:h-56 lg:h-64">
          <ChartContainer
            config={{ value: { label: "Exposure", color: PALETTE.warning } }}
            className="h-full w-full"
          >
            <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 8, top: 4 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="var(--color-border)"
                strokeOpacity={0.5}
              />
              <XAxis
                type="number"
                tickFormatter={(v) => compact(v)}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={92}
                interval={0}
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
              />
              <ChartTooltip
                animationDuration={150}
                cursor={{ fill: "var(--color-muted)", fillOpacity: 0.35 }}
                content={<CategoryTooltip currency={currency} />}
              />
              <Bar
                dataKey="value"
                name="Exposure"
                radius={[0, 4, 4, 0]}
                barSize={14}
                animationDuration={700}
                animationEasing="ease-out"
                onClick={(d) => {
                  const p = d;
                  if (p?.payload?.name)
                    onDrill("attention", `Showing at-risk stock in ${p.payload.name}`);
                }}
                className="cursor-pointer"
              >
                {rows.map((r) => (
                  <Cell
                    key={r.name}
                    fill={
                      r.level === "high"
                        ? PALETTE.critical
                        : r.level === "med"
                          ? PALETTE.warning
                          : PALETTE.recovery
                    }
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </ChartCard>
  );
}
function SupplierTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/60 bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-xl">
      <div className="font-bold text-foreground">{p.name}</div>
      <div className="mt-1.5 space-y-1 text-muted-foreground">
        <div className="flex items-center justify-between gap-5">
          <span>Recoverable Value</span>
          <strong className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {currency}
            {p.value.toLocaleString()}
          </strong>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span>Returnable Batches</span>
          <strong className="font-mono text-foreground tabular-nums">{p.count}</strong>
        </div>
      </div>
    </div>
  );
}
function SupplierRecoveryCard({ data, currency, windowLabelText, onDrill }) {
  const maxBars = 8;
  const rows = useMemo(() => {
    const list = data
      .map((s) => ({ name: s.supplier, value: s.returnableValue, count: s.count }))
      .sort((a, b) => b.value - a.value);
    return list.slice(0, maxBars);
  }, [data]);
  const hidden = data.length - rows.length;
  const top2Share = useMemo(() => {
    const total = data.reduce((s, x) => s + x.returnableValue, 0);
    if (total <= 0) return 0;
    const top2 = data.slice(0, 2).reduce((s, x) => s + x.returnableValue, 0);
    return Math.round((top2 / total) * 100);
  }, [data]);
  const isEmpty = data.length === 0;
  return (
    <ChartCard
      title="Supplier Recovery Analysis"
      subtitle={`Return-eligible value per supplier · ${windowLabelText}`}
      icon={Building2}
      tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      footer={
        <div className="mt-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between gap-2">
          <span className="truncate">
            {data.length > 1
              ? `${top2Share}% of recoverable stock belongs to the top 2 suppliers.`
              : "Concentrate returns on your largest supplier for faster credit."}
          </span>
          {hidden > 0 && <strong className="shrink-0">+{hidden} more</strong>}
        </div>
      }
    >
      {isEmpty ? (
        <ChartEmpty message="No return-eligible stock from suppliers." />
      ) : (
        <div className="h-48 w-full sm:h-56 lg:h-64">
          <ChartContainer
            config={{ value: { label: "Recoverable", color: PALETTE.recovery } }}
            className="h-full w-full"
          >
            <BarChart data={rows} layout="vertical" margin={{ left: 0, right: 8, top: 4 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="var(--color-border)"
                strokeOpacity={0.5}
              />
              <XAxis
                type="number"
                tickFormatter={(v) => compact(v)}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={92}
                interval={0}
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
              />
              <ChartTooltip
                animationDuration={150}
                cursor={{ fill: "var(--color-muted)", fillOpacity: 0.35 }}
                content={<SupplierTooltip currency={currency} />}
              />
              <Bar
                dataKey="value"
                name="Recoverable"
                radius={[0, 4, 4, 0]}
                barSize={14}
                fill={PALETTE.recovery}
                fillOpacity={0.85}
                animationDuration={700}
                animationEasing="ease-out"
                onClick={(d) => {
                  const p = d;
                  if (p?.payload?.name)
                    onDrill("returnable", `Showing return-eligible stock for ${p.payload.name}`);
                }}
                className="cursor-pointer"
              />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </ChartCard>
  );
}
function RecoveryTrendTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/60 bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-xl">
      <div className="font-bold text-foreground">{p.month}</div>
      <div className="mt-1.5 space-y-1 text-muted-foreground">
        <div className="flex items-center justify-between gap-5">
          <span>Recoverable Value</span>
          <strong className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {currency}
            {p.recoverable.toLocaleString()}
          </strong>
        </div>
        <div className="flex items-center justify-between gap-5">
          <span>Returnable Batches</span>
          <strong className="font-mono text-foreground tabular-nums">
            {p.recoverableCount ?? 0}
          </strong>
        </div>
        {p.topName ? (
          <div className="flex items-center justify-between gap-5">
            <span>Top Medicine</span>
            <strong className="max-w-[180px] truncate text-right text-foreground">
              {p.topName}
            </strong>
          </div>
        ) : null}
      </div>
    </div>
  );
}
function RecoveryTrendCard({ data, currency, activeMonth, onSelectMonth, windowLabelText }) {
  const total = useMemo(() => data.reduce((s, m) => s + m.recoverable, 0), [data]);
  const peak = useMemo(() => data.reduce((m, x) => Math.max(m, x.recoverable), 0), [data]);
  const isEmpty = data.length === 0 || data.every((m) => m.recoverable <= 0);
  return (
    <ChartCard
      title="Recovery Opportunity Trend"
      subtitle={`Return-eligible value per month · ${windowLabelText}`}
      icon={RotateCcw}
      tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      active={!!activeMonth}
      footer={
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/50 pt-2 text-[11px]">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Window Total
            </div>
            <div className="mt-0.5 font-mono font-bold text-foreground tabular-nums">
              {currency}
              {total.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Peak Month
            </div>
            <div className="mt-0.5 font-mono font-bold text-foreground tabular-nums">
              {currency}
              {peak.toLocaleString()}
            </div>
          </div>
        </div>
      }
    >
      {isEmpty ? (
        <ChartEmpty />
      ) : (
        <div className="h-48 w-full sm:h-56 lg:h-64">
          <ChartContainer
            config={{ recoverable: { label: "Recoverable", color: PALETTE.recovery } }}
            className="h-full w-full"
          >
            <AreaChart data={data} margin={{ left: 0, right: 4, top: 6 }}>
              <defs>
                <linearGradient id="recoveryTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PALETTE.recovery} stopOpacity={0.28} />
                  <stop offset="55%" stopColor={PALETTE.recovery} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={PALETTE.recovery} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--color-border)"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                tickFormatter={(v) => compact(v)}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <ChartTooltip
                animationDuration={150}
                cursor={{
                  stroke: "var(--color-border)",
                  strokeDasharray: "4 4",
                  strokeWidth: 1,
                  strokeOpacity: 0.8,
                }}
                content={<RecoveryTrendTooltip currency={currency} />}
              />
              <Area
                type="monotone"
                dataKey="recoverable"
                stroke={PALETTE.recovery}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="url(#recoveryTrendFill)"
                animationDuration={700}
                animationEasing="ease-out"
                activeDot={(props) => {
                  const p = props.payload;
                  return (
                    <circle
                      r={5}
                      cx={props.cx}
                      cy={props.cy}
                      fill={PALETTE.recovery}
                      stroke="var(--color-card)"
                      strokeWidth={2}
                      className="cursor-pointer"
                      onClick={() => {
                        if (p?.key) onSelectMonth(p.key);
                      }}
                    />
                  );
                }}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      )}
    </ChartCard>
  );
}
/* -------------------- Lower analytics rows -------------------------------- */
function recommendedAction(days) {
  if (days < 0) return { label: "Dispose / Return", pill: "expired" };
  if (days <= 3) return { label: "Discount / Return", pill: "critical" };
  if (days <= 7) return { label: "Return / Transfer", pill: "week" };
  return { label: "Review & Plan", pill: "attention" };
}
function TopAtRiskCard({ top10, currency, windowLabelText, onDrill }) {
  const top3Value = useMemo(() => top10.slice(0, 3).reduce((s, r) => s + r.loss, 0), [top10]);
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
          <Flame className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Top 10 Medicines At Risk</h3>
          <p className="text-[11px] text-muted-foreground">
            Ranked by potential financial loss · {windowLabelText}
          </p>
        </div>
      </div>
      <div className="w-full overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-xs min-w-0 md:min-w-0">
          <thead className="bg-muted/70 font-semibold text-muted-foreground border-b border-border">
            <tr>
              <th className="p-2.5 whitespace-nowrap">Medicine</th>
              <th className="p-2.5 whitespace-nowrap">Expiry</th>
              <th className="p-2.5 whitespace-nowrap text-right">Loss</th>
              <th className="p-2.5 whitespace-nowrap text-right">Recommended Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 bg-card">
            {top10.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-muted-foreground">
                  No medicines at risk in this window.
                </td>
              </tr>
            ) : (
              top10.map((r) => (
                <tr
                  key={`${r.medicine}-${r.expiry}`}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => onDrill(r.pill, `Showing ${r.medicine}`)}
                >
                  <td className="p-2.5 font-semibold text-foreground">
                    <div className="line-clamp-2 max-w-[260px]">{r.medicine}</div>
                  </td>
                  <td className="p-2.5 font-mono text-muted-foreground whitespace-nowrap">
                    {r.expiry}
                  </td>
                  <td className="p-2.5 font-mono text-right text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">
                    {currency}
                    {r.loss.toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right whitespace-nowrap">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
                      {r.action}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
        {top3Value > 0
          ? `The top 3 medicines alone put ${currency}${top3Value.toLocaleString()} at risk — act this week.`
          : "Nothing critical on the horizon."}
      </div>
    </div>
  );
}
export function ExpiryOverview({
  batches,
  window,
  currency,
  supplierName,
  onShow,
  onReturnRow,
  onDiscountRow,
  onTransferRow,
  onDisposeRow,
  onViewBatchRow,
  onViewMedicineId,
  focusTableToken,
}) {
  const now = useMemo(() => Date.now(), []);
  const medicines = useDb((d) => d.medicines);
  const categories = useDb((d) => d.categories);
  const manufacturers = useDb((d) => d.manufacturers);
  const suppliers = useDb((d) => d.suppliers);
  const mfrById = useMemo(() => new Map(manufacturers.map((m) => [m.id, m.name])), [manufacturers]);
  const [mode, setMode] = useState("operations");
  const [activePills, setActivePills] = useState([]);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [alternativesRow, setAlternativesRow] = useState(null);
  // Table states: Top Medicines
  const [medSearch, setMedSearch] = useState("");
  const [medPage, setMedPage] = useState(1);
  const [medSortKey, setMedSortKey] = useState("loss");
  const [medSortDir, setMedSortDir] = useState("desc");
  const [tableScrolled, setTableScrolled] = useState(false);
  // Analytics drill-down filter state (chart-generated, composable)
  const [expiryMonth, setExpiryMonth] = useState(null);
  const [tableFlash, setTableFlash] = useState(false);
  const tableRef = useRef(null);
  // Focus the workspace table when the "Review Medicines" hero action fires
  const prevFocusToken = useRef(focusTableToken);
  useEffect(() => {
    if (focusTableToken === undefined || prevFocusToken.current === focusTableToken) return;
    prevFocusToken.current = focusTableToken;
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTableFlash(true);
    const t = globalThis.setTimeout(() => setTableFlash(false), 1600);
    return () => globalThis.clearTimeout(t);
  }, [focusTableToken]);
  // Table states: Suppliers
  const [supSearch, setSupSearch] = useState("");
  const [supPage, setSupPage] = useState(1);
  // Table states: Categories
  const [catSearch, setCatSearch] = useState("");
  const [catPage, setCatPage] = useState(1);
  // Base metrics & trends (single source of truth = selected window)
  const allRows = useMemo(
    () => reportRows(batches, medicines, categories, manufacturers, suppliers, window, now),
    [batches, medicines, categories, manufacturers, suppliers, window, now],
  );
  const windowRows = useMemo(() => rowsInWindow(allRows, window), [allRows, window]);
  const expiredRows = useMemo(() => allRows.filter((r) => r.days < 0), [allRows]);
  const windowBatches = useMemo(() => windowRows.map((r) => r.batch), [windowRows]);
  const metrics = useMemo(
    () => computeMetrics(windowBatches, window, now),
    [windowBatches, window, now],
  );
  const expiredMetrics = useMemo(
    () => ({
      count: expiredRows.length,
      value: expiredRows.reduce((s, r) => s + r.stockValue, 0),
    }),
    [expiredRows],
  );
  const filterCounts = useMemo(
    () => ({
      all: windowRows.length,
      attention: windowRows.filter((r) => r.days <= 7).length,
      critical: metrics.d3Count,
      returnable: metrics.returnEligibleCount,
      today: metrics.todayCount,
      week: windowRows.filter((r) => r.days >= 0 && r.days <= 7).length,
      expired: expiredRows.length,
      safe: allRows.filter((r) => r.days > 30).length,
    }),
    [windowRows, expiredRows, allRows, metrics],
  );
  const trend = useMemo(() => computeTrend(batches, now), [batches, now]);
  const monthlyData = useMemo(() => computeMonthlyExpiry(windowBatches, now), [windowBatches, now]);
  /* ----- Analytics derived data (presentation only, no business logic) ----- */
  const horizon = Math.max(1, Math.min(windowSpanDays(window, now), 60));
  const recoverableTrend = useMemo(() => {
    const daily = new Map();
    for (const r of windowRows) {
      if (!isReturnable(r) || r.days < 0) continue;
      const d = Math.min(r.days, horizon);
      const cur = daily.get(d) ?? { value: 0, count: 0, topName: "", topValue: 0 };
      cur.value += r.stockValue;
      cur.count += 1;
      if (r.stockValue > cur.topValue) {
        cur.topValue = r.stockValue;
        cur.topName = r.medicineName !== "—" ? r.medicineName : `Batch ${r.batchNumber}`;
      }
      daily.set(d, cur);
    }
    let running = 0;
    const points = [];
    for (let d = 0; d <= horizon; d++) {
      const v = daily.get(d) ?? { value: 0, count: 0, topName: "", topValue: 0 };
      const prev = running;
      running += v.value;
      points.push({
        day: d,
        label: format(new Date(now + d * DAY_MS), "d MMM"),
        month: format(new Date(now + d * DAY_MS), "yyyy-MM"),
        cumulative: Math.round(running),
        daily: Math.round(v.value),
        change: Math.round(running - prev),
        count: v.count,
        topName: v.topName || undefined,
        topValue: v.topValue || undefined,
      });
    }
    return points;
  }, [windowRows, horizon, now]);
  const metricsLastWeek = useMemo(
    () => computeMetrics(windowBatches, window, now - WEEK_MS),
    [windowBatches, window, now],
  );
  const recoverableDeltaPct = useMemo(() => {
    if (metricsLastWeek.returnEligibleValue <= 0) return 0;
    return Math.round(
      ((metrics.returnEligibleValue - metricsLastWeek.returnEligibleValue) /
        metricsLastWeek.returnEligibleValue) *
        100,
    );
  }, [metrics, metricsLastWeek]);
  const riskDelta = useMemo(
    () => metrics.riskScore - metricsLastWeek.riskScore,
    [metrics, metricsLastWeek],
  );
  const lossDeltaPct = useMemo(() => {
    if (metricsLastWeek.lossProjection <= 0) return 0;
    return Math.round(
      ((metrics.lossProjection - metricsLastWeek.lossProjection) / metricsLastWeek.lossProjection) *
        100,
    );
  }, [metrics, metricsLastWeek]);
  const recoverableByMonth = useMemo(() => {
    const map = new Map();
    for (const r of allRows) {
      if (!isReturnable(r)) continue;
      const key = monthKeyOf(r.expiryDate);
      const cur = map.get(key) ?? { value: 0, count: 0 };
      cur.value += r.stockValue;
      cur.count += 1;
      map.set(key, cur);
    }
    return map;
  }, [allRows]);
  const monthCount = useMemo(() => {
    const map = new Map();
    for (const r of allRows) {
      const key = monthKeyOf(r.expiryDate);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [allRows]);
  const topMedicineByMonth = useMemo(() => {
    const map = new Map();
    for (const r of allRows) {
      const key = monthKeyOf(r.expiryDate);
      const name = r.medicineName !== "—" ? r.medicineName : `Batch ${r.batchNumber}`;
      let cur = map.get(key);
      if (!cur) {
        cur = { name, topVal: r.stockValue, meds: new Set() };
        map.set(key, cur);
      }
      cur.meds.add(name);
      if (r.stockValue > cur.topVal) {
        cur.name = name;
        cur.topVal = r.stockValue;
      }
    }
    return map;
  }, [allRows]);
  const lossRecoveryCombo = useMemo(() => {
    const base = monthlyData.map((m) => {
      const t = topMedicineByMonth.get(m.key);
      return {
        ...m,
        recoverable: Math.round(recoverableByMonth.get(m.key)?.value ?? 0),
        recoverableCount: recoverableByMonth.get(m.key)?.count ?? 0,
        count: monthCount.get(m.key) ?? 0,
        isForecast: !m.isPast && !m.isCurrent,
        diff: 0,
        topName: t?.name,
        medCount: t?.meds.size ?? 0,
      };
    });
    for (let i = 1; i < base.length; i++) {
      base[i].diff = base[i].value - base[i - 1].value;
    }
    return base;
  }, [monthlyData, recoverableByMonth, monthCount, topMedicineByMonth]);
  const donutData = useMemo(() => {
    const buckets = [
      {
        key: "expired",
        label: "Expired",
        pill: "expired",
        color: PALETTE.expired,
        test: (d) => d < 0,
      },
      {
        key: "critical",
        label: "Critical",
        pill: "critical",
        color: PALETTE.critical,
        test: (d) => d > 0 && d <= 3,
      },
      {
        key: "warning",
        label: "Warning",
        pill: "attention",
        color: PALETTE.warning,
        test: (d) => d > 3 && d <= 30,
      },
      {
        key: "safe",
        label: "Safe",
        pill: "safe",
        color: PALETTE.recovery,
        test: (d) => d > 30,
      },
    ];
    const slices = buckets.map((b) => {
      const rows = allRows.filter((r) => b.test(r.days));
      return {
        key: b.key,
        label: b.label,
        pill: b.pill,
        color: b.color,
        value: Math.round(rows.reduce((s, r) => s + r.stockValue, 0)),
        count: rows.length,
        pct: 0,
      };
    });
    const total = slices.reduce((s, x) => s + x.value, 0);
    slices.forEach((s) => (s.pct = total > 0 ? Math.round((s.value / total) * 100) : 0));
    return slices;
  }, [allRows]);
  const donutTotal = useMemo(() => donutData.reduce((s, x) => s + x.value, 0), [donutData]);
  const topAtRisk = useMemo(
    () =>
      [...allRows]
        .sort((a, b) => {
          const la = a.days < 0 ? a.stockValue : a.stockValue * 0.35;
          const lb = b.days < 0 ? b.stockValue : b.stockValue * 0.35;
          return lb - la;
        })
        .slice(0, 10)
        .map((r) => {
          const act = recommendedAction(r.days);
          return {
            medicine: r.medicineName !== "—" ? r.medicineName : `Batch ${r.batchNumber}`,
            expiry: r.expiryDate,
            loss: Math.round(r.days < 0 ? r.stockValue : r.stockValue * 0.35),
            action: act.label,
            pill: act.pill,
          };
        }),
    [allRows],
  );
  const applyAnalyticsFilter = useCallback((opts) => {
    if (opts.month !== undefined) {
      const nextMonth = opts.month ?? null;
      setExpiryMonth((m) => (m === nextMonth ? null : nextMonth));
    }
    if (opts.pill) {
      const pill = opts.pill;
      setActivePills((prev) => (prev.length === 1 && prev[0] === pill ? [] : [pill]));
    }
    setMedPage(1);
    if (opts.message) toast.info(opts.message);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTableFlash(true);
    globalThis.setTimeout(() => setTableFlash(false), 1600);
  }, []);
  const onSelectMonth = useCallback(
    (month) => applyAnalyticsFilter({ month }),
    [applyAnalyticsFilter],
  );
  const onDrill = useCallback(
    (pill, message) => applyAnalyticsFilter({ pill, message }),
    [applyAnalyticsFilter],
  );
  const clearAnalyticsFilters = () => {
    setExpiryMonth(null);
    setActivePills([]);
  };
  // Calculate intelligent in-stock alternatives for expired medicine
  const alternativesList = useMemo(() => {
    if (!alternativesRow) return [];
    const sameGeneric = getAlternatives(alternativesRow.batch, batches, medicines, now);
    const currentMed = medicines.find((m) => m.id === alternativesRow.batch.medicineId);
    let combined = [...sameGeneric];
    // If sameGeneric has fewer than 4 items, find category-level therapeutic alternatives
    if (combined.length < 4 && currentMed?.categoryId) {
      const existingBatchIds = new Set(sameGeneric.map((a) => a.batch.id));
      existingBatchIds.add(alternativesRow.batch.id);
      const categoryMedIds = new Set(
        medicines.filter((m) => m.categoryId === currentMed.categoryId).map((m) => m.id),
      );
      const catBatches = batches.filter(
        (b) =>
          !existingBatchIds.has(b.id) &&
          b.status !== "disposed" &&
          b.currentStock > 0 &&
          categoryMedIds.has(b.medicineId),
      );
      const medById = new Map(medicines.map((m) => [m.id, m]));
      const catAlts = catBatches.map((b) => {
        const om = medById.get(b.medicineId);
        const d = daysUntil(b.expiryDate, now);
        return {
          batch: b,
          medicine: om,
          days: d,
          bucket: expiryBucket(d),
          sameStrength: false,
          isTherapeutic: true,
        };
      });
      combined = [...combined, ...catAlts];
    }
    return combined.map((alt) => {
      let matchBadge = "Same Generic";
      let badgeStyle = "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
      if (alt.sameStrength) {
        matchBadge = "Best Match";
        badgeStyle =
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      } else if (
        alt.medicine?.strength &&
        currentMed?.strength &&
        alt.medicine.strength !== currentMed.strength
      ) {
        matchBadge = "Different Strength";
        badgeStyle = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      } else if (alt.isTherapeutic) {
        matchBadge = "Therapeutic Alternative";
        badgeStyle = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      }
      return {
        ...alt,
        matchBadge,
        badgeStyle,
      };
    });
  }, [alternativesRow, batches, medicines, now]);
  // Filtered rows based on pill filter (window is the base scope; expired is All Time)
  const filteredByPillRows = useMemo(() => {
    const base = (() => {
      if (activePills.length === 0) return windowRows;
      const result = [];
      const push = (rows) => {
        for (const r of rows) {
          if (!result.some((x) => x.batch.id === r.batch.id)) result.push(r);
        }
      };
      for (const p of activePills) {
        switch (p) {
          case "attention":
            push(windowRows.filter((r) => r.days <= 7));
            break;
          case "critical":
            push(windowRows.filter((r) => r.days > 0 && r.days <= 3));
            break;
          case "returnable":
            push(windowRows.filter((r) => isReturnable(r)));
            break;
          case "today":
            push(windowRows.filter((r) => r.days === 0));
            break;
          case "week":
            push(windowRows.filter((r) => r.days >= 0 && r.days <= 7));
            break;
          case "safe":
            push(allRows.filter((r) => r.days > 30));
            break;
          case "expired":
            push(expiredRows);
            break;
          default:
            break;
        }
      }
      return result;
    })();
    if (expiryMonth) {
      return base.filter((r) => monthKeyOf(r.expiryDate) === expiryMonth);
    }
    return base;
  }, [windowRows, expiredRows, allRows, activePills, expiryMonth]);
  // Top Medicines Table Processing
  const processedMedicines = useMemo(() => {
    let list = filteredByPillRows;
    if (medSearch.trim()) {
      const q = medSearch.toLowerCase();
      list = list.filter(
        (r) =>
          r.medicineName.toLowerCase().includes(q) ||
          r.batchNumber.toLowerCase().includes(q) ||
          r.salt.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      let av = 0;
      let bv = 0;
      if (medSortKey === "name")
        return medSortDir === "asc"
          ? a.medicineName.localeCompare(b.medicineName)
          : b.medicineName.localeCompare(a.medicineName);
      if (medSortKey === "days") {
        av = a.days;
        bv = b.days;
      } else {
        av = a.days < 0 ? a.stockValue : a.stockValue * 0.35;
        bv = b.days < 0 ? b.stockValue : b.stockValue * 0.35;
      }
      return medSortDir === "asc" ? av - bv : bv - av;
    });
  }, [filteredByPillRows, medSearch, medSortKey, medSortDir]);
  const pageSize = 6;
  const pagedMedicines = useMemo(() => {
    const start = (medPage - 1) * pageSize;
    return processedMedicines.slice(start, start + pageSize);
  }, [processedMedicines, medPage]);
  const totalMedPages = Math.max(1, Math.ceil(processedMedicines.length / pageSize));
  // Checkbox multi-select logic
  const isAllCurrentPageSelected = useMemo(() => {
    if (pagedMedicines.length === 0) return false;
    return pagedMedicines.every((r) => selectedRowIds.has(r.batch.id));
  }, [pagedMedicines, selectedRowIds]);
  const toggleSelectAllPage = () => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (isAllCurrentPageSelected) {
        pagedMedicines.forEach((r) => next.delete(r.batch.id));
      } else {
        pagedMedicines.forEach((r) => next.add(r.batch.id));
      }
      return next;
    });
  };
  const toggleSelectRow = (id) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  // Selected rows data
  const selectedRowsList = useMemo(() => {
    return allRows.filter((r) => selectedRowIds.has(r.batch.id));
  }, [allRows, selectedRowIds]);
  // Supplier Summary Aggregation
  const supplierAggregates = useMemo(() => {
    const map = new Map();
    for (const r of filteredByPillRows) {
      const name = r.supplier || supplierName(r.batch.supplierId) || "Unknown Supplier";
      const cur = map.get(name) ?? {
        supplier: name,
        count: 0,
        stockValue: 0,
        returnableValue: 0,
      };
      cur.count += 1;
      cur.stockValue += r.stockValue;
      if (isReturnable(r)) {
        cur.returnableValue += r.stockValue;
      }
      map.set(name, cur);
    }
    let list = Array.from(map.values());
    if (supSearch.trim()) {
      const q = supSearch.toLowerCase();
      list = list.filter((s) => s.supplier.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.returnableValue - a.returnableValue);
  }, [filteredByPillRows, supSearch, supplierName]);
  const pagedSuppliers = useMemo(() => {
    const start = (supPage - 1) * 4;
    return supplierAggregates.slice(start, start + 4);
  }, [supplierAggregates, supPage]);
  const totalSupPages = Math.max(1, Math.ceil(supplierAggregates.length / 4));
  // Category Breakdown Aggregation
  const categoryAggregates = useMemo(() => {
    const map = new Map();
    for (const r of filteredByPillRows) {
      const cat = r.category || "General";
      const cur = map.get(cat) ?? {
        category: cat,
        critical: 0,
        upcoming: 0,
        expired: 0,
        totalValue: 0,
      };
      cur.totalValue += r.stockValue;
      if (r.days < 0) cur.expired += 1;
      else if (r.days <= 3) cur.critical += 1;
      else if (r.days <= 30) cur.upcoming += 1;
      map.set(cat, cur);
    }
    let list = Array.from(map.values());
    if (catSearch.trim()) {
      const q = catSearch.toLowerCase();
      list = list.filter((c) => c.category.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.totalValue - a.totalValue);
  }, [filteredByPillRows, catSearch]);
  const pagedCategories = useMemo(() => {
    const start = (catPage - 1) * 4;
    return categoryAggregates.slice(start, start + 4);
  }, [categoryAggregates, catPage]);
  const totalCatPages = Math.max(1, Math.ceil(categoryAggregates.length / 4));
  // Analytics view aggregates (respect drill filters via filteredByPillRows)
  const supplierAnalytics = useMemo(
    () =>
      supplierAggregates.map((s) => ({
        supplier: s.supplier,
        count: s.count,
        returnableValue: s.returnableValue,
      })),
    [supplierAggregates],
  );
  const categoryAnalytics = useMemo(
    () =>
      categoryAggregates.map((c) => ({
        category: c.category,
        critical: c.critical,
        expired: c.expired,
        totalValue: c.totalValue,
      })),
    [categoryAggregates],
  );
  // Top contributor item name
  const topLossMedicine = useMemo(() => {
    if (allRows.length === 0) return "N/A";
    const sorted = [...allRows].sort((a, b) => b.stockValue - a.stockValue);
    return sorted[0]?.medicineName || "N/A";
  }, [allRows]);
  // Export handlers
  const exportMedicinesCsv = (customRows) => {
    const listToExport = customRows || processedMedicines;
    const rows = listToExport.map((m) => ({
      Medicine: m.medicineName,
      Batch: m.batchNumber,
      Supplier: m.supplier,
      ExpiryDate: m.expiryDate,
      DaysLeft: m.days,
      StockValue: m.stockValue,
      PotentialLoss: Math.round(m.days < 0 ? m.stockValue : m.stockValue * 0.35),
    }));
    downloadCsv("medicine_expiry_report.csv", rows);
    toast.success(`Exported ${listToExport.length} medicines to CSV`);
  };
  const copyMedicinesToClipboard = () => {
    const text = processedMedicines
      .map(
        (m) =>
          `${m.medicineName} | Batch ${m.batchNumber} | Days: ${m.days} | Value: ₹${m.stockValue}`,
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied medicines list to clipboard");
  };
  const printMedicinesTable = () => {
    const html = `
      <h2 style="font-family:sans-serif;margin-bottom:12px;">Medicine Expiry Operational Workspace</h2>
      <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:12px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th>Medicine</th>
            <th>Batch</th>
            <th>Supplier</th>
            <th>Expiry</th>
            <th>Days Left</th>
            <th>Stock Value (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${processedMedicines
            .map(
              (m) => `<tr>
                  <td><strong>${m.medicineName}</strong></td>
                  <td>${m.batchNumber}</td>
                  <td>${m.supplier}</td>
                  <td>${m.expiryDate}</td>
                  <td>${m.days < 0 ? `Expired (${Math.abs(m.days)}d ago)` : `${m.days} days`}</td>
                  <td>₹${m.stockValue.toLocaleString()}</td>
                </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    `;
    printHtml(html);
  };
  const toggleSort = (key) => {
    if (medSortKey === key) {
      setMedSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setMedSortKey(key);
      setMedSortDir("desc");
    }
  };
  return (
    <div
      className={cn(
        "space-y-4 text-foreground selection:bg-primary/20",
        selectedRowIds.size > 0 && "pb-28 md:pb-0",
      )}
    >
      {/* ========================================================================= */}
      {/* 1. OPERATIONS ⇄ ANALYTICS SEGMENTED CONTROL                              */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-3 border-b border-border/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-border bg-muted/50 p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setMode("operations")}
              className={cn(
                "relative rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                mode === "operations"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Operations
            </button>
            <button
              type="button"
              onClick={() => setMode("insights")}
              className={cn(
                "relative rounded-lg px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                mode === "insights"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Analytics
            </button>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {mode === "operations"
              ? "Operational KPI metrics & decision shortcuts"
              : "Financial trends & decision-supporting charts"}
          </span>
        </div>

        <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Active Window:</span>
          <strong className="text-foreground font-semibold">{windowLabel(window)}</strong>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DASHBOARD SUMMARY CARDS (OPERATIONS vs ANALYTICS TRANSITION)           */}
      {/* ========================================================================= */}
      <AnimatePresence mode="wait">
        {mode === "operations" ? (
          <motion.div
            key="operations-kpis"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {/* KPI 1: Recoverable Value */}
            <div className="group rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Recoverable Value</span>
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <RotateCcw className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                  {currency}
                  {metrics.returnEligibleValue.toLocaleString()}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{metrics.returnEligibleCount} batches returnable</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground truncate">
                  Credit note eligible · {windowLabel(window)}
                </span>
                <button
                  type="button"
                  onClick={() => setActivePills(["returnable"])}
                  className="font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
                >
                  View Details →
                </button>
              </div>
            </div>

            {/* KPI 2: Potential Loss */}
            <div className="group rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-amber-500/40 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Potential Loss</span>
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <TrendingDown className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black font-mono tracking-tight text-foreground">
                  {currency}
                  {metrics.lossProjection.toLocaleString()}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>↑ 12% vs last week</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground truncate">
                  Top: {topLossMedicine} · {windowLabel(window)}
                </span>
                <button
                  type="button"
                  onClick={() => setActivePills(["attention"])}
                  className="font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
                >
                  View Details →
                </button>
              </div>
            </div>

            {/* KPI 3: Expired Stock (All Time) */}
            <div className="group rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-rose-500/40 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Current Expired Stock</span>
                  <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <PackageX className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black font-mono tracking-tight text-rose-600 dark:text-rose-400">
                  {currency}
                  {expiredMetrics.value.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-muted-foreground font-medium">
                  {expiredMetrics.count} expired batches (All Time)
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">All-Time Disposal Queue</span>
                <button
                  type="button"
                  onClick={() => setActivePills(["expired"])}
                  className="font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
                >
                  View Details →
                </button>
              </div>
            </div>

            {/* KPI 4: Stock At Risk */}
            <div className="group rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-sky-500/40 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Stock At Risk</span>
                  <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black font-mono tracking-tight text-foreground">
                  {currency}
                  {metrics.nearValue.toLocaleString()}
                </div>
                <div className="mt-1 text-xs text-muted-foreground font-medium">
                  {metrics.nearCount} batches · {windowLabel(window)}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">
                  Risk Index: {metrics.riskScore}/100 · {windowLabel(window)}
                </span>
                <button
                  type="button"
                  onClick={() => setActivePills(["critical"])}
                  className="font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
                >
                  View Details →
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="analytics-cards"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="grid gap-4 lg:grid-cols-2"
          >
            <div className="lg:col-span-2">
              <RecoverableTrendCard
                data={recoverableTrend}
                currency={currency}
                headline={metrics.returnEligibleValue}
                deltaPct={recoverableDeltaPct}
                windowLabelText={windowLabel(window)}
                activeMonth={expiryMonth}
                onSelectMonth={onSelectMonth}
              />
            </div>

            <LossProjectionCard
              data={lossRecoveryCombo}
              currency={currency}
              headline={metrics.lossProjection}
              deltaPct={lossDeltaPct}
              topLossName={topLossMedicine}
              activeMonth={expiryMonth}
              onSelectMonth={onSelectMonth}
            />

            <StatusDonutCard
              data={donutData}
              total={donutTotal}
              currency={currency}
              activePill={activePills.length === 1 ? activePills[0] : null}
              onDrill={onDrill}
              windowLabelText={windowLabel(window)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. PRIORITY ACTIONS (OPERATIONAL SHORTCUTS ONLY - NO DUPLICATE METRICS)    */}
      {/* ========================================================================= */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Recover Stock */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-xs flex items-center justify-between transition-all hover:border-emerald-500/50">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Recover Stock
            </div>
            <div className="text-sm font-bold text-foreground mt-1">
              {metrics.returnEligibleCount} returnable batches
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-0.5">
              Supplier credit note available · {windowLabel(window)}
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setActivePills(["returnable"]);
              toast.success("Loaded returnable inventory workflow");
            }}
            className="h-8 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs cursor-pointer rounded-lg px-3"
          >
            Start Return
          </Button>
        </div>

        {/* Card 2: Dispose Expired */}
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 shadow-xs flex items-center justify-between transition-all hover:border-rose-500/50">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Dispose Expired
            </div>
            <div className="text-sm font-bold text-foreground mt-1">
              {expiredMetrics.count} expired batches
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-0.5">
              All-Time Disposal Queue
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setActivePills(["expired"]);
              toast.info("Showing expired batches for write-off disposal");
            }}
            className="h-8 text-xs font-bold border-rose-500/40 bg-card text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 shadow-xs cursor-pointer rounded-lg px-3"
          >
            Dispose
          </Button>
        </div>

        {/* Card 3: Review High Risk */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-xs flex items-center justify-between transition-all hover:border-amber-500/50">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Review High Risk
            </div>
            <div className="text-sm font-bold text-foreground mt-1">
              {metrics.d3Count} critical batches
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-0.5">
              Expires within 3 days · {windowLabel(window)}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setActivePills(["critical"]);
              toast.info("Showing high risk critical batches");
            }}
            className="h-8 text-xs font-bold border-amber-500/40 bg-card text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shadow-xs cursor-pointer rounded-lg px-3"
          >
            Review
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN WORKSPACE: MEDICINE TABLE (FULL WIDTH)                           */}
      {/* ========================================================================= */}
      <div className="w-full">
        {/* Medicine Workspace Table (Hero Component - Full width) */}
        <div
          ref={tableRef}
          className={cn(
            "w-full rounded-2xl border bg-card p-4 shadow-xs space-y-3.5",
            tableFlash ? "border-primary/60 ring-2 ring-primary/30" : "border-border",
          )}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-foreground tracking-tight">
                    Medicine Operational Workspace
                  </h3>
                  <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
                    Primary Flow
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Showing {processedMedicines.length} medicines requiring action
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Window: {windowLabel(window)}
                  {activePills.includes("expired") ? " · Expired – All Time" : ""}
                </p>
              </div>
            </div>

            <div className="flex w-full flex-row items-center gap-2 lg:w-auto">
              <div className="hidden lg:block">
                <FilterMenu active={activePills} counts={filterCounts} onApply={setActivePills} />
              </div>
              <div className="relative flex-1 lg:w-56 lg:flex-none">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={medSearch}
                  onChange={(e) => {
                    setMedSearch(e.target.value);
                    setMedPage(1);
                  }}
                  className="h-8 min-h-[44px] pl-8 text-xs bg-background rounded-lg border-border sm:min-h-[36px]"
                />
              </div>

              <div className="flex items-center gap-2 lg:hidden">
                <FilterMenu active={activePills} counts={filterCounts} onApply={setActivePills} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label="More actions"
                      className="h-8 w-8 cursor-pointer rounded-lg p-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={copyMedicinesToClipboard}>
                      <Copy className="h-3.5 w-3.5 mr-2" /> Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={printMedicinesTable}>
                      <Printer className="h-3.5 w-3.5 mr-2" /> Print
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportMedicinesCsv()}>
                      <Download className="h-3.5 w-3.5 mr-2" /> CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={copyMedicinesToClipboard}
                className="hidden h-8 cursor-pointer rounded-lg px-2.5 text-xs xl:inline-flex"
              >
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={printMedicinesTable}
                className="hidden h-8 cursor-pointer rounded-lg px-2.5 text-xs xl:inline-flex"
              >
                <Printer className="h-3 w-3 mr-1" /> Print
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportMedicinesCsv()}
                className="hidden h-8 cursor-pointer rounded-lg px-2.5 text-xs xl:inline-flex"
              >
                <Download className="h-3 w-3 mr-1" /> CSV
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="hidden h-8 cursor-pointer rounded-lg px-2.5 text-xs md:inline-flex xl:hidden"
                  >
                    <Download className="h-3 w-3 mr-1" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={copyMedicinesToClipboard}>
                    <Copy className="h-3.5 w-3.5 mr-2" /> Copy
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={printMedicinesTable}>
                    <Printer className="h-3.5 w-3.5 mr-2" /> Print
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportMedicinesCsv()}>
                    <Download className="h-3.5 w-3.5 mr-2" /> CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Active filter chips (funnel + chart drill-down) */}
          {(expiryMonth || activePills.length > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Active Filters
              </span>
              {activePills.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setActivePills((prev) => prev.filter((x) => x !== p))}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary cursor-pointer hover:bg-primary/20"
                >
                  {PILL_LABELS[p]}
                  <X className="h-3 w-3" />
                </button>
              ))}
              {expiryMonth && (
                <button
                  type="button"
                  onClick={() => setExpiryMonth(null)}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary cursor-pointer hover:bg-primary/20"
                >
                  {monthLabel(expiryMonth)}
                  <X className="h-3 w-3" />
                </button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={clearAnalyticsFilters}
                className="h-6 text-[11px] text-muted-foreground hover:text-foreground px-2 cursor-pointer rounded-full"
              >
                <X className="h-3 w-3 mr-1" /> Clear All
              </Button>
            </div>
          )}

          {/* Primary Table with Enterprise SaaS Aesthetics */}
          <div className="hidden md:block">
            <div
              onScroll={(e) => setTableScrolled(e.currentTarget.scrollTop > 0)}
              className="overflow-x-auto rounded-xl border border-border"
            >
              <table className="w-full text-left text-xs">
                <thead
                  className={cn(
                    "bg-card/85 backdrop-blur-md text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border sticky top-0 z-10 transition-shadow",
                    tableScrolled && "shadow-sm",
                  )}
                >
                  <tr>
                    <th className="px-2 py-2.5 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={isAllCurrentPageSelected}
                        onChange={toggleSelectAllPage}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </th>
                    <th className="px-2 py-2.5 w-7"></th>
                    <th className="px-4 py-2.5 min-w-[200px] sticky left-0 z-20 bg-card">
                      <button
                        type="button"
                        onClick={() => toggleSort("name")}
                        className="group inline-flex items-center gap-1 font-semibold hover:text-foreground cursor-pointer"
                      >
                        Medicine & Metadata{" "}
                        <ArrowUpDown className="h-3 w-3 opacity-40 transition-opacity group-hover:opacity-100" />
                      </button>
                    </th>
                    <th className="px-4 py-2.5 w-[150px]">
                      <button
                        type="button"
                        onClick={() => toggleSort("days")}
                        className="group inline-flex items-center gap-1 font-semibold hover:text-foreground cursor-pointer"
                      >
                        Status / Expiry{" "}
                        <ArrowUpDown className="h-3 w-3 opacity-40 transition-opacity group-hover:opacity-100" />
                      </button>
                    </th>
                    <th className="px-4 py-2.5 w-[170px] text-right">
                      <button
                        type="button"
                        onClick={() => toggleSort("loss")}
                        className="group inline-flex items-center justify-end gap-1 font-semibold hover:text-foreground cursor-pointer"
                      >
                        Stock Value{" "}
                        <ArrowUpDown className="h-3 w-3 opacity-40 transition-opacity group-hover:opacity-100" />
                      </button>
                    </th>
                    <th className="px-4 py-2.5 text-center font-semibold min-w-[200px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card">
                  {pagedMedicines.length > 0 ? (
                    pagedMedicines.map((row) => {
                      const purchaseValue = Math.round(row.stockValue);
                      const sellingValue = Math.round(row.quantity * row.batch.sellingPrice);
                      const marginValue = sellingValue - purchaseValue;
                      const isExpanded = expandedRowId === row.batch.id;
                      const isSelected = selectedRowIds.has(row.batch.id);
                      // Semantic Status Categories
                      const isCritical = row.days <= 3;
                      const isWarning = row.days > 3 && row.days <= 7;
                      const showReturn = isReturnable(row) && row.days <= 7;
                      return (
                        <Fragment key={row.batch.id}>
                          <tr
                            className={cn(
                              "group h-[68px] transition-colors",
                              isCritical &&
                                "bg-rose-500/[0.05] hover:bg-rose-500/[0.08] dark:bg-rose-950/15",
                              isWarning &&
                                "bg-amber-500/[0.05] hover:bg-amber-500/[0.08] dark:bg-amber-950/15",
                              !isCritical && !isWarning && "hover:bg-muted/30",
                              isSelected && "bg-primary/[0.04]",
                            )}
                          >
                            <td className="relative px-2 py-2.5 text-center align-middle">
                              {isCritical ? (
                                <span
                                  aria-hidden
                                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full bg-rose-400/70 opacity-70 transition-opacity group-hover:opacity-100"
                                />
                              ) : isWarning ? (
                                <span
                                  aria-hidden
                                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full bg-amber-400/70 opacity-70 transition-opacity group-hover:opacity-100"
                                />
                              ) : (
                                <span
                                  aria-hidden
                                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full bg-emerald-400/70 opacity-70 transition-opacity group-hover:opacity-100"
                                />
                              )}
                              <label className="flex h-8 w-8 cursor-pointer items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectRow(row.batch.id)}
                                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                />
                              </label>
                            </td>
                            <td className="px-2 py-2.5 text-center align-middle">
                              <button
                                type="button"
                                aria-label={isExpanded ? "Collapse details" : "Expand details"}
                                onClick={() => setExpandedRowId(isExpanded ? null : row.batch.id)}
                                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </td>
                            {/* Primary Medicine Element with Secondary Metadata */}
                            <td className="px-4 py-2.5 align-middle sticky left-0 z-[5] bg-inherit shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                              <div className="font-semibold text-sm text-foreground hover:text-primary transition-colors tracking-tight cursor-pointer">
                                {row.medicineName !== "—"
                                  ? row.medicineName
                                  : `Batch ${row.batchNumber}`}
                              </div>
                              <div className="hidden items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-mono xl:flex">
                                <span>Batch {row.batchNumber}</span>
                                <span>•</span>
                                <span>Shelf {row.shelf || "Unassigned"}</span>
                              </div>
                            </td>

                            {/* Semantic Status Pills (Critical, Warning, Safe) */}
                            <td className="px-4 py-2.5 align-middle">
                              {isCritical ? (
                                <span
                                  title={`Expires ${row.expiryDate}`}
                                  className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-[2px] text-[10px] font-semibold whitespace-nowrap"
                                >
                                  <span className="h-1 w-1 rounded-full bg-rose-500 animate-pulse" />
                                  {row.days < 0
                                    ? `Expired • ${Math.abs(row.days)}d ago`
                                    : row.days === 0
                                      ? "Expires Today"
                                      : `Critical • ${row.days}d`}
                                </span>
                              ) : isWarning ? (
                                <span
                                  title={`Expires ${row.expiryDate}`}
                                  className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-[2px] text-[10px] font-semibold whitespace-nowrap"
                                >
                                  <span className="h-1 w-1 rounded-full bg-amber-500" />
                                  Warning • {row.days}d
                                </span>
                              ) : (
                                <span
                                  title={`Expires ${row.expiryDate}`}
                                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-[2px] text-[10px] font-semibold whitespace-nowrap"
                                >
                                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                  Safe • {row.days}d
                                </span>
                              )}
                            </td>

                            {/* Monetary Prioritization */}
                            <td className="px-4 py-2.5 text-right align-middle font-mono">
                              <div className="flex flex-col items-end gap-[3px] leading-tight">
                                <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                                  <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Purchase Value
                                  </span>
                                  <span className="text-xs font-bold text-foreground tabular-nums">
                                    {currency}
                                    {purchaseValue.toLocaleString()}
                                  </span>
                                </div>
                                <div className="hidden items-baseline gap-1.5 whitespace-nowrap xl:flex">
                                  <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Selling Value
                                  </span>
                                  <span className="text-xs font-semibold text-foreground tabular-nums">
                                    {currency}
                                    {sellingValue.toLocaleString()}
                                  </span>
                                </div>
                                <div className="hidden items-baseline gap-1.5 whitespace-nowrap xl:flex">
                                  <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Margin
                                  </span>
                                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                    {currency}
                                    {marginValue.toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                                  {row.quantity.toLocaleString()} Units
                                </div>
                              </div>
                            </td>

                            {/* Compact Icon-Only Actions with Tooltips */}
                            <td className="px-4 py-2.5 text-center align-middle">
                              <TooltipProvider delayDuration={150}>
                                <div className="flex items-center justify-center gap-2 opacity-80 transition-opacity group-hover:opacity-100">
                                  {showReturn && onReturnRow && (
                                    <RowIconAction
                                      label="Return Stock"
                                      icon={RotateCcw}
                                      tint="hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400 focus-visible:ring-emerald-500/40"
                                      onClick={() => onReturnRow(row)}
                                    />
                                  )}
                                  {row.days <= 0 ? (
                                    <RowIconAction
                                      label={
                                        rowHasAlternatives(row, batches, medicines, now)
                                          ? "View Alternatives"
                                          : "No alternatives available"
                                      }
                                      icon={RefreshCw}
                                      tint="hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-indigo-500/40"
                                      onClick={() => setAlternativesRow(row)}
                                    />
                                  ) : (
                                    onTransferRow && (
                                      <RowIconAction
                                        label="Transfer Stock"
                                        icon={Truck}
                                        tint="hover:bg-sky-500/15 hover:text-sky-600 dark:hover:text-sky-400 focus-visible:ring-sky-500/40"
                                        onClick={() => onTransferRow(row)}
                                      />
                                    )
                                  )}
                                  {onDiscountRow && row.days > 0 && (
                                    <RowIconAction
                                      label="Apply Discount"
                                      icon={Percent}
                                      tint="hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400 focus-visible:ring-amber-500/40"
                                      onClick={() => onDiscountRow(row)}
                                    />
                                  )}
                                  {onDisposeRow && row.days <= 0 && (
                                    <RowIconAction
                                      label="Dispose Batch"
                                      icon={Trash2}
                                      tint="hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 focus-visible:ring-rose-500/40"
                                      onClick={() => onDisposeRow(row)}
                                    />
                                  )}
                                  {onViewBatchRow && (
                                    <RowIconAction
                                      label="View Batch Details"
                                      icon={Eye}
                                      tint="hover:bg-muted hover:text-foreground focus-visible:ring-ring/40"
                                      onClick={() => onViewBatchRow(row)}
                                    />
                                  )}
                                </div>
                              </TooltipProvider>
                            </td>
                          </tr>

                          {/* Inline Row Expansion Drawer */}
                          {isExpanded && (
                            <tr className="bg-muted/40 text-xs border-b border-border/80">
                              <td colSpan={6} className="p-4">
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-muted-foreground"
                                >
                                  <div>
                                    <span className="font-bold text-foreground block text-[11px]">
                                      Generic Composition
                                    </span>
                                    <span>{row.salt || "N/A"}</span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-foreground block text-[11px]">
                                      Supplier Name
                                    </span>
                                    <span>{row.supplier}</span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-foreground block text-[11px]">
                                      Unit Purchase Cost
                                    </span>
                                    <span className="font-mono">
                                      {currency}
                                      {row.batch.purchasePrice}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-foreground block text-[11px]">
                                      Batch Stock Value
                                    </span>
                                    <span className="font-mono font-bold text-foreground">
                                      {currency}
                                      {row.stockValue.toLocaleString()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-foreground block text-[11px]">
                                      Return Eligibility
                                    </span>
                                    <span>
                                      {isReturnable(row)
                                        ? "✓ Eligible for credit note return"
                                        : "Past supplier return window"}
                                    </span>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        <div className="text-xl">🎉</div>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {activePills.includes("expired")
                            ? "No expired batches on record."
                            : `No medicines expiring in ${windowLabel(window)}.`}
                        </p>
                        <p className="text-xs">
                          {activePills.includes("expired")
                            ? "You have no expired inventory to dispose."
                            : "✓ No action required."}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Medicine Cards (replaces the table below md) */}
          <MedicineCards
            rows={pagedMedicines}
            currency={currency}
            now={now}
            batches={batches}
            medicines={medicines}
            expandedRowId={expandedRowId}
            onToggleExpand={(id) => setExpandedRowId((cur) => (cur === id ? null : id))}
            selectedRowIds={selectedRowIds}
            onToggleSelect={(id) =>
              setSelectedRowIds((cur) => {
                const n = new Set(cur);
                if (n.has(id)) n.delete(id);
                else n.add(id);
                return n;
              })
            }
            onReturnRow={onReturnRow}
            onTransferRow={onTransferRow}
            onDiscountRow={onDiscountRow}
            onDisposeRow={onDisposeRow}
            onViewBatchRow={onViewBatchRow}
            onAlternatives={(row) => setAlternativesRow(row)}
          />

          {totalMedPages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>
                Page {medPage} of {totalMedPages} ({processedMedicines.length} total items)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={medPage === 1}
                  onClick={() => setMedPage((p) => Math.max(1, p - 1))}
                  className="h-7 w-7 p-0 cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={medPage === totalMedPages}
                  onClick={() => setMedPage((p) => Math.min(totalMedPages, p + 1))}
                  className="h-7 w-7 p-0 cursor-pointer"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. STICKY BULK ACTION TOOLBAR (GMAIL STYLE)                              */}
      {/* ========================================================================= */}
      {selectedRowIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-x-0 bottom-0 z-50 flex items-center gap-2 bg-card/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md border-t border-border text-xs sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:flex-row sm:items-center sm:gap-3 sm:rounded-full sm:border sm:px-5 sm:py-2.5 sm:pb-2.5"
        >
          <span className="font-extrabold text-foreground font-mono bg-muted px-2.5 py-1 rounded-full border border-border shrink-0">
            {selectedRowIds.size} Selected
          </span>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar sm:overflow-visible">
            <div className="h-4 w-px bg-border hidden sm:block" />

            {onReturnRow && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const firstReturnable = selectedRowsList.find((r) => isReturnable(r));
                  if (firstReturnable) onReturnRow(firstReturnable);
                  else toast.error("None of the selected items are returnable");
                }}
                className="h-9 min-h-[44px] text-xs font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer sm:min-h-[36px]"
              >
                <RotateCcw className="h-3 w-3 mr-1" /> Return
              </Button>
            )}

            {onTransferRow && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (selectedRowsList[0]) onTransferRow(selectedRowsList[0]);
                }}
                className="h-9 min-h-[44px] text-xs font-bold border-primary/40 text-primary hover:bg-primary/10 cursor-pointer sm:min-h-[36px]"
              >
                <Truck className="h-3 w-3 mr-1" /> Transfer
              </Button>
            )}

            {onDiscountRow && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const firstValid = selectedRowsList.find((r) => r.days > 0);
                  if (firstValid) onDiscountRow(firstValid);
                  else toast.error("Cannot discount expired items");
                }}
                className="h-9 min-h-[44px] text-xs font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer sm:min-h-[36px]"
              >
                <Percent className="h-3 w-3 mr-1" /> Discount
              </Button>
            )}

            {onDisposeRow && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const firstExpired = selectedRowsList.find((r) => r.days <= 0);
                  if (firstExpired) onDisposeRow(firstExpired);
                  else toast.error("Only expired items can be disposed");
                }}
                className="h-9 min-h-[44px] text-xs font-bold border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer sm:min-h-[36px]"
              >
                <Trash2 className="h-3 w-3 mr-1" /> Dispose
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => exportMedicinesCsv(selectedRowsList)}
              className="h-9 min-h-[44px] text-xs cursor-pointer sm:min-h-[36px]"
            >
              <Download className="h-3 w-3 mr-1" /> Export
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedRowIds(new Set())}
            className="text-muted-foreground hover:text-foreground ml-auto p-1.5 rounded-full cursor-pointer shrink-0 sm:ml-1"
            title="Deselect all"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 7. SUPPLIER INTELLIGENCE & CATEGORY INTELLIGENCE                         */}
      {/* ========================================================================= */}
      {mode === "insights" ? (
        <motion.div
          key="analytics-grid"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Rows 3–4 of the BI grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            <CategoryRiskCard
              data={categoryAnalytics}
              currency={currency}
              windowLabelText={
                activePills.includes("expired") ? "Expired – All Time" : windowLabel(window)
              }
              onDrill={onDrill}
            />

            <SupplierRecoveryCard
              data={supplierAnalytics}
              currency={currency}
              windowLabelText={
                activePills.includes("expired") ? "Expired – All Time" : windowLabel(window)
              }
              onDrill={onDrill}
            />

            <RecoveryTrendCard
              data={lossRecoveryCombo}
              currency={currency}
              activeMonth={expiryMonth}
              onSelectMonth={onSelectMonth}
              windowLabelText={
                activePills.includes("expired") ? "Expired – All Time" : windowLabel(window)
              }
            />
          </div>

          {/* Supplementary: top at-risk medicines */}
          <TopAtRiskCard
            top10={topAtRisk}
            currency={currency}
            windowLabelText={
              activePills.includes("expired") ? "Expired – All Time" : windowLabel(window)
            }
            onDrill={onDrill}
          />
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Supplier Intelligence Table */}
          <div className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Supplier Intelligence</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recoverable credit note value per supplier ·{" "}
                  {activePills.includes("expired") ? "Expired – All Time" : windowLabel(window)}
                </p>
              </div>
              <div className="relative w-36">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Supplier..."
                  value={supSearch}
                  onChange={(e) => {
                    setSupSearch(e.target.value);
                    setSupPage(1);
                  }}
                  className="h-7 pl-7 text-xs bg-background"
                />
              </div>
            </div>

            <div className="w-full overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs min-w-0 md:min-w-0">
                <thead className="bg-muted/70 font-semibold text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-2.5 whitespace-nowrap">Supplier</th>
                    <th className="p-2.5 whitespace-nowrap">Recoverable</th>
                    <th className="p-2.5 whitespace-nowrap">Credit Note</th>
                    <th className="p-2.5 whitespace-nowrap">Status</th>
                    <th className="p-2.5 whitespace-nowrap text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card">
                  {pagedSuppliers.length > 0 ? (
                    pagedSuppliers.map((s) => (
                      <tr key={s.supplier} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2.5 font-bold text-foreground">
                          <div className="line-clamp-2 max-w-[260px]">{s.supplier}</div>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {currency}
                          {s.returnableValue.toLocaleString()}
                        </td>
                        <td className="p-2.5 font-mono text-muted-foreground whitespace-nowrap">
                          {s.returnableValue > 0 ? "Eligible" : "None"}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                              s.returnableValue > 0
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {s.returnableValue > 0 ? "Action Needed" : "Clean"}
                          </span>
                        </td>
                        <td className="p-2.5 text-right whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onShow("return");
                              toast.info(`Generated return note preview for ${s.supplier}`);
                            }}
                            className="h-6 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-[10px] font-semibold px-2 cursor-pointer"
                          >
                            <FileCheck2 className="h-3 w-3 mr-1" /> Return Note
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No supplier return intelligence.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalSupPages > 1 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>
                  Page {supPage} of {totalSupPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={supPage === 1}
                    onClick={() => setSupPage((p) => Math.max(1, p - 1))}
                    className="h-6 w-6 p-0 cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={supPage === totalSupPages}
                    onClick={() => setSupPage((p) => Math.min(totalSupPages, p + 1))}
                    className="h-6 w-6 p-0 cursor-pointer"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Category Intelligence Table */}
          <div className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Category Intelligence</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Category exposure & risk distribution ·{" "}
                  {activePills.includes("expired") ? "Expired – All Time" : windowLabel(window)}
                </p>
              </div>
              <div className="relative w-36">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Category..."
                  value={catSearch}
                  onChange={(e) => {
                    setCatSearch(e.target.value);
                    setCatPage(1);
                  }}
                  className="h-7 pl-7 text-xs bg-background"
                />
              </div>
            </div>

            <div className="w-full overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs min-w-0 md:min-w-0">
                <thead className="bg-muted/70 font-semibold text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-2.5 whitespace-nowrap">Category</th>
                    <th className="p-2.5 whitespace-nowrap">Critical</th>
                    <th className="p-2.5 whitespace-nowrap">Stock Value</th>
                    <th className="p-2.5 whitespace-nowrap">Risk Badge</th>
                    <th className="p-2.5 whitespace-nowrap text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card">
                  {pagedCategories.length > 0 ? (
                    pagedCategories.map((c) => {
                      const isHigh = c.critical > 2 || c.expired > 0;
                      const isMed = c.critical > 0;
                      return (
                        <tr key={c.category} className="hover:bg-muted/30 transition-colors">
                          <td className="p-2.5 font-bold text-foreground">
                            <div className="line-clamp-2 max-w-[260px]">{c.category}</div>
                          </td>
                          <td className="p-2.5 font-mono whitespace-nowrap">
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              {c.critical}
                            </span>{" "}
                            critical
                          </td>
                          <td className="p-2.5 font-mono font-bold text-foreground whitespace-nowrap">
                            {currency}
                            {c.totalValue.toLocaleString()}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                                isHigh
                                  ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                  : isMed
                                    ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                    : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
                              )}
                            >
                              {isHigh ? "High Risk" : isMed ? "Medium Risk" : "Low Risk"}
                            </span>
                          </td>
                          <td className="p-2.5 text-right whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                onShow(undefined);
                                toast.info(`Opened inventory filter for ${c.category}`);
                              }}
                              className="h-6 text-[10px] font-semibold px-2 cursor-pointer"
                            >
                              View Category
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No category intelligence.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalCatPages > 1 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>
                  Page {catPage} of {totalCatPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={catPage === 1}
                    onClick={() => setCatPage((p) => Math.max(1, p - 1))}
                    className="h-6 w-6 p-0 cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={catPage === totalCatPages}
                    onClick={() => setCatPage((p) => Math.min(totalCatPages, p + 1))}
                    className="h-6 w-6 p-0 cursor-pointer"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. INTELLIGENT ALTERNATIVES DRAWER FOR EXPIRED STOCK                     */}
      {/* ========================================================================= */}
      <Sheet open={!!alternativesRow} onOpenChange={(open) => !open && setAlternativesRow(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md md:max-w-lg overflow-y-auto p-6 space-y-4"
        >
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <RefreshCw className="h-4 w-4" />
              <span>In-Stock Replacement Finder</span>
            </div>
            <SheetTitle className="text-lg font-extrabold text-foreground tracking-tight">
              Suggested Alternatives
            </SheetTitle>
            {alternativesRow && (
              <div className="text-xs text-muted-foreground font-mono bg-muted/60 p-2.5 rounded-xl border border-border mt-1">
                Expired Target:{" "}
                <strong className="text-foreground">
                  {alternativesRow.medicineName !== "—"
                    ? alternativesRow.medicineName
                    : `Batch ${alternativesRow.batchNumber}`}
                </strong>{" "}
                · Batch: {alternativesRow.batchNumber} ({Math.abs(alternativesRow.days)}d ago)
              </div>
            )}
          </SheetHeader>

          {/* Customer Assistance Banner */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-2.5">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-amber-800 dark:text-amber-300 block">
                Expired medicine cannot be dispensed.
              </span>
              <span className="text-muted-foreground">
                The following in-stock alternatives are currently available in inventory.
              </span>
            </div>
          </div>

          {/* Alternatives List */}
          {alternativesList.length > 0 ? (
            <div className="space-y-3 pt-1">
              {alternativesList.map((alt) => {
                const medName = alt.medicine?.name || `Medicine (${alt.batch.batchNumber})`;
                const genericName = alt.medicine?.genericName || alternativesRow?.salt || "—";
                const mfrName =
                  mfrById.get(alt.medicine?.manufacturerId ?? "") ||
                  alternativesRow?.manufacturer ||
                  "Unknown Manufacturer";
                const stock = alt.batch.currentStock;
                const price = alt.batch.sellingPrice || alt.batch.mrp || 0;
                const shelfLoc = alt.batch.shelfLocation || "A-01";
                return (
                  <div
                    key={alt.batch.id}
                    className="rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-primary/40 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-extrabold text-sm text-foreground">{medName}</h4>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-extrabold border",
                              alt.badgeStyle,
                            )}
                          >
                            {alt.matchBadge}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">
                          {genericName} {alt.medicine?.strength && `· ${alt.medicine.strength}`}{" "}
                          {alt.medicine?.dosageForm && `(${alt.medicine.dosageForm})`}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Manufacturer: {mfrName}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-black font-mono text-foreground">
                          {currency}
                          {price.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          Shelf: {shelfLoc}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
                      {/* Stock Indicator */}
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            stock > 10
                              ? "bg-emerald-500"
                              : stock > 0
                                ? "bg-amber-500 animate-pulse"
                                : "bg-rose-500",
                          )}
                        />
                        <span
                          className={
                            stock > 10
                              ? "text-emerald-600 dark:text-emerald-400"
                              : stock > 0
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-rose-600 dark:text-rose-400"
                          }
                        >
                          {stock > 10
                            ? `● In Stock (${stock})`
                            : stock > 0
                              ? `● Low Stock (${stock})`
                              : "● Out of Stock"}
                        </span>
                        <span className="text-muted-foreground font-normal ml-1">
                          · Exp: {alt.batch.expiryDate.slice(0, 10)}
                        </span>
                      </div>

                      {/* Primary CTA Button */}
                      <Button
                        size="sm"
                        onClick={() => {
                          toast.success(`Selected ${medName} (Shelf: ${shelfLoc}) as replacement.`);
                          if (onViewMedicineId && alt.medicine?.id) {
                            onViewMedicineId(alt.medicine.id);
                          }
                          setAlternativesRow(null);
                        }}
                        className="h-7 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer px-3 shadow-2xs rounded-lg"
                      >
                        <Check className="h-3 w-3 mr-1" /> Use This Medicine
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-2xl border border-dashed border-border p-6 text-center space-y-3 bg-muted/20 my-2">
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
                <SearchX className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  No suitable alternatives found.
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  There are currently no matching in-stock medicines for this generic formulation in
                  inventory.
                </p>
              </div>
              <div className="rounded-xl bg-card border border-border p-3.5 text-xs text-left space-y-1.5 text-muted-foreground font-medium">
                <span className="font-bold text-foreground block uppercase text-[10px] tracking-wider">
                  Recommended Actions:
                </span>
                <div>• Return expired batch to supplier for credit note</div>
                <div>• Dispose expired stock to clear shelf inventory</div>
                <div>• Check nearby branch stock for transfer</div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
/* ============================================================================ */
/* MOBILE MEDICINE CARDS (replaces the workspace table below md)                */
/* ============================================================================ */
function MedicineCards({
  rows,
  currency,
  now,
  batches,
  medicines,
  expandedRowId,
  onToggleExpand,
  selectedRowIds,
  onToggleSelect,
  onReturnRow,
  onTransferRow,
  onDiscountRow,
  onDisposeRow,
  onViewBatchRow,
  onAlternatives,
}) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-3 md:hidden">
      {rows.map((row) => {
        const purchaseValue = Math.round(row.stockValue);
        const sellingValue = Math.round(row.quantity * row.batch.sellingPrice);
        const marginValue = sellingValue - purchaseValue;
        const isExpanded = expandedRowId === row.batch.id;
        const isSelected = selectedRowIds.has(row.batch.id);
        const isCritical = row.days <= 3;
        const isWarning = row.days > 3 && row.days <= 7;
        const showReturn = isReturnable(row) && row.days <= 7;
        const statusPill = isCritical ? (
          <span
            title={`Expires ${row.expiryDate}`}
            className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-[2px] text-[10px] font-semibold whitespace-nowrap"
          >
            <span className="h-1 w-1 rounded-full bg-rose-500 animate-pulse" />
            {row.days < 0
              ? `Expired • ${Math.abs(row.days)}d ago`
              : row.days === 0
                ? "Expires Today"
                : `Critical • ${row.days}d`}
          </span>
        ) : isWarning ? (
          <span
            title={`Expires ${row.expiryDate}`}
            className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-[2px] text-[10px] font-semibold whitespace-nowrap"
          >
            <span className="h-1 w-1 rounded-full bg-amber-500" />
            Warning • {row.days}d
          </span>
        ) : (
          <span
            title={`Expires ${row.expiryDate}`}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-[2px] text-[10px] font-semibold whitespace-nowrap"
          >
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
            Safe • {row.days}d
          </span>
        );
        return (
          <div
            key={row.batch.id}
            className={cn(
              "rounded-xl border bg-card p-3 shadow-xs space-y-3",
              isSelected ? "border-primary/50 bg-primary/[0.03]" : "border-border",
              isCritical && "border-rose-500/30",
            )}
          >
            {/* Header: medicine + status */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <input
                  type="checkbox"
                  aria-label={`Select ${row.medicineName}`}
                  checked={isSelected}
                  onChange={() => onToggleSelect(row.batch.id)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground tracking-tight leading-tight">
                      {row.medicineName !== "—" ? row.medicineName : `Batch ${row.batchNumber}`}
                    </span>
                    {statusPill}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                    {row.salt !== "—" ? `${row.salt} · ` : ""}
                    Batch {row.batchNumber} · Shelf {row.shelf || "Unassigned"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label={isExpanded ? "Collapse details" : "Expand details"}
                aria-expanded={isExpanded}
                onClick={() => onToggleExpand(row.batch.id)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Key meta */}
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Expiry
                </dt>
                <dd className="font-mono text-foreground">{row.expiryDate}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Batch
                </dt>
                <dd className="font-mono text-foreground">{row.batchNumber}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Shelf
                </dt>
                <dd className="text-foreground">{row.shelf || "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Units
                </dt>
                <dd className="text-foreground tabular-nums">{row.quantity.toLocaleString()}</dd>
              </div>
            </dl>

            {/* Values */}
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-border/60 bg-muted/30 p-2.5">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Purchase Value
                </div>
                <div className="text-xs font-bold text-foreground tabular-nums">
                  {currency}
                  {purchaseValue.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Selling Value
                </div>
                <div className="text-xs font-semibold text-foreground tabular-nums">
                  {currency}
                  {sellingValue.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Margin
                </div>
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {currency}
                  {marginValue.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Actions */}
            {(() => {
              const actions = [];
              if (showReturn && onReturnRow) {
                actions.push({
                  id: "return",
                  label: "Return",
                  icon: RotateCcw,
                  color: "text-emerald-600 dark:text-emerald-400",
                  onClick: () => onReturnRow(row),
                });
              }
              if (row.days <= 0) {
                actions.push({
                  id: "alt",
                  label: "Alternatives",
                  icon: RefreshCw,
                  color: "text-indigo-600 dark:text-indigo-400",
                  onClick: () => onAlternatives(row),
                });
              } else if (onTransferRow) {
                actions.push({
                  id: "transfer",
                  label: "Transfer",
                  icon: Truck,
                  color: "text-sky-600 dark:text-sky-400",
                  onClick: () => onTransferRow(row),
                });
              }
              if (onDiscountRow && row.days > 0) {
                actions.push({
                  id: "discount",
                  label: "Discount",
                  icon: Percent,
                  color: "text-amber-600 dark:text-amber-400",
                  onClick: () => onDiscountRow(row),
                });
              }
              if (onDisposeRow && row.days <= 0) {
                actions.push({
                  id: "dispose",
                  label: "Dispose",
                  icon: Trash2,
                  color: "text-rose-600 dark:text-rose-400",
                  onClick: () => onDisposeRow(row),
                });
              }
              if (onViewBatchRow) {
                actions.push({
                  id: "view",
                  label: "View",
                  icon: Eye,
                  color: "text-muted-foreground",
                  onClick: () => onViewBatchRow(row),
                });
              }
              const visibleActions = actions.slice(0, 2);
              const dropdownActions = actions.slice(2);
              return (
                <div className="flex items-center gap-2">
                  {visibleActions.map((action) => (
                    <Button
                      key={action.id}
                      size="sm"
                      variant="outline"
                      onClick={action.onClick}
                      className={cn(
                        "h-9 min-h-[44px] cursor-pointer rounded-lg px-3 text-xs font-bold sm:min-h-[36px]",
                        action.color,
                      )}
                    >
                      <action.icon className="h-3.5 w-3.5 mr-1" /> {action.label}
                    </Button>
                  ))}
                  {dropdownActions.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 w-9 min-h-[44px] shrink-0 cursor-pointer rounded-lg p-0 sm:min-h-[36px]"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {dropdownActions.map((action) => (
                          <DropdownMenuItem
                            key={action.id}
                            onClick={action.onClick}
                            className={cn("cursor-pointer font-medium py-2", action.color)}
                          >
                            <action.icon className="h-4 w-4 mr-2" />
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })()}

            {/* Expandable details */}
            {isExpanded && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[11px] font-bold text-foreground">
                      Generic Composition
                    </span>
                    <span>{row.salt || "N/A"}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-foreground">
                      Supplier Name
                    </span>
                    <span>{row.supplier}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-foreground">
                      Unit Purchase Cost
                    </span>
                    <span className="font-mono">
                      {currency}
                      {row.batch.purchasePrice}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-foreground">
                      Batch Stock Value
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {currency}
                      {row.stockValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[11px] font-bold text-foreground">
                      Return Eligibility
                    </span>
                    <span>
                      {isReturnable(row)
                        ? "✓ Eligible for credit note return"
                        : "Past supplier return window"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
