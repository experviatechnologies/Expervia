import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, GraduationCap, Users } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { vLevelBadge } from "@/lib/eten/v-levels";
import { SetGoalControl } from "./set-goal-control";
import { ActivateCircleControl } from "./activate-circle-control";
import { AddSessionControl } from "./add-session-control";
import { AttendanceToggle } from "./attendance-toggle";
import { PostAssignmentControl } from "./post-assignment-control";
import { SubmitEvidenceControl } from "./submit-evidence-control";

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

  const [{ data: pod }, { data: profileRows }, { data: myPodMembership }] =
    await Promise.all([
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
      supabase
        .from("pod_memberships")
        .select("role_in_pod")
        .eq("pod_id", circle.pod_id)
        .eq("member_id", member.id)
        .maybeSingle(),
    ]);
  const nameById = new Map(
    (profileRows ?? []).map((p) => [p.member_id, p.full_name ?? "A member"]),
  );

  const activeMemberships = memberships.filter((m) => m.status === "active");
  const withGoal = activeMemberships.filter(
    (m) => m.target_v_level != null,
  ).length;
  const allGoalsSet =
    activeMemberships.length > 0 && withGoal === activeMemberships.length;

  const viewerMembership =
    memberships.find((m) => m.member_id === member.id) ?? null;
  const isMentor = circle.mentor_id === member.id;
  const isPodLead =
    myPodMembership?.role_in_pod === "lead" ||
    myPodMembership?.role_in_pod === "co_lead";
  const canManage = isMentor || isPodLead || member.role === "operations";

  // Sessions + attendance for this Circle (RLS-scoped).
  const { data: sessionRows } = await supabase
    .from("circle_sessions")
    .select("id, session_date, title, notes")
    .eq("circle_id", id)
    .order("created_at", { ascending: true });
  const sessions = sessionRows ?? [];
  const sessionIds = sessions.map((s) => s.id);

  const { data: attendanceRows } = sessionIds.length
    ? await supabase
        .from("session_attendance")
        .select("session_id, member_id, attended")
        .in("session_id", sessionIds)
    : { data: [] };
  const attendedBySession = new Map<string, Map<string, boolean>>();
  for (const a of attendanceRows ?? []) {
    const m = attendedBySession.get(a.session_id) ?? new Map();
    m.set(a.member_id, a.attended);
    attendedBySession.set(a.session_id, m);
  }

  const activeMentees = activeMemberships.map((m) => ({
    memberId: m.member_id,
    name: nameById.get(m.member_id) ?? "A member",
  }));

  function formatSessionDate(iso: string | null): string {
    return iso ? formatDate(iso) : "Session";
  }

  // Assignments + submissions (RLS: mentees see their own; managers see all).
  type Submission = {
    id: string;
    assignment_id: string;
    member_id: string;
    content: string | null;
    status: "submitted" | "approved" | "needs_revision";
    review_note: string | null;
  };
  const { data: assignmentRows } = await supabase
    .from("circle_assignments")
    .select("id, title, instructions, due_date, created_at")
    .eq("circle_id", id)
    .order("created_at", { ascending: true });
  const assignments = assignmentRows ?? [];
  const assignmentIds = assignments.map((a) => a.id);

  const { data: submissionRows } = assignmentIds.length
    ? await supabase
        .from("evidence_submissions")
        .select("id, assignment_id, member_id, content, status, review_note")
        .in("assignment_id", assignmentIds)
    : { data: [] };
  const submissions = (submissionRows ?? []) as Submission[];
  const subsByAssignment = new Map<string, Submission[]>();
  for (const s of submissions) {
    const list = subsByAssignment.get(s.assignment_id) ?? [];
    list.push(s);
    subsByAssignment.set(s.assignment_id, list);
  }
  const mySubByAssignment = new Map(
    submissions
      .filter((s) => s.member_id === member.id)
      .map((s) => [s.assignment_id, s]),
  );

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
          <div className="mt-4">
            <p className="text-eten-ink-muted text-sm">
              Draft — {withGoal}/{activeMemberships.length} mentees have set
              their goal.
              {canManage
                ? " Activate once everyone has."
                : " The Circle starts once your lead activates it."}
            </p>
            {canManage && (
              <ActivateCircleControl
                circleId={circle.id}
                allGoalsSet={allGoalsSet}
              />
            )}
          </div>
        )}
      </header>

      {viewerMembership && circle.status !== "completed" && (
        <SetGoalControl
          circleId={circle.id}
          currentVLevel={viewerMembership.target_v_level}
          currentCapability={viewerMembership.target_capability}
        />
      )}

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

      {/* Sessions */}
      {(circle.status === "active" || sessions.length > 0) && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-eten-faint font-mono text-xs tracking-wider uppercase">
              Sessions · {sessions.length}
            </h2>
            {canManage && circle.status === "active" && (
              <AddSessionControl circleId={circle.id} />
            )}
          </div>
          {sessions.length === 0 ? (
            <div className="border-eten-line text-eten-faint rounded-2xl border border-dashed p-5 text-sm">
              No sessions logged yet.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {sessions.map((s, i) => {
                const att = attendedBySession.get(s.id) ?? new Map();
                return (
                  <li
                    key={s.id}
                    className="bg-eten-panel border-eten-line rounded-2xl border p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-eten-ink font-semibold">
                        {s.title ?? `Session ${i + 1}`}
                      </h3>
                      <span className="text-eten-faint text-xs">
                        {formatSessionDate(s.session_date)}
                      </span>
                    </div>
                    {s.notes && (
                      <p className="text-eten-ink-muted mt-1 text-sm whitespace-pre-line">
                        {s.notes}
                      </p>
                    )}
                    {canManage ? (
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                        {activeMentees.map((mn) => (
                          <span
                            key={mn.memberId}
                            className="inline-flex items-center gap-2"
                          >
                            <span className="text-eten-ink-muted text-xs">
                              {mn.name}
                            </span>
                            <AttendanceToggle
                              sessionId={s.id}
                              memberId={mn.memberId}
                              attended={att.get(mn.memberId) ?? false}
                            />
                          </span>
                        ))}
                      </div>
                    ) : viewerMembership ? (
                      <p className="text-eten-faint mt-2 text-xs">
                        You:{" "}
                        {att.get(member.id)
                          ? "Present"
                          : att.has(member.id)
                            ? "Absent"
                            : "—"}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* Assignments */}
      {(circle.status === "active" || assignments.length > 0) && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-eten-faint font-mono text-xs tracking-wider uppercase">
              Assignments · {assignments.length}
            </h2>
            {canManage && circle.status === "active" && (
              <PostAssignmentControl circleId={circle.id} />
            )}
          </div>
          {assignments.length === 0 ? (
            <div className="border-eten-line text-eten-faint rounded-2xl border border-dashed p-5 text-sm">
              No assignments yet.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {assignments.map((a) => {
                const subs = subsByAssignment.get(a.id) ?? [];
                const mine = mySubByAssignment.get(a.id) ?? null;
                return (
                  <li
                    key={a.id}
                    className="bg-eten-panel border-eten-line rounded-2xl border p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-eten-ink font-semibold">{a.title}</h3>
                      {a.due_date && (
                        <span className="text-eten-faint text-xs">
                          Due {formatDate(a.due_date)}
                        </span>
                      )}
                    </div>
                    {a.instructions && (
                      <p className="text-eten-ink-muted mt-1 text-sm whitespace-pre-line">
                        {a.instructions}
                      </p>
                    )}
                    {canManage ? (
                      <div className="mt-3">
                        <p className="text-eten-faint mb-2 text-xs">
                          {subs.length}/{activeMentees.length} submitted
                        </p>
                        {subs.length > 0 && (
                          <ul className="flex flex-col gap-1">
                            {subs.map((s) => (
                              <li
                                key={s.id}
                                className="flex items-center justify-between gap-2 text-sm"
                              >
                                <span className="text-eten-ink-muted">
                                  {nameById.get(s.member_id) ?? "A member"}
                                </span>
                                <SubStatus status={s.status} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : viewerMembership ? (
                      <SubmitEvidenceControl
                        assignmentId={a.id}
                        status={mine?.status ?? null}
                        content={mine?.content ?? null}
                        reviewNote={mine?.review_note ?? null}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function SubStatus({
  status,
}: {
  status: "submitted" | "approved" | "needs_revision";
}) {
  const map = {
    submitted: "text-eten-ink-muted",
    approved: "text-eten-verified",
    needs_revision: "text-amber-400",
  } as const;
  const label = {
    submitted: "Submitted",
    approved: "Approved",
    needs_revision: "Needs revision",
  } as const;
  return (
    <span className={"text-xs font-semibold " + map[status]}>
      {label[status]}
    </span>
  );
}
