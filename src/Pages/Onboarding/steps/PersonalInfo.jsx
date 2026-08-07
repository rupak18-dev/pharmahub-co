import React, { useState } from "react";
import { StepHeader } from "../components/StepHeader";
import { StepNavigation } from "../components/StepNavigation";
import { InputField } from "@/Pages/Auth/components/Shared/InputField";
import { BUSINESS_CONFIG } from "../config/businessConfig";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/Components/ui/command";
import {
  Check,
  ChevronDown,
  User,
  Pill,
  Store,
  Receipt,
  Package,
  Warehouse,
  ShoppingCart,
  TrendingUp,
  Settings,
  Shield,
  Monitor,
  Building,
  Users,
  Briefcase,
} from "lucide-react";

const ICON_MAP = {
  User,
  Pill,
  Store,
  Receipt,
  Package,
  Warehouse,
  ShoppingCart,
  TrendingUp,
  Settings,
  Shield,
  Monitor,
  Building,
  Users,
  Briefcase,
};

export function PersonalInfo({ onboarding, updateData, nextStep, prevStep }) {
  const config = BUSINESS_CONFIG[onboarding.businessType] || BUSINESS_CONFIG["retail"];
  const personal = onboarding.personal || {};
  const [open, setOpen] = useState(false);

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === "phone") {
      value = value.replace(/\D/g, "");
      if (value.length > 10) {
        value = value.slice(0, 10);
      }
    }

    updateData({
      personal: { ...personal, [name]: value },
    });
  };

  const handleRoleSelect = (roleLabel) => {
    updateData({
      personal: { ...personal, jobTitle: roleLabel },
    });
    setOpen(false);
  };

  const isFormValid =
    personal.firstName?.trim() &&
    personal.lastName?.trim() &&
    personal.phone?.length === 10 &&
    personal.jobTitle;

  // Find the selected role object to display its icon
  const selectedRoleObj = config.jobTitles.find((r) => r.label === personal.jobTitle);
  const SelectedIcon = selectedRoleObj ? ICON_MAP[selectedRoleObj.icon] || User : null;

  return (
    <div>
      <StepHeader
        title="Set Up Your Profile"
        subtitle="We'll use this information to personalize your PharmaHub workspace."
      />

      <div className="space-y-5 mt-8">
        <div className="grid grid-cols-2 gap-4">
          <InputField
            id="firstName"
            name="firstName"
            label={
              <span>
                First Name <span className="text-red-500">*</span>
              </span>
            }
            value={personal.firstName || ""}
            onChange={handleChange}
            placeholder="John"
            className="h-12 rounded-[18px] text-[15px] border-2 shadow-sm"
            labelClassName="auth-label mb-1.5 block"
          />
          <InputField
            id="lastName"
            name="lastName"
            label={
              <span>
                Last Name <span className="text-red-500">*</span>
              </span>
            }
            value={personal.lastName || ""}
            onChange={handleChange}
            placeholder="Doe"
            className="h-12 rounded-[18px] text-[15px] border-2 shadow-sm"
            labelClassName="auth-label mb-1.5 block"
          />
        </div>

        <div className="space-y-2">
          <label className="auth-label mb-1.5 block">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center shadow-sm rounded-[18px] border-2 border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary transition-all duration-200 overflow-hidden">
            <div className="flex-shrink-0 h-12 w-[90px] flex items-center justify-center bg-muted/20 text-[14px] font-medium text-foreground cursor-default border-r border-input">
              <span className="mr-1">🇮🇳</span> +91
            </div>
            <input
              type="tel"
              name="phone"
              maxLength={10}
              value={personal.phone || ""}
              onChange={handleChange}
              placeholder="9876543210"
              className="flex-1 h-12 bg-transparent pl-4 pr-4 py-2 text-[15px] outline-none border-none focus:ring-0 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2 relative">
          <label className="auth-label mb-1.5 block">
            Job Title <span className="text-red-500">*</span>
          </label>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`flex items-center justify-between h-12 w-full rounded-[18px] border-2 border-input bg-background px-4 py-2 text-[15px] shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                  !personal.jobTitle ? "text-muted-foreground" : "text-foreground font-medium"
                }`}
              >
                {personal.jobTitle && SelectedIcon ? (
                  <div className="flex items-center">
                    <SelectedIcon className="w-4 h-4 mr-2.5 text-primary" />
                    {personal.jobTitle}
                  </div>
                ) : (
                  "What best describes your role?"
                )}
                <ChevronDown className="w-4 h-4 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-1.5 rounded-[16px] shadow-xl border-border bg-popover z-[100]"
              align="start"
              sideOffset={8}
            >
              <Command className="bg-transparent">
                <CommandInput
                  placeholder="Search roles..."
                  className="text-[14px] border-none focus:ring-0"
                />
                <CommandList className="max-h-[220px] overflow-y-auto mt-1 p-1">
                  <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                    No role found.
                  </CommandEmpty>
                  <CommandGroup>
                    {config.jobTitles.map((role) => {
                      const Icon = ICON_MAP[role.icon] || User;
                      const isSelected = personal.jobTitle === role.label;

                      return (
                        <CommandItem
                          key={role.label}
                          value={role.label}
                          onSelect={() => handleRoleSelect(role.label)}
                          className={`flex items-center px-3 py-2.5 rounded-xl cursor-pointer text-[14px] transition-all duration-200 ${
                            isSelected
                              ? "bg-[#ECFDF5] text-primary font-medium data-[selected=true]:bg-[#ECFDF5] data-[selected=true]:text-primary"
                              : "text-foreground data-[selected=true]:bg-[#F8FAFC] data-[selected=true]:text-foreground"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 mr-3 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                          />
                          {role.label}
                          {isSelected && <Check className="w-4 h-4 ml-auto text-primary" />}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <p className="text-[11px] text-muted-foreground/80 font-medium pl-1 mt-1.5">
            Used for assigning permissions later.
          </p>
        </div>
      </div>

      <StepNavigation onBack={prevStep} onContinue={nextStep} isNextDisabled={!isFormValid} />
    </div>
  );
}
