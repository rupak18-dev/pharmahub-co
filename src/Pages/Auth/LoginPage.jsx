import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
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
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [showLoader, setShowLoader] = useState(false);
  const [signedInUser, setSignedInUser] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const afterAuthPath = (currentUser) => (currentUser.onboarded ? "/dashboard" : "/onboarding");

  const onSubmit = async (data) => {
    try {
      const user = await signIn(data.email, data.password);
      setSignedInUser(user);
      toast.success("Successfully logged in!");
      setShowLoader(true);
    } catch (e) {
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
            />
          </motion.div>
        </AnimatePresence>
      </AuthLayout>
      {showLoader && (
        <CapsuleLoader
          message="Signing you in…"
          onDone={() => navigate(signedInUser ? afterAuthPath(signedInUser) : "/dashboard")}
        />
      )}
    </>
  );
}
