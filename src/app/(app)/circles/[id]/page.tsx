import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, GraduationCap, Users } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { vLevelBadge } from "@/lib/eten/v-levels";

export const metadata: Metadata = {
  title: "Mentorship Circle",
  robots: { index: false, follow: false },
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-eten-panel-hi text-eten-ink-muted",
  active: "bg-eten-verified-soft text-eten-verified",
  completed: "bg-eten-accent-soft text-eten-accent",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function CircleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();

  // RLS returns the circle only to the mentor, enrolled mentees, the pod's
  // leads or ops — otherwise it's hidden (404).
  const { data: circle } = await supabase
    .from("mentorship_circles")
    .select(
      "id, pod_id, mentor_id, title, cadence, start_date, end_date, status",
    )
    .eq("id", id)
    .maybeSingle();
  if (!circle) notFound();

  const { data: memberRows } = await supabase
    .from("circle_memberships")
    .select("member_id, target_v_level, target_capability, status")
    .eq("circle_id", id);
  const memberships = memberRows ?? [];

  const [{ data: pod }, { data: profileRows }] = await Promise.all([
    supabase
      .from("pods")
      .select("slug, name")
      .eq("id", circle.pod_id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("member_id, full_name")
      .in("member_id", [
        circle.mentor_id,
        ...memberships.map((m) => m.member_id),
      ]),
  ]);
  const nameById = new Map(
    (profileRows ?? []).map((p) => [p.member_id, p.full_name ?? "A member"]),
  );

  const withGoal = memberships.filter((m) => m.target_v_level != null).length;

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <Link
        href={pod?.slug ? `/pods/${pod.slug}` : "/pods"}
        className="text-eten-faint hover:text-eten-ink mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        {pod?.name ?? "Back to pods"}
      </Link>

      <header className="bg-eten-panel border-eten-line rounded-2xl border p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-eten-ink text-2xl font-bold">
              {circle.title ?? `${pod?.name ?? "Pod"} Circle`}
            </h1>
            <div className="text-eten-faint mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="size-4" />
                Mentor: {nameById.get(circle.mentor_id) ?? "A member"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" />
                {memberships.length} mentee
                {memberships.length === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1.5 capitalize">
                <CalendarDays className="size-4" />
                {circle.cadence}
              </span>
            </div>
            <p className="text-eten-faint mt-1 text-xs">
              {formatDate(circle.start_date)} → {formatDate(circle.end_date)}
            </p>
          </div>
          <span
            className={
              "inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize " +
              (STATUS_STYLE[circle.status] ??
                "bg-eten-panel-hi text-eten-faint")
            }
          >
            {circle.status}
          </span>
        </div>
        {circle.status === "draft" && (
          <p className="text-eten-ink-muted mt-4 text-sm">
            Draft — {withGoal}/{memberships.length} mentees have set their goal.
            The Circle can be activated once everyone has.
          </p>
        )}
      </header>

      <section className="mt-6">
        <h2 className="text-eten-faint mb-3 font-mono text-xs tracking-wider uppercase">
          Mentees · {memberships.length}
        </h2>
        <ul className="flex flex-col gap-2">
          {memberships.map((m) => (
            <li
              key={m.member_id}
              className="bg-eten-panel border-eten-line flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
            >
              <Link
                href={`/members/${m.member_id}`}
                className="text-eten-ink font-semibold hover:underline"
              >
                {nameById.get(m.member_id) ?? "A member"}
              </Link>
              <span className="text-eten-faint text-xs">
                {m.target_v_level != null ? (
                  <>
                    Goal: {vLevelBadge(m.target_v_level)}
                    {m.target_capability ? ` · ${m.target_capability}` : ""}
                  </>
                ) : (
                  "Goal not set"
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
