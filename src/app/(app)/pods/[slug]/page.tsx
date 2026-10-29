import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, GraduationCap, Star } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { toCsv } from "@/lib/csv";
import { DownloadCsvButton } from "@/components/shared/download-csv-button";
import { PodMembershipButton } from "./pod-membership-button";
import { PodRoster, type RosterItem } from "./pod-roster";

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
  /** Mentor-nomination context, populated only when a pod lead is viewing. */
  mentor?: {
    vLevel: number;
    isMentor: boolean;
    pending: boolean;
  };
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

  const [
    { data: membershipRows },
    { data: profile },
    { data: allPodRows },
    { data: allMemberRows },
  ] = await Promise.all([
    supabase
      .from("pod_memberships")
      .select("member_id, role_in_pod, joined_at")
      .eq("pod_id", pod.id),
    supabase
      .from("profiles")
      .select("primary_specialization_pod_id")
      .eq("member_id", member.id)
      .maybeSingle(),
    supabase
      .from("pods")
      .select("id, slug, name, is_main")
      .eq("is_main", false)
      .order("name"),
    supabase.from("pod_memberships").select("pod_id, member_id"),
  ]);

  // Pod picker: all specialist pods with their counts + whether the viewer is in.
  const podTotal = new Map<string, number>();
  const myPodIds = new Set<string>();
  for (const m of allMemberRows ?? []) {
    podTotal.set(m.pod_id, (podTotal.get(m.pod_id) ?? 0) + 1);
    if (m.member_id === member.id) myPodIds.add(m.pod_id);
  }
  const pickList = (allPodRows ?? []).map((p) => ({
    slug: p.slug,
    name: p.name,
    count: podTotal.get(p.id) ?? 0,
    joined: myPodIds.has(p.id),
    current: p.id === pod.id,
  }));

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

  // Pod-lead view: enrich the roster with mentor-nomination context (V-level,
  // whether they're already a mentor, and any open nomination). Read via
  // service_role since members.v_level isn't peer-readable by RLS — gated on
  // the viewer actually leading this pod.
  const isLeadHere = myRole === "lead" || myRole === "co_lead";
  // Pod leads can download their roster (built below, in the lead-gated block).
  let membersCsv = "";
  let podCircles: {
    id: string;
    title: string | null;
    status: "draft" | "active" | "completed";
    mentorName: string;
    menteeCount: number;
    completedCount: number;
  }[] = [];
  if (isLeadHere && memberIds.length) {
    const admin = getSupabaseAdmin();
    const [
      { data: vRows },
      { data: mentorRows },
      { data: nomRows },
      { data: circleRows },
    ] = await Promise.all([
      admin.from("members").select("id, v_level").in("id", memberIds),
      admin
        .from("mentor_profiles")
        .select("member_id")
        .in("member_id", memberIds),
      admin
        .from("mentor_nominations")
        .select("member_id")
        .eq("pod_id", pod.id)
        .eq("status", "pending")
        .in("member_id", memberIds),
      admin
        .from("mentorship_circles")
        .select("id, title, status, mentor_id, circle_memberships(status)")
        .eq("pod_id", pod.id)
        .order("created_at", { ascending: false }),
    ]);
    const vById = new Map((vRows ?? []).map((r) => [r.id, r.v_level]));
    const mentorSet = new Set((mentorRows ?? []).map((r) => r.member_id));
    const pendingSet = new Set((nomRows ?? []).map((r) => r.member_id));
    for (const r of roster) {
      r.mentor = {
        vLevel: vById.get(r.memberId) ?? 0,
        isMentor: mentorSet.has(r.memberId),
        pending: pendingSet.has(r.memberId),
      };
    }
    podCircles = (
      (circleRows ?? []) as unknown as {
        id: string;
        title: string | null;
        status: "draft" | "active" | "completed";
        mentor_id: string;
        circle_memberships: { status: string }[];
      }[]
    ).map((c) => {
      const mems = c.circle_memberships ?? [];
      return {
        id: c.id,
        title: c.title,
        status: c.status,
        mentorName: profileById.get(c.mentor_id)?.full_name ?? "A member",
        menteeCount: mems.length,
        completedCount: mems.filter((m) => m.status === "completed").length,
      };
    });

    // Roster export for the pod lead: names, emails (service_role), roles,
    // job titles, V-levels and join dates.
    const emailById = new Map<string, string>();
    await Promise.all(
      memberIds.map(async (id) => {
        const { data: u } = await admin.auth.admin.getUserById(id);
        const em = u?.user?.email;
        if (em) emailById.set(id, em);
      }),
    );
    const joinedById = new Map(
      memberships.map((m) => [m.member_id, m.joined_at as string]),
    );
    const roleLabel: Record<string, string> = {
      lead: "Lead",
      co_lead: "Co-lead",
      member: "Member",
    };
    membersCsv = toCsv(
      ["Name", "Email", "Role", "Job title", "V-level", "Joined"],
      roster.map((r) => {
        const j = joinedById.get(r.memberId);
        return [
          r.name,
          emailById.get(r.memberId) ?? "",
          roleLabel[r.role] ?? r.role,
          r.jobTitle ?? "",
          r.mentor?.vLevel ?? "",
          j
            ? new Date(j).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "",
        ];
      }),
    );
  }

  const tileInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const rosterItems: RosterItem[] = roster.map((r) => ({
    memberId: r.memberId,
    name: r.name,
    headline: r.headline,
    jobTitle: r.jobTitle,
    role: r.role,
    visible: r.visible,
    isMentor: Boolean(r.mentor?.isMentor),
    nominationPending: Boolean(r.mentor?.pending),
    canNominate:
      isLeadHere &&
      !!r.mentor &&
      !r.mentor.isMentor &&
      !r.mentor.pending &&
      r.memberId !== member.id &&
      (r.mentor.vLevel ?? 0) >= 2,
  }));

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-start gap-5">
        {/* Pod picker */}
        <aside className="max-w-full flex-[1_1_230px]">
          <div className="bg-eten-panel border-eten-line flex flex-col gap-0.5 rounded-[16px] border p-2.5">
            <div className="text-eten-ink px-2.5 py-2 text-[13px] font-extrabold">
              Pods
            </div>
            {pickList.map((k) => (
              <Link
                key={k.slug}
                href={`/pods/${k.slug}`}
                aria-current={k.current ? "page" : undefined}
                className={
                  "flex min-h-12 items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 transition-colors " +
                  (k.current ? "bg-eten-accent-soft" : "hover:bg-eten-hover")
                }
              >
                <span className="bg-eten-accent-soft text-eten-accent grid size-8 shrink-0 place-items-center rounded-[9px] text-[11px] font-extrabold">
                  {tileInitials(k.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-eten-ink block truncate text-[13px] font-bold">
                    {k.name}
                  </span>
                  <span className="text-eten-faint block text-[11px]">
                    {k.count} members
                  </span>
                </span>
                {k.joined && (
                  <span
                    aria-label="Joined"
                    className="bg-eten-verified size-[7px] shrink-0 rounded-full"
                  />
                )}
              </Link>
            ))}
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-[18px]">
          <Link
            href="/pods"
            className="text-eten-faint hover:text-eten-ink -mb-1 inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-4" />
            All pods
          </Link>

          {/* Pod header */}
          <section className="bg-eten-panel border-eten-line overflow-hidden rounded-[18px] border">
            <div
              className="relative h-[120px] overflow-hidden"
              style={{
                background:
                  "linear-gradient(120deg, #35007F 0%, var(--color-eten-accent) 60%, #7530E6 130%)",
              }}
            >
              <svg
                width="300"
                height="300"
                viewBox="0 0 300 300"
                aria-hidden="true"
                className="absolute -top-[110px] -right-[60px] opacity-[0.16]"
              >
                <circle
                  cx="150"
                  cy="150"
                  r="140"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <circle
                  cx="150"
                  cy="150"
                  r="95"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <circle
                  cx="150"
                  cy="150"
                  r="50"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-5">
              <div className="flex min-w-0 flex-wrap items-end gap-4">
                <span className="border-eten-panel bg-eten-accent-soft text-eten-accent grid size-[84px] shrink-0 -translate-y-9 place-items-center rounded-[22px] border-4 text-[26px] font-extrabold">
                  {tileInitials(pod.name)}
                </span>
                <div className="min-w-0 pb-0.5">
                  <h1 className="text-eten-ink text-[26px] font-extrabold tracking-[-0.02em]">
                    {pod.name}
                  </h1>
                  <div className="text-eten-faint mt-0.5 text-[13px]">
                    #{pod.slug} · {roster.length} members
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pb-1">
                {roster.length > 0 && (
                  <div className="flex" aria-hidden="true">
                    {roster.slice(0, 5).map((r, i) => (
                      <span
                        key={r.memberId}
                        className={
                          "border-eten-panel bg-eten-accent-soft text-eten-accent grid size-8 place-items-center rounded-full border-2 text-[11px] font-bold " +
                          (i ? "-ml-2" : "")
                        }
                      >
                        {(r.name ?? "?").trim().charAt(0).toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
                {isPrimary ? (
                  <span className="bg-eten-accent-soft text-eten-accent inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold">
                    <Star className="size-3.5" />
                    Primary pod
                  </span>
                ) : isMember ? (
                  <span className="bg-eten-verified-soft text-eten-verified inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold">
                    <Check className="size-3.5" strokeWidth={2.8} />
                    Joined
                  </span>
                ) : (
                  <PodMembershipButton podId={pod.id} isMember={isMember} />
                )}
              </div>
            </div>
            {pod.description && (
              <p className="text-eten-ink-muted px-6 pb-5 text-[14px] leading-relaxed">
                {pod.description}
              </p>
            )}
          </section>

          {/* Pod leads */}
          {leads.length > 0 && (
            <section className="bg-eten-panel border-eten-line flex flex-col gap-3 rounded-[18px] border p-5">
              <h2 className="text-eten-ink text-[15px] font-extrabold">
                Pod leads and mentors
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {leads.map((l) =>
                  l.visible ? (
                    <Link
                      key={l.memberId}
                      href={`/members/${l.memberId}`}
                      className="border-eten-line bg-eten-panel-hi hover:border-eten-accent/40 flex items-center gap-2.5 rounded-full border py-1.5 pr-3.5 pl-1.5 transition-colors"
                    >
                      <span className="bg-eten-accent-soft text-eten-accent grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-bold">
                        {(l.name ?? "?").trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="text-left">
                        <span className="text-eten-ink block text-[13px] font-bold">
                          {l.name}
                        </span>
                        <span className="text-eten-accent block text-[11px] font-bold">
                          {ROLE_LABEL[l.role]}
                        </span>
                      </span>
                    </Link>
                  ) : (
                    <span
                      key={l.memberId}
                      className="border-eten-line bg-eten-panel-hi flex items-center gap-2.5 rounded-full border py-1.5 pr-3.5 pl-1.5"
                    >
                      <span className="bg-eten-accent-soft text-eten-accent grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-bold">
                        {(l.name ?? "?").trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="text-left">
                        <span className="text-eten-ink block text-[13px] font-bold">
                          {l.name}
                        </span>
                        <span className="text-eten-accent block text-[11px] font-bold">
                          {ROLE_LABEL[l.role]}
                        </span>
                      </span>
                    </span>
                  ),
                )}
              </div>
            </section>
          )}

          {/* Mentorship Circles (lead view) */}
          {isLeadHere && (
            <section className="bg-eten-panel border-eten-line flex flex-wrap items-center justify-between gap-3 rounded-[18px] border p-5">
              <div className="min-w-0">
                <h2 className="text-eten-ink text-[15px] font-extrabold">
                  Pod members · {roster.length}
                </h2>
                <p className="text-eten-ink-muted mt-0.5 text-[13px]">
                  Download your roster with names, emails and roles.
                </p>
              </div>
              <DownloadCsvButton
                csv={membersCsv}
                filename={`${pod.slug}-members.csv`}
                label="Download members"
                className="border-eten-line text-eten-ink-muted hover:text-eten-ink hover:bg-eten-panel-hi inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-[13px] font-semibold transition-colors"
              />
            </section>
          )}

          {isLeadHere && (
            <section className="bg-eten-panel border-eten-line flex flex-col gap-3 rounded-[18px] border p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-eten-ink text-[15px] font-extrabold">
                  Mentorship Circles · {podCircles.length}
                </h2>
                <Link
                  href={`/pods/${pod.slug}/circles/new`}
                  className="text-eten-accent inline-flex items-center gap-1.5 text-[13px] font-semibold hover:underline"
                >
                  <GraduationCap className="size-4" />
                  Create a Circle
                </Link>
              </div>
              {podCircles.length === 0 ? (
                <div className="border-eten-line text-eten-ink-muted rounded-xl border border-dashed p-5 text-sm">
                  No Circles yet. Create one with a Verified Mentor and mentees
                  from this pod.
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {podCircles.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/circles/${c.id}`}
                        className="border-eten-line hover:border-eten-accent/40 bg-eten-panel-hi flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 transition-colors"
                      >
                        <span className="min-w-0">
                          <span className="text-eten-ink block font-semibold">
                            {c.title ?? "Mentorship Circle"}
                          </span>
                          <span className="text-eten-faint text-xs">
                            Mentor: {c.mentorName} · {c.menteeCount} mentee
                            {c.menteeCount === 1 ? "" : "s"}
                            {(c.status === "active" ||
                              c.status === "completed") &&
                              ` · ${c.completedCount}/${c.menteeCount} graduated`}
                          </span>
                        </span>
                        <span className="bg-eten-accent-soft text-eten-accent shrink-0 rounded-full px-2.5 py-1 text-xs font-bold capitalize">
                          {c.status}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* Roster */}
          {roster.length === 0 ? (
            <div className="bg-eten-panel border-eten-line text-eten-ink-muted rounded-[18px] border p-8 text-center text-sm">
              No members yet — be the first to join.
            </div>
          ) : (
            <PodRoster
              roster={rosterItems}
              podId={pod.id}
              memberCount={roster.length}
              isOps={isOps}
            />
          )}
        </div>
      </div>
    </div>
  );
}
