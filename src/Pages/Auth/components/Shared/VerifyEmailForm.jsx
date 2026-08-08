import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/Components/ui/button";
import { ResendTimer } from "./ResendTimer";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/Components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { ArrowLeft } from "lucide-react";

export function VerifyEmailForm({ email, onBack }) {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setIsVerifying(true);
    // In a real app, verify OTP here. For now, we simulate a delay.
    setTimeout(() => {
      setIsVerifying(false);
      localStorage.removeItem("pharmahub_onboarding_state");
      navigate("/onboarding");
    }, 1500);
  };

  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col justify-center min-h-[100dvh] py-12 px-4 sm:px-6">
      <div className="mb-10">
        <button
          onClick={onBack}
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Change email
        </button>

        <h1 className="auth-title">Verify Email</h1>
        <p className="auth-subtitle mt-4">
          We've sent a secure 6-digit verification code to{" "}
          <span className="font-bold text-foreground">{email || "your email"}</span>. Enter it below
          to continue creating your PharmaHub workspace.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            value={otp}
            onChange={(val) => setOtp(val)}
            autoFocus
          >
            <InputOTPGroup className="gap-2 sm:gap-3">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-lg sm:text-2xl font-bold rounded-xl border-2 border-input ring-0 bg-background transition-all duration-200 focus-visible:ring-0 data-[active=true]:border-primary data-[active=true]:ring-primary/20 data-[active=true]:ring-4"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={otp.length !== 6 || isVerifying}
          className="w-full auth-button-text h-12 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:hover:scale-100"
        >
          {isVerifying ? "Verifying..." : "Verify & Continue"}
        </Button>
      </form>

      <ResendTimer initialSeconds={30} />

      <div className="mt-8 text-center border-t border-border/50 pt-8">
        <p className="text-sm text-muted-foreground mb-6 text-balance mx-auto max-w-[350px]">
          For your security, this verification code expires in 10 minutes.
        </p>
        <p className="text-base text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-foreground hover:underline">
            Sign In &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}
