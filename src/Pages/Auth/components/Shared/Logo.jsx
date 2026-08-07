import React from "react";
import { Activity } from "lucide-react";

export function Logo({ isWhite }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-xl shadow-md ${
          isWhite ? "bg-white text-primary" : "bg-primary text-primary-foreground shadow-primary/20"
        }`}
      >
        <Activity className="w-6 h-6" />
      </div>
      <span
        className={`text-xl font-bold tracking-tight ${isWhite ? "text-white" : "text-foreground"}`}
      >
        PharmaHub
      </span>
    </div>
  );
}
