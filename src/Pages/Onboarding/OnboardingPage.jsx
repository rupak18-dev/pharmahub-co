import React, { useState, useEffect, useRef } from "react";
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
import { FullScreenSkeleton } from "@/Components/shared/PageSkeleton";
import {
  getOnboarding,
  saveOnboarding,
  isOnboarded,
  resetOnboardingStorage,
} from "@/lib/onboardingApi";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router";

const INITIAL_STATE = {
  businessType: null,
  personal: {},
  workspace: {},
  branding: {},
  quickStart: [],
  currentStep: 0,
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [onboarding, setOnboarding] = useState(INITIAL_STATE);
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login");
    else if (isOnboarded(user) && onboarding.currentStep < ONBOARDING_STEPS.length - 1)
      navigate("/dashboard");
  }, [user, loading, navigate, onboarding.currentStep]);

  // Hydrate saved progress — but only for an account that has NOT yet
  // completed onboarding AND where this is genuinely its own in-progress data
  // is impossible to know locally once a server is involved. To guarantee the
  // onboarding form always shows for a fresh account (never inheriting a
  // previous user's progress, which previously jumped straight to the
  // dashboard), a non-onboarded user always starts clean at step 0.
  //
  // `lastUserIdRef` prevents background user syncs (e.g. window focus →
  // /auth/me → setUser) from re-running the full hydration and resetting
  // an in-progress wizard back to step 0. Only initial mount and actual
  // user-ID changes trigger hydration.
  const hydratedRef = useRef(false);
  const lastUserIdRef = useRef(null);
  useEffect(() => {
    if (loading) return;
    // Skip if we've already hydrated for this exact user — the user object
    // reference changes on every background sync but the ID stays the same.
    if (hydratedRef.current && lastUserIdRef.current === user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        if (!isOnboarded(user)) {
          resetOnboardingStorage();
          if (cancelled) return;
          setOnboarding(INITIAL_STATE);
          hydratedRef.current = true;
          lastUserIdRef.current = user?.id ?? null;
          return;
        }
        const remote = await getOnboarding();
        if (cancelled || !remote) return;
        setOnboarding({
          businessType: remote.businessType ?? null,
          personal: { ...(remote.personal || {}) },
          workspace: { ...(remote.workspace || {}) },
          branding: { ...(remote.branding || {}) },
          quickStart: Array.isArray(remote.quickStart) ? remote.quickStart : [],
          currentStep: Number.isInteger(remote.currentStep) ? remote.currentStep : 0,
        });
      } catch {
        // Backend unreachable — stay on defaults.
      } finally {
        hydratedRef.current = true;
        lastUserIdRef.current = user?.id ?? null;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  // Auto-save to the backend after a debounce.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const payload = {
      ...(onboarding.businessType ? { businessType: onboarding.businessType } : {}),
      ...(onboarding.personal && Object.keys(onboarding.personal).length
        ? { personal: onboarding.personal }
        : {}),
      ...(onboarding.workspace && Object.keys(onboarding.workspace).length
        ? { workspace: onboarding.workspace }
        : {}),
      ...(onboarding.branding && Object.keys(onboarding.branding).length
        ? { branding: onboarding.branding }
        : {}),
      ...(onboarding.quickStart && onboarding.quickStart.length
        ? { quickStart: onboarding.quickStart }
        : {}),
      currentStep: onboarding.currentStep,
    };
    const timer = setTimeout(() => {
      saveOnboarding(payload).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
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
    navigate("/login");
  };

  const safeStepIndex = Math.min(onboarding.currentStep, ONBOARDING_STEPS.length - 1);
  const currentStepData = ONBOARDING_STEPS[safeStepIndex];

  if (loading) return <FullScreenSkeleton />;
  if (!user) return null;

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
        {currentStepData?.id === "completion" && <Completion onboarding={onboarding} />}
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
