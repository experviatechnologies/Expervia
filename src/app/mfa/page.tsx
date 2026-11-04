import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { safeNext } from "@/lib/safe-next";
import { SignOutButton } from "@/app/suspended/sign-out-button";
import { MfaForm } from "./mfa-form";

export const metadata: Metadata = {
  title: "Two-step sign-in · ETEN",
  robots: { index: false, follow: false },
};

/**
 * Two-step sign-in (PRD FR-004). Staff (operations, Sales Managers and
 * Management) must use an authenticator app; anyone who has set one up
 * enters a code here after their password or email link.
 *
 *   - has an authenticator app: enter the 6-digit code
 *   - staff without one: set one up (scan the QR code, then enter a code)
 *   - everyone else, or already verified: carry on to `next`
 */
export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: rawNext } = await searchParams;
  const next = safeNext(rawNext);

  const member = await getCurrentMember();
  if (!member) redirect(`/signin?next=${encodeURIComponent(next)}`);
  if (member.aal === "aal2") redirect(next);

  if (!member.hasMfa) {
    const isStaff =
      member.role === "operations" ||
      (
        await getSupabaseAdmin()
          .from("member_roles")
          .select("role")
          .eq("member_id", member.id)
          .in("role", ["sales_manager", "management"])
          .limit(1)
      ).data?.length;
    if (!isStaff) redirect(next);
  }

  const mode = member.hasMfa ? "verify" : "enroll";

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 sm:p-10">
        <div className="mb-8 text-center">
          <span className="bg-primary/10 text-primary mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
            <ShieldCheck className="size-6" aria-hidden />
          </span>
          <h1 className="font-display text-headline-md text-on-surface font-bold">
            {mode === "verify" ? "Enter your code" : "Set up two-step sign-in"}
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            {mode === "verify"
              ? "Open your authenticator app and enter the 6-digit code for ETEN."
              : "Your role can see client details, so your account needs a second step at sign-in. It takes about a minute."}
          </p>
        </div>

        <MfaForm mode={mode} next={next} />

        <div className="border-outline-variant/30 mt-8 flex flex-col items-center gap-3 border-t pt-6 text-center">
          {mode === "verify" && (
            <p className="text-on-surface-variant text-xs">
              Lost your phone or changed apps? Ask an ETEN admin to reset your
              two-step sign-in, then set it up again.
            </p>
          )}
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
