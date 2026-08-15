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

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number")
  .regex(/[^A-Za-z0-9]/, "Include a special character");

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
      const created = await signUp({ email: data.email, password: data.password });
      toast.success("Successfully signed up!");
      navigate(created?.onboarded ? "/dashboard" : "/onboarding");
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
