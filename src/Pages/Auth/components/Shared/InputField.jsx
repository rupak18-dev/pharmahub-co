import React from "react";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { cn } from "@/lib/utils";

export const InputField = React.forwardRef(
  ({ id, label, error, labelClassName, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <Label htmlFor={id} className={labelClassName || "text-sm font-medium text-foreground"}>
          {label}
        </Label>
        <Input
          id={id}
          ref={ref}
          className={cn(
            "h-11 bg-background border-input focus-visible:ring-primary focus-visible:border-primary transition-all duration-200 shadow-sm",
            error ? "border-destructive focus-visible:ring-destructive" : "",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    );
  },
);
InputField.displayName = "InputField";
