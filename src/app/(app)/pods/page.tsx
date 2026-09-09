import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { PodsDirectory, type PodCard } from "./pods-directory";

export const metadata: Metadata = {
  title: "Explore Pods",
  robots: { index: false, follow: false },
};

export default async function PodsPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();

  // Specialist pods only (the Main Community is the shared feed, not a joinable
  // specialism). RLS lets any active member read pods + all memberships.
  const [{ data: podRows }, { data: membershipRows }, { data: profile }] =
    await Promise.all([
      supabase
        .from("pods")
        .select("id, slug, name, description")
        .eq("is_main", false)
        .order("name"),
      supabase.from("pod_memberships").select("pod_id, member_id"),
      supabase
        .from("profiles")
        .select("primary_specialization_pod_id")
        .eq("member_id", member.id)
        .maybeSingle(),
    ]);

  const memberships = membershipRows ?? [];
  const counts = new Map<string, number>();
  const mine = new Set<string>();
  for (const m of memberships) {
    counts.set(m.pod_id, (counts.get(m.pod_id) ?? 0) + 1);
    if (m.member_id === member.id) mine.add(m.pod_id);
  }

  const primaryPodId = profile?.primary_specialization_pod_id ?? null;

  const pods: PodCard[] = (podRows ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    memberCount: counts.get(p.id) ?? 0,
    isMember: mine.has(p.id),
    isPrimary: p.id === primaryPodId,
  }));

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-4 py-6 lg:px-8">
      <header className="mb-6">
        <h1 className="font-display text-eten-ink text-xl font-semibold">
          Explore Pods
        </h1>
        <p className="text-eten-faint mt-1.5 text-sm">
          The specialist communities where members do their best work. Join the
          ones that match your expertise — your primary pod is set from your
          profile.
        </p>
      </header>

      <PodsDirectory pods={pods} />
    </div>
  );
}
