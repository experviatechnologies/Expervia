import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata = { title: "Validate your account" };

export default async function MentorshipValidatePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/mentorship/signin");

  const { data: member } = await supabase
    .from("members")
    .select("validated_at")
    .eq("id", user.id)
    .maybeSingle();
  if (member?.validated_at) redirect("/mentorship/dashboard");

  return (
    <div className="mx-auto max-w-[620px] px-6 py-12">
      <Link
        href="/mentorship/dashboard"
        className="text-mnt-faint hover:text-mnt-ink text-[13px]"
      >
        ← Back
      </Link>

      <span className="border-mnt-amber/30 bg-mnt-amber/10 text-mnt-amber mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] uppercase">
        Prospect → ETEN-Validated
      </span>
      <h1 className="font-display mt-4 text-3xl font-extrabold tracking-tight">
        Validate your account
      </h1>
      <p className="text-mnt-ink-muted mt-3 text-[15px] leading-relaxed">
        You are exploring as a Prospect. Becoming a full ETEN member validates
        your account, so you can join a live Circle, have your evidence counted,
        and earn recognition toward your readiness level.
      </p>

      <div className="bg-mnt-panel border-mnt-line mt-6 rounded-2xl border p-5">
        <div className="text-mnt-faint font-mono text-[10.5px] tracking-[0.13em] uppercase">
          What validation unlocks
        </div>
        <ul className="mt-3 flex flex-col gap-2.5 text-[13.5px]">
          {[
            "Join a live Circle as a mentee, or apply to mentor",
            "Approved evidence lands on your capability passport",
            "Expert Score and badges count toward your V-level",
            "Full access to the wider ETEN community",
          ].map((t) => (
            <li key={t} className="flex gap-2.5">
              <span className="text-mnt-green">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/onboarding?next=/mentorship/dashboard"
        className="bg-mnt-brand text-mnt-on-brand mt-6 inline-block rounded-[11px] px-6 py-3.5 text-[15px] font-bold transition hover:brightness-110"
      >
        Continue to ETEN membership
      </Link>
      <p className="text-mnt-faint mt-3 text-[12px]">
        You will pick your primary pod and skills, then return here as a
        validated member.
      </p>
    </div>
  );
}
