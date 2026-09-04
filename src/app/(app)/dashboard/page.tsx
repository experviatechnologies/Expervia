import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MailWarning, ShieldCheck, Sparkles, UserPen } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  // Session + onboarding are gated by the (app) layout; verify session here too.
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const firstName = member.fullName?.trim().split(/\s+/)[0] ?? "there";

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <header className="mb-8">
        <p className="text-label-sm text-primary font-mono tracking-widest uppercase">
          ETEN
        </p>
        <h1 className="font-display text-headline-md text-on-surface mt-1 font-bold">
          Welcome, {firstName}
        </h1>
      </header>

      {!member.emailConfirmed && (
        <div className="border-primary/30 bg-primary/10 text-on-surface mb-6 flex items-start gap-3 rounded-xl border p-4">
          <MailWarning className="text-primary mt-0.5 size-5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Confirm your email to activate.</p>
            <p className="text-on-surface-variant mt-1">
              We sent a link to{" "}
              <span className="text-on-surface">{member.email}</span>. Your
              profile stays private until you confirm.
            </p>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-8">
        <span className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-full">
          <Sparkles className="size-6" />
        </span>
        <h2 className="font-display text-body-lg text-on-surface font-bold">
          You&apos;re in.
        </h2>
        <p className="text-on-surface-variant mt-2 text-sm">
          Your account is set up. Start with your profile — the community feed,
          pods, and messaging are coming as we build out ETEN, and you can reach
          them any time from the navigation.
        </p>

        <Link
          href="/profile"
          className="border-outline-variant text-on-surface mt-5 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/5"
        >
          <UserPen className="size-4" />
          Edit your profile
        </Link>

        <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="bg-surface-container flex items-center gap-3 rounded-lg p-3">
            <ShieldCheck className="text-primary size-5 shrink-0" />
            <div>
              <dt className="text-on-surface-variant text-xs">
                Account status
              </dt>
              <dd className="text-on-surface text-sm font-medium capitalize">
                {member.status}
                {member.role === "operations" ? " · operations" : ""}
              </dd>
            </div>
          </div>
          <div className="bg-surface-container flex items-center gap-3 rounded-lg p-3">
            <MailWarning
              className={
                member.emailConfirmed
                  ? "text-primary size-5 shrink-0"
                  : "text-on-surface-variant size-5 shrink-0"
              }
            />
            <div>
              <dt className="text-on-surface-variant text-xs">Email</dt>
              <dd className="text-on-surface text-sm font-medium">
                {member.emailConfirmed ? "Confirmed" : "Pending confirmation"}
              </dd>
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}
