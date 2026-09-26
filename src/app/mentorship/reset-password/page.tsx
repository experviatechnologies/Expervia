import type { Metadata } from "next";
import Link from "next/link";
import { MailWarning } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ResetPasswordForm } from "./reset-password-form";

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
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-14">
      <div className="w-full max-w-[400px]">
        <Link href="/mentorship" className="flex items-center gap-2.5">
          <span className="from-mnt-brand to-mnt-brand-2 text-mnt-on-brand font-display grid size-[30px] place-items-center rounded-[9px] bg-gradient-to-br font-extrabold">
            E
          </span>
          <span className="font-display text-[15px] font-extrabold">
            ETEN Mentorship
          </span>
        </Link>

        <h1 className="font-display mt-8 text-2xl font-extrabold">
          Set a new password
        </h1>

        {user ? (
          <>
            <p className="text-mnt-ink-muted mt-2 text-[14px]">
              Choose a new password for your account.
            </p>
            <ResetPasswordForm />
          </>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-4 text-center">
            <span className="bg-mnt-brand/12 text-mnt-brand flex size-14 items-center justify-center rounded-full">
              <MailWarning className="size-7" />
            </span>
            <p className="text-mnt-ink-muted text-[14px]">
              This password-reset link is invalid or has expired. Request a
              fresh one and open it from your email.
            </p>
            <Link
              href="/mentorship/forgot-password"
              className="text-mnt-brand text-[13px]"
            >
              Request a new reset link
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
