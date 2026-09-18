import React from "react";
import { StepHeader } from "../components/StepHeader";
import { BusinessCard } from "../components/BusinessCard";
import { BUSINESS_TYPES } from "../constants/businessTypes";
import { StepNavigation } from "../components/StepNavigation";

export function BusinessType({ onboarding, updateData, nextStep }) {
  const handleSelect = (id) => {
    updateData({ businessType: id });
  };

  return (
    <div>
      <StepHeader
        title="Welcome to PharmaHub"
        subtitle={
          <>
            Let's personalize your workspace.
            <br />
            Choose the option that best describes your business.
          </>
        }
      />

      <div className="mt-8">
        <div className="space-y-6">
          {BUSINESS_TYPES.map((type) => (
            <BusinessCard
              key={type.id}
              title={type.title}
              description={type.description}
              icon={type.icon}
              selected={onboarding.businessType === type.id}
              onClick={() => handleSelect(type.id)}
            />
          ))}
        </div>
      </div>

      <StepNavigation onContinue={nextStep} isNextDisabled={!onboarding.businessType} />
    </div>
  );
}
