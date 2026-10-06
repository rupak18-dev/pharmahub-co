import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StepHeader } from "../components/StepHeader";
import { StepNavigation } from "../components/StepNavigation";
import { InputField } from "@/Pages/Auth/components/Shared/InputField";
import { LocationAutocomplete } from "../components/LocationAutocomplete";
import { BUSINESS_CONFIG } from "../config/businessConfig";
import { ChevronDown, ChevronUp } from "lucide-react";

export function WorkspaceSetup({ onboarding, updateData, nextStep, prevStep }) {
  const workspace = onboarding.workspace || {};

  // Dynamic Content based on Business Type
  const getDynamicContent = (type) => {
    const placeholderByType = {
      dealer: "ABC Pharma Distributors",
      hospital: "Sunrise Hospital",
      enterprise: "Apollo Healthcare",
      retail: "ABC Medical Store",
    };
    const locationPlaceholderByType = {
      dealer: "Central Warehouse",
      hospital: "Main Campus",
      enterprise: "Headquarters",
      retail: "Main Branch",
    };
    return {
      businessNamePlaceholder: placeholderByType[type] || "ABC Medical Store",
      branchLabel: (
        <span>
          Location <span className="text-red-500">*</span>
        </span>
      ),
      branchPlaceholder: locationPlaceholderByType[type] || "Main Branch",
    };
  };

  const dynamicContent = getDynamicContent(onboarding.businessType);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (e) => {
    updateData({
      workspace: { ...workspace, [e.target.name]: e.target.value },
    });
  };

  const isFormValid = workspace.organizationName?.trim() && workspace.branchName?.trim();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div>
      <StepHeader
        title="Organization Setup"
        subtitle="A few final details before you're ready to go."
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8 mt-8"
      >
        <motion.div variants={itemVariants}>
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] shadow-[0_8px_24px_rgba(15,23,42,0.05)] p-[28px] transition-shadow duration-300">
            <h2 className="auth-section-title mb-6">Organization Details</h2>

            <div className="space-y-6">
              <div>
                <InputField
                  id="organizationName"
                  name="organizationName"
                  label={
                    <span>
                      Business Name <span className="text-red-500">*</span>
                    </span>
                  }
                  value={workspace.organizationName || ""}
                  onChange={handleChange}
                  placeholder={dynamicContent.businessNamePlaceholder}
                  className="h-12 rounded-[18px] text-[15px] border-2 shadow-sm"
                  labelClassName="auth-label mb-1.5 block"
                />
              </div>

              <div>
                <LocationAutocomplete
                  id="branchName"
                  label={dynamicContent.branchLabel}
                  value={workspace.branchName || ""}
                  onChange={(value) =>
                    updateData({ workspace: { ...workspace, branchName: value } })
                  }
                  placeholder={dynamicContent.branchPlaceholder}
                  className="h-12 rounded-[18px] text-[15px] border-2 shadow-sm"
                  labelClassName="auth-label mb-1.5 block"
                />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <span className="mr-2 text-base font-semibold">Advanced Details</span>
                  {showAdvanced ? (
                    <ChevronUp className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                  ) : (
                    <ChevronDown className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                  )}
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-6 space-y-6">
                        <div>
                          <InputField
                            id="drugLicenseNumber"
                            name="drugLicenseNumber"
                            label="Drug License Number"
                            value={workspace.drugLicenseNumber || ""}
                            onChange={handleChange}
                            placeholder="DL-XXXXXXXX"
                            className="h-12 rounded-[18px] text-[15px] border-2 shadow-sm"
                            labelClassName="auth-label mb-1.5 block"
                          />
                        </div>

                        <div>
                          <InputField
                            id="gstNumber"
                            name="gstNumber"
                            label="GST Number"
                            value={workspace.gstNumber || ""}
                            onChange={handleChange}
                            placeholder="22AAAAA0000A1Z5"
                            className="h-12 rounded-[18px] text-[15px] border-2 shadow-sm"
                            labelClassName="auth-label mb-1.5 block"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="mt-8 flex flex-col space-y-5">
        <p className="text-[14px] text-muted-foreground">
          You can update these details later in Settings.
        </p>

        <StepNavigation
          onBack={prevStep}
          onContinue={nextStep}
          isNextDisabled={!isFormValid}
          nextLabel="Launch PharmaHub"
        />
      </div>
    </div>
  );
}
