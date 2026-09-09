import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MessageSquare, Star, Users } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { PodMembershipButton } from "./pod-membership-button";
import { PodRoleControl } from "./pod-role-control";

export const metadata: Metadata = {
  title: "Pod",
  robots: { index: false, follow: false },
};

type RosterMember = {
  memberId: string;
  name: string;
  headline: string | null;
  jobTitle: string | null;
  role: "member" | "lead" | "co_lead";
  /** Whether the viewer can see this member's profile (link + details). */
  visible: boolean;
};

const ROLE_RANK = { lead: 0, co_lead: 1, member: 2 } as const;
const ROLE_LABEL = { lead: "Lead", co_lead: "Co-lead", member: "" } as const;

export default async function PodDetailPage({
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
    .select("id, slug, name, description, is_main")
    .eq("slug", slug)
    .maybeSingle();

  // The Main Community is the shared feed, not a joinable specialist pod — it
  // has no detail page of its own (yet). Unknown slugs 404.
  if (!pod || pod.is_main) notFound();

  const [{ data: membershipRows }, { data: profile }] = await Promise.all([
    supabase
      .from("pod_memberships")
      .select("member_id, role_in_pod, joined_at")
      .eq("pod_id", pod.id),
    supabase
      .from("profiles")
      .select("primary_specialization_pod_id")
      .eq("member_id", member.id)
      .maybeSingle(),
  ]);

  const memberships = membershipRows ?? [];
  const memberIds = memberships.map((m) => m.member_id);

  // Some members' profiles may be RLS-hidden from the viewer (not claimed +
  // active). We still list every member so the count matches the directory —
  // hidden ones show as a generic entry with no profile link.
  const { data: profileRows } = memberIds.length
    ? await supabase
        .from("profiles")
        .select("member_id, full_name, headline, job_title")
        .in("member_id", memberIds)
    : { data: [] };

  const profileById = new Map((profileRows ?? []).map((p) => [p.member_id, p]));

  const roster: RosterMember[] = memberships
    .map((m) => {
      const p = profileById.get(m.member_id);
      return {
        memberId: m.member_id,
        name: p?.full_name ?? "A member",
        headline: p?.headline ?? null,
        jobTitle: p?.job_title ?? null,
        role: m.role_in_pod as RosterMember["role"],
        visible: Boolean(p),
      };
    })
    .sort((a, b) => ROLE_RANK[a.role] - ROLE_RANK[b.role]);

  const isMember = memberIds.includes(member.id);
  const isPrimary = profile?.primary_specialization_pod_id === pod.id;
  const isOps = member.role === "operations";
  const myRole = roster.find((r) => r.memberId === member.id)?.role;
  const leads = roster.filter((r) => r.role !== "member");

  return (
    <div className="mx-auto flex w-full max-w-5xl gap-8 px-4 py-6 lg:px-8">
      <main className="min-w-0 flex-1">
        <Link
          href="/pods"
          className="text-eten-faint hover:text-eten-ink mb-4 inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          All pods
        </Link>

        {/* Header */}
        <header className="bg-eten-panel border-eten-line rounded-2xl border p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-eten-accent mb-1 font-mono text-sm">
                #{pod.slug}
              </div>
              <h1 className="font-display text-eten-ink text-2xl font-bold">
                {pod.name}
              </h1>
              <div className="text-eten-faint mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4" />
                  {roster.length} {roster.length === 1 ? "member" : "members"}
                </span>
                {isPrimary && (
                  <span className="text-eten-accent inline-flex items-center gap-1.5 font-medium">
                    <Star className="size-4" />
                    Your primary pod
                  </span>
                )}
              </div>
            </div>

            {isPrimary ? (
              <span className="bg-eten-accent-soft inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-[#cddcfb]">
                <Star className="size-3.5" />
                Primary
              </span>
            ) : (
              <PodMembershipButton podId={pod.id} isMember={isMember} />
            )}
          </div>

          {pod.description && (
            <p className="text-eten-ink-muted mt-4 text-sm">
              {pod.description}
            </p>
          )}
        </header>

        {/* Discussion placeholder — per-pod feed is a future enhancement. */}
        <div className="border-eten-line text-eten-faint mt-5 flex items-center gap-3 rounded-2xl border border-dashed p-5 text-sm">
          <MessageSquare className="size-5 shrink-0" />
          <span>
            This pod&apos;s discussion arrives soon. For now, share to it from
            the feed composer.
          </span>
        </div>

        {/* Roster */}
        <section className="mt-6">
          <h2 className="text-eten-faint mb-3 font-mono text-xs tracking-wider uppercase">
            Members · {roster.length}
          </h2>
          {roster.length === 0 ? (
            <div className="bg-eten-panel border-eten-line text-eten-faint rounded-2xl border p-8 text-center text-sm">
              No members yet — be the first to join.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {roster.map((r) => (
                <li
                  key={r.memberId}
                  className="bg-eten-panel border-eten-line flex items-center gap-4 rounded-xl border p-4"
                >
                  {(() => {
                    const inner = (
                      <>
                        <span className="from-eten-accent grid size-11 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br to-[#3257b8] font-bold text-white">
                          {(r.name ?? "?").trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="text-eten-ink flex items-center gap-2 font-semibold">
                            {r.name}
                            {r.role !== "member" && (
                              <span className="bg-eten-verified-soft text-eten-verified rounded px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase">
                                {ROLE_LABEL[r.role]}
                              </span>
                            )}
                          </span>
                          {(r.headline || r.jobTitle) && (
                            <span className="text-eten-faint block truncate text-sm">
                              {r.headline ?? r.jobTitle}
                            </span>
                          )}
                        </span>
                      </>
                    );
                    return r.visible ? (
                      <Link
                        href={`/members/${r.memberId}`}
                        className="flex min-w-0 flex-1 items-center gap-4 transition-opacity hover:opacity-80"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        {inner}
                      </div>
                    );
                  })()}
                  {isOps && (
                    <PodRoleControl
                      podId={pod.id}
                      memberId={r.memberId}
                      role={r.role}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* About panel */}
      <aside className="hidden w-72 shrink-0 xl:block">
        <div className="bg-eten-panel border-eten-line sticky top-6 rounded-2xl border p-4">
          <h3 className="text-eten-ink font-display mb-3 text-sm font-semibold">
            About this pod
          </h3>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-eten-faint">Members</dt>
              <dd className="text-eten-ink font-semibold tabular-nums">
                {roster.length}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-eten-faint">Your status</dt>
              <dd className="text-eten-ink font-medium">
                {isPrimary
                  ? "Primary pod"
                  : myRole
                    ? myRole === "member"
                      ? "Member"
                      : ROLE_LABEL[myRole]
                    : "Not joined"}
              </dd>
            </div>
          </dl>
          {leads.length > 0 && (
            <div className="border-eten-line-soft mt-4 border-t pt-4">
              <p className="text-eten-faint mb-2 font-mono text-xs tracking-wider uppercase">
                Leads
              </p>
              <div className="flex flex-col gap-2">
                {leads.map((l) => (
                  <div key={l.memberId} className="flex items-center gap-2.5">
                    <span className="from-eten-accent grid size-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br to-[#3257b8] text-xs font-bold text-white">
                      {(l.name ?? "?").trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="text-eten-ink min-w-0 flex-1 truncate text-[13px] font-medium">
                      {l.name}
                    </span>
                    <span className="text-eten-verified font-mono text-[10px] tracking-wide uppercase">
                      {ROLE_LABEL[l.role]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
