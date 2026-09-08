import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Eye,
  FileText,
  Settings,
} from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  ProfileForm,
  type PodOption,
  type ProfileInitial,
  type SkillGroup,
} from "./profile-form";

export const metadata: Metadata = {
  title: "My Profile",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();

  const [
    { data: profile },
    { data: podRows },
    { data: skillRows },
    { data: mySkillRows },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, headline, job_title, location, industry_experience, availability_status, bio, languages, years_experience, primary_specialization_pod_id, resume_path",
      )
      .eq("member_id", member.id)
      .maybeSingle(),
    supabase.from("pods").select("id, name").eq("is_main", false).order("name"),
    supabase
      .from("skills")
      .select("id, name, pod_id")
      .eq("is_active", true)
      .order("sort", { ascending: true, nullsFirst: false })
      .order("name"),
    supabase
      .from("member_skills")
      .select("skill_id")
      .eq("member_id", member.id),
  ]);

  const pods: PodOption[] = podRows ?? [];

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

  const initial: ProfileInitial = {
    fullName: profile?.full_name ?? member.fullName ?? "",
    headline: profile?.headline ?? "",
    jobTitle: profile?.job_title ?? "",
    location: profile?.location ?? "",
    industryExperience: profile?.industry_experience ?? "",
    availabilityStatus: profile?.availability_status ?? "",
    bio: profile?.bio ?? "",
    languages: profile?.languages ?? [],
    yearsExperience: profile?.years_experience ?? null,
    primaryPodId: profile?.primary_specialization_pod_id ?? null,
  };

  const initialSkillIds = (mySkillRows ?? []).map((r) => r.skill_id);
  const hasResume = Boolean(profile?.resume_path);

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <header className="mb-8">
        <Link
          href="/dashboard"
          className="text-on-surface-variant hover:text-on-surface mb-4 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
        <p className="text-label-sm text-primary font-mono tracking-widest uppercase">
          My Profile
        </p>
        <h1 className="font-display text-headline-md text-on-surface mt-1 font-bold">
          Edit your profile
        </h1>
        <p className="text-on-surface-variant mt-2 text-sm">
          This is your credential-backed identity across ETEN. Keep it current
          so peers and pods can find you.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Link
            href={`/members/${member.id}`}
            className="text-primary inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
          >
            <Eye className="size-4" />
            View public profile
          </Link>
          <Link
            href="/settings"
            className="text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1.5 text-sm font-semibold"
          >
            <Settings className="size-4" />
            Settings
          </Link>
        </div>
      </header>

      <Link
        href="/profile/certifications"
        className="glass-card mb-8 flex items-center gap-4 rounded-2xl p-5 transition-colors hover:bg-white/5"
      >
        <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
          <BadgeCheck className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-on-surface block font-semibold">
            Certifications &amp; credentials
          </span>
          <span className="text-on-surface-variant block text-sm">
            Add certifications and upload proof for verification.
          </span>
        </span>
        <ChevronRight className="text-on-surface-variant size-5 shrink-0" />
      </Link>

      {hasResume && (
        <a
          href="/api/member/resume"
          target="_blank"
          rel="noopener noreferrer"
          className="glass-card mb-8 flex items-center gap-4 rounded-2xl p-5 transition-colors hover:bg-white/5"
        >
          <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
            <FileText className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-on-surface block font-semibold">
              Your résumé
            </span>
            <span className="text-on-surface-variant block text-sm">
              The résumé you submitted when you registered — on file with your
              profile. Opens in a new tab.
            </span>
          </span>
          <ChevronRight className="text-on-surface-variant size-5 shrink-0" />
        </a>
      )}

      <ProfileForm
        initial={initial}
        pods={pods}
        skillGroups={skillGroups}
        initialSkillIds={initialSkillIds}
      />
    </div>
  );
}
