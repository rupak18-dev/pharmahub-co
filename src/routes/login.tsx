import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthShell } from "@/components/pharmacy/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { db } from "@/lib/db";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · PharmacyOS" }] }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await signIn(data.email, data.password);
      toast.success("Welcome back");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign in failed");
    }
  };

  return (
    <AuthShell
      title="Sign in"
      description="Welcome back. Enter your credentials to continue."
      footer={
        <span className="text-muted-foreground">
          New to PharmacyOS?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@pharmacy.com"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
        <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <div className="font-semibold text-foreground">Demo accounts</div>
          <div className="mt-1 space-y-0.5 font-mono">
            <div>owner@pharmacyos.demo</div>
            <div>pharmacist@pharmacyos.demo</div>
            <div>cashier@pharmacyos.demo</div>
            <div>inventory@pharmacyos.demo</div>
          </div>
          <div className="mt-1">Any password works in demo mode.</div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="w-full mt-4 border-destructive/20 text-destructive hover:bg-destructive/10" 
            onClick={() => {
              db.reset();
              toast.success("Database reset to defaults. Please try logging in again.");
              setTimeout(() => window.location.reload(), 1000);
            }}
          >
            Reset Database
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
