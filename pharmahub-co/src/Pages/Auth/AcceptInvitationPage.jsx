import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Check, CheckCircle2, Loader2, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { invitationService } from "@/lib/invitationService";
import { AuthLayout } from "./components/Shared/AuthLayout";
import { Logo } from "./components/Shared/Logo";
import { PasswordField } from "./components/Shared/PasswordField";
import { InputField } from "./components/Shared/InputField";
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";

export const handle = { title: "Accept invitation · PharmaHub" };

const REQUIREMENTS = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One number", test: (v) => /\d/.test(v) },
  { label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const PHONE_PATTERN = /^(?:\+91)?[6-9]\d{9}$/;

function normalizePhone(value) {
  const cleaned = String(value || "").replace(/[\s\-().]/g, "");
  if (/^[6-9]\d{9}$/.test(cleaned)) return `+91${cleaned}`;
  return cleaned;
}

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { signInWithUser } = useAuth();

  const [state, setState] = useState("loading"); // loading | ready | invalid
  const [invitation, setInvitation] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setState("invalid");
        return;
      }
      try {
        const data = await invitationService.getInvitation(token);
        if (cancelled) return;
        if (!data?.valid) {
          setState("invalid");
          return;
        }
        setInvitation(data);
        setName(data.name || "");
        setState("ready");
      } catch {
        if (!cancelled) setState("invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Enter your full name.";
    if (phone.trim() && !PHONE_PATTERN.test(normalizePhone(phone))) {
      nextErrors.phone =
        "Enter a valid Indian mobile number (10 digits starting with 6–9, e.g. +91 98765 43210).";
    }
    if (!password) nextErrors.password = "Choose a password.";
    else if (!REQUIREMENTS.every((r) => r.test(password)))
      nextErrors.password = "Meet all the password requirements.";
    if (!confirm) nextErrors.confirm = "Confirm your password.";
    else if (confirm !== password) nextErrors.confirm = "Passwords do not match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const data = await invitationService.accept({
        token,
        name: name.trim(),
        password,
        phone: phone.trim() ? normalizePhone(phone) : undefined,
      });
      signInWithUser(data);
      toast.success("Welcome to PharmaHub! Your account is ready.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept the invitation.");
      if (err instanceof Error && /already|expired|cancelled|not found/i.test(err.message)) {
        setState("invalid");
      }
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

        {state === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm">Checking your invitation…</p>
          </div>
        )}

        {state === "invalid" && (
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="auth-title mt-4">Invitation unavailable</h1>
            <p className="auth-subtitle mt-3">
              This invitation link is invalid, has already been used, or has expired. Ask the
              workspace owner to send you a fresh invitation.
            </p>
            <Button
              asChild
              className="mt-6 w-full auth-button-text h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Link to="/login">Back to Sign In</Link>
            </Button>
          </div>
        )}

        {state === "ready" && invitation && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h1 className="auth-title">You've been invited</h1>
              <p className="auth-subtitle mt-3">
                Join{" "}
                <span className="font-semibold text-foreground">
                  {invitation.orgName || "the workspace"}
                </span>{" "}
                as a <span className="font-semibold text-foreground">{invitation.role}</span>. Set
                your password to finish creating your account (one-time link).
              </p>
            </div>

            <div className="space-y-5">
              <InputField
                id="name"
                label="FULL NAME"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                error={errors.name}
                className="h-14 rounded-[18px] text-base placeholder:text-muted-foreground/60 border-2"
                labelClassName="auth-label mb-1.5 block"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="space-y-1.5">
                <p className="auth-label mb-1.5 block text-sm font-medium text-muted-foreground">
                  WORK EMAIL
                </p>
                <div className="flex items-center gap-2 rounded-[18px] border-2 border-muted bg-muted/40 px-4 h-14 text-sm text-muted-foreground">
                  <span className="truncate">{invitation.email}</span>
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                </div>
              </div>

              <InputField
                id="phone"
                label="PHONE NUMBER (OPTIONAL)"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                error={errors.phone}
                className="h-14 rounded-[18px] text-base placeholder:text-muted-foreground/60 border-2"
                labelClassName="auth-label mb-1.5 block"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Your number is stored for staff records. SMS verification isn't available yet.
              </p>

              <PasswordField
                id="new-password"
                label="SET A PASSWORD"
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
                label="CONFIRM PASSWORD"
                autoComplete="new-password"
                placeholder="Re-enter your password"
                error={errors.confirm}
                className="h-14 rounded-[18px] text-base placeholder:text-muted-foreground/60 border-2"
                labelClassName="auth-label mb-1.5 block"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Accept Invitation
                </>
              )}
            </Button>

            <div className="mt-6 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Already have an account?{" "}
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
