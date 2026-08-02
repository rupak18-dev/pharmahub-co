import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FlowRange, MonthlyFlow } from "@/lib/inventory";
import { InventoryCard } from "./InventoryCard";

const RANGE_OPTIONS: { value: FlowRange; label: string }[] = [
  { value: 3, label: "Last 3 months" },
  { value: 6, label: "Last 6 months" },
  { value: 12, label: "Last 12 months" },
];

const STOCK_IN_COLOR = "var(--color-warning)";
const STOCK_OUT_COLOR = "#8B5CF6";
const STOCK_VALUE_COLOR = "var(--color-info)";

const H = 264;
const PAD_L = 42;
const PAD_R = 52;
const PAD_T = 14;
const PAD_B = 30;

function compactUnits(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return `${Math.round(v)}`;
}

function compactCurrency(v: number): string {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
  return `₹${Math.round(v)}`;
}

function niceTicks(max: number, count: number): number[] {
  const rawStep = max / count;
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / pow;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * pow;
  const ticks: number[] = [];
  const n = Math.ceil(max / step);
  for (let i = 0; i <= n; i++) ticks.push(Number((i * step).toFixed(6)));
  return ticks;
}

function useMeasureWidth<T extends HTMLElement>(
  fallback = 720,
): { ref: RefObject<T | null>; width: number } {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0]?.contentRect.width;
      if (cw && cw > 0) setWidth(Math.round(cw));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

export function MovementChart({
  data,
  range,
  onRangeChange,
  className,
}: {
  data: MonthlyFlow[];
  range: FlowRange;
  onRangeChange: (r: FlowRange) => void;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const { ref, width } = useMeasureWidth<HTMLDivElement>();

  const W = Math.max(320, width);
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const { unitTicks, valueTicks, unitsMax, valuesMax, slotW } = useMemo(() => {
    const unitMax = Math.max(1, ...data.map((d) => Math.max(d.stockIn, d.stockOut)));
    const valueMax = Math.max(1, ...data.map((d) => d.stockValue));
    const unitTicks = niceTicks(unitMax, 4);
    const valueTicks = niceTicks(valueMax, 3);
    const slotW = plotW / data.length;
    return {
      unitTicks,
      valueTicks,
      unitsMax: unitTicks[unitTicks.length - 1],
      valuesMax: valueTicks[valueTicks.length - 1],
      slotW,
    };
  }, [data, plotW]);

  const yPos = (v: number, max: number) => PAD_T + plotH - (v / max) * plotH;

  const hovered = hover != null ? data[hover] : null;
  const hoverPct = hover != null ? ((PAD_L + hover * slotW + slotW / 2) / W) * 100 : 0;

  return (
    <InventoryCard
      className={className}
      title="Inventory Movement Statistics"
      action={
        <Select value={String(range)} onValueChange={(v) => onRangeChange(Number(v) as FlowRange)}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      bodyClassName="p-4"
    >
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-warning" /> Stock In
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: STOCK_OUT_COLOR }} />{" "}
          Stock Out
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-info" /> Stock Value
        </span>
      </div>

      <div ref={ref} className="relative h-[240px] w-full sm:h-[264px]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-full w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="Inventory movement statistics chart"
        >
          {unitTicks.map((t) => {
            const y = yPos(t, unitsMax);
            return (
              <g key={`ut-${t}`}>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={W - PAD_R}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeDasharray="3 3"
                />
                <text
                  x={PAD_L - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize={11}
                  fill="var(--color-muted-foreground)"
                >
                  {compactUnits(t)}
                </text>
              </g>
            );
          })}
          {valueTicks.map((t) => (
            <text
              key={`vt-${t}`}
              x={W - PAD_R + 8}
              y={yPos(t, valuesMax) + 3.5}
              fontSize={11}
              fill="var(--color-muted-foreground)"
            >
              {compactCurrency(t)}
            </text>
          ))}
          {data.map((d, i) => {
            const cx = PAD_L + i * slotW + slotW / 2;
            const barW = Math.min(24, Math.max(4, slotW * 0.3));
            const hIn = (d.stockIn / unitsMax) * plotH;
            const hOut = (d.stockOut / unitsMax) * plotH;
            const yIn = yPos(d.stockIn, unitsMax);
            const yOut = yPos(d.stockOut, unitsMax);
            return (
              <g key={`bar-${d.month}`}>
                <rect
                  x={cx - barW - 1}
                  y={yIn}
                  width={barW}
                  height={hIn}
                  rx={Math.min(4, hIn / 2)}
                  fill={STOCK_IN_COLOR}
                />
                <rect
                  x={cx + 1}
                  y={yOut}
                  width={barW}
                  height={hOut}
                  rx={Math.min(4, hOut / 2)}
                  fill={STOCK_OUT_COLOR}
                />
              </g>
            );
          })}
          <polyline
            points={data
              .map((d, i) => {
                const x = PAD_L + i * slotW + slotW / 2;
                return `${x},${yPos(d.stockValue, valuesMax)}`;
              })
              .join(" ")}
            fill="none"
            stroke={STOCK_VALUE_COLOR}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {data.map((d, i) => {
            const x = PAD_L + i * slotW + slotW / 2;
            return (
              <circle
                key={`dot-${d.month}`}
                cx={x}
                cy={yPos(d.stockValue, valuesMax)}
                r={3}
                fill={STOCK_VALUE_COLOR}
                stroke="var(--color-card)"
                strokeWidth={1.5}
              />
            );
          })}
          {data.map((d, i) => (
            <text
              key={`xl-${d.month}`}
              x={PAD_L + i * slotW + slotW / 2}
              y={H - 8}
              textAnchor="middle"
              fontSize={11}
              fill="var(--color-muted-foreground)"
            >
              {d.month}
            </text>
          ))}
          {hover != null && (
            <line
              x1={PAD_L + hover * slotW + slotW / 2}
              y1={PAD_T}
              x2={PAD_L + hover * slotW + slotW / 2}
              y2={PAD_T + plotH}
              stroke="var(--color-muted-foreground)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}
          {data.map((d, i) => (
            <rect
              key={`hit-${d.month}`}
              x={PAD_L + i * slotW}
              y={PAD_T}
              width={slotW}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>

        {hovered && hover != null && (
          <div
            className="pointer-events-none absolute top-1 z-10 w-max max-w-[220px] -translate-x-1/2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-lg"
            style={{ left: `${hoverPct}%` }}
          >
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {hovered.month}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-8 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-warning" /> Stock In
                </span>
                <span className="font-mono font-medium tabular-nums">
                  {hovered.stockIn.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-8 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: STOCK_OUT_COLOR }} />{" "}
                  Stock Out
                </span>
                <span className="font-mono font-medium tabular-nums">
                  {hovered.stockOut.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-8 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-info" /> Stock Value
                </span>
                <span className="font-mono font-medium tabular-nums">
                  {`₹${hovered.stockValue.toLocaleString("en-IN")}`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </InventoryCard>
  );
}
