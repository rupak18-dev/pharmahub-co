import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { SignupForm } from "./components/Shared/SignupForm";
import { VerifyEmailForm } from "./components/Shared/VerifyEmailForm";
import { AuthLayout } from "./components/Shared/AuthLayout";
import { AnimatePresence, motion } from "framer-motion";

export const handle = { title: "Create account · PharmaHub" };

const schema = z
  .object({
    email: z.string().trim().email("Enter a valid email"),
    password: z.string().min(6, "At least 6 characters"),
    confirm: z.string().min(6, "Confirm your password"),
    terms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the Terms and Privacy Policy" }),
    }),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState("signup");
  const [userEmail, setUserEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    // We only simulate proceeding to the next UI state per the requirements
    setUserEmail(data.email);
    setStep("verify-email");
    // We do not call signUp or hit the backend yet.
  };

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {step === "signup" ? (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full"
          >
            <SignupForm
              onSubmit={handleSubmit(onSubmit)}
              register={register}
              errors={errors}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        ) : (
          <motion.div
            key="verify-email"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full"
          >
            <VerifyEmailForm email={userEmail} onBack={() => setStep("signup")} />
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
