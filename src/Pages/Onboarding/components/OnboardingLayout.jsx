import React from "react";
import { ProgressSidebar } from "./ProgressSidebar";
import { AnimatePresence, motion } from "framer-motion";

export function OnboardingLayout({ children, currentStep }) {
  return (
    <div className="flex min-h-[100dvh] w-full bg-background overflow-hidden onboarding-layout">
      {/* Left Column: Vertical Onboarding Sidebar */}
      <div className="hidden lg:block lg:w-[35%] xl:w-[30%] flex-shrink-0 relative z-10">
        <ProgressSidebar currentStep={currentStep} />
      </div>

      {/* Right Column: Main Content */}
      <div className="w-full lg:w-[65%] xl:w-[70%] relative flex flex-col justify-center py-6 px-4 overflow-y-auto">
        <div className="w-full max-w-[720px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
