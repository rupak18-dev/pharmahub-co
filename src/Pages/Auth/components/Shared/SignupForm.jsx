import React from "react";
import { Link } from "react-router";
import { Button } from "@/Components/ui/button";
import { Divider } from "./Divider";
import { InputField } from "./InputField";
import { PasswordField } from "./PasswordField";
import { TermsCheckbox } from "./TermsCheckbox";
import { motion } from "framer-motion";

export function SignupForm({ onSubmit, register, errors, isSubmitting }) {
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

        <Button
          type="button"
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground auth-button-text rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md mb-6"
        >
          <svg className="w-5 h-5 mr-3 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Sign up with Google
        </Button>

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
            {isSubmitting ? "Continuing..." : "Continue"}
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
