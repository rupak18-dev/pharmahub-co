import React from "react";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const badges = [
  "Pharmacy Owners",
  "Medical Enterprises",
  "Dealers & Distributors",
  "Hospital Chains",
];

export function BenefitBadges() {
  return (
    <div className="mt-auto pt-10 pb-8 z-10 w-full max-w-lg mx-auto">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-sm font-semibold text-center text-primary/80 uppercase tracking-widest mb-6"
      >
        Trusted By
      </motion.p>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-4">
        {badges.map((badge, index) => (
          <motion.div
            key={badge}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">{badge}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
