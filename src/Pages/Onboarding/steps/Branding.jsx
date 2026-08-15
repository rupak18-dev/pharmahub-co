import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { StepHeader } from "../components/StepHeader";
import { StepNavigation } from "../components/StepNavigation";
import { CheckCircle2, Image as ImageIcon, FileText, SkipForward } from "lucide-react";

const MAX_LOGO_DIMENSION = 512;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function downscaleImage(file, maxDim = MAX_LOGO_DIMENSION) {
  const dataUrl = await fileToDataUrl(file);
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  return canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.9);
}

export function Branding({ onboarding, updateData, nextStep, prevStep }) {
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [brochureFile, setBrochureFile] = useState(null);
  const [errors, setErrors] = useState({ logo: "", brochure: "" });

  const logoInputRef = useRef(null);
  const brochureInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const processLogoFile = async (file) => {
    if (!file) return;
    const validExtensions = [".png", ".jpg", ".jpeg", ".svg"];
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const validMimeTypes = ["image/png", "image/jpeg", "image/svg+xml"];

    if (!validMimeTypes.includes(file.type) && !validExtensions.includes(extension)) {
      setErrors((prev) => ({ ...prev, logo: "❌ PNG, JPG or SVG only" }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, logo: "❌ Maximum size: 2 MB" }));
      return;
    }
    setErrors((prev) => ({ ...prev, logo: "" }));
    setLogoFile(file);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoPreview(URL.createObjectURL(file));
    try {
      // SVG is stored as-is (canvas can't reliably rasterize it); raster
      // images are downscaled to keep the stored base64 small.
      const dataUrl =
        file.type === "image/svg+xml" ? await fileToDataUrl(file) : await downscaleImage(file);
      updateData({
        branding: { ...(onboarding.branding || {}), logo: dataUrl },
      });
    } catch {
      setErrors((prev) => ({ ...prev, logo: "❌ Couldn't process this image" }));
    }
  };

  const processBrochureFile = (file) => {
    if (!file) return;
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (file.type !== "application/pdf" && extension !== ".pdf") {
      setErrors((prev) => ({ ...prev, brochure: "❌ PDF only" }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, brochure: "❌ Maximum size: 10 MB" }));
      return;
    }
    setErrors((prev) => ({ ...prev, brochure: "" }));
    setBrochureFile(file);
  };

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
    <div className="relative">
      <button
        type="button"
        onClick={nextStep}
        className="absolute right-0 top-1 z-10 inline-flex h-10 items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-4 text-[14px] font-semibold text-muted-foreground shadow-sm transition-all hover:text-primary hover:border-primary/40"
      >
        <SkipForward className="w-4 h-4" />
        Skip for now
      </button>

      <StepHeader
        title="Branding"
        subtitle="Add your business logo and business brochure to customize your workspace."
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6 mt-8"
      >
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Business Logo */}
          <motion.div
            whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(15,23,42,0.08)" }}
            transition={{ duration: 0.2 }}
            onClick={() => logoInputRef.current?.click()}
            className="bg-white rounded-[20px] border border-[#E5E7EB] shadow-[0_8px_24px_rgba(15,23,42,0.05)] p-6 cursor-pointer hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col justify-between h-[230px] group"
          >
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/svg+xml"
              onChange={(e) => {
                processLogoFile(e.target.files?.[0]);
                e.target.value = "";
              }}
              className="sr-only"
            />

            {!logoFile ? (
              // Before Upload State
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-4 transition-colors group-hover:bg-primary/10">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h3 className="auth-card-title mb-1">Business Logo</h3>
                <div className="text-[13px] text-muted-foreground">
                  {errors.logo ? (
                    <span className="text-red-500 font-medium">{errors.logo}</span>
                  ) : (
                    <span>Upload PNG, JPG or SVG &bull; Max 2 MB</span>
                  )}
                </div>
              </div>
            ) : (
              // After Upload State
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-xl border border-[#E5E7EB] bg-white overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="max-w-full max-h-full object-contain p-1"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5 text-primary">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span className="text-[13px] font-bold">Logo Uploaded</span>
                    </div>
                    <p className="text-[14px] font-medium text-foreground truncate mt-0.5">
                      {logoFile.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-[#E5E7EB] pt-4 mt-auto text-center">
              <span className="text-[14px] font-semibold text-primary group-hover:underline">
                {!logoFile ? "Click to upload" : "Change"}
              </span>
            </div>
          </motion.div>

          {/* Card 2: Business Brochure (Optional) */}
          <motion.div
            whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(15,23,42,0.08)" }}
            transition={{ duration: 0.2 }}
            onClick={() => brochureInputRef.current?.click()}
            className="bg-white rounded-[20px] border border-[#E5E7EB] shadow-[0_8px_24px_rgba(15,23,42,0.05)] p-6 cursor-pointer hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col justify-between h-[230px] group"
          >
            <input
              ref={brochureInputRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                processBrochureFile(e.target.files?.[0]);
                e.target.value = "";
              }}
              className="sr-only"
            />

            {!brochureFile ? (
              // Before Upload State
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-4 transition-colors group-hover:bg-primary/10">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="auth-card-title mb-1">Business Brochure (Optional)</h3>
                <div className="text-[13px] text-muted-foreground">
                  {errors.brochure ? (
                    <span className="text-red-500 font-medium">{errors.brochure}</span>
                  ) : (
                    <span>Upload PDF only &bull; Max 10 MB</span>
                  )}
                </div>
              </div>
            ) : (
              // After Upload State
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-xl border border-[#E5E7EB] bg-[#FEF2F2] flex items-center justify-center flex-shrink-0 shadow-sm text-red-500">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1.5 text-primary">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span className="text-[13px] font-bold">Brochure Uploaded</span>
                    </div>
                    <p className="text-[14px] font-medium text-foreground truncate mt-0.5">
                      {brochureFile.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-[#E5E7EB] pt-4 mt-auto text-center">
              <span className="text-[14px] font-semibold text-primary group-hover:underline">
                {!brochureFile ? "Click to upload" : "Change"}
              </span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex items-start text-[14px] font-medium text-primary bg-primary/5 px-4 py-3 rounded-[12px] border border-primary/10 self-start mt-2"
        >
          <CheckCircle2 className="w-4 h-4 mr-2.5 mt-0.5 flex-shrink-0" />
          <span>You can always update these assets later from Settings.</span>
        </motion.div>
      </motion.div>

      <StepNavigation onBack={prevStep} onContinue={nextStep} isNextDisabled={false} />
    </div>
  );
}
