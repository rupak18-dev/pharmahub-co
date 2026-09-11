import React from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/lib/auth";

import { saveOnboarding, markComplete } from "@/lib/onboardingApi";
import { apiRequest } from "@/lib/api";
import { CapsuleLoader } from "@/Components/shared/CapsuleLoader";

export function Completion({ onboarding }) {
  const navigate = useNavigate();
  const { user, updateProfile, restoreSession } = useAuth();

  const personal = onboarding?.personal || {};
  const workspace = onboarding?.workspace || {};
  const orgName = workspace.organizationName?.trim();

  // Never send `name` here: the wizard's personal fields may carry stale or
  // cross-account data, and writing them would rename the authenticated
  // account. Names are set at signup and edited on the Profile page only.
  //
  // Role is never sent either — a user's role is owned by the backend
  // (Owner assignment or invitation), never by wizard input.
  const profileBody = { onboarded: true };
  // Only the Owner establishes an organization; invited staff must keep the
  // organization they were invited into.
  if (user?.role === "Owner" && orgName) profileBody.orgName = orgName;

  const onboardingPayload = {
    ...(onboarding.businessType ? { businessType: onboarding.businessType } : {}),
    ...(Object.keys(personal).length ? { personal } : {}),
    ...(Object.keys(workspace).length ? { workspace } : {}),
    ...(onboarding.branding && Object.keys(onboarding.branding).length
      ? { branding: onboarding.branding }
      : {}),
    ...(Array.isArray(onboarding.quickStart) && onboarding.quickStart.length
      ? { quickStart: onboarding.quickStart }
      : {}),
    completedAt: new Date().toISOString(),
    // Redundant completion signal: the backend flips User.onboarded when the
    // onboarding payload carries this flag, even if the profile call fails.
    onboarded: true,
  };

  // Persist the local per-user completion marker FIRST, before any fallible
  // network work. The routing guards (AppLayout / OnboardingPage) treat it as
  // the client-side source of truth, so even if a later stage fails on the
  // server a refresh stays on /dashboard instead of bouncing back to
  // /onboarding. handleDone re-writes it idempotently before navigating.
  const stages = [
    {
      id: "completion-marker",
      label: "Marking onboarding complete",
      run: () => markComplete(user?.id),
    },
    {
      id: "workspace",
      label: "Creating your workspace",
      run: () =>
        saveOnboarding(onboardingPayload).catch((error) => {
          console.error("[onboarding] stage 'workspace' failed:", error);
        }),
    },
    {
      id: "environment",
      label: "Setting up your environment",
      run: () =>
        apiRequest("/medicines")
          .then(() => {})
          .catch((error) => {
            console.error("[onboarding] stage 'environment' failed:", error);
          }),
    },
    {
      id: "security",
      label: "Configuring security & permissions",
      run: () =>
        updateProfile(profileBody).catch((error) => {
          console.error("[onboarding] stage 'security' failed:", error);
        }),
    },
    {
      id: "dashboard",
      label: "Preparing your dashboard",
      run: () =>
        restoreSession().catch((error) => {
          console.error("[onboarding] stage 'dashboard' failed:", error);
        }),
    },
  ];

  const handleDone = () => {
    markComplete(user?.id);
    navigate("/dashboard");
  };

  return (
    <CapsuleLoader
      message={orgName ? `Creating ${orgName}…` : "Creating your workspace…"}
      stages={stages}
      onDone={handleDone}
    />
  );
}
