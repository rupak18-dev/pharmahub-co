import React from "react";
import { Label } from "@/Components/ui/label";

export function TermsCheckbox({ error, ...props }) {
  return (
    <div className="space-y-2 mt-4 mb-6">
      <div className="flex items-start space-x-2.5">
        <input
          type="checkbox"
          id="terms"
          className="mt-1 h-4 w-4 rounded border-[#e2e8f0] text-primary focus:ring-primary cursor-pointer accent-[#007a5a]"
          {...props}
        />
        <Label
          htmlFor="terms"
          className="text-sm text-muted-foreground leading-relaxed font-normal cursor-pointer select-none"
        >
          I agree to the{" "}
          <a href="#" className="font-medium text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="font-medium text-primary hover:underline">
            Privacy Policy
          </a>
          .
        </Label>
      </div>
      {error && <p className="text-xs text-destructive mt-1.5 font-medium">{error}</p>}
    </div>
  );
}
