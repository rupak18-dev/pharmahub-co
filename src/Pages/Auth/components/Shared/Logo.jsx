import React from "react";
import { cn } from "@/lib/utils";

const TAGLINE = "The Infrastructure for Modern Pharma.";

export function Logo({ tagline = TAGLINE, className, imgClassName, isWhite }) {
  if (isWhite) {
    return (
      <div className={cn("flex flex-col items-start gap-2.5", className)}>
        <span className="text-2xl font-bold tracking-tight text-white">PharmaHub</span>
        {tagline && <p className="text-sm font-medium text-white/80">{tagline}</p>}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-start gap-2.5", className)}>
      <img
        src="/PharmaHub__logo_cropped.webp"
        alt="PharmaHub Logo"
        className={cn("h-12 w-auto object-contain mix-blend-multiply", imgClassName)}
      />
      {tagline && <p className="text-sm font-medium text-muted-foreground">{tagline}</p>}
    </div>
  );
}
