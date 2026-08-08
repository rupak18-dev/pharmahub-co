import React from "react";
import { StepHeader } from "../components/StepHeader";
import { StepNavigation } from "../components/StepNavigation";
import { FeatureCard } from "../components/FeatureCard";
import { BUSINESS_CONFIG } from "../config/businessConfig";

export function QuickStart({ onboarding, updateData, nextStep, prevStep }) {
  const config = BUSINESS_CONFIG[onboarding.businessType] || BUSINESS_CONFIG["retail"];
  const quickStart = onboarding.quickStart || [];

  const handleToggle = (id) => {
    const newQuickStart = quickStart.includes(id)
      ? quickStart.filter((itemId) => itemId !== id)
      : [...quickStart, id];

    updateData({ quickStart: newQuickStart });
  };

  return (
    <div>
      <StepHeader
        title="What would you like to do first?"
        subtitle="Select the tasks you want to tackle initially. We'll set up your dashboard accordingly."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        {config.quickActions.map((action) => (
          <FeatureCard
            key={action.id}
            title={action.title}
            description={action.description}
            selected={quickStart.includes(action.id)}
            onClick={() => handleToggle(action.id)}
          />
        ))}
      </div>

      <StepNavigation
        onBack={prevStep}
        onContinue={nextStep}
        isNextDisabled={quickStart.length === 0}
      />
    </div>
  );
}
