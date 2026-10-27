import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { summarizeRatings } from "@/lib/eten/ratings";
import { MentorsBrowser, type MentorCard } from "./mentors-browser";

export const metadata = { title: "Find a mentor" };

const TIER_LABEL: Record<string, string> = {
  verified: "Verified Mentor",
  senior: "Senior Mentor",
  expert: "Expert Mentor",
  master: "Master Mentor",
};

export default async function MentorsPage() {
  const me = await getCurrentMember();
  if (!me) redirect("/mentorship/signin");

  const admin = getSupabaseAdmin();

  const [
    { data: meRow },
    { data: mentorRows },
    { data: areaRows },
    { data: reqRows },
  ] = await Promise.all([
    admin.from("members").select("validated_at").eq("id", me.id).maybeSingle(),
    admin
      .from("mentor_profiles")
      .select("member_id, mentor_status, capability_area_id, verified_at")
      .neq("mentor_status", "candidate")
      .neq("member_id", me.id),
    admin
      .from("capability_areas")
      .select("id, slug, label")
      .eq("active", true)
      .order("sort_order"),
    admin
      .from("mentorship_requests")
      .select("mentor_id, status, created_at")
      .eq("mentee_id", me.id)
      .order("created_at", { ascending: false }),
  ]);

  const isValidated = Boolean(meRow?.validated_at);
  const areas = areaRows ?? [];
  const areaById = new Map(areas.map((a) => [a.id, a.label]));
  const mentors = mentorRows ?? [];

  const { data: profileRows } = mentors.length
    ? await admin
        .from("profiles")
        .select("member_id, full_name, headline")
        .in(
          "member_id",
          mentors.map((m) => m.member_id),
        )
    : { data: [] };
  const profileById = new Map(
    (profileRows ?? []).map((p) => [
      p.member_id,
      {
        name: p.full_name ?? "A mentor",
        headline: p.headline as string | null,
      },
    ]),
  );

  const { data: ratingRows } = mentors.length
    ? await admin
        .from("mentor_ratings")
        .select("mentor_id, rating")
        .in(
          "mentor_id",
          mentors.map((m) => m.member_id),
        )
    : { data: [] };
  const ratingsByMentor = new Map<string, number[]>();
  for (const r of ratingRows ?? []) {
    const arr = ratingsByMentor.get(r.mentor_id) ?? [];
    arr.push(r.rating);
    ratingsByMentor.set(r.mentor_id, arr);
  }

  const reqByMentor = new Map<string, "pending" | "accepted" | "declined">();
  for (const r of reqRows ?? []) {
    if (!reqByMentor.has(r.mentor_id) && r.status !== "withdrawn") {
      reqByMentor.set(
        r.mentor_id,
        r.status as "pending" | "accepted" | "declined",
      );
    }
  }

  const cards: MentorCard[] = mentors.map((m) => {
    const p = profileById.get(m.member_id);
    const rs = summarizeRatings(
      (ratingsByMentor.get(m.member_id) ?? []).map((rating) => ({ rating })),
    );
    return {
      id: m.member_id,
      name: p?.name ?? "A mentor",
      headline: p?.headline ?? null,
      tier: TIER_LABEL[m.mentor_status] ?? "Verified Mentor",
      areaLabel: m.capability_area_id
        ? (areaById.get(m.capability_area_id) ?? "Mentorship")
        : "Mentorship",
      ratingAvg: rs.count > 0 ? rs.avg : 0,
      ratingCount: rs.count,
      reqStatus: reqByMentor.get(m.member_id) ?? null,
    };
  });

  return (
    <div className="px-6 py-8 md:px-9">
      <div className="mx-auto flex max-w-[1220px] flex-col gap-5">
        <header className="max-w-[640px]">
          <span className="text-mnt-brand text-[12px] font-bold tracking-[0.12em] uppercase">
            Mentorship
          </span>
          <h1 className="font-display text-mnt-ink mt-1 text-[30px] font-extrabold tracking-[-0.02em]">
            Find a mentor
          </h1>
          <p className="text-mnt-ink-muted mt-1.5 text-[15px] leading-relaxed">
            Every mentor here is verified by the ETEN Readiness Panel. Request
            mentorship, or book a single session.
          </p>
        </header>

        {!isValidated && (
          <div className="border-mnt-amber/30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 [background:rgba(245,177,61,0.06)]">
            <p className="text-mnt-ink-muted text-[13.5px]">
              Validate your account to request mentorship.
            </p>
            <Link
              href="/mentorship/validate"
              className="bg-mnt-amber rounded-[10px] px-4 py-2 text-[13px] font-bold text-[#241a05]"
            >
              Validate now
            </Link>
          </div>
        )}

        {mentors.length === 0 ? (
          <div className="border-mnt-line text-mnt-ink-muted rounded-[18px] border border-dashed p-10 text-center text-[14px]">
            No verified mentors yet.
          </div>
        ) : (
          <MentorsBrowser mentors={cards} isValidated={isValidated} />
        )}
      </div>
    </div>
  );
}
