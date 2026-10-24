import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes, Grid2x2, Users } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { PodsBrowser, type PodCard } from "./pods-browser";

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
      admin
        .from("profiles")
        .select("member_id, full_name, primary_specialization_pod_id"),
    ]);

  const primaryByMember = new Map<string, string | null>();
  const nameByMember = new Map<string, string>();
  for (const p of profileRows ?? []) {
    primaryByMember.set(p.member_id, p.primary_specialization_pod_id);
    nameByMember.set(p.member_id, p.full_name);
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

  let membersInSpecialistPods = 0;
  const multiPodList: { memberId: string; name: string; pods: string[] }[] = [];
  for (const [memberId, set] of specialistPodsByMember) {
    membersInSpecialistPods += 1;
    if (set.size > 1) {
      const podNames = [...set]
        .map((id) => podById.get(id)?.name ?? "")
        .filter(Boolean)
        .sort();
      multiPodList.push({
        memberId,
        name: nameByMember.get(memberId) ?? "—",
        pods: podNames,
      });
    }
  }
  multiPodList.sort((a, b) => a.name.localeCompare(b.name));
  const multiPodMembers = multiPodList.length;

  const allPods = podRows ?? [];
  const mainPod = allPods.find((p) => p.is_main) ?? null;
  const specialistPods = allPods.filter((p) => !p.is_main);

  const podCards: PodCard[] = specialistPods.map((pod) => {
    const count = total.get(pod.id) ?? 0;
    const primary = primaryCount.get(pod.id) ?? 0;
    return {
      slug: pod.slug,
      name: pod.name,
      mono:
        pod.slug
          .replace(/[^a-z0-9]/gi, "")
          .slice(0, 2)
          .toUpperCase() || "P",
      description: pod.description,
      count,
      primary,
      pct: count > 0 ? Math.round((primary / count) * 100) : 0,
    };
  });

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-7 md:px-8">
      <header className="mb-6 max-w-[620px]">
        <h1 className="text-eten-ink text-[30px] font-extrabold tracking-[-0.02em]">
          Pods
        </h1>
        <p className="text-eten-ink-muted mt-1.5 text-[15px] leading-relaxed">
          Specialist communities and their membership. Open a pod to see its
          roster.
        </p>
      </header>

      {/* Summary */}
      <div className="mb-6 grid [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <Summary
          Icon={Boxes}
          label="Specialist pods"
          value={specialistPods.length}
        />
        <Summary
          Icon={Users}
          label="Members in a pod"
          value={membersInSpecialistPods}
        />
        <Summary
          Icon={Grid2x2}
          label="Members in 2+ pods"
          value={multiPodMembers}
        />
      </div>

      {specialistPods.length === 0 ? (
        <div className="bg-eten-panel border-eten-line text-eten-faint flex flex-col items-center gap-3 rounded-2xl border p-16 text-center">
          <Boxes className="text-eten-faint/50 size-10" />
          <p>No specialist pods yet.</p>
        </div>
      ) : (
        <PodsBrowser pods={podCards} />
      )}

      {/* Multi-pod report */}
      {multiPodList.length > 0 && (
        <section className="bg-eten-panel border-eten-line mt-6 rounded-2xl border p-5 sm:p-6">
          <h2 className="text-eten-ink text-sm font-bold">
            Members in multiple pods · {multiPodList.length}
          </h2>
          <p className="text-eten-faint mt-0.5 mb-4 text-xs">
            Members who belong to more than one specialist pod.
          </p>
          <ul className="flex flex-col">
            {multiPodList.map((m) => (
              <li
                key={m.memberId}
                className="border-eten-line-soft flex flex-wrap items-center justify-between gap-3 border-t py-2.5 first:border-t-0"
              >
                <Link
                  href={`/admin/members/${m.memberId}`}
                  className="text-eten-ink text-sm font-semibold hover:underline"
                >
                  {m.name}
                </Link>
                <span className="flex flex-wrap gap-1">
                  {m.pods.map((p) => (
                    <span
                      key={p}
                      className="bg-eten-panel-hi border-eten-line text-eten-ink-muted rounded-full border px-2 py-0.5 text-[11.5px] font-medium"
                    >
                      {p}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
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

function Summary({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-eten-panel border-eten-line flex items-center gap-4 rounded-2xl border p-5">
      <span className="bg-eten-accent-soft text-eten-accent grid size-12 shrink-0 place-items-center rounded-[14px]">
        <Icon className="size-[22px]" strokeWidth={1.8} />
      </span>
      <div>
        <div className="text-eten-ink-muted text-[13px] font-semibold">
          {label}
        </div>
        <div className="text-eten-ink text-[28px] font-extrabold tracking-[-0.02em] tabular-nums">
          {value}
        </div>
      </div>
    </div>
  );
}
