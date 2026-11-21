import type { Metadata } from "next";
import Link from "next/link";
import { MailWarning } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ResetPasswordForm } from "./reset-password-form";
import { authLinkClass } from "@/components/site/auth-shell";
import { MntAuthShell } from "@/components/mentorship/mnt-auth-shell";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default async function MentorshipResetPasswordPage() {
  // Reaching here with a session means the recovery link was verified by
  // /auth/confirm. No session → the link was opened cold, or it expired.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <MntAuthShell
      eyebrow="Account help"
      headline="A fresh password, and you're back to growing."
    >
      <div>
        <h1 className="font-jakarta text-brand-950 text-3xl font-extrabold tracking-tight sm:text-[2.1rem]">
          Set a new password
        </h1>

        {user ? (
          <>
            <p className="text-ink/65 mt-2">
              Choose a new password for your account.
            </p>
            <ResetPasswordForm />
          </>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-4 text-center">
            <span className="bg-brand-100 text-brand-700 flex size-16 items-center justify-center rounded-full">
              <MailWarning aria-hidden className="size-8" />
            </span>
            <p className="text-ink/70 leading-relaxed">
              This password-reset link is invalid or has expired. Request a
              fresh one and open it from your email.
            </p>
            <Link href="/mentorship/forgot-password" className={authLinkClass}>
              Request a new reset link
            </Link>
          </div>
        )}
      </div>
    </MntAuthShell>
  );
}
