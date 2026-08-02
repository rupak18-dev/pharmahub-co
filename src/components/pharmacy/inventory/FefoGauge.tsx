import { Link } from "@tanstack/react-router";
import { MoreHorizontal, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatINR, type FefoIndex } from "@/lib/inventory";
import { InventoryCard } from "./InventoryCard";

function gaugeColor(score: number): string {
  if (score >= 80) return "var(--color-success)";
  if (score >= 60) return "var(--color-warning)";
  return "var(--color-destructive)";
}

const R = 88;
const CX = 100;
const CY = 110;

function arcEnd(score: number): { x: number; y: number } {
  const p = Math.min(100, Math.max(0, score)) / 100;
  const rad = p * Math.PI;
  return {
    x: CX - R * Math.cos(rad),
    y: CY - R * Math.sin(rad),
  };
}

export function FefoGauge({ fefo, className }: { fefo: FefoIndex; className?: string }) {
  const color = gaugeColor(fefo.score);
  const tone =
    fefo.score >= 80
      ? "text-success"
      : fefo.score >= 60
        ? "text-warning-foreground"
        : "text-destructive";
  const end = arcEnd(fefo.score);
  const valueArc = fefo.score > 0 ? `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${end.x} ${end.y}` : null;

  return (
    <InventoryCard
      className={className}
      title="Shelf-Life Distribution"
      icon={ShieldCheck}
      action={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="FEFO options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/dashboard/expiry">View expiry plan</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/batches">Open batches</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
      bodyClassName="flex flex-col"
    >
      <div className="relative h-[180px] sm:h-[190px]">
        <svg
          viewBox="0 0 200 132"
          className="block h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`FEFO index gauge at ${fefo.score.toFixed(1)}%`}
        >
          <path
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth={14}
            strokeLinecap="round"
          />
          {valueArc && (
            <path d={valueArc} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" />
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-2">
          <span className={`text-3xl font-semibold tabular-nums ${tone}`}>
            {fefo.score.toFixed(1)}%
          </span>
          <span className="mt-0.5 text-xs font-medium text-muted-foreground">Safe Shelf-Life</span>
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
        <div className="px-4 py-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Expiring &lt; 30 Days
          </div>
          <div className="mt-0.5 text-lg font-semibold tabular-nums">
            {fefo.expiringSoon30.toLocaleString("en-IN")}{" "}
            <span className="text-xs font-normal text-muted-foreground">batches</span>
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Quarantined Value
          </div>
          <div className="mt-0.5 text-lg font-semibold tabular-nums text-destructive">
            {formatINR(fefo.quarantinedValue)}
          </div>
        </div>
      </div>
    </InventoryCard>
  );
}
