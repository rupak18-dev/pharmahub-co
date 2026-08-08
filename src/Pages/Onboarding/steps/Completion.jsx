import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { Check, Loader2 } from "lucide-react";

export function Completion() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const steps = ["Configuring organization", "Preparing dashboard", "Applying business settings"];

  useEffect(() => {
    // Reveal step 1 after 0.5s
    const t1 = setTimeout(() => setActiveStep(1), 500);
    // Reveal step 2 after 1.2s
    const t2 = setTimeout(() => setActiveStep(2), 1200);
    // Reveal step 3 after 1.9s
    const t3 = setTimeout(() => setActiveStep(3), 1900);
    // Complete sequence after 2.6s
    const t4 = setTimeout(() => setActiveStep(4), 2600);
    // Navigate after 3.2s
    const t5 = setTimeout(() => {
      window.location.href = "/dashboard";
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [navigate]);

  return (
    <div className="flex flex-col justify-center min-h-[60vh] max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="auth-title mb-8">
          {activeStep < 4 ? "Creating your workspace..." : "Launching PharmaHub..."}
        </h1>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = activeStep > index;
            const isActive = activeStep === index;
            const isPending = activeStep < index;

            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: isPending ? 0 : 1,
                  x: isPending ? -10 : 0,
                  color: isCompleted ? "#059669" : isActive ? "#0F172A" : "#94A3B8",
                }}
                transition={{ duration: 0.3 }}
                className="flex items-center space-x-3 text-[16px] font-medium"
              >
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check className="w-5 h-5 text-primary" strokeWidth={3} />
                    </motion.div>
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Loader2 className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  )}
                </div>
                <span>{step}</span>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}
