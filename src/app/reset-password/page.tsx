import type { Metadata } from "next";
import Link from "next/link";
import { MailWarning } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { ResetPasswordForm } from "./reset-password-form";
import { AuthShell, authLinkClass } from "@/components/site/auth-shell";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  // Reaching here with a session means the recovery link was verified by
  // /auth/confirm. No session → the link was opened cold, or expired.
  const user = await getCurrentManager();

  return (
    <AuthShell
      eyebrow="Account help"
      headline="Set a new password and pick up where you left off."
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-jakarta text-brand-950 text-3xl font-extrabold tracking-tight sm:text-[2.1rem]">
            Set a new password
          </h1>
          {user && (
            <p className="text-ink/65 mt-2">
              Choose a new password for your account.
            </p>
          )}
        </div>

        {user ? (
          <ResetPasswordForm />
        ) : (
          <div className="border-brand-100 bg-lavender flex flex-col items-start gap-4 rounded-2xl border p-6">
            <span className="text-brand-700 ring-brand-200/70 flex size-12 items-center justify-center rounded-full bg-white ring-1">
              <MailWarning aria-hidden className="size-6" />
            </span>
            <p className="text-ink/75">
              This password-reset link is invalid or has expired. Request a
              fresh one and open it from your email.
            </p>
            <Link href="/forgot-password" className={authLinkClass}>
              Request a new reset link
            </Link>
          </div>
        )}

        <p className="border-brand-100 text-ink/70 border-t pt-6 text-[0.95rem]">
          <Link href="/signin" className={authLinkClass}>
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
