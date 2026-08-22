import React from "react";
import { Link } from "react-router";
import { Logo } from "../Shared/Logo";
import { InputField } from "../Shared/InputField";
import { PasswordField } from "../Shared/PasswordField";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
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
  codeField,
  resetRegister,
  resetErrors,
  onResetSubmit,
  resetSubmitting,
  resendCooldown,
  onResend,
}) {
  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col justify-center min-h-[100dvh] py-12 px-4 sm:px-6">
      <div className="mb-4 flex flex-col justify-center lg:justify-start">
        <Logo />
      </div>

      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="reset-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full mt-6"
          >
            <div className="mb-8">
              <CheckCircle2 className="w-12 h-12 text-primary mb-4" />
              <h1 className="auth-title">Check your inbox</h1>
              <p className="auth-subtitle mt-4">
                We sent a 6-digit reset code to <br />
                <span className="font-semibold text-foreground">{email}</span> Enter it below with
                your new password.
              </p>
            </div>

            <form onSubmit={onResetSubmit} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="reset-code"
                  className="auth-label mb-1.5 block text-sm font-medium text-foreground"
                >
                  RESET CODE
                </label>
                <Input
                  id="reset-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  placeholder="• • • • • •"
                  className="h-14 rounded-[18px] text-center text-2xl font-bold tracking-[0.5em] border-2 auth-input-text"
                  {...codeField}
                  onChange={(e) => {
                    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    codeField.onChange(e);
                  }}
                />
                {resetErrors.code && (
                  <p className="text-xs text-destructive mt-1">{resetErrors.code.message}</p>
                )}
              </div>

              <PasswordField
                id="new-password"
                label="NEW PASSWORD"
                type="password"
                autoComplete="new-password"
                placeholder="Create a strong password"
                error={resetErrors.newPassword?.message}
                className="h-14 rounded-[18px] text-base placeholder:text-muted-foreground/60 border-2 auth-input-text"
                labelClassName="auth-label mb-1.5 block"
                {...resetRegister("newPassword")}
              />

              <PasswordField
                id="confirm-password"
                label="CONFIRM PASSWORD"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                error={resetErrors.confirmPassword?.message}
                className="h-14 rounded-[18px] text-base placeholder:text-muted-foreground/60 border-2 auth-input-text"
                labelClassName="auth-label mb-1.5 block"
                {...resetRegister("confirmPassword")}
              />

              <Button
                type="submit"
                size="lg"
                disabled={resetSubmitting}
                className="w-full auth-button-text h-12 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:hover:scale-100"
              >
                {resetSubmitting ? "Updating…" : "Update Password"}
              </Button>
            </form>

            <div className="mt-8 space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full auth-button-text h-12 rounded-xl text-sm font-semibold border-2 hover:bg-muted/50"
                onClick={onResend}
                disabled={resendCooldown > 0 || resetSubmitting}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full auth-button-text h-12 rounded-xl text-sm font-semibold hover:bg-muted/50"
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
                Enter your registered email address and we'll send you a secure code to reset your
                password.
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
                  {isSubmitting ? "Sending..." : "Send Reset Code"}
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
