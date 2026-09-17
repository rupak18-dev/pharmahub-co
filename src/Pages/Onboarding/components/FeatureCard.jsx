import React from "react";
import { motion } from "framer-motion";

export function FeatureCard({ title, description, selected, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative p-4 cursor-pointer rounded-[18px] border-2 transition-all duration-200 ${
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      }`}
    >
      <div className="pr-8">
        <h3 className={`text-base font-bold ${selected ? "text-primary" : "text-foreground"}`}>
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
      <div
        className={`absolute top-4 right-4 w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
          selected ? "bg-primary border-primary" : "border-muted-foreground/30 bg-background"
        }`}
      >
        {selected && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </motion.div>
  );
}
