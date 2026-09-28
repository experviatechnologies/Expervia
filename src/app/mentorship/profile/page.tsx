import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { MentorProfileForm, type SkillGroup } from "./profile-form";

export const metadata = { title: "Your profile" };

export default async function MentorshipProfilePage() {
  const member = await getCurrentMember();
  if (!member) redirect("/mentorship/signin");

  const admin = getSupabaseAdmin();

  const [
    { data: memberRow },
    { data: profile },
    { data: mySkills },
    { data: podRows },
    { data: skillRows },
  ] = await Promise.all([
    admin
      .from("members")
      .select("mentorship_intent")
      .eq("id", member.id)
      .maybeSingle(),
    admin
      .from("profiles")
      .select("full_name, headline, bio")
      .eq("member_id", member.id)
      .maybeSingle(),
    admin.from("member_skills").select("skill_id").eq("member_id", member.id),
    admin.from("pods").select("id, name").eq("is_main", false).order("name"),
    admin
      .from("skills")
      .select("id, name, pod_id")
      .eq("is_active", true)
      .order("sort", { ascending: true, nullsFirst: false })
      .order("name"),
  ]);

  const backHref =
    memberRow?.mentorship_intent === "mentor"
      ? "/mentorship/mentor"
      : "/mentorship/dashboard";

  const pods = podRows ?? [];
  const skillsByPod = new Map<string, { id: string; name: string }[]>();
  for (const s of skillRows ?? []) {
    const list = skillsByPod.get(s.pod_id) ?? [];
    list.push({ id: s.id, name: s.name });
    skillsByPod.set(s.pod_id, list);
  }
  const skillGroups: SkillGroup[] = pods
    .map((p) => ({
      podId: p.id,
      podName: p.name,
      skills: skillsByPod.get(p.id) ?? [],
    }))
    .filter((g) => g.skills.length > 0);

  const initialSelected = (mySkills ?? []).map((r) => r.skill_id);

  return (
    <div className="mx-auto max-w-[820px] px-6 py-8">
      <Link
        href={backHref}
        className="text-mnt-faint hover:text-mnt-ink text-[13px]"
      >
        ← Back to dashboard
      </Link>

      <header className="mt-3">
        <h1 className="font-display text-2xl font-extrabold">
          {profile?.full_name ?? "Your profile"}
        </h1>
        <p className="text-mnt-ink-muted mt-1 text-[14px]">
          Add a headline, a short bio, and the skills you can mentor in. These
          help mentees find and choose you.
        </p>
      </header>

      <MentorProfileForm
        initialHeadline={profile?.headline ?? ""}
        initialBio={profile?.bio ?? ""}
        initialSelected={initialSelected}
        skillGroups={skillGroups}
      />
    </div>
  );
}
