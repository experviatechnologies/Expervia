import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { vLevelBadge } from "@/lib/eten/v-levels";
import {
  ActivateCircleControl,
  EnrolMenteeControl,
  SetGoalControl,
  AddSessionControl,
  AttendanceToggle,
} from "./circle-controls";

export const metadata = { title: "Circle" };

const lbl =
  "text-mnt-faint font-mono text-[10.5px] tracking-[0.13em] uppercase";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_TONE: Record<string, string> = {
  draft: "text-mnt-ink-muted bg-mnt-panel-2",
  active: "text-mnt-green bg-mnt-green/12",
  completed: "text-mnt-brand bg-mnt-brand/12",
};

type Submission = {
  assignment_id: string;
  member_id: string;
  status: "submitted" | "approved" | "needs_revision";
};

export default async function MentorshipCircleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/mentorship/signin");

  // RLS (can_see_circle) returns the row only to the mentor, members or ops.
  const { data: circle } = await supabase
    .from("mentorship_circles")
    .select("id, title, cadence, start_date, end_date, status, mentor_id")
    .eq("id", id)
    .maybeSingle();
  if (!circle) notFound();

  const { data: memberRows } = await supabase
    .from("circle_memberships")
    .select("member_id, target_v_level, target_capability, status")
    .eq("circle_id", id);
  const memberships = memberRows ?? [];
  const isMentor = circle.mentor_id === user.id;
  const viewerMembership =
    memberships.find((m) => m.member_id === user.id) ?? null;
  const activeMentees = memberships.filter((m) => m.status === "active");

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("member_id, full_name")
    .in("member_id", [
      circle.mentor_id,
      ...memberships.map((m) => m.member_id),
    ]);
  const nameById = new Map(
    (profileRows ?? []).map((p) => [p.member_id, p.full_name ?? "A member"]),
  );

  const { data: sessionRows } = await supabase
    .from("circle_sessions")
    .select("id, session_date, title")
    .eq("circle_id", id)
    .order("created_at", { ascending: true });
  const sessions = sessionRows ?? [];
  const sessionIds = sessions.map((s) => s.id);

  const { data: attRows } = sessionIds.length
    ? await supabase
        .from("session_attendance")
        .select("session_id, member_id, attended")
        .in("session_id", sessionIds)
    : { data: [] };
  const attended = new Map<string, boolean>();
  for (const a of attRows ?? [])
    attended.set(`${a.session_id}:${a.member_id}`, a.attended);

  const { data: assignmentRows } = await supabase
    .from("circle_assignments")
    .select("id, title, instructions, due_date")
    .eq("circle_id", id)
    .order("created_at", { ascending: true });
  const assignments = assignmentRows ?? [];
  const assignmentIds = assignments.map((a) => a.id);

  const { data: subRows } = assignmentIds.length
    ? await supabase
        .from("evidence_submissions")
        .select("assignment_id, member_id, status")
        .in("assignment_id", assignmentIds)
    : { data: [] };
  const submissions = (subRows ?? []) as Submission[];
  const myApproved = assignments.filter((a) =>
    submissions.some(
      (s) =>
        s.assignment_id === a.id &&
        s.member_id === user.id &&
        s.status === "approved",
    ),
  ).length;
  const myAttended = sessions.filter(
    (s) => attended.get(`${s.id}:${user.id}`) === true,
  ).length;

  return (
    <div className="mx-auto max-w-[1140px] px-6 py-8">
      <Link
        href={isMentor ? "/mentorship/mentor" : "/mentorship/dashboard"}
        className="text-mnt-faint hover:text-mnt-ink text-[13px]"
      >
        ← Back
      </Link>

      {/* HEADER */}
      <div className="bg-mnt-panel border-mnt-line mt-3 rounded-2xl border p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold">
              {circle.title ?? "Circle"}
            </h1>
            <div className="text-mnt-ink-muted mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13.5px]">
              <span>
                Mentor: {nameById.get(circle.mentor_id) ?? "A mentor"}
              </span>
              <span>
                {memberships.length} mentee{memberships.length === 1 ? "" : "s"}
              </span>
              <span className="capitalize">{circle.cadence}</span>
              <span className="text-mnt-faint">
                {fmtDate(circle.start_date)} to {fmtDate(circle.end_date)}
              </span>
            </div>
          </div>
          <span
            className={
              "rounded-full px-2.5 py-1 font-mono text-[10px] capitalize " +
              (STATUS_TONE[circle.status] ??
                "text-mnt-ink-muted bg-mnt-panel-2")
            }
          >
            {circle.status}
          </span>
        </div>

        {/* viewer progress (mentee) */}
        {!isMentor && (sessions.length > 0 || assignments.length > 0) && (
          <div className="border-mnt-line mt-5 grid gap-7 border-t pt-4 sm:grid-cols-2">
            <Progress
              label="Sessions attended"
              value={myAttended}
              total={sessions.length}
              bar="bg-mnt-brand"
            />
            <Progress
              label="Assignments approved"
              value={myApproved}
              total={assignments.length}
              bar="bg-mnt-green"
            />
          </div>
        )}

        {isMentor && circle.status === "draft" && (
          <ActivateCircleControl circleId={circle.id} />
        )}
      </div>

      {viewerMembership && circle.status !== "completed" && (
        <SetGoalControl
          circleId={circle.id}
          currentVLevel={viewerMembership.target_v_level}
          currentCapability={viewerMembership.target_capability}
        />
      )}

      {/* MENTEES */}
      <div className="mt-[18px]">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className={lbl}>Mentees · {memberships.length}</div>
          {isMentor && circle.status !== "completed" && (
            <EnrolMenteeControl circleId={circle.id} />
          )}
        </div>
        {memberships.length === 0 ? (
          <div className="border-mnt-line text-mnt-faint rounded-2xl border border-dashed p-5 text-[13px]">
            No mentees enrolled yet.
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {memberships.map((m) => (
              <div
                key={m.member_id}
                className="bg-mnt-panel border-mnt-line flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3"
              >
                <span className="text-[13.5px] font-semibold">
                  {nameById.get(m.member_id) ?? "A member"}
                </span>
                <span className="text-mnt-faint text-[11.5px]">
                  {m.target_v_level != null
                    ? `Goal · ${vLevelBadge(m.target_v_level)}`
                    : "Goal not set"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-[18px] grid gap-4 lg:grid-cols-2">
        {/* SESSIONS */}
        <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-[18px]">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className={lbl}>Sessions · {sessions.length}</div>
            {isMentor && circle.status === "active" && (
              <AddSessionControl circleId={circle.id} />
            )}
          </div>
          {sessions.length === 0 ? (
            <p className="text-mnt-faint text-[13px]">
              No sessions logged yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {sessions.map((s, i) => (
                <div
                  key={s.id}
                  className="bg-mnt-panel-2 border-mnt-line rounded-xl border p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-[14px] font-bold">
                      {s.title ?? `Session ${i + 1}`}
                    </h4>
                    <span className="text-mnt-faint text-[11.5px]">
                      {fmtDate(s.session_date)}
                    </span>
                  </div>
                  {!isMentor && (
                    <p className="text-mnt-faint mt-1.5 text-[11.5px]">
                      You:{" "}
                      {attended.get(`${s.id}:${user.id}`)
                        ? "Present"
                        : attended.has(`${s.id}:${user.id}`)
                          ? "Absent"
                          : "—"}
                    </p>
                  )}
                  {isMentor && activeMentees.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                      {activeMentees.map((m) => (
                        <span
                          key={m.member_id}
                          className="flex items-center gap-1.5"
                        >
                          <span className="text-mnt-faint text-[11px]">
                            {nameById.get(m.member_id) ?? "Member"}
                          </span>
                          <AttendanceToggle
                            sessionId={s.id}
                            memberId={m.member_id}
                            attended={
                              attended.get(`${s.id}:${m.member_id}`) ?? false
                            }
                          />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ASSIGNMENTS */}
        <div className="bg-mnt-panel border-mnt-line rounded-2xl border p-[18px]">
          <div className={`${lbl} mb-3.5`}>
            Assignments · {assignments.length}
          </div>
          {assignments.length === 0 ? (
            <p className="text-mnt-faint text-[13px]">No assignments yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {assignments.map((a) => {
                const mine = submissions.find(
                  (s) => s.assignment_id === a.id && s.member_id === user.id,
                );
                const subCount = submissions.filter(
                  (s) => s.assignment_id === a.id,
                ).length;
                return (
                  <div
                    key={a.id}
                    className="bg-mnt-panel-2 border-mnt-line rounded-xl border p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display text-[14px] font-bold">
                        {a.title}
                      </h4>
                      {a.due_date && (
                        <span className="text-mnt-faint text-[11.5px]">
                          Due {fmtDate(a.due_date)}
                        </span>
                      )}
                    </div>
                    <div className="text-mnt-faint mt-1.5 text-[11.5px]">
                      {isMentor
                        ? `${subCount}/${memberships.length} submitted`
                        : mine
                          ? `Your submission: ${mine.status.replace("_", " ")}`
                          : "Not submitted"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Progress({
  label,
  value,
  total,
  bar,
}: {
  label: string;
  value: number;
  total: number;
  bar: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <span className={lbl}>{label}</span>
        <span className="font-bold tabular-nums">
          {value}/{total}
        </span>
      </div>
      <div className="bg-mnt-panel-2 mt-2 h-[7px] overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full ${bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
