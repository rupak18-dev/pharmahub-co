import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { CapsuleLoader } from "@/Components/shared/CapsuleLoader";
import { AuthLayout } from "./components/Shared/AuthLayout";

export default function GoogleCallbackPage() {
  const { restoreSession, user } = useAuth();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const ranRef = useRef(false);

  useEffect(() => {
    // StrictMode double-invokes effects in dev; only restore the session once.
    if (ranRef.current) return;
    ranRef.current = true;

    // The backend sets the session as an httpOnly cookie before redirecting
    // here. No token ever appears in the URL — hydrate the user via /auth/me.
    restoreSession()
      .then(() => {
        toast.success("Successfully logged in!");
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
      message="Signing you in…"
      onDone={() => navigate(user?.onboarded ? "/dashboard" : "/onboarding")}
    />
  );
}
