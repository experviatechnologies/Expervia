import type { Metadata } from "next";
import Link from "next/link";
import { MailWarning } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  // Reaching here with a session means the recovery link was verified by
  // /auth/confirm. No session → the link was opened cold, or expired.
  const user = await getCurrentManager();

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 sm:p-10">
        <div className="mb-8 text-center">
          <p className="text-label-sm text-primary mb-2 font-mono tracking-widest uppercase">
            ETEN
          </p>
          <h1 className="font-display text-headline-md text-on-surface font-bold">
            Set a new password
          </h1>
          {user && (
            <p className="text-on-surface-variant mt-2 text-sm">
              Choose a new password for your account.
            </p>
          )}
        </div>

        {user ? (
          <ResetPasswordForm />
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
              <MailWarning className="size-7" />
            </span>
            <p className="text-on-surface-variant text-sm">
              This password-reset link is invalid or has expired. Request a
              fresh one and open it from your email.
            </p>
            <Link
              href="/forgot-password"
              className="text-primary text-sm hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
