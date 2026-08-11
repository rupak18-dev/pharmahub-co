import React from "react";
import { Link } from "react-router";
import { Logo } from "../Shared/Logo";
import { InputField } from "../Shared/InputField";
import { Button } from "@/Components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export function ForgotPasswordForm({
  onSubmit,
  register,
  errors,
  isSubmitting,
  sent,
  email,
  onResetSentState,
}) {
  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col justify-center min-h-[100dvh] py-12 px-4 sm:px-6">
      <div className="mb-4 flex flex-col justify-center lg:justify-start">
        <Logo />
      </div>

      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="success-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full mt-6"
          >
            <div className="flex flex-col mb-10">
              <CheckCircle2 className="w-12 h-12 text-primary mb-4" />
              <h1 className="auth-title">Check your inbox</h1>
            </div>

            <p className="auth-subtitle mt-4">
              We've sent a password reset link to <br />
              <span className="font-semibold text-foreground">{email}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-6">
              If you don't see it within a few minutes, check your spam folder.
            </p>

            <div className="mt-8 space-y-4">
              <Button
                type="button"
                className="w-full auth-button-text h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                onClick={onSubmit} // re-submits the form to resend
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Resend Email"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full auth-button-text h-12 rounded-xl text-sm font-semibold border-2 hover:bg-muted/50"
                onClick={onResetSentState}
              >
                Use another email address
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full auth-button-text h-12 rounded-xl text-sm font-semibold hover:bg-muted/50"
                asChild
              >
                <Link to="/login">Back to Sign In</Link>
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full"
          >
            <div className="mb-10">
              <h1 className="auth-title mt-4">Forgot password?</h1>
              <p className="auth-subtitle mt-4">
                Enter your registered email address and we'll send you a secure password reset link.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              <InputField
                id="email"
                label="EMAIL"
                type="email"
                autoComplete="email"
                placeholder="studios@example.com"
                error={errors.email?.message}
                className="h-14 rounded-[18px] text-base placeholder:text-muted-foreground/60 border-2 auth-input-text"
                labelClassName="auth-label mb-1.5 block"
                {...register("email")}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full auth-button-text h-12 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>
              </div>

              <div className="mt-8 text-center pt-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Remember your password?{" "}
                  <Link to="/login" className="font-bold text-foreground hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
