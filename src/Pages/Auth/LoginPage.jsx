import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AuthLayout } from "./components/Shared/AuthLayout";
import { LoginForm } from "./components/Login/LoginForm";
import { motion, AnimatePresence } from "framer-motion";

export const handle = { title: "Sign in · PharmaHub" };

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const afterAuthPath = (currentUser) => (currentUser.onboarded ? "/dashboard" : "/onboarding");

  useEffect(() => {
    if (user) navigate(afterAuthPath(user));
  }, [user, navigate]);

  const onSubmit = async (data) => {
    try {
      const signedIn = await signIn(data.email, data.password);
      toast.success("Welcome back to PharmaHub");
      navigate(afterAuthPath(signedIn));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign in failed");
    }
  };

  const handleGoogleClick = () => {
    toast.info("Google sign-in is coming soon");
  };

  return (
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
  );
}
