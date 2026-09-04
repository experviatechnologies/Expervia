import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 sm:p-10">
        <div className="mb-8 text-center">
          <p className="text-label-sm text-primary mb-2 font-mono tracking-widest uppercase">
            ETEN
          </p>
          <h1 className="font-display text-headline-md text-on-surface font-bold">
            Forgot your password?
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            Enter your email and we&apos;ll send you a link to set a new one.
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="text-on-surface-variant mt-6 text-center text-sm">
          Remembered it?{" "}
          <Link href="/signin" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
