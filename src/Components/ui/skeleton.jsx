import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-primary/10",
        "motion-safe:after:pointer-events-none motion-safe:after:absolute motion-safe:after:inset-0 motion-safe:after:content-['']",
        "motion-safe:after:bg-gradient-to-r motion-safe:after:from-transparent motion-safe:after:via-white/40 motion-safe:after:to-transparent",
        "motion-safe:after:animate-[ph-shimmer_1.6s_ease-in-out_infinite]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
