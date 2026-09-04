import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MailWarning } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  OnboardingForm,
  type PodOption,
  type SkillGroup,
} from "./onboarding-form";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: "Set up your ETEN profile",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();

  // Already onboarded? (primary pod chosen) — nothing to do here.
  const { data: profile } = await supabase
    .from("profiles")
    .select("primary_specialization_pod_id")
    .eq("member_id", member.id)
    .maybeSingle();
  if (profile?.primary_specialization_pod_id) redirect("/dashboard");

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-label-sm text-primary font-mono tracking-widest uppercase">
            Welcome to ETEN
          </p>
          <h1 className="font-display text-headline-md text-on-surface mt-1 font-bold">
            Let&apos;s set up your profile
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm">
            Two quick choices and you&apos;re in — this shapes your feed and how
            peers find you.
          </p>
        </div>
        <SignOutButton />
      </header>

      {!member.emailConfirmed ? (
        <div className="glass-card flex items-start gap-3 rounded-2xl p-6">
          <MailWarning className="text-primary mt-0.5 size-5 shrink-0" />
          <div className="text-sm">
            <p className="text-on-surface font-medium">
              Confirm your email to continue.
            </p>
            <p className="text-on-surface-variant mt-1">
              We sent a link to{" "}
              <span className="text-on-surface">{member.email}</span>. Click it,
              then come back here to finish setting up your profile.
            </p>
          </div>
        </div>
      ) : (
        <OnboardingContent supabase={supabase} />
      )}
    </div>
  );
}

/**
 * Loads the specialist pods and the active skills taxonomy (grouped by pod) and
 * hands them to the client form. Split out so the email-unconfirmed branch above
 * doesn't run these queries.
 */
async function OnboardingContent({
  supabase,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
}) {
  const [{ data: podRows }, { data: skillRows }] = await Promise.all([
    supabase
      .from("pods")
      .select("id, slug, name, description")
      .eq("is_main", false)
      .order("name"),
    supabase
      .from("skills")
      .select("id, name, pod_id")
      .eq("is_active", true)
      .order("sort", { ascending: true, nullsFirst: false })
      .order("name"),
  ]);

  const pods: PodOption[] = podRows ?? [];

  // Group active skills under their pod, preserving pod order.
  const skillsByPod = new Map<string, { id: string; name: string }[]>();
  for (const skill of skillRows ?? []) {
    const list = skillsByPod.get(skill.pod_id) ?? [];
    list.push({ id: skill.id, name: skill.name });
    skillsByPod.set(skill.pod_id, list);
  }
  const skillGroups: SkillGroup[] = pods.map((pod) => ({
    podId: pod.id,
    podName: pod.name,
    skills: skillsByPod.get(pod.id) ?? [],
  }));

  return <OnboardingForm pods={pods} skillGroups={skillGroups} />;
}
