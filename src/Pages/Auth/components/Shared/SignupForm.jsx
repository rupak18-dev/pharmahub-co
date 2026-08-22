import React from "react";
import { Link } from "react-router";
import { Button } from "@/Components/ui/button";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { InputField } from "./InputField";
import { PasswordField } from "./PasswordField";
import { PasswordStrength } from "./PasswordStrength";
import { TermsCheckbox } from "./TermsCheckbox";
import { motion } from "framer-motion";

export function SignupForm({
  onSubmit,
  register,
  errors,
  isSubmitting,
  passwordValue,
  onGoogleClick,
}) {
  return (
    <div className="w-full max-w-[420px] mx-auto flex flex-col justify-center min-h-[100dvh] py-12 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-10">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle mt-4">Sign up to get started with your pharmacy.</p>
        </div>

        <GoogleAuthButton
          label="Sign up with Google"
          onClick={onGoogleClick}
          disabled={isSubmitting}
        />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-3 text-muted-foreground font-medium">
              Or sign up with email
            </span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <InputField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="pharmacy@example.com"
            error={errors.email?.message}
            className="h-14 rounded-[18px] text-base placeholder:text-muted-foreground/60 border-2 auth-input-text"
            labelClassName="auth-label mb-1.5 block"
            {...register("email")}
          />

          <PasswordField
            id="password"
            label="Password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            error={errors.password?.message}
            className="h-14 rounded-[18px] text-base placeholder:text-muted-foreground/60 border-2 auth-input-text"
            labelClassName="auth-label mb-1.5 block"
            {...register("password")}
          />
          <PasswordStrength value={passwordValue} />

          <PasswordField
            id="confirm"
            label="Retype Password"
            autoComplete="new-password"
            placeholder="Confirm your password"
            error={errors.confirm?.message}
            className="h-14 rounded-[18px] text-base placeholder:text-muted-foreground/60 border-2 auth-input-text"
            labelClassName="auth-label mb-1.5 block"
            {...register("confirm")}
          />

          <TermsCheckbox error={errors.terms?.message} {...register("terms")} />

          <Button
            type="submit"
            size="lg"
            className="w-full auth-button-text h-12 mt-4 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-base text-muted-foreground">
            Already using PharmaHub?{" "}
            <Link to="/login" className="font-bold text-foreground hover:underline">
              Sign In &rarr;
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
