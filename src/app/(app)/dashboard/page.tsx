import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  MailWarning,
  ShieldCheck,
  Sparkles,
  UserPen,
} from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  computeCompleteness,
  type Completeness,
} from "@/lib/eten/profile-completeness";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  // Session + onboarding are gated by the (app) layout; verify session here too.
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const firstName = member.fullName?.trim().split(/\s+/)[0] ?? "there";

  // Profile-completeness nudge (only meaningful once they can build a profile,
  // i.e. after email confirmation). RLS scopes every read to the member.
  let completeness: Completeness | null = null;
  if (member.emailConfirmed) {
    const supabase = await createSupabaseServerClient();
    const [{ data: profile }, { count: skillCount }, { count: certCount }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select(
            "headline, job_title, location, bio, industry_experience, availability_status, years_experience, primary_specialization_pod_id",
          )
          .eq("member_id", member.id)
          .maybeSingle(),
        supabase
          .from("member_skills")
          .select("*", { count: "exact", head: true })
          .eq("member_id", member.id),
        supabase
          .from("certifications")
          .select("*", { count: "exact", head: true })
          .eq("member_id", member.id),
      ]);

    if (profile) {
      completeness = computeCompleteness({
        headline: profile.headline,
        jobTitle: profile.job_title,
        location: profile.location,
        bio: profile.bio,
        industryExperience: profile.industry_experience,
        availabilityStatus: profile.availability_status,
        yearsExperience: profile.years_experience,
        primaryPodId: profile.primary_specialization_pod_id,
        skillCount: skillCount ?? 0,
        certCount: certCount ?? 0,
      });
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <header className="mb-8">
        <p className="text-label-sm text-eten-accent font-mono tracking-widest uppercase">
          ETEN
        </p>
        <h1 className="font-display text-headline-md text-eten-ink mt-1 font-bold">
          Welcome, {firstName}
        </h1>
      </header>

      {!member.emailConfirmed && (
        <div className="border-eten-accent/30 bg-eten-accent/10 text-eten-ink mb-6 flex items-start gap-3 rounded-xl border p-4">
          <MailWarning className="text-eten-accent mt-0.5 size-5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Confirm your email to activate.</p>
            <p className="text-eten-ink-muted mt-1">
              We sent a link to{" "}
              <span className="text-eten-ink">{member.email}</span>. Your
              profile stays private until you confirm.
            </p>
          </div>
        </div>
      )}

      {completeness && <CompletenessCard completeness={completeness} />}

      <div className="bg-eten-panel border-eten-line rounded-2xl border p-8">
        <span className="bg-eten-accent-soft text-eten-accent mb-4 flex size-12 items-center justify-center rounded-full">
          <Sparkles className="size-6" />
        </span>
        <h2 className="font-display text-body-lg text-eten-ink font-bold">
          You&apos;re in.
        </h2>
        <p className="text-eten-ink-muted mt-2 text-sm">
          Your account is set up. Start with your profile — the community feed,
          pods, and messaging are coming as we build out ETEN, and you can reach
          them any time from the navigation.
        </p>

        <Link
          href="/profile"
          className="border-eten-line text-eten-ink mt-5 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/5"
        >
          <UserPen className="size-4" />
          Edit your profile
        </Link>

        <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="bg-eten-hover flex items-center gap-3 rounded-lg p-3">
            <ShieldCheck className="text-eten-accent size-5 shrink-0" />
            <div>
              <dt className="text-eten-ink-muted text-xs">Account status</dt>
              <dd className="text-eten-ink text-sm font-medium capitalize">
                {member.status}
                {member.role === "operations" ? " · operations" : ""}
              </dd>
            </div>
          </div>
          <div className="bg-eten-hover flex items-center gap-3 rounded-lg p-3">
            <MailWarning
              className={
                member.emailConfirmed
                  ? "text-eten-accent size-5 shrink-0"
                  : "text-eten-ink-muted size-5 shrink-0"
              }
            />
            <div>
              <dt className="text-eten-ink-muted text-xs">Email</dt>
              <dd className="text-eten-ink text-sm font-medium">
                {member.emailConfirmed ? "Confirmed" : "Pending confirmation"}
              </dd>
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}

/** Profile-completeness nudge: progress + the next things left to fill in. */
function CompletenessCard({ completeness }: { completeness: Completeness }) {
  const { percent, done, total, items } = completeness;
  const complete = percent === 100;
  const remaining = items.filter((i) => !i.done);

  if (complete) {
    return (
      <div className="border-eten-accent/30 bg-eten-accent/10 mb-6 flex items-start gap-3 rounded-xl border p-4">
        <CheckCircle2 className="text-eten-accent mt-0.5 size-5 shrink-0" />
        <div className="text-sm">
          <p className="text-eten-ink font-medium">Your profile is complete.</p>
          <p className="text-eten-ink-muted mt-1">
            Nicely done — a full, credential-backed profile helps peers and pods
            find you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-eten-panel border-eten-line mb-6 rounded-2xl border p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-eten-ink font-semibold">Complete your profile</h2>
        <span className="text-eten-ink-muted text-sm">
          {done}/{total} · {percent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="bg-eten-hover h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-eten-accent h-full rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="mt-4 flex flex-col gap-1.5">
        {remaining.slice(0, 4).map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="group text-eten-ink-muted hover:text-eten-ink flex items-center gap-2 text-sm transition-colors"
            >
              <Circle className="text-eten-ink-muted/40 size-3.5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              <ArrowRight className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>

      {remaining.length > 4 && (
        <p className="text-eten-ink-muted/70 mt-2 text-xs">
          +{remaining.length - 4} more
        </p>
      )}
    </div>
  );
}
