import React, { useState } from "react";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export const PasswordField = React.forwardRef(
  ({ id, label, error, labelClassName, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-2">
        <Label htmlFor={id} className={labelClassName || "text-sm font-medium text-foreground"}>
          {label}
        </Label>
        <div className="relative">
          <Input
            id={id}
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={`h-11 bg-background border-input focus-visible:ring-primary focus-visible:border-primary pr-10 transition-all duration-200 shadow-sm ${
              error ? "border-destructive focus-visible:ring-destructive" : ""
            }`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            <span className="sr-only">Toggle password visibility</span>
          </button>
        </div>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    );
  },
);
PasswordField.displayName = "PasswordField";
