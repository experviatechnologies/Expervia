import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  LayoutGrid,
  Mail,
  MailWarning,
  Pencil,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  computeCompleteness,
  type Completeness,
} from "@/lib/eten/profile-completeness";
import { membershipStage } from "@/lib/eten/membership";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export default async function DashboardPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const firstName = member.fullName?.trim().split(/\s+/)[0] ?? "there";
  const supabase = await createSupabaseServerClient();

  const [{ data: me }, { data: verifiedIdentity }, { data: podRows }] =
    await Promise.all([
      supabase
        .from("members")
        .select("membership_id, validated_at, status")
        .eq("id", member.id)
        .maybeSingle(),
      supabase
        .from("member_verifications")
        .select("id")
        .eq("member_id", member.id)
        .eq("kind", "identity")
        .eq("status", "verified")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("pod_memberships")
        .select("pods(name, slug, is_main)")
        .eq("member_id", member.id),
    ]);

  const validated = Boolean(me?.validated_at);
  const stage = membershipStage(
    me?.status ?? member.status,
    validated,
    Boolean(verifiedIdentity),
  );

  type PodRel = { name: string; slug: string; is_main: boolean };
  const myPods = (podRows ?? [])
    .map((row) => {
      const rel = (row as unknown as { pods: PodRel | PodRel[] | null }).pods;
      const p = Array.isArray(rel) ? (rel[0] ?? null) : rel;
      return p && !p.is_main ? { name: p.name, slug: p.slug } : null;
    })
    .filter((p): p is { name: string; slug: string } => p !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Profile-completeness (only once they can build a profile).
  let completeness: Completeness | null = null;
  if (member.emailConfirmed) {
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
    <div className="mx-auto w-full max-w-[1240px] px-5 py-8 md:px-8 md:py-9">
      <div className="flex flex-col gap-6">
        {!member.emailConfirmed && (
          <div className="border-eten-accent/30 bg-eten-accent-soft text-eten-ink flex items-start gap-3 rounded-xl border p-4">
            <MailWarning className="text-eten-accent mt-0.5 size-5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">Confirm your email to activate.</p>
              <p className="text-eten-ink-muted mt-1">
                We sent a link to{" "}
                <span className="text-eten-ink">{member.email}</span>. Your
                profile stays private until you confirm.
              </p>
            </div>
          </div>
        )}

        {/* Welcome hero */}
        <section
          className="relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-[20px] p-7 text-white"
          style={{
            background:
              "linear-gradient(135deg, #110263 0%, #35007F 55%, #7530E6 100%)",
          }}
        >
          <svg
            width="320"
            height="320"
            viewBox="0 0 320 320"
            aria-hidden="true"
            className="pointer-events-none absolute -top-[90px] -right-[60px] opacity-[0.14]"
          >
            <circle
              cx="160"
              cy="160"
              r="150"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
            />
            <circle
              cx="160"
              cy="160"
              r="105"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
            />
            <circle
              cx="160"
              cy="160"
              r="60"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
            />
          </svg>
          <div className="relative flex max-w-[620px] flex-col gap-2.5">
            <span className="text-[12px] font-bold tracking-[0.12em] text-[#D9CCFB] uppercase">
              ETEN by Expervia
            </span>
            <h1 className="text-[32px] font-extrabold tracking-[-0.02em]">
              Welcome, {firstName}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-[13px]">
                {me?.membership_id ?? "—"}
              </span>
              <span
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold " +
                  (validated
                    ? "bg-[#E7F6EC] text-[#11703A]"
                    : "bg-white/15 text-white")
                }
              >
                {validated && <Check className="size-3.5" strokeWidth={2.4} />}
                {stage}
              </span>
            </div>
          </div>
          <Link
            href="/profile"
            className="relative inline-flex h-[46px] items-center gap-2 rounded-xl bg-white px-[18px] text-sm font-bold text-[#110263] transition-opacity hover:opacity-90"
          >
            <Pencil className="size-[18px]" strokeWidth={2} />
            Edit your profile
          </Link>
        </section>

        {/* Profile completion + account */}
        <div className="flex flex-wrap items-stretch gap-5">
          <CompletionCard completeness={completeness} />

          <section className="flex min-w-0 flex-[2_1_300px] flex-col gap-3">
            <InfoCard
              tone="verified"
              Icon={ShieldCheck}
              label="Account status"
              value={member.status === "active" ? "Active" : member.status}
            />
            <InfoCard
              tone="accent"
              Icon={Mail}
              label="Email"
              value={member.emailConfirmed ? "Confirmed" : "Pending"}
            />
            <div className="border-eten-accent/20 bg-eten-accent-soft flex flex-1 flex-col gap-2 rounded-[18px] border p-[18px]">
              <div className="text-eten-ink flex items-center gap-2 text-[15px] font-bold">
                <Sparkles className="text-eten-accent size-[18px]" />
                You&apos;re in
              </div>
              <p className="text-eten-ink-muted text-[13px] leading-relaxed">
                Your account is set up. Start with your profile. The community
                feed, pods and messaging are on the way as we build out ETEN,
                and you&apos;ll reach them from the navigation.
              </p>
            </div>
          </section>
        </div>

        {/* Your pods */}
        {myPods.length > 0 && (
          <section className="bg-eten-panel border-eten-line flex flex-col gap-4 rounded-[18px] border p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-eten-ink text-[18px] font-bold">
                  Your pods
                </h2>
                <p className="text-eten-ink-muted mt-1 text-[13px]">
                  The {myPods.length} communit
                  {myPods.length === 1 ? "y" : "ies"} you belong to.
                </p>
              </div>
              <Link
                href="/pods"
                className="border-eten-line text-eten-ink hover:bg-eten-hover inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-[13px] font-semibold transition-colors"
              >
                <LayoutGrid className="size-4" strokeWidth={2} />
                Explore pods
              </Link>
            </div>
            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))] gap-3">
              {myPods.map((p) => (
                <Link
                  key={p.slug}
                  href={`/pods/${p.slug}`}
                  className="border-eten-line hover:border-eten-accent/40 flex items-center gap-3 rounded-[14px] border p-3.5 transition-colors"
                >
                  <span className="bg-eten-accent-soft text-eten-accent grid size-10 shrink-0 place-items-center rounded-xl text-[13px] font-extrabold">
                    {initials(p.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="text-eten-ink truncate text-[14px] font-bold">
                      {p.name}
                    </div>
                    <div className="text-eten-faint text-[12px]">#{p.slug}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  tone,
  Icon,
  label,
  value,
}: {
  tone: "verified" | "accent";
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  const square =
    tone === "verified"
      ? "bg-eten-verified-soft text-eten-verified"
      : "bg-eten-accent-soft text-eten-accent";
  return (
    <div className="bg-eten-panel border-eten-line flex items-center gap-3.5 rounded-[18px] border p-[18px]">
      <span
        className={
          "grid size-11 shrink-0 place-items-center rounded-xl " + square
        }
      >
        <Icon className="size-5" strokeWidth={2} />
      </span>
      <div>
        <div className="text-eten-ink-muted text-[13px]">{label}</div>
        <div className="text-eten-ink text-[17px] font-bold capitalize">
          {value}
        </div>
      </div>
    </div>
  );
}

/** Profile-completeness ring + the next steps to fill in. */
function CompletionCard({
  completeness,
}: {
  completeness: Completeness | null;
}) {
  if (!completeness) {
    return (
      <section className="bg-eten-panel border-eten-line flex min-w-0 flex-[3_1_460px] items-center gap-4 rounded-[18px] border p-6">
        <Sparkles className="text-eten-accent size-6" />
        <p className="text-eten-ink-muted text-sm">
          Confirm your email to start building your profile.
        </p>
      </section>
    );
  }

  const { percent, done, total, items } = completeness;
  const remaining = items.filter((i) => !i.done);
  const R = 56;
  const C = 2 * Math.PI * R;
  const dash = (C * percent) / 100;

  return (
    <section className="bg-eten-panel border-eten-line flex min-w-0 flex-[3_1_460px] flex-wrap items-start gap-6 rounded-[18px] border p-6">
      <div className="relative size-[132px] shrink-0">
        <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true">
          <circle
            cx="66"
            cy="66"
            r={R}
            fill="none"
            stroke="var(--color-eten-accent-soft)"
            strokeWidth="12"
          />
          <circle
            cx="66"
            cy="66"
            r={R}
            fill="none"
            stroke="var(--color-eten-accent)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            transform="rotate(-90 66 66)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-eten-ink text-[28px] font-extrabold">
            {percent}%
          </span>
          <span className="text-eten-ink-muted text-[12px]">
            {done} of {total}
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3.5">
        <div>
          <h2 className="text-eten-ink text-[18px] font-bold">
            Complete your profile
          </h2>
          <p className="text-eten-ink-muted mt-1 text-[13px] leading-relaxed">
            A full profile helps pod leads and mentors find you. Tick a step off
            as you finish it.
          </p>
        </div>

        {remaining.length === 0 ? (
          <div className="text-eten-verified inline-flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="size-5" /> Your profile is complete.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {remaining.slice(0, 4).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="border-eten-line hover:border-eten-accent/40 hover:bg-eten-hover group flex min-h-12 items-center gap-3 rounded-xl border px-3.5 py-2 transition-colors"
              >
                <span className="border-eten-faint/50 grid size-5 shrink-0 place-items-center rounded-full border-2" />
                <span className="text-eten-ink flex-1 text-[14px] font-semibold">
                  {item.label}
                </span>
                <ArrowRight className="text-eten-faint size-4 shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {remaining.length > 4 && (
          <Link
            href="/profile"
            className="text-eten-accent text-[13px] font-semibold"
          >
            +{remaining.length - 4} more steps on your profile
          </Link>
        )}
      </div>
    </section>
  );
}
