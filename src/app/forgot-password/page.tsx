import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";
import { AuthShell, authLinkClass } from "@/components/site/auth-shell";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account help"
      headline="Get back into your technology network."
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-jakarta text-brand-950 text-3xl font-extrabold tracking-tight sm:text-[2.1rem]">
            Forgot your password?
          </h1>
          <p className="text-ink/65 mt-2">
            Enter your email and we&apos;ll send you a link to set a new one.
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="border-brand-100 text-ink/70 border-t pt-6 text-[0.95rem]">
          Remembered it?{" "}
          <Link href="/signin" className={authLinkClass}>
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
