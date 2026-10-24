import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
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

  const joinedCount = pods.filter((p) => p.isMember).length;
  const primaryPod = pods.find((p) => p.isPrimary) ?? null;

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-8 md:px-8 md:py-9">
      <div className="flex flex-col gap-[22px]">
        <header className="max-w-[720px]">
          <span className="text-eten-accent text-[12px] font-bold tracking-[0.12em] uppercase">
            Community
          </span>
          <h1 className="text-eten-ink mt-1 text-[30px] font-extrabold tracking-[-0.02em]">
            Explore Pods
          </h1>
          <p className="text-eten-ink-muted mt-1.5 text-[15px] leading-relaxed">
            The specialist communities where members do their best work. Join
            the ones that match your expertise. Your primary pod is set from
            your profile.
          </p>
        </header>

        {/* Primary pod + summary */}
        <div className="flex flex-wrap gap-4">
          {primaryPod ? (
            <section
              className="relative flex flex-[2_1_420px] flex-wrap items-center gap-[18px] overflow-hidden rounded-[20px] p-6 text-white"
              style={{
                background:
                  "linear-gradient(135deg, #110263 0%, #35007F 55%, #7530E6 100%)",
              }}
            >
              <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl border border-white/25 bg-white/10 text-[18px] font-extrabold">
                {initials(primaryPod.name)}
              </span>
              <div className="relative min-w-0 flex-[1_1_220px]">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-[#D9CCFB] uppercase">
                  <Star className="size-3 fill-current" />
                  Your primary pod
                </div>
                <div className="mt-1 text-[20px] font-extrabold">
                  {primaryPod.name}
                </div>
                <div className="mt-0.5 text-[13px] text-[#E4DBFC]">
                  {primaryPod.description ? `${primaryPod.description} · ` : ""}
                  {primaryPod.memberCount} members
                </div>
              </div>
              <Link
                href="/profile"
                className="relative inline-flex h-[42px] items-center rounded-xl bg-white px-4 text-[13px] font-bold text-[#110263] transition-opacity hover:opacity-90"
              >
                Change in profile
              </Link>
            </section>
          ) : (
            <section className="bg-eten-panel border-eten-line flex flex-[2_1_420px] items-center rounded-[20px] border p-6">
              <p className="text-eten-ink-muted text-sm">
                Set a primary pod from your{" "}
                <Link
                  href="/profile"
                  className="text-eten-accent font-semibold"
                >
                  profile
                </Link>{" "}
                to anchor your specialism.
              </p>
            </section>
          )}

          <section className="grid flex-[1_1_240px] grid-cols-2 gap-3">
            <div className="bg-eten-panel border-eten-line rounded-2xl border p-4">
              <div className="text-eten-ink text-[26px] font-extrabold">
                {joinedCount}
              </div>
              <div className="text-eten-ink-muted text-[13px]">Pods joined</div>
            </div>
            <div className="bg-eten-panel border-eten-line rounded-2xl border p-4">
              <div className="text-eten-ink text-[26px] font-extrabold">
                {pods.length - joinedCount}
              </div>
              <div className="text-eten-ink-muted text-[13px]">
                Open to join
              </div>
            </div>
            <div className="border-eten-accent/20 bg-eten-accent-soft text-eten-ink-muted col-span-2 rounded-2xl border p-4 text-[13px] leading-relaxed">
              <strong className="text-eten-ink">{pods.length} pods</strong>{" "}
              across cloud, security, data and modern work.
            </div>
          </section>
        </div>

        <PodsDirectory pods={pods} />
      </div>
    </div>
  );
}
