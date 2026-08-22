import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AuthLayout } from "./components/Shared/AuthLayout";
import { ForgotPasswordForm } from "./components/ForgotPassword/ForgotPasswordForm";

export const handle = { title: "Reset password · PharmaHub" };

const emailSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

// Mirrors the backend's passwordSchema so users get feedback before the API call.
const resetSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[0-9]/, "Include a number")
      .regex(/[^A-Za-z0-9]/, "Include a special character"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const { requestPasswordReset, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownTimer = useRef(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(emailSchema) });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: resetSubmitting },
  } = useForm({ resolver: zodResolver(resetSchema) });

  const stopCooldown = useCallback(() => {
    if (cooldownTimer.current) {
      clearInterval(cooldownTimer.current);
      cooldownTimer.current = null;
    }
  }, []);

  const startCooldown = useCallback(() => {
    stopCooldown();
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownTimer.current = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) {
          stopCooldown();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, [stopCooldown]);

  useEffect(() => stopCooldown, [stopCooldown]);

  const onSubmit = async (data) => {
    try {
      await requestPasswordReset(data.email);
      setSent(true);
      startCooldown();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't send the reset code");
    }
  };

  const handleResend = async () => {
    try {
      await requestPasswordReset(getValues("email"));
      startCooldown();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't resend the code");
    }
  };

  const onResetSubmit = async (values) => {
    try {
      await resetPassword({
        email: getValues("email"),
        code: values.code,
        newPassword: values.newPassword,
      });
      toast.success("Password updated — sign in with your new password");
      navigate("/login");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't reset the password");
    }
  };

  const handleResetSentState = () => {
    setSent(false);
    stopCooldown();
  };

  return (
    <AuthLayout>
      <ForgotPasswordForm
        onSubmit={handleSubmit(onSubmit)}
        register={register}
        errors={errors}
        isSubmitting={isSubmitting}
        sent={sent}
        email={getValues("email")}
        onResetSentState={handleResetSentState}
        codeField={registerReset("code")}
        resetRegister={registerReset}
        resetErrors={resetErrors}
        onResetSubmit={handleResetSubmit(onResetSubmit)}
        resetSubmitting={resetSubmitting}
        resendCooldown={resendCooldown}
        onResend={handleResend}
      />
    </AuthLayout>
  );
}
