import React from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/lib/auth";
import { mapJobTitleToRole } from "@/lib/roles";
import { saveOnboarding } from "@/lib/onboardingApi";
import { apiRequest } from "@/lib/api";
import { CapsuleLoader } from "@/Components/shared/CapsuleLoader";

export function Completion({ onboarding }) {
  const navigate = useNavigate();
  const { updateProfile } = useAuth();

  const personal = onboarding?.personal || {};
  const workspace = onboarding?.workspace || {};
  const name = [personal.firstName, personal.lastName].filter(Boolean).join(" ").trim();
  const orgName = workspace.organizationName?.trim();

  const profileBody = { onboarded: true };
  if (name) profileBody.name = name;
  if (personal.jobTitle) profileBody.role = mapJobTitleToRole(personal.jobTitle);
  if (orgName) profileBody.orgName = orgName;

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
  };

  const stages = [
    {
      id: "workspace",
      label: "Creating your workspace",
      run: () => saveOnboarding(onboardingPayload),
    },
    {
      id: "environment",
      label: "Setting up your environment",
      run: () => apiRequest("/medicines").then(() => {}),
    },
    {
      id: "security",
      label: "Configuring security & permissions",
      run: () => updateProfile(profileBody),
    },
    {
      id: "dashboard",
      label: "Preparing your dashboard",
      run: () => apiRequest("/auth/me").then(() => {}),
    },
  ];

  return (
    <CapsuleLoader
      message={orgName ? `Creating ${orgName}…` : "Creating your workspace…"}
      stages={stages}
      onDone={() => navigate("/dashboard")}
    />
  );
}
