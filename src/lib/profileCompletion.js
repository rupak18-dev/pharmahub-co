/**
 * Dynamic Profile Completion Calculator for PharmaHub
 * Calculates completion percentage and lists missing fields based on user & studio profile data.
 */

export const PROFILE_FIELD_SPEC = [
  { key: "name", label: "Full Name", section: "profile-info" },
  { key: "email", label: "Email Address", section: "profile-info" },
  { key: "phone", label: "Phone Number", section: "profile-info" },
  { key: "avatarUrl", label: "Profile Photo", section: "profile-info" },
  { key: "orgName", label: "Studio Name", section: "studio-info" },
  { key: "tagline", label: "Studio Tagline", section: "studio-info" },
  { key: "logoUrl", label: "Studio Logo", section: "studio-info" },
  { key: "description", label: "Studio Description", section: "studio-info" },
  { key: "businessEmail", label: "Business Email", section: "studio-info" },
  { key: "website", label: "Website", section: "studio-info" },
  { key: "address", label: "Registered Address", section: "studio-info" },
  { key: "gstin", label: "GST Number", section: "business-details" },
  { key: "licenseNo", label: "License Number", section: "business-details" },
  { key: "businessType", label: "Business Category", section: "business-details" },
  { key: "branches", label: "Branches", section: "branches" },
  { key: "metaPixelId", label: "Meta Pixel ID", section: "marketing" },
  { key: "socialLinks", label: "Social Links", section: "marketing" },
];

export function calculateProfileCompletion(profile = {}) {
  if (!profile) {
    return {
      percentage: 0,
      completedCount: 0,
      totalCount: PROFILE_FIELD_SPEC.length,
      missingFields: PROFILE_FIELD_SPEC.map((f) => f.label),
      missingSpecs: PROFILE_FIELD_SPEC,
      completedFields: [],
    };
  }

  let completedCount = 0;
  const missingFields = [];
  const missingSpecs = [];
  const completedFields = [];

  for (const field of PROFILE_FIELD_SPEC) {
    const val = profile[field.key];
    let isPresent = false;

    if (field.key === "branches") {
      isPresent = Array.isArray(val) ? val.length > 0 : Boolean(val);
    } else if (field.key === "socialLinks") {
      isPresent =
        Boolean(val) && typeof val === "object"
          ? Object.values(val).some((v) => Boolean(v && v.trim()))
          : Boolean(val);
    } else {
      isPresent = Boolean(val && String(val).trim().length > 0);
    }

    if (isPresent) {
      completedCount++;
      completedFields.push(field.label);
    } else {
      missingFields.push(field.label);
      missingSpecs.push(field);
    }
  }

  const totalCount = PROFILE_FIELD_SPEC.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

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
