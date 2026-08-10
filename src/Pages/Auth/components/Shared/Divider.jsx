import React from "react";

export function Divider() {
  return (
    <div className="relative my-8">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border/60" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-background px-4 font-medium text-muted-foreground">
          Or sign in with email
        </span>
      </div>
    </div>
  );
}
