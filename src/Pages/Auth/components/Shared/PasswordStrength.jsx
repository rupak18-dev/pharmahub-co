import React from "react";
import { Check, X } from "lucide-react";

const RULES = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "An uppercase letter (A-Z)", test: (v) => /[A-Z]/.test(v) },
  { label: "A lowercase letter (a-z)", test: (v) => /[a-z]/.test(v) },
  { label: "A number (0-9)", test: (v) => /[0-9]/.test(v) },
  { label: "A special character (!@#$...)", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function PasswordStrength({ value }) {
  if (!value) return null;
  const passed = RULES.filter((r) => r.test(value)).length;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              passed === RULES.length
                ? "bg-emerald-500"
                : passed >= 3
                  ? "bg-amber-500"
                  : "bg-red-500"
            }`}
            style={{ width: `${(passed / RULES.length) * 100}%` }}
          />
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          {passed}/{RULES.length}
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-1">
        {RULES.map((rule) => {
          const ok = rule.test(value);
          return (
            <li
              key={rule.label}
              className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/70"
              }`}
            >
              {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
