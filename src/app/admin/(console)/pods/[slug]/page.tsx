import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Star, Users } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Pod",
  robots: { index: false, follow: false },
};

const ROLE_RANK = { lead: 0, co_lead: 1, member: 2 } as const;
const ROLE_LABEL = { lead: "Lead", co_lead: "Co-lead", member: "" } as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminPodDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();

  const { data: pod } = await admin
    .from("pods")
    .select("id, slug, name, description, is_main")
    .eq("slug", slug)
    .maybeSingle();
  if (!pod) notFound();

  const { data: membershipRows } = await admin
    .from("pod_memberships")
    .select("member_id, role_in_pod, joined_at")
    .eq("pod_id", pod.id);

  const memberIds = (membershipRows ?? []).map((m) => m.member_id);
  const { data: profileRows } = memberIds.length
    ? await admin
        .from("profiles")
        .select(
          "member_id, full_name, headline, job_title, primary_specialization_pod_id",
        )
        .in("member_id", memberIds)
    : { data: [] };

  const profileById = new Map((profileRows ?? []).map((p) => [p.member_id, p]));

  const roster = (membershipRows ?? [])
    .map((m) => {
      const p = profileById.get(m.member_id);
      return {
        memberId: m.member_id,
        name: p?.full_name ?? "—",
        headline: p?.headline ?? p?.job_title ?? null,
        role: m.role_in_pod as "member" | "lead" | "co_lead",
        isPrimary: p?.primary_specialization_pod_id === pod.id,
        joinedAt: m.joined_at,
      };
    })
    .sort(
      (a, b) =>
        ROLE_RANK[a.role] - ROLE_RANK[b.role] || a.name.localeCompare(b.name),
    );

  const leadCount = roster.filter((r) => r.role !== "member").length;
  const primaryCount = roster.filter((r) => r.isPrimary).length;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-6">
      <Link
        href="/admin/pods"
        className="text-eten-faint hover:text-eten-ink mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        All pods
      </Link>

      <header className="bg-eten-panel border-eten-line mb-4 rounded-2xl border p-5 sm:p-6">
        <div className="text-eten-accent mb-1 font-mono text-sm">
          #{pod.slug}
        </div>
        <h1 className="text-eten-ink text-2xl font-extrabold tracking-[-0.02em]">
          {pod.name}
        </h1>
        {pod.description && (
          <p className="text-eten-ink-muted mt-2 text-sm">{pod.description}</p>
        )}
        <div className="text-eten-faint mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" />
            <b className="text-eten-ink font-semibold tabular-nums">
              {roster.length}
            </b>{" "}
            member{roster.length === 1 ? "" : "s"}
          </span>
          {leadCount > 0 && <span>{leadCount} lead/co-lead</span>}
          <span className="text-eten-accent inline-flex items-center gap-1">
            <Star className="size-3.5" />
            {primaryCount} primary
          </span>
        </div>
      </header>

      <div className="bg-eten-panel border-eten-line overflow-hidden rounded-2xl border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-eten-line-soft border-b text-left">
                <Th>Member</Th>
                <Th>Role</Th>
                <Th>Membership</Th>
                <Th>Joined</Th>
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-eten-faint px-4 py-10 text-center"
                  >
                    No members in this pod yet.
                  </td>
                </tr>
              ) : (
                roster.map((r) => (
                  <tr
                    key={r.memberId}
                    className="border-eten-line-soft hover:bg-eten-hover border-b last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/members/${r.memberId}`}
                        className="group flex items-center gap-3"
                      >
                        <span className="from-eten-accent grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br to-[#3257b8] text-xs font-bold text-white">
                          {r.name.trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="text-eten-ink block font-semibold group-hover:underline">
                            {r.name}
                          </span>
                          {r.headline && (
                            <span className="text-eten-faint block truncate text-xs">
                              {r.headline}
                            </span>
                          )}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {r.role === "member" ? (
                        <span className="text-eten-faint text-xs">Member</span>
                      ) : (
                        <span className="bg-eten-verified-soft text-eten-verified rounded px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase">
                          {ROLE_LABEL[r.role]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.isPrimary ? (
                        <span className="text-eten-accent inline-flex items-center gap-1 text-xs font-medium">
                          <Star className="size-3" />
                          Primary
                        </span>
                      ) : (
                        <span className="text-eten-ink-muted text-xs">
                          Secondary
                        </span>
                      )}
                    </td>
                    <td className="text-eten-ink-muted px-4 py-3 text-xs whitespace-nowrap tabular-nums">
                      {formatDate(r.joinedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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
