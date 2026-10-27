import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Activity, CheckCircle2, CircleDot, GraduationCap } from "lucide-react";
import { getCurrentMember } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { CirclesBrowser, type CircleCard } from "./circles-browser";

export const metadata: Metadata = {
  title: "Mentorship",
  robots: { index: false, follow: false },
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

  const activeCount = circles.filter((c) => c.status === "active").length;
  const completedCount = circles.filter((c) => c.status === "completed").length;
  const mentorCount = circles.filter((c) => c.role === "Mentor").length;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-8 md:px-8 md:py-9">
      <div className="flex flex-col gap-[22px]">
        <header className="max-w-[640px]">
          <span className="text-eten-accent text-[12px] font-bold tracking-[0.12em] uppercase">
            Mentorship
          </span>
          <h1 className="text-eten-ink mt-1 text-[30px] font-extrabold tracking-[-0.02em]">
            Your Circles
          </h1>
          <p className="text-eten-ink-muted mt-1.5 text-[15px]">
            Mentorship Circles you&apos;re part of, as a mentee or a mentor.
          </p>
        </header>

        {circles.length === 0 ? (
          <div className="bg-eten-panel border-eten-line text-eten-ink-muted flex flex-col items-center gap-3 rounded-[18px] border p-12 text-center">
            <span className="bg-eten-accent-soft text-eten-accent grid size-13 place-items-center rounded-2xl">
              <GraduationCap className="size-6" />
            </span>
            <p className="text-sm">
              You&apos;re not in a Mentorship Circle yet. Pod Leaders assemble
              Circles from their pod. Once you&apos;re added, it appears here.
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))] gap-3">
              <Stat
                Icon={CircleDot}
                tone="accent"
                value={circles.length}
                label="Circles"
              />
              <Stat
                Icon={Activity}
                tone="verified"
                value={activeCount}
                label="Active"
              />
              <Stat
                Icon={CheckCircle2}
                tone="neutral"
                value={completedCount}
                label="Completed"
              />
              <Stat
                Icon={GraduationCap}
                tone="amber"
                value={mentorCount}
                label="As mentor"
              />
            </div>

            <CirclesBrowser circles={circles} />
          </>
        )}
      </div>
    </div>
  );
}

function Stat({
  Icon,
  tone,
  value,
  label,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: "accent" | "verified" | "neutral" | "amber";
  value: number;
  label: string;
}) {
  const square =
    tone === "verified"
      ? "bg-eten-verified-soft text-eten-verified"
      : tone === "amber"
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : tone === "neutral"
          ? "bg-eten-panel-hi text-eten-ink-muted"
          : "bg-eten-accent-soft text-eten-accent";
  return (
    <div className="bg-eten-panel border-eten-line flex items-center gap-3.5 rounded-[16px] border p-4">
      <span
        className={
          "grid size-11 shrink-0 place-items-center rounded-xl " + square
        }
      >
        <Icon className="size-5" strokeWidth={2} />
      </span>
      <div>
        <div className="text-eten-ink text-[24px] font-extrabold tabular-nums">
          {value}
        </div>
        <div className="text-eten-ink-muted text-[13px]">{label}</div>
      </div>
    </div>
  );
}
