import React from "react";
import { Link } from "react-router";
import { Logo } from "../Shared/Logo";
import { SocialButtons } from "../Shared/SocialButtons";
import { Divider } from "../Shared/Divider";
import { InputField } from "../Shared/InputField";
import { PasswordField } from "../Shared/PasswordField";
import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { Label } from "@/Components/ui/label";
import { motion } from "framer-motion";

export function LoginForm({ onSubmit, register, errors, isSubmitting, onDemoClick }) {
  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col justify-center min-h-[100dvh] py-12 px-4 sm:px-6">
      {/* Optional: You can keep Logo here if needed for branding */}
      <div className="mb-10 flex flex-col justify-center lg:justify-start">
        <Logo />
        <h1 className="auth-title mt-4">Welcome Back 👋</h1>
        <p className="auth-subtitle mt-4">
          Access your pharmacy workspace to manage inventory, expiry alerts, stock audits, purchases
          and sales.
        </p>
      </div>

      <SocialButtons />

      <Divider />

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-5">
          <InputField
            id="email"
            label="EMAIL"
            type="email"
            autoComplete="email"
            placeholder="studios@example.com"
            error={errors.email?.message}
            className="h-14 rounded-[18px] text-base placeholder:text-muted-foreground/60 border-2 auth-input-text"
            labelClassName="auth-label mb-1.5 block"
            {...register("email")}
          />

          <PasswordField
            id="password"
            label="PASSWORD"
            autoComplete="current-password"
            placeholder="Enter your password"
            error={errors.password?.message}
            className="h-14 rounded-[18px] text-base placeholder:text-muted-foreground/60 border-2 auth-input-text"
            labelClassName="auth-label mb-1.5 block"
            {...register("password")}
          />
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember-me" className="rounded-sm border-muted-foreground/40" />
            <Label
              htmlFor="remember-me"
              className="text-sm font-medium text-muted-foreground leading-none"
            >
              Keep me signed in
            </Label>
          </div>
          <Link to="/forgot-password" className="text-sm font-bold text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full auth-button-text h-12 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>
        </div>

        <div className="mt-8 text-center pt-2">
          <p className="text-sm font-medium text-muted-foreground">
            New to PharmaHub?{" "}
            <Link to="/signup" className="font-bold text-primary hover:underline">
              Create your account &rarr;
            </Link>
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
          <div className="font-semibold text-foreground mb-2">Demo accounts</div>
          <div className="space-y-1 font-mono">
            <div>owner@PharmaHub.demo</div>
            <div>pharmacist@PharmaHub.demo</div>
            <div>cashier@PharmaHub.demo</div>
            <div>inventory@PharmaHub.demo</div>
          </div>
          <div className="mt-2 text-[11px]">Any password works in demo mode.</div>
        </div>
      </form>
    </div>
  );
}
