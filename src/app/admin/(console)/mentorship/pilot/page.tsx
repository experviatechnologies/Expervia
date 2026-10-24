import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, GraduationCap, AlertTriangle, Users } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { RegisterMentorControl } from "./register-mentor-control";
import { PilotPods, type PilotPod } from "./pilot-pods";

export const metadata: Metadata = {
  title: "Mentorship pilot",
  robots: { index: false, follow: false },
};

// Best-guess default capability area per pod slug (ops can override in the UI).
const POD_AREA_GUESS: Record<string, string> = {
  "azure-infra": "cloud-infrastructure",
  aws: "cloud-infrastructure",
  gcp: "cloud-infrastructure",
  "data-ai": "data-ai",
  "modern-work": "modern-work",
  security: "cybersecurity",
  "isc2-cybersecurity": "cybersecurity",
  "isaca-cybersecurity": "cybersecurity",
  "biz-apps": "business-applications",
  "dev-tools": "software-development",
  "software-engineering": "software-development",
  devops: "software-development",
};

export default async function MentorshipPilotPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();

  const [
    { data: podRows },
    { data: membershipRows },
    { data: profileRows },
    { data: mentorRows },
    { data: memberRows },
    { data: areaRows },
  ] = await Promise.all([
    admin
      .from("pods")
      .select("id, name, slug, is_main")
      .eq("is_main", false)
      .order("name"),
    admin.from("pod_memberships").select("member_id, pod_id, role_in_pod"),
    admin.from("profiles").select("member_id, full_name"),
    admin.from("mentor_profiles").select("member_id"),
    admin.from("members").select("id, status"),
    admin
      .from("capability_areas")
      .select("id, slug, label")
      .eq("active", true)
      .order("sort_order"),
  ]);

  const pods = podRows ?? [];
  const areas = (areaRows ?? []).map((a) => ({ id: a.id, label: a.label }));
  const areaIdBySlug = new Map((areaRows ?? []).map((a) => [a.slug, a.id]));
  const defaultAreaId = areas[0]?.id ?? "";
  const nameById = new Map(
    (profileRows ?? []).map((p) => [p.member_id, p.full_name ?? "A member"]),
  );
  const podById = new Map(pods.map((p) => [p.id, p]));
  const activeSet = new Set(
    (memberRows ?? []).filter((m) => m.status === "active").map((m) => m.id),
  );
  const mentorSet = new Set((mentorRows ?? []).map((m) => m.member_id));

  // Pod leaders (active), one row per (member, pod) lead.
  type LeaderRow = {
    memberId: string;
    podId: string;
    podName: string;
    podSlug: string;
    role: string;
    isMentor: boolean;
  };
  const leaders: LeaderRow[] = [];
  for (const m of membershipRows ?? []) {
    if (m.role_in_pod !== "lead" && m.role_in_pod !== "co_lead") continue;
    if (!activeSet.has(m.member_id)) continue;
    const pod = podById.get(m.pod_id);
    if (!pod) continue;
    leaders.push({
      memberId: m.member_id,
      podId: m.pod_id,
      podName: pod.name,
      podSlug: pod.slug,
      role: m.role_in_pod,
      isMentor: mentorSet.has(m.member_id),
    });
  }
  leaders.sort((a, b) => a.podName.localeCompare(b.podName));

  // Candidate pilot mentees per pod: active plain members who aren't mentors.
  const menteesByPod = new Map<string, string[]>();
  for (const m of membershipRows ?? []) {
    if (m.role_in_pod !== "member") continue;
    if (!activeSet.has(m.member_id)) continue;
    if (mentorSet.has(m.member_id)) continue;
    if (!podById.has(m.pod_id)) continue;
    const list = menteesByPod.get(m.pod_id) ?? [];
    list.push(nameById.get(m.member_id) ?? "A member");
    menteesByPod.set(m.pod_id, list);
  }

  // Summary figures + per-pod candidate cards.
  const podsWithLeader = new Set(leaders.map((l) => l.podId)).size;
  const podsWithoutLeader = pods.length - podsWithLeader;
  const leaderByPod = new Map<string, string>();
  for (const l of leaders)
    if (!leaderByPod.has(l.podId))
      leaderByPod.set(l.podId, nameById.get(l.memberId) ?? "A member");
  const podCards: PilotPod[] = pods.map((p) => {
    const list = menteesByPod.get(p.id) ?? [];
    return {
      slug: p.slug,
      name: p.name,
      count: list.length,
      names: list.slice(0, 4),
      hasLeader: leaderByPod.has(p.id),
      leaderName: leaderByPod.get(p.id) ?? null,
    };
  });
  const candidatePlaces = podCards.reduce((sum, p) => sum + p.count, 0);
  const maxCount = Math.max(1, ...podCards.map((p) => p.count));

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-7 md:px-8">
      {/* Heading + back */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[680px]">
          <h1 className="text-eten-ink text-[30px] font-extrabold tracking-[-0.02em]">
            Mentorship pilot
          </h1>
          <p className="text-eten-ink-muted mt-1.5 text-[15px] leading-relaxed">
            Register pod leaders as verified mentors and see the candidate pilot
            mentees in each pod.
          </p>
        </div>
        <Link
          href="/admin/mentorship"
          className="border-eten-line text-eten-ink hover:bg-eten-hover inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Back to Mentorship
        </Link>
      </header>

      {/* Summary */}
      <div className="mb-6 grid [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <Summary
          Icon={GraduationCap}
          tone="accent"
          label="Pod leaders"
          value={String(leaders.length)}
        />
        <Summary
          Icon={AlertTriangle}
          tone="amber"
          label="Pods without a leader"
          value={`${podsWithoutLeader} of ${pods.length}`}
        />
        <Summary
          Icon={Users}
          tone="accent"
          label="Candidate places across pods"
          value={String(candidatePlaces)}
        />
      </div>

      {/* Pod leaders */}
      <section className="mb-6">
        <div className="mb-3 flex items-center gap-2.5">
          <h2 className="text-eten-ink text-[17px] font-bold">Pod leaders</h2>
          <span className="bg-eten-panel-hi text-eten-ink-muted rounded-full px-2.5 py-0.5 text-[13px] font-bold">
            {leaders.length}
          </span>
        </div>
        {leaders.length === 0 ? (
          <div className="border-eten-line bg-eten-panel-hi flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center">
            <span className="bg-eten-accent-soft text-eten-accent grid size-14 place-items-center rounded-2xl">
              <GraduationCap className="size-6" strokeWidth={1.8} />
            </span>
            <div className="text-eten-ink text-[16px] font-bold">
              No pod leaders yet
            </div>
            <p className="text-eten-ink-muted max-w-[460px] text-[13px] leading-relaxed">
              Pod leads are set on each pod. Once a pod has a lead, register
              them as a verified mentor here so the pod has someone to guide its
              pilot mentees.
            </p>
          </div>
        ) : (
          <div className="bg-eten-panel border-eten-line overflow-hidden rounded-2xl border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-eten-line-soft border-b text-left">
                    <Th>Leader</Th>
                    <Th>Pod</Th>
                    <Th>Mentor</Th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((l) => (
                    <tr
                      key={`${l.memberId}:${l.podId}`}
                      className="border-eten-line-soft hover:bg-eten-hover border-b last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/members/${l.memberId}`}
                          className="text-eten-ink font-medium hover:underline"
                        >
                          {nameById.get(l.memberId) ?? "A member"}
                        </Link>
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3">
                        {l.podName}
                        {l.role === "co_lead" && (
                          <span className="text-eten-faint"> · co-lead</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {l.isMentor ? (
                          <span className="bg-eten-verified-soft text-eten-verified rounded-full px-2.5 py-1 text-xs font-medium">
                            Verified mentor
                          </span>
                        ) : (
                          <RegisterMentorControl
                            memberId={l.memberId}
                            podId={l.podId}
                            areas={areas}
                            defaultAreaId={
                              areaIdBySlug.get(
                                POD_AREA_GUESS[l.podSlug] ?? "",
                              ) ?? defaultAreaId
                            }
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Candidate pilot mentees per pod */}
      <PilotPods pods={podCards} maxCount={maxCount} />
    </div>
  );
}

function Summary({
  Icon,
  tone,
  label,
  value,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: "accent" | "amber";
  label: string;
  value: string;
}) {
  const square =
    tone === "amber"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      : "bg-eten-accent-soft text-eten-accent";
  return (
    <div className="bg-eten-panel border-eten-line flex items-center gap-4 rounded-2xl border p-5">
      <span
        className={
          "grid size-12 shrink-0 place-items-center rounded-[14px] " + square
        }
      >
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-eten-ink-muted px-4 py-3 text-[12px] font-bold">
      {children}
    </th>
  );
}
