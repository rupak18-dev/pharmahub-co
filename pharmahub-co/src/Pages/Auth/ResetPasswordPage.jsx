import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Check, CheckCircle2, Loader2, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/lib/authService";
import { AuthLayout } from "./components/Shared/AuthLayout";
import { Logo } from "./components/Shared/Logo";
import { PasswordField } from "./components/Shared/PasswordField";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";

export const handle = { title: "Reset password · PharmaHub" };

const REQUIREMENTS = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One number", test: (v) => /\d/.test(v) },
  { label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrors({ token: "This reset link is invalid or incomplete." });
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const nextErrors = {};
    if (!token) nextErrors.token = "This reset link is invalid or incomplete.";
    if (!password) nextErrors.password = "Choose a new password.";
    else if (!REQUIREMENTS.every((r) => r.test(password)))
      nextErrors.password = "Meet all the password requirements.";
    if (!confirm) nextErrors.confirm = "Confirm your new password.";
    else if (confirm !== password) nextErrors.confirm = "Passwords do not match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await authService.resetPassword({ token, newPassword: password });
      setDone(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not reset your password. Try the link again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-[420px] mx-auto flex flex-col justify-center min-h-[100dvh] py-12 px-4 sm:px-6">
        <div className="mb-8 flex flex-col justify-center lg:justify-start">
          <Logo />
        </div>

        {done ? (
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <h1 className="auth-title mt-4">Password updated</h1>
            <p className="auth-subtitle mt-3">
              Your password has been reset. You can now sign in with your new password.
            </p>
            <Button
              asChild
              className="mt-6 w-full auth-button-text h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Link to="/login">Back to Sign In</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h1 className="auth-title">Reset your password</h1>
              <p className="auth-subtitle mt-3">
                Choose a new password for your PharmaHub account. This link can only be used once.
              </p>
            </div>

            <div className="space-y-5">
              <PasswordField
                id="new-password"
                label="NEW PASSWORD"
                autoComplete="new-password"
                placeholder="Create a strong password"
                error={errors.password}
                className="h-14 rounded-[18px] text-base placeholder:text-muted-foreground/60 border-2"
                labelClassName="auth-label mb-1.5 block"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <PasswordField
                id="confirm-password"
                label="CONFIRM NEW PASSWORD"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                error={errors.confirm}
                className="h-14 rounded-[18px] text-base placeholder:text-muted-foreground/60 border-2"
                labelClassName="auth-label mb-1.5 block"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />

              {errors.token && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  {errors.token}
                </div>
              )}
            </div>

            <ul className="grid gap-1.5 sm:grid-cols-2" aria-label="Password requirements">
              {REQUIREMENTS.map((r) => {
                const met = password ? r.test(password) : false;
                return (
                  <li
                    key={r.label}
                    className={cn(
                      "flex items-center gap-1.5 text-xs",
                      met ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-4 w-4 place-items-center rounded-full border",
                        met ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                      aria-hidden="true"
                    >
                      {met ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                    </span>
                    {r.label}
                  </li>
                );
              })}
            </ul>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full auth-button-text h-12 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Updating…
                </>
              ) : (
                "Update Password"
              )}
            </Button>

            <div className="mt-6 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Remember your password?{" "}
                <Link to="/login" className="font-bold text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
