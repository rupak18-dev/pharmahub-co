import React, { lazy, Suspense } from "react";
import { BackgroundPattern } from "./BackgroundPattern";
import { FeatureCard } from "./FeatureCard";
import { BenefitBadges } from "./BenefitBadges";
import { Package, AlertTriangle, ClipboardCheck, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export function ProductShowcase() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between w-full h-[100dvh] bg-muted/30 overflow-hidden px-12 py-16">
      <BackgroundPattern />

      <div className="relative z-10 max-w-2xl mx-auto text-center mt-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl xl:text-5xl font-bold tracking-tight text-foreground leading-[1.15]"
        >
          Run Your Entire Pharmacy <br />
          <span className="text-primary">From One Intelligent Platform</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 text-lg text-muted-foreground leading-relaxed"
        >
          Manage inventory, monitor expiry, conduct stock audits, track sales, and grow your
          pharmacy business effortlessly.
        </motion.p>
      </div>

      {/* Floating Elements Area */}
      <div className="relative flex-1 w-full mt-12 min-h-[400px]">
        {/* We place feature cards floating in 3D space */}
        <FeatureCard
          icon={Package}
          title="Inventory"
          subtitle="Live Tracking"
          value="117"
          highlight="Medicines"
          delay={0.6}
          className="top-[10%] left-[10%] w-64"
        />

        <FeatureCard
          icon={AlertTriangle}
          title="Expiry Alerts"
          subtitle="Need Attention"
          value="17"
          highlight="Medicines"
          delay={0.8}
          className="top-[25%] right-[5%] w-64 border-warning/30"
        />

        <FeatureCard
          icon={ClipboardCheck}
          title="Stock Audit"
          subtitle="Accuracy"
          value="99.8%"
          delay={1.0}
          className="bottom-[25%] left-[5%] w-64 border-success/30"
        />

        <FeatureCard
          icon={BarChart3}
          title="Reports"
          subtitle="Sales & GST"
          value="Analytics"
          delay={1.2}
          className="bottom-[10%] right-[15%] w-64"
        />
      </div>

      <BenefitBadges />
    </div>
  );
}
