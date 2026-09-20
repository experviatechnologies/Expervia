import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Mentorship",
  robots: { index: false, follow: false },
};

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-eten-panel-hi text-eten-ink-muted",
  active: "bg-eten-verified-soft text-eten-verified",
  completed: "bg-eten-accent-soft text-eten-accent",
};

type CircleCard = {
  id: string;
  title: string | null;
  podName: string;
  status: string;
  role: "Mentor" | "Mentee";
  mentorName?: string;
};

export default async function CirclesPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/signin");

  const supabase = await createSupabaseServerClient();

  const [{ data: mentoring }, { data: myMems }] = await Promise.all([
    supabase
      .from("mentorship_circles")
      .select("id, title, pod_id, status")
      .eq("mentor_id", member.id),
    supabase
      .from("circle_memberships")
      .select("circle_id")
      .eq("member_id", member.id),
  ]);

  const menteeCircleIds = (myMems ?? []).map((m) => m.circle_id);
  const { data: menteeCircles } = menteeCircleIds.length
    ? await supabase
        .from("mentorship_circles")
        .select("id, title, pod_id, mentor_id, status")
        .in("id", menteeCircleIds)
    : { data: [] };

  const mentoringList = mentoring ?? [];
  const menteeList = menteeCircles ?? [];

  const podIds = [
    ...new Set([
      ...mentoringList.map((c) => c.pod_id),
      ...menteeList.map((c) => c.pod_id),
    ]),
  ];
  const mentorIds = [...new Set(menteeList.map((c) => c.mentor_id))];

  const [{ data: podRows }, { data: mentorProfiles }] = await Promise.all([
    podIds.length
      ? supabase.from("pods").select("id, name").in("id", podIds)
      : Promise.resolve({ data: [] }),
    mentorIds.length
      ? supabase
          .from("profiles")
          .select("member_id, full_name")
          .in("member_id", mentorIds)
      : Promise.resolve({ data: [] }),
  ]);
  const podName = new Map((podRows ?? []).map((p) => [p.id, p.name]));
  const mentorName = new Map(
    (mentorProfiles ?? []).map((p) => [p.member_id, p.full_name ?? "A member"]),
  );

  const circles: CircleCard[] = [
    ...mentoringList.map((c) => ({
      id: c.id,
      title: c.title,
      podName: podName.get(c.pod_id) ?? "Pod",
      status: c.status,
      role: "Mentor" as const,
    })),
    ...menteeList.map((c) => ({
      id: c.id,
      title: c.title,
      podName: podName.get(c.pod_id) ?? "Pod",
      status: c.status,
      role: "Mentee" as const,
      mentorName: mentorName.get(c.mentor_id) ?? "A member",
    })),
  ];

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-6 py-12">
      <header className="mb-8">
        <p className="text-label-sm text-eten-accent font-mono tracking-widest uppercase">
          Mentorship
        </p>
        <h1 className="font-display text-headline-md text-eten-ink mt-1 font-bold">
          Your Circles
        </h1>
        <p className="text-eten-ink-muted mt-2 text-sm">
          Mentorship Circles you&apos;re part of, as a mentee or a mentor.
        </p>
      </header>

      {circles.length === 0 ? (
        <div className="bg-eten-panel border-eten-line text-eten-ink-muted flex flex-col items-center gap-3 rounded-2xl border p-12 text-center">
          <GraduationCap className="text-eten-ink-muted/40 size-9" />
          <p className="text-sm">
            You&apos;re not in a Mentorship Circle yet. Pod Leaders assemble
            Circles from their pod — once you&apos;re added, it appears here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {circles.map((c) => (
            <li key={`${c.role}-${c.id}`}>
              <Link
                href={`/circles/${c.id}`}
                className="bg-eten-panel border-eten-line hover:border-eten-accent/50 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5 transition-colors"
              >
                <span className="min-w-0">
                  <span className="text-eten-ink block font-semibold">
                    {c.title ?? `${c.podName} Circle`}
                  </span>
                  <span className="text-eten-faint text-xs">
                    {c.podName}
                    {c.role === "Mentee" ? ` · Mentor: ${c.mentorName}` : ""}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="bg-eten-accent-soft text-eten-accent rounded-full px-2 py-0.5 text-[11px] font-semibold">
                    {c.role}
                  </span>
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-xs font-semibold capitalize " +
                      (STATUS_STYLE[c.status] ??
                        "bg-eten-panel-hi text-eten-faint")
                    }
                  >
                    {c.status}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
