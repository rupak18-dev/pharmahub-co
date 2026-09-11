import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { isOnboarded } from "@/lib/onboardingApi";
import { API_BASE } from "@/lib/api";
import { AuthLayout } from "./components/Shared/AuthLayout";
import { LoginForm } from "./components/Login/LoginForm";
import { CapsuleLoader } from "@/Components/shared/CapsuleLoader";
import { motion, AnimatePresence } from "framer-motion";

export const handle = { title: "Sign in · PharmaHub" };

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLoader, setShowLoader] = useState(false);
  const [signedInUser, setSignedInUser] = useState(null);
  const [remember, setRemember] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    // Prefill the email the user just verified (or the one that failed with
    // email_not_verified) so they don't re-type it.
    defaultValues: location.state?.email ? { email: location.state.email } : undefined,
  });

  // Completed accounts land on the dashboard; fresh accounts that have not
  // finished onboarding are sent through the onboarding flow first.
  const afterAuthPath = (user) => (isOnboarded(user) ? "/dashboard" : "/onboarding");

  const onSubmit = async (data) => {
    try {
      const user = await signIn(data.email, data.password, { remember });
      setSignedInUser(user);
      toast.success("Successfully logged in!");
      setShowLoader(true);
    } catch (e) {
      // The backend blocks unverified self-registered accounts with a
      // machine-readable code — send them to the verify step instead of
      // showing a generic credentials failure.
      if (e?.data?.error?.details?.code === "email_not_verified") {
        toast.error("Please verify your email before signing in");
        navigate("/verify-email", { state: { email: data.email } });
        return;
      }
      toast.error(e instanceof Error ? e.message : "Sign in failed");
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
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full"
          >
            <LoginForm
              onSubmit={handleSubmit(onSubmit)}
              register={register}
              errors={errors}
              isSubmitting={isSubmitting}
              onGoogleClick={handleGoogleClick}
              remember={remember}
              onRememberChange={setRemember}
            />
          </motion.div>
        </AnimatePresence>
      </AuthLayout>

      {showLoader && (
        <CapsuleLoader
          minimumMs={isOnboarded(signedInUser) ? 1600 : 1200}
          variant={isOnboarded(signedInUser) ? "capsule" : "circular"}
          message={isOnboarded(signedInUser) ? "Preparing your dashboard…" : "Signing you in…"}
          onDone={() => navigate(signedInUser ? afterAuthPath(signedInUser) : "/dashboard")}
        />
      )}
    </>
  );
}
