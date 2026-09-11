import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AuthLayout } from "./components/Shared/AuthLayout";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { motion } from "framer-motion";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const { verifyEmail, resendVerification } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const initialEmail = location.state?.email ?? "";
  const devCode = location.state?.devCode ?? null;

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef(null);

  const stopCooldown = useCallback(() => {
    if (cooldownTimer.current) {
      clearInterval(cooldownTimer.current);
      cooldownTimer.current = null;
    }
  }, []);

  const startCooldown = useCallback(() => {
    stopCooldown();
    setCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownTimer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          stopCooldown();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, [stopCooldown]);

  useEffect(() => {
    return stopCooldown;
  }, [stopCooldown]);

  const normalizedEmail = email.trim().toLowerCase();

  const handleResend = useCallback(async () => {
    if (!normalizedEmail) {
      setError("Enter the email you signed up with");
      return;
    }
    setError(null);
    try {
      await resendVerification(normalizedEmail);
      toast.success("If that email needs verification, a new code is on its way");
      startCooldown();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the code");
    }
  }, [normalizedEmail, resendVerification, startCooldown]);

  const handleVerify = useCallback(
    async (value) => {
      setError(null);
      if (!normalizedEmail) {
        setError("Enter the email you signed up with");
        return;
      }
      if (value.length !== 6) return;
      setVerifying(true);
      try {
        await verifyEmail({ email: normalizedEmail, code: value });
        toast.success("Email verified — you can now sign in");
        // Verification done → normal login. This account is a NEW self-registered
        // user, so the login flow routes them into onboarding afterwards.
        navigate("/login", { state: { email: normalizedEmail } });
      } catch (e) {
        setVerifying(false);
        setError(e instanceof Error ? e.message : "That code didn't work");
        setCode("");
      }
    },
    [normalizedEmail, verifyEmail, navigate],
  );

  const onCodeChange = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6) handleVerify(digits);
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] mx-auto flex flex-col justify-center min-h-[100dvh] py-12 px-4 sm:px-6"
      >
        <div className="mb-10">
          <h1 className="auth-title">Verify your email</h1>
          <p className="auth-subtitle mt-4">
            We sent a 6-digit code to your email. Enter it below to activate your account, then sign
            in to continue.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="auth-label mb-1.5 block text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="auth-label mb-1.5 block text-sm font-medium text-foreground">
              Verification code
            </label>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              disabled={verifying}
              placeholder="• • • • • •"
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              onPaste={(e) => {
                e.preventDefault();
                onCodeChange(e.clipboardData.getData("text"));
              }}
              className="h-14 rounded-[18px] text-center text-2xl font-bold tracking-[0.5em] border-2 auth-input-text"
              maxLength={6}
            />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            {devCode && !code && (
              <p className="text-sm text-muted-foreground mt-2">
                Dev code (email delivery not configured):{" "}
                <span className="font-semibold">{devCode}</span>
              </p>
            )}
          </div>

          <Button
            type="button"
            size="lg"
            className="w-full h-12 rounded-xl"
            disabled={verifying || code.length !== 6}
            onClick={() => handleVerify(code)}
          >
            {verifying ? "Verifying…" : "Verify email"}
          </Button>

          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full h-12 rounded-xl auth-button-text"
            disabled={cooldown > 0}
            onClick={handleResend}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </Button>

          {verifying && (
            <p className="text-center text-sm text-muted-foreground">Verifying your code…</p>
          )}
        </div>
      </motion.div>
    </AuthLayout>
  );
}
