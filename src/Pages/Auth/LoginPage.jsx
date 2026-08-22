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

const demoLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

export default function LoginPage() {
  const { signIn, demoLoginRequest } = useAuth();
  const navigate = useNavigate();
  const [showLoader, setShowLoader] = useState(false);
  const [signedInUser, setSignedInUser] = useState(null);
  const [remember, setRemember] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const {
    register: demoRegister,
    handleSubmit: handleDemoSubmit,
    formState: { errors: demoErrors },
    reset: resetDemoForm,
  } = useForm({ resolver: zodResolver(demoLoginSchema) });

  const afterAuthPath = (currentUser) => (currentUser.onboarded ? "/dashboard" : "/onboarding");

  const onSubmit = async (data) => {
    try {
      const user = await signIn(data.email, data.password, { remember });
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

  const onDemoSubmit = async (data) => {
    setDemoSubmitting(true);
    try {
      await demoLoginRequest(data.email);
      setDemoEmailSent(true);
      toast.success("Demo login link sent! Check your inbox.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send demo login link");
    } finally {
      setDemoSubmitting(false);
    }
  };

  const openDemoModal = () => {
    setShowDemoModal(true);
    setDemoEmailSent(false);
    resetDemoForm();
  };

  const closeDemoModal = () => {
    setShowDemoModal(false);
    setDemoEmailSent(false);
    resetDemoForm();
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

      {/* Demo Login Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-background rounded-2xl shadow-xl border border-border/40 p-8"
          >
            {!demoEmailSent ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">Demo Login</h2>
                  <button
                    onClick={closeDemoModal}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    type="button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Enter your email to receive a secure login link. No password required.
                </p>
                <form onSubmit={handleDemoSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      EMAIL
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full h-12 px-4 rounded-xl border-2 border-border/60 bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
                      {...demoRegister("email")}
                    />
                    {demoErrors.email && (
                      <p className="text-xs text-destructive mt-1">{demoErrors.email.message}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={demoSubmitting}
                    className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:bg-primary/90 disabled:opacity-50"
                  >
                    {demoSubmitting ? "Sending..." : "Send Demo Login Link"}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Check your inbox</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  We sent a demo login link to your email. Click the link to access PharmaHub.
                </p>
                <button
                  onClick={closeDemoModal}
                  className="text-sm font-semibold text-primary hover:underline"
                  type="button"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {showLoader && (
        <CapsuleLoader
          minimumMs={1200}
          variant="circular"
          message="Signing you in…"
          onDone={() => navigate(signedInUser ? afterAuthPath(signedInUser) : "/dashboard")}
        />
      )}
    </>
  );
}
