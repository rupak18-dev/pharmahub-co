import React from "react";
import { Link } from "react-router";
import { Logo } from "../Shared/Logo";
import { GoogleAuthButton } from "../Shared/GoogleAuthButton";
import { InputField } from "../Shared/InputField";
import { PasswordField } from "../Shared/PasswordField";
import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { Label } from "@/Components/ui/label";

export function LoginForm({ onSubmit, register, errors, isSubmitting, onGoogleClick }) {
  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col justify-center min-h-[100dvh] py-12 px-4 sm:px-6">
      <div className="mb-10 flex flex-col justify-center lg:justify-start">
        <Logo />
        <h1 className="auth-title mt-6">Welcome</h1>
      </div>

      <GoogleAuthButton onClick={onGoogleClick} disabled={isSubmitting} />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-background px-3 text-muted-foreground font-medium">
            Or sign in with email
          </span>
        </div>
      </div>

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
            <Checkbox id="remember-me" />
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
      </form>
    </div>
  );
}
