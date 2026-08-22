import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FeatureCard({
  icon: Icon,
  title,
  subtitle,
  value,
  highlight,
  delay = 0,
  className,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className={cn(
        "bg-card/80 backdrop-blur-md border border-border shadow-xl rounded-2xl p-4 flex items-center gap-4 transition-transform hover:scale-105",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{title}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-lg font-bold text-foreground leading-tight">{value}</span>
          <span className="text-xs font-medium text-muted-foreground">{subtitle}</span>
        </div>
        {highlight && <p className="text-xs font-medium text-primary mt-0.5">{highlight}</p>}
      </div>
    </motion.div>
  );
}
