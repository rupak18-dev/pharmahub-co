import React from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { API_BASE } from "@/lib/api";
import { SignupForm } from "./components/Shared/SignupForm";
import { AuthLayout } from "./components/Shared/AuthLayout";
import { AnimatePresence, motion } from "framer-motion";

export const handle = { title: "Create account · PharmaHub" };

const PASSWORD_RULES = [
  { label: "at least 8 characters", test: (v) => v.length >= 8 },
  { label: "a lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "a number", test: (v) => /[0-9]/.test(v) },
  { label: "a special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const passwordSchema = z
  .string()
  .min(1)
  .refine((v) => PASSWORD_RULES.filter((r) => r.test(v)).length >= 3, {
    message:
      "Use at least 8 characters with a lowercase letter, a number, and a special character.",
  });

const schema = z
  .object({
    email: z.string().trim().email("Enter a valid email"),
    password: passwordSchema,
    confirm: z.string().min(8, "Confirm your password"),
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

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const passwordValue = watch("password");

  const onSubmit = async (data) => {
    try {
      const { devCode } = await signUp({ email: data.email, password: data.password });
      // Keep the button in its "Signing up…" state for a beat before moving on.
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // New self-registered accounts MUST verify their email before first
      // login (the backend issues no session until verified). Route to the
      // verify-email step — never straight to onboarding.
      if (devCode) toast.info(`Dev code (no email configured): ${devCode}`);
      navigate("/verify-email", { state: { email: data.email, devCode } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Account creation failed");
    }
  };

  const handleGoogleClick = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <>
      <AuthLayout>
        <AnimatePresence mode="wait">
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
              passwordValue={passwordValue}
              onGoogleClick={handleGoogleClick}
            />
          </motion.div>
        </AnimatePresence>
      </AuthLayout>
    </>
  );
}
