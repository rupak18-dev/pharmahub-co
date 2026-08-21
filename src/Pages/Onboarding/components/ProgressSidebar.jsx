import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/Pages/Auth/components/Shared/Logo";
import { ONBOARDING_STEPS } from "../config/steps";
import { Check } from "lucide-react";

export function ProgressSidebar({ currentStep }) {
  const visibleSteps = ONBOARDING_STEPS.filter((s) => s.id !== "completion");

  return (
    <div
      className="w-full h-full p-10 lg:p-14 flex flex-col justify-between overflow-hidden relative"
      style={{
        background: `radial-gradient(circle at top right, rgba(255,255,255,0.08), transparent 40%), linear-gradient(180deg, #047857, #065F46)`,
      }}
    >
      <div className="relative z-10">
        <Logo isWhite tagline={null} />

        <div className="mt-[40px]">
          <h2 className="text-3xl font-bold tracking-tight text-white">Create your workspace</h2>
          <p className="mt-[16px] text-base font-medium text-white/80 leading-relaxed">
            Select your organization type to personalize your PharmaHub workspace.
          </p>
        </div>

        <div className="mt-[48px] pt-[48px] border-t border-white/20">
          <div className="mb-[40px]">
            <p className="text-[13px] font-medium text-white/60 mb-1">Estimated setup time</p>
            <p className="text-[15px] font-bold text-white">~2 min</p>
          </div>

          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute top-4 bottom-4 left-[14px] w-1 bg-white/20 rounded-full"></div>

            <div className="space-y-8 relative">
              {visibleSteps.map((step, index) => {
                const isCompleted = currentStep > index;
                const isActive = currentStep === index;
                const isUpcoming = currentStep < index;

                return (
                  <div key={step.id} className="flex items-start">
                    {/* Circle icon */}
                    <div className="relative z-10 mr-4 flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isCompleted
                            ? "bg-[#0c7858] text-white"
                            : isActive
                              ? "bg-white text-[#047857] border-2 border-[#047857] shadow-[0_0_15px_rgba(255,255,255,0.25)]"
                              : "bg-[#065F46] border-2 border-white/30 text-white/50"
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          {isCompleted ? (
                            <motion.div
                              key="completed"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Check className="w-4 h-4" />
                            </motion.div>
                          ) : isActive ? (
                            <motion.div
                              key="active"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ duration: 0.2 }}
                              className="w-2.5 h-2.5 rounded-full bg-[#047857]"
                            />
                          ) : (
                            <motion.div
                              key="upcoming"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Step Text */}
                    <div
                      className={`mt-1 transition-opacity duration-300 ${isUpcoming ? "opacity-50" : "opacity-100"}`}
                    >
                      <h3 className={isActive ? "auth-sidebar-active" : "auth-sidebar-inactive"}>
                        {step.label}
                      </h3>
                      {isActive && (
                        <p className="text-[13px] font-medium text-white/70 mt-1 leading-relaxed">
                          Enter your details for {step.label.toLowerCase()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col font-medium text-white/60 relative z-10 text-[13px]">
        <span className="mb-1">Need help?</span>
        <a
          href="mailto:support@pharmahub.com"
          className="text-white hover:underline transition-all"
        >
          Contact Support &rarr;
        </a>
      </div>
    </div>
  );
}
