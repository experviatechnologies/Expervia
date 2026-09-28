import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { RegisterMentorControl } from "./register-mentor-control";

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

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-6">
      <Link
        href="/admin/mentorship"
        className="text-eten-faint hover:text-eten-ink mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Mentorship
      </Link>

      <header className="mb-6">
        <h1 className="text-eten-ink text-2xl font-extrabold tracking-[-0.02em]">
          Mentorship pilot
        </h1>
        <p className="text-eten-ink-muted mt-1 text-sm">
          Register pod leaders as verified mentors and see the candidate pilot
          mentees in each pod.
        </p>
      </header>

      {/* Pod leaders */}
      <section className="mb-8">
        <h2 className="text-eten-faint mb-3 font-mono text-xs tracking-wider uppercase">
          Pod leaders · {leaders.length}
        </h2>
        {leaders.length === 0 ? (
          <div className="bg-eten-panel border-eten-line text-eten-faint rounded-2xl border p-8 text-center text-sm">
            No pod leaders yet.
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

      {/* Pilot mentees per pod */}
      <section>
        <h2 className="text-eten-faint mb-3 font-mono text-xs tracking-wider uppercase">
          Candidate pilot mentees by pod
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pods.map((p) => {
            const list = menteesByPod.get(p.id) ?? [];
            return (
              <div
                key={p.id}
                className="bg-eten-panel border-eten-line rounded-2xl border p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-eten-ink font-semibold">{p.name}</div>
                  <span className="text-eten-ink-muted font-mono text-xs tabular-nums">
                    {list.length}
                  </span>
                </div>
                <p className="text-eten-faint mt-2 text-xs leading-relaxed">
                  {list.length === 0
                    ? "No candidate mentees yet."
                    : list.slice(0, 6).join(", ") +
                      (list.length > 6 ? `, +${list.length - 6} more` : "")}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-eten-faint px-4 py-3 font-mono text-[11px] font-bold tracking-wider uppercase">
      {children}
    </th>
  );
}
