import React from "react";

const RULES = [
  { label: "at least 8 characters", test: (v) => v.length >= 8 },
  { label: "a lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "a number", test: (v) => /[0-9]/.test(v) },
  { label: "a special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function PasswordStrength({ value }) {
  if (!value) return null;

  const passed = RULES.filter((r) => r.test(value)).length;

  if (passed >= 3) return null;

  const missing = RULES.filter((r) => !r.test(value)).map((r) => r.label);
  const tip = missing
    .map((m, i) => (i === missing.length - 1 && missing.length > 1 ? `and ${m}` : m))
    .join(", ");

  return (
    <p className="mt-1 text-xs text-muted-foreground">
      Tip: add {tip} to make your password stronger.
    </p>
  );
}
