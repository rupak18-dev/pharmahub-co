import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { describeEmailDelivery } from "@/lib/api";
import { showOtpToast } from "@/lib/otpToast";
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

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  // Live copy of the code the server handed back. Seeded from router state on
  // arrival, then replaced whenever a resend mints a new one — otherwise the
  // user would be left reading the previous, now-invalid code.
  const [devCode, setDevCode] = useState(location.state?.devCode ?? null);
  // Set when the server accepted the request but never sent the code, so the
  // page can say so instead of implying an email is on its way. Muted while a
  // `devCode` is available, because the code is a working alternative to mail.
  const [deliveryWarning, setDeliveryWarning] = useState(() =>
    describeEmailDelivery(location.state?.emailReason),
  );
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
      // `resendVerification` returns a fresh `devCode` when the server has no
      // email provider — it used to be dropped here, which left the user with
      // no way to see the newly-minted code.
      const { devCode: freshCode, emailReason } = await resendVerification(normalizedEmail);
      const warning = describeEmailDelivery(emailReason);
      setDeliveryWarning(warning);
      if (freshCode) {
        setDevCode(freshCode);
        showOtpToast(freshCode, { title: "New code sent", emailReason });
      } else if (warning) {
        toast.warning(warning, { duration: 8000 });
      } else {
        toast.success("If that email needs verification, a new code is on its way");
      }
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
            {devCode
              ? deliveryWarning
                ? "Email delivery isn't configured on this server, so the code below was never sent to your inbox. Enter it to activate your account, then sign in to continue."
                : "Your code is below and was also emailed to you. Enter it to activate your account, then sign in to continue."
              : deliveryWarning
                ? "We couldn't send your verification code, so this account can't be activated yet. Once email delivery is configured on the server, resend the code below."
                : "We sent a 6-digit code to your email. Enter it below to activate your account, then sign in to continue."}
          </p>
        </div>

        <div className="space-y-5">
          {deliveryWarning && !devCode && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {deliveryWarning}
            </p>
          )}
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
            {devCode && (
              <div className="mt-3 rounded-2xl border border-[#007A5A]/30 bg-[#E6F4F1] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#007A5A]">
                  Your verification code
                </p>
                <p className="mt-2 font-mono text-3xl font-bold leading-none tracking-[0.3em] text-[#0B3D31]">
                  {devCode}
                </p>
                <p className="mt-2.5 text-xs leading-relaxed text-[#0B3D31]/70">
                  {deliveryWarning
                    ? "Email delivery isn\u2019t configured on this server, so this code was never emailed to you."
                    : "This code was also emailed to you."}
                </p>
              </div>
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
