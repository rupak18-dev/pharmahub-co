import React, { lazy, Suspense } from "react";
import { BackgroundPattern } from "./BackgroundPattern";
import { FeatureCard } from "./FeatureCard";
import { BenefitBadges } from "./BenefitBadges";
import { Package, AlertTriangle, ClipboardCheck, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export function ProductShowcase() {
  return (
    <div className="relative hidden lg:flex h-full min-h-[100dvh] flex-col justify-between w-full bg-muted/30 overflow-y-auto overflow-x-hidden px-8 py-[clamp(0.75rem,2.5dvh,4rem)] xl:px-12">
      <BackgroundPattern />

      <div className="relative z-10 max-w-2xl mx-auto text-center mt-[clamp(0.25rem,1.5dvh,3rem)]">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-foreground leading-[1.15]"
        >
          Run Your Entire Pharmacy <br />
          <span className="text-primary">From One Intelligent Platform</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-[clamp(0.75rem,2dvh,1.5rem)] text-base lg:text-lg text-muted-foreground leading-relaxed"
        >
          Manage inventory, monitor expiry, conduct stock audits, track sales, and grow your
          pharmacy business effortlessly.
        </motion.p>
      </div>

      {/* Feature cards — flow layout (grid), diagonal zigzag: TL → MR → ML → BR.
          Normal flow makes overlap impossible: rows always size to their content. */}
      <div className="relative z-10 flex-1 w-full min-h-0 mt-[clamp(0.75rem,2dvh,3rem)] flex items-center">
        <div className="grid w-full max-w-md mx-auto grid-cols-2 items-start gap-x-4 gap-y-3 xl:max-w-xl">
          <FeatureCard
            icon={Package}
            title="Inventory"
            subtitle="Live Tracking"
            value="117"
            highlight="Medicines"
            delay={0.6}
            className="justify-self-start w-48 xl:w-60"
          />

          <FeatureCard
            icon={AlertTriangle}
            title="Expiry Alerts"
            subtitle="Need Attention"
            value="17"
            highlight="Medicines"
            delay={0.8}
            className="justify-self-end mt-8 w-48 xl:w-60 border-warning/30"
          />

          <FeatureCard
            icon={ClipboardCheck}
            title="Stock Audit"
            subtitle="Accuracy"
            value="99.8%"
            delay={1.0}
            className="justify-self-start w-48 xl:w-60 border-success/30"
          />

          <FeatureCard
            icon={BarChart3}
            title="Reports"
            subtitle="Sales & GST"
            value="Analytics"
            delay={1.2}
            className="justify-self-end mt-8 w-48 xl:w-60"
          />
        </div>
      </div>

      <BenefitBadges />
    </div>
  );
}
