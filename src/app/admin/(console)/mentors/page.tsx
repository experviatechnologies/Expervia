import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { getCurrentManager } from "@/lib/supabase-server";
import { isOperations } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { vLevelBadge } from "@/lib/eten/v-levels";
import { MentorReviewControl } from "./mentor-review-control";

export const metadata: Metadata = {
  title: "Mentors",
  robots: { index: false, follow: false },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Nomination = {
  id: string;
  member_id: string;
  pod_id: string | null;
  capability_area_id: string | null;
  source: "nominated" | "self";
  nominated_by: string | null;
  status: "pending" | "approved" | "rejected";
  decision_reason: string | null;
  decided_at: string | null;
  created_at: string;
};
type MentorProfile = {
  member_id: string;
  mentor_status: string;
  capability_pod_id: string | null;
  capability_area_id: string | null;
  verified_at: string | null;
};

export default async function AdminMentorsPage() {
  const manager = await getCurrentManager();
  if (!manager) redirect("/admin/login");
  if (!(await isOperations())) redirect("/dashboard");

  const admin = getSupabaseAdmin();

  const [{ data: nomData }, { data: mentorData }] = await Promise.all([
    admin
      .from("mentor_nominations")
      .select(
        "id, member_id, pod_id, capability_area_id, source, nominated_by, status, decision_reason, decided_at, created_at",
      )
      .order("created_at", { ascending: false }),
    admin
      .from("mentor_profiles")
      .select(
        "member_id, mentor_status, capability_pod_id, capability_area_id, verified_at",
      ),
  ]);
  const nominations = (nomData ?? []) as Nomination[];
  const mentors = (mentorData ?? []) as MentorProfile[];

  // Resolve names, V-levels and pod names.
  const memberIds = [
    ...new Set([
      ...nominations.flatMap((n) => [n.member_id, n.nominated_by]),
      ...mentors.map((m) => m.member_id),
    ]),
  ].filter((x): x is string => Boolean(x));
  const podIds = [
    ...new Set([
      ...nominations.map((n) => n.pod_id),
      ...mentors.map((m) => m.capability_pod_id),
    ]),
  ].filter((x): x is string => Boolean(x));

  const areaIds = [
    ...new Set([
      ...nominations.map((n) => n.capability_area_id),
      ...mentors.map((m) => m.capability_area_id),
    ]),
  ].filter((x): x is string => Boolean(x));

  const [
    { data: profileRows },
    { data: memberRows },
    { data: podRows },
    { data: areaRows },
  ] = await Promise.all([
    memberIds.length
      ? admin
          .from("profiles")
          .select("member_id, full_name")
          .in("member_id", memberIds)
      : Promise.resolve({ data: [] }),
    memberIds.length
      ? admin.from("members").select("id, v_level").in("id", memberIds)
      : Promise.resolve({ data: [] }),
    podIds.length
      ? admin.from("pods").select("id, name").in("id", podIds)
      : Promise.resolve({ data: [] }),
    areaIds.length
      ? admin.from("capability_areas").select("id, label").in("id", areaIds)
      : Promise.resolve({ data: [] }),
  ]);

  const nameById = new Map(
    (profileRows ?? []).map((p) => [p.member_id, p.full_name]),
  );
  const vById = new Map((memberRows ?? []).map((m) => [m.id, m.v_level]));
  const podById = new Map((podRows ?? []).map((p) => [p.id, p.name]));
  const areaById = new Map((areaRows ?? []).map((a) => [a.id, a.label]));

  // A nomination's "home": its pod (nominated path) or capability area (self).
  const homeOf = (n: Nomination): string =>
    n.pod_id
      ? (podById.get(n.pod_id) ?? "—")
      : (areaById.get(n.capability_area_id ?? "") ?? "—");

  const pending = nominations.filter((n) => n.status === "pending");
  const decided = nominations.filter((n) => n.status !== "pending");

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-6">
      <header className="mb-6">
        <h1 className="text-eten-ink text-2xl font-extrabold tracking-[-0.02em]">
          Mentors
        </h1>
        <p className="text-eten-ink-muted mt-1 text-sm">
          Review Mentor Candidate nominations from Pod Leaders. {pending.length}{" "}
          awaiting review · {mentors.length} verified.
        </p>
      </header>

      {/* Pending queue */}
      <section className="mb-8">
        <h2 className="text-eten-faint mb-3 font-mono text-xs tracking-wider uppercase">
          Pending · {pending.length}
        </h2>
        {pending.length === 0 ? (
          <div className="bg-eten-panel border-eten-line text-eten-faint flex flex-col items-center gap-3 rounded-2xl border p-12 text-center">
            <GraduationCap className="text-eten-faint/50 size-9" />
            <p className="text-sm">No nominations awaiting review.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((n) => (
              <li
                key={n.id}
                className="bg-eten-panel border-eten-line flex flex-wrap items-start justify-between gap-4 rounded-2xl border p-5"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/members/${n.member_id}`}
                    className="text-eten-ink font-semibold hover:underline"
                  >
                    {nameById.get(n.member_id) ?? "A member"}
                  </Link>
                  <div className="text-eten-faint mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="text-eten-verified font-medium">
                      {vLevelBadge(vById.get(n.member_id) ?? 0)}
                    </span>
                    <span>
                      {n.pod_id ? "Pod" : "Area"}: {homeOf(n)}
                    </span>
                    <span>
                      {n.source === "self"
                        ? "Self-applied"
                        : `Nominated by ${
                            n.nominated_by
                              ? (nameById.get(n.nominated_by) ?? "a lead")
                              : "a lead"
                          }`}{" "}
                      · {formatDate(n.created_at)}
                    </span>
                  </div>
                </div>
                <MentorReviewControl nominationId={n.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Verified mentors */}
      {mentors.length > 0 && (
        <section className="mb-8">
          <h2 className="text-eten-faint mb-3 font-mono text-xs tracking-wider uppercase">
            Verified mentors · {mentors.length}
          </h2>
          <div className="bg-eten-panel border-eten-line overflow-hidden rounded-2xl border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-eten-line-soft border-b text-left">
                    <Th>Mentor</Th>
                    <Th>Level</Th>
                    <Th>Cell</Th>
                    <Th>Verified</Th>
                  </tr>
                </thead>
                <tbody>
                  {mentors.map((m) => (
                    <tr
                      key={m.member_id}
                      className="border-eten-line-soft hover:bg-eten-hover border-b last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/members/${m.member_id}`}
                          className="text-eten-ink font-medium hover:underline"
                        >
                          {nameById.get(m.member_id) ?? "A member"}
                        </Link>
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3 capitalize">
                        {m.mentor_status}
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3">
                        {m.capability_pod_id
                          ? (podById.get(m.capability_pod_id) ?? "—")
                          : m.capability_area_id
                            ? (areaById.get(m.capability_area_id) ?? "—")
                            : "—"}
                      </td>
                      <td className="text-eten-ink-muted px-4 py-3 text-xs whitespace-nowrap tabular-nums">
                        {m.verified_at ? formatDate(m.verified_at) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Decided nominations */}
      {decided.length > 0 && (
        <section>
          <h2 className="text-eten-faint mb-3 font-mono text-xs tracking-wider uppercase">
            Recent decisions · {decided.length}
          </h2>
          <ul className="flex flex-col gap-2">
            {decided.slice(0, 20).map((n) => (
              <li
                key={n.id}
                className="bg-eten-panel border-eten-line flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
              >
                <span className="text-eten-ink-muted">
                  {nameById.get(n.member_id) ?? "A member"} · {homeOf(n)}
                </span>
                <span
                  className={
                    "text-xs font-semibold " +
                    (n.status === "approved"
                      ? "text-eten-verified"
                      : "text-destructive")
                  }
                >
                  {n.status === "approved" ? "Verified" : "Rejected"}
                  {n.decided_at ? ` · ${formatDate(n.decided_at)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
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
