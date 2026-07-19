import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { AuthShell } from "@/components/pharmacy/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password · PharmacyOS" }] }),
  component: ForgotPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

function ForgotPage() {
  const { requestPasswordReset } = useAuth();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    await requestPasswordReset(data.email);
    setSent(true);
  };

  return (
    <AuthShell
      title="Forgot your password?"
      description="We'll email you a link to reset it."
      footer={
        <span className="text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            ← Back to sign in
          </Link>
        </span>
      }
    >
      {sent ? (
        <div className="rounded-md border border-success/30 bg-success/10 p-4 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div>
              <div className="font-medium text-foreground">Check your inbox</div>
              <p className="mt-1 text-muted-foreground">
                If an account exists for{" "}
                <span className="font-mono">{getValues("email")}</span>, we've sent a reset
                link.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
