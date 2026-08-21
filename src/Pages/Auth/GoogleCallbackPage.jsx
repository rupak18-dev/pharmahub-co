import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { CapsuleLoader } from "@/Components/shared/CapsuleLoader";
import { AuthLayout } from "./components/Shared/AuthLayout";

function decodeUser(raw) {
  if (!raw) return null;
  try {
    const base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export default function GoogleCallbackPage() {
  const { restoreSession, user } = useAuth();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const ranRef = useRef(false);

  useEffect(() => {
    // StrictMode double-invokes effects in dev; only restore the session once.
    if (ranRef.current) return;
    ranRef.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("token");
    if (!token) {
      setFailed(true);
      toast.error("Google sign-in did not complete. Please try again.");
      return;
    }
    restoreSession({ token, user: decodeUser(params.get("user")) })
      .then(() => {
        toast.success("Successfully logged in!");
        // Don't leave the bearer token lingering in the address bar.
        window.history.replaceState(null, "", "/auth/callback");
      })
      .catch(() => {
        setFailed(true);
        toast.error("Google sign-in did not complete. Please try again.");
      });
  }, [restoreSession]);

  if (failed) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md mx-auto flex flex-col justify-center min-h-[100dvh] px-4 text-center">
          <h1 className="auth-title mb-3">Something went wrong</h1>
          <p className="auth-subtitle mb-8">We couldn't sign you in with Google.</p>
          <Link
            to="/login"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <CapsuleLoader
      minimumMs={1200}
      variant="circular"
      message="Signing you in…"
      onDone={() => navigate(user?.onboarded ? "/dashboard" : "/onboarding")}
    />
  );
}
