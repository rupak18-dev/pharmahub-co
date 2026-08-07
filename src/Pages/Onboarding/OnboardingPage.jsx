import React, { useState, useEffect } from "react";
import { OnboardingLayout } from "./components/OnboardingLayout";
import { BusinessType } from "./steps/BusinessType";
import { PersonalInfo } from "./steps/PersonalInfo";
import { Branding } from "./steps/Branding";
import { WorkspaceSetup } from "./steps/WorkspaceSetup";
import { Completion } from "./steps/Completion";
import { ONBOARDING_STEPS } from "./config/steps";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/Components/ui/alert-dialog";
import { useNavigate } from "react-router";

const STORAGE_KEY = "pharmahub_onboarding_state";

const INITIAL_STATE = {
  businessType: null,
  personal: {},
  workspace: {},
  quickStart: [],
  currentStep: 0,
};

export default function OnboardingPage() {
  const navigate = useNavigate();

  // Initialize state from localStorage or default
  const [onboarding, setOnboarding] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse onboarding state from local storage");
    }
    return INITIAL_STATE;
  });

  const [showExitDialog, setShowExitDialog] = useState(false);

  // Auto-save on every state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(onboarding));
  }, [onboarding]);

  // Handle accidental reload warning natively (optional, but requested exit dialog implies on internal navigation or reload)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (onboarding.currentStep < ONBOARDING_STEPS.length - 1) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [onboarding.currentStep]);

  const updateData = (newData) => {
    setOnboarding((prev) => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    setOnboarding((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
  };

  const prevStep = () => {
    setOnboarding((prev) => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }));
  };

  const handleExit = () => {
    localStorage.removeItem(STORAGE_KEY);
    navigate("/login");
  };

  const safeStepIndex = Math.min(onboarding.currentStep, ONBOARDING_STEPS.length - 1);
  const currentStepData = ONBOARDING_STEPS[safeStepIndex];

  return (
    <>
      <OnboardingLayout currentStep={safeStepIndex}>
        {currentStepData?.id === "business_type" && (
          <BusinessType onboarding={onboarding} updateData={updateData} nextStep={nextStep} />
        )}
        {currentStepData?.id === "personal_info" && (
          <PersonalInfo
            onboarding={onboarding}
            updateData={updateData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        {currentStepData?.id === "branding" && (
          <Branding
            onboarding={onboarding}
            updateData={updateData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        {currentStepData?.id === "workspace" && (
          <WorkspaceSetup
            onboarding={onboarding}
            updateData={updateData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        {currentStepData?.id === "completion" && <Completion />}
      </OnboardingLayout>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave setup?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be lost and you will need to restart the onboarding process.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Setup</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
