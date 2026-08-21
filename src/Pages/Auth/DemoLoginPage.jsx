import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@/lib/auth";
import { CapsuleLoader } from "@/Components/shared/CapsuleLoader";

export const handle = { title: "Demo Login · PharmaHub" };

export default function DemoLoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { demoLoginVerify } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Invalid demo login link. No token provided.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await demoLoginVerify(token);
        if (!cancelled) {
          setLoading(true); // show capsule loader while redirecting
          navigate("/dashboard", { replace: true });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Invalid or expired demo login link");
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [searchParams, demoLoginVerify, navigate]);

  if (loading && !error) {
    return <CapsuleLoader message="Authenticating demo access…" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg border border-border/40 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Demo Login Failed</h2>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <div className="space-y-3">
          <a
            href="/login"
            className="inline-block w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:bg-primary/90 leading-12"
          >
            Back to Sign In
          </a>
          <p className="text-xs text-muted-foreground">
            Demo links expire after 15 minutes and can only be used once.
          </p>
        </div>
      </div>
    </div>
  );
}
