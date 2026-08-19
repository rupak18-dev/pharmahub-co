import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ShieldCheck,
  Building2,
  Mail,
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { invitationService } from "@/lib/invitationService";
import { AuthLayout } from "./components/Shared/AuthLayout";
import { Logo } from "./components/Shared/Logo";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

export const handle = { title: "Accept Invitation · PharmaHub" };

const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(128);

const schema = z
  .object({
    name: z.string().trim().min(1, "Full name is required"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { restoreSession } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!token) {
      setError("No invitation token was provided. Please check the link in your email.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await invitationService.getInvitation(token);
        if (!isMounted) return;
        if (!data || data.valid === false) {
          setError(
            data?.status === "expired"
              ? "This invitation has expired. Please request a new invitation from your administrator."
              : "This invitation link is invalid or has already been used.",
          );
        } else {
          setInvitation(data);
          if (data.name) {
            setValue("name", data.name);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load invitation.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [token, setValue]);

  const onSubmit = async (formData) => {
    if (!token) return;
    try {
      const data = await invitationService.accept({
        token,
        name: formData.name.trim(),
        password: formData.password,
      });

      if (data?.token && data?.user) {
        await restoreSession({ token: data.token, user: data.user });
      }

      toast.success("Account activated successfully! Welcome to PharmaHub.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to accept invitation. Please try again.",
      );
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-[440px] mx-auto flex flex-col justify-center min-h-[100dvh] py-12 px-4 sm:px-6">
        <div className="mb-8 flex flex-col justify-center lg:justify-start">
          <Logo />
          <h1 className="auth-title mt-6">Set Up Your Account</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Accept your invitation and configure your credentials.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border/80 bg-card p-8 flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-semibold text-foreground">Verifying invitation…</p>
            <p className="text-xs text-muted-foreground">Please wait while we check your token.</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">Invitation Unavailable</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{error}</p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs w-full"
                onClick={() => navigate("/login")}
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key="accept-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Organization & Role Highlight Banner */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Invited Role: {invitation.role}</span>
                </div>
                {invitation.orgName && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Organization:{" "}
                      <strong className="text-foreground">{invitation.orgName}</strong>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-mono text-[11px]">{invitation.email}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    Full Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="e.g. Dr. Ananya Sharma"
                      className={`pl-9 text-xs rounded-xl h-11 ${
                        errors.name ? "border-destructive focus-visible:ring-destructive/30" : ""
                      }`}
                      {...register("name")}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-[11px] text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold">
                    Create Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className={`pl-9 text-xs rounded-xl h-11 ${
                        errors.password
                          ? "border-destructive focus-visible:ring-destructive/30"
                          : ""
                      }`}
                      {...register("password")}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className={`pl-9 text-xs rounded-xl h-11 ${
                        errors.confirmPassword
                          ? "border-destructive focus-visible:ring-destructive/30"
                          : ""
                      }`}
                      {...register("confirmPassword")}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[11px] text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Activating Account…
                      </>
                    ) : (
                      <>
                        Activate Account & Join <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground">
                  Already have an active account?{" "}
                  <span className="font-semibold text-primary">Sign in</span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </AuthLayout>
  );
}
