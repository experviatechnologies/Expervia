import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { CreateCircleForm } from "./create-circle-form";

export const metadata: Metadata = {
  title: "Create a Circle",
  robots: { index: false, follow: false },
};

export default async function NewCirclePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();

  const { data: pod } = await supabase
    .from("pods")
    .select("id, slug, name, is_main")
    .eq("slug", slug)
    .maybeSingle();
  if (!pod || pod.is_main) notFound();

  // Caller must lead this pod (pod_memberships is readable by active members).
  const { data: myMembership } = await supabase
    .from("pod_memberships")
    .select("role_in_pod")
    .eq("pod_id", pod.id)
    .eq("member_id", member.id)
    .maybeSingle();
  const isLead =
    myMembership?.role_in_pod === "lead" ||
    myMembership?.role_in_pod === "co_lead";
  if (!isLead) redirect(`/pods/${slug}`);

  // Pod members + names, and which of them are Verified Mentors.
  const { data: membershipRows } = await supabase
    .from("pod_memberships")
    .select("member_id")
    .eq("pod_id", pod.id);
  const memberIds = (membershipRows ?? []).map((m) => m.member_id);

  const [{ data: profileRows }, { data: mentorRows }] = await Promise.all([
    memberIds.length
      ? supabase
          .from("profiles")
          .select("member_id, full_name")
          .in("member_id", memberIds)
      : Promise.resolve({ data: [] }),
    memberIds.length
      ? supabase
          .from("mentor_profiles")
          .select("member_id")
          .in("member_id", memberIds)
      : Promise.resolve({ data: [] }),
  ]);

  const nameById = new Map(
    (profileRows ?? []).map((p) => [p.member_id, p.full_name ?? "A member"]),
  );
  const mentorIds = new Set((mentorRows ?? []).map((m) => m.member_id));

  const candidates = memberIds
    .map((id) => ({ id, name: nameById.get(id) ?? "A member" }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const mentors = candidates.filter((c) => mentorIds.has(c.id));

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-6 py-12">
      <header className="mb-8">
        <Link
          href={`/pods/${slug}`}
          className="text-eten-faint hover:text-eten-ink mb-4 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to {pod.name}
        </Link>
        <h1 className="font-display text-headline-md text-eten-ink font-bold">
          Create a Circle
        </h1>
        <p className="text-eten-ink-muted mt-2 text-sm">
          Assemble a Mentorship Circle for {pod.name}: a Verified Mentor and up
          to 10 mentees from this pod. Mentees set their goals next, then you
          activate it.
        </p>
      </header>

      <CreateCircleForm
        podId={pod.id}
        mentors={mentors}
        candidates={candidates}
      />
    </div>
  );
}
