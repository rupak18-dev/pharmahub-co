import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/db";
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const onSubmit = async (data) => {
    try {
      await signIn(data.email, data.password);
      toast.success("Welcome back to PharmaHub");
      navigate("/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign in failed");
    }
  };

  const handleDemoLogin = async () => {
    // Fill credentials and attempt login
    setValue("email", "owner@PharmaHub.demo");
    setValue("password", "demo");

    try {
      await signIn("owner@PharmaHub.demo", "demo");
      toast.success("Welcome to the Demo Workspace!");
      navigate("/dashboard");
    } catch (e) {
      // If demo fails, maybe the DB needs resetting. Let's reset it and try again.
      db.reset();
      try {
        localStorage.removeItem("PharmaHub_session_v1");
      } catch {
        // ignore
      }
      toast.success("Database reset to defaults. Please try logging in again.");
      setTimeout(() => window.location.reload(), 1000);
    }
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
            onDemoClick={handleDemoLogin}
          />
        </motion.div>
      </AnimatePresence>
    </AuthLayout>
  );
}
