import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { AuthLayout } from "./components/Shared/AuthLayout";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { motion } from "framer-motion";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { completeGoogleOtp } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [sending, setSending] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef(null);
  const hasSentRef = useRef(false);

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

  const sendCode = useCallback(async () => {
    if (!token) return;
    setSending(true);
    setError(null);
    try {
      const data = await apiRequest("/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      if (data?.devCode) toast.info(`Dev code: ${data.devCode}`);
      toast.success("We sent a verification code to your email");
      setSending(false);
      startCooldown();
    } catch (e) {
      setSending(false);
      setError(e instanceof Error ? e.message : "Could not send the code");
    }
  }, [token, startCooldown]);

  useEffect(() => {
    // StrictMode double-invokes effects in dev; only send once.
    if (hasSentRef.current) return;
    hasSentRef.current = true;
    sendCode();
    return stopCooldown;
  }, [sendCode, stopCooldown]);

  const handleVerify = async (value) => {
    if (!token || value.length !== 6) return;
    setVerifying(true);
    setError(null);
    try {
      await completeGoogleOtp({ token, code: value });
      toast.success("Account verified — welcome to PharmaHub!");
      navigate("/onboarding");
    } catch (e) {
      setVerifying(false);
      setError(e instanceof Error ? e.message : "That code didn't work");
      setCode("");
    }
  };

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
            We sent a 6-digit code to your email. Enter it below to finish creating your account.
          </p>
        </div>

        <div className="space-y-5">
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
          </div>

          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full h-12 rounded-xl auth-button-text"
            disabled={sending || verifying || cooldown > 0}
            onClick={sendCode}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : sending ? "Sending…" : "Resend code"}
          </Button>

          {verifying && (
            <p className="text-center text-sm text-muted-foreground">Verifying your code…</p>
          )}
        </div>
      </motion.div>
    </AuthLayout>
  );
}
