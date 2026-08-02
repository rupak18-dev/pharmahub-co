import { Link } from "@tanstack/react-router";
import { Pill } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  showText = true,
  size = "md",
}: {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sz = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const text =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <Link to="/" className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span
        className={cn(
          "grid place-items-center rounded-md bg-primary text-primary-foreground shadow-sm",
          sz,
        )}
      >
        <Pill className="h-4 w-4" strokeWidth={2.5} />
      </span>
      {showText && (
        <span className={cn("text-foreground", text)}>
          Pharmacy<span className="text-primary">OS</span>
        </span>
      )}
    </Link>
  );
}
