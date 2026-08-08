import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { AuthLayout } from "./components/Shared/AuthLayout";
import { ForgotPasswordForm } from "./components/ForgotPassword/ForgotPasswordForm";

export const handle = { title: "Reset password · PharmaHub" };

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    // We optionally handle resend when sent is true
    await requestPasswordReset(data.email);
    setSent(true);
  };

  const handleResetSentState = () => {
    setSent(false);
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
      />
    </AuthLayout>
  );
}
