import { cn } from "@/lib/utils";
import type { BatchStatus } from "@/lib/types";

const map: Record<BatchStatus | "low" | "out" | "healthy", { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-[#E6F4F1] text-[#007A5A] border-[#007A5A]/20" },
  near_expiry: {
    label: "Near expiry",
    cls: "bg-[#FEF3C7] text-[#D97706] border-[#D97706]/25",
  },
  expired: { label: "Expired", cls: "bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/25" },
  sold_out: { label: "Sold out", cls: "bg-[#F1F5F9] text-[#64748B] border-slate-200" },
  disposed: { label: "Disposed", cls: "bg-[#F1F5F9] text-[#64748B] border-slate-200" },
  low: { label: "Low stock", cls: "bg-[#FEF3C7] text-[#D97706] border-[#D97706]/25" },
  out: { label: "Out of stock", cls: "bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/25" },
  healthy: { label: "In stock", cls: "bg-[#E6F4F1] text-[#007A5A] border-[#007A5A]/20" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: keyof typeof map;
  className?: string;
}) {
  const v = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        v.cls,
        className,
      )}
    >
      {v.label}
    </span>
  );
}
