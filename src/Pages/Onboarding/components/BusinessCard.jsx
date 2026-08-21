import React from "react";
import { motion } from "framer-motion";

export function BusinessCard({ title, description, icon: Icon, selected, onClick, isRecommended }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      transition={{ duration: 0.2 }}
      className={`relative px-5 py-4 cursor-pointer rounded-[12px] border transition-all duration-200 flex items-center ${
        selected
          ? "border-primary bg-[#F7FCFA] shadow-sm"
          : "border-border bg-white hover:border-primary hover:shadow-sm group"
      }`}
    >
      <div className="flex items-center space-x-4 w-full">
        <div
          className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full transition-colors duration-200 ${
            selected
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground group-hover:bg-[#ECFDF5] group-hover:text-primary"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 pr-14 min-[420px]:pr-16">
          <div className="flex items-center">
            <h3 className="auth-card-title">{title}</h3>
          </div>

          <div className="mt-0.5">
            <p className="auth-card-desc">{description}</p>
          </div>
        </div>
      </div>

      {selected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute right-4 bg-[#059669] text-white rounded-full px-3 py-1 shadow-sm"
        >
          <span className="text-[14px] font-medium">Selected</span>
        </motion.div>
      )}
    </motion.div>
  );
}
