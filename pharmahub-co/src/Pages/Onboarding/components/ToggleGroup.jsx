import React from "react";
import { Switch } from "@/Components/ui/switch";
import { Label } from "@/Components/ui/label";

export function ToggleGroup({ features, enabledFeatures, onToggle }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {features.map((feature) => {
        const isEnabled = enabledFeatures.includes(feature);
        return (
          <div
            key={feature}
            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
              isEnabled ? "border-primary/20 bg-primary/5" : "border-border bg-background"
            }`}
          >
            <Label htmlFor={feature} className="text-sm font-bold cursor-pointer">
              {feature}
            </Label>
            <Switch id={feature} checked={isEnabled} onCheckedChange={() => onToggle(feature)} />
          </div>
        );
      })}
    </div>
  );
}
