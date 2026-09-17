import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Boxes, Star, Users } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Pods",
  robots: { index: false, follow: false },
};

export default async function AdminPodsPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();

  const [{ data: podRows }, { data: membershipRows }, { data: profileRows }] =
    await Promise.all([
      admin
        .from("pods")
        .select("id, slug, name, description, is_main")
        .order("name"),
      admin.from("pod_memberships").select("pod_id, member_id, role_in_pod"),
      admin.from("profiles").select("member_id, primary_specialization_pod_id"),
    ]);

  const primaryByMember = new Map<string, string | null>();
  for (const p of profileRows ?? []) {
    primaryByMember.set(p.member_id, p.primary_specialization_pod_id);
  }

  // Per-pod tallies + specialist multi-pod membership.
  const total = new Map<string, number>();
  const leads = new Map<string, number>();
  const primaryCount = new Map<string, number>();
  const specialistPodsByMember = new Map<string, Set<string>>();

  const podById = new Map((podRows ?? []).map((p) => [p.id, p]));

  for (const m of membershipRows ?? []) {
    total.set(m.pod_id, (total.get(m.pod_id) ?? 0) + 1);
    if (m.role_in_pod === "lead" || m.role_in_pod === "co_lead") {
      leads.set(m.pod_id, (leads.get(m.pod_id) ?? 0) + 1);
    }
    if (primaryByMember.get(m.member_id) === m.pod_id) {
      primaryCount.set(m.pod_id, (primaryCount.get(m.pod_id) ?? 0) + 1);
    }
    if (!podById.get(m.pod_id)?.is_main) {
      const set = specialistPodsByMember.get(m.member_id) ?? new Set<string>();
      set.add(m.pod_id);
      specialistPodsByMember.set(m.member_id, set);
    }
  }

  let multiPodMembers = 0;
  let membersInSpecialistPods = 0;
  for (const set of specialistPodsByMember.values()) {
    membersInSpecialistPods += 1;
    if (set.size > 1) multiPodMembers += 1;
  }

  const allPods = podRows ?? [];
  const mainPod = allPods.find((p) => p.is_main) ?? null;
  const specialistPods = allPods.filter((p) => !p.is_main);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-6">
      <header className="mb-6">
        <h1 className="text-eten-ink text-2xl font-extrabold tracking-[-0.02em]">
          Pods
        </h1>
        <p className="text-eten-ink-muted mt-1 text-sm">
          Specialist communities and their membership. Open a pod to see its
          roster.
        </p>
      </header>

      {/* Summary */}
      <div className="mb-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        <Summary label="Specialist pods" value={specialistPods.length} />
        <Summary label="Members in a pod" value={membersInSpecialistPods} />
        <Summary label="Members in ≥2 pods" value={multiPodMembers} />
      </div>

      {/* Pod grid */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {specialistPods.map((pod) => (
          <Link
            key={pod.id}
            href={`/admin/pods/${pod.slug}`}
            className="group bg-eten-panel border-eten-line hover:border-eten-accent/50 flex flex-col rounded-2xl border p-5 transition-colors"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-eten-accent font-mono text-xs">
                #{pod.slug}
              </span>
              <ArrowRight className="text-eten-faint size-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <h2 className="text-eten-ink font-bold">{pod.name}</h2>
            {pod.description && (
              <p className="text-eten-faint mt-1 line-clamp-2 text-xs">
                {pod.description}
              </p>
            )}
            <div className="text-eten-ink-muted mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" />
                <b className="text-eten-ink font-semibold tabular-nums">
                  {total.get(pod.id) ?? 0}
                </b>{" "}
                members
              </span>
              {(leads.get(pod.id) ?? 0) > 0 && (
                <span className="text-eten-faint">
                  {leads.get(pod.id)} lead
                  {leads.get(pod.id) === 1 ? "" : "s"}
                </span>
              )}
              <span className="text-eten-accent inline-flex items-center gap-1">
                <Star className="size-3.5" />
                {primaryCount.get(pod.id) ?? 0} primary
              </span>
            </div>
          </Link>
        ))}
      </div>

      {specialistPods.length === 0 && (
        <div className="bg-eten-panel border-eten-line text-eten-faint flex flex-col items-center gap-3 rounded-2xl border p-16 text-center">
          <Boxes className="text-eten-faint/50 size-10" />
          <p>No specialist pods yet.</p>
        </div>
      )}

      {/* Main community */}
      {mainPod && (
        <div className="border-eten-line-soft mt-6 flex items-center justify-between gap-3 rounded-2xl border border-dashed p-5">
          <div>
            <h2 className="text-eten-ink text-sm font-semibold">
              {mainPod.name}
            </h2>
            <p className="text-eten-faint text-xs">
              The shared community feed — every member belongs here.
            </p>
          </div>
          <span className="text-eten-ink-muted inline-flex items-center gap-1.5 text-sm">
            <Users className="size-4" />
            <b className="text-eten-ink font-semibold tabular-nums">
              {total.get(mainPod.id) ?? 0}
            </b>
          </span>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-eten-panel border-eten-line rounded-2xl border p-4">
      <div className="text-eten-faint text-xs font-semibold">{label}</div>
      <div className="text-eten-ink mt-1.5 text-2xl font-extrabold tabular-nums">
        {value}
      </div>
    </div>
  );
}
