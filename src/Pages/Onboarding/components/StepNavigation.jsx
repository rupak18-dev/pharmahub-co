import React from "react";
import { Button } from "@/Components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function StepNavigation({ onBack, onContinue, isNextDisabled, nextLabel = "Continue" }) {
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
      <div>
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground h-12 rounded-full px-6 font-bold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
      </div>
      <Button
        type="button"
        onClick={onContinue}
        disabled={isNextDisabled}
        className="h-[54px] w-auto min-w-[180px] rounded-2xl text-[16px] font-semibold px-8 shadow-[0_4px_14px_rgba(5,150,105,0.15)] hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(5,150,105,0.25)] transition-all duration-300 bg-primary hover:bg-[#047857] text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center whitespace-nowrap"
      >
        {nextLabel}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
