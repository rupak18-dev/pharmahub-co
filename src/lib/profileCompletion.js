/**
 * Dynamic Profile Completion Calculator for PharmaHub
 * Calculates completion percentage and lists missing fields from the REAL
 * data of the currently logged-in user (personal fields) plus the
 * organization's data (stored on the Owner profile).
 */

export const PROFILE_FIELD_SPEC = [
  { key: "name", label: "Full Name", section: "profile-info", scope: "user" },
  { key: "email", label: "Email Address", section: "profile-info", scope: "user" },
  { key: "phone", label: "Phone Number", section: "profile-info", scope: "either" },
  { key: "avatarUrl", label: "Profile Photo", section: "profile-info", scope: "user" },
  { key: "orgName", label: "Pharma Name", section: "studio-info", scope: "owner" },
  { key: "tagline", label: "Pharma Tagline", section: "studio-info", scope: "owner" },
  { key: "description", label: "Pharma Description", section: "studio-info", scope: "owner" },
  { key: "businessEmail", label: "Business Email", section: "studio-info", scope: "owner" },
  { key: "website", label: "Website", section: "studio-info", scope: "owner" },
  { key: "address", label: "Registered Address", section: "studio-info", scope: "owner" },
  { key: "gstin", label: "GST Number", section: "business-details", scope: "owner" },
  { key: "licenseNo", label: "License Number", section: "business-details", scope: "owner" },
  { key: "businessType", label: "Business Category", section: "business-details", scope: "owner" },
];

const hasValue = (value) => Boolean(value && String(value).trim().length > 0);

export function calculateProfileCompletion(user = {}, owner = {}) {
  const safeUser = user || {};
  const safeOwner = owner || {};

  const valueOf = (field) => {
    if (field.scope === "user") return safeUser[field.key];
    if (field.scope === "either") return safeUser[field.key] || safeOwner[field.key];
    return safeUser[field.key] || safeOwner[field.key];
  };

  let completedCount = 0;
  const missingFields = [];
  const missingSpecs = [];
  const completedFields = [];

  for (const field of PROFILE_FIELD_SPEC) {
    const val = valueOf(field);
    const isPresent = hasValue(val);
    if (isPresent) {
      completedCount++;
      completedFields.push(field.label);
    } else {
      missingFields.push(field.label);
      missingSpecs.push(field);
    }
  }

  const totalCount = PROFILE_FIELD_SPEC.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    percentage,
    completedCount,
    totalCount,
    missingFields,
    missingSpecs,
    completedFields,
    isComplete: percentage === 100,
  };
}
