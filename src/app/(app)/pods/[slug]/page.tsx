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

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <Link
        href="/pods"
        className="text-on-surface-variant hover:text-on-surface mb-6 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        All pods
      </Link>

      {/* Header */}
      <header className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-headline-md text-on-surface font-bold">
              {pod.name}
            </h1>
            <div className="text-on-surface-variant mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" />
                {roster.length} {roster.length === 1 ? "member" : "members"}
              </span>
              {isPrimary && (
                <span className="text-primary inline-flex items-center gap-1.5 font-medium">
                  <Star className="size-4" />
                  Your primary pod
                </span>
              )}
            </div>
          </div>

          {isPrimary ? (
            <span className="bg-primary/10 text-primary inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium">
              <Star className="size-3.5" />
              Primary
            </span>
          ) : (
            <PodMembershipButton podId={pod.id} isMember={isMember} />
          )}
        </div>

        {pod.description && (
          <p className="text-on-surface-variant mt-4 text-sm">
            {pod.description}
          </p>
        )}
      </header>

      {/* Pod feed placeholder — the composer + feed land in M2.4 / M2.5. */}
      <div className="border-outline-variant text-on-surface-variant mt-6 flex items-center gap-3 rounded-2xl border border-dashed p-5 text-sm">
        <MessageSquare className="size-5 shrink-0" />
        <span>
          This pod&apos;s feed arrives with posts &amp; discussion soon.
        </span>
      </div>

      {/* Roster */}
      <section className="mt-6">
        <h2 className="font-display text-body-lg text-on-surface mb-4 font-bold">
          Members
        </h2>
        {roster.length === 0 ? (
          <div className="glass-card text-on-surface-variant rounded-2xl p-8 text-center text-sm">
            No members yet — be the first to join.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {roster.map((r) => (
              <li
                key={r.memberId}
                className="glass-card flex items-center gap-4 rounded-xl p-4"
              >
                {(() => {
                  const inner = (
                    <>
                      <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full font-bold">
                        {(r.name ?? "?").trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-on-surface flex items-center gap-2 font-medium">
                          {r.name}
                          {r.role !== "member" && (
                            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                              {ROLE_LABEL[r.role]}
                            </span>
                          )}
                        </span>
                        {(r.headline || r.jobTitle) && (
                          <span className="text-on-surface-variant block truncate text-sm">
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
    </div>
  );
}
